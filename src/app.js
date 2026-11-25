// WESTON SC - SWIMMERS & PARENTS HUB APP ENGINE
let RAW_SWIMMERS_DATA = (typeof RAW_DATA !== 'undefined' && RAW_DATA.length) 
    ? RAW_DATA 
    : (typeof window !== 'undefined' && window.RAW_DATA ? window.RAW_DATA : []);
if (typeof window !== 'undefined') {
    window.RAW_SWIMMERS_DATA = RAW_SWIMMERS_DATA;
}
let SQUAD_LIST_DATA = [];
let CALENDAR_DATA = [];
let COUNTY_SUMMARY = [];
let BSG_SUMMARY = [];
let DEVLOP_DATA = [];

// Remote Google Doc Config / Feature Flags
let APP_SETTINGS = {
    showCounty: true,
    showBSG: true,
    showDevlop: true
};

function parseGoogleDocSettings(rawText) {
    if (!rawText) return null;
    const settings = { ...APP_SETTINGS };
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let found = false;
    lines.forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
            const key = line.substring(0, colonIdx).trim().toUpperCase();
            const val = line.substring(colonIdx + 1).trim().toUpperCase();
            if (key === 'SHOW_COUNTY') { settings.showCounty = (val === 'ON' || val === 'TRUE' || val === 'YES' || val === '1'); found = true; }
            else if (key === 'SHOW_BSG') { settings.showBSG = (val === 'ON' || val === 'TRUE' || val === 'YES' || val === '1'); found = true; }
            else if (key === 'SHOW_DEVLOP') { settings.showDevlop = (val === 'ON' || val === 'TRUE' || val === 'YES' || val === '1'); found = true; }
        }
    });
    return found ? settings : null;
}

function applyAppSettings() {
    const countySelect = document.getElementById('swimmers-county-select');
    if (countySelect) {
        countySelect.style.display = APP_SETTINGS.showCounty ? '' : 'none';
        if (!APP_SETTINGS.showCounty) countySelect.value = 'ALL';
    }
    const bsgSelect = document.getElementById('swimmers-bsg-select');
    if (bsgSelect) {
        bsgSelect.style.display = APP_SETTINGS.showBSG ? '' : 'none';
        if (!APP_SETTINGS.showBSG) bsgSelect.value = 'ALL';
    }
    const devlopSelect = document.getElementById('swimmers-devlop-select');
    if (devlopSelect) {
        devlopSelect.style.display = APP_SETTINGS.showDevlop ? '' : 'none';
        if (!APP_SETTINGS.showDevlop) devlopSelect.value = 'ALL';
    }

    const colCounty = document.getElementById('col-head-county');
    if (colCounty) colCounty.style.display = APP_SETTINGS.showCounty ? '' : 'none';
    const colBsg = document.getElementById('col-head-bsg');
    if (colBsg) colBsg.style.display = APP_SETTINGS.showBSG ? '' : 'none';
    const colDevlop = document.getElementById('col-head-devlop');
    if (colDevlop) colDevlop.style.display = APP_SETTINGS.showDevlop ? '' : 'none';
}


// 1. VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeTab = document.getElementById('tab-' + viewId);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');

    const titles = {
        'overview': ['Swimmers & Parents Hub', 'Track personal bests, Swim England event progression, squad allocations, and target meets.'],
        'swimmers': ['Swimmer PBs & Progression', 'Detailed performance history, personal bests, rolling 12-month form, and Swim England graphs.'],
        'countytimes': ['Somerset County Times', 'Somerset County Championship qualification tracker, swimmer entry status, and standards synced with Google Sheets.'],
        'qualifiers': ['County & Regional Qualifiers', 'Live qualification tracker against 2026/27 Somerset County and South West Regional benchmark standards (Competition Age as of 31/12/2027).'],
        'movements': ['Squad Movements & Training Schedules', 'Review current squad allocations, weekly pool training schedules, and weekend extra sessions.'],
        'calendar': ['Meet Calendar', 'Scheduled galas, target open meets, entry deadlines, and pool venues.']
    };

    if (titles[viewId] && document.getElementById('view-title')) {
        const titleElem = document.getElementById('view-title');
        const descElem = document.getElementById('view-desc');
        if (titleElem) titleElem.innerText = titles[viewId][0];
        if (descElem) descElem.innerText = titles[viewId][1];
    }

    if (viewId === 'countytimes') {
        renderCountyTimesDashboard();
    } else if (viewId === 'qualifiers') {
        renderQualifiersDashboard();
    } else if (viewId === 'calendar') {
        renderCalendar();
    }
}

// 2. HELPER UTILITIES
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

function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return '-';
    const s = String(dateStr).trim();
    const isoMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
    }
    const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmyMatch) {
        return `${dmyMatch[1].padStart(2, '0')}/${dmyMatch[2].padStart(2, '0')}/${dmyMatch[3]}`;
    }
    const parsedDate = new Date(s);
    if (!isNaN(parsedDate.getTime()) && !/^\d+$/.test(s)) {
        const day = String(parsedDate.getDate()).padStart(2, '0');
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const year = parsedDate.getFullYear();
        return `${day}/${month}/${year}`;
    }
    return s || '-';
}

function parseRecordDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const s = String(dateStr).trim().split('T')[0].split(' ')[0];

    const ddmmyyyy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (ddmmyyyy) {
        return new Date(parseInt(ddmmyyyy[3], 10), parseInt(ddmmyyyy[2], 10) - 1, parseInt(ddmmyyyy[1], 10));
    }
    const yyyymmdd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (yyyymmdd) {
        return new Date(parseInt(yyyymmdd[1], 10), parseInt(yyyymmdd[2], 10) - 1, parseInt(yyyymmdd[3], 10));
    }
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function getDataset(rawData, possibleNames) {
    if (!rawData || typeof rawData !== 'object') return [];
    for (const key of Object.keys(rawData)) {
        const cleanKey = key.trim().toLowerCase();
        for (const name of possibleNames) {
            if (cleanKey === name.trim().toLowerCase()) {
                return Array.isArray(rawData[key]) ? rawData[key] : [];
            }
        }
    }
    return [];
}

function getCourse(r) {
    if (!r) return 'SC';
    const c = r.calculatedCourse || r.course || 'SC';
    return (c.toUpperCase() === 'LC' || c.toUpperCase() === 'LONG COURSE') ? 'LC' : 'SC';
}

// 3. SWIM ENGLAND URL ENGINE
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

// 4. ACTIVE SQUAD ROSTER EXTRACTION
const DEFAULT_SQUAD_SWIMMER_NAMES = [
  'Alexie Tembey-Barnard', 'Alfie Coles', 'Alice Brueford', 'Amelia Wolanin', 'Annabel Livesey',
  'Arabella Collard', 'Austin Hodder', 'Ava Mitchard', 'Bella Davis', 'Bethany Thomas',
  'Billy Marshall', 'Callie Tucker', 'Cara Blackshaw', 'Cara Hobden', 'Chase Norman',
  'Edna Jacobs', 'Edward Moon', 'Elana Brayton', 'Eleonora Sorroche Baseotto', 'Emil Faradzov',
  'Emily Butcher', 'Erin Jones', 'Esme Ross', 'Eva Allen', 'Evie Wilkins',
  'Felicity Thomas', 'Freddie Marshall', 'Freya Hoare-Matthews', 'George Jeffries', 'Holly Butterfield',
  'Imogen Segal', 'Jasmine Lesego', 'Jennifer Le', 'Jessica Waller', 'Jonah Sowerbutts',
  'Kinga Dudzinska', 'Klaudia Dudzinska', 'Leo Holmes', 'Lily Lester', 'Lola Tembey Barnard',
  'Louis Thomas', 'Luca Watson', 'Max Shepherd', 'Maxi Vincent', 'Mia Rockman',
  'Oliver Ochoska', 'Oliver Waller', 'Olivia Cheung', 'Oscar Crow', 'Oskar Rabura',
  'Patrick Tobiasz', 'Quinn Margetts', 'Reuben Le', 'Rosie Livesey', 'Scarlett Bracewell Birks',
  'Seth Gould', 'Siena Blackshaw', 'Sophia Davis', 'Victor Tsang', 'Zac Oates'
];

function getActiveSquadSwimmerNames() {
    if (SQUAD_LIST_DATA && SQUAD_LIST_DATA.length) {
        const names = new Set();
        const cols = Object.keys(SQUAD_LIST_DATA[0]);
        cols.forEach(col => {
            SQUAD_LIST_DATA.forEach(r => {
                const val = (r[col] || '').trim();
                if (!val) return;
                if (val.toLowerCase().includes('max number') || val.toLowerCase().includes('squad') || val.toLowerCase().includes('weston')) return;
                const hasNumbers = /\d/.test(val);
                const hasKeyword = /\b(sat|saturday|sun|sunday|mon|tue|wed|thu|fri|am|pm|session)\b/i.test(val);
                if (!hasNumbers || !hasKeyword) {
                    names.add(val);
                }
            });
        });
        if (names.size > 0) {
            return Array.from(names).sort();
        }
    }
    return DEFAULT_SQUAD_SWIMMER_NAMES.slice().sort();
}

// 5. QUALIFICATION LOOKUPS (COUNTY, BSG L2, DEVLOP '26)
function getCountyInfoForSwimmer(swimmerName, seNumber) {
    if (!COUNTY_SUMMARY || !COUNTY_SUMMARY.length) return null;
    const row = COUNTY_SUMMARY.find(r => {
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const name = getRowVal(r, ['Swimmer Name', 'Name']);
        if (seNumber && asa && String(asa) === String(seNumber)) return true;
        if (swimmerName && name && (name.toLowerCase() === swimmerName.toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]/g, '') === swimmerName.toLowerCase().replace(/[^a-z0-9]/g, ''))) return true;
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
    return { qualifiedCount, qualifiedEvents, slowerEvents, rawRow: row };
}

function checkCountyStatusForRecord(swimmerName, seNumber, eventName) {
    const countyInfo = getCountyInfoForSwimmer(swimmerName, seNumber);
    if (!countyInfo) return null;
    const cleanEventName = (eventName || '').toLowerCase().replace(/^(50m|100m|200m|400m|800m|1500m)\s+/, '').trim();
    const isQual = countyInfo.qualifiedEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isQual) return 'QUALIFIED';
    const isSlow = countyInfo.slowerEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isSlow) return 'SLOWER';
    return null;
}

function getBSGInfoForSwimmer(swimmerName, seNumber) {
    if (!BSG_SUMMARY || !BSG_SUMMARY.length) return null;
    const row = BSG_SUMMARY.find(r => {
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const name = getRowVal(r, ['Swimmer Name', 'Name']);
        if (seNumber && asa && String(asa) === String(seNumber)) return true;
        if (swimmerName && name && (name.toLowerCase() === swimmerName.toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]/g, '') === swimmerName.toLowerCase().replace(/[^a-z0-9]/g, ''))) return true;
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
    return { qualifiedCount, qualifiedEvents, slowerEvents, rawRow: row };
}

function checkBSGStatusForRecord(swimmerName, seNumber, eventName) {
    const bsgInfo = getBSGInfoForSwimmer(swimmerName, seNumber);
    if (!bsgInfo) return null;
    const cleanEventName = (eventName || '').toLowerCase().replace(/^(50m|100m|200m|400m|800m|1500m)\s+/, '').trim();
    const isQual = bsgInfo.qualifiedEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isQual) return 'QUALIFIED';
    const isSlow = bsgInfo.slowerEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isSlow) return 'SLOWER';
    return null;
}

function getDevlopInfoForSwimmer(swimmerName, seNumber) {
    if (!DEVLOP_DATA || !DEVLOP_DATA.length) return null;
    const row = DEVLOP_DATA.find(r => {
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const name = getRowVal(r, ['Swimmer Name', 'Name']);
        if (seNumber && asa && String(asa) === String(seNumber)) return true;
        if (swimmerName && name && (name.toLowerCase() === swimmerName.toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]/g, '') === swimmerName.toLowerCase().replace(/[^a-z0-9]/g, ''))) return true;
        return false;
    });
    if (!row) return null;

    const eligibleEvents = [];
    const tooFastEvents = [];
    const slowerEvents = [];

    for (let i = 1; i <= 15; i++) {
        const val = getRowVal(row, [`Event ${i}`, `Event_${i}`]);
        if (val) {
            if (val.includes('(Too Fast)')) {
                tooFastEvents.push(val.replace('(Too Fast)', '').trim());
            } else if (val.includes('(Slower)')) {
                slowerEvents.push(val.replace('(Slower)', '').trim());
                eligibleEvents.push(val.replace('(Slower)', '').trim());
            } else {
                eligibleEvents.push(val.trim());
            }
        }
    }
    return { eligibleCount: eligibleEvents.length, eligibleEvents, tooFastEvents, slowerEvents, rawRow: row };
}

function checkDevlopStatusForRecord(swimmerName, seNumber, eventName) {
    const devInfo = getDevlopInfoForSwimmer(swimmerName, seNumber);
    if (!devInfo) return null;
    const cleanEventName = (eventName || '').toLowerCase().replace(/^(50m|100m|200m|400m|800m|1500m)\s+/, '').trim();
    const isTooFast = devInfo.tooFastEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isTooFast) return 'TOO_FAST';
    const isEligible = devInfo.eligibleEvents.some(evt => evt.toLowerCase().includes(cleanEventName) || cleanEventName.includes(evt.toLowerCase()));
    if (isEligible) return 'ELIGIBLE';
    return null;
}

// 6. SWIMMERS DASHBOARD MODULE
let currentSwimmerForEvents = null;

