#!/usr/bin/env python3
"""
Teen Minar - Google Sheet to JSON Converter
============================================
Fetches data from a public Google Sheet and creates per-year JSON files.
The sheet must have year-named tabs (2018, 2019, ...) with columns:
  A = date, B = result (comma-separated numbers)

Usage:
  python fetch_data.py

Environment Variables:
  SHEET_ID - Google Sheet ID (required)
  OUTPUT_DIR - Output directory for JSON files (default: ./data)
"""

import csv
import json
import os
import sys
import io
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# ---- Configuration ----
SHEET_ID = os.environ.get('SHEET_ID', '1Y1BJ-5mAGWhV_-cpCz6fo-JYO9mQBMxmBAGAhXM3Tec')
OUTPUT_DIR = os.environ.get('OUTPUT_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data'))

# Year range to check (auto-discovers available tabs)
START_YEAR = 2018
END_YEAR = datetime.now().year  # Only check up to current year

DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']


def get_sheet_csv_url(sheet_id, tab_name):
    """Build the public CSV export URL for a specific tab."""
    return f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={tab_name}'


def fetch_csv(url):
    """Fetch CSV content from URL."""
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urlopen(req, timeout=30)
        content = response.read().decode('utf-8')
        return content
    except HTTPError as e:
        if e.code == 400:
            return None  # Tab doesn't exist
        print(f"  HTTP Error {e.code}: {e.reason}")
        return None
    except URLError as e:
        print(f"  URL Error: {e.reason}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None


def parse_date(date_str):
    """Parse various date formats into YYYY-MM-DD."""
    date_str = date_str.strip()
    
    # Try various formats
    formats = [
        '%d-%b-%Y',     # 1-Jan-2026
        '%d-%B-%Y',     # 1-January-2026
        '%d %b %Y',     # 1 Jan 2026
        '%d %B %Y',     # 1 January 2026
        '%Y-%m-%d',     # 2026-01-01
        '%d/%m/%Y',     # 01/01/2026
        '%m/%d/%Y',     # 01/01/2026
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d'), dt
        except ValueError:
            continue
    
    return None, None


def parse_numbers(result_str):
    """Parse comma-separated numbers from result string."""
    result_str = result_str.strip()
    if not result_str:
        return []
    
    numbers = []
    for part in result_str.replace(';', ',').split(','):
        part = part.strip()
        if part:
            try:
                numbers.append(int(float(part)))
            except ValueError:
                continue
    return numbers


def process_year(sheet_id, year):
    """Fetch and process data for a specific year tab."""
    print(f"  Fetching {year}...")
    
    url = get_sheet_csv_url(sheet_id, str(year))
    csv_content = fetch_csv(url)
    
    if csv_content is None:
        print(f"  ⚠ Tab '{year}' not found, skipping.")
        return None
    
    # Parse CSV
    reader = csv.reader(io.StringIO(csv_content))
    results = []
    
    header_skipped = False
    for row in reader:
        if len(row) < 2:
            continue
        
        # Skip header row
        if not header_skipped:
            if row[0].lower().strip() in ['date', 'dates', 'तारीख', 'दिनांक']:
                header_skipped = True
                continue
            # If first cell looks like a date, don't skip
            date_str, _ = parse_date(row[0])
            if date_str is None:
                header_skipped = True
                continue
            header_skipped = True
        
        date_str, dt = parse_date(row[0])
        if date_str is None:
            continue
        
        numbers = parse_numbers(row[1])
        if not numbers:
            continue
        
        day = DAYS[dt.weekday()]
        results.append({
            'date': date_str,
            'day': day,
            'numbers': numbers
        })
    
    if not results:
        print(f"  ⚠ No valid data in tab '{year}'.")
        return None
    
    # Validate: check that dates actually belong to this year
    # (Google Sheets returns last tab's data for non-existent tabs)
    matching = sum(1 for r in results if r['date'].startswith(str(year)))
    if matching == 0:
        print(f"  ⚠ Tab '{year}' returned data but no dates match year {year}. Skipping (tab likely doesn't exist).")
        return None
    
    # Filter only dates belonging to this year
    results = [r for r in results if r['date'].startswith(str(year))]
    
    # Sort by date
    results.sort(key=lambda r: r['date'])
    
    print(f"  ✓ Found {len(results)} results for {year}")
    
    return {
        'year': year,
        'results': results
    }


def main():
    print("=" * 50)
    print("Teen Minar - Sheet to JSON Converter")
    print("=" * 50)
    print(f"Sheet ID: {SHEET_ID}")
    print(f"Output:   {OUTPUT_DIR}")
    print()
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    available_years = []
    
    for year in range(START_YEAR, END_YEAR + 1):
        data = process_year(SHEET_ID, year)
        if data is not None:
            # Write year JSON
            filepath = os.path.join(OUTPUT_DIR, f'{year}.json')
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
            available_years.append(year)
            print(f"  → Saved {filepath}")
    
    if not available_years:
        print("\n⚠ No data found! Check your SHEET_ID and make sure the sheet is public.")
        sys.exit(1)
    
    # Write manifest
    manifest = {
        'years': available_years,
        'lastUpdated': datetime.now().strftime('%Y-%m-%dT%H:%M:%S+05:30')
    }
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Manifest saved: {manifest_path}")
    print(f"✓ Available years: {available_years}")
    print(f"✓ Total years: {len(available_years)}")
    print("\nDone! 🎉")


if __name__ == '__main__':
    main()
