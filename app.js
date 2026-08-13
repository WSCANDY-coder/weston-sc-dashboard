/*******************************************************************************
 * WESTON SC MASTER DASHBOARD - APP.JS (Clean & Stable Baseline - Mobile Optimized)
 ******************************************************************************/

let CALENDAR_DATA = [];
let RELAYS_DATA = [];
let DEVLOP_DATA = [];
let COUNTY_SUMMARY = [];
let BSG_SUMMARY = [];
let SC_TIMES_DATA = [];
let LC_TIMES_DATA = [];
let ARENA_LEAGUE_DATA = [];
let SQUAD_LIST_DATA = [];
let ALL_TIMES_DATA = [];

// Helper function to extract row value case-insensitively and trimmed
function getRowVal(row, possibleKeys) {
    if (!row || typeof row !== 'object') return '';
    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
        const cleanKey = key.trim().toLowerCase();
        for (const target of possibleKeys) {
            if (cleanKey === target.trim().toLowerCase()) {
                const val = row[key];
                return val !== null && val !== undefined ? String(val).trim() : '';
            }
        }
    }
    return '';
}

// Helper to safely fetch data arrays
function getDataset(rawData, possibleNames) {
    if (!rawData || typeof rawData !== 'object') return [];
    for (const key of Object.keys(rawData)) {
        const cleanKey = key.trim().toLowerCase();
        for (const target of possibleNames) {
            if (cleanKey === target.trim().toLowerCase()) {
                return Array.isArray(rawData[key]) ? rawData[key] : [];
            }
        }
    }
    return [];
}

function initDashboard() {
    try {
        const rawData = window.MASTER_DASHBOARD_DATA || (typeof MASTER_DASHBOARD_DATA !== 'undefined' ? MASTER_DASHBOARD_DATA : null);
        
        if (!rawData) {
            console.warn("MASTER_DASHBOARD_DATA not found. Waiting for data.js to load...");
            return;
        }

        CALENDAR_DATA     = getDataset(rawData, ["Calendar", "Gala Calendar", "Events"]);
        RELAYS_DATA       = getDataset(rawData, ["Relays Sept 19", "Relays", "SC Relays"]);
        DEVLOP_DATA       = getDataset(rawData, ["Devlop 26", "Devlop '26", "Devlop Report", "Devlop"]);
        BSG_SUMMARY       = getDataset(rawData, ["BSG L2", "BSG Level 2", "BSG"]);
        
        const rawCounty   = getDataset(rawData, ["County Times", "Somerset County", "County"]);
        COUNTY_SUMMARY    = rawCounty.filter(row => {
            const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
            const asa  = getRowVal(row, ['ASA Number', 'ASA']);
            return name && name !== 'Age Group Qualification Summary' && asa !== 'Swimmer Name';
        });

        SC_TIMES_DATA     = getDataset(rawData, ["SC Times", "Short Course Times"]);
        LC_TIMES_DATA     = getDataset(rawData, ["LC Times", "Long Course Times"]);
        ARENA_LEAGUE_DATA = getDataset(rawData, ["Selection Report", "Arena League Selection", "Selection"]);
        SQUAD_LIST_DATA   = getDataset(rawData, ["Sept_Movements", "Squad Movements", "Movements"]);

        const lcMapped = (Array.isArray(LC_TIMES_DATA) ? LC_TIMES_DATA : []).map(i => ({...i, Course: '50m (LC)'}));
        const scMapped = (Array.isArray(SC_TIMES_DATA) ? SC_TIMES_DATA : []).map(i => ({...i, Course: '25m (SC)'}));
        ALL_TIMES_DATA = [...lcMapped, ...scMapped];

        // Safely execute view renderers
        if (document.querySelector('#times-table tbody')) renderTimesTable(ALL_TIMES_DATA);
        if (document.getElementById('v10-relay-container')) renderRelays();
        if (document.querySelector('#bsg-table tbody')) renderBSG();
        if (document.querySelector('#devlop-table tbody')) renderDevlop();
        if (document.querySelector('#county-table tbody')) renderCounty();
        if (document.querySelector('#selection-table tbody')) renderSelectionTable(ARENA_LEAGUE_DATA);
        if (document.getElementById('squad-grid')) renderSquadList();
        if (document.getElementById('calendar-table-body')) renderCalendar();

    } catch (err) {
        console.error("Dashboard initialization error:", err);
    }
}

// TOGGLE MOBILE SIDEBAR DRAWER
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (overlay) overlay.classList.toggle('active');
}

