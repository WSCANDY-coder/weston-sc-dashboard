#!/usr/bin/env python3
"""
Build Qualifiers Standards & Swimmer Metadata
Parses:
- 2026 county Times .xlsx
- South West Regional Qualifying Times 2026.xlsx
- Weston SC Swimmers & Squad Roster
Outputs:
- weston-sc-swimmers/qualifiers_standards.js
"""

import os
import re
import json
import datetime
import openpyxl

current_dir = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(current_dir) if os.path.basename(current_dir) == 'scripts' else current_dir
COUNTY_XLSX = os.path.join(BASE_DIR, 'weston-sc-swimmers', '2026 county Times .xlsx')
REGIONAL_XLSX = os.path.join(BASE_DIR, 'weston-sc-swimmers', 'South West Regional Qualifying Times 2026.xlsx')
OUTPUT_JS = os.path.join(BASE_DIR, 'weston-sc-swimmers', 'qualifiers_standards.js')
SRC_OUTPUT_JS = os.path.join(BASE_DIR, 'src', 'qualifiers_standards.js')
ROOT_OUTPUT_JS = os.path.join(BASE_DIR, 'qualifiers_standards.js')

def parse_time_to_seconds(val):
    if val is None:
        return None
    if isinstance(val, (datetime.time, datetime.datetime)):
        return round(val.hour * 3600 + val.minute * 60 + val.second + val.microsecond / 1e6, 2)
    if isinstance(val, (int, float)):
        return round(float(val), 2)
    s = str(val).strip()
    if not s or s == '-' or s.lower() == 'none':
        return None
    parts = s.split(':')
    try:
        if len(parts) == 1:
            return round(float(parts[0]), 2)
        elif len(parts) == 2:
            return round(int(parts[0]) * 60 + float(parts[1]), 2)
        elif len(parts) == 3:
            return round(int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2]), 2)
    except ValueError:
        return None

