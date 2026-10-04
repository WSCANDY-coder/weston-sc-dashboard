#!/usr/bin/env python3
"""
Automated Swim England PB Scraper for Weston-super-Mare SC Dashboard
Target Site: SwimmingResults.org (Swim England Individual Best Times)
Author: Antigravity Team
"""

import os
import sys
import json
import csv
import re
import datetime
import urllib.request
import ssl
from html.parser import HTMLParser

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. SETUP PATHS
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROSTER_PATH = os.path.join(BASE_DIR, 'scripts', 'roster.json')
PRIMARY_RAW_JS = os.path.join(BASE_DIR, 'weston-sc-swimmers', 'raw_data.js')
SRC_RAW_JS = os.path.join(BASE_DIR, 'src', 'raw_data.js')
V1_RAW_JS = os.path.join(BASE_DIR, 'V1 code base', 'raw_data.js')
CSV_BACKUP = os.path.join(BASE_DIR, 'data', 'raw_data.csv')

# SSL context for HTTPS requests
SSL_CTX = ssl._create_unverified_context()

# Standard User-Agent header to avoid 403 blocks
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
}

# 2. HTML TABLE PARSER
class SEBestTableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_tr = False
        self.in_cell = False
        self.current_cell = ''
        self.current_row = []
        self.tables = []
        
    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
            self.tables.append([])
        elif tag == 'tr' and self.in_table:
            self.in_tr = True
            self.current_row = []
        elif tag in ('td', 'th') and self.in_tr:
            self.in_cell = True
            self.current_cell = ''

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.in_cell:
            self.in_cell = False
            self.current_row.append(self.current_cell.strip())
        elif tag == 'tr' and self.in_tr:
            self.in_tr = False
            if self.current_row:
                self.tables[-1].append(self.current_row)
        elif tag == 'table' and self.in_table:
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell += data

# 3. HELPER UTILITIES
def parse_date(date_str):
    if not date_str:
        return ''
    parts = date_str.strip().split('/')
    if len(parts) == 3:
        day, month, year = parts
        day = day.zfill(2)
        month = month.zfill(2)
        if len(year) == 2:
            year = '20' + year if int(year) < 70 else '19' + year
        return f'{year}-{month}-{day}'
    return date_str