// 1. VIEW SWITCHING
function switchView(viewId) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');
    
    const targetNav = document.getElementById('tab-' + viewId);
    if (targetNav) targetNav.classList.add('active');

    // Automatically collapse drawer on mobile views after selection
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    }

    const titles = {
        'overview': ['Overview', 'Central hub for Weston SC swim analytics, times, and qualification metrics.'],
        'times': ['LC & SC Times Database', 'Personal bests and meet entries across Long Course and Short Course.'],
        'relays': ['SC Relays', 'Official September relay team assignments, splits, and estimated totals.'],
        'bsg': ['BSG L2 Times', 'Bristol & South Gloucestershire Level 2 qualification status.'],
        'devlop': ['Devlop \'26 Report', 'Event eligibility and cutoff evaluation.'],
        'county': ['County Times', 'Somerset County Championship qualification status.'],
        'selection': ['Arena League Selection Report', 'Gala team race assignments and selected swimmer rosters.'],
        'movements': ['Squad Movements', 'Squad roster hierarchy from Club Link through Regional Performance.'],
        'calendar': ['Gala Calendar', 'Scheduled competitions and venues.']
    };

    if (titles[viewId] && document.getElementById('view-title')) {
        const titleElem = document.getElementById('view-title');
        const descElem = document.getElementById('view-desc');
        if (titleElem) titleElem.innerText = titles[viewId][0];
        if (descElem) descElem.innerText = titles[viewId][1];
    }
}

// 2. TIMES MODULE
function renderTimesTable(data) {
    const tbody = document.querySelector('#times-table tbody');
    if (!tbody) return;
    tbody.innerHTML = (data || []).map(r => `
        <tr>
            <td style="font-weight:600">${getRowVal(r, ['Swimmer Name', 'Name'])}</td>
            <td>${getRowVal(r, ['ASA Number', 'ASA'])}</td>
            <td>${getRowVal(r, ['Event'])}</td>
            <td><span style="color:${r['Course'] === '50m (LC)' ? 'var(--accent-cyan)' : 'var(--accent-amber)'}">${r['Course']}</span></td>
            <td style="font-family:monospace; font-weight:700;">${getRowVal(r, ['Time'])}</td>
            <td>${(getRowVal(r, ['Date']) || '').split(' ')[0]}</td>
            <td style="color:var(--text-muted); font-size:0.8rem;">${getRowVal(r, ['Meet / Venue'])}</td>
        </tr>
    `).join('');
}

function filterTimes() {
    const q = (document.getElementById('times-search')?.value || '').toLowerCase();
    const course = document.getElementById('times-course-select')?.value || 'ALL';
    const eventVal = document.getElementById('times-event-select')?.value || 'ALL';
    
    const filtered = ALL_TIMES_DATA.filter(r => {
        const matchesQ = (getRowVal(r, ['Swimmer Name', 'Name'])).toLowerCase().includes(q) || (getRowVal(r, ['Event'])).toLowerCase().includes(q);
        const matchesCourse = course === 'ALL' || r['Course'] === course;
        const matchesEvent = eventVal === 'ALL' || getRowVal(r, ['Event']) === eventVal;
        return matchesQ && matchesCourse && matchesEvent;
    });
    renderTimesTable(filtered);
}

