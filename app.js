/*******************************************************************************
 * WESTON SC MASTER DASHBOARD - APP.JS (Clean & Stable Baseline - Mobile Optimized)
 ******************************************************************************/

let CALENDAR_DATA = [];
let RELAYS_DATA = [];
let DEVLOP_DATA = [];
let COUNTY_SUMMARY = [];
let BSG_SUMMARY = [];
let ARENA_LEAGUE_DATA = [];
let SQUAD_LIST_DATA = [];
let RAW_SWIMMERS_DATA = [];

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

// Helper to format YYYY-MM-DD or ISO dates as DD/MM/YYYY
function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return '-';
    const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return cleanStr || '-';
}

function parseRecordDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    const s = String(dateStr).trim().split('T')[0].split(' ')[0];

    // Standard DD/MM/YYYY
    const ddmmyyyy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyy) {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        return new Date(year, month, day);
    }

    // YYYY-MM-DD
    const yyyymmdd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (yyyymmdd) {
        const year = parseInt(yyyymmdd[1], 10);
        const month = parseInt(yyyymmdd[2], 10) - 1;
        const day = parseInt(yyyymmdd[3], 10);
        return new Date(year, month, day);
    }

    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
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
        RAW_SWIMMERS_DATA = window.RAW_DATA || (typeof RAW_DATA !== 'undefined' ? RAW_DATA : []);
        
        if (!rawData && !RAW_SWIMMERS_DATA.length) {
            console.warn("Dashboard data not found. Waiting for data files to load...");
            return;
        }

        if (rawData) {
            CALENDAR_DATA     = getDataset(rawData, ["Calendar", "Gala Calendar", "Events", "Gala_Calendar", "Meet Calendar", "Schedule"]);
            RELAYS_DATA       = getDataset(rawData, ["Relays Sept 19", "Relays", "SC Relays"]);
            DEVLOP_DATA       = getDataset(rawData, ["Devlop 26", "Devlop '26", "Devlop Report", "Devlop"]);
            BSG_SUMMARY       = getDataset(rawData, ["BSG L2", "BSG Level 2", "BSG"]);
            
            const rawCounty   = getDataset(rawData, ["County Times", "Somerset County", "County"]);
            COUNTY_SUMMARY    = rawCounty.filter(row => {
                const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
                const asa  = getRowVal(row, ['ASA Number', 'ASA']);
                return name && name !== 'Age Group Qualification Summary' && asa !== 'Swimmer Name';
            });

            ARENA_LEAGUE_DATA = getDataset(rawData, ["Selection Report", "Arena League Selection", "Selection"]);
            SQUAD_LIST_DATA   = getDataset(rawData, ["Sept_Movements", "Squad Movements", "Movements"]);
        }

        loadLiveSquadMovements();

        // Safely execute view renderers
        if (document.querySelector('#swimmers-table tbody')) {
            populateSwimmersDropdowns(RAW_SWIMMERS_DATA);
            filterSwimmers();
        }
        if (document.getElementById('v10-relay-container')) renderRelays();
        if (document.querySelector('#bsg-table tbody')) renderBSG();
        if (document.querySelector('#devlop-table tbody')) renderDevlop();
        if (document.querySelector('#county-table tbody')) renderCounty();
        if (document.querySelector('#selection-table tbody')) renderSelectionTable(ARENA_LEAGUE_DATA);
        if (document.getElementById('squad-grid')) renderSquadList();
        if (document.getElementById('calendar-table-body')) renderCalendar();
        renderClubNotices();

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
        'swimmers': ['Swimmers Dashboard', 'Comprehensive performance history, personal bests, and meet times for all Weston SC swimmers.'],
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

// 2. SWIMMERS DASHBOARD MODULE
let currentSwimmerForEvents = null;

function updateEventOptions(swimmerName) {
    const eventSelect = document.getElementById('swimmers-event-select');
    if (!eventSelect) return;

    if (currentSwimmerForEvents === swimmerName) return;
    currentSwimmerForEvents = swimmerName;

    const previousSelected = eventSelect.value;

    let availableRecords = RAW_SWIMMERS_DATA;
    if (swimmerName && swimmerName !== 'ALL') {
        availableRecords = RAW_SWIMMERS_DATA.filter(r => (r.swimmerName || '') === swimmerName);
    }

    const uniqueEvents = Array.from(new Set(availableRecords.map(r => r.event).filter(Boolean))).sort();

    eventSelect.innerHTML = '<option value="ALL">All Events</option>';
    uniqueEvents.forEach(evt => {
        const opt = document.createElement('option');
        opt.value = evt;
        opt.textContent = evt;
        eventSelect.appendChild(opt);
    });

    if (previousSelected && uniqueEvents.includes(previousSelected)) {
        eventSelect.value = previousSelected;
    } else {
        eventSelect.value = 'ALL';
    }
}