function updateEventOptions(swimmerName) {
    const eventSelect = document.getElementById('swimmers-event-select');
    if (!eventSelect) return;
    if (currentSwimmerForEvents === swimmerName) return;
    currentSwimmerForEvents = swimmerName;

    const previousSelected = eventSelect.value;
    let availableRecords = RAW_SWIMMERS_DATA;
    if (swimmerName && swimmerName !== 'ALL') {
        const targetClean = swimmerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        availableRecords = RAW_SWIMMERS_DATA.filter(r => {
            const recClean = (r.swimmerName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            return recClean === targetClean;
        });
    }
    const uniqueEvents = Array.from(new Set(availableRecords.map(r => r.event).filter(Boolean))).sort();

    eventSelect.innerHTML = '<option value="ALL">All Events</option>';
    uniqueEvents.forEach(evt => {
        const opt = document.createElement('option');
        opt.value = evt;
        opt.textContent = evt;
        eventSelect.appendChild(opt);
    });

    eventSelect.value = (previousSelected && uniqueEvents.includes(previousSelected)) ? previousSelected : 'ALL';
}

function populateSwimmersDropdowns(data, forceRefresh = false) {
    const swimmerSelect = document.getElementById('swimmers-name-select');
    if (!data || !data.length) return;

    if (swimmerSelect && (forceRefresh || swimmerSelect.options.length <= 2)) {
        const squadSwimmers = getActiveSquadSwimmerNames();
        const availableSwimmers = squadSwimmers.length > 0 
            ? squadSwimmers 
            : Array.from(new Set(data.map(r => r.swimmerName).filter(Boolean))).sort();

        const currentVal = swimmerSelect.value;

        swimmerSelect.innerHTML = '<option value="NONE">👤 Choose a Swimmer...</option><option value="ALL">All Swimmers (A-Z)</option>';
        availableSwimmers.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            swimmerSelect.appendChild(opt);
        });

        if (currentVal && Array.from(swimmerSelect.options).some(o => o.value === currentVal)) {
            swimmerSelect.value = currentVal;
        } else {
            swimmerSelect.value = 'NONE';
        }
    }
    updateEventOptions(swimmerSelect ? swimmerSelect.value : 'NONE');
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

    const activeCols = 9 + (APP_SETTINGS.showCounty ? 1 : 0) + (APP_SETTINGS.showBSG ? 1 : 0) + (APP_SETTINGS.showDevlop ? 1 : 0);

    if (bannerContainer) {
        if (selectedSwimmer === 'NONE') {
            bannerContainer.innerHTML = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 2rem 1.5rem; text-align: center; margin-bottom: 1.25rem;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🏊‍♀️</div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">Swimmer Profile & Performance Portal</h3>
                    <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 520px; margin: 0 auto; line-height: 1.5;">
                        Please select a swimmer from the <strong>Choose a Swimmer...</strong> dropdown above to view personal bests, Somerset County QTs, BSG L2 standards, and Swim England progression graphs.
                    </p>
                </div>
            `;
            tbody.innerHTML = `<tr><td colspan="${activeCols}" style="text-align:center; color:var(--text-muted); padding:2.5rem;">Please select a swimmer from the dropdown above to view records.</td></tr>`;
            return;
        } else if (selectedSwimmer && selectedSwimmer !== 'ALL' && selectedSwimmer !== 'NONE') {
            const cInfo = getCountyInfoForSwimmer(selectedSwimmer);
            const bsgInfo = getBSGInfoForSwimmer(selectedSwimmer);
            const devInfo = getDevlopInfoForSwimmer(selectedSwimmer);

            let bannerHTML = '';
            if (APP_SETTINGS.showCounty && cInfo && cInfo.qualifiedCount > 0) {
                bannerHTML += `
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--accent-emerald); border-radius: 10px; padding: 0.75rem 1.15rem; margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <span style="font-size:1.4rem;">🏆</span>
                            <div>
                                <div style="font-weight:700; color:var(--accent-emerald); font-size:0.9rem;">Somerset County Championship Qualifier</div>
                                <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                                    Qualified for <strong>${cInfo.qualifiedCount} events</strong>: ${cInfo.qualifiedEvents.join(', ')}
                                </div>
                            </div>
                        </div>
                        <button onclick="goToCountyTimesForSwimmer('${selectedSwimmer.replace(/'/g, "\\'")}')" style="background:rgba(16,185,129,0.2); border:1px solid var(--accent-emerald); color:var(--accent-emerald); padding:0.35rem 0.75rem; border-radius:6px; font-weight:700; font-size:0.75rem; cursor:pointer; margin-left:auto; white-space:nowrap;" title="View Somerset County Times Matrix">
                            🏆 View Somerset County Times →
                        </button>
                    </div>
                `;
            } else if (APP_SETTINGS.showCounty) {
                bannerHTML += `
                    <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; padding: 0.65rem 1.15rem; margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <span style="font-size:1.2rem;">🎯</span>
                            <div>
                                <div style="font-weight:700; color:var(--accent-purple); font-size:0.85rem;">Somerset County Championship Times</div>
                                <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.1rem;">
                                    Tracking qualifying times against 2026/27 Somerset County Championship standards.
                                </div>
                            </div>
                        </div>
                        <button onclick="goToCountyTimesForSwimmer('${selectedSwimmer.replace(/'/g, "\\'")}')" style="background:rgba(139,92,246,0.15); border:1px solid var(--accent-purple); color:var(--accent-purple); padding:0.35rem 0.75rem; border-radius:6px; font-weight:700; font-size:0.75rem; cursor:pointer; margin-left:auto; white-space:nowrap;" title="View Somerset County Times Matrix">
                            🏆 View Somerset County Times →
                        </button>
                    </div>
                `;
            }
            if (APP_SETTINGS.showBSG && bsgInfo && bsgInfo.qualifiedCount > 0) {
                bannerHTML += `
                    <div style="background: rgba(139,92,246,0.1); border: 1px solid var(--accent-purple); border-radius: 10px; padding: 0.75rem 1.15rem; margin-bottom: 0.5rem; display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:1.4rem;">🏅</span>
                        <div>
                            <div style="font-weight:700; color:var(--accent-purple); font-size:0.9rem;">BSG Level 2 Championship Qualifier</div>
                            <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                                Qualified for <strong>${bsgInfo.qualifiedCount} events</strong>: ${bsgInfo.qualifiedEvents.join(', ')}
                            </div>
                        </div>
                    </div>
                `;
            }
            if (APP_SETTINGS.showDevlop && devInfo && devInfo.eligibleCount > 0) {
                bannerHTML += `
                    <div style="background: rgba(6,182,212,0.1); border: 1px solid var(--accent-cyan); border-radius: 10px; padding: 0.75rem 1.15rem; display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:1.4rem;">📈</span>
                        <div>
                            <div style="font-weight:700; color:var(--accent-cyan); font-size:0.9rem;">Development Meet Eligible Races</div>
                            <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                                Eligible for <strong>${devInfo.eligibleCount} events</strong>: ${devInfo.eligibleEvents.join(', ')} ${devInfo.tooFastEvents.length ? `• <span style="color:var(--accent-rose); font-weight:600;">${devInfo.tooFastEvents.length} Events Too Fast</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
            bannerContainer.innerHTML = bannerHTML;
        } else {
            bannerContainer.innerHTML = '';
        }
    }

    const fullData = RAW_SWIMMERS_DATA || data || [];
    const overviewBadge = document.getElementById('overview-swimmers-badge');
    if (overviewBadge) overviewBadge.innerText = `${fullData.length.toLocaleString()} Raw Times`;

    if (!data || !data.length) {
        tbody.innerHTML = `<tr><td colspan="${activeCols}" style="text-align:center; color:var(--text-muted); padding:3rem;">No matching swimmer records found.</td></tr>`;
        return;
    }

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
            ? `<a href="javascript:void(0)" onclick="openSwimmerModal('${r.seNumber || ''}', '${r.swimmerName.replace(/'/g, "\\'")}')" style="color:var(--text-main); font-weight:700; text-decoration:none; border-bottom:1px dashed var(--accent-cyan);" title="Click to view all PBs & details for ${r.swimmerName}">${r.swimmerName} 👤</a>`
            : '-';

        const seEventUrl = buildSwimEnglandHistoryUrl(r.seNumber, r.event, course);
        const seLink = r.seNumber
            ? `<a href="${seEventUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline;" title="Open official Swim England event history for ${r.event}">${r.seNumber} 🔗</a>`
            : '-';

        const cStatus = checkCountyStatusForRecord(r.swimmerName, r.seNumber, r.event);
        const countyBadge = cStatus === 'QUALIFIED'
            ? `<span style="background:rgba(16,185,129,0.15); color:var(--accent-emerald); border:1px solid var(--accent-emerald); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">🏆 Qualified</span>`
            : (cStatus === 'SLOWER' ? `<span style="color:var(--text-muted); font-size:0.75rem;">Slower</span>` : '-');

        const bsgStatus = checkBSGStatusForRecord(r.swimmerName, r.seNumber, r.event);
        const bsgBadge = bsgStatus === 'QUALIFIED'
            ? `<span style="background:rgba(139,92,246,0.15); color:var(--accent-purple); border:1px solid var(--accent-purple); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">🏅 Qualified</span>`
            : (bsgStatus === 'SLOWER' ? `<span style="color:var(--text-muted); font-size:0.75rem;">Slower</span>` : '-');

        const devStatus = checkDevlopStatusForRecord(r.swimmerName, r.seNumber, r.event);
        const devBadge = devStatus === 'ELIGIBLE'
            ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">📈 Eligible</span>`
            : (devStatus === 'TOO_FAST' ? `<span style="background:rgba(244,63,94,0.15); color:var(--accent-rose); border:1px solid var(--accent-rose); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">⛔ Too Fast</span>` : '-');

        const pbTag = r.isPB 
            ? `<span style="background:rgba(245,158,11,0.2); color:var(--accent-amber); border:1px solid var(--accent-amber); font-size:0.65rem; padding:0.08rem 0.35rem; border-radius:4px; margin-left:0.3rem; font-weight:800;">⭐ PB</span>`
            : '';

        const countyTd = APP_SETTINGS.showCounty ? `<td>${countyBadge}</td>` : '';
        const bsgTd = APP_SETTINGS.showBSG ? `<td>${bsgBadge}</td>` : '';
        const devTd = APP_SETTINGS.showDevlop ? `<td>${devBadge}</td>` : '';

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
                <td style="color:var(--text-muted); font-size:0.8rem; max-width:210px; overflow:hidden; text-overflow:ellipsis;" title="${venueMeet}">${venueMeet}</td>
                ${countyTd}
                ${bsgTd}
                ${devTd}
            </tr>
        `;
    }).join('');
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
    const countyVal = (APP_SETTINGS.showCounty ? document.getElementById('swimmers-county-select')?.value : 'ALL') || 'ALL';
    const bsgVal = (APP_SETTINGS.showBSG ? document.getElementById('swimmers-bsg-select')?.value : 'ALL') || 'ALL';
    const devlopVal = (APP_SETTINGS.showDevlop ? document.getElementById('swimmers-devlop-select')?.value : 'ALL') || 'ALL';
    const timeframeVal = document.getElementById('swimmers-timeframe-select')?.value || 'ALL';

    const activeSquadList = getActiveSquadSwimmerNames();
    const squadSwimmersSet = new Set(activeSquadList.map(n => (n || '').trim().toLowerCase()));

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
        const cleanRecName = (r.swimmerName || '').trim().toLowerCase();
        const cleanRecNorm = cleanRecName.replace(/[^a-z0-9]/g, '');
        const matchesSquadRoster = (squadSwimmersSet.size === 0 || squadSwimmersSet.has(cleanRecName) || Array.from(squadSwimmersSet).some(s => s.replace(/[^a-z0-9]/g, '') === cleanRecNorm));
        
        const targetClean = swimmerName.trim().toLowerCase();
        const targetNorm = targetClean.replace(/[^a-z0-9]/g, '');
        const matchesName = swimmerName === 'ALL' || cleanRecName === targetClean || cleanRecNorm === targetNorm;
        
        const matchesEvent = eventVal === 'ALL' || (r.event || '') === eventVal;
        const matchesCourse = courseVal === 'ALL' || getCourse(r) === courseVal;
        const matchesCounty = !APP_SETTINGS.showCounty || countyVal === 'ALL' || (countyVal === 'QUALIFIED' && checkCountyStatusForRecord(r.swimmerName, r.seNumber, r.event) === 'QUALIFIED');
        const matchesBSG = !APP_SETTINGS.showBSG || bsgVal === 'ALL' || (bsgVal === 'QUALIFIED' && checkBSGStatusForRecord(r.swimmerName, r.seNumber, r.event) === 'QUALIFIED');
        const matchesDevlop = !APP_SETTINGS.showDevlop || devlopVal === 'ALL' || (devlopVal === 'ELIGIBLE' && checkDevlopStatusForRecord(r.swimmerName, r.seNumber, r.event) === 'ELIGIBLE');

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

        return matchesSquadRoster && matchesName && matchesEvent && matchesCourse && matchesCounty && matchesBSG && matchesDevlop && matchesTimeframe;
    });

    if (modeVal === 'PB') {
        filtered = extractFastestPBs(filtered);
    }

    sortSwimmerRecords(filtered, swimmerName === 'ALL');

    renderSwimmersDashboard(filtered);
}

function openSwimmerModal(seNum, name) {
    const targetNorm = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const records = RAW_SWIMMERS_DATA.filter(r => (r.seNumber && String(r.seNumber) === String(seNum)) || (targetNorm && (r.swimmerName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm));
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
    const bsgInfo = getBSGInfoForSwimmer(swimmerName, seNumber);
    const devInfo = getDevlopInfoForSwimmer(swimmerName, seNumber);

    let summaryBannersHTML = '';
    if (APP_SETTINGS.showCounty && cInfo && cInfo.qualifiedCount > 0) {
        summaryBannersHTML += `
            <div style="background: rgba(16,185,129,0.12); border: 1px solid var(--accent-emerald); border-radius: 10px; padding: 0.75rem 1.15rem; margin-bottom: 0.6rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.4rem;">🏆</span>
                    <div>
                        <div style="font-weight:700; color:var(--accent-emerald); font-size:0.9rem;">Somerset County Championship Qualifier</div>
                        <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                            Qualified for <strong>${cInfo.qualifiedCount} events</strong>: ${cInfo.qualifiedEvents.join(', ')}
                        </div>
                    </div>
                </div>
                <button onclick="goToCountyTimesForSwimmer('${swimmerName.replace(/'/g, "\\'")}')" style="background:rgba(16,185,129,0.2); border:1px solid var(--accent-emerald); color:var(--accent-emerald); padding:0.35rem 0.75rem; border-radius:6px; font-weight:700; font-size:0.75rem; cursor:pointer; margin-left:auto; white-space:nowrap;" title="View Somerset County Times Matrix">
                    🏆 View County Times →
                </button>
            </div>
        `;
    } else if (APP_SETTINGS.showCounty) {
        summaryBannersHTML += `
            <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; padding: 0.65rem 1.15rem; margin-bottom: 0.6rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.2rem;">🎯</span>
                    <div>
                        <div style="font-weight:700; color:var(--accent-purple); font-size:0.85rem;">Somerset County Championship Times</div>
                        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.1rem;">
                            Tracking qualifying times against 2026/27 Somerset County standards.
                        </div>
                    </div>
                </div>
                <button onclick="goToCountyTimesForSwimmer('${swimmerName.replace(/'/g, "\\'")}')" style="background:rgba(139,92,246,0.15); border:1px solid var(--accent-purple); color:var(--accent-purple); padding:0.35rem 0.75rem; border-radius:6px; font-weight:700; font-size:0.75rem; cursor:pointer; margin-left:auto; white-space:nowrap;" title="View Somerset County Times Matrix">
                    🏆 View County Times →
                </button>
            </div>
        `;
    }
    if (APP_SETTINGS.showBSG && bsgInfo && bsgInfo.qualifiedCount > 0) {
        summaryBannersHTML += `
            <div style="background: rgba(139,92,246,0.12); border: 1px solid var(--accent-purple); border-radius: 10px; padding: 0.75rem 1.15rem; margin-bottom: 0.6rem; display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.4rem;">🏅</span>
                <div>
                    <div style="font-weight:700; color:var(--accent-purple); font-size:0.9rem;">BSG Level 2 Championship Qualifier</div>
                    <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                        Qualified for <strong>${bsgInfo.qualifiedCount} events</strong>: ${bsgInfo.qualifiedEvents.join(', ')}
                    </div>
                </div>
            </div>
        `;
    }
    if (APP_SETTINGS.showDevlop && devInfo && devInfo.eligibleCount > 0) {
        summaryBannersHTML += `
            <div style="background: rgba(6,182,212,0.12); border: 1px solid var(--accent-cyan); border-radius: 10px; padding: 0.75rem 1.15rem; margin-bottom: 0.8rem; display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.4rem;">📈</span>
                <div>
                    <div style="font-weight:700; color:var(--accent-cyan); font-size:0.9rem;">Development Meet Eligible Races</div>
                    <div style="font-size:0.8rem; color:var(--text-main); margin-top:0.1rem;">
                        Eligible for <strong>${devInfo.eligibleCount} events</strong>: ${devInfo.eligibleEvents.join(', ')} ${devInfo.tooFastEvents.length ? `• <span style="color:var(--accent-rose); font-weight:600;">${devInfo.tooFastEvents.length} Events Too Fast</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

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
            ${summaryBannersHTML}
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
                ${pbList.map(pb => {
                    const cCourse = getCourse(pb);
                    const courseBadge = cCourse === 'LC'
                        ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">50m (LC)</span>`
                        : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">25m (SC)</span>`;
                    
                    const cStatus = checkCountyStatusForRecord(swimmerName, seNumber, pb.event);
                    const countyCardBadge = (APP_SETTINGS.showCounty && cStatus === 'QUALIFIED')
                        ? `<span style="background:rgba(16,185,129,0.15); color:var(--accent-emerald); border:1px solid var(--accent-emerald); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">🏆 County QT</span>`
                        : '';

                    const bsgStatus = checkBSGStatusForRecord(swimmerName, seNumber, pb.event);
                    const bsgCardBadge = (APP_SETTINGS.showBSG && bsgStatus === 'QUALIFIED')
                        ? `<span style="background:rgba(139,92,246,0.15); color:var(--accent-purple); border:1px solid var(--accent-purple); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">🏅 BSG L2</span>`
                        : '';

                    const devStatus = checkDevlopStatusForRecord(swimmerName, seNumber, pb.event);
                    const devCardBadge = (APP_SETTINGS.showDevlop && devStatus === 'ELIGIBLE')
                        ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">📈 Dev Eligible</span>`
                        : ((APP_SETTINGS.showDevlop && devStatus === 'TOO_FAST') ? `<span style="background:rgba(244,63,94,0.15); color:var(--accent-rose); border:1px solid var(--accent-rose); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">⛔ Dev Too Fast</span>` : '');

                    const seCardUrl = buildSwimEnglandHistoryUrl(seNumber, pb.event, cCourse);

                    return `
                        <div style="background: rgba(15,23,42,0.6); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                                <span style="font-weight:700; font-size:0.85rem;">${pb.event}</span>
                                <div style="display:flex; gap:0.25rem; flex-wrap:wrap;">${courseBadge}${countyCardBadge}${bsgCardBadge}${devCardBadge}</div>
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

// 7. SQUAD MOVEMENTS MODULE
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
            if (val.toLowerCase().includes('max number')) return;

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

// 8. MEET CALENDAR MODULE
function renderCalendar(data) {
    const tbody = document.getElementById('calendar-table-body');
    const calendarList = data || CALENDAR_DATA || [];
    if (!tbody) return;

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

// =========================================================================
// 8B. COUNTY & REGIONAL QUALIFIERS MODULE
// =========================================================================

let ALL_QUALIFIERS_DATA = [];
let ACTIVE_QUALIFIERS_TIER_FILTER = 'ALL';

function parseQualifierTimeSec(s) {
    if (s === null || s === undefined) return null;
    if (typeof s === 'number') return s;
    const clean = String(s).trim();
    if (!clean || clean === '-' || clean.toLowerCase() === 'none') return null;
    const parts = clean.split(':');
    try {
        if (parts.length === 1) return parseFloat(parts[0]) || null;
        if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]) || null;
        if (parts.length === 3) return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]) || null;
    } catch (e) {
        return null;
    }
    return null;
}

function formatQualifierSeconds(sec) {
    if (sec === null || sec === undefined || isNaN(sec)) return '-';
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    if (mins > 0) {
        return `${String(mins).padStart(2, '0')}:${rem.toFixed(2).padStart(5, '0')}`;
    }
    return rem.toFixed(2).padStart(5, '0');
}

function evaluateAllSwimmerQualifiers() {
    const countyStds = window.COUNTY_STANDARDS || (typeof COUNTY_STANDARDS !== 'undefined' ? COUNTY_STANDARDS : null);
    const regStds = window.REGIONAL_STANDARDS || (typeof REGIONAL_STANDARDS !== 'undefined' ? REGIONAL_STANDARDS : null);
    if (!countyStds || !regStds) return [];

    const rawData = (typeof RAW_SWIMMERS_DATA !== 'undefined' && RAW_SWIMMERS_DATA.length) 
        ? RAW_SWIMMERS_DATA 
        : (window.RAW_SWIMMERS_DATA || (typeof RAW_DATA !== 'undefined' ? RAW_DATA : (window.RAW_DATA || [])));
    if (!rawData.length) return [];

    const swimmersMeta = window.SWIMMERS_METADATA || (typeof SWIMMERS_METADATA !== 'undefined' ? SWIMMERS_METADATA : {});
    const getStdEventName = window.getStandardEventName || (typeof getStandardEventName === 'function' ? getStandardEventName : (evt => evt));

    // Fast map for regional standards: key = event_ageGroup_category_course
    const regMap = new Map();
    for (const r of regStds) {
        regMap.set(`${r.event}_${r.ageGroup}_${r.category}_${r.course}`, r);
    }

    // Dynamic squad map from SQUAD_LIST_DATA if available
    const activeSquadMap = new Map();
    if (SQUAD_LIST_DATA && SQUAD_LIST_DATA.length > 0) {
        const cols = Object.keys(SQUAD_LIST_DATA[0]);
        cols.forEach(col => {
            let cleanSquad = col.split('\n')[0].trim();
            cleanSquad = cleanSquad.replace(/\s*\(Tues.*|\s*Tues.*/, '').trim();
            SQUAD_LIST_DATA.forEach(r => {
                const val = (r[col] || '').trim();
                const hasSkipKeyword = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'am', 'pm', 'session', 'max number'].some(k => val.toLowerCase().includes(k));
                if (val && !hasSkipKeyword) {
                    activeSquadMap.set(val.toLowerCase(), cleanSquad);
                }
            });
        });
    }

    // Group RAW_SWIMMERS_DATA by swimmerName and standardized event
    const swimmerEvents = new Map();
    for (const r of rawData) {
        const stdEvt = getStdEventName(r.event);
        const key = `${r.swimmerName}_${stdEvt}`;
        if (!swimmerEvents.has(key)) swimmerEvents.set(key, []);
        swimmerEvents.get(key).push({ ...r, standardEvent: stdEvt });
    }

    const evaluations = [];

    for (const [key, records] of swimmerEvents.entries()) {
        const swimmerName = records[0].swimmerName;
        const event = records[0].standardEvent;
        const seNum = records[0].seNumber;
        const normKey = swimmerName.toLowerCase().trim();
        const normClean = normKey.replace(/[^a-z0-9]/g, '');

        // Resolve swimmer metadata
        let meta = swimmersMeta[normKey] || swimmersMeta[normClean];
        if (!meta) {
            for (const k of Object.keys(swimmersMeta)) {
                if (k.replace(/[^a-z0-9]/g, '') === normClean) {
                    meta = swimmersMeta[k];
                    break;
                }
            }
        }
        meta = meta || {};

        const age = meta.age || null;
        const cat = meta.category || 'Female';
        const squad = activeSquadMap.get(normKey) || meta.squad || 'Club Swimmer';

        if (!age) continue;

        const ageStr = age >= 18 ? '18+' : String(age);
        const regAgeStr = age < 11 ? null : (age <= 12 ? '11/12' : (age >= 18 ? '18+' : String(age)));

        // Find swimmer's best SC swim (native SC or fastest converted SC from LC)
        let scRec = null;
        let scSec = null;
        let isConverted = false;

        const scRecords = records.filter(r => r.course === 'SC');
        if (scRecords.length > 0) {
            scRecords.sort((a, b) => (Number(a.timeSec) || parseQualifierTimeSec(a.displayTime) || Infinity) - (Number(b.timeSec) || parseQualifierTimeSec(b.displayTime) || Infinity));
            scRec = scRecords[0];
            scSec = Number(scRec.timeSec) || parseQualifierTimeSec(scRec.displayTime);
        }

        const lcRecords = records.filter(r => r.course === 'LC');
        if (lcRecords.length > 0) {
            for (const lc of lcRecords) {
                const convSec = parseQualifierTimeSec(lc.convertedTime);
                if (convSec && (!scSec || convSec < scSec)) {
                    scSec = convSec;
                    scRec = {
                        ...lc,
                        course: 'SC',
                        displayTime: lc.convertedTime,
                        timeSec: convSec,
                        originalLCDisplay: lc.displayTime,
                        isConverted: true
                    };
                    isConverted = true;
                }
            }
        }

        if (!scRec || !scSec) continue;

        let bestEval = null;

        // 1. Check against Short Course Regional standard
        if (regAgeStr) {
            const regStd = regMap.get(`${event}_${regAgeStr}_${cat}_SC`);
            if (regStd) {
                if (regStd.qtSec && scSec <= regStd.qtSec) {
                    const diff = scSec - regStd.qtSec;
                    const pct = (diff / regStd.qtSec) * 100;
                    bestEval = {
                        tier: 'Regional QT',
                        tierPriority: 1,
                        rec: scRec,
                        targetSec: regStd.qtSec,
                        targetDisplay: regStd.qtDisplay,
                        targetName: 'Regional SC QT',
                        diff,
                        pct,
                        course: 'SC',
                        isConverted,
                        isQualified: true
                    };
                } else if (regStd.cqtSec && scSec <= regStd.cqtSec) {
                    const diff = scSec - regStd.cqtSec;
                    const pct = (diff / regStd.cqtSec) * 100;
                    bestEval = {
                        tier: 'Regional CQT',
                        tierPriority: 2,
                        rec: scRec,
                        targetSec: regStd.cqtSec,
                        targetDisplay: regStd.cqtDisplay,
                        targetName: 'Regional SC CQT',
                        diff,
                        pct,
                        course: 'SC',
                        isConverted,
                        isQualified: true
                    };
                } else if (regStd.cqtSec && scSec <= regStd.cqtSec * 1.02) {
                    const diff = scSec - regStd.cqtSec;
                    const pct = (diff / regStd.cqtSec) * 100;
                    bestEval = {
                        tier: 'Within 2% CQT',
                        tierPriority: 3,
                        rec: scRec,
                        targetSec: regStd.cqtSec,
                        targetDisplay: regStd.cqtDisplay,
                        targetName: 'Regional SC CQT',
                        diff,
                        pct,
                        course: 'SC',
                        isConverted,
                        isQualified: false
                    };
                }
            }
        }

        // 2. Check County standard (SC consideration times)
        let hasCountyToo = false;
        const countyStdObj = (countyStds[cat] || {})[event]?.[ageStr];
        const countySec = countyStdObj?.seconds;
        if (countySec && scSec <= countySec) {
            hasCountyToo = true;
            const diff = scSec - countySec;
            const pct = (diff / countySec) * 100;
            // Assign tier 'County Qualifier' only if not already Priority 1 (Regional QT), 2 (Regional CQT), or 3 (Within 2% CQT)
            if (!bestEval || bestEval.tierPriority > 3) {
                bestEval = {
                    tier: 'County Qualifier',
                    tierPriority: 4,
                    rec: scRec,
                    targetSec: countySec,
                    targetDisplay: countyStdObj.display,
                    targetName: 'County SC Time',
                    diff,
                    pct,
                    course: 'SC',
                    isConverted,
                    isQualified: true
                };
            }
        }

        // 3. Swimmer in development: calculate margin towards County standard (or Regional SC CQT)
        if (!bestEval) {
            if (countySec) {
                const diff = scSec - countySec;
                const pct = (diff / countySec) * 100;
                bestEval = {
                    tier: 'Developing',
                    tierPriority: 5,
                    rec: scRec,
                    targetSec: countySec,
                    targetDisplay: countyStdObj.display,
                    targetName: 'County SC Time',
                    diff,
                    pct,
                    course: 'SC',
                    isConverted,
                    isQualified: false
                };
            } else if (regAgeStr) {
                const regStd = regMap.get(`${event}_${regAgeStr}_${cat}_SC`);
                if (regStd && regStd.cqtSec) {
                    const diff = scSec - regStd.cqtSec;
                    const pct = (diff / regStd.cqtSec) * 100;
                    bestEval = {
                        tier: 'Developing',
                        tierPriority: 5,
                        rec: scRec,
                        targetSec: regStd.cqtSec,
                        targetDisplay: regStd.cqtDisplay,
                        targetName: 'Regional SC CQT',
                        diff,
                        pct,
                        course: 'SC',
                        isConverted,
                        isQualified: false
                    };
                }
            }
        }

        if (bestEval) {
            evaluations.push({
                swimmerName,
                seNumber: seNum,
                age,
                category: cat,
                squad,
                event,
                hasCountyToo,
                allRecords: records,
                ...bestEval
            });
        }
    }

    return evaluations;
}

function renderQualifiersDashboard() {
    ALL_QUALIFIERS_DATA = evaluateAllSwimmerQualifiers();

    // 1. Calculate & Render KPI Cards
    const kpiCounts = {
        regQT: { swims: 0, swimmers: new Set() },
        regCQT: { swims: 0, swimmers: new Set() },
        bubble: { swims: 0, swimmers: new Set() },
        county: { swims: 0, swimmers: new Set() }
    };

    ALL_QUALIFIERS_DATA.forEach(r => {
        if (r.tier === 'Regional QT') {
            kpiCounts.regQT.swims++;
            kpiCounts.regQT.swimmers.add(r.swimmerName);
        } else if (r.tier === 'Regional CQT') {
            kpiCounts.regCQT.swims++;
            kpiCounts.regCQT.swimmers.add(r.swimmerName);
        } else if (r.tier === 'Within 2% CQT') {
            kpiCounts.bubble.swims++;
            kpiCounts.bubble.swimmers.add(r.swimmerName);
        }
        
        // County qualifier check
        if (r.tier === 'County Qualifier' || r.hasCountyToo) {
            kpiCounts.county.swims++;
            kpiCounts.county.swimmers.add(r.swimmerName);
        }
    });

    const elCountRegQT = document.getElementById('kpi-count-reg-qt');
    const elSwimmersRegQT = document.getElementById('kpi-swimmers-reg-qt');
    if (elCountRegQT) elCountRegQT.innerText = kpiCounts.regQT.swims;
    if (elSwimmersRegQT) elSwimmersRegQT.innerText = `${kpiCounts.regQT.swimmers.size} Swimmer${kpiCounts.regQT.swimmers.size === 1 ? '' : 's'} Qualified`;

    const elCountRegCQT = document.getElementById('kpi-count-reg-cqt');
    const elSwimmersRegCQT = document.getElementById('kpi-swimmers-reg-cqt');
    if (elCountRegCQT) elCountRegCQT.innerText = kpiCounts.regCQT.swims;
    if (elSwimmersRegCQT) elSwimmersRegCQT.innerText = `${kpiCounts.regCQT.swimmers.size} Swimmer${kpiCounts.regCQT.swimmers.size === 1 ? '' : 's'} Qualified`;

    const elCountBubble = document.getElementById('kpi-count-bubble');
    const elSwimmersBubble = document.getElementById('kpi-swimmers-bubble');
    if (elCountBubble) elCountBubble.innerText = kpiCounts.bubble.swims;
    if (elSwimmersBubble) elSwimmersBubble.innerText = `${kpiCounts.bubble.swimmers.size} Swimmer${kpiCounts.bubble.swimmers.size === 1 ? '' : 's'} in striking distance`;

    const elCountCounty = document.getElementById('kpi-count-county');
    const elSwimmersCounty = document.getElementById('kpi-swimmers-county');
    if (elCountCounty) elCountCounty.innerText = kpiCounts.county.swims;
    if (elSwimmersCounty) elSwimmersCounty.innerText = `${kpiCounts.county.swimmers.size} Swimmer${kpiCounts.county.swimmers.size === 1 ? '' : 's'} Qualified`;

    const overviewBadge = document.getElementById('overview-qualifiers-badge');
    if (overviewBadge) {
        overviewBadge.innerText = `${kpiCounts.regQT.swims + kpiCounts.regCQT.swims + kpiCounts.bubble.swims + kpiCounts.county.swims} Target Swims Tracked`;
    }

    populateQualifiersFilterOptions();
    filterQualifiers();
}

function populateQualifiersFilterOptions() {
    const swimmerSelect = document.getElementById('qualifiers-swimmer-select');
    if (swimmerSelect) {
        const currentSwimmer = swimmerSelect.value;
        const swimmers = Array.from(new Set(ALL_QUALIFIERS_DATA.map(r => r.swimmerName).filter(Boolean))).sort();
        swimmerSelect.innerHTML = `<option value="ALL">All Swimmers (${swimmers.length})</option>` +
            swimmers.map(s => `<option value="${s}">${s}</option>`).join('');
        if (currentSwimmer && Array.from(swimmerSelect.options).some(o => o.value === currentSwimmer)) {
            swimmerSelect.value = currentSwimmer;
        }
    }

    const squadSelect = document.getElementById('qualifiers-squad-select');
    if (!squadSelect) return;

    const currentVal = squadSelect.value;
    const squads = Array.from(new Set(ALL_QUALIFIERS_DATA.map(r => r.squad).filter(Boolean))).sort();

    squadSelect.innerHTML = `<option value="ALL">All Squads (${squads.length})</option>` +
        squads.map(s => `<option value="${s}">${s}</option>`).join('');

    if (currentVal && Array.from(squadSelect.options).some(o => o.value === currentVal)) {
        squadSelect.value = currentVal;
    }
}

function setQualifiersTierFilter(tierName) {
    const statusSelect = document.getElementById('qualifiers-status-select');
    if (statusSelect) {
        statusSelect.value = tierName;
    }
    ACTIVE_QUALIFIERS_TIER_FILTER = tierName;

    // Highlight active KPI card
    document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('active-kpi'));
    if (tierName === 'Regional QT') document.getElementById('kpi-card-reg-qt')?.classList.add('active-kpi');
    else if (tierName === 'Regional CQT') document.getElementById('kpi-card-reg-cqt')?.classList.add('active-kpi');
    else if (tierName === 'Within 2% CQT') document.getElementById('kpi-card-bubble')?.classList.add('active-kpi');
    else if (tierName === 'County Qualifier') document.getElementById('kpi-card-county')?.classList.add('active-kpi');

    filterQualifiers();

    // Smooth scroll to table
    document.getElementById('qualifiers-table')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetQualifiersFilters() {
    const searchInput = document.getElementById('qualifiers-search-input');
    const swimmerSelect = document.getElementById('qualifiers-swimmer-select');
    const squadSelect = document.getElementById('qualifiers-squad-select');
    const catSelect = document.getElementById('qualifiers-cat-select');
    const ageSelect = document.getElementById('qualifiers-age-select');
    const statusSelect = document.getElementById('qualifiers-status-select');
    const sortSelect = document.getElementById('qualifiers-sort-select');

    if (searchInput) searchInput.value = '';
    if (swimmerSelect) swimmerSelect.value = 'ALL';
    if (squadSelect) squadSelect.value = 'ALL';
    if (catSelect) catSelect.value = 'ALL';
    if (ageSelect) ageSelect.value = 'ALL';
    if (statusSelect) statusSelect.value = 'ALL';
    if (sortSelect) sortSelect.value = 'margin_asc';

    document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('active-kpi'));
    ACTIVE_QUALIFIERS_TIER_FILTER = 'ALL';

    filterQualifiers();
}

function filterQualifiers() {
    const tbody = document.querySelector('#qualifiers-table tbody');
    if (!tbody) return;

    const q = (document.getElementById('qualifiers-search-input')?.value || '').toLowerCase().trim();
    const swimmerVal = document.getElementById('qualifiers-swimmer-select')?.value || 'ALL';
    const squadVal = document.getElementById('qualifiers-squad-select')?.value || 'ALL';
    const catVal = document.getElementById('qualifiers-cat-select')?.value || 'ALL';
    const ageVal = document.getElementById('qualifiers-age-select')?.value || 'ALL';
    const statusVal = document.getElementById('qualifiers-status-select')?.value || 'ALL';
    const sortVal = document.getElementById('qualifiers-sort-select')?.value || 'margin_asc';

    let filtered = ALL_QUALIFIERS_DATA.filter(r => {
        // Swimmer Select Dropdown
        if (swimmerVal !== 'ALL' && r.swimmerName !== swimmerVal) return false;

        // Search text
        if (q) {
            const matchName = r.swimmerName.toLowerCase().includes(q);
            const matchEvent = r.event.toLowerCase().includes(q);
            const matchSquad = (r.squad || '').toLowerCase().includes(q);
            if (!matchName && !matchEvent && !matchSquad) return false;
        }

        // Squad
        if (squadVal !== 'ALL' && r.squad !== squadVal) return false;

        // Category
        if (catVal !== 'ALL' && r.category !== catVal) return false;

        // Age Group
        if (ageVal !== 'ALL') {
            if (ageVal === '11/12') {
                if (r.age !== 11 && r.age !== 12) return false;
            } else if (ageVal === '18+') {
                if (r.age < 18) return false;
            } else {
                if (String(r.age) !== ageVal) return false;
            }
        }

        // Status Tier
        if (statusVal === 'ALL') {
            // Default view shows all actual qualifiers and bubble swims
            // If user explicitly searched or selected a specific swimmer, show all their events (including Developing)
            if (!q && swimmerVal === 'ALL' && r.tier === 'Developing') return false;
        } else if (statusVal === 'ALL_INCLUDING_DEV') {
            // Keep all
        } else if (statusVal === 'County Qualifier') {
            if (r.tier !== 'County Qualifier' && !r.hasCountyToo) return false;
        } else {
            if (r.tier !== statusVal) return false;
        }

        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortVal === 'margin_asc') {
            // Keep actual qualifiers & bubble above developing swims
            if (a.tier === 'Developing' && b.tier !== 'Developing') return 1;
            if (a.tier !== 'Developing' && b.tier === 'Developing') return -1;

            // Bring closest to qualifying (bubble swims with smallest positive deficit) to top,
            // then already qualified swims sorted by margin under standard!
            if (a.diff >= 0 && b.diff >= 0) return a.diff - b.diff;
            if (a.diff >= 0 && b.diff < 0) return -1;
            if (a.diff < 0 && b.diff >= 0) return 1;
            return a.diff - b.diff; // larger negative under standard
        } else if (sortVal === 'name_asc') {
            return a.swimmerName.localeCompare(b.swimmerName) || a.event.localeCompare(b.event);
        } else if (sortVal === 'event_asc') {
            return a.event.localeCompare(b.event) || a.swimmerName.localeCompare(b.swimmerName);
        } else if (sortVal === 'tier_desc') {
            return a.tierPriority - b.tierPriority || a.diff - b.diff;
        }
        return 0;
    });

    // Update Result Counter & Active Filter Pills
    const countEl = document.getElementById('qualifiers-result-count');
    const pillEl = document.getElementById('qualifiers-active-filter-pill');
    const uniqueSwimmers = new Set(filtered.map(r => r.swimmerName)).size;

    if (countEl) {
        countEl.innerHTML = `Showing <strong>${filtered.length}</strong> target swim${filtered.length === 1 ? '' : 's'} across <strong>${uniqueSwimmers}</strong> swimmer${uniqueSwimmers === 1 ? '' : 's'}`;
    }

    if (pillEl) {
        const activeFilters = [];
        if (swimmerVal !== 'ALL') activeFilters.push(`Swimmer: ${swimmerVal}`);
        if (q) activeFilters.push(`Search: "${q}"`);
        if (squadVal !== 'ALL') activeFilters.push(`Squad: ${squadVal}`);
        if (catVal !== 'ALL') activeFilters.push(`Cat: ${catVal}`);
        if (ageVal !== 'ALL') activeFilters.push(`Age: ${ageVal}`);
        if (statusVal !== 'ALL') activeFilters.push(`Tier: ${statusVal}`);
        pillEl.innerHTML = activeFilters.length ? `Filtered by: ${activeFilters.join(' • ')}` : '';
    }

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:3rem;">No swimmer qualifying records match your selected filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        // Course Badge
        const courseBadge = r.isConverted
            ? `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.15rem 0.45rem; border-radius:4px; font-weight:700; font-size:0.75rem;" title="Converted to Short Course from LC ${r.rec.originalLCDisplay || ''}">25m (SC Conv)</span>`
            : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.15rem 0.45rem; border-radius:4px; font-weight:700; font-size:0.75rem;">25m (SC)</span>`;

        // Status Badge
        let badgeHTML = '';
        if (r.tier === 'Regional QT') {
            badgeHTML = `<span class="tier-badge tier-reg-qt">🌟 Regional QT</span>`;
        } else if (r.tier === 'Regional CQT') {
            badgeHTML = `<span class="tier-badge tier-reg-cqt">🏅 Regional CQT</span>`;
        } else if (r.tier === 'Within 2% CQT') {
            const countyChip = r.hasCountyToo ? `<span style="font-size:0.65rem; color:var(--accent-purple); font-weight:700; margin-left:0.3rem;">• 🏆 County QT</span>` : '';
            badgeHTML = `<span class="tier-badge tier-bubble">⚡ Within 2% CQT</span>${countyChip}`;
        } else if (r.tier === 'County Qualifier') {
            badgeHTML = `<span class="tier-badge tier-county">🏆 County Qualifier</span>`;
        } else {
            badgeHTML = `<span class="tier-badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted); border:1px solid rgba(255,255,255,0.15);">🌱 Chasing ${r.targetName}</span>`;
        }

        // Margin Pill
        let marginHTML = '';
        if (r.diff <= 0) {
            marginHTML = `<span style="color:var(--accent-emerald); font-weight:700; font-family:monospace;">✓ ${r.diff.toFixed(2)}s (${r.pct.toFixed(1)}%)</span>`;
        } else if (r.tier === 'Within 2% CQT') {
            marginHTML = `<span style="color:var(--accent-amber); font-weight:700; font-family:monospace;">+${r.diff.toFixed(2)}s off CQT (${r.pct.toFixed(1)}% away)</span>`;
        } else {
            marginHTML = `<span style="color:var(--text-muted); font-weight:600; font-family:monospace;">+${r.diff.toFixed(2)}s off ${r.targetName} (${r.pct.toFixed(1)}%)</span>`;
        }

        const safeSwimmerName = r.swimmerName.replace(/'/g, "\\'");
        const swimmerLink = `<a href="javascript:void(0)" onclick="openQualifierSwimmerModal('${safeSwimmerName}')" style="color:var(--text-main); font-weight:700; text-decoration:none; border-bottom:1px dashed var(--accent-cyan);" title="Click to view full milestone breakdown for ${r.swimmerName}">${r.swimmerName} 📊</a>`;

        return `
            <tr>
                <td>${swimmerLink}</td>
                <td><span style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:0.2rem 0.5rem; border-radius:6px; color:var(--text-muted);">${r.squad || '-'}</span></td>
                <td><span style="font-size:0.8rem; font-weight:600; color:var(--text-main);">${r.age} yrs • ${r.category === 'Female' ? 'F' : 'M'}</span></td>
                <td style="font-weight:600;">${r.event}</td>
                <td>${courseBadge}</td>
                <td style="font-family:monospace; font-weight:700; color:var(--accent-cyan); font-size:0.95rem;">${r.rec.displayTime || '-'}</td>
                <td style="font-family:monospace; font-size:0.85rem; color:var(--text-muted);">${r.targetDisplay || '-'} <span style="font-size:0.75rem; color:var(--text-main); font-family:sans-serif;">(${r.targetName})</span></td>
                <td>${badgeHTML}</td>
                <td>${marginHTML}</td>
            </tr>
        `;
    }).join('');
}