// 3. SC RELAYS MODULE
function renderRelays() {
    const container = document.getElementById('v10-relay-container');
    if (!container || !RELAYS_DATA.length) return;

    const filterGender = document.getElementById('relay-filter-gender')?.value || 'ALL';
    const filterQuery = (document.getElementById('relay-search')?.value || '').toLowerCase();

    const parsedRelays = [];

    RELAYS_DATA.forEach(row => {
        const eventNumVal = getRowVal(row, ['Event #', 'Event']);
        if (eventNumVal && !isNaN(parseFloat(eventNumVal))) {
            const eventNum = Math.floor(parseFloat(eventNumVal));
            const gender = getRowVal(row, ['Gender']) || 'Mixed';
            const age = getRowVal(row, ['Age', 'Age ']) || '';
            const race = getRowVal(row, ['Race', 'Race ']) || 'Relay';
            const totalTime = getRowVal(row, ['Estimated Team Total']) || 'Incomplete Times';

            let legsData = row.Legs || row.legs || [];
            const legs = [];

            if (!Array.isArray(legsData) || legsData.length === 0) {
                const cols = ["Swimmers ", "Swimmers .1", "Swimmers .2", "Swimmers .3"];
                const titles = race.includes("Medley") ? ["BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "FREESTYLE"] : ["LEG 1", "LEG 2", "LEG 3", "LEG 4"];
                cols.forEach((col, idx) => {
                    if (row[col] && row[col] !== 'Incomplete Times') {
                        legs.push({ label: titles[idx], name: row[col], split: '' });
                    }
                });
            } else {
                legsData.forEach(leg => {
                    const swimmerName = leg.swimmer || leg.Swimmer || '';
                    if (swimmerName && swimmerName !== 'Incomplete Times' && swimmerName !== 'NaN') {
                        legs.push({
                            label: leg.stroke || leg.Stroke || 'LEG',
                            name: swimmerName,
                            split: leg.split || leg.Split || ''
                        });
                    }
                });
            }

            const matchesGender = filterGender === 'ALL' || gender.toLowerCase().includes(filterGender.toLowerCase());
            const matchesQuery = !filterQuery || 
                race.toLowerCase().includes(filterQuery) || 
                gender.toLowerCase().includes(filterQuery) || 
                legs.some(l => l.name.toLowerCase().includes(filterQuery));

            if (matchesGender && matchesQuery) {
                parsedRelays.push({ eventNum, gender, age, race, totalTime, legs });
            }
        }
    });

    if (!parsedRelays.length) {
        container.innerHTML = '<div style="color:var(--text-muted); padding:2rem;">No matching relay events found.</div>';
        return;
    }

    container.innerHTML = parsedRelays.map(r => {
        let genderClass = 'mixed';
        if (r.gender.toLowerCase().includes('boy')) genderClass = 'boy';
        else if (r.gender.toLowerCase().includes('girl')) genderClass = 'girl';

        const isIncomplete = String(r.totalTime).toLowerCase() === 'incomplete times' || !r.totalTime;

        const legsHtml = r.legs.length > 0 ? r.legs.map(l => `
            <div class="v10-leg-card">
                <span class="v10-leg-stroke">${l.label}</span>
                <span class="v10-leg-swimmer">
                    ${l.name}
                    ${l.split ? `<span class="v10-leg-split">(${l.split})</span>` : ''}
                </span>
            </div>
        `).join('') : `<span style="color:var(--text-muted); font-style:italic;">No swimmers assigned</span>`;

        return `
            <div class="v10-relay-row">
                <div class="v10-event-num">#${r.eventNum}</div>
                <div><span class="v10-badge ${genderClass}">${r.gender} (${r.age})</span></div>
                <div class="v10-race-title">${r.race}</div>
                <div class="v10-legs-flex">${legsHtml}</div>
                <div class="v10-team-total ${isIncomplete ? 'incomplete' : 'valid'}">${r.totalTime}</div>
            </div>
        `;
    }).join('');
}

// 4. BSG L2 MODULE
function renderBSG() {
    const tbody = document.querySelector('#bsg-table tbody');
    if (!tbody || !BSG_SUMMARY.length) return;

    const query = (document.getElementById('bsg-search')?.value || '').toLowerCase();
    const filtered = BSG_SUMMARY.filter(r => getRowVal(r, ['Swimmer Name', 'Name']).toLowerCase().includes(query));

    tbody.innerHTML = filtered.map((r, idx) => {
        const activeEventsCount = Object.keys(r).filter(k => k.startsWith('Event ') && r[k]).length;
        return `
            <tr>
                <td style="font-weight:600">${getRowVal(r, ['Swimmer Name', 'Name'])}</td>
                <td>${getRowVal(r, ['ASA Number', 'ASA'])}</td>
                <td>${getRowVal(r, ['Gender'])} (${getRowVal(r, ['Age'])})</td>
                <td>${getRowVal(r, ['Age Group'])}</td>
                <td>${getRowVal(r, ['Events With Times'])}</td>
                <td style="color:var(--accent-emerald); font-weight:700;">${getRowVal(r, ['Qualified Events Count'])}</td>
                <td style="color:var(--accent-amber)">${getRowVal(r, ['Slower Events Count'])}</td>
                <td><button class="btn-info" onclick="openBSGModal(${idx})">ℹ️ More Info (${activeEventsCount})</button></td>
            </tr>
        `;
    }).join('');
}

function openBSGModal(idx) {
    const swimmer = BSG_SUMMARY[idx];
    if (!swimmer) return;
    const titleElem = document.getElementById('bsg-modal-title');
    if (titleElem) titleElem.innerText = `${getRowVal(swimmer, ['Swimmer Name', 'Name'])} - BSG L2 Events`;
    
    const events = [];
    for (let i = 1; i <= 13; i++) {
        const val = swimmer[`Event ${i}`] || getRowVal(swimmer, [`Event ${i}`]);
        if (val && val !== 'NaN') events.push({ num: i, text: val });
    }

    const bodyElem = document.getElementById('bsg-modal-body');
    if (bodyElem) {
        bodyElem.innerHTML = `
            <div class="modal-grid">
                ${events.map(e => `
                    <div class="event-badge-card ${e.text.includes('Qualified') ? 'qualified' : 'slower'}">
                        <span style="font-size:0.65rem; font-weight:800; color:var(--text-muted); display:block;">EVENT ${e.num}</span>
                        <span style="font-size:0.85rem; font-weight:700;">${e.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    document.getElementById('bsg-modal')?.classList.remove('hidden');
}

function closeBSGModal() {
    document.getElementById('bsg-modal')?.classList.add('hidden');
}

// 5. DEVLOP '26 MODULE
function renderDevlop() {
    const tbody = document.querySelector('#devlop-table tbody');
    if (!tbody || !DEVLOP_DATA.length) return;

    const query = (document.getElementById('devlop-search')?.value || '').toLowerCase();
    const filtered = DEVLOP_DATA.filter(r => getRowVal(r, ['Swimmer Name', 'Name']).toLowerCase().includes(query));

    tbody.innerHTML = filtered.map((r, idx) => {
        const activeEventsCount = Object.keys(r).filter(k => k.startsWith('Event ') && r[k]).length;
        return `
            <tr>
                <td style="font-weight:600">${getRowVal(r, ['Swimmer Name', 'Name'])}</td>
                <td>${getRowVal(r, ['ASA Number', 'ASA'])}</td>
                <td>${getRowVal(r, ['Gender'])} (${getRowVal(r, ['Age'])})</td>
                <td>${getRowVal(r, ['Age Group'])}</td>
                <td>${getRowVal(r, ['Events With Times'])}</td>
                <td style="color:var(--accent-emerald); font-weight:700;">${getRowVal(r, ['Slower Events Count'])}</td>
                <td style="color:var(--accent-rose); font-weight:700;">${getRowVal(r, ['Too Fast Events Count'])}</td>
                <td><button class="btn-info" onclick="openDevlopModal(${idx})">ℹ️ More Info (${activeEventsCount})</button></td>
            </tr>
        `;
    }).join('');
}

function openDevlopModal(idx) {
    const swimmer = DEVLOP_DATA[idx];
    if (!swimmer) return;
    const titleElem = document.getElementById('devlop-modal-title');
    if (titleElem) titleElem.innerText = `${getRowVal(swimmer, ['Swimmer Name', 'Name'])} - Devlop '26 Events`;
    
    const events = [];
    for (let i = 1; i <= 13; i++) {
        const val = swimmer[`Event ${i}`] || getRowVal(swimmer, [`Event ${i}`]);
        if (val && val !== 'NaN') events.push({ num: i, text: val });
    }

    const bodyElem = document.getElementById('devlop-modal-body');
    if (bodyElem) {
        bodyElem.innerHTML = `
            <div class="modal-grid">
                ${events.map(e => `
                    <div class="event-badge-card ${e.text.includes('Too Fast') ? 'too-fast' : 'slower'}">
                        <span style="font-size:0.65rem; font-weight:800; color:var(--text-muted); display:block;">EVENT ${e.num}</span>
                        <span style="font-size:0.85rem; font-weight:700;">${e.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    document.getElementById('devlop-modal')?.classList.remove('hidden');
}

function closeDevlopModal() {
    document.getElementById('devlop-modal')?.classList.add('hidden');
}

// 6. COUNTY TIMES MODULE
function renderCounty() {
    const tbody = document.querySelector('#county-table tbody');
    if (!tbody || !COUNTY_SUMMARY.length) return;

    const query = (document.getElementById('county-search')?.value || '').toLowerCase();
    const filtered = COUNTY_SUMMARY.filter(r => getRowVal(r, ['Swimmer Name', 'Name']).toLowerCase().includes(query));

    tbody.innerHTML = filtered.map((r, idx) => {
        const activeEventsCount = Object.keys(r).filter(k => k.startsWith('Event ') && r[k]).length;
        return `
            <tr>
                <td style="font-weight:600">${getRowVal(r, ['Swimmer Name', 'Name'])}</td>
                <td>${getRowVal(r, ['ASA Number', 'ASA'])}</td>
                <td>${getRowVal(r, ['Gender'])}</td>
                <td>${getRowVal(r, ['Age Group'])}</td>
                <td style="color:var(--accent-emerald); font-weight:700;">${getRowVal(r, ['Qualified Events Count'])}</td>
                <td style="color:var(--accent-amber)">${getRowVal(r, ['Slower Events Count'])}</td>
                <td>${getRowVal(r, ['Unentered Events Count'])}</td>
                <td><button class="btn-info" onclick="openCountyModal(${idx})">ℹ️ More Info (${activeEventsCount})</button></td>
            </tr>
        `;
    }).join('');
}

function openCountyModal(idx) {
    const swimmer = COUNTY_SUMMARY[idx];
    if (!swimmer) return;
    const titleElem = document.getElementById('county-modal-title');
    if (titleElem) titleElem.innerText = `${getRowVal(swimmer, ['Swimmer Name', 'Name'])} - County Times Events`;
    
    const events = [];
    for (let i = 1; i <= 13; i++) {
        const val = swimmer[`Event ${i}`] || getRowVal(swimmer, [`Event ${i}`]);
        if (val && val !== 'NaN') events.push({ num: i, text: val });
    }

    const bodyElem = document.getElementById('county-modal-body');
    if (bodyElem) {
        bodyElem.innerHTML = `
            <div class="modal-grid">
                ${events.map(e => `
                    <div class="event-badge-card ${e.text.includes('Qualified') ? 'qualified' : (e.text.includes('Slower') ? 'slower' : '')}">
                        <span style="font-size:0.65rem; font-weight:800; color:var(--text-muted); display:block;">EVENT ${e.num}</span>
                        <span style="font-size:0.85rem; font-weight:700;">${e.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    document.getElementById('county-modal')?.classList.remove('hidden');
}

function closeCountyModal() {
    document.getElementById('county-modal')?.classList.add('hidden');
}

// 7. ARENA LEAGUE SELECTION REPORT
function renderSelectionTable(data) {
    const tbody = document.querySelector('#selection-table tbody');
    if (!tbody) return;
    tbody.innerHTML = (data || []).map(r => `
        <tr>
            <td>${getRowVal(r, ['Race #'])}</td>
            <td>${getRowVal(r, ['Age Group'])}</td>
            <td>${getRowVal(r, ['Gender'])}</td>
            <td style="font-weight:600">${getRowVal(r, ['Event Title'])}</td>
            <td style="color:var(--accent-cyan); font-weight:600">${getRowVal(r, ['Selected Name', 'Swimmer Name', 'Name'])}</td>
        </tr>
    `).join('');
}

function filterSelection() {
    const q = (document.getElementById('selection-search')?.value || '').toLowerCase();
    const filtered = ARENA_LEAGUE_DATA.filter(r => 
        getRowVal(r, ['Event Title']).toLowerCase().includes(q) || 
        getRowVal(r, ['Selected Name', 'Swimmer Name', 'Name']).toLowerCase().includes(q)
    );
    renderSelectionTable(filtered);
}

// 8. SQUAD MOVEMENTS MODULE
function renderSquadList() {
    const container = document.getElementById('squad-grid');
    if (!container || !SQUAD_LIST_DATA || !SQUAD_LIST_DATA.length) return;

    const cols = Object.keys(SQUAD_LIST_DATA[0]);
    container.innerHTML = cols.map(col => `
        <div class="squad-column">
            <h3>${col}</h3>
            ${SQUAD_LIST_DATA.map(r => r[col] ? `<div class="squad-member">${r[col]}</div>` : '').join('')}
        </div>
    `).join('');
}

// 9. MEET CALENDAR MODULE
function renderCalendar() {
    const tbody = document.getElementById('calendar-table-body');
    if (!tbody || !CALENDAR_DATA || !CALENDAR_DATA.length) return;
    tbody.innerHTML = CALENDAR_DATA.map(c => `
        <tr>
            <td style="font-weight:700; color:var(--accent-amber);">${getRowVal(c, ['Date'])}</td>
            <td style="font-weight:600">${getRowVal(c, ['Event', 'Event '])}</td>
            <td>${getRowVal(c, ['Where', 'Venue', 'Location'])}</td>
        </tr>
    `).join('');
}

// Global functions for inline HTML events
window.switchView = switchView;
window.filterTimes = filterTimes;
window.filterRelays = renderRelays;
window.filterBSG = renderBSG;
window.openBSGModal = openBSGModal;
window.closeBSGModal = closeBSGModal;
window.filterDevlop = renderDevlop;
window.openDevlopModal = openDevlopModal;
window.closeDevlopModal = closeDevlopModal;
window.filterCounty = renderCounty;
window.openCountyModal = openCountyModal;
window.closeCountyModal = closeCountyModal;
window.filterSelection = filterSelection;
window.toggleMobileSidebar = toggleMobileSidebar;

// Attach initialization handlers safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

window.addEventListener('load', initDashboard);