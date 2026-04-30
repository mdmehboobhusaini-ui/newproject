/* ============================================
   TEEN MINAR - Main Application JavaScript
   teenminar.com / teenminar.in
   ============================================ */

(function () {
  'use strict';

  // ---- Configuration ----
  const DATA_BASE_URL = './data'; // relative - served from same domain
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---- State ----
  let manifest = null;
  let currentYearData = null;
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth(); // 0-indexed

  // ---- DOM Ready ----
  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    setActiveNavLink();
    
    // Set dynamic copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    const page = document.body.dataset.page;
    if (page === 'home') {
      initHomePage();
    } else if (page === 'results') {
      initResultsPage();
    }
  });

  // ---- Mobile Navigation ----
  function initMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.nav-overlay');

    if (!hamburger) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      overlay.classList.toggle('show');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      });
    }

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- Set Active Nav Link ----
  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  // ---- Fetch Manifest ----
  async function fetchManifest() {
    try {
      const res = await fetch(`${DATA_BASE_URL}/manifest.json?t=${Date.now()}`);
      if (!res.ok) throw new Error('Manifest not found');
      manifest = await res.json();
      return manifest;
    } catch (e) {
      console.error('Error loading manifest:', e);
      return null;
    }
  }

  // ---- Fetch Year Data ----
  async function fetchYearData(year) {
    try {
      const res = await fetch(`${DATA_BASE_URL}/${year}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`Data for ${year} not found`);
      return await res.json();
    } catch (e) {
      console.error(`Error loading ${year} data:`, e);
      return null;
    }
  }

  // ---- Format Date ----
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  function getDayName(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return DAYS[d.getDay()];
  }

  function isToday(dateStr) {
    const today = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }

  // ---- Create Number Balls HTML ----
  function createBallsHTML(numbers, mini = false) {
    const cls = mini ? 'mini-ball' : 'result-ball';
    return numbers.map(n => `<span class="${cls}">${n}</span>`).join('');
  }

  // ---- HOME PAGE ----
  async function initHomePage() {
    showLoading('today-result-container');
    showLoading('month-results-container');

    const m = await fetchManifest();
    if (!m) {
      showError('today-result-container', 'Data not available yet. Please check back later.');
      return;
    }

    // Update stats
    updateStats(m);

    // Load current year
    const now = new Date();
    selectedYear = now.getFullYear();
    selectedMonth = now.getMonth();

    currentYearData = await fetchYearData(selectedYear);
    if (!currentYearData) {
      showError('today-result-container', 'No data available for current year.');
      return;
    }

    renderLatestNumbers();
    renderMonthNumbers();
    renderQuickYears(m.years);
  }

  function updateStats(m) {
    const statsEl = document.getElementById('hero-stats');
    if (!statsEl || !m) return;

    const yearsCount = m.years ? m.years.length : 0;
    statsEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-number">${yearsCount}</div>
        <div class="stat-label">Years Archived</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">7</div>
        <div class="stat-label">Daily Numbers</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">Free</div>
        <div class="stat-label">Always</div>
      </div>
    `;
  }

  // Show the LATEST available numbers (today's if available, otherwise the most recent)
  function renderLatestNumbers() {
    const container = document.getElementById('today-result-container');
    if (!container || !currentYearData) return;

    const todayStr = getTodayString();
    const todayResult = currentYearData.results.find(r => r.date === todayStr);

    if (todayResult) {
      // Today's numbers are available
      container.innerHTML = `
        <div class="result-card-today">
          <div class="date-label">Today's Numbers</div>
          <div class="date-value">${formatDate(todayResult.date)} - ${getDayName(todayResult.date)}</div>
          <div class="result-numbers">
            ${createBallsHTML(todayResult.numbers)}
          </div>
        </div>
      `;
    } else {
      // Today's numbers not yet published — show the LATEST available numbers
      const sorted = [...currentYearData.results].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (sorted.length > 0) {
        const latest = sorted[0];
        container.innerHTML = `
          <div class="result-card-today">
            <div class="date-label">Latest Numbers</div>
            <div class="date-value">${formatDate(latest.date)} - ${getDayName(latest.date)}</div>
            <div class="result-numbers">
              ${createBallsHTML(latest.numbers)}
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="result-card-today">
            <div class="no-result-msg">No numbers published yet for this year. Please check back later.</div>
          </div>
        `;
      }
    }
  }

  function renderMonthNumbers() {
    const container = document.getElementById('month-results-container');
    if (!container || !currentYearData) return;

    // Filter numbers for current month
    const monthNumbers = currentYearData.results.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Month header
    const monthName = MONTHS[selectedMonth];

    // Check if today is missing — add "Upcoming" row
    const todayStr = getTodayString();
    const todayExists = monthNumbers.some(r => r.date === todayStr);
    const todayInMonth = new Date().getMonth() === selectedMonth && new Date().getFullYear() === selectedYear;

    if (monthNumbers.length === 0 && !todayInMonth) {
      container.innerHTML = `
        <div class="section-header">
          <h2>${monthName} ${selectedYear} - Teen Minar Numbers</h2>
          <p>No numbers published for this month yet.</p>
        </div>
      `;
      return;
    }

    // Sort by date descending (latest first)
    monthNumbers.sort((a, b) => new Date(b.date) - new Date(a.date));

    let tableHTML = `
      <div class="section-header">
        <h2>${monthName} ${selectedYear} - Teen Minar Numbers</h2>
        <p>Daily random numbers published this month</p>
      </div>
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="day-col">Day</th>
              <th>Numbers</th>
            </tr>
          </thead>
          <tbody>
    `;

    // If today's numbers are not yet published AND today is in this month, show "Upcoming" row at top
    if (todayInMonth && !todayExists) {
      tableHTML += `
        <tr style="opacity: 0.5;">
          <td class="date-col">${formatDate(todayStr)}</td>
          <td class="day-col">${getDayName(todayStr)}</td>
          <td><em>Upcoming (10 PM - 10 AM)</em></td>
        </tr>
      `;
    }

    monthNumbers.forEach(r => {
      const todayClass = isToday(r.date) ? 'today-row' : '';
      tableHTML += `
        <tr class="${todayClass}">
          <td class="date-col">${formatDate(r.date)}</td>
          <td class="day-col">${getDayName(r.date)}</td>
          <td><div class="numbers-col">${createBallsHTML(r.numbers, true)}</div></td>
        </tr>
      `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
  }

  function renderQuickYears(years) {
    const container = document.getElementById('quick-years');
    if (!container || !years) return;

    container.innerHTML = years.map(y => `
      <a href="results.html?year=${y}" class="quick-year-btn ${y === selectedYear ? 'active' : ''}">${y}</a>
    `).join('');
  }

  // ---- RESULTS PAGE ----
  async function initResultsPage() {
    showLoading('results-table-container');

    const m = await fetchManifest();
    if (!m) {
      showError('results-content', 'Data not available. Please try again later.');
      return;
    }

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    if (params.has('year')) {
      selectedYear = parseInt(params.get('year'));
    }
    if (params.has('month')) {
      selectedMonth = parseInt(params.get('month'));
    }

    renderYearSelector(m.years);
    await loadAndRenderYear();
  }

  function renderYearSelector(years) {
    const container = document.getElementById('year-selector');
    if (!container) return;

    container.innerHTML = `
      <div class="selector-group">
        <span class="selector-label">Year:</span>
        ${years.map(y => `
          <button class="selector-btn ${y === selectedYear ? 'active' : ''}" 
                  data-year="${y}" onclick="TeenMinar.selectYear(${y})">${y}</button>
        `).join('')}
      </div>
    `;
  }

  function renderMonthSelector(availableMonths) {
    const container = document.getElementById('month-selector');
    if (!container) return;

    container.innerHTML = `
      <div class="month-tabs">
        <button class="month-tab ${selectedMonth === -1 ? 'active' : ''}" 
                onclick="TeenMinar.selectMonth(-1)">All</button>
        ${availableMonths.map(m => `
          <button class="month-tab ${m === selectedMonth ? 'active' : ''}" 
                  onclick="TeenMinar.selectMonth(${m})">${MONTHS_SHORT[m]}</button>
        `).join('')}
      </div>
    `;
  }

  async function loadAndRenderYear() {
    showLoading('results-table-container');

    currentYearData = await fetchYearData(selectedYear);
    if (!currentYearData || !currentYearData.results || currentYearData.results.length === 0) {
      showError('results-table-container', `No data available for ${selectedYear}.`);
      document.getElementById('month-selector').innerHTML = '';
      return;
    }

    // Find available months
    const availableMonths = [...new Set(currentYearData.results.map(r => {
      return new Date(r.date + 'T00:00:00').getMonth();
    }))].sort((a, b) => a - b);

    // Auto-select last available month if current selection has no data
    if (selectedMonth !== -1 && !availableMonths.includes(selectedMonth)) {
      selectedMonth = availableMonths[availableMonths.length - 1];
    }

    renderMonthSelector(availableMonths);
    renderResultsTable();
  }

  function renderResultsTable() {
    const container = document.getElementById('results-table-container');
    if (!container || !currentYearData) return;

    let results = currentYearData.results;

    // Filter by month if not "All"
    if (selectedMonth !== -1) {
      results = results.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.getMonth() === selectedMonth;
      });
    }

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No numbers published for this period.</p>
        </div>
      `;
      return;
    }

    // Sort descending
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    const title = selectedMonth === -1
      ? `Teen Minar - ${selectedYear} Numbers`
      : `Teen Minar - ${MONTHS[selectedMonth]} ${selectedYear} Numbers`;

    let html = `
      <div class="section-header">
        <h2>${title}</h2>
        <p>${results.length} entries found</p>
      </div>
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="day-col">Day</th>
              <th>Numbers</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.forEach(r => {
      const todayClass = isToday(r.date) ? 'today-row' : '';
      html += `
        <tr class="${todayClass}">
          <td class="date-col">${formatDate(r.date)}</td>
          <td class="day-col">${getDayName(r.date)}</td>
          <td><div class="numbers-col">${createBallsHTML(r.numbers, true)}</div></td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // ---- Utility ----
  function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function showLoading(id) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading numbers...</p>
        </div>
      `;
    }
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div class="empty-state">
          <p>${msg}</p>
        </div>
      `;
    }
  }

  // ---- Public API (for onclick handlers) ----
  window.TeenMinar = {
    selectYear: function (year) {
      selectedYear = year;
      selectedMonth = -1; // reset to all
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('year', year);
      url.searchParams.delete('month');
      window.history.pushState({}, '', url);
      // Update UI
      document.querySelectorAll('[data-year]').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.year) === year);
      });
      loadAndRenderYear();
    },
    selectMonth: function (month) {
      selectedMonth = month;
      // Update UI
      document.querySelectorAll('.month-tab').forEach(btn => {
        const m = parseInt(btn.getAttribute('onclick').match(/-?\d+/)[0]);
        btn.classList.toggle('active', m === month);
      });
      renderResultsTable();
    }
  };

})();
