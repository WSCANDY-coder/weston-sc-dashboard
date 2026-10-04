#!/usr/bin/env python3
"""
Script to create a Windows Task Scheduler job that automatically runs 
'python update.py' every Wednesday at 09:00 AM.
"""

import os
import sys
import subprocess

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAT_PATH = os.path.join(BASE_DIR, 'scripts', 'schedule_wednesday_task.bat')

def setup_scheduler():
    task_name = "WestonSCDashboardWednesdayUpdate"
    print(f"Setting up Windows Task Scheduler job '{task_name}'...")
    
    # Command to create task in schtasks
    # Runs every Wednesday at 09:00 AM
    cmd = [
        "schtasks", "/create", "/tn", task_name,
        "/tr", f'"{BAT_PATH}"',
        "/sc", "weekly", "/d", "WED", "/st", "09:00",
        "/f" # force overwrite if exists
    ]
    
    try:
        res = subprocess.run(" ".join(cmd), shell=True, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✅ Successfully scheduled task '{task_name}' for every Wednesday at 09:00 AM!")
        else:
            print(f"⚠️ Could not register Windows task: {res.stderr}")
    except Exception as e:
        print(f"⚠️ Error setting up scheduler: {e}")

if __name__ == '__main__':
    setup_scheduler()