function openQualifierSwimmerModal(swimmerName) {
    const norm = swimmerName.toLowerCase().trim();
    const records = ALL_QUALIFIERS_DATA.filter(r => r.swimmerName.toLowerCase().trim() === norm);
    if (!records.length) return;

    const countyStds = window.COUNTY_STANDARDS || (typeof COUNTY_STANDARDS !== 'undefined' ? COUNTY_STANDARDS : {});
    const regStds = window.REGIONAL_STANDARDS || (typeof REGIONAL_STANDARDS !== 'undefined' ? REGIONAL_STANDARDS : []);
    const swimmersMeta = window.SWIMMERS_METADATA || (typeof SWIMMERS_METADATA !== 'undefined' ? SWIMMERS_METADATA : {});
    const meta = swimmersMeta[norm] || swimmersMeta[norm.replace(/[^a-z0-9]/g, '')] || {};

    const first = records[0];
    const age = first.age;
    const cat = first.category;
    const seNum = first.seNumber || meta.seNumber || '';
    const squad = first.squad;

    const nameEl = document.getElementById('qualifier-modal-name');
    const subEl = document.getElementById('qualifier-modal-sub');
    const bodyEl = document.getElementById('qualifier-modal-body');

    if (nameEl) nameEl.innerText = `🏊 ${first.swimmerName} - Qualification Breakdown`;
    if (subEl) {
        const seLink = seNum 
            ? `<a href="https://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=${seNum}&mode=A" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline;">Swim England Profile (${seNum}) 🔗</a>`
            : '';
        subEl.innerHTML = `Squad: <strong style="color:var(--accent-cyan);">${squad}</strong> &bull; Competition Age: <strong>${age} yrs (as of 31/12/27)</strong> (${cat}) &bull; ${seLink}`;
    }

    // Milestone count summary pills
    const regQTCount = records.filter(r => r.tier === 'Regional QT').length;
    const regCQTCount = records.filter(r => r.tier === 'Regional CQT').length;
    const bubbleCount = records.filter(r => r.tier === 'Within 2% CQT').length;
    const countyCount = records.filter(r => r.tier === 'County Qualifier' || r.hasCountyToo).length;
    const devCount = records.filter(r => r.tier === 'Developing').length;

    let summaryBadgesHTML = `
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-bottom:1.25rem;">
            <div style="background:rgba(16,185,129,0.12); border:1px solid var(--accent-emerald); padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; font-weight:700; color:var(--accent-emerald);">
                🌟 ${regQTCount} Regional Auto QT${regQTCount === 1 ? '' : 's'}
            </div>
            <div style="background:rgba(59,130,246,0.12); border:1px solid var(--accent-blue); padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; font-weight:700; color:var(--accent-blue);">
                🏅 ${regCQTCount} Regional CQT${regCQTCount === 1 ? '' : 's'}
            </div>
            <div style="background:rgba(245,158,11,0.12); border:1px solid var(--accent-amber); padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; font-weight:700; color:var(--accent-amber);">
                ⚡ ${bubbleCount} On the Bubble (≤ 2%)
            </div>
            <div style="background:rgba(139,92,246,0.12); border:1px solid var(--accent-purple); padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; font-weight:700; color:var(--accent-purple);">
                🏆 ${countyCount} County Standard${countyCount === 1 ? '' : 's'}
            </div>
            ${devCount > 0 ? `
            <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; font-weight:700; color:var(--text-muted);">
                🌱 ${devCount} Chasing Target
            </div>` : ''}
        </div>
    `;

    // Event cards with visual progress bars
    const ageStr = age >= 18 ? '18+' : String(age);
    const regAgeStr = age < 11 ? null : (age <= 12 ? '11/12' : (age >= 18 ? '18+' : String(age)));

    const eventCardsHTML = records.map(r => {
        const pbSec = Number(r.rec.timeSec) || parseQualifierTimeSec(r.rec.displayTime);
        const course = r.course;

        // Standards for this event
        const countyStdObj = (countyStds[cat] || {})[r.event]?.[ageStr];
        const countySec = countyStdObj?.seconds || null;

        let regCQT = null;
        let regQT = null;
        if (regAgeStr && Array.isArray(regStds)) {
            const regStd = regStds.find(s => s.event === r.event && s.ageGroup === regAgeStr && s.category === cat && s.course === 'SC');
            if (regStd) {
                regCQT = regStd.cqtSec;
                regQT = regStd.qtSec;
            }
        }

        // Calculate progress percentage and styling
        let progressPct = 0;
        let progressColor = 'var(--accent-cyan)';
        let statusText = '';

        if (r.tier === 'Regional QT') {
            progressPct = 100;
            progressColor = 'var(--accent-emerald)';
            statusText = `<span style="color:var(--accent-emerald); font-weight:700;">🌟 Achieved Regional Auto QT! (${Math.abs(r.diff).toFixed(2)}s faster)</span>`;
        } else if (r.tier === 'Regional CQT') {
            progressPct = 90;
            progressColor = 'var(--accent-blue)';
            const diffToQT = regQT ? ` • Just ${(pbSec - regQT).toFixed(2)}s away from Auto QT!` : '';
            statusText = `<span style="color:var(--accent-blue); font-weight:700;">🏅 Achieved Regional Consideration (CQT)!${diffToQT}</span>`;
        } else if (r.tier === 'Within 2% CQT') {
            progressPct = 82;
            progressColor = 'var(--accent-amber)';
            statusText = `<span style="color:var(--accent-amber); font-weight:700;">⚡ On the Bubble! Just +${r.diff.toFixed(2)}s off Regional CQT (${r.pct.toFixed(1)}% away)</span>`;
        } else if (r.tier === 'County Qualifier') {
            progressPct = 65;
            progressColor = 'var(--accent-purple)';
            const diffToCQT = regCQT ? ` • ${(pbSec - regCQT).toFixed(2)}s to Regional CQT` : '';
            statusText = `<span style="color:var(--accent-purple); font-weight:700;">🏆 County Consideration Achieved!${diffToCQT}</span>`;
        } else {
            progressPct = Math.max(15, Math.min(55, Math.round(100 - (r.pct || 10))));
            progressColor = 'var(--text-muted)';
            statusText = `<span style="color:var(--text-muted); font-weight:600;">🌱 Developing: +${r.diff.toFixed(2)}s off ${r.targetName} (${r.pct.toFixed(1)}%)</span>`;
        }

        const courseBadge = r.isConverted
            ? `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;" title="Converted from LC ${r.rec.originalLCDisplay || ''}">25m (SC Conv)</span>`
            : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.7rem;">25m (SC)</span>`;

        const seEventUrl = buildSwimEnglandHistoryUrl(seNum, r.event, course);

        return `
            <div style="background: rgba(15,23,42,0.65); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.15rem; margin-bottom: 0.85rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.4rem;">
                    <div>
                        <span style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${r.event}</span>
                        <span style="margin-left:0.4rem;">${courseBadge}</span>
                    </div>
                    <div style="font-family:monospace; font-size:1.15rem; font-weight:800; color:var(--accent-cyan);">
                        ${r.rec.displayTime}
                    </div>
                </div>

                <!-- Milestone Progress Bar -->
                <div class="progress-track" style="margin: 0.75rem 0 0.4rem;">
                    <div class="progress-fill" style="width: ${progressPct}%; background: ${progressColor};"></div>
                </div>

                <!-- Milestone Labels -->
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-bottom:0.6rem;">
                    <span>County (${ageStr}y): <strong>${countyStdObj ? countyStdObj.display : 'N/A'}</strong></span>
                    <span>Reg CQT (${regAgeStr ? regAgeStr + 'y' : 'N/A'}): <strong>${regCQT ? formatQualifierSeconds(regCQT) : 'N/A'}</strong></span>
                    <span>Reg QT (${regAgeStr ? regAgeStr + 'y' : 'N/A'}): <strong>${regQT ? formatQualifierSeconds(regQT) : 'N/A'}</strong></span>
                </div>

                <!-- Status Note & Progression Link -->
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.775rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.5rem; margin-top:0.25rem; flex-wrap:wrap; gap:0.5rem;">
                    <div>${statusText}</div>
                    <a href="${seEventUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600;">📊 Official SE Progression 🔗</a>
                </div>
            </div>
        `;
    }).join('');

    if (bodyEl) {
        bodyEl.innerHTML = summaryBadgesHTML + eventCardsHTML;
    }

    document.getElementById('qualifier-breakdown-modal')?.classList.remove('hidden');
}