function populateSwimmersDropdowns(data) {
    const swimmerSelect = document.getElementById('swimmers-name-select');
    if (!data || !data.length) return;

    if (swimmerSelect && swimmerSelect.options.length <= 2) {
        const uniqueSwimmers = Array.from(new Set(data.map(r => r.swimmerName).filter(Boolean))).sort();
        swimmerSelect.innerHTML = '<option value="NONE" selected>👤 Choose a Swimmer...</option><option value="ALL">All Swimmers (A-Z)</option>';
        uniqueSwimmers.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            swimmerSelect.appendChild(opt);
        });
        swimmerSelect.value = 'NONE';
    }

    updateEventOptions('NONE');
}

function getCourse(r) {
    if (!r) return 'SC';
    const c = r.calculatedCourse || r.course || 'SC';
    return (c.toUpperCase() === 'LC' || c.toUpperCase() === 'LONG COURSE') ? 'LC' : 'SC';
}

function getCountyInfoForSwimmer(swimmerName, seNumber) {
    if (!COUNTY_SUMMARY || !COUNTY_SUMMARY.length) return null;

    const row = COUNTY_SUMMARY.find(r => {
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const name = getRowVal(r, ['Swimmer Name', 'Name']);
        if (seNumber && asa && String(asa) === String(seNumber)) return true;
        if (swimmerName && name && name.toLowerCase() === swimmerName.toLowerCase()) return true;
        return false;
    });

    if (!row) return null;

    const qualifiedCount = Number(getRowVal(row, ['Qualified Events Count', 'Qualified'])) || 0;
    const qualifiedEvents = [];
    const slowerEvents = [];

    for (let i = 1; i <= 15; i++) {
        const val = getRowVal(row, [`Event ${i}`, `Event_${i}`]);
        if (val) {
            if (val.includes('(Qualified)')) {
                qualifiedEvents.push(val.replace('(Qualified)', '').trim());
            } else if (val.includes('(Slower)')) {
                slowerEvents.push(val.replace('(Slower)', '').trim());
            }
        }
    }

    return {
        qualifiedCount,
        qualifiedEvents,
        slowerEvents,
        rawRow: row
    };
}

const EVENT_STROKE_MAP = {
  "50 Freestyle": 1, "100 Freestyle": 2, "200 Freestyle": 3, "400 Freestyle": 4,
  "800 Freestyle": 5, "1500 Freestyle": 6,
  "50 Breaststroke": 7, "100 Breaststroke": 8, "200 Breaststroke": 9,
  "50 Butterfly": 10, "100 Butterfly": 11, "200 Butterfly": 12,
  "50 Backstroke": 13, "100 Backstroke": 14, "200 Backstroke": 15,
  "200 IM": 16, "200 Individual Medley": 16,
  "400 IM": 17, "400 Individual Medley": 17,
  "100 IM": 18, "100 Individual Medley": 18
};

function buildSwimEnglandHistoryUrl(seNumber, eventName, course = 'S') {
  if (!seNumber) return '';
  if (!eventName || eventName === 'ALL') {
    return `https://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=${seNumber}&mode=A`;
  }

  const cleanEvent = eventName.replace(/\s+/g, ' ').trim();
  const tstroke = EVENT_STROKE_MAP[cleanEvent] || 1;
  const tcourse = (String(course).toUpperCase().includes('L')) ? 'L' : 'S';

  return `https://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=${seNumber}&mode=A&tstroke=${tstroke}&tcourse=${tcourse}`;
}

function updateExternalHistoryLinks(seNumber, selectedEvent) {
  const lcUrl = buildSwimEnglandHistoryUrl(seNumber, selectedEvent, 'L');
  const scUrl = buildSwimEnglandHistoryUrl(seNumber, selectedEvent, 'S');

  const lcLinkElem = document.getElementById('se-lc-history-link');
  const scLinkElem = document.getElementById('se-sc-history-link');

  if (lcLinkElem) lcLinkElem.href = lcUrl;
  if (scLinkElem) scLinkElem.href = scUrl;
}

function checkCountyStatusForRecord(swimmerName, seNumber, eventName) {
    const countyInfo = getCountyInfoForSwimmer(swimmerName, seNumber);
    if (!countyInfo) return null;

    const cleanEventName = (eventName || '').toLowerCase().replace(/^(50m|100m|200m|400m|800m|1500m)\s+/, '').trim();

    const isQual = countyInfo.qualifiedEvents.some(evt => {
        const cleanEvt = evt.toLowerCase();
        return cleanEvt.includes(cleanEventName) || cleanEventName.includes(cleanEvt);
    });

    if (isQual) return 'QUALIFIED';

    const isSlow = countyInfo.slowerEvents.some(evt => {
        const cleanEvt = evt.toLowerCase();
        return cleanEvt.includes(cleanEventName) || cleanEventName.includes(cleanEvt);
    });

    if (isSlow) return 'SLOWER';

    return null;
}