def parse_time(time_str):
    if not time_str or time_str.strip() == '-' or time_str.strip() == '':
        return '-', None
    clean = time_str.strip()
    parts = clean.split(':')
    try:
        if len(parts) == 1:
            sec = float(parts[0])
            mins = int(sec // 60)
            rem_sec = sec % 60
            disp = f'{mins:02d}:{rem_sec:05.2f}'
            return disp, round(sec, 2)
        elif len(parts) == 2:
            mins = int(parts[0])
            sec = float(parts[1])
            tot = mins * 60 + sec
            disp = f'{mins:02d}:{sec:05.2f}'
            return disp, round(tot, 2)
        elif len(parts) == 3:
            hrs = int(parts[0])
            mins = int(parts[1])
            sec = float(parts[2])
            tot = hrs * 3600 + mins * 60 + sec
            disp = f'{hrs:02d}:{mins:02d}:{sec:05.2f}'
            return disp, round(tot, 2)
    except ValueError:
        pass
    return clean, None

def load_roster():
    """Load swimmer roster (SE number -> Name mapping)."""
    swimmers = {}
    
    # 1. Try reading scripts/roster.json if available
    if os.path.exists(ROSTER_PATH):
        try:
            with open(ROSTER_PATH, 'r', encoding='utf-8') as f:
                roster_data = json.load(f)
                for item in roster_data:
                    se = item.get('seNumber')
                    name = item.get('swimmerName')
                    if se and name:
                        swimmers[int(se)] = name
            if swimmers:
                print(f"Loaded {len(swimmers)} swimmers from roster.json")
                return swimmers
        except Exception as e:
            print(f"Warning loading roster.json: {e}")

    # 2. Extract from existing raw_data.js
    for js_path in [PRIMARY_RAW_JS, SRC_RAW_JS]:
        if os.path.exists(js_path):
            try:
                with open(js_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                match = re.search(r'const\s+RAW_DATA\s*=\s*(\[[\s\S]*\]);', content)
                if match:
                    records = json.loads(match.group(1))
                    for r in records:
                        se = r.get('seNumber')
                        name = r.get('swimmerName')
                        if se and name:
                            swimmers[int(se)] = name.strip()
                if swimmers:
                    print(f"Extracted {len(swimmers)} swimmers from {os.path.basename(js_path)}")
                    # Save roster for future reference
                    save_roster(swimmers)
                    return swimmers
            except Exception as e:
                print(f"Warning reading {js_path}: {e}")

    return swimmers

def save_roster(swimmers):
    """Save roster to scripts/roster.json."""
    os.makedirs(os.path.dirname(ROSTER_PATH), exist_ok=True)
    roster_list = [{'seNumber': se, 'swimmerName': name} for se, name in sorted(swimmers.items(), key=lambda x: x[1])]
    with open(ROSTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(roster_list, f, indent=2)

def fetch_swimmer_pbs(se_number, default_name, batch_id, today_iso):
    """Fetch and parse Swim England PBs for a single swimmer."""
    url = f'https://www.swimmingresults.org/individualbest/personal_best.php?mode=A&tiref={se_number}'
    req = urllib.request.Request(url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  ❌ Error fetching SE #{se_number}: {e}")
        return []

    # Extract official swimmer name from page HTML if available
    name_match = re.search(r'<p\s+class=["\']rnk_sj["\']>\s*([^<\-(]+)', html, re.IGNORECASE)
    swimmer_name = name_match.group(1).strip() if name_match else default_name

    parser = SEBestTableParser()
    parser.feed(html)
    
    records = []
    
    for table in parser.tables:
        if not table or len(table) < 2:
            continue
        
        header = [h.lower() for h in table[0]]
        if 'stroke' not in header:
            continue
        
        # Determine course (LC vs SC) from table headers
        is_lc = any('lc time' in h for h in header)
        course = 'LC' if is_lc else 'SC'
        
        stroke_idx = header.index('stroke')
        time_idx = 1
        conv_idx = 2
        pts_idx = 3
        date_idx = 4
        meet_idx = 5
        venue_idx = 6
        lic_idx = 7
        lvl_idx = 8
        
        for row in table[1:]:
            if len(row) <= stroke_idx:
                continue
                
            event_name = row[stroke_idx].strip()
            if not event_name or event_name.lower() == 'stroke':
                continue
                
            raw_time = row[time_idx].strip() if len(row) > time_idx else ''
            raw_conv = row[conv_idx].strip() if len(row) > conv_idx else ''
            raw_pts = row[pts_idx].strip() if len(row) > pts_idx else ''
            raw_date = row[date_idx].strip() if len(row) > date_idx else ''
            meet_name = row[meet_idx].strip() if len(row) > meet_idx else ''
            venue = row[venue_idx].strip() if len(row) > venue_idx else ''
            licence = row[lic_idx].strip() if len(row) > lic_idx else ''
            level_str = row[lvl_idx].strip() if len(row) > lvl_idx else ''
            
            disp_time, time_sec = parse_time(raw_time)
            disp_conv, _ = parse_time(raw_conv)
            iso_date = parse_date(raw_date)
            
            clean_event = event_name.replace(' ', '')
            record_key = f'{se_number}_{clean_event}_{course}_{iso_date}'
            
            wa_pts = int(raw_pts) if raw_pts.isdigit() else None
            lvl = int(level_str) if level_str.isdigit() else None
            
            record = {
                'recordKey': record_key,
                'seNumber': int(se_number),
                'swimmerName': swimmer_name,
                'event': event_name,
                'course': course,
                'displayTime': disp_time,
                'timeSec': time_sec,
                'convertedTime': disp_conv,
                'waPoints': wa_pts,
                'date': iso_date,
                'meetName': meet_name,
                'venue': venue,
                'licence': licence,
                'level': lvl,
                'importVersion': '5.0.0-python',
                'batchId': batch_id,
                'importedAt': today_iso,
                'calculatedCourse': course
            }
            records.append(record)
            
    return records

def run_scraper():
    print("========================================================")
    print("🏊 WESTON SC DASHBOARD - SWIM ENGLAND PB DATA SCRAPER")
    print("========================================================")
    
    roster = load_roster()
    if not roster:
        print("❌ Error: No swimmer roster found. Please populate scripts/roster.json.")
        sys.exit(1)

    now = datetime.datetime.now()
    today_iso = now.strftime('%Y-%m-%d')
    batch_id = f"BATCH-{now.strftime('%Y%m%d-%H%M%S')}"

    print(f"Starting scrape for {len(roster)} swimmers...")
    
    all_records = []
    success_count = 0

    for idx, (se_num, name) in enumerate(roster.items(), start=1):
        print(f"[{idx}/{len(roster)}] Fetching SE #{se_num} ({name})...", end='', flush=True)
        recs = fetch_swimmer_pbs(se_num, name, batch_id, today_iso)
        if recs:
            all_records.extend(recs)
            success_count += 1
            print(f" ✅ ({len(recs)} PBs found)")
        else:
            print(" ⚠️ (0 records)")

    print("--------------------------------------------------------")
    print(f"Scrape Complete! Harvested {len(all_records)} total PBs across {success_count} swimmers.")
    print("--------------------------------------------------------")

    if not all_records:
        print("❌ CRITICAL ERROR: 0 records harvested! Aborting write to prevent data corruption.")
        sys.exit(1)

    # Sort records cleanly by swimmerName, event, course, date
    all_records.sort(key=lambda r: (r['swimmerName'], r['event'], r['course'], r['date']))

    # Write JS schema to primary targets
    js_content = f"// js/raw_data.js\n// Auto-generated by Swim England Scraper on {today_iso}\nconst RAW_DATA = " + json.dumps(all_records, indent=2) + ";\n"
    
    targets = [PRIMARY_RAW_JS, SRC_RAW_JS, V1_RAW_JS]
    for target in targets:
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, 'w', encoding='utf-8') as f:
                f.write(js_content)
            print(f"💾 Updated: {os.path.relpath(target, BASE_DIR)}")
        except Exception as e:
            print(f"⚠️ Warning writing to {target}: {e}")

    # Write CSV backup
    try:
        os.makedirs(os.path.dirname(CSV_BACKUP), exist_ok=True)
        fields = ['recordKey', 'seNumber', 'swimmerName', 'event', 'course', 'displayTime', 'timeSec', 'convertedTime', 'waPoints', 'date', 'meetName', 'venue', 'licence', 'level', 'importVersion', 'batchId', 'importedAt', 'calculatedCourse']
        with open(CSV_BACKUP, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(all_records)
        print(f"📊 CSV Backup saved: {os.path.relpath(CSV_BACKUP, BASE_DIR)}")
    except Exception as e:
        print(f"⚠️ Warning saving CSV backup: {e}")

    print("========================================================")
    print("✅ DATA PIPELINE REFRESH COMPLETED SUCCESSFULLY!")
    print("========================================================")
    return len(all_records)

if __name__ == '__main__':
    run_scraper()