function closeQualifierSwimmerModal() {
    document.getElementById('qualifier-breakdown-modal')?.classList.add('hidden');
}

// 9. CLUB NOTICES MODULE
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
            const docSettings = parseGoogleDocSettings(text);
            if (docSettings) {
                APP_SETTINGS = docSettings;
                applyAppSettings();
                filterSwimmers();
            }
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

// 10. INITIALIZATION
function initDashboard() {
    try {
        const rawData = window.MASTER_DASHBOARD_DATA || (typeof MASTER_DASHBOARD_DATA !== 'undefined' ? MASTER_DASHBOARD_DATA : null);
        RAW_SWIMMERS_DATA = (typeof RAW_DATA !== 'undefined' && RAW_DATA.length) 
            ? RAW_DATA 
            : (window.RAW_DATA || window.RAW_SWIMMERS_DATA || []);
        if (typeof window !== 'undefined') {
            window.RAW_SWIMMERS_DATA = RAW_SWIMMERS_DATA;
            window.RAW_DATA = RAW_SWIMMERS_DATA;
        }

        if (rawData) {
            CALENDAR_DATA = getDataset(rawData, ["Calendar", "Gala Calendar", "Events", "Gala_Calendar", "Meet Calendar", "Schedule"]);
            const rawCounty = getDataset(rawData, ["County Times", "Somerset County", "County"]);
            COUNTY_SUMMARY = rawCounty.filter(row => {
                const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
                const asa  = getRowVal(row, ['ASA Number', 'ASA']);
                return name && name !== 'Age Group Qualification Summary' && asa !== 'Swimmer Name';
            });
            const rawBSG = getDataset(rawData, ["BSG L2", "BSG Level 2", "BSG"]);
            BSG_SUMMARY = rawBSG.filter(row => {
                const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
                const asa  = getRowVal(row, ['ASA Number', 'ASA']);
                return name && asa !== 'Swimmer Name';
            });
            const rawDevlop = getDataset(rawData, ["Devlop 26", "Devlop '26", "Devlop"]);
            DEVLOP_DATA = rawDevlop.filter(row => {
                const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
                const asa  = getRowVal(row, ['ASA Number', 'ASA']);
                return name && asa !== 'Swimmer Name';
            });
            SQUAD_LIST_DATA = getDataset(rawData, ["Sept_Movements", "Squad Movements", "Movements"]);
            renderClubNotices();
        }

        loadLiveSquadMovements();
        loadLiveMeetCalendar();
        loadLiveCountyTimes();

        applyAppSettings();

        if (document.querySelector('#swimmers-table tbody')) {
            populateSwimmersDropdowns(RAW_SWIMMERS_DATA);
            filterSwimmers();
        }
        if (document.getElementById('qualifiers-table')) renderQualifiersDashboard();
        if (document.getElementById('county-times-tbody')) renderCountyTimesDashboard();
        if (document.getElementById('squad-grid')) renderSquadList();
        if (document.getElementById('calendar-table-body')) renderCalendar();

    } catch (err) {
        console.error("Swimmers Hub initialization error:", err);
    }
}

