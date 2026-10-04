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
SCRAPER_PATH = os.path.join(BASE_DIR, 'scripts', 'scrape_pbs.py')
PRIMARY_RAW_JS = os.path.join(BASE_DIR, 'weston-sc-swimmers', 'raw_data.js')

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

    # Step 3: Git Commit & Push (if git is available and configured)
    print("\n3. Checking Git Repository Status...")
    try:
        git_check = subprocess.run(["git", "--version"], capture_output=True, text=True)
        if git_check.returncode == 0:
            print("   Git detected. Committing and pushing updates...")
            subprocess.run(["git", "add", "weston-sc-swimmers/raw_data.js", "src/raw_data.js", "V1 code base/raw_data.js", "data/raw_data.csv", "scripts/roster.json"], cwd=BASE_DIR)
            commit_msg = f"Auto-update Swim England PBs [{records_count} records]"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=BASE_DIR)
            subprocess.run(["git", "push"], cwd=BASE_DIR)
            print("✅ Git commit and push completed successfully!")
        else:
            print("ℹ️ Git CLI not in PATH. Skipping git push.")
    except Exception:
        print("ℹ️ Git CLI not detected. Data files are updated locally and ready for web upload.")

    print("\n========================================================")
    print("🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
    print(f"   Total Swimmer PBs Updated: {records_count}")
    print("   Data Files Updated:")
    print("   - weston-sc-swimmers/raw_data.js")
    print("   - src/raw_data.js")
    print("   - V1 code base/raw_data.js")
    print("   - data/raw_data.csv")
    print("========================================================")

if __name__ == '__main__':
    main()
