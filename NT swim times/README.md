# Weston SC - Swimmer Portal & NT Projection Calculator

A standalone, modern, responsive sports-analytics single-page web application built with **HTML5, Tailwind CSS, SheetJS, and pure JavaScript** for **Weston-super-Mare Swimming Club (Weston SC)**.

This application computes realistic gala entry times for unswum events where a swimmer has "No Time" (**NT**), using official qualifying standard deltas, pool course scaling, and coach-specific stroke/IM transition heuristics.

---

## 🎯 Coach NT Projection Rules & Heuristics

The calculator implements the coach rules across both the **Single NT Calculator** (Tab 1) and the **Batch File Ingestion** (Tab 2):

1. **Needing a 200m of a Stroke**:
   - If the swimmer has a **100m** time of that stroke $\rightarrow$ uses the **100m** time as the baseline reference!
   - If the swimmer has **no 100m** time of that stroke, but has the **50m** $\rightarrow$ uses the **50m** time and applies **$+25\%$** endurance curve scaling.

2. **Needing a 400m of a Stroke**:
   - If the swimmer has a **200m** time of that stroke $\rightarrow$ uses the **200m** time as the baseline reference!
   - If the swimmer has no 200m, but has a 100m or 50m $\rightarrow$ uses that time with the respective curve scaling.

3. **Needing a 100m of a Stroke**:
   - If the swimmer has no 100m time, but has the **50m** $\rightarrow$ uses the **50m** time and applies **$+25\%$**.

4. **Individual Medley (IM) Rules**:
   - **For 200m IM**:
     - **Option A**: If the swimmer has a **100m IM** time $\rightarrow$ uses the **100m IM** time as the baseline!
     - **Option B (4-Stroke Sum)**: If the swimmer has a 50m time in each stroke (50m Butterfly, 50m Backstroke, 50m Breaststroke, 50m Freestyle) $\rightarrow$ calculates:
       $$T_{200IM} = (T_{50\text{Fly}} + T_{50\text{Back}} + T_{50\text{Breast}} + T_{50\text{Free}}) \times 1.05$$
       *(Adds the four 50m stroke PBs and adds 5% for turns and transitions).*
   - **For 400m IM**:
     - If the swimmer has a **200m IM** time $\rightarrow$ uses the **200m IM** time as the baseline reference!

5. **Swimmers with No Prior Times**:
   - Applies the selected fallback standard (e.g. Somerset County Standard flat `+0%`, `+5%`, or `+10%`).

---

## 🚀 Key Features

### 1. Meet Entry Spreadsheet Ingestion (`.xlsx`, `.xls`, `.csv`)
- **Direct File Ingestion**: Ingests files like **`Manual entries .xlsx`** (or Hy-Tek / Meet Manager entries reports).
- **One-Click Preloaded Ingestion**: Click **"⚡ Load 'Manual entries .xlsx' (34 Entries)"** to immediately load and process the bundled entries file.
- **Intelligent Roster Matching**:
  - Automatically identifies swimmer names formatted as `Lastname, Firstname` (e.g. `Allen, Eva` → `Eva Allen`) or `Firstname Lastname`.
  - Matches swimmers against the Weston SC database to retrieve their official recorded Personal Bests (PBs).
  - Automatically handles age/category codes like `G 12-12` (Girls 12), `B 11-11` (Boys 11), `B 9-9` (Boys 9/10).
  - Translates abbreviations like `200 Back` → `200 Backstroke`, `200 Medley` → `200 Individual Medley`, `50 Fly` → `50 Butterfly`, etc.
- **Comprehensive Export Options**:
  - **📊 Google Sheets (1-Click `sheets.new` & Cloud Export)**:
    - **1-Click Launch**: Copies formatted, styled cells directly to clipboard and launches a fresh Google Sheet in a new tab (`sheets.new`). Simply press `Ctrl + V` in cell A1 to populate all entries!
    - **Download .xlsx for Google Drive**: Formatted specifically for importing/dragging into Google Drive.
    - **Copy Tab-Separated Data**: For pasting into existing club Google Sheets.
    - **Optional Apps Script Webhook**: Cloud sync directly into a Google Sheet via Apps Script Webhook.
  - **📥 Download Updated Excel (`.xlsx`)**: Exports a new spreadsheet with the projected entry times replacing `NT`.
  - **📄 Download CSV**: Full tabular export.
  - **📋 Copy Hy-Tek Entry Format**: Formatted clipboard copy for gala entry software.

### 2. Standalone NT Single Projection Calculator
- **Automated Swimmer PB Sync & Rule Suggestion**:
  - Picking a target event automatically selects the recommended baseline stroke (e.g. 100m for 200m, 200m for 400m).
  - Features an interactive **"Coach 4-Stroke IM Formula Available"** banner for 200 IM when all four 50s are logged!
- **Digital Stopwatch Hero Display & Lap Pacing Splits**:
  - Outputs time in `MM:SS.ss` (or `SS.ss` if under 1 minute).
  - 50m interval lap pace estimates.
  - Live comparison to **Somerset County 2026** and **South West Regional QT / CQT** qualifying times.
  - Full step-by-step formula audit breakdown.

### 3. Swimmer PB Viewer & Standings
- Search by swimmer name or Swim England (SE) number.
- Filter by Squad, Gender, and Age Group.
- Displays recorded personal bests (SC and LC), meet locations, dates, WA Points, and Somerset County qualification badges ($\star$).
- **"⚡ NT Calc" Quick Launch**: Instantly jumps into the calculator with that swimmer preloaded.

### 4. Qualifying Standards Matrix
- Full matrix tables for:
  - **Somerset County Championships 2026** (Ages 10 through 18+)
  - **South West Regional Championships 2026** (QT & CQT, Short Course & Long Course)
- **Interactive Inline Editing**: Coaches can edit standards directly in the browser and save them to `localStorage` or restore defaults anytime.

---

## 📁 File Structure

```text
NT swim times/
├── index.html              # Self-contained single-page application (HTML, CSS, JS, SheetJS, Embedded Datasets)
├── Manual entries .xlsx    # Gala entry spreadsheet with 34 NT entries
├── manual_entries.json     # Extracted JSON representation of Manual entries .xlsx
├── data.json               # Structured club dataset (41 swimmers, 420 race records, standards)
├── run.bat                 # One-click desktop launcher
└── README.md               # Documentation and technical guide
```

---

## 🏃‍♂️ How to Run

1. Double-click **[`run.bat`](file:///c:/Users/andre/weston-sc-dashboard/NT%20swim%20times/run.bat)** in File Explorer (or run `Start-Process "c:\Users\andre\weston-sc-dashboard\NT swim times\index.html"` in PowerShell).
2. Click the **"Batch & File Ingestion"** tab (Tab 2).
3. Click **`⚡ Load "Manual entries .xlsx" (34 Entries)`**.
4. The calculator automatically computes all 34 entries using the coach stroke, IM, and distance rules!
5. Click **`Download Excel (.xlsx)`** to save the updated spreadsheet.