const GOOGLE_SHEET_SQUAD_CSV_URL = 'https://docs.google.com/spreadsheets/d/1J29UMv1JGfz0cemI3sMgCOierIhe8wM0Kik3p5j9ork/export?format=csv&gid=381588361';

function parseCSVRows(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        const nextCh = csvText[i + 1];

        if (ch === '"') {
            if (inQuotes && nextCh === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
            if (ch === '\r' && nextCh === '\n') {
                i++;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += ch;
        }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
        }
    }
    return rows;
}

function parseCsvToObjects(csvText) {
    if (!csvText) return [];
    const rows = parseCSVRows(csvText);
    if (rows.length <= 1) return [];
    
    let headerIdx = 0;
    for (let i = 0; i < rows.length; i++) {
        const parts = rows[i];
        if (parts.filter(Boolean).length >= 2 && !parts.some(p => p.toLowerCase().includes('weston sc') || p.toLowerCase().includes('squad list'))) {
            headerIdx = i;
            break;
        }
    }
    
    const headers = rows[headerIdx];
    const dataObjects = [];
    
    for (let i = headerIdx + 1; i < rows.length; i++) {
        const cols = rows[i];
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
                    populateSwimmersDropdowns(RAW_SWIMMERS_DATA, true);
                    filterSwimmers();
                }
                if (document.getElementById('qualifiers-table')) renderQualifiersDashboard();
                if (document.getElementById('county-times-tbody')) renderCountyTimesDashboard();
            }
        }
    } catch (e) {
        console.warn("Could not load live Google Sheet Squad Movements, using local dataset fallback:", e);
    }
}

const GOOGLE_SHEET_CALENDAR_CSV_URL = 'https://docs.google.com/spreadsheets/d/12GF4qAlknzEI-ZNsyTRozLV0d4qx1ewU__Y2yfKT_Fo/export?format=csv&gid=436293374';

let isFetchingCalendar = false;
async function loadLiveMeetCalendar() {
    if (isFetchingCalendar) return;
    isFetchingCalendar = true;
    try {
        const response = await fetch(GOOGLE_SHEET_CALENDAR_CSV_URL + '&t=' + Date.now());
        if (response.ok) {
            const csvText = await response.text();
            const parsed = parseCsvToObjects(csvText);
            if (parsed && parsed.length > 0) {
                CALENDAR_DATA = parsed;
                if (document.getElementById('calendar-table-body')) renderCalendar();
                const calendarBadge = document.getElementById('overview-calendar-badge');
                if (calendarBadge) calendarBadge.innerText = `${CALENDAR_DATA.length} Events Scheduled`;
                const indicator = document.getElementById('calendar-sync-indicator');
                if (indicator) indicator.style.display = 'inline-flex';
            }
        }
    } catch (e) {
        console.warn("Could not load live Google Sheet Meet Calendar, using local dataset fallback:", e);
    } finally {
        isFetchingCalendar = false;
    }
}

// =========================================================================
// 10. TOAST NOTIFICATION UTILITY
// =========================================================================
function showToast(message, type = 'success') {
    let toast = document.getElementById('hub-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hub-toast';
        toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; padding:12px 20px; border-radius:10px; font-weight:700; font-size:0.875rem; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:all 0.3s ease; transform:translateY(100px); opacity:0; pointer-events:none; display:flex; align-items:center; gap:8px;';
        document.body.appendChild(toast);
    }
    const bg = type === 'success' ? '#059669' : (type === 'error' ? '#e11d48' : '#0284c7');
    toast.style.background = bg;
    toast.style.color = '#ffffff';
    toast.innerHTML = (type === 'success' ? '✅ ' : (type === 'error' ? '⚠️ ' : 'ℹ️ ')) + message;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
    }, 3200);
}

function getSwimmerSquadName(swimmerName) {
    if (!SQUAD_LIST_DATA || !SQUAD_LIST_DATA.length || !swimmerName) return 'Weston SC';
    const targetNorm = swimmerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cols = Object.keys(SQUAD_LIST_DATA[0]);
    for (const col of cols) {
        if (col.toLowerCase().includes('session') || col.toLowerCase().includes('max') || col.toLowerCase().includes('time')) continue;
        for (const row of SQUAD_LIST_DATA) {
            const val = (row[col] || '').trim();
            if (val && val.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm) {
                return col.trim();
            }
        }
    }
    return 'Weston SC';
}

// =========================================================================
// 11. SWIMMER TIMES & IMPROVEMENT DOWNLOAD REPORT
// =========================================================================
let CURRENT_REPORT_SWIMMER_NAME = '';

function openCurrentSwimmerReport(passedName) {
    let swimmerName = passedName;
    if (!swimmerName) {
        swimmerName = document.getElementById('swimmers-name-select')?.value;
    }
    if (!swimmerName || swimmerName === 'NONE') {
        showToast('Please select a swimmer from the dropdown above to view and download their report.', 'error');
        return;
    }
    openSwimmerReportModal(swimmerName);
}

