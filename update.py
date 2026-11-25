#!/usr/bin/env python3
"""
One-Command Data Update Workflow for Weston-super-Mare SC Dashboard
Runs scrape_pbs.py, verifies datasets, and optionally publishes updates.
Usage:
    python update.py
"""

import os
import sys
import subprocess
import json

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPER_PATH = os.path.join(BASE_DIR, 'scrape_pbs.py')
if not os.path.exists(SCRAPER_PATH):
    SCRAPER_PATH = os.path.join(BASE_DIR, 'scripts', 'scrape_pbs.py')
PRIMARY_RAW_JS = os.path.join(BASE_DIR, 'raw_data.js')

def main():
    print("========================================================")
    print("🚀 WESTON SC DASHBOARD - ONE-COMMAND DATA UPDATE WORKFLOW")
    print("========================================================")
    
    # Step 1: Run the scraper script
    print("1. Running Swim England Scraper...")
    res = subprocess.run([sys.executable, SCRAPER_PATH], cwd=BASE_DIR)
    if res.returncode != 0:
        print("❌ ERROR: Scraper failed with exit code", res.returncode)
        sys.exit(1)

    # Step 1b: Re-generate County & Regional Qualifiers Standards
    print("\n1b. Generating County & Regional Qualifiers Standards...")
    qualifiers_builder = os.path.join(BASE_DIR, 'build_qualifiers_data.py')
    if not os.path.exists(qualifiers_builder):
        qualifiers_builder = os.path.join(BASE_DIR, 'scripts', 'build_qualifiers_data.py')
    if os.path.exists(qualifiers_builder):
        res_q = subprocess.run([sys.executable, qualifiers_builder], cwd=BASE_DIR)
        if res_q.returncode == 0:
            print("✅ Qualifiers standards successfully refreshed!")
        else:
            print("⚠️ Warning: Qualifiers standards script returned non-zero code", res_q.returncode)

    # Step 2: Verify non-zero records in raw_data.js
    print("\n2. Verifying generated datasets...")
    if not os.path.exists(PRIMARY_RAW_JS):
        print("❌ ERROR: Output file raw_data.js was not created.")
        sys.exit(1)
        
    try:
        with open(PRIMARY_RAW_JS, 'r', encoding='utf-8') as f:
            content = f.read()
        records_count = content.count('"recordKey":')
        if records_count == 0:
            print("❌ ERROR: Output dataset contains 0 records!")
            sys.exit(1)
        print(f"✅ Verified {records_count} valid records in raw_data.js!")
    except Exception as e:
        print(f"❌ ERROR verifying datasets: {e}")
        sys.exit(1)

def find_git_binary():
    try:
        res = subprocess.run(["git", "--version"], capture_output=True, text=True)
        if res.returncode == 0:
            return "git"
    except Exception:
        pass
    for p in [r"C:\Program Files\Git\cmd\git.exe", r"C:\Program Files\Git\bin\git.exe"]:
        if os.path.exists(p):
            return p
    return None

    # Step 3: Git Commit & Push (if running locally with git configured)
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        print("\n3. Running in GitHub Actions. Git commit and push will be handled by the workflow step.")
    else:
        print("\n3. Checking Git Repository Status...")
        git_bin = find_git_binary()
        if git_bin:
            print(f"   Git detected ({git_bin}). Committing and pushing updates...")
            subprocess.run([
                git_bin, "add",
                "raw_data.js", "raw_data.csv", "roster.json", "qualifiers_standards.js",
                "weston-sc-swimmers/raw_data.js", "weston-sc-swimmers/qualifiers_standards.js",
                "src/raw_data.js", "src/qualifiers_standards.js",
                "V1 code base/raw_data.js", "data/raw_data.csv", "scripts/roster.json"
            ], cwd=BASE_DIR)
            commit_msg = f"Auto-update Swim England PBs [{records_count} records]"
            subprocess.run([git_bin, "commit", "-m", commit_msg], cwd=BASE_DIR)
            res_push = subprocess.run([git_bin, "push", "origin", "main"], cwd=BASE_DIR)
            if res_push.returncode == 0:
                print("✅ Git commit and push to weston-sc-dashboard completed successfully!")
            else:
                print("⚠️ Git commit completed, but push returned non-zero code. Check your network or GitHub login.")

            # Also commit and push to the live dashboard repository (weston-sc-swimmers)
            swimmers_dir = os.path.join(BASE_DIR, 'weston-sc-swimmers')
            if os.path.exists(os.path.join(swimmers_dir, '.git')):
                print("\n   Updating live dashboard repository (weston-sc-swimmers)...")
                subprocess.run([git_bin, "add", "raw_data.js", "qualifiers_standards.js"], cwd=swimmers_dir)
                subprocess.run([git_bin, "commit", "-m", f"Auto-update Swim England PBs [{records_count} records]"], cwd=swimmers_dir)
                res_swimmers_push = subprocess.run([git_bin, "push", "origin", "main"], cwd=swimmers_dir)
                if res_swimmers_push.returncode == 0:
                    print("✅ Live dashboard (weston-sc-swimmers) updated and pushed successfully!")
                else:
                    print("⚠️ Live dashboard push returned non-zero code.")
        else:
            print("ℹ️ Git CLI not detected. Data files are updated locally and ready for web upload.")

    print("\n========================================================")
    print("🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
    print(f"   Total Swimmer PBs Updated: {records_count}")
    print("   Data Files Updated:")
    print("   - raw_data.js (root)")
    print("   - raw_data.csv (root)")
    print("   - roster.json (root)")
    print("   - qualifiers_standards.js (root)")
    print("   - weston-sc-swimmers/raw_data.js")
    print("   - weston-sc-swimmers/qualifiers_standards.js")
    print("   - src/raw_data.js")
    print("   - src/qualifiers_standards.js")
    print("   - V1 code base/raw_data.js")
    print("   - data/raw_data.csv")
    print("========================================================")

if __name__ == '__main__':
    main()
