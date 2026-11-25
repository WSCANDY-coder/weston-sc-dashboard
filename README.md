# Weston SC - Swimmers & Parents Hub (`weston-sc-swimmers`)

This repository is the public-facing, read-only web portal for Weston SC swimmers, parents, and coaches. It provides fast mobile access to personal best times, Swim England progression history, squad allocations, weekly training schedules, target open meets, and club notices.

---

## 🌟 Public Features Included

1. **Swimmer PBs & Progression (`#view-swimmers`)**:
   * Individual swimmer time history, WA points, dates, and venues.
   * Direct links to official **Swim England Progression Graphs** (`tstroke` & `tcourse`).
   * Somerset County Qualification Time (`🏆 County QT`) badges.
   * **Rolling 12-Month Form Filter**: View times from the past 12 months, 6 months, or 2026 season.
   * **📥 Download Swimmer Times & Improvement Report**:
     - Printable / PDF Performance Report with official club crest, swimmer profile, and summary KPIs.
     - Lifetime Personal Bests & time improvement table (Baseline Time vs PB Time, seconds dropped, and % improvement).
     - Chronological race-by-race split log tracking drops between competitions.
     - 1-Click CSV spreadsheet export and clipboard copy for Google Sheets / Excel.

2. **Somerset County Times Tracker (`#view-countytimes`)**:
   * Dedicated Somerset County Championship qualification tracker.
   * **Live Dynamic Google Sheet Sync**: Fetches live swimmer entries and qualifications directly from Google Sheets with automatic URL normalizer and offline local dataset fallback.
   * Interactive **Swimmer Qualification Matrix** displaying qualified events, slower events, and squad filters.
   * **Official County Standards Table** displaying 2026/27 qualifying cutoff times across all events and age groups (Ages 10 to 18+ for Female and Male/Open).
   * 1-Click CSV export and Google Sheets clipboard copy.

3. **Squad Movements & Schedules (`#view-movements`)**:
   * Current squad allocations (Club Link to Regional Performance).
   * Weekly pool training session times (`⏰ Tues/Thurs 7:40-9.00`).
   * Weekend extra session badges (`🗓️ Sat 7-8am`).

4. **Meet Calendar (`#view-calendar`)**:
   * Scheduled galas, target open meets, entry deadlines, and pool venues.
   * **Live Dynamic Sync**: Automatically loads real-time meet dates and venues from Google Sheets (`gid=436293374`) with local dataset fallback.

5. **Club Notices & Urgent News (`#view-overview`)**:
   * Top alert banner for high-priority news (gala entry closing dates).
   * Interactive Club Notices modal for detailed announcements.

---

## 🚀 Quick Setup & GitHub Pages Deployment Guide

### Step 1: Create the GitHub Repository
1. On GitHub, create a new public repository named **`weston-sc-swimmers`**.
2. Do not initialize with a README (this repository contains all necessary files).

### Step 2: Upload or Push the Code
Upload or push the following files to the `main` branch of `weston-sc-swimmers`:
* `index.html`
* `app.js`
* `data.js`
* `raw_data.js`
* `README.md`

### Step 3: Enable GitHub Pages
1. On GitHub, navigate to **Settings > Pages** in your `weston-sc-swimmers` repository.
2. Under **Build and deployment**:
   * **Source**: Select `Deploy from a branch`.
   * **Branch**: Select `main` / `root (/)`.
3. Click **Save**.
4. Your public portal will be live at:
   `https://<your-github-username>.github.io/weston-sc-swimmers/`

---

## 🔄 6-Week Post-Meet Update Workflow (One-Step Sync)

When a new open meet concludes:
1. Import the meet timing export into your master Google Sheet.
2. Export/update `data.js` and `raw_data.js`.
3. Copy the updated `data.js` and `raw_data.js` into both `weston-sc-dashboard` and `weston-sc-swimmers`.
4. Both sites update instantly upon browser refresh — no code re-editing required!