const SWIMMER_EVENT_ORDER = [
    "50 Freestyle", "100 Freestyle", "200 Freestyle", "400 Freestyle", "800 Freestyle", "1500 Freestyle",
    "50 Backstroke", "100 Backstroke", "200 Backstroke",
    "50 Breaststroke", "100 Breaststroke", "200 Breaststroke",
    "50 Butterfly", "100 Butterfly", "200 Butterfly",
    "100 Individual Medley", "100 IM", "200 Individual Medley", "200 IM", "400 Individual Medley", "400 IM"
];

function getEventSortIndex(evtName) {
    if (!evtName) return 99;
    const clean = String(evtName).trim();
    const idx = SWIMMER_EVENT_ORDER.indexOf(clean);
    return idx !== -1 ? idx : 99;
}

function sortSwimmerRecords(records, isAllSwimmers) {
    return records.sort((a, b) => {
        if (isAllSwimmers) {
            const nameA = (a.swimmerName || '').trim();
            const nameB = (b.swimmerName || '').trim();
            const nameCmp = nameA.localeCompare(nameB);
            if (nameCmp !== 0) return nameCmp;
        }

        const posA = getEventSortIndex(a.event);
        const posB = getEventSortIndex(b.event);
        if (posA !== posB) return posA - posB;

        const evtCmp = (a.event || '').localeCompare(b.event || '');
        if (evtCmp !== 0) return evtCmp;

        const dateA = parseRecordDate(a.date) || new Date(0);
        const dateB = parseRecordDate(b.date) || new Date(0);
        return dateB - dateA;
    });
}

function extractFastestPBs(records) {
    const pbMap = {};
    records.forEach(r => {
        const cCourse = getCourse(r);
        const name = r.swimmerName || 'SWIMMER';
        const key = `${name}_${r.event}_${cCourse}`;
        const tSec = Number(r.timeSec) || 999999;

        if (!pbMap[key] || tSec < (Number(pbMap[key].timeSec) || 999999)) {
            pbMap[key] = { ...r, isPB: true };
        }
    });

    return Object.values(pbMap);
}

function renderSwimmersDashboard(data) {
    const tbody = document.querySelector('#swimmers-table tbody');
    if (!tbody) return;

    const bannerContainer = document.getElementById('swimmer-summary-banner');
    const selectedSwimmer = document.getElementById('swimmers-name-select')?.value;
    const qVal = (document.getElementById('swimmers-search')?.value || '').trim();

    if (bannerContainer) {
        if (selectedSwimmer === 'NONE') {
            bannerContainer.innerHTML = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 2rem 1.5rem; text-align: center; margin-bottom: 1.25rem;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🏊‍♀️</div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">Swimmer Profile & Performance Portal</h3>
                    <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 520px; margin: 0 auto; line-height: 1.5;">
                        Please select a swimmer from the <strong>Choose a Swimmer...</strong> dropdown above to view personal bests, Somerset County QTs, and Swim England progression graphs.
                    </p>
                </div>
            `;
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:2.5rem;">Please select a swimmer from the dropdown above to view records.</td></tr>';
            return;
        } else if (selectedSwimmer && selectedSwimmer !== 'ALL' && selectedSwimmer !== 'NONE') {
            const cInfo = getCountyInfoForSwimmer(selectedSwimmer);
            if (cInfo && cInfo.qualifiedCount > 0) {
                bannerContainer.innerHTML = `
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--accent-emerald); border-radius: 10px; padding: 0.85rem 1.25rem; display:flex; align-items:center; gap:0.85rem;">
                        <span style="font-size:1.6rem;">🏆</span>
                        <div>
                            <div style="font-weight:700; color:var(--accent-emerald); font-size:0.95rem;">Somerset County Championship Qualifier</div>
                            <div style="font-size:0.85rem; color:var(--text-main); margin-top:0.15rem;">
                                Qualified for <strong>${cInfo.qualifiedCount} events</strong>: ${cInfo.qualifiedEvents.join(', ')}
                            </div>
                        </div>
                    </div>
                `;
            } else if (cInfo) {
                bannerContainer.innerHTML = `
                    <div style="background: rgba(148,163,184,0.08); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem 1.25rem; font-size:0.85rem; color:var(--text-muted);">
                        🏆 Somerset County Times: 0 Qualified Events (${cInfo.slowerEvents.length} events tracked)
                    </div>
                `;
            } else {
                bannerContainer.innerHTML = '';
            }
        } else {
            bannerContainer.innerHTML = '';
        }
    }

    // Update Overview Badge if present
    const fullData = RAW_SWIMMERS_DATA || data || [];
    const totalRecords = fullData.length;
    const overviewBadge = document.getElementById('overview-swimmers-badge');
    if (overviewBadge) overviewBadge.innerText = `${totalRecords.toLocaleString()} Raw Times`;

    if (!data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:3rem;">No matching swimmer records found.</td></tr>';
        return;
    }

    // Performance optimization: render first 300 rows if un-filtered to avoid DOM sluggishness
    const displayRows = data.slice(0, 300);

    tbody.innerHTML = displayRows.map(r => {
        const course = getCourse(r);
        const courseBadge = course === 'LC'
            ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">50m (LC)</span>`
            : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">25m (SC)</span>`;

        const waPoints = r.waPoints ? `<span style="color:${r.waPoints >= 400 ? 'var(--accent-emerald)' : 'var(--text-main)'}; font-weight:700;">${r.waPoints}</span>` : '-';
        const dateStr = formatDateDDMMYYYY(r.date);
        const venueMeet = [r.meetName, r.venue].filter(Boolean).join(' • ');

        const swimmerLink = r.swimmerName 
            ? `<a href="javascript:void(0)" onclick="openSwimmerModal('${r.seNumber || ''}', '${r.swimmerName.replace(/'/g, "\\'")}')" style="color:var(--text-main); font-weight:700; text-decoration:none; border-bottom:1px dashed var(--accent-cyan);" title="Click to view all PBs for ${r.swimmerName}">${r.swimmerName} 👤</a>`
            : '-';

        const seEventUrl = buildSwimEnglandHistoryUrl(r.seNumber, r.event, course);
        const seLink = r.seNumber
            ? `<a href="${seEventUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline;" title="Open official Swim England event history for ${r.event}">${r.seNumber} 🔗</a>`
            : '-';

        const cStatus = checkCountyStatusForRecord(r.swimmerName, r.seNumber, r.event);
        const countyBadge = cStatus === 'QUALIFIED'
            ? `<span style="background:rgba(16,185,129,0.15); color:var(--accent-emerald); border:1px solid var(--accent-emerald); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">🏆 Qualified</span>`
            : (cStatus === 'SLOWER' ? `<span style="color:var(--text-muted); font-size:0.75rem;">Slower</span>` : '-');

        const pbTag = r.isPB 
            ? `<span style="background:rgba(245,158,11,0.2); color:var(--accent-amber); border:1px solid var(--accent-amber); font-size:0.65rem; padding:0.08rem 0.35rem; border-radius:4px; margin-left:0.3rem; font-weight:800;">⭐ PB</span>`
            : '';

        return `
            <tr>
                <td>${swimmerLink}</td>
                <td style="font-family:monospace;">${seLink}</td>
                <td style="font-weight:600;">${r.event || '-'}</td>
                <td>${courseBadge}</td>
                <td style="font-family:monospace; font-weight:700; color:var(--accent-cyan);">${r.displayTime || '-'}${pbTag}</td>
                <td style="font-family:monospace; color:var(--text-muted);">${r.convertedTime || '-'}</td>
                <td>${waPoints}</td>
                <td style="color:var(--text-muted);">${dateStr}</td>
                <td style="color:var(--text-muted); font-size:0.8rem; max-width:230px; overflow:hidden; text-overflow:ellipsis;" title="${venueMeet}">${venueMeet}</td>
                <td>${countyBadge}</td>
            </tr>
        `;
    }).join('');
}