def format_seconds_to_display(sec):
    if sec is None:
        return '-'
    mins = int(sec // 60)
    rem = sec % 60
    if mins > 0:
        return f"{mins:02d}:{rem:05.2f}"
    else:
        return f"{rem:05.2f}"

def main():
    print("Parsing County & Regional Excel files...")
    
    # 1. County Standards
    wb_county = openpyxl.load_workbook(COUNTY_XLSX)
    county_standards = {
        'Female': {},
        'Male/Open': {}
    }
    
    for sheetname, cat in [('Girls', 'Female'), ('Boys', 'Male/Open')]:
        sheet = wb_county[sheetname]
        rows = list(sheet.iter_rows(values_only=True))
        headers = rows[0]
        age_keys = []
        for h in headers[1:]:
            if isinstance(h, (int, float)):
                age_keys.append(str(int(h)))
            else:
                age_keys.append(str(h).strip())
                
        for row in rows[1:]:
            event_name = str(row[0]).strip()
            if not event_name or event_name.lower() == 'event':
                continue
            county_standards[cat][event_name] = {}
            for age_key, cell_val in zip(age_keys, row[1:]):
                sec = parse_time_to_seconds(cell_val)
                county_standards[cat][event_name][age_key] = {
                    'seconds': sec,
                    'display': format_seconds_to_display(sec) if sec is not None else None
                }

    # 2. Regional Standards
    wb_regional = openpyxl.load_workbook(REGIONAL_XLSX)
    sheet_reg = wb_regional['Qualifying Times']
    reg_rows = list(sheet_reg.iter_rows(values_only=True))
    
    evt_map = {
        '50 FC': '50 Freestyle', '100 FC': '100 Freestyle', '200 FC': '200 Freestyle',
        '400 FC': '400 Freestyle', '800 FC': '800 Freestyle', '1500 FC': '1500 Freestyle',
        '50 Back': '50 Backstroke', '100 Back': '100 Backstroke', '200 Back': '200 Backstroke',
        '50 Breast': '50 Breaststroke', '100 Breast': '100 Breaststroke', '200 Breast': '200 Breaststroke',
        '50 Fly': '50 Butterfly', '100 Fly': '100 Butterfly', '200 Fly': '200 Butterfly',
        '200 IM': '200 Individual Medley', '400 IM': '400 Individual Medley'
    }
    
    regional_standards = []
    for r in reg_rows[2:]:
        if not r or not r[0]:
            continue
        raw_evt, raw_age, raw_cat, raw_course, raw_cqt, raw_qt = r[:6]
        evt_norm = evt_map.get(str(raw_evt).strip(), str(raw_evt).strip())
        
        # normalize age
        if isinstance(raw_age, datetime.datetime) or str(raw_age).startswith('2026-12-11'):
            age_key = '11/12'
        elif isinstance(raw_age, (int, float)):
            age_key = str(int(raw_age))
        else:
            age_key = str(raw_age).strip()
            
        cat_norm = str(raw_cat).strip()
        course_norm = str(raw_course).strip().upper()
        
        cqt_sec = parse_time_to_seconds(raw_cqt)
        qt_sec = parse_time_to_seconds(raw_qt)
        
        regional_standards.append({
            'event': evt_norm,
            'ageGroup': age_key,
            'category': cat_norm,
            'course': course_norm,
            'cqtSec': cqt_sec,
            'cqtDisplay': format_seconds_to_display(cqt_sec) if cqt_sec is not None else None,
            'qtSec': qt_sec,
            'qtDisplay': format_seconds_to_display(qt_sec) if qt_sec is not None else None
        })

    # 3. Swimmer Profiles Metadata & Squads
    data_js_path = os.path.join(BASE_DIR, 'weston-sc-swimmers', 'data.js')
    swimmers_meta = {}
    squad_map = {}
    
    if os.path.exists(data_js_path):
        with open(data_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse Squad movements for squad allocations
        m_squad = re.search(r'\"Sept_Movements\":\s*(\[[\s\S]*?\])\s*,\s*\"Selection', content)
        if m_squad:
            try:
                squad_rows = json.loads(m_squad.group(1))
                for r in squad_rows:
                    for col, val in r.items():
                        v = str(val).strip() if val else ''
                        if v and not any(k in v.lower() for k in ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'am', 'pm', 'session', 'max number']):
                            clean_col = col.split('\n')[0].strip()
                            clean_col = re.sub(r'\s*\(Tues.*|\s*Tues.*', '', clean_col).strip()
                            squad_map[v.lower()] = clean_col
            except Exception as e:
                print(f"Error parsing squad movements: {e}")
                
        # Parse County Times, Devlop 26, BSG L2 for swimmer age and category
        for ds_name in ['County Times', 'Devlop 26', 'BSG L2']:
            pattern = rf'\"{ds_name}\":\s*(\[[\s\S]*?\])\s*,\s*\"'
            m = re.search(pattern, content)
            if m:
                try:
                    rows = json.loads(m.group(1))
                    for r in rows:
                        name = r.get('Swimmer Name', '').strip()
                        se = r.get('ASA Number')
                        gender = r.get('Gender', '').strip()
                        age = r.get('Age')
                        if name and name.lower() not in swimmers_meta:
                            cat = 'Female' if any(g in gender.lower() for g in ['girl', 'female']) else 'Male/Open'
                            swimmers_meta[name.lower()] = {
                                'swimmerName': name,
                                'seNumber': int(se) if se and str(se).isdigit() else None,
                                'category': cat,
                                'age': int(age) if age and str(age).isdigit() else None,
                                'squad': squad_map.get(name.lower(), 'Club Swimmer')
                            }
                except Exception as e:
                    print(f"Error parsing {ds_name}: {e}")

    # Add known missing swimmer: Cara Blackshaw (SE #1863417, YOB 2016 -> Age 11 as of 31/12/27, Female)
    swimmers_meta['cara blackshaw'] = {
        'swimmerName': 'Cara Blackshaw',
        'seNumber': 1863417,
        'category': 'Female',
        'age': 11,
        'squad': squad_map.get('cara blackshaw', 'Club Development')
    }

    # Ensure all swimmers have their squad attached
    for name_key, s_data in swimmers_meta.items():
        if not s_data.get('squad') or s_data.get('squad') == 'Club Swimmer':
            if name_key in squad_map:
                s_data['squad'] = squad_map[name_key]

    # 4. Write to JavaScript files
    js_content = f"""// WESTON SC - COUNTY & REGIONAL QUALIFIERS STANDARDS & DATA MODULE
// Generated: {datetime.datetime.now().isoformat()}

const COUNTY_STANDARDS = {json.dumps(county_standards, indent=2)};

const REGIONAL_STANDARDS = {json.dumps(regional_standards, indent=2)};

const SWIMMERS_METADATA = {json.dumps(swimmers_meta, indent=2)};

// Standardized Event Name Mapping
const EVENT_NAME_MAP = {{
    "50 FC": "50 Freestyle",
    "50 Free": "50 Freestyle",
    "50 Freestyle": "50 Freestyle",
    "100 FC": "100 Freestyle",
    "100 Free": "100 Freestyle",
    "100 Freestyle": "100 Freestyle",
    "200 FC": "200 Freestyle",
    "200 Free": "200 Freestyle",
    "200 Freestyle": "200 Freestyle",
    "400 FC": "400 Freestyle",
    "400 Free": "400 Freestyle",
    "400 Freestyle": "400 Freestyle",
    "800 FC": "800 Freestyle",
    "800 Free": "800 Freestyle",
    "800 Freestyle": "800 Freestyle",
    "1500 FC": "1500 Freestyle",
    "1500 Free": "1500 Freestyle",
    "1500 Freestyle": "1500 Freestyle",
    "50 Back": "50 Backstroke",
    "50 Backstroke": "50 Backstroke",
    "100 Back": "100 Backstroke",
    "100 Backstroke": "100 Backstroke",
    "200 Back": "200 Backstroke",
    "200 Backstroke": "200 Backstroke",
    "50 Breast": "50 Breaststroke",
    "50 Breaststroke": "50 Breaststroke",
    "100 Breast": "100 Breaststroke",
    "100 Breaststroke": "100 Breaststroke",
    "200 Breast": "200 Breaststroke",
    "200 Breaststroke": "200 Breaststroke",
    "50 Fly": "50 Butterfly",
    "50 Butterfly": "50 Butterfly",
    "100 Fly": "100 Butterfly",
    "100 Butterfly": "100 Butterfly",
    "200 Fly": "200 Butterfly",
    "200 Butterfly": "200 Butterfly",
    "100 IM": "100 Individual Medley",
    "100 Individual Medley": "100 Individual Medley",
    "200 IM": "200 Individual Medley",
    "200 Individual Medley": "200 Individual Medley",
    "400 IM": "400 Individual Medley",
    "400 Individual Medley": "400 Individual Medley"
}};

function getStandardEventName(name) {{
    if (!name) return '';
    const clean = name.trim();
    return EVENT_NAME_MAP[clean] || clean;
}}

if (typeof window !== 'undefined') {{
    window.COUNTY_STANDARDS = COUNTY_STANDARDS;
    window.REGIONAL_STANDARDS = REGIONAL_STANDARDS;
    window.SWIMMERS_METADATA = SWIMMERS_METADATA;
    window.EVENT_NAME_MAP = EVENT_NAME_MAP;
    window.getStandardEventName = getStandardEventName;
}}

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{
        COUNTY_STANDARDS,
        REGIONAL_STANDARDS,
        SWIMMERS_METADATA,
        EVENT_NAME_MAP,
        getStandardEventName
    }};
}}
"""
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"Saved {OUTPUT_JS} with {len(regional_standards)} regional standards and metadata for {len(swimmers_meta)} swimmers.")
    
    # Also mirror to root and src
    for mirror_path in [ROOT_OUTPUT_JS, SRC_OUTPUT_JS]:
        if os.path.exists(os.path.dirname(mirror_path)):
            with open(mirror_path, 'w', encoding='utf-8') as f:
                f.write(js_content)
            print(f"Mirrored to {mirror_path}")

if __name__ == '__main__':
    main()