function openSwimmerReportModal(swimmerName) {
    if (!swimmerName || swimmerName === 'NONE') return;
    CURRENT_REPORT_SWIMMER_NAME = swimmerName;

    const modal = document.getElementById('swimmer-report-modal');
    const bodyElem = document.getElementById('swimmer-report-modal-body');
    const titleElem = document.getElementById('report-modal-title');
    const subElem = document.getElementById('report-modal-sub');
    if (!modal || !bodyElem) return;

    const targetNorm = swimmerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const swims = (RAW_SWIMMERS_DATA || []).filter(r => (r.swimmerName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm);

    if (!swims.length) {
        showToast(`No recorded swim times found for ${swimmerName}.`, 'error');
        return;
    }

    const resolvedName = swims[0].swimmerName || swimmerName;
    const seNumber = swims[0].seNumber || '-';
    const squadName = getSwimmerSquadName(resolvedName);
    const countyInfo = getCountyInfoForSwimmer(resolvedName, seNumber);

    // Group swims by Event + Course
    const eventsMap = {};
    swims.forEach(s => {
        const cCourse = getCourse(s);
        const key = `${s.event || 'Unknown'}_${cCourse}`;
        if (!eventsMap[key]) eventsMap[key] = [];
        eventsMap[key].push({ ...s, calculatedCourse: cCourse });
    });

    let totalLifetimeDropSec = 0;
    let pbCount = 0;
    const pbSummary = [];
    const allSwimsChronological = [];

    Object.keys(eventsMap).forEach(key => {
        // Sort swims chronologically ascending
        const list = eventsMap[key].sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        const first = list[0];
        const best = [...list].sort((a, b) => (Number(a.timeSec) || 999999) - (Number(b.timeSec) || 999999))[0];

        const firstSec = Number(first.timeSec) || 0;
        const bestSec = Number(best.timeSec) || 0;
        const dropSec = (firstSec && bestSec && firstSec > bestSec) ? (firstSec - bestSec) : 0;
        const pctImprove = (firstSec > 0 && dropSec > 0) ? ((dropSec / firstSec) * 100) : 0;

        totalLifetimeDropSec += dropSec;
        pbCount++;

        const cStatus = checkCountyStatusForRecord(resolvedName, seNumber, best.event);

        pbSummary.push({
            event: best.event,
            course: best.calculatedCourse,
            baselineTime: first.displayTime || '-',
            baselineDate: first.date || '-',
            baselineMeet: first.meetName || first.venue || '-',
            pbTime: best.displayTime || '-',
            convertedTime: best.convertedTime || '-',
            pbSec: bestSec,
            pbDate: best.date || '-',
            meetName: best.meetName || best.venue || '-',
            venue: best.venue || '-',
            waPoints: best.waPoints || '-',
            swimsCount: list.length,
            timeDroppedSec: dropSec,
            improvementPct: pctImprove,
            countyStatus: cStatus,
            history: list
        });

        // Add to chronological log with split vs previous swim in this event
        list.forEach((swim, idx) => {
            let deltaSec = null;
            let deltaPct = null;
            if (idx > 0) {
                const prevSec = Number(list[idx - 1].timeSec) || 0;
                const curSec = Number(swim.timeSec) || 0;
                if (prevSec && curSec) {
                    deltaSec = prevSec - curSec;
                    deltaPct = (deltaSec / prevSec) * 100;
                }
            }
            allSwimsChronological.push({
                ...swim,
                deltaSec,
                deltaPct,
                isPBInList: (Number(swim.timeSec) === bestSec)
            });
        });
    });

    // Sort PB Summary alphabetically by Event name, then Course
    pbSummary.sort((a, b) => {
        const evDiff = (a.event || '').localeCompare(b.event || '');
        if (evDiff !== 0) return evDiff;
        return (a.course || '').localeCompare(b.course || '');
    });

    // Sort race history by date descending
    allSwimsChronological.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));

    const qualifiedEventsCount = countyInfo ? (countyInfo.qualifiedCount || 0) : 0;
    const maxWaPoints = Math.max(0, ...swims.map(s => Number(s.waPoints) || 0));

    // Update modal title & subtitle
    if (titleElem) titleElem.innerText = `🏊 ${resolvedName} - Official Times & Progress Report`;
    if (subElem) {
        const reportDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        subElem.innerText = `SE #${seNumber} • Squad: ${squadName} • Generated: ${reportDateStr}`;
    }

    // Build the Report HTML
    const reportHTML = `
        <div class="print-report-container">
            <!-- Printable Official Club Header -->
            <div style="border-bottom: 2px solid var(--accent-cyan); padding-bottom: 1.25rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="font-size: 1.4rem; font-weight: 900; letter-spacing: -0.02em; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                        <span>🏊 Weston-super-Mare Swimming Club</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                        Official Swimmer Performance, Qualification & Improvement Report
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-cyan);">${resolvedName}</div>
                    <div style="font-size: 0.825rem; color: var(--text-muted); margin-top: 0.15rem;">
                        Swim England #: <strong style="color:var(--text-main); font-family:monospace;">${seNumber}</strong> • Squad: <strong>${squadName}</strong>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                        Report Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            <!-- Executive Performance KPI Tiles -->
            <div class="report-kpi-grid">
                <div class="report-kpi-box">
                    <div class="report-kpi-val" style="color: var(--accent-cyan);">${pbSummary.length}</div>
                    <div class="report-kpi-lbl">Personal Bests Tracked</div>
                </div>
                <div class="report-kpi-box">
                    <div class="report-kpi-val" style="color: var(--accent-emerald);">
                        ${totalLifetimeDropSec > 0 ? `-${totalLifetimeDropSec.toFixed(2)}s` : 'Baseline'}
                    </div>
                    <div class="report-kpi-lbl">Cumulative Time Dropped</div>
                </div>
                <div class="report-kpi-box">
                    <div class="report-kpi-val" style="color: var(--accent-purple);">
                        ${qualifiedEventsCount > 0 ? `🏆 ${qualifiedEventsCount} Qualified` : 'Developing'}
                    </div>
                    <div class="report-kpi-lbl">Somerset County Status</div>
                </div>
                <div class="report-kpi-box">
                    <div class="report-kpi-val" style="color: var(--accent-amber);">${maxWaPoints > 0 ? maxWaPoints : '-'} pts</div>
                    <div class="report-kpi-lbl">Peak WA Points</div>
                </div>
                <div class="report-kpi-box">
                    <div class="report-kpi-val" style="color: var(--accent-blue);">${swims.length}</div>
                    <div class="report-kpi-lbl">Total Recorded Swims</div>
                </div>
            </div>

            ${qualifiedEventsCount > 0 ? `
                <div style="background: rgba(16,185,129,0.12); border: 1px solid var(--accent-emerald); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.3rem;">🏆</span>
                    <div style="font-size: 0.85rem; color: var(--text-main);">
                        <strong>Somerset County Championship Qualifier:</strong> Qualified in <strong>${qualifiedEventsCount} events</strong> (${(countyInfo.qualifiedEvents || []).join(', ')})
                    </div>
                </div>
            ` : ''}

            <!-- SECTION 1: Personal Bests & Lifetime Improvement Summary -->
            <div style="margin-bottom: 1.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.6rem;">
                    <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0;">
                        ⭐ Personal Bests & Time Improvement Over Time
                    </h4>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">${pbSummary.length} Events Recorded</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Course</th>
                                <th>Current PB</th>
                                <th>Converted</th>
                                <th>Baseline (First)</th>
                                <th>Time Dropped</th>
                                <th>% Improvement</th>
                                <th>WA Pts</th>
                                <th>PB Date</th>
                                <th>Meet / Gala</th>
                                <th>County Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pbSummary.map(r => {
                                const courseBadge = r.course === 'LC'
                                    ? `<span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); border:1px solid var(--accent-cyan); padding:0.1rem 0.35rem; border-radius:4px; font-weight:700; font-size:0.7rem;">50m LC</span>`
                                    : `<span style="background:rgba(217,119,6,0.15); color:var(--accent-amber); border:1px solid var(--accent-amber); padding:0.1rem 0.35rem; border-radius:4px; font-weight:700; font-size:0.7rem;">25m SC</span>`;

                                let dropDisplay = '<span class="drop-neutral">-</span>';
                                let pctDisplay = '<span class="drop-neutral">-</span>';

                                if (r.swimsCount > 1) {
                                    if (r.timeDroppedSec > 0) {
                                        dropDisplay = `<span class="drop-good">-${r.timeDroppedSec.toFixed(2)}s 🚀</span>`;
                                        pctDisplay = `<span class="drop-good">+${r.improvementPct.toFixed(1)}%</span>`;
                                    } else {
                                        dropDisplay = `<span class="drop-neutral">0.00s</span>`;
                                        pctDisplay = `<span class="drop-neutral">0.0%</span>`;
                                    }
                                } else {
                                    dropDisplay = `<span class="drop-neutral" title="Initial benchmark established">Baseline</span>`;
                                    pctDisplay = `<span class="drop-neutral" title="Initial benchmark established">Established</span>`;
                                }

                                const countyBadge = r.countyStatus === 'QUALIFIED'
                                    ? `<span class="event-pill-qual">🏆 Qualified</span>`
                                    : (r.countyStatus === 'SLOWER' ? `<span class="event-pill-slower">Slower</span>` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>');

                                const waDisplay = (r.waPoints && r.waPoints !== '-')
                                    ? `<span style="font-weight:700; color:${r.waPoints >= 400 ? 'var(--accent-emerald)' : 'var(--text-main)'}">${r.waPoints}</span>`
                                    : '-';

                                return `
                                    <tr>
                                        <td style="font-weight:700;">${r.event}</td>
                                        <td>${courseBadge}</td>
                                        <td style="font-family:monospace; font-weight:800; color:var(--accent-cyan);">${r.pbTime}</td>
                                        <td style="font-family:monospace; color:var(--text-muted); font-size:0.8rem;">${r.convertedTime}</td>
                                        <td style="font-family:monospace; color:var(--text-muted); font-size:0.8rem;">${r.baselineTime}</td>
                                        <td>${dropDisplay}</td>
                                        <td>${pctDisplay}</td>
                                        <td>${waDisplay}</td>
                                        <td style="color:var(--text-muted); font-size:0.8rem;">${formatDateDDMMYYYY(r.pbDate)}</td>
                                        <td style="color:var(--text-muted); font-size:0.8rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.meetName}">${r.meetName}</td>
                                        <td>${countyBadge}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 2: Race Progression & Competition Log -->
            <div style="margin-bottom: 1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.6rem;">
                    <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0;">
                        📜 Competition Progression Log (Chronological Swims)
                    </h4>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">${allSwimsChronological.length} Recorded Races</span>
                </div>
                <div class="table-container" style="max-height: 380px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Event</th>
                                <th>Course</th>
                                <th>Time</th>
                                <th>Race Split vs Prior</th>
                                <th>WA Pts</th>
                                <th>Meet / Gala</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allSwimsChronological.map(s => {
                                let deltaBadge = '<span style="color:var(--text-muted);">-</span>';
                                if (s.deltaSec !== null) {
                                    if (s.deltaSec > 0) {
                                        deltaBadge = `<span class="drop-good">-${s.deltaSec.toFixed(2)}s 🚀</span>`;
                                    } else if (s.deltaSec < 0) {
                                        deltaBadge = `<span class="drop-warn">+${Math.abs(s.deltaSec).toFixed(2)}s</span>`;
                                    } else {
                                        deltaBadge = `<span class="drop-neutral">0.00s</span>`;
                                    }
                                }

                                const pbStar = s.isPBInList ? `<span style="color:var(--accent-amber); margin-left:0.3rem;" title="Current Event PB">⭐</span>` : '';

                                return `
                                    <tr>
                                        <td style="font-weight:600; color:var(--text-main);">${formatDateDDMMYYYY(s.date)}</td>
                                        <td style="font-weight:700;">${s.event || '-'}</td>
                                        <td>${s.calculatedCourse || s.course}</td>
                                        <td style="font-family:monospace; font-weight:700; color:var(--accent-cyan);">${s.displayTime || '-'}${pbStar}</td>
                                        <td>${deltaBadge}</td>
                                        <td>${s.waPoints || '-'}</td>
                                        <td style="color:var(--text-muted); font-size:0.8rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${s.meetName}">${s.meetName || '-'}</td>
                                        <td style="color:var(--text-muted); font-size:0.8rem;">${s.venue || '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Report Footer -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted);">
                <div>Weston-super-Mare Swimming Club • Performance Analytics Hub</div>
                <div>Official Swim England Progression Data Grounded</div>
            </div>
        </div>
    `;

    bodyElem.innerHTML = reportHTML;
    modal.classList.remove('hidden');
}

function closeSwimmerReportModal() {
    document.getElementById('swimmer-report-modal')?.classList.add('hidden');
}

function printSwimmerReport() {
    window.print();
}

function downloadSwimmerReportCSV(passedName) {
    const swimmerName = passedName || CURRENT_REPORT_SWIMMER_NAME;
    if (!swimmerName) return;

    const targetNorm = swimmerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const swims = (RAW_SWIMMERS_DATA || []).filter(r => (r.swimmerName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm);
    if (!swims.length) return;

    const resolvedName = swims[0].swimmerName || swimmerName;
    const seNumber = swims[0].seNumber || '';
    const squadName = getSwimmerSquadName(resolvedName);
    const countyInfo = getCountyInfoForSwimmer(resolvedName, seNumber);

    // Group by Event + Course
    const eventsMap = {};
    swims.forEach(s => {
        const cCourse = getCourse(s);
        const key = `${s.event}_${cCourse}`;
        if (!eventsMap[key]) eventsMap[key] = [];
        eventsMap[key].push({ ...s, calculatedCourse: cCourse });
    });

    let totalLifetimeDropSec = 0;
    const pbSummary = [];
    const allSwimsChronological = [];

    Object.keys(eventsMap).forEach(key => {
        const list = eventsMap[key].sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        const first = list[0];
        const best = [...list].sort((a, b) => (Number(a.timeSec) || 999999) - (Number(b.timeSec) || 999999))[0];

        const firstSec = Number(first.timeSec) || 0;
        const bestSec = Number(best.timeSec) || 0;
        const dropSec = (firstSec && bestSec && firstSec > bestSec) ? (firstSec - bestSec) : 0;
        const pctImprove = (firstSec > 0 && dropSec > 0) ? ((dropSec / firstSec) * 100) : 0;
        totalLifetimeDropSec += dropSec;

        const cStatus = checkCountyStatusForRecord(resolvedName, seNumber, best.event);

        pbSummary.push({
            event: best.event,
            course: best.calculatedCourse,
            pbTime: best.displayTime,
            convertedTime: best.convertedTime,
            baselineTime: first.displayTime,
            baselineDate: first.date,
            timeDroppedSec: dropSec,
            improvementPct: pctImprove,
            waPoints: best.waPoints,
            pbDate: best.date,
            meetName: best.meetName,
            venue: best.venue,
            countyStatus: cStatus,
            swimsCount: list.length
        });

        list.forEach((swim, idx) => {
            let deltaSec = null;
            if (idx > 0) {
                const prevSec = Number(list[idx - 1].timeSec) || 0;
                const curSec = Number(swim.timeSec) || 0;
                if (prevSec && curSec) deltaSec = prevSec - curSec;
            }
            allSwimsChronological.push({
                ...swim,
                deltaSec
            });
        });
    });

    pbSummary.sort((a, b) => a.event.localeCompare(b.event));
    allSwimsChronological.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));

    const lines = [];
    lines.push(`"WESTON-SUPER-MARE SWIMMING CLUB - SWIMMER PERFORMANCE & PROGRESSION REPORT"`);
    lines.push(`"Swimmer Name:","${resolvedName}","Swim England #:","${seNumber}","Squad:","${squadName}","Date Generated:","${new Date().toLocaleDateString('en-GB')}"`);
    lines.push(`"Total Events Tracked:","${pbSummary.length}","Total Recorded Swims:","${swims.length}","Total Cumulative Time Dropped:","-${totalLifetimeDropSec.toFixed(2)}s","County Status:","${countyInfo ? (countyInfo.qualifiedCount + ' Events Qualified') : 'Developing'}"`);
    lines.push(``);
    lines.push(`"PERSONAL BESTS & LIFETIME IMPROVEMENT SUMMARY"`);
    lines.push(`"Event","Course","Current PB","Converted Time","Baseline Time","Baseline Date","Time Dropped (sec)","Improvement %","WA Points","PB Date","Meet / Gala","Venue","Somerset County Status","Total Swims"`);

    pbSummary.forEach(r => {
        const dropStr = r.swimsCount > 1 ? (r.timeDroppedSec > 0 ? `-${r.timeDroppedSec.toFixed(2)}` : '0.00') : 'Baseline';
        const pctStr = r.swimsCount > 1 ? `${r.improvementPct.toFixed(1)}%` : 'Established';
        lines.push(`"${r.event}","${r.course}","${r.pbTime}","${r.convertedTime || ''}","${r.baselineTime}","${r.baselineDate}","${dropStr}","${pctStr}","${r.waPoints || '-'}","${r.pbDate}","${(r.meetName || '').replace(/"/g, '""')}","${(r.venue || '').replace(/"/g, '""')}","${r.countyStatus || '-'}","${r.swimsCount}"`);
    });

    lines.push(``);
    lines.push(`"CHRONOLOGICAL RACE PROGRESSION LOG"`);
    lines.push(`"Date","Event","Course","Recorded Time","Time Dropped vs Prior Swim (sec)","WA Points","Meet / Gala","Venue"`);

    allSwimsChronological.forEach(s => {
        const deltaStr = s.deltaSec !== null ? (s.deltaSec > 0 ? `-${s.deltaSec.toFixed(2)}` : (s.deltaSec < 0 ? `+${Math.abs(s.deltaSec).toFixed(2)}` : '0.00')) : '-';
        lines.push(`"${s.date}","${s.event}","${s.calculatedCourse || s.course}","${s.displayTime}","${deltaStr}","${s.waPoints || '-'}","${(s.meetName || '').replace(/"/g, '""')}","${(s.venue || '').replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFileName = resolvedName.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Weston_SC_Report_${cleanFileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded performance report for ${resolvedName}!`);
}

function copySwimmerReportTable(passedName) {
    const swimmerName = passedName || CURRENT_REPORT_SWIMMER_NAME;
    if (!swimmerName) return;

    const targetNorm = swimmerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const swims = (RAW_SWIMMERS_DATA || []).filter(r => (r.swimmerName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm);
    if (!swims.length) return;

    const eventsMap = {};
    swims.forEach(s => {
        const cCourse = getCourse(s);
        const key = `${s.event}_${cCourse}`;
        if (!eventsMap[key]) eventsMap[key] = [];
        eventsMap[key].push({ ...s, calculatedCourse: cCourse });
    });

    const pbSummary = [];
    Object.keys(eventsMap).forEach(key => {
        const list = eventsMap[key].sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        const first = list[0];
        const best = [...list].sort((a, b) => (Number(a.timeSec) || 999999) - (Number(b.timeSec) || 999999))[0];
        const firstSec = Number(first.timeSec) || 0;
        const bestSec = Number(best.timeSec) || 0;
        const dropSec = (firstSec && bestSec && firstSec > bestSec) ? (firstSec - bestSec) : 0;
        const pctImprove = (firstSec > 0 && dropSec > 0) ? ((dropSec / firstSec) * 100) : 0;
        pbSummary.push({
            event: best.event,
            course: best.calculatedCourse,
            pbTime: best.displayTime,
            convertedTime: best.convertedTime,
            baselineTime: first.displayTime,
            timeDroppedSec: dropSec,
            improvementPct: pctImprove,
            waPoints: best.waPoints,
            pbDate: best.date,
            meetName: best.meetName,
            countyStatus: checkCountyStatusForRecord(swimmerName, best.seNumber, best.event),
            swimsCount: list.length
        });
    });

    pbSummary.sort((a, b) => a.event.localeCompare(b.event));

    const rows = [];
    rows.push(['Event', 'Course', 'Current PB', 'Converted Time', 'Baseline Time', 'Time Dropped', '% Improvement', 'WA Points', 'PB Date', 'Meet / Gala', 'County Status'].join('\t'));
    pbSummary.forEach(r => {
        const dropStr = r.swimsCount > 1 ? (r.timeDroppedSec > 0 ? `-${r.timeDroppedSec.toFixed(2)}s` : '0.00s') : 'Baseline';
        const pctStr = r.swimsCount > 1 ? `${r.improvementPct.toFixed(1)}%` : 'Established';
        rows.push([
            r.event,
            r.course,
            r.pbTime,
            r.convertedTime || '',
            r.baselineTime,
            dropStr,
            pctStr,
            r.waPoints || '-',
            r.pbDate,
            r.meetName || '',
            r.countyStatus || '-'
        ].join('\t'));
    });

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rows.join('\n')).then(() => {
            showToast('Performance table copied to clipboard! Ready to paste into Google Sheets.');
        }).catch(() => {
            showToast('Could not copy automatically. Please use Download CSV.', 'error');
        });
    } else {
        showToast('Clipboard access not available. Please use Download CSV.', 'error');
    }
}

// =========================================================================
// 12. SOMERSET COUNTY TIMES & GOOGLE SHEET SYNC MODULE
// =========================================================================
const COUNTY_SHEET_STORAGE_KEY = 'WESTON_COUNTY_TIMES_SHEET_URL';
const DEFAULT_COUNTY_SHEET_URL = '';

let LIVE_COUNTY_DATA = [];
let ACTIVE_COUNTY_VIEW_MODE = 'swimmers';
let isFetchingCountyTimes = false;

function normalizeGoogleSheetUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (url.includes('/export?format=csv')) return url;
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) return url;
    const sheetId = idMatch[1];
    let gid = '';
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch) {
        gid = `&gid=${gidMatch[1]}`;
    }
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
}

function getCountySheetUrl() {
    try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(COUNTY_SHEET_STORAGE_KEY) : null;
        // Purge if stored URL is the squad movements sheet by mistake
        if (stored && (stored.includes('381588361') || stored.includes('1J29UMv1JGfz0cemI3sMgCOierIhe8wM0Kik3p5j9ork'))) {
            localStorage.removeItem(COUNTY_SHEET_STORAGE_KEY);
            return DEFAULT_COUNTY_SHEET_URL;
        }
        return stored || DEFAULT_COUNTY_SHEET_URL;
    } catch (e) {
        return DEFAULT_COUNTY_SHEET_URL;
    }
}

async function loadLiveCountyTimes(forceRefresh = false) {
    if (isFetchingCountyTimes) return;
    isFetchingCountyTimes = true;

    const statusBadge = document.getElementById('county-sync-status-badge');
    const statusText = document.getElementById('county-sync-status-text');
    const lastTimeText = document.getElementById('county-sync-last-time');

    const sheetUrl = getCountySheetUrl();
    const normalizedUrl = normalizeGoogleSheetUrl(sheetUrl);

    if (!normalizedUrl) {
        LIVE_COUNTY_DATA = [];
        if (statusBadge) {
            statusBadge.style.background = 'rgba(6,182,212,0.15)';
            statusBadge.style.color = 'var(--accent-cyan)';
            statusBadge.style.borderColor = 'var(--accent-cyan)';
        }
        if (statusText) statusText.innerText = 'Club Dataset Active';
        if (lastTimeText) lastTimeText.innerText = 'Built-in Master Data';
        isFetchingCountyTimes = false;
        renderCountyTimesDashboard();
        return;
    }

    try {
        const fetchUrl = normalizedUrl + (normalizedUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        const response = await fetch(fetchUrl);
        if (response.ok) {
            const csvText = await response.text();
            const parsed = parseCsvToObjects(csvText);

            // Strictly validate that this sheet actually contains swimmer county qualification rows:
            const validCountyRows = (parsed || []).filter(row => {
                const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
                const asa  = getRowVal(row, ['ASA Number', 'ASA']);
                const hasQualCol = Object.keys(row).some(k => {
                    const lk = k.toLowerCase();
                    return lk.includes('qualified') || lk.includes('slower') || lk.includes('event');
                });
                return name && name !== 'Age Group Qualification Summary' && asa !== 'Swimmer Name' && hasQualCol;
            });

            if (validCountyRows.length > 0) {
                LIVE_COUNTY_DATA = validCountyRows;
                COUNTY_SUMMARY = validCountyRows;

                if (statusBadge) {
                    statusBadge.style.background = 'rgba(16,185,129,0.15)';
                    statusBadge.style.color = 'var(--accent-emerald)';
                    statusBadge.style.borderColor = 'var(--accent-emerald)';
                }
                if (statusText) statusText.innerText = 'Live Google Sheet Synced';
                if (lastTimeText) {
                    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    lastTimeText.innerText = `Synced at ${timeStr}`;
                }
                renderCountyTimesDashboard();
                if (forceRefresh) showToast('Live Somerset County times successfully refreshed from Google Sheet!');
                return;
            } else {
                console.warn('Connected Google Sheet does not contain swimmer county qualification columns. Keeping built-in club dataset.');
                LIVE_COUNTY_DATA = [];
                if (forceRefresh) showToast('Google Sheet reached, but no county times columns were found. Displaying club dataset.', 'warning');
            }
        }
    } catch (err) {
        console.warn('Could not fetch live Google Sheet County Times, falling back to local dataset:', err);
        LIVE_COUNTY_DATA = [];
    } finally {
        isFetchingCountyTimes = false;
    }

    if (!LIVE_COUNTY_DATA.length && typeof MASTER_DASHBOARD_DATA !== 'undefined' && MASTER_DASHBOARD_DATA['County Times']) {
        LIVE_COUNTY_DATA = [];
    }

    if (statusBadge) {
        statusBadge.style.background = 'rgba(6,182,212,0.15)';
        statusBadge.style.color = 'var(--accent-cyan)';
        statusBadge.style.borderColor = 'var(--accent-cyan)';
    }
    if (statusText) statusText.innerText = 'Club Dataset Active';
    if (lastTimeText) lastTimeText.innerText = 'Built-in Master Data';

    renderCountyTimesDashboard();
}

function openCountySheetModal() {
    const modal = document.getElementById('county-sheet-modal');
    const input = document.getElementById('county-sheet-input-url');
    if (input) input.value = getCountySheetUrl();
    const resultBox = document.getElementById('county-sheet-test-result');
    if (resultBox) resultBox.style.display = 'none';
    if (modal) modal.classList.remove('hidden');
}

function closeCountySheetModal() {
    document.getElementById('county-sheet-modal')?.classList.add('hidden');
}

function saveCountySheetUrl() {
    const input = document.getElementById('county-sheet-input-url');
    const rawVal = input?.value ? input.value.trim() : '';
    if (!rawVal) {
        showToast('Please enter a valid Google Sheet URL.', 'error');
        return;
    }

    const normalized = normalizeGoogleSheetUrl(rawVal);
    localStorage.setItem(COUNTY_SHEET_STORAGE_KEY, normalized);
    closeCountySheetModal();
    showToast('Google Sheet URL saved! Fetching live updates...');
    loadLiveCountyTimes(true);
}

function resetCountySheetUrl() {
    localStorage.removeItem(COUNTY_SHEET_STORAGE_KEY);
    const input = document.getElementById('county-sheet-input-url');
    if (input) input.value = '';
    LIVE_COUNTY_DATA = [];
    closeCountySheetModal();
    showToast('Restored built-in Somerset County club dataset.');
    loadLiveCountyTimes(true);
}

function setCountyTimesViewMode(mode) {
    ACTIVE_COUNTY_VIEW_MODE = mode;
    const btnSwimmers = document.getElementById('county-mode-btn-swimmers');
    const btnStandards = document.getElementById('county-mode-btn-standards');
    const containerSwimmers = document.getElementById('county-swimmers-table-container');
    const containerStandards = document.getElementById('county-standards-table-container');
    const filtersRow = document.getElementById('county-swimmer-filters');

    if (mode === 'swimmers') {
        if (btnSwimmers) {
            btnSwimmers.style.background = 'var(--accent-cyan)';
            btnSwimmers.style.color = '#04131f';
            btnSwimmers.style.border = 'none';
        }
        if (btnStandards) {
            btnStandards.style.background = 'rgba(255,255,255,0.06)';
            btnStandards.style.color = 'var(--text-muted)';
            btnStandards.style.border = '1px solid var(--border-color)';
        }
        if (containerSwimmers) containerSwimmers.style.display = '';
        if (containerStandards) containerStandards.style.display = 'none';
        if (filtersRow) filtersRow.style.display = 'flex';
        filterCountyTimes();
    } else {
        if (btnStandards) {
            btnStandards.style.background = 'var(--accent-cyan)';
            btnStandards.style.color = '#04131f';
            btnStandards.style.border = 'none';
        }
        if (btnSwimmers) {
            btnSwimmers.style.background = 'rgba(255,255,255,0.06)';
            btnSwimmers.style.color = 'var(--text-muted)';
            btnSwimmers.style.border = '1px solid var(--border-color)';
        }
        if (containerSwimmers) containerSwimmers.style.display = 'none';
        if (containerStandards) containerStandards.style.display = '';
        if (filtersRow) filtersRow.style.display = 'none';
        renderCountyStandardsTable();
    }
}

function goToCountyTimesForSwimmer(swimmerName) {
    closeSwimmerModal();
    switchView('countytimes');
    const searchInput = document.getElementById('county-search-input');
    if (searchInput) {
        searchInput.value = swimmerName || '';
        filterCountyTimes();
    }
}

function getActiveSquadCountyData() {
    const rawList = (LIVE_COUNTY_DATA && LIVE_COUNTY_DATA.length) 
        ? LIVE_COUNTY_DATA 
        : (COUNTY_SUMMARY && COUNTY_SUMMARY.length ? COUNTY_SUMMARY : (typeof MASTER_DASHBOARD_DATA !== 'undefined' ? (MASTER_DASHBOARD_DATA['County Times'] || []) : []));

    const activeSquadList = getActiveSquadSwimmerNames();
    const squadSwimmersSet = new Set(activeSquadList.map(n => (n || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')));

    // Strict business rule: ONLY swimmers currently in Squad Movements (1J29UMv1JGfz0cemI3sMgCOierIhe8wM0Kik3p5j9ork) are tracked
    return rawList.filter(row => {
        const name = getRowVal(row, ['Swimmer Name', 'Name', 'Selected Name']);
        const asa  = getRowVal(row, ['ASA Number', 'ASA']);
        if (!name || name === 'Age Group Qualification Summary' || asa === 'Swimmer Name') return false;
        
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return squadSwimmersSet.has(cleanName);
    });
}

function renderCountyTimesDashboard() {
    const data = getActiveSquadCountyData();

    let totalSwimmers = data.length;
    let qualifiedSwimmersCount = 0;
    let totalQualifiedSwims = 0;
    let totalSlowerSwims = 0;

    data.forEach(r => {
        const qCount = parseInt(getRowVal(r, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        const sCount = parseInt(getRowVal(r, ['Slower Events Count', 'Slower Count', 'Slower']), 10) || 0;
        if (qCount > 0) qualifiedSwimmersCount++;
        totalQualifiedSwims += qCount;
        totalSlowerSwims += sCount;
    });

    const elTotalSwimmers = document.getElementById('kpi-count-county-swimmers');
    const elSubTotalSwimmers = document.getElementById('kpi-sub-county-swimmers');
    const elQualSwimmers = document.getElementById('kpi-count-county-qualified-swimmers');
    const elSubQualSwimmers = document.getElementById('kpi-sub-county-qualified-swimmers');
    const elQualSwims = document.getElementById('kpi-count-county-qualified-swims');
    const elSlowerSwims = document.getElementById('kpi-count-county-slower-swims');

    if (elTotalSwimmers) elTotalSwimmers.innerText = totalSwimmers;
    if (elSubTotalSwimmers) elSubTotalSwimmers.innerText = `${totalSwimmers} Swimmers Tracked`;
    if (elQualSwimmers) elQualSwimmers.innerText = qualifiedSwimmersCount;
    if (elSubQualSwimmers) elSubQualSwimmers.innerText = `${qualifiedSwimmersCount} Swimmers with ≥1 QT`;
    if (elQualSwims) elQualSwims.innerText = totalQualifiedSwims;
    if (elSlowerSwims) elSlowerSwims.innerText = totalSlowerSwims;

    const overviewBadge = document.getElementById('overview-countytimes-badge');
    if (overviewBadge) {
        overviewBadge.innerText = `${qualifiedSwimmersCount} Swimmers • ${totalQualifiedSwims} QTs`;
    }

    // Populate Squad Dropdown
    const squadSelect = document.getElementById('county-squad-select');
    if (squadSelect) {
        const curVal = squadSelect.value;
        const squads = new Set();
        data.forEach(r => {
            const name = getRowVal(r, ['Swimmer Name', 'Name', 'Selected Name']);
            const sq = getSwimmerSquadName(name);
            if (sq) squads.add(sq);
        });
        const sortedSquads = Array.from(squads).sort();
        squadSelect.innerHTML = `<option value="ALL">All Squads (${sortedSquads.length})</option>` +
            sortedSquads.map(s => `<option value="${s}">${s}</option>`).join('');
        if (curVal && Array.from(squadSelect.options).some(o => o.value === curVal)) {
            squadSelect.value = curVal;
        }
    }

    if (ACTIVE_COUNTY_VIEW_MODE === 'standards') {
        renderCountyStandardsTable();
    } else {
        filterCountyTimes();
    }
}

function filterCountyTimes() {
    const data = getActiveSquadCountyData();

    const searchVal = (document.getElementById('county-search-input')?.value || '').trim().toLowerCase();
    const squadVal = document.getElementById('county-squad-select')?.value || 'ALL';
    const statusVal = document.getElementById('county-status-select')?.value || 'ALL';
    const genderVal = document.getElementById('county-gender-select')?.value || 'ALL';
    const ageVal = document.getElementById('county-age-select')?.value || 'ALL';

    const filtered = data.filter(r => {
        const name = getRowVal(r, ['Swimmer Name', 'Name', 'Selected Name']);
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const gender = getRowVal(r, ['Gender', 'Sex']);
        const age = getRowVal(r, ['Age', 'Age Group']);
        const squad = getSwimmerSquadName(name);
        const qCount = parseInt(getRowVal(r, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;

        const allEvents = [];
        for (let i = 1; i <= 20; i++) {
            const ev = getRowVal(r, [`Event ${i}`, `Event${i}`]);
            if (ev) allEvents.push(ev);
        }
        const fullSearchText = `${name} ${asa} ${gender} ${age} ${squad} ${allEvents.join(' ')}`.toLowerCase();

        if (searchVal && !fullSearchText.includes(searchVal)) return false;
        if (squadVal !== 'ALL' && squad !== squadVal) return false;
        if (genderVal !== 'ALL') {
            if (genderVal === 'Girls' && !gender.toLowerCase().includes('girl') && !gender.toLowerCase().includes('female')) return false;
            if (genderVal === 'Boys' && !gender.toLowerCase().includes('boy') && !gender.toLowerCase().includes('male')) return false;
        }
        if (ageVal !== 'ALL') {
            if (ageVal === '18+' && parseInt(age, 10) < 18) return false;
            if (ageVal !== '18+' && String(age) !== String(ageVal)) return false;
        }
        if (statusVal === 'QUALIFIED' && qCount === 0) return false;
        if (statusVal === 'DEVELOPING' && qCount > 0) return false;

        return true;
    });

    const resultCountEl = document.getElementById('county-result-count');
    if (resultCountEl) {
        resultCountEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${data.length}</strong> Weston SC swimmers in Somerset County Matrix`;
    }

    const tbody = document.getElementById('county-times-tbody');
    if (!tbody) return;

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2.5rem;">No matching Somerset County swimmer records found.</td></tr>`;
        return;
    }

    filtered.sort((a, b) => {
        const qA = parseInt(getRowVal(a, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        const qB = parseInt(getRowVal(b, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        if (qB !== qA) return qB - qA;
        const nA = getRowVal(a, ['Swimmer Name', 'Name', 'Selected Name']);
        const nB = getRowVal(b, ['Swimmer Name', 'Name', 'Selected Name']);
        return nA.localeCompare(nB);
    });

    tbody.innerHTML = filtered.map(r => {
        const name = getRowVal(r, ['Swimmer Name', 'Name', 'Selected Name']);
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const gender = getRowVal(r, ['Gender', 'Sex']) || '-';
        const age = getRowVal(r, ['Age', 'Age Group']) || '-';
        const squad = getSwimmerSquadName(name);
        const timesTracked = getRowVal(r, ['Events With Times', 'Times Tracked']) || '-';
        const qCount = parseInt(getRowVal(r, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        const sCount = parseInt(getRowVal(r, ['Slower Events Count', 'Slower Count', 'Slower']), 10) || 0;

        const qualPills = [];
        const slowerPills = [];

        for (let i = 1; i <= 20; i++) {
            const ev = getRowVal(r, [`Event ${i}`, `Event${i}`]);
            if (ev) {
                if (ev.toLowerCase().includes('qualified')) {
                    const cleanName = ev.replace(/\s*\(qualified\)\s*/i, '').trim();
                    qualPills.push(`<span class="event-pill-qual">✓ ${cleanName}</span>`);
                } else if (ev.toLowerCase().includes('slower')) {
                    const cleanName = ev.replace(/\s*\(slower\)\s*/i, '').trim();
                    slowerPills.push(`<span class="event-pill-slower">${cleanName}</span>`);
                }
            }
        }

        const qualCountBadge = qCount > 0
            ? `<span style="background:rgba(16,185,129,0.18); color:var(--accent-emerald); border:1px solid var(--accent-emerald); font-weight:800; font-size:0.75rem; padding:0.18rem 0.55rem; border-radius:6px;">🏆 ${qCount} Qualified</span>`
            : `<span style="color:var(--text-muted); font-size:0.75rem;">0 QTs</span>`;

        const slowerCountBadge = sCount > 0
            ? `<span style="background:rgba(245,158,11,0.12); color:var(--accent-amber); border:1px solid rgba(245,158,11,0.4); font-weight:700; font-size:0.75rem; padding:0.18rem 0.55rem; border-radius:6px;">${sCount} Chasing</span>`
            : `<span style="color:var(--text-muted); font-size:0.75rem;">-</span>`;

        const swimmerLink = `<a href="javascript:void(0)" onclick="openSwimmerModal('${asa}', '${name.replace(/'/g, "\\'")}')" style="color:var(--text-main); font-weight:700; text-decoration:none; border-bottom:1px dashed var(--accent-cyan);" title="Click to view full swimmer profile & PBs">${name} 👤</a>`;

        return `
            <tr>
                <td>${swimmerLink}</td>
                <td style="font-family:monospace; color:var(--accent-cyan); font-weight:600;">${asa || '-'}</td>
                <td><span style="font-size:0.8rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-color); padding:0.15rem 0.45rem; border-radius:4px;">${squad}</span></td>
                <td>${gender} (Age ${age})</td>
                <td style="font-weight:600;">${timesTracked}</td>
                <td>${qualCountBadge}</td>
                <td>${slowerCountBadge}</td>
                <td style="max-width:280px;">${qualPills.length ? qualPills.join(' ') : '<span style="color:var(--text-muted); font-size:0.75rem;">None</span>'}</td>
                <td style="max-width:280px;">${slowerPills.length ? slowerPills.join(' ') : '<span style="color:var(--text-muted); font-size:0.75rem;">None</span>'}</td>
            </tr>
        `;
    }).join('');
}

function renderCountyStandardsTable() {
    const tbody = document.getElementById('county-standards-tbody');
    if (!tbody) return;

    const catSelect = document.getElementById('standards-cat-select');
    const category = catSelect?.value || 'Female';

    if (typeof COUNTY_STANDARDS === 'undefined' || !COUNTY_STANDARDS[category]) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:2rem;">County qualifying standards definition not loaded.</td></tr>`;
        return;
    }

    const catData = COUNTY_STANDARDS[category];
    const events = Object.keys(catData);
    const ageCols = ['10', '11', '12', '13', '14', '15', '16', '17', '18+'];

    tbody.innerHTML = events.map(evt => {
        const ageCells = ageCols.map(age => {
            const timeObj = catData[evt] ? (catData[evt][age] || catData[evt][age.replace('+', '')]) : null;
            if (!timeObj || !timeObj.display) return '<td style="color:var(--text-muted); font-family:monospace; text-align:center;">-</td>';
            return `<td style="font-family:monospace; font-weight:700; color:var(--accent-cyan); text-align:center;">${timeObj.display}</td>`;
        }).join('');

        return `
            <tr>
                <td style="font-weight:700; color:var(--text-main);">${evt}</td>
                ${ageCells}
            </tr>
        `;
    }).join('');
}

function downloadCountyTimesCSV() {
    const data = getActiveSquadCountyData();

    const lines = [];
    lines.push(`"WESTON-SUPER-MARE SWIMMING CLUB - SOMERSET COUNTY CHAMPIONSHIP QUALIFIERS"`);
    lines.push(`"Source:","Google Sheet Synced Data","Export Date:","${new Date().toLocaleDateString('en-GB')}"`);
    lines.push(``);
    lines.push(`"Swimmer Name","ASA / SE #","Squad","Gender","Age","Events with Times","Qualified Events Count","Slower Events Count","Qualified Events","Slower Events"`);

    data.forEach(r => {
        const name = getRowVal(r, ['Swimmer Name', 'Name', 'Selected Name']);
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const gender = getRowVal(r, ['Gender', 'Sex']);
        const age = getRowVal(r, ['Age', 'Age Group']);
        const squad = getSwimmerSquadName(name);
        const timesTracked = getRowVal(r, ['Events With Times', 'Times Tracked']);
        const qCount = parseInt(getRowVal(r, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        const sCount = parseInt(getRowVal(r, ['Slower Events Count', 'Slower Count', 'Slower']), 10) || 0;

        const qualEvents = [];
        const slowerEvents = [];
        for (let i = 1; i <= 20; i++) {
            const ev = getRowVal(r, [`Event ${i}`, `Event${i}`]);
            if (ev) {
                if (ev.toLowerCase().includes('qualified')) qualEvents.push(ev.replace(/\s*\(qualified\)\s*/i, '').trim());
                else if (ev.toLowerCase().includes('slower')) slowerEvents.push(ev.replace(/\s*\(slower\)\s*/i, '').trim());
            }
        }

        lines.push(`"${name}","${asa}","${squad}","${gender}","${age}","${timesTracked}","${qCount}","${sCount}","${qualEvents.join('; ')}","${slowerEvents.join('; ')}"`);
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weston_SC_Somerset_County_Times_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Somerset County Times CSV!');
}

function copyCountyTimesTable() {
    const data = getActiveSquadCountyData();

    const rows = [];
    rows.push(['Swimmer Name', 'ASA #', 'Squad', 'Gender', 'Age', 'Times Tracked', 'Qualified Count', 'Slower Count', 'Qualified Events', 'Slower Events'].join('\t'));

    data.forEach(r => {
        const name = getRowVal(r, ['Swimmer Name', 'Name', 'Selected Name']);
        const asa = getRowVal(r, ['ASA Number', 'ASA']);
        const gender = getRowVal(r, ['Gender', 'Sex']);
        const age = getRowVal(r, ['Age', 'Age Group']);
        const squad = getSwimmerSquadName(name);
        const timesTracked = getRowVal(r, ['Events With Times', 'Times Tracked']);
        const qCount = parseInt(getRowVal(r, ['Qualified Events Count', 'Qualified Count', 'Qualified']), 10) || 0;
        const sCount = parseInt(getRowVal(r, ['Slower Events Count', 'Slower Count', 'Slower']), 10) || 0;

        const qualEvents = [];
        const slowerEvents = [];
        for (let i = 1; i <= 20; i++) {
            const ev = getRowVal(r, [`Event ${i}`, `Event${i}`]);
            if (ev) {
                if (ev.toLowerCase().includes('qualified')) qualEvents.push(ev.replace(/\s*\(qualified\)\s*/i, '').trim());
                else if (ev.toLowerCase().includes('slower')) slowerEvents.push(ev.replace(/\s*\(slower\)\s*/i, '').trim());
            }
        }

        rows.push([
            name,
            asa,
            squad,
            gender,
            age,
            timesTracked,
            qCount,
            sCount,
            qualEvents.join(', '),
            slowerEvents.join(', ')
        ].join('\t'));
    });

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rows.join('\n')).then(() => {
            showToast('Somerset County Times table copied to clipboard! Ready to paste into Google Sheets.');
        }).catch(() => {
            showToast('Could not copy automatically. Please use Download CSV.', 'error');
        });
    } else {
        showToast('Clipboard access not available. Please use Download CSV.', 'error');
    }
}

// Global Exports
if (typeof window !== 'undefined') {
    window.initDashboard = initDashboard;
    window.switchView = switchView;
    window.filterSwimmers = filterSwimmers;
    window.filterCalendar = filterCalendar;
    window.loadLiveMeetCalendar = loadLiveMeetCalendar;
    window.filterQualifiers = filterQualifiers;
    window.resetQualifiersFilters = resetQualifiersFilters;
    window.setQualifiersTierFilter = setQualifiersTierFilter;
    window.openQualifierSwimmerModal = openQualifierSwimmerModal;
    window.closeQualifierSwimmerModal = closeQualifierSwimmerModal;
    window.renderQualifiersDashboard = renderQualifiersDashboard;
    window.EVENT_STROKE_MAP = EVENT_STROKE_MAP;
    window.buildSwimEnglandHistoryUrl = buildSwimEnglandHistoryUrl;
    window.openSwimmerModal = openSwimmerModal;
    window.closeSwimmerModal = closeSwimmerModal;
    window.openNoticesModal = openNoticesModal;
    window.closeNoticesModal = closeNoticesModal;
    window.dismissTopBanner = dismissTopBanner;
    window.showToast = showToast;
    window.getSwimmerSquadName = getSwimmerSquadName;
    window.getActiveSquadSwimmerNames = getActiveSquadSwimmerNames;
    window.getActiveSquadCountyData = getActiveSquadCountyData;
    window.goToCountyTimesForSwimmer = goToCountyTimesForSwimmer;
    window.openCurrentSwimmerReport = openCurrentSwimmerReport;
    window.openSwimmerReportModal = openSwimmerReportModal;
    window.closeSwimmerReportModal = closeSwimmerReportModal;
    window.printSwimmerReport = printSwimmerReport;
    window.downloadSwimmerReportCSV = downloadSwimmerReportCSV;
    window.copySwimmerReportTable = copySwimmerReportTable;
    window.loadLiveCountyTimes = loadLiveCountyTimes;
    window.openCountySheetModal = openCountySheetModal;
    window.closeCountySheetModal = closeCountySheetModal;
    window.saveCountySheetUrl = saveCountySheetUrl;
    window.resetCountySheetUrl = resetCountySheetUrl;
    window.setCountyTimesViewMode = setCountyTimesViewMode;
    window.renderCountyTimesDashboard = renderCountyTimesDashboard;
    window.filterCountyTimes = filterCountyTimes;
    window.renderCountyStandardsTable = renderCountyStandardsTable;
    window.downloadCountyTimesCSV = downloadCountyTimesCSV;
    window.copyCountyTimesTable = copyCountyTimesTable;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initDashboard);
        } else {
            initDashboard();
        }
        window.addEventListener('load', initDashboard);
    }
}