function openSwimmerModal(seNum, name) {
    const records = RAW_SWIMMERS_DATA.filter(r => (r.seNumber && String(r.seNumber) === String(seNum)) || (r.swimmerName && r.swimmerName.toLowerCase() === (name || '').toLowerCase()));
    if (!records.length) return;

    const swimmerName = records[0].swimmerName || name;
    const seNumber = records[0].seNumber || seNum;

    const titleElem = document.getElementById('swimmer-modal-name');
    const subElem = document.getElementById('swimmer-modal-sub');
    if (titleElem) titleElem.innerText = `🏊 ${swimmerName} - Personal Bests`;
    if (subElem) {
        const lcHistoryUrl = buildSwimEnglandHistoryUrl(seNumber, '50 Freestyle', 'L');
        const scHistoryUrl = buildSwimEnglandHistoryUrl(seNumber, '50 Freestyle', 'S');
        subElem.innerHTML = `SE Number: <strong style="color:var(--accent-cyan);">${seNumber}</strong> &bull; <a href="https://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=${seNumber}&mode=A" target="_blank" rel="noopener noreferrer" style="color:var(--accent-blue); text-decoration:underline;">Official Swim England Page 🔗</a> &bull; <a href="${lcHistoryUrl}" id="se-lc-history-link" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline;">LC Progression 📊</a> &bull; <a href="${scHistoryUrl}" id="se-sc-history-link" target="_blank" rel="noopener noreferrer" style="color:var(--accent-amber); text-decoration:underline;">SC Progression 📊</a>`;
    }

    const cInfo = getCountyInfoForSwimmer(swimmerName, seNumber);
    const countyBannerHTML = (cInfo && cInfo.qualifiedCount > 0)
        ? `
            <div style="background: rgba(16,185,129,0.12); border: 1px solid var(--accent-emerald); border-radius: 10px; padding: 0.85rem 1.15rem; margin-bottom: 1rem; display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.5rem;">🏆</span>
                <div>
                    <div style="font-weight:700; color:var(--accent-emerald); font-size:0.95rem;">Somerset County Championship Qualifier</div>
                    <div style="font-size:0.85rem; color:var(--text-main); margin-top:0.15rem;">
                        Qualified for <strong>${cInfo.qualifiedCount} events</strong>: ${cInfo.qualifiedEvents.join(', ')}
                    </div>
                </div>
            </div>
        ` : '';

    // Group PBs by Event & Course (find fastest time for each event/course combo)
    const pbMap = {};
    records.forEach(r => {
        const cCourse = getCourse(r);
        const key = `${r.event}_${cCourse}`;
        const tSec = Number(r.timeSec) || 999999;
        if (!pbMap[key] || tSec < (Number(pbMap[key].timeSec) || 999999)) {
            pbMap[key] = r;
        }
    });

    const pbList = Object.values(pbMap).sort((a, b) => (a.event || '').localeCompare(b.event || ''));

    const bodyElem = document.getElementById('swimmer-modal-body');
    if (bodyElem) {
        bodyElem.innerHTML = `
            ${countyBannerHTML}
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
                ${pbList.map(pb => {
                    const cCourse = getCourse(pb);
                    const courseBadge = cCourse === 'LC'
                        ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">50m (LC)</span>`
                        : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">25m (SC)</span>`;
                    
                    const cStatus = checkCountyStatusForRecord(swimmerName, seNumber, pb.event);
                    const countyCardBadge = cStatus === 'QUALIFIED'
                        ? `<span style="background:rgba(16,185,129,0.15); color:var(--accent-emerald); border:1px solid var(--accent-emerald); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">🏆 County QT</span>`
                        : '';

                    const seCardUrl = buildSwimEnglandHistoryUrl(seNumber, pb.event, cCourse);

                    return `
                        <div style="background: rgba(15,23,42,0.6); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                                <span style="font-weight:700; font-size:0.85rem;">${pb.event}</span>
                                <div style="display:flex; gap:0.25rem;">${courseBadge}${countyCardBadge}</div>
                            </div>
                            <div style="font-family:monospace; font-size:1.25rem; font-weight:800; color:var(--accent-cyan); margin: 0.25rem 0;">
                                ${pb.displayTime || '-'}
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">
                                ${formatDateDDMMYYYY(pb.date)} ${pb.waPoints ? `&bull; <strong style="color:var(--accent-emerald);">${pb.waPoints} pts</strong>` : ''}
                            </div>
                            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${pb.meetName || ''}">
                                ${pb.meetName || '-'}
                            </div>
                            <div style="margin-top:0.45rem; padding-top:0.35rem; border-top:1px dashed rgba(255,255,255,0.1); font-size:0.725rem;">
                                <a href="${seCardUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600;">📊 SE Progression 🔗</a>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    document.getElementById('swimmer-profile-modal')?.classList.remove('hidden');
}

function closeSwimmerModal() {
    document.getElementById('swimmer-profile-modal')?.classList.add('hidden');
}

function filterSwimmers() {
    const swimmerSelect = document.getElementById('swimmers-name-select');
    const swimmerName = swimmerSelect?.value || 'NONE';

    if (swimmerName === 'NONE') {
        renderSwimmersDashboard([]);
        return;
    }

    updateEventOptions(swimmerName);

    const modeVal = document.getElementById('swimmers-mode-select')?.value || 'PB';
    const eventVal = document.getElementById('swimmers-event-select')?.value || 'ALL';
    const courseVal = document.getElementById('swimmers-course-select')?.value || 'ALL';
    const countyVal = document.getElementById('swimmers-county-select')?.value || 'ALL';
    const timeframeVal = document.getElementById('swimmers-timeframe-select')?.value || 'ALL';

    let cutoffDate = null;
    let seasonYear = null;
    const now = new Date();

    if (timeframeVal === '12M') {
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (timeframeVal === '6M') {
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else if (timeframeVal === '2026') {
        seasonYear = 2026;
    }

    let filtered = RAW_SWIMMERS_DATA.filter(r => {
        const matchesName = swimmerName === 'ALL' || (r.swimmerName || '') === swimmerName;
        const matchesEvent = eventVal === 'ALL' || (r.event || '') === eventVal;
        const matchesCourse = courseVal === 'ALL' || getCourse(r) === courseVal;
        const matchesCounty = countyVal === 'ALL' || (countyVal === 'QUALIFIED' && checkCountyStatusForRecord(r.swimmerName, r.seNumber, r.event) === 'QUALIFIED');

        let matchesTimeframe = true;
        if (cutoffDate || seasonYear) {
            const recDate = parseRecordDate(r.date);
            if (!recDate) {
                matchesTimeframe = false;
            } else if (cutoffDate && recDate < cutoffDate) {
                matchesTimeframe = false;
            } else if (seasonYear && recDate.getFullYear() !== seasonYear) {
                matchesTimeframe = false;
            }
        }

        return matchesName && matchesEvent && matchesCourse && matchesCounty && matchesTimeframe;
    });

    if (modeVal === 'PB') {
        filtered = extractFastestPBs(filtered);
    }

    sortSwimmerRecords(filtered, swimmerName === 'ALL');

    renderSwimmersDashboard(filtered);
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
    container.innerHTML = cols.map(col => {
        const parts = col.split(/\r?\n/);
        const title = parts[0];
        const schedule = parts.slice(1).join(' • ');

        const headerHTML = schedule 
            ? `${title}<div style="font-size:0.75rem; font-weight:600; color:var(--accent-cyan); margin-top:0.35rem;">⏰ ${schedule}</div>`
            : title;

        const members = [];
        let extraScheduleNote = '';

        SQUAD_LIST_DATA.forEach(r => {
            const val = (r[col] || '').trim();
            if (!val) return;

            const hasNumbers = /\d/.test(val);
            const hasKeyword = /\b(sat|saturday|sun|sunday|mon|tue|wed|thu|fri|am|pm|session)\b/i.test(val);

            if (hasNumbers && hasKeyword) {
                extraScheduleNote = val;
            } else {
                members.push(val);
            }
        });

        const extraBadge = extraScheduleNote 
            ? `<div style="background:rgba(245,158,11,0.15); border:1px solid var(--accent-amber); color:var(--accent-amber); padding:0.4rem 0.6rem; border-radius:6px; font-weight:700; font-size:0.75rem; margin-bottom:0.6rem; text-align:center;">🗓️ ${extraScheduleNote}</div>` 
            : '';

        return `
            <div class="squad-column">
                <h3>${headerHTML}</h3>
                ${extraBadge}
                ${members.map(m => `<div class="squad-member">${m}</div>`).join('')}
            </div>
        `;
    }).join('');
}

// 9. MEET CALENDAR MODULE
function renderCalendar(data) {
    const tbody = document.getElementById('calendar-table-body');
    const calendarList = data || CALENDAR_DATA || [];
    if (!tbody) return;

    // Update Overview Card Badge if present
    const calendarBadge = document.getElementById('overview-calendar-badge');
    if (calendarBadge) calendarBadge.innerText = `${CALENDAR_DATA.length} Events Scheduled`;

    if (!calendarList.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:2rem;">No gala or calendar events found.</td></tr>';
        return;
    }

    tbody.innerHTML = calendarList.map(c => {
        const rawDate = getRowVal(c, ['Date', 'Gala Date', 'Day', 'Start Date', 'Date ']);
        const formattedDate = formatDateDDMMYYYY(rawDate);
        const eventTitle = getRowVal(c, ['Event', 'Event ', 'Gala', 'Meet', 'Title', 'Event Title', 'Competition']);
        const venue = getRowVal(c, ['Where', 'Venue', 'Location', 'Pool', 'Where ']);

        return `
            <tr>
                <td style="font-weight:700; color:var(--accent-amber); font-family:monospace;">${formattedDate}</td>
                <td style="font-weight:600; color:var(--text-main);">${eventTitle || '-'}</td>
                <td style="color:var(--text-muted);">${venue || '-'}</td>
            </tr>
        `;
    }).join('');
}

function filterCalendar() {
    const q = (document.getElementById('calendar-search')?.value || '').toLowerCase().trim();
    if (!q) {
        renderCalendar(CALENDAR_DATA);
        return;
    }

    const filtered = CALENDAR_DATA.filter(c => {
        const dateStr = getRowVal(c, ['Date', 'Gala Date', 'Day', 'Start Date', 'Date ']);
        const eventTitle = getRowVal(c, ['Event', 'Event ', 'Gala', 'Meet', 'Title', 'Event Title', 'Competition']);
        const venue = getRowVal(c, ['Where', 'Venue', 'Location', 'Pool', 'Where ']);

        const fullText = [dateStr, formatDateDDMMYYYY(dateStr), eventTitle, venue].join(' ').toLowerCase();
        return fullText.includes(q);
    });

    renderCalendar(filtered);
}

// 10. CLUB NOTICES & ANNOUNCEMENTS MODULE
let NOTICES_DATA = [];

const GOOGLE_DOC_NOTICES_URL = 'https://docs.google.com/document/d/162h7jE0QUw0hVjhIOxveD9fqOItu9tVwBC5eBA70iyA/export?format=txt';

const DEFAULT_NOTICES = [
    {
        title: "Somerset County Championships 2026 Entries",
        date: "20/08/2026",
        priority: "Urgent",
        summary: "Closing date for Somerset County Championship entry submissions is Friday 12th September.",
        content: "Swimmers and parents please check your Somerset County QT badges on the Swimmers Dashboard to verify qualified events. Entry confirmations must be submitted to the team manager prior to 5:00 PM on Friday 12th September.",
        linkUrl: "javascript:void(0)",
        linkOnClick: "switchView('swimmers')",
        linkText: "Check County Times 🏆"
    },
    {
        title: "Autumn Squad Training Schedule & Pool Update",
        date: "15/08/2026",
        priority: "Info",
        summary: "Training schedules at Hutton Moor for Performance and Development squads.",
        content: "Squad training times for the autumn term remain unchanged. Please ensure all swimmers arrive 10 minutes prior to session start times with full training equipment.",
        linkUrl: "",
        linkOnClick: "",
        linkText: ""
    }
];

function parseGoogleDocNotices(rawText) {
    if (!rawText) return [];
    const cleanText = rawText.replace(/\uFEFF/g, '').trim();
    const blocks = cleanText.split(/(?=\bPRIORITY\s*:)/i).filter(b => b.trim());
    return blocks.map(block => {
        const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const notice = {};
        lines.forEach(line => {
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim().toUpperCase();
                const val = line.substring(colonIdx + 1).trim();
                if (key === 'PRIORITY') notice.priority = (val.toLowerCase().includes('urg') ? 'Urgent' : 'Info');
                else if (key === 'TITLE') notice.title = val;
                else if (key === 'DATE' || key === 'EVENTDATE') notice.date = val;
                else if (key === 'SUMMARY') notice.summary = val;
                else if (key === 'ENTRY' || key === 'CONTENT' || key === 'DETAILS') notice.content = val;
            }
        });
        if (notice.title) {
            if (!notice.priority) notice.priority = 'Info';
            if (!notice.summary) notice.summary = notice.content || notice.title;
            if (!notice.content) notice.content = notice.summary;
            return notice;
        }
        return null;
    }).filter(Boolean);
}

async function loadGoogleDocNotices() {
    try {
        const response = await fetch(GOOGLE_DOC_NOTICES_URL + '&t=' + Date.now());
        if (response.ok) {
            const text = await response.text();
            const parsed = parseGoogleDocNotices(text);
            if (parsed && parsed.length > 0) {
                NOTICES_DATA = parsed;
                const noticesBadge = document.getElementById('overview-notices-badge');
                if (noticesBadge) {
                    noticesBadge.innerText = `${NOTICES_DATA.length} Active Notice${NOTICES_DATA.length === 1 ? '' : 's'}`;
                }
                renderTopAnnouncementBanner();
            }
        }
    } catch (err) {
        console.warn("Could not fetch live Google Doc notices, falling back to local dataset:", err);
    }
}

function renderClubNotices() {
    const rawNotices = getDataset(window.MASTER_DASHBOARD_DATA || {}, ["Notices", "Club Notices", "Announcements", "Club News", "News"]);
    NOTICES_DATA = (rawNotices && rawNotices.length) ? rawNotices : DEFAULT_NOTICES;

    const noticesBadge = document.getElementById('overview-notices-badge');
    if (noticesBadge) {
        noticesBadge.innerText = `${NOTICES_DATA.length} Active Notice${NOTICES_DATA.length === 1 ? '' : 's'}`;
    }

    renderTopAnnouncementBanner();
    loadGoogleDocNotices();
}

function renderTopAnnouncementBanner() {
    const bannerContainer = document.getElementById('top-announcement-banner');
    if (!bannerContainer || !NOTICES_DATA.length) return;

    if (sessionStorage.getItem('dismissed_top_banner') === 'true') {
        bannerContainer.innerHTML = '';
        return;
    }

    const topNotice = NOTICES_DATA.find(n => (getRowVal(n, ['Priority', 'Type']).toLowerCase() === 'urgent')) || NOTICES_DATA[0];
    if (!topNotice) return;

    const title = getRowVal(topNotice, ['Title', 'Heading', 'Notice']) || topNotice.title;
    const summary = getRowVal(topNotice, ['Summary', 'Short Message', 'Message']) || topNotice.summary || topNotice.content;
    const dateStr = formatDateDDMMYYYY(getRowVal(topNotice, ['Date', 'Created']) || topNotice.date);
    const priority = getRowVal(topNotice, ['Priority', 'Type']) || topNotice.priority || 'Info';
    
    const isUrgent = priority.toLowerCase() === 'urgent';
    const bgStyle = isUrgent 
        ? 'background: rgba(239,68,68,0.12); border: 1px solid var(--accent-rose);' 
        : 'background: rgba(245,158,11,0.12); border: 1px solid var(--accent-amber);';
    
    const icon = isUrgent ? '🚨' : '📢';
    const badgeColor = isUrgent ? 'var(--accent-rose)' : 'var(--accent-amber)';

    bannerContainer.innerHTML = `
        <div style="${bgStyle} border-radius: 12px; padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 260px;">
                <span style="font-size: 1.5rem;">${icon}</span>
                <div>
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap: wrap;">
                        <span style="background: ${badgeColor}; color: #0f172a; font-weight: 800; font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 4px; text-transform: uppercase;">${priority}</span>
                        <strong style="color: var(--text-main); font-size: 0.95rem;">${title}</strong>
                        <span style="color: var(--text-muted); font-size: 0.75rem;">(${dateStr})</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">
                        ${summary}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                <button onclick="openNoticesModal()" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">Read Details 📖</button>
                <button onclick="dismissTopBanner()" style="background: none; border: none; color: var(--text-muted); font-size: 1.25rem; cursor: pointer;" title="Dismiss banner">&times;</button>
            </div>
        </div>
    `;
}

function dismissTopBanner() {
    sessionStorage.setItem('dismissed_top_banner', 'true');
    const container = document.getElementById('top-announcement-banner');
    if (container) container.innerHTML = '';
}

function openNoticesModal() {
    const bodyElem = document.getElementById('notices-modal-body');
    if (!bodyElem) return;

    const list = NOTICES_DATA.length ? NOTICES_DATA : DEFAULT_NOTICES;

    bodyElem.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${list.map(n => {
                const title = getRowVal(n, ['Title', 'Heading', 'Notice']) || n.title;
                const dateStr = formatDateDDMMYYYY(getRowVal(n, ['Date', 'Created']) || n.date);
                const priority = getRowVal(n, ['Priority', 'Type']) || n.priority || 'Info';
                const content = getRowVal(n, ['Content', 'Message', 'Details', 'Body']) || n.content || n.summary;
                const linkText = getRowVal(n, ['Link Text', 'Button Text']) || n.linkText;
                const linkUrl = getRowVal(n, ['Link URL', 'URL', 'Link']) || n.linkUrl;
                const linkOnClick = n.linkOnClick || '';

                const isUrgent = priority.toLowerCase() === 'urgent';
                const borderStyle = isUrgent ? 'border-left: 4px solid var(--accent-rose);' : 'border-left: 4px solid var(--accent-amber);';
                const tagColor = isUrgent ? 'background: rgba(239,68,68,0.2); color: var(--accent-rose);' : 'background: rgba(245,158,11,0.2); color: var(--accent-amber);';

                const actionButton = (linkText && (linkUrl || linkOnClick))
                    ? `<a href="${linkUrl || 'javascript:void(0)'}" ${linkOnClick ? `onclick="${linkOnClick}; closeNoticesModal();"` : ''} style="display:inline-block; margin-top:0.6rem; background: rgba(6,182,212,0.15); color: var(--accent-cyan); border: 1px solid var(--accent-cyan); padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; text-decoration: none;">${linkText}</a>`
                    : '';

                return `
                    <div style="background: rgba(15,23,42,0.6); border: 1px solid var(--border-color); ${borderStyle} border-radius: 10px; padding: 1.1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.4rem;">
                            <span style="${tagColor} font-weight: 800; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; text-transform: uppercase;">${priority}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${dateStr}</span>
                        </div>
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem;">${title}</h4>
                        <div style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5;">
                            ${content}
                        </div>
                        ${actionButton}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('notices-modal')?.classList.remove('hidden');
}

function closeNoticesModal() {
    document.getElementById('notices-modal')?.classList.add('hidden');
}

const GOOGLE_SHEET_SQUAD_CSV_URL = 'https://docs.google.com/spreadsheets/d/1J29UMv1JGfz0cemI3sMgCOierIhe8wM0Kik3p5j9ork/export?format=csv&gid=381588361';

function parseCsvToObjects(csvText) {
    if (!csvText) return [];
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length <= 1) return [];
    
    let headerIdx = 0;
    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (parts.filter(Boolean).length > 2 && !parts.some(p => p.toLowerCase().includes('weston sc'))) {
            headerIdx = i;
            break;
        }
    }
    
    const headers = lines[headerIdx].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const dataObjects = [];
    
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        const rowObj = {};
        headers.forEach((h, idx) => {
            if (h) rowObj[h] = cols[idx] || '';
        });
        if (Object.values(rowObj).some(Boolean)) {
            dataObjects.push(rowObj);
        }
    }
    return dataObjects;
}

