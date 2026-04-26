/* ============================================
   TEEN MINAR - Main Application JavaScript
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

  // ---- Create Result Balls HTML ----
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

    renderTodayResult();
    renderMonthResults();
    renderQuickYears(m.years);
  }

  function updateStats(m) {
    const statsEl = document.getElementById('hero-stats');
    if (!statsEl || !m) return;

    const yearsCount = m.years ? m.years.length : 0;
    statsEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-number">${yearsCount}</div>
        <div class="stat-label">Years Data</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">Daily</div>
        <div class="stat-label">Updates</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">10 PM</div>
        <div class="stat-label">Result Time</div>
      </div>
    `;
  }

  function renderTodayResult() {
    const container = document.getElementById('today-result-container');
    if (!container || !currentYearData) return;

    const todayStr = getTodayString();
    const todayResult = currentYearData.results.find(r => r.date === todayStr);

    if (todayResult) {
      container.innerHTML = `
        <div class="result-card-today">
          <div class="date-label">Today's Result</div>
          <div class="date-value">${formatDate(todayResult.date)} • ${getDayName(todayResult.date)}</div>
          <div class="result-numbers">
            ${createBallsHTML(todayResult.numbers)}
          </div>
        </div>
      `;
    } else {
      // Check if result time hasn't passed yet
      const now = new Date();
      const hour = now.getHours();
      let message = '';
      if (hour < 22) {
        message = `Today's result will be announced at <strong>10:00 PM</strong>. Stay tuned!`;
      } else {
        message = `Today's result is being updated. Please refresh in a few minutes. `;
      }
      container.innerHTML = `
        <div class="result-card-today">
          <div class="date-label">Awaiting Result</div>
          <div class="date-value">${formatDate(todayStr)}</div>
          <div class="no-result-msg">${message}</div>
        </div>
      `;
    }
  }

  function renderMonthResults() {
    const container = document.getElementById('month-results-container');
    if (!container || !currentYearData) return;

    // Filter results for current month
    const monthResults = currentYearData.results.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // Month header
    const monthName = MONTHS[selectedMonth];

    if (monthResults.length === 0) {
      container.innerHTML = `
        <div class="section-header">
          <h2>${monthName} ${selectedYear} Results</h2>
          <p>No results available for this month yet.</p>
        </div>
      `;
      return;
    }

    // Sort by date descending (latest first)
    monthResults.sort((a, b) => new Date(b.date) - new Date(a.date));

    let tableHTML = `
      <div class="section-header">
        <h2>${monthName} ${selectedYear} Results</h2>
        <p>Showing all results for the current month</p>
      </div>
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Result Numbers</th>
            </tr>
          </thead>
          <tbody>
    `;

    monthResults.forEach(r => {
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
          <div class="icon"></div>
          <p>No results for this period.</p>
        </div>
      `;
      return;
    }

    // Sort descending
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    const title = selectedMonth === -1
      ? `All Results - ${selectedYear}`
      : `${MONTHS[selectedMonth]} ${selectedYear} Results`;

    let html = `
      <div class="section-header">
        <h2>${title}</h2>
        <p>${results.length} results found</p>
      </div>
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Result Numbers</th>
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
          <p>Loading results...</p>
        </div>
      `;
    }
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="icon"></div>
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