async function loadLiveSquadMovements() {
    try {
        const response = await fetch(GOOGLE_SHEET_SQUAD_CSV_URL + '&t=' + Date.now());
        if (response.ok) {
            const csvText = await response.text();
            const parsed = parseCsvToObjects(csvText);
            if (parsed && parsed.length > 0) {
                SQUAD_LIST_DATA = parsed;
                if (document.getElementById('squad-grid')) renderSquadList();
                if (document.querySelector('#swimmers-table tbody')) {
                    populateSwimmersDropdowns(RAW_SWIMMERS_DATA);
                }
            }
        }
    } catch (e) {
        console.warn("Could not load live Google Sheet Squad Movements, using local dataset fallback:", e);
    }
}

// Global functions for inline HTML events
window.switchView = switchView;
window.filterSwimmers = filterSwimmers;
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
window.filterCalendar = filterCalendar;
window.EVENT_STROKE_MAP = EVENT_STROKE_MAP;
window.buildSwimEnglandHistoryUrl = buildSwimEnglandHistoryUrl;
window.updateExternalHistoryLinks = updateExternalHistoryLinks;
window.openSwimmerModal = openSwimmerModal;
window.closeSwimmerModal = closeSwimmerModal;
window.openNoticesModal = openNoticesModal;
window.closeNoticesModal = closeNoticesModal;
window.dismissTopBanner = dismissTopBanner;
window.toggleMobileSidebar = toggleMobileSidebar;

// Attach initialization handlers safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

window.addEventListener('load', initDashboard);