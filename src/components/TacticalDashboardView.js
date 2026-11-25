/**
 * TacticalDashboardView.js
 * Controller for Tactical Lineup Optimizer & Multi-Round Ingestion
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            '../timeUtils',
            '../predictionEngine',
            '../modules/storageManager',
            '../modules/galaImporter',
            '../modules/lineupOptimizer'
        ], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('../timeUtils'),
            require('../predictionEngine'),
            require('../modules/storageManager'),
            require('../modules/galaImporter'),
            require('../modules/lineupOptimizer')
        );
    } else {
        const g = root || globalThis || window || self || {};
        g.TacticalDashboardViewController = factory(
            g.TimeUtils,
            g.RacePredictor,
            g.StorageManager,
            g.GalaImporter,
            g.LineupOptimizer
        );
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (TimeUtils, RacePredictor, StorageManager, GalaImporter, LineupOptimizer) {
    'use strict';

    class TacticalDashboardViewController {
        constructor() {
            this.storage = new StorageManager();
            this.predictor = new RacePredictor();
            this.optimizer = new LineupOptimizer(this.storage, this.predictor);

            this.state = {
                activeTab: 'opportunities', // 'opportunities' | 'swapper' | 'relay-auto' | 'side-by-side' | 'alignment'
                activeScoringMode: 'h2h', // 'h2h' | 'benchmark'
                alignmentFilter: 'all', // 'all' | 'mismatches' | 'upside' | 'risk' | 'aligned'
                alignmentSearchQuery: '',
                lastBenchmarkSimData: null,
                selectedSwapEvent: 10,
                selectedRelayEvent: 51,
                autoRelayTakeoverBonus: 0.60,
                cannonStrategy: 'TRADITIONAL',
                cannonFlatStartPenalty: 0.65,
                cannonFlyingDelta: -0.45,
                currentRelayComposition: null,
                matrixSearchQuery: '',
                matrixStrokeFilter: 'ALL',
                importTab: 'ocr',
                benchmarkProjectedPoints: 130
            };

            this.dom = {};
        }

        init() {
            this.cacheDom();
            this.bindEvents();
            this.refreshPredictorFromStorage();
            this.renderAll();
            this.syncWithRaceManager();
            this.handleInitialRouting();
        }

        handleInitialRouting() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const hash = window.location.hash;
                const eventParam = urlParams.get('event');
                if (eventParam) {
                    const evNum = parseInt(eventParam, 10);
                    const ev = this.predictor.events.find(e => e.number === evNum);
                    if (ev && ev.isRelay) {
                        this.switchToRelayComposer(evNum);
                    } else if (ev) {
                        this.selectEventForSwap(evNum);
                    }
                } else if (hash === '#relay-auto') {
                    this.switchTab('relay-auto');
                    this.runRelayAutoCompose();
                } else if (hash === '#side-by-side') {
                    this.switchTab('side-by-side');
                } else if (hash === '#swapper') {
                    this.switchTab('swapper');
                }
            } catch (e) {
                console.warn('Initial routing error:', e);
            }
        }

        cacheDom() {
            const get = id => document.getElementById(id);
            this.dom = {
                // Active Gala Info
                activeGalaTitle: get('active-gala-title'),
                activeGalaMeta: get('active-gala-meta'),
                competingClubsRow: get('competing-clubs-row'),

                // Top KPIs
                westonProjectedPoints: get('weston-projected-points'),
                westonProjectedRank: get('weston-projected-rank'),
                westonPointsProgressBar: get('weston-points-progress-bar'),
                westonLiveDeltaBadge: get('weston-live-delta-badge'),
                westonMarginLead: get('weston-margin-lead'),
                westonCushionLead: get('weston-cushion-lead'),
                westonBenchmarkPts: get('weston-benchmark-pts'),
                westonH2hPts: get('weston-h2h-pts'),
                westonVariancePts: get('weston-variance-pts'),
                btnModeH2h: get('btn-mode-h2h'),
                btnModeBench: get('btn-mode-bench'),
                btnModeH2hPts: get('btn-mode-h2h-pts'),
                btnModeBenchPts: get('btn-mode-bench-pts'),
                westonSyncStatusBadge: get('weston-sync-status-badge'),
                kpiHighRiskCount: get('kpi-high-risk-count'),
                kpiEasyPickupsCount: get('kpi-easy-pickups-count'),

                // Navigation Tabs
                tabBtns: document.querySelectorAll('.tactical-tab-btn'),
                tabPanels: document.querySelectorAll('.tactical-tab-panel'),
                alignmentBadgeCount: get('alignment-badge-count'),

                // Opportunity Finder
                highRiskCardsGrid: get('high-risk-cards-grid'),
                easyPickupsCardsGrid: get('easy-pickups-cards-grid'),

                // Swapper
                swapEventSelect: get('swap-event-select'),
                swapCurrentEntryName: get('swap-current-entry-name'),
                swapCurrentEntryTime: get('swap-current-entry-time'),
                swapCandidatesList: get('swap-candidates-list'),
                swapManualName: get('swap-manual-name'),
                swapManualTime: get('swap-manual-time'),
                swapFeedbackBox: get('swap-feedback-box'),

                // Relay Auto-Composer
                autoRelayEventSelect: get('auto-relay-event-select'),
                autoRelayTakeoverSlider: get('auto-relay-takeover-slider'),
                autoRelayTakeoverVal: get('auto-relay-takeover-val'),
                autoRelayCannonStrategyBox: get('auto-relay-cannon-strategy-box'),
                autoRelayCannonStrategySelect: get('auto-relay-cannon-strategy'),
                autoRelayFlatStartVal: get('auto-relay-flat-start-val'),
                autoRelayCannonFlyingVal: get('auto-relay-cannon-flying-val'),
                autoRelayResultsContainer: get('auto-relay-results-container'),

                // Matrix
                matrixSearchInput: get('matrix-search-input'),
                matrixStrokeFilter: get('matrix-stroke-filter'),
                matrixEventsContainer: get('matrix-events-container'),

                // Alignment & Mismatch Inspector
                inspectBenchSummaryPts: get('inspect-bench-summary-pts'),
                inspectH2hSummaryPts: get('inspect-h2h-summary-pts'),
                inspectNetVariance: get('inspect-net-variance'),
                inspectUpsideCount: get('inspect-upside-count'),
                inspectUpsidePoints: get('inspect-upside-points'),
                inspectRiskCount: get('inspect-risk-count'),
                inspectRiskPoints: get('inspect-risk-points'),
                inspectAlignedCount: get('inspect-aligned-count'),
                pillCountMismatches: get('pill-count-mismatches'),
                pillCountUpside: get('pill-count-upside'),
                pillCountRisk: get('pill-count-risk'),
                pillCountAligned: get('pill-count-aligned'),
                alignmentTableBody: get('alignment-table-body'),
                alignmentFilterPills: get('alignment-filter-pills'),
                alignmentSearchInput: get('alignment-search-input'),

                // Modals
                importerModal: get('importer-modal'),
                importRoundLabel: get('import-round-label'),
                importOcrText: get('import-ocr-text'),
                importFeedback: get('import-feedback'),
                importPanelOcr: get('import-panel-ocr'),
                importPanelJson: get('import-panel-json'),
                importTabOcrBtn: get('import-tab-ocr-btn'),
                importTabJsonBtn: get('import-tab-json-btn'),
                importJsonText: get('import-json-text'),
                competitorModal: get('competitor-modal'),
                competitorLanesInputs: get('competitor-lanes-inputs'),

                // Relay Swimmer Picker Modal
                relaySwimmerPickerModal: get('relay-swimmer-picker-modal'),
                relayPickerTitle: get('relay-picker-title'),
                relayPickerSubtitle: get('relay-picker-subtitle'),
                relayPickerSearch: get('relay-picker-search'),
                relayPickerAllowSwimup: get('relay-picker-allow-swimup'),
                relayPickerNewName: get('relay-picker-new-name'),
                relayPickerNewTime: get('relay-picker-new-time'),
                relayPickerCandidatesList: get('relay-picker-candidates-list')
            };
        }

        bindEvents() {
            // Tab navigation
            if (this.dom.tabBtns) {
                this.dom.tabBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const tabKey = btn.getAttribute('data-tab');
                        this.switchTab(tabKey);
                    });
                });
            }

            // Swapper event select
            if (this.dom.swapEventSelect) {
                this.dom.swapEventSelect.addEventListener('change', (e) => {
                    this.state.selectedSwapEvent = parseInt(e.target.value, 10);
                    this.renderSwapper();
                });
            }

            // Relay auto-composer select & slider
            if (this.dom.autoRelayEventSelect) {
                this.dom.autoRelayEventSelect.addEventListener('change', (e) => {
                    this.state.selectedRelayEvent = parseInt(e.target.value, 10);
                    this.syncCannonStrategyVisibility();
                    this.runRelayAutoCompose();
                });
            }
            if (this.dom.autoRelayTakeoverSlider) {
                this.dom.autoRelayTakeoverSlider.addEventListener('input', (e) => {
                    const sec = parseFloat(e.target.value);
                    this.state.autoRelayTakeoverBonus = sec;
                    if (this.dom.autoRelayTakeoverVal) {
                        this.dom.autoRelayTakeoverVal.textContent = `-${sec.toFixed(2)}s`;
                    }
                    this.recalcCurrentRelayComposition();
                });
            }

            // Relay Swimmer Picker modal search & filter
            if (this.dom.relayPickerSearch) {
                this.dom.relayPickerSearch.addEventListener('input', () => {
                    this.renderRelayPickerCandidates();
                });
            }
            if (this.dom.relayPickerAllowSwimup) {
                this.dom.relayPickerAllowSwimup.addEventListener('change', () => {
                    this.renderRelayPickerCandidates();
                });
            }

            // Matrix search & filter
            if (this.dom.matrixSearchInput) {
                this.dom.matrixSearchInput.addEventListener('input', (e) => {
                    this.state.matrixSearchQuery = e.target.value.toLowerCase();
                    this.renderMatrix();
                });
            }
            if (this.dom.matrixStrokeFilter) {
                this.dom.matrixStrokeFilter.addEventListener('change', (e) => {
                    this.state.matrixStrokeFilter = e.target.value;
                    this.renderMatrix();
                });
            }

            // Alignment & Mismatch Inspector filter pills
            if (this.dom.alignmentFilterPills) {
                const pillBtns = this.dom.alignmentFilterPills.querySelectorAll('.alignment-filter-btn');
                pillBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const filterKey = btn.getAttribute('data-filter');
                        this.state.alignmentFilter = filterKey;

                        pillBtns.forEach(b => {
                            const active = b.getAttribute('data-filter') === filterKey;
                            if (active) {
                                b.className = 'px-2.5 py-1 rounded-md font-bold bg-cyan-500 text-slate-950 transition alignment-filter-btn';
                            } else {
                                b.className = 'px-2.5 py-1 rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition alignment-filter-btn';
                            }
                        });

                        this.renderScoreAlignmentInspector();
                    });
                });
            }

            // Alignment search input
            if (this.dom.alignmentSearchInput) {
                this.dom.alignmentSearchInput.addEventListener('input', (e) => {
                    this.state.alignmentSearchQuery = e.target.value.toLowerCase().trim();
                    this.renderScoreAlignmentInspector();
                });
            }
        }

        switchTab(tabKey) {
            this.state.activeTab = tabKey;
            if (this.dom.tabBtns) {
                this.dom.tabBtns.forEach(btn => {
                    const active = btn.getAttribute('data-tab') === tabKey;
                    if (active) {
                        btn.classList.add('border-purple-400', 'text-purple-400');
                        btn.classList.remove('border-transparent', 'text-slate-400');
                    } else {
                        btn.classList.remove('border-purple-400', 'text-purple-400');
                        btn.classList.add('border-transparent', 'text-slate-400');
                    }
                });
            }
            if (this.dom.tabPanels) {
                this.dom.tabPanels.forEach(panel => {
                    panel.classList.toggle('hidden', panel.getAttribute('data-panel') !== tabKey);
                });
            }
        }

        /**
         * Rebuilds predictor club lineup and entries from storageManager's timesDB & active GalaLineup.
         * Automatically calculates 50th percentile median imputation baseline if any club lacks a time!
         */
        refreshPredictorFromStorage() {
            const activeGala = this.storage.getActiveGalaLineup();
            const competingClubs = activeGala.competingClubs || [];

            // Configure clubs in RacePredictor
            this.predictor.clubs = competingClubs.map(c => ({
                id: c.id,
                name: c.name,
                lane: c.lane,
                shortCode: c.shortCode,
                color: c.color,
                isHome: c.isHome
            }));

            // Clear overrides and populate best seeds from timesDB
            this.predictor.clearOverrides();

            competingClubs.forEach(club => {
                this.predictor.events.forEach(ev => {
                    const best = this.storage.getBestSeedTime(club.id, ev);
                    if (best) {
                        this.predictor.setEntryOverride(ev.number, club.name, {
                            swimmerName: best.swimmer,
                            timeMs: best.timeMs,
                            timeStr: best.timeStr,
                            isDisqualified: best.isDQ
                        });
                    }
                });
            });

            // Apply any active what-if overrides stored in gala.overrides
            if (activeGala.overrides) {
                Object.keys(activeGala.overrides).forEach(evKey => {
                    const evNum = parseInt(evKey, 10);
                    const clubOverrides = activeGala.overrides[evKey];
                    Object.keys(clubOverrides).forEach(cId => {
                        const o = clubOverrides[cId];
                        const club = competingClubs.find(c => c.id === cId);
                        if (club) {
                            this.predictor.setEntryOverride(evNum, club.name, {
                                swimmerName: o.swimmer,
                                timeMs: o.timeMs,
                                timeStr: o.timeStr,
                                isDisqualified: o.isDQ
                            });
                        }
                    });
                });
            }

            // Recalculate automatic median imputation for any missing clubs
            this.predictor.recalculateMedianBaselines();
        }

        renderAll() {
            this.renderGalaHeader();
            this.renderKpisAndProgress();
            this.renderOpportunityFinder();
            this.populateSelectDropdowns();
            this.renderSwapper();
            this.renderMatrix();
            this.renderScoreAlignmentInspector();
        }

        setScoringMode(mode) {
            this.state.activeScoringMode = mode;
            if (this.dom.btnModeH2h && this.dom.btnModeBench) {
                if (mode === 'benchmark') {
                    this.dom.btnModeBench.className = 'px-2 py-1 rounded font-bold bg-purple-500 text-white transition';
                    this.dom.btnModeH2h.className = 'px-2 py-1 rounded font-medium text-slate-400 hover:text-white transition';
                } else {
                    this.dom.btnModeH2h.className = 'px-2 py-1 rounded font-bold bg-cyan-500 text-slate-950 transition';
                    this.dom.btnModeBench.className = 'px-2 py-1 rounded font-medium text-slate-400 hover:text-white transition';
                }
            }
            this.renderKpisAndProgress();
        }

        renderGalaHeader() {
            const activeGala = this.storage.getActiveGalaLineup();
            if (this.dom.activeGalaTitle) this.dom.activeGalaTitle.textContent = activeGala.name;
            if (this.dom.activeGalaMeta) {
                this.dom.activeGalaMeta.textContent = `Date: ${activeGala.date} • Venue: ${activeGala.venue} • 8-Lane Scoring`;
            }

            if (this.dom.competingClubsRow) {
                let html = '';
                activeGala.competingClubs.forEach(c => {
                    const isWeston = c.name === 'Weston S Mare';
                    html += `
                        <div class="bg-slate-950 p-2.5 rounded-lg border ${isWeston ? 'border-cyan-500/70 bg-cyan-950/20' : 'border-slate-800'} flex items-center space-x-2">
                            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.color}"></span>
                            <div class="truncate">
                                <span class="font-bold text-xs ${isWeston ? 'text-cyan-300' : 'text-slate-200'} block truncate">${c.name}</span>
                                <span class="text-[10px] text-slate-500 font-mono">Lane ${c.lane} (${c.shortCode})</span>
                            </div>
                        </div>
                    `;
                });
                this.dom.competingClubsRow.innerHTML = html;
            }
        }

        renderKpisAndProgress() {
            const det = this.predictor.runDeterministicProjection();
            const weston = det.rankedClubs.find(c => c.club.name === 'Weston S Mare');
            const opps = this.optimizer.findTacticalOpportunities(det);

            const h2hPts = weston ? weston.totalPoints : 0;
            const benchPts = this.state.benchmarkProjectedPoints;
            const westonRank = weston ? weston.projectedRank : 8;
            const variance = Number((h2hPts - benchPts).toFixed(1));

            // Select active points value based on current toggle mode
            const activePts = this.state.activeScoringMode === 'benchmark' ? benchPts : h2hPts;
            const maxPoints = 51 * 8; // 408
            const pct = Math.min(100, (activePts / maxPoints) * 100);

            if (this.dom.westonProjectedPoints) this.dom.westonProjectedPoints.textContent = activePts;
            if (this.dom.westonProjectedRank) {
                if (this.state.activeScoringMode === 'benchmark') {
                    this.dom.westonProjectedRank.textContent = `SE Benchmark Model`;
                } else {
                    this.dom.westonProjectedRank.textContent = `#${westonRank} Overall`;
                }
            }
            if (this.dom.westonPointsProgressBar) this.dom.westonPointsProgressBar.style.width = `${pct}%`;
            if (this.dom.westonBenchmarkPts) this.dom.westonBenchmarkPts.textContent = `${benchPts} pts`;
            if (this.dom.westonH2hPts) this.dom.westonH2hPts.textContent = `${h2hPts} pts`;
            if (this.dom.btnModeH2hPts) this.dom.btnModeH2hPts.textContent = `${h2hPts}`;
            if (this.dom.btnModeBenchPts) this.dom.btnModeBenchPts.textContent = `${benchPts}`;

            if (this.dom.westonVariancePts) {
                const sign = variance > 0 ? '+' : '';
                this.dom.westonVariancePts.textContent = `${sign}${variance} net`;
                this.dom.westonVariancePts.className = variance >= 0 ? 'text-emerald-400 font-bold font-mono' : 'text-rose-400 font-bold font-mono';
            }

            // Active Overrides count badge
            const activeGala = this.storage.getActiveGalaLineup();
            const overrideCount = activeGala.overrides ? Object.keys(activeGala.overrides).length : 0;
            if (this.dom.westonLiveDeltaBadge) {
                if (overrideCount > 0) {
                    this.dom.westonLiveDeltaBadge.className = 'px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30';
                    this.dom.westonLiveDeltaBadge.textContent = `⚡ ${overrideCount} Swaps Active`;
                } else {
                    this.dom.westonLiveDeltaBadge.className = 'px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
                    this.dom.westonLiveDeltaBadge.textContent = 'Official Lineup Active';
                }
            }

            // Lead and Cushion
            const leader = det.rankedClubs[0];
            const third = det.rankedClubs[2];
            if (this.dom.westonMarginLead) {
                if (westonRank === 1) {
                    const second = det.rankedClubs[1];
                    this.dom.westonMarginLead.textContent = `Leading ${second.club.name} by +${h2hPts - second.totalPoints} pts`;
                } else {
                    this.dom.westonMarginLead.textContent = `Margin to ${leader.club.name} (1st): -${leader.totalPoints - h2hPts} pts`;
                }
            }
            if (this.dom.westonCushionLead) {
                if (westonRank <= 2 && third) {
                    this.dom.westonCushionLead.textContent = `Cushion over ${third.club.name} (3rd): +${h2hPts - third.totalPoints} pts`;
                } else {
                    this.dom.westonCushionLead.textContent = `Seeded in Top 8`;
                }
            }

            if (this.dom.kpiHighRiskCount) this.dom.kpiHighRiskCount.textContent = opps.highRiskCount;
            if (this.dom.kpiEasyPickupsCount) this.dom.kpiEasyPickupsCount.textContent = opps.easyPickupsCount;
        }

        /**
         * Asynchronously synchronizes with the active Arena Race Manager server API
         */
        async syncWithRaceManager(showAlert = false) {
            try {
                const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000';
                let activeRound = (typeof localStorage !== 'undefined' && localStorage.getItem('arena_current_round')) ? localStorage.getItem('arena_current_round') : null;

                if (!activeRound) {
                    const roundsList = await fetch(`${origin}/api/rounds`).then(r => r.json()).catch(() => null);
                    if (Array.isArray(roundsList) && roundsList.length > 0) {
                        const unlocked = roundsList.find(r => !r.is_locked);
                        activeRound = unlocked ? unlocked.id : (roundsList[roundsList.length - 1]?.id || 'round-2');
                    } else {
                        activeRound = 'round-2';
                    }
                    if (typeof localStorage !== 'undefined') {
                        try { localStorage.setItem('arena_current_round', activeRound); } catch (e) {}
                    }
                }

                const [simRes, selections, swimmersList] = await Promise.all([
                    fetch(`${origin}/api/simulation?round_id=${activeRound}`).then(r => r.json()).catch(() => null),
                    fetch(`${origin}/api/selections?round_id=${activeRound}`).then(r => r.json()).catch(() => null),
                    fetch(`${origin}/api/swimmers?round_id=${activeRound}`).then(r => r.json()).catch(() => null)
                ]);

                this.state.isLiveApiAvailable = !!(simRes || selections);
                this.state.activeRoundId = activeRound;

                // Build swimmer name -> id lookup map
                if (Array.isArray(swimmersList)) {
                    this.state.swimmersByName = {};
                    swimmersList.forEach(s => {
                        if (s.name && s.id) {
                            this.state.swimmersByName[s.name.trim().toLowerCase()] = s.id;
                        }
                    });
                }

                // Map selections by race_id
                const selByRace = {};
                if (Array.isArray(selections)) {
                    selections.forEach(s => {
                        if (!selByRace[s.race_id]) selByRace[s.race_id] = [];
                        selByRace[s.race_id].push(s);
                    });
                }

                // Specifically extract Race 51 (8x50m Mixed Cannon) Auto-Drafted Selections
                const race51Sels = selByRace[51] || [];
                if (race51Sels.length > 0) {
                    this.state.draftedCannonBaseline = race51Sels.map(s => ({
                        swimmer: s.swimmer_name,
                        swimmer_id: s.swimmer_id,
                        age: s.swimmer_age,
                        gender: (s.swimmer_gender === 'M' || s.swimmer_gender === 'Male') ? 'Male' : 'Female',
                        timeSec: s.time_sec,
                        timeMs: Math.round((s.time_sec || 0) * 1000),
                        timeStr: s.formatted_time || TimeUtils.formatMsToTime(Math.round((s.time_sec || 0) * 1000)),
                        leg_index: s.leg_index
                    }));
                }
                
                if (simRes && simRes.total_projected_points !== undefined) {
                    this.state.benchmarkProjectedPoints = simRes.total_projected_points;
                    this.state.lastBenchmarkSimData = simRes;

                    // Sync Weston's active event seed times and NAMED swimmers from Race Manager selections
                    if (Array.isArray(simRes.event_simulations)) {
                        simRes.event_simulations.forEach(es => {
                            if (es.seed_time_sec && es.formatted_seed_time) {
                                const ev = this.predictor.events.find(e => e.number === es.race_no);
                                if (ev) {
                                    const timeMs = Math.round(es.seed_time_sec * 1000);
                                    const sels = selByRace[es.race_no] || [];

                                    let swimmerName = 'Weston Swimmer';
                                    let relayLegs = null;

                                    if (ev.isRelay || sels.length > 1) {
                                        swimmerName = 'Weston SC Relay Squad';
                                        const names = sels.map(s => {
                                            if (!s.swimmer_name) return '';
                                            const parts = s.swimmer_name.trim().split(/\s+/);
                                            if (parts.length >= 2) {
                                                return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
                                            }
                                            return s.swimmer_name;
                                        }).filter(Boolean);
                                        relayLegs = names.length > 0 ? names.join(', ') : null;
                                    } else if (sels.length === 1 && sels[0].swimmer_name) {
                                        swimmerName = sels[0].swimmer_name.trim();
                                    } else {
                                        const best = this.storage.getBestSeedTime('weston', ev);
                                        if (best && best.swimmer && best.swimmer !== 'Weston Selected Swimmer') {
                                            swimmerName = best.swimmer;
                                        }
                                    }

                                    this.storage.addSwimmerTime('weston', ev.age, ev.gender, StorageManager.makeStrokeKey(ev.stroke, ev.distance), {
                                        swimmer: swimmerName,
                                        timeMs: timeMs,
                                        timeStr: es.formatted_seed_time,
                                        round: 'Round 2 Official',
                                        date: '2026-11-14',
                                        isDQ: false,
                                        eventNumber: es.race_no
                                    });

                                    // Override entry on predictor with the official named swimmer
                                    this.predictor.setEntryOverride(es.race_no, 'Weston S Mare', {
                                        swimmerName: swimmerName,
                                        timeMs: timeMs,
                                        timeStr: es.formatted_seed_time,
                                        isDisqualified: false,
                                        relayLegs: relayLegs
                                    });
                                }
                            }
                        });
                    }

                    if (this.dom.westonSyncStatusBadge) {
                        this.dom.westonSyncStatusBadge.textContent = `Live Synced (${activeRound})`;
                        this.dom.westonSyncStatusBadge.className = 'px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30';
                    }

                    this.refreshPredictorFromStorage();
                    this.renderAll();

                    if (showAlert) {
                        const cannonNote = (this.state.draftedCannonBaseline && this.state.draftedCannonBaseline.length > 0)
                            ? `\n✓ Ingested Race 51 Auto-Drafted Baseline: ${this.state.draftedCannonBaseline.map(b => b.swimmer).join(', ')}`
                            : '';
                        alert(`✓ Successfully synchronized with Arena Race Manager! Official Projected Score: ${simRes.total_projected_points} pts.${cannonNote}`);
                    }
                }
            } catch (err) {
                console.log('Race Manager live API not available, using stored timebase:', err.message);
                if (this.dom.westonSyncStatusBadge) {
                    this.dom.westonSyncStatusBadge.textContent = 'Offline Timebase';
                    this.dom.westonSyncStatusBadge.className = 'px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-mono';
                }
            }
        }

        renderScoreAlignmentInspector() {
            const analysis = this.predictor.getScoreAlignmentAnalysis(this.state.lastBenchmarkSimData);
            if (!analysis) return;

            // Summary cards
            if (this.dom.inspectBenchSummaryPts) this.dom.inspectBenchSummaryPts.textContent = analysis.benchmarkTotalPoints;
            if (this.dom.inspectH2hSummaryPts) this.dom.inspectH2hSummaryPts.textContent = analysis.h2hTotalPoints;
            if (this.dom.inspectNetVariance) {
                const sign = analysis.netVariance > 0 ? '+' : '';
                this.dom.inspectNetVariance.textContent = `${sign}${analysis.netVariance} pts`;
                this.dom.inspectNetVariance.className = analysis.netVariance >= 0 
                    ? 'text-xl sm:text-2xl font-black font-mono text-emerald-400' 
                    : 'text-xl sm:text-2xl font-black font-mono text-rose-400';
            }
            if (this.dom.inspectUpsideCount) this.dom.inspectUpsideCount.textContent = `${analysis.upsideCount} Races`;
            if (this.dom.inspectUpsidePoints) this.dom.inspectUpsidePoints.textContent = `+${analysis.totalUpside} pts picked up`;
            if (this.dom.inspectRiskCount) this.dom.inspectRiskCount.textContent = `${analysis.riskCount} Races`;
            if (this.dom.inspectRiskPoints) this.dom.inspectRiskPoints.textContent = `-${analysis.totalRisk} pts vs rival pace`;
            if (this.dom.inspectAlignedCount) this.dom.inspectAlignedCount.textContent = `${analysis.alignedCount} Races`;

            const mismatchCount = analysis.upsideCount + analysis.riskCount;
            if (this.dom.alignmentBadgeCount) this.dom.alignmentBadgeCount.textContent = `${mismatchCount} mismatches`;
            if (this.dom.pillCountMismatches) this.dom.pillCountMismatches.textContent = mismatchCount;
            if (this.dom.pillCountUpside) this.dom.pillCountUpside.textContent = analysis.upsideCount;
            if (this.dom.pillCountRisk) this.dom.pillCountRisk.textContent = analysis.riskCount;
            if (this.dom.pillCountAligned) this.dom.pillCountAligned.textContent = analysis.alignedCount;

            // Filter comparison rows
            let rows = analysis.comparisons;
            if (this.state.alignmentFilter === 'mismatches') {
                rows = rows.filter(r => r.delta !== 0);
            } else if (this.state.alignmentFilter === 'upside') {
                rows = rows.filter(r => r.delta > 0);
            } else if (this.state.alignmentFilter === 'risk') {
                rows = rows.filter(r => r.delta < 0);
            } else if (this.state.alignmentFilter === 'aligned') {
                rows = rows.filter(r => r.delta === 0);
            }

            if (this.state.alignmentSearchQuery) {
                const q = this.state.alignmentSearchQuery;
                rows = rows.filter(r => 
                    r.eventNumber.toString().includes(q) ||
                    r.eventName.toLowerCase().includes(q) ||
                    r.swimmerName.toLowerCase().includes(q) ||
                    r.stroke.toLowerCase().includes(q)
                );
            }

            if (!this.dom.alignmentTableBody) return;

            if (rows.length === 0) {
                this.dom.alignmentTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-8 text-slate-500 font-medium">
                            No events match the selected filter.
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            rows.forEach(r => {
                let badgeClass = 'bg-slate-800 text-slate-400 border border-slate-700';
                let deltaText = '0 pts';
                let rowBgClass = '';

                if (r.delta > 0) {
                    badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                    deltaText = `+${r.delta} pts`;
                    rowBgClass = 'hover:bg-emerald-950/10';
                } else if (r.delta < 0) {
                    badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                    deltaText = `${r.delta} pts`;
                    rowBgClass = 'hover:bg-rose-950/10';
                }

                let contextHtml = '';
                if (r.rivalAhead || r.rivalBehind) {
                    const ahead = r.rivalAhead ? `<span class="text-slate-400 font-mono text-[10px] block">Ahead: <strong class="text-amber-300">${r.rivalAhead.club}</strong> (${r.rivalAhead.timeStr}, -${r.rivalAhead.gap})</span>` : '';
                    const behind = r.rivalBehind ? `<span class="text-slate-400 font-mono text-[10px] block">Behind: <strong class="text-cyan-300">${r.rivalBehind.club}</strong> (${r.rivalBehind.timeStr}, +${r.rivalBehind.gap})</span>` : '';
                    contextHtml = `<div class="flex flex-col space-y-0.5">${ahead}${behind}</div>`;
                } else {
                    contextHtml = `<span class="text-slate-500 text-[10px]">Division Benchmark</span>`;
                }

                html += `
                    <tr class="transition-colors ${rowBgClass}">
                        <td class="py-2.5 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                            Ev ${r.eventNumber}
                        </td>
                        <td class="py-2.5 px-3">
                            <span class="font-bold text-slate-200 block">${r.eventName}</span>
                            <span class="text-[10px] text-slate-500 font-mono">${r.age} &bull; ${r.stroke}</span>
                        </td>
                        <td class="py-2.5 px-3">
                            ${r.isRelay ? `
                                <div class="flex items-center space-x-1.5">
                                    <span class="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">RELAY</span>
                                    <span class="font-bold text-slate-200">Weston SC Squad</span>
                                </div>
                                ${r.relayLegs ? `<div class="text-[10px] text-slate-400 truncate max-w-[210px]" title="Legs: ${r.relayLegs}">Legs: ${r.relayLegs}</div>` : ''}
                                <span class="text-[10px] text-cyan-300 font-mono">${r.timeStr}</span>
                            ` : `
                                <span class="font-bold text-slate-300 block truncate max-w-[150px]">${r.swimmerName}</span>
                                <span class="text-[10px] text-cyan-300 font-mono">${r.timeStr}</span>
                            `}
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            <span class="font-bold text-slate-300">${r.benchPlace}${this.getOrdinal(r.benchPlace)}</span>
                            <span class="text-[10px] text-cyan-400/90 font-mono block">(${r.benchPts} pts)</span>
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            <span class="font-bold text-purple-300">${r.h2hRank}${this.getOrdinal(r.h2hRank)}</span>
                            <span class="text-[10px] text-purple-400/90 font-mono block">(${r.h2hPts} pts)</span>
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded-full text-xs font-bold font-mono ${badgeClass}">
                                ${deltaText}
                            </span>
                        </td>
                        <td class="py-2.5 px-3">
                            ${contextHtml}
                        </td>
                        <td class="py-2.5 px-3 text-right whitespace-nowrap">
                            <button onclick="window.tacticalApp.selectEventForSwap(${r.eventNumber})" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 text-[11px] font-bold border border-slate-700 hover:border-cyan-500 transition" title="Open this race in the Tactical Swapper">
                                🔄 Swap
                            </button>
                        </td>
                    </tr>
                `;
            });

            this.dom.alignmentTableBody.innerHTML = html;
        }

        getOrdinal(n) {
            const s = ['th', 'st', 'nd', 'rd'];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        }

        renderOpportunityFinder() {
            const opps = this.optimizer.findTacticalOpportunities();

            // 1. High Risk Points
            if (this.dom.highRiskCardsGrid) {
                if (opps.highRisk.length === 0) {
                    this.dom.highRiskCardsGrid.innerHTML = `
                        <div class="col-span-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                            🛡️ No high-risk races detected. All 1st/2nd place seeds hold leads &ge; 0.35s over their nearest chasers.
                        </div>
                    `;
                } else {
                    let html = '';
                    opps.highRisk.forEach(hr => {
                        html += `
                            <div class="bg-slate-900 border border-amber-500/40 p-4 rounded-xl shadow-md space-y-2 relative overflow-hidden">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                        EVENT #${hr.eventNumber} &bull; RANK #${hr.myRank}
                                    </span>
                                    <span class="text-xs font-mono font-bold text-amber-400">&Delta; +${hr.riskDeltaStr} lead</span>
                                </div>
                                <h4 class="font-bold text-white text-sm truncate">${hr.eventName}</h4>
                                <div class="text-xs text-slate-300 flex justify-between pt-1 border-t border-slate-800">
                                    <span>Weston: <strong>${hr.swimmerName}</strong> (${hr.myTimeStr})</span>
                                </div>
                                <div class="text-[11px] text-amber-200/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                    Chased by <strong>${hr.chaserClub}</strong> trailing by only <strong>${hr.riskDeltaStr}</strong>!
                                </div>
                                <button onclick="window.tacticalApp.selectEventForSwap(${hr.eventNumber})" class="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700">
                                    Tactical Roster Swap &rarr;
                                </button>
                            </div>
                        `;
                    });
                    this.dom.highRiskCardsGrid.innerHTML = html;
                }
            }

            // 2. Easy Pickups
            if (this.dom.easyPickupsCardsGrid) {
                if (opps.easyPickups.length === 0) {
                    this.dom.easyPickupsCardsGrid.innerHTML = `
                        <div class="col-span-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                            🎯 No tight 3rd-5th place pickups detected within 0.50s margin.
                        </div>
                    `;
                } else {
                    let html = '';
                    opps.easyPickups.forEach(ep => {
                        html += `
                            <div class="bg-slate-900 border border-emerald-500/40 p-4 rounded-xl shadow-md space-y-2 relative overflow-hidden">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                        EVENT #${ep.eventNumber} &bull; RANK #${ep.myRank}
                                    </span>
                                    <span class="text-xs font-mono font-bold text-emerald-400">&Delta; -${ep.pickupDeltaStr} back</span>
                                </div>
                                <h4 class="font-bold text-white text-sm truncate">${ep.eventName}</h4>
                                <div class="text-xs text-slate-300 flex justify-between pt-1 border-t border-slate-800">
                                    <span>Weston: <strong>${ep.swimmerName}</strong> (${ep.myTimeStr})</span>
                                </div>
                                <div class="text-[11px] text-emerald-200/90 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                    Only <strong>${ep.pickupDeltaStr}</strong> behind <strong>${ep.targetClubAhead}</strong> for +1 pt pickup!
                                </div>
                                <button onclick="window.tacticalApp.selectEventForSwap(${ep.eventNumber})" class="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700">
                                    Tactical Roster Swap &rarr;
                                </button>
                            </div>
                        `;
                    });
                    this.dom.easyPickupsCardsGrid.innerHTML = html;
                }
            }
        }

        populateSelectDropdowns() {
            // Swap Event Select
            if (this.dom.swapEventSelect && this.dom.swapEventSelect.children.length === 0) {
                this.predictor.events.forEach(ev => {
                    const opt = document.createElement('option');
                    opt.value = ev.number;
                    opt.textContent = `Event ${ev.number}: ${ev.name}`;
                    if (ev.number === this.state.selectedSwapEvent) opt.selected = true;
                    this.dom.swapEventSelect.appendChild(opt);
                });
            }

            // Relay Event Select
            if (this.dom.autoRelayEventSelect && this.dom.autoRelayEventSelect.children.length === 0) {
                const relays = this.predictor.events.filter(e => e.isRelay);
                relays.forEach(re => {
                    const opt = document.createElement('option');
                    opt.value = re.number;
                    opt.textContent = `Event ${re.number}: ${re.name}`;
                    if (re.number === this.state.selectedRelayEvent) opt.selected = true;
                    this.dom.autoRelayEventSelect.appendChild(opt);
                });
            }
        }

        selectEventForSwap(eventNumber) {
            const ev = this.predictor.events.find(e => e.number === eventNumber);
            if (ev && ev.isRelay) {
                this.switchToRelayComposer(eventNumber);
                return;
            }
            this.state.selectedSwapEvent = eventNumber;
            if (this.dom.swapEventSelect) this.dom.swapEventSelect.value = eventNumber;
            this.switchTab('swapper');
            this.renderSwapper();
        }

        switchToRelayComposer(eventNumber) {
            this.state.selectedRelayEvent = eventNumber;
            if (this.dom.autoRelayEventSelect) {
                this.dom.autoRelayEventSelect.value = eventNumber;
            }
            this.switchTab('relay-auto');
            this.runRelayAutoCompose();
        }

        renderSwapper() {
            const evNum = this.state.selectedSwapEvent;
            const ev = this.predictor.events.find(e => e.number === evNum);
            if (!ev) return;

            // Current Weston entry in this event
            const currentEntry = this.predictor.getClubEntry(evNum, 'Weston S Mare', true);
            const det = this.predictor.runDeterministicProjection();
            const evProj = det.eventProjections.find(p => p.event.number === evNum);
            const westonField = evProj ? evProj.field.find(f => f.club.name === 'Weston S Mare') : null;

            if (this.dom.swapCurrentEntryName) {
                this.dom.swapCurrentEntryName.textContent = currentEntry.swimmerName;
            }
            if (this.dom.swapCurrentEntryTime) {
                const rank = westonField ? westonField.rank : '—';
                const pts = westonField ? westonField.points : 0;
                this.dom.swapCurrentEntryTime.textContent = `${currentEntry.timeStr} (Rank #${rank} • ${pts} pts)${currentEntry.isOverride ? ' [SWAP ACTIVE]' : ''}`;
            }

            // If this is a relay event, show a direct interactive card to amend all legs in Relay Composer
            if (ev.isRelay) {
                if (this.dom.swapCandidatesList) {
                    this.dom.swapCandidatesList.innerHTML = `
                        <div class="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3">
                            <div class="flex items-center space-x-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                                <span>⚡ Relay Team Event (${ev.legs || 4} Legs • ${ev.name})</span>
                            </div>
                            <p class="text-xs text-slate-300">
                                This event is a ${ev.legs || 4}-swimmer relay${ev.number === 51 ? ' with 8 distinct age/gender slots (9-11, 12-13, 14-15, and 16+)' : ''}. Open the Relay Leg Amendment Editor to view and change any of the ${ev.legs || 4} leg swimmers, splits, or flying takeovers.
                            </p>
                            <button onclick="window.tacticalApp.switchToRelayComposer(${ev.number})" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center space-x-1.5">
                                <span>Open ${ev.legs || 4}-Leg Relay Amendment Editor &rarr;</span>
                            </button>
                        </div>
                    `;
                }
                return;
            }

            // Fetch available swimmers in timesDB for this stroke and distance
            const candidates = this.storage.getAllSwimmersForEvent('weston', ev);

            if (this.dom.swapCandidatesList) {
                if (candidates.length === 0) {
                    this.dom.swapCandidatesList.innerHTML = `
                        <div class="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400">
                            No other squad times in registry for ${ev.age} ${ev.stroke} ${ev.distance}m. Enter a custom time below to test what-if scenarios.
                        </div>
                    `;
                } else {
                    let html = '';
                    candidates.forEach(c => {
                        const isCurrent = c.swimmer === currentEntry.swimmerName && c.timeStr === currentEntry.timeStr;
                        html += `
                            <div class="bg-slate-950 p-2.5 rounded-lg border ${isCurrent ? 'border-cyan-500/70 bg-cyan-950/20' : 'border-slate-800'} flex items-center justify-between text-xs">
                                <div>
                                    <span class="font-bold text-white">${c.swimmer}</span>
                                    <span class="text-[10px] text-slate-400 block">${c.round} (${c.date})</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-mono font-bold text-cyan-300">${c.timeStr}</span>
                                    ${isCurrent ? 
                                        '<span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">CURRENT</span>' : 
                                        `<button onclick="window.tacticalApp.applyCandidateSwap('${encodeURIComponent(c.swimmer)}', '${c.timeStr}', ${c.timeMs})" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition">Swap In &rarr;</button>`
                                    }
                                </div>
                            </div>
                        `;
                    });
                    this.dom.swapCandidatesList.innerHTML = html;
                }
            }
        }

        applyCandidateSwap(swimmerEncoded, timeStr, timeMs) {
            const swimmer = decodeURIComponent(swimmerEncoded);
            const evNum = this.state.selectedSwapEvent;

            const res = this.optimizer.evaluateTacticalSwap(evNum, {
                swimmer,
                timeStr,
                timeMs,
                isDQ: false
            });

            this.showSwapFeedback(res);
            this.renderAll();
        }

        applyManualSwap() {
            const swimmer = this.dom.swapManualName ? this.dom.swapManualName.value.trim() : 'Tactical Swimmer';
            const timeStr = this.dom.swapManualTime ? this.dom.swapManualTime.value.trim() : '';
            if (!timeStr) return;

            const parsed = TimeUtils.parseTimeToMs(timeStr);
            const evNum = this.state.selectedSwapEvent;

            const res = this.optimizer.evaluateTacticalSwap(evNum, {
                swimmer: swimmer || 'Custom Swimmer',
                timeStr: parsed.formatted,
                timeMs: parsed.ms,
                isDQ: parsed.isDisqualified
            });

            this.showSwapFeedback(res);
            this.renderAll();
        }

        showSwapFeedback(res) {
            if (!this.dom.swapFeedbackBox) return;

            const ptsDelta = res.eventPointsDelta;
            const rankDelta = res.eventRankDelta;
            const deltaSign = ptsDelta > 0 ? `+${ptsDelta}` : `${ptsDelta}`;
            const badgeColor = ptsDelta > 0 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : (ptsDelta < 0 ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : 'text-slate-300 border-slate-700 bg-slate-800');

            this.dom.swapFeedbackBox.className = `p-4 rounded-xl border ${badgeColor} text-xs block`;
            this.dom.swapFeedbackBox.innerHTML = `
                <div class="flex items-center justify-between font-bold mb-1">
                    <span>⚡ SWAP APPLIED FOR EVENT #${res.eventNumber}: ${res.swimmer} (${res.timeStr})</span>
                    <span class="font-mono text-sm">${deltaSign} PTS</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                        <span class="text-[10px] text-slate-400 block">Event Finish:</span>
                        <span class="font-bold">#${res.eventRankBefore} &rarr; #${res.eventRankAfter} (${rankDelta >= 0 ? `+${rankDelta}` : rankDelta})</span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block">Event Points:</span>
                        <span class="font-bold">${res.eventPointsBefore} &rarr; ${res.eventPointsAfter} pts</span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block">Team Gala Total:</span>
                        <span class="font-bold">${res.galaTotalPointsBefore} &rarr; ${res.galaTotalPointsAfter} pts</span>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-400 block">Overall Rank:</span>
                        <span class="font-bold">#${res.galaOverallRankAfter} in Gala</span>
                    </div>
                </div>
            `;
        }

        resetAllSwaps() {
            this.storage.clearActiveLineupOverrides();
            this.refreshPredictorFromStorage();
            if (this.dom.swapFeedbackBox) this.dom.swapFeedbackBox.className = 'hidden';
            this.renderAll();
        }

        syncCannonStrategyVisibility() {
            const evNum = this.state.selectedRelayEvent;
            const isCannon = this.optimizer.isCannonRelay(evNum);
            if (this.dom.autoRelayCannonStrategyBox) {
                if (isCannon) {
                    this.dom.autoRelayCannonStrategyBox.classList.remove('hidden');
                } else {
                    this.dom.autoRelayCannonStrategyBox.classList.add('hidden');
                }
            }
            if (this.dom.autoRelayCannonStrategySelect) {
                this.dom.autoRelayCannonStrategySelect.value = this.state.cannonStrategy || 'TRADITIONAL';
            }
        }

        updateCannonStrategy(strategy) {
            this.state.cannonStrategy = strategy;
            if (this.dom.autoRelayCannonStrategySelect) {
                this.dom.autoRelayCannonStrategySelect.value = strategy;
            }
            this.runRelayAutoCompose();
        }

        clearCannonBaseline() {
            this.state.draftedCannonBaseline = null;
            this.runRelayAutoCompose();
        }

        runRelayAutoCompose() {
            const evNum = this.state.selectedRelayEvent;
            const bonusMs = Math.round(this.state.autoRelayTakeoverBonus * 1000);
            const cannonStrategy = this.state.cannonStrategy || 'TRADITIONAL';
            const flatStartPenaltyMs = Math.round(this.state.cannonFlatStartPenalty * 1000);
            const flyingStartDeltaMs = Math.round(this.state.cannonFlyingDelta * 1000);

            this.syncCannonStrategyVisibility();

            const isCannon = (evNum >= 50);
            const baselineSwimmers = (isCannon && Array.isArray(this.state.draftedCannonBaseline) && this.state.draftedCannonBaseline.length > 0)
                ? this.state.draftedCannonBaseline
                : null;

            const res = this.optimizer.autoComposeRelayTeam(evNum, {
                takeoverBonusMs: bonusMs,
                cannonStrategy,
                flatStartPenaltyMs,
                flyingStartDeltaMs,
                baselineSwimmers
            });
            if (!res || !this.dom.autoRelayResultsContainer) return;

            this.state.currentRelayComposition = res;
            this.renderRelayComposer();
        }

        renderRelayComposer() {
            const comp = this.state.currentRelayComposition;
            if (!comp || !this.dom.autoRelayResultsContainer) return;

            const ev = comp.event;
            const res = comp.relayResult;
            const legs = comp.legs || comp.selectedLegs || [];
            const isSquadron = this.optimizer.isCannonRelay(ev.number, ev) || legs.length === 8;
            const exchanges = Math.max(0, legs.length - 1);
            const bonusSec = (res.bonusMs / 1000).toFixed(2);

            const sim = isSquadron ? this.optimizer.simulateCannonHeadToHead({
                cannonStrategy: comp.cannonStrategy || this.state.cannonStrategy || 'TRADITIONAL',
                takeoverBonusMs: Math.round(this.state.autoRelayTakeoverBonus * 1000),
                flatStartPenaltyMs: Math.round(this.state.cannonFlatStartPenalty * 1000),
                flyingStartDeltaMs: Math.round(this.state.cannonFlyingDelta * 1000)
            }) : null;

            const unassignedLegs = legs.filter(l => !l.swimmer || !l.timeMs || l.timeMs <= 0 || l.isDeleted);
            const hasUnassigned = unassignedLegs.length > 0;

            let html = `
                <div class="bg-slate-950 p-4 sm:p-5 rounded-xl border border-purple-500/40 space-y-4">
                    ${(this.state.lastDeployedRelayFeedback && this.state.lastDeployedRelayFeedback.eventNumber === ev.number) ? `
                        <!-- Prominent Deployed Confirmation Banner -->
                        <div id="relay-deployed-banner" class="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/60 shadow-lg space-y-2">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div class="flex items-start sm:items-center space-x-2.5">
                                    <span class="text-2xl">✅</span>
                                    <div>
                                        <div class="flex items-center space-x-2">
                                            <h4 class="font-black text-white text-sm">
                                                Successfully Deployed to 51-Event Gala Programme!
                                            </h4>
                                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                Event #${ev.number} Active in Lineup
                                            </span>
                                        </div>
                                        <p class="text-xs text-slate-300 mt-0.5">
                                            <strong class="text-emerald-400">${this.state.lastDeployedRelayFeedback.isSquadron ? '8x50m Mixed Cannon Relay' : 'Relay Squad'}</strong>: 
                                            ${this.state.lastDeployedRelayFeedback.swimmerName}
                                        </p>
                                        <div class="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 mt-1 font-mono">
                                            <span>Predicted Time: <strong class="text-cyan-300">${this.state.lastDeployedRelayFeedback.timeStr}</strong></span>
                                            <span>&bull;</span>
                                            <span>Projected: <strong class="text-white">Rank #${this.state.lastDeployedRelayFeedback.rank}</strong> (${this.state.lastDeployedRelayFeedback.points} pts)</span>
                                            ${(this.state.lastDeployedRelayFeedback.deltaPoints !== undefined && this.state.lastDeployedRelayFeedback.deltaPoints !== 0) ? `
                                                <span class="text-emerald-400 font-bold">(${this.state.lastDeployedRelayFeedback.deltaPoints > 0 ? '+' : ''}${this.state.lastDeployedRelayFeedback.deltaPoints} pts vs baseline)</span>
                                            ` : ''}
                                            ${this.state.lastDeployedRelayFeedback.serverSynced ? `
                                                <span class="text-cyan-300 font-bold">✓ Synced to Race Manager DB</span>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2 shrink-0">
                                    <a href="/?highlight=${ev.number}" class="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs transition shadow-md flex items-center space-x-1.5 whitespace-nowrap">
                                        <span>📋 51-Event Programme &rarr;</span>
                                    </a>
                                    <button onclick="window.tacticalApp.scrollToMatrixEvent(${ev.number})" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center space-x-1.5 whitespace-nowrap">
                                        <span>View in Matrix &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Cannon Auto-Draft Baseline Status Banner (For Cannon Relay) -->
                    ${isSquadron ? `
                        ${(this.state.draftedCannonBaseline && this.state.draftedCannonBaseline.length > 0) ? `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
                                <div class="flex items-center space-x-2">
                                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span class="text-slate-200">
                                        <strong class="text-emerald-300">Auto-Draft Baseline Active:</strong> Simulating with the 8 swimmers drafted into Race 51 (${this.state.draftedCannonBaseline.map(b => b.swimmer).join(', ')}).
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2 shrink-0">
                                    <button onclick="window.tacticalApp.syncWithRaceManager(true)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold transition">
                                        🔄 Re-Sync Auto-Draft
                                    </button>
                                    <button onclick="window.tacticalApp.clearCannonBaseline()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[11px] transition">
                                        Reset to Fastest PBs
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                                <div class="flex items-center space-x-2 text-slate-400">
                                    <span>ℹ️ Using club 50m Free PB times. Run <strong>Run squad auto draft</strong> on Race Manager to ingest drafted baseline.</span>
                                </div>
                                <button onclick="window.tacticalApp.syncWithRaceManager(true)" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold transition shrink-0">
                                    🔄 Sync with Race Manager
                                </button>
                            </div>
                        `}
                    ` : ''}

                    <!-- Relay Header & Live Projected Standing -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider font-mono">
                                    ${isSquadron ? `8-LEG CANNON RELAY (${comp.cannonStrategy || 'TRADITIONAL'})` : `${legs.length}-LEG TEAM RELAY`}
                                </span>
                                <span class="text-[10px] text-slate-500 font-mono">Event ${ev.number} • ${ev.distance}m</span>
                            </div>
                            <h4 class="font-black text-white text-base mt-0.5">${ev.name}</h4>
                            <p class="text-xs text-slate-400">
                                ${isSquadron ? '1 Girl and 1 Boy from each age group (9/11, 13/u, 15/u, Open). Leg 1 has flat-start penalty (+0.65s); Legs 2–8 have flying-start delta (-0.45s).' : `All legs: 50m flat times with flying takeover deductions`}
                            </p>
                        </div>
                        <div class="bg-slate-900 px-4 py-2.5 rounded-lg border border-purple-500/30 text-right">
                            <span class="text-[10px] text-slate-400 block font-semibold uppercase">Projected Finish</span>
                            <div class="flex items-center justify-end space-x-2">
                                <span class="text-xl font-mono font-black text-amber-300">Rank #${res.projectedRank}</span>
                                <span class="text-sm font-bold text-slate-300">(${res.projectedPoints} pts)</span>
                            </div>
                            <span class="text-[10px] font-mono text-cyan-400 font-bold block">
                                ${res.compositeTimeFormatted} ${hasUnassigned ? '<span class="text-amber-400">(Provisional)</span>' : ''}
                            </span>
                        </div>
                    </div>

                    <!-- Interactive Individual Leg Swimmers Editor Grid -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Individual Leg Swimmers (${legs.length} Legs) — Delete, Add, or Switch Swimmers:
                            </h5>
                            <span class="text-[10px] text-slate-400">Live recalculation of composite time</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            ${legs.map((leg, idx) => {
                                const candidates = leg.candidates || [];
                                const isUnassigned = !leg.swimmer || leg.isDeleted || !leg.timeMs || leg.timeMs <= 0;
                                const isLeg1 = idx === 0;
                                const legBadgeText = isSquadron
                                    ? (isLeg1 ? `LEG 1 • FLAT (+0.65s)` : `LEG ${idx + 1} • FLYING (-0.45s)`)
                                    : `LEG ${idx + 1}`;
                                const legBadgeBg = (isSquadron && isLeg1)
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-purple-500/20 text-purple-300';

                                if (isUnassigned) {
                                    return `
                                        <div class="bg-rose-950/20 p-3 rounded-xl border border-rose-500/40 space-y-2.5 hover:border-rose-500/60 transition shadow-sm">
                                            <div class="flex items-center justify-between">
                                                <span class="text-[10px] px-1.5 py-0.5 rounded ${legBadgeBg} font-bold font-mono">${legBadgeText}</span>
                                                <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">⚠️ UNASSIGNED</span>
                                            </div>

                                            <div class="text-[11px] text-rose-300 font-bold truncate">
                                                ${leg.label ? leg.label.replace(/^Leg \d+ • /, '') : `${leg.age} ${leg.stroke}`}
                                            </div>

                                            <div class="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200">
                                                <span>Swimmer deleted. Add a swimmer of this age group:</span>
                                            </div>

                                            <!-- 1. Select from Age Group Dropdown -->
                                            <div class="space-y-1">
                                                <label class="text-[10px] text-slate-300 font-semibold block">1. Select from ${leg.gender === 'Female' ? 'Girls' : 'Boys'} ${leg.age}:</label>
                                                <select onchange="window.tacticalApp.updateRelayLegSwimmer(${idx}, this.value)" 
                                                        class="w-full px-2 py-1.5 rounded bg-slate-950 border border-cyan-500 text-xs text-white outline-none focus:border-cyan-400 font-medium">
                                                    <option value="">-- Choose ${candidates.length} Available Swimmers --</option>
                                                    ${candidates.map(c => `
                                                        <option value="${encodeURIComponent(c.swimmer)}">
                                                            ${c.swimmer} (${c.timeStr})
                                                        </option>
                                                    `).join('')}
                                                    <option value="__BROWSE__">⇄ Browse Squad &amp; Swim-Up...</option>
                                                </select>
                                            </div>

                                            <!-- 2. Manual Enter New Swimmer for this Age Group -->
                                            <div class="pt-1.5 border-t border-slate-800 space-y-1.5">
                                                <label class="text-[10px] text-slate-400 font-semibold block">2. Or Add New Swimmer to ${leg.age}:</label>
                                                <div class="flex items-center space-x-1.5">
                                                    <input id="new-swimmer-name-${idx}" type="text" placeholder="Name" 
                                                           class="w-3/5 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-white outline-none focus:border-cyan-400" />
                                                    <input id="new-swimmer-time-${idx}" type="text" placeholder="ss.ms" 
                                                           class="w-2/5 px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] font-mono font-bold text-cyan-300 text-center outline-none focus:border-cyan-400" />
                                                </div>
                                                <button onclick="window.tacticalApp.addNewSwimmerToLeg(${idx})" 
                                                        class="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] transition">
                                                    + Add Swimmer to Leg &amp; Age Group
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }

                                return `
                                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition shadow-sm">
                                        <div class="flex items-center justify-between">
                                            <span class="text-[10px] px-1.5 py-0.5 rounded ${legBadgeBg} font-mono">${legBadgeText}</span>
                                            <div class="flex items-center space-x-1">
                                                <button onclick="window.tacticalApp.openRelaySwimmerPicker(${idx})" class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 font-bold transition flex items-center space-x-1" title="Browse and switch swimmer">
                                                    <span>⇄ Switch</span>
                                                </button>
                                                <button onclick="window.tacticalApp.deleteRelayLegSwimmer(${idx})" class="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 font-bold transition flex items-center space-x-1" title="Delete / remove swimmer from this leg">
                                                    <span>✕ Delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="text-[10px] text-slate-400 font-semibold truncate">
                                            ${leg.label ? leg.label.replace(/^Leg \d+ • /, '') : `${leg.age} ${leg.stroke}`}
                                        </div>

                                        <!-- Assigned Swimmer Display -->
                                        <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1.5">
                                            <div class="flex items-center justify-between">
                                                <div class="truncate mr-2">
                                                    <span class="font-bold text-white text-xs block truncate">${leg.swimmer}</span>
                                                    <span class="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                                                        <span>● Assigned</span>
                                                        ${isSquadron && leg.splitTimeStr ? `<span class="text-cyan-300 font-mono ml-1 font-semibold">(${leg.splitTimeStr})</span>` : ''}
                                                    </span>
                                                </div>
                                                <div class="text-right">
                                                    <span class="text-xs font-mono font-bold text-slate-300">${leg.timeStr}</span>
                                                    ${isSquadron && leg.startDeltaStr ? `<span class="text-[10px] font-mono block ${isLeg1 ? 'text-amber-400 font-bold' : 'text-cyan-400'}">${leg.startDeltaStr}</span>` : ''}
                                                </div>
                                            </div>
                                            ${isSquadron ? `
                                                <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900 text-[10px]">
                                                    ${leg.isHighFatigueRisk ? `
                                                        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono">
                                                            ⚠️ High Fatigue Risk
                                                        </span>
                                                    ` : ''}
                                                    ${leg.hasBackToBack46_49 ? `
                                                        <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold font-mono">
                                                            ⚠️ Back-to-Back (46–49)
                                                        </span>
                                                    ` : ''}
                                                    <span class="text-slate-400 font-mono">
                                                        ${leg.raceCount || 0} races (${leg.totalMeters || 0}m)${leg.fatiguePenaltyMs > 0 ? ` • Fatigue: <strong class="text-amber-400">${leg.fatiguePenaltyStr}</strong>` : ''}
                                                    </span>
                                                </div>
                                            ` : ''}
                                        </div>

                                        <!-- Switch Swimmer Dropdown -->
                                        <div class="space-y-1">
                                            <label class="text-[10px] text-slate-400 font-medium block">Switch to another ${leg.age} swimmer:</label>
                                            <select onchange="window.tacticalApp.updateRelayLegSwimmer(${idx}, this.value)" 
                                                    class="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400 font-medium">
                                                <option value="">-- Switch Swimmer (${candidates.length} in ${leg.age}) --</option>
                                                ${candidates.map(c => `
                                                    <option value="${encodeURIComponent(c.swimmer)}" ${c.swimmer === leg.swimmer ? 'selected' : ''}>
                                                        ${c.swimmer} (${c.timeStr}${c.fatiguePenaltyMs > 0 ? ` +${(c.fatiguePenaltyMs/1000).toFixed(2)}s fat.` : ''}${c.raceCount ? ` • ${c.raceCount}r` : ''}${c.isHighFatigueRisk ? ' ⚠️' : ''})
                                                    </option>
                                                `).join('')}
                                                <option value="__BROWSE__">⇄ Browse Squad &amp; Swim-Up...</option>
                                            </select>
                                        </div>

                                        <!-- Manual Split Edit -->
                                        <div class="flex items-center space-x-1.5 pt-1 border-t border-slate-800/80">
                                            <span class="text-[10px] text-slate-400 whitespace-nowrap">Edit Split:</span>
                                            <input type="text" 
                                                   value="${leg.timeStr || ''}" 
                                                   placeholder="ss.ms" 
                                                   onchange="window.tacticalApp.updateRelayLegManual(${idx}, null, this.value)"
                                                   class="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold text-cyan-300 text-center outline-none focus:border-cyan-400" />
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- CANNON STRATEGY SIMULATOR CARD (Shown for 8x50m Cannon / Squadron) -->
                    ${isSquadron && sim ? `
                        <div id="cannon-strategy-simulator-card" class="bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4 sm:p-5 rounded-xl border-2 border-purple-500/40 space-y-4 shadow-lg shadow-purple-950/30">
                            <!-- Simulator Header -->
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
                                <div>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider font-mono border border-purple-500/40">
                                            ⚡ Tactical Simulator
                                        </span>
                                        <span class="text-[10px] text-cyan-400 font-mono font-semibold">Event ${ev.number} • 8x50m Cannon</span>
                                    </div>
                                    <h4 class="font-black text-white text-base sm:text-lg mt-1 flex items-center space-x-2">
                                        <span>🎯 Cannon Strategy Simulator</span>
                                    </h4>
                                    <p class="text-xs text-slate-400 mt-0.5">
                                        Compare our selected split progression against a simulated opponent running a <strong class="text-purple-300">Traditional ascending age lineup</strong> (using imported opposition PBs). Evaluate clean-water wave wash and psychological chase pressure.
                                    </p>
                                </div>
                                <div class="bg-slate-900/90 px-3.5 py-2 rounded-lg border border-purple-500/30 text-right shrink-0">
                                    <span class="text-[10px] text-slate-400 block font-semibold uppercase">Projected Finish Margin</span>
                                    <span class="text-base font-mono font-black ${sim.keyMilestones.finalMarginMs > 0 ? 'text-emerald-400' : (sim.keyMilestones.finalMarginMs < 0 ? 'text-rose-400' : 'text-slate-300')}">
                                        ${sim.keyMilestones.finalMarginStr}
                                    </span>
                                    <span class="text-[10px] text-cyan-400 font-mono block">vs Opponent: ${sim.opponent.totalTimeFormatted}</span>
                                </div>
                            </div>

                            <!-- Strategy Segmented Control / Dropdown (Requirement 1) -->
                            <div class="space-y-2">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                                        <span>🔄</span>
                                        <span>Select Cannon Lineup Strategy:</span>
                                    </label>
                                    <div class="flex items-center space-x-2">
                                        <span class="text-[11px] text-slate-400 hidden sm:inline">Quick Dropdown:</span>
                                        <select onchange="window.tacticalApp.updateCannonStrategy(this.value)" 
                                                class="px-2.5 py-1 rounded bg-slate-900 border border-purple-500/50 text-xs text-white font-medium outline-none focus:border-purple-400">
                                            <option value="TRADITIONAL" ${(comp.cannonStrategy || 'TRADITIONAL') === 'TRADITIONAL' ? 'selected' : ''}>Traditional (9/11 → 13/u → 15/u → Open)</option>
                                            <option value="REVERSE_FRONTLOAD" ${(comp.cannonStrategy || 'TRADITIONAL') === 'REVERSE_FRONTLOAD' ? 'selected' : ''}>Reverse Front-Load (Open → 15/u → 13/u → 9/11)</option>
                                            <option value="PURE_SPEED_DESC" ${(comp.cannonStrategy || 'TRADITIONAL') === 'PURE_SPEED_DESC' ? 'selected' : ''}>Pure Speed (Fastest to Slowest PB)</option>
                                            <option value="SANDWICH_BUFFER" ${(comp.cannonStrategy || 'TRADITIONAL') === 'SANDWICH_BUFFER' ? 'selected' : ''}>Sandwich Buffer (Open Lead &amp; Anchor)</option>
                                            <option value="HUNTER_ANCHOR" ${(comp.cannonStrategy || 'TRADITIONAL') === 'HUNTER_ANCHOR' ? 'selected' : ''}>Hunter Anchor (15/u → 13/u → 9/11 → Open)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Segmented Pill Selector for Quick 1-Click Toggling -->
                                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    ${[
                                        { id: 'TRADITIONAL', label: '1. Traditional', sub: 'Ascending Age (9/11→Open)' },
                                        { id: 'REVERSE_FRONTLOAD', label: '2. Reverse Front-Load', sub: 'Descending Age (Open→9/11)' },
                                        { id: 'PURE_SPEED_DESC', label: '3. Pure Speed', sub: 'Fastest to Slowest 50m PB' },
                                        { id: 'SANDWICH_BUFFER', label: '4. Sandwich Buffer', sub: 'Fastest Open Lead & Anchor' },
                                        { id: 'HUNTER_ANCHOR', label: '5. Hunter Anchor', sub: '15/u→13/u→9/11→Open Surge' }
                                    ].map(strat => {
                                        const isActive = (comp.cannonStrategy || 'TRADITIONAL') === strat.id;
                                        return `
                                            <button type="button" 
                                                    onclick="window.tacticalApp.updateCannonStrategy('${strat.id}')"
                                                    class="p-2 sm:p-2.5 rounded-lg border text-left transition ${isActive ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30' : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white'}">
                                                <span class="block text-xs font-black truncate">${strat.label}</span>
                                                <span class="block text-[10px] ${isActive ? 'text-purple-200' : 'text-slate-500'} truncate font-mono">${strat.sub}</span>
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- High-Impact Key Milestones & Highlight Badges (Requirement 3) -->
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <!-- Milestone 1: Lead Taken -->
                                <div class="p-3 rounded-xl bg-slate-900/90 border ${sim.keyMilestones.isWireToWireLead ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800'} space-y-1">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                                        <span>🚀</span>
                                        <span>Lead Transition Point:</span>
                                    </span>
                                    <div class="text-sm font-black font-mono ${sim.keyMilestones.takeLeadLeg ? 'text-cyan-300' : 'text-slate-400'}">
                                        ${sim.keyMilestones.isWireToWireLead
                                            ? `Wire-to-Wire Lead (Leg 1)`
                                            : (sim.keyMilestones.takeLeadLeg ? `Leg ${sim.keyMilestones.takeLeadLeg.legNumber} Lead: ${sim.keyMilestones.takeLeadLeg.leadStr}` : 'Never Leads')}
                                    </div>
                                    <p class="text-[10px] text-slate-400">
                                        ${sim.keyMilestones.isWireToWireLead
                                            ? `Immediately gains clean water advantage on Leg 1.`
                                            : (sim.keyMilestones.takeLeadLeg ? `Takes lead on ${sim.keyMilestones.takeLeadLeg.label.replace(/^Leg \d+ • /, '')}.` : 'Trails throughout.')}
                                    </p>
                                </div>

                                <!-- Milestone 2: Biggest Deficit Point -->
                                <div class="p-3 rounded-xl bg-slate-900/90 border ${sim.keyMilestones.maxDeficitLeg ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'} space-y-1">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                                        <span>⚠️</span>
                                        <span>Biggest Deficit Faced:</span>
                                    </span>
                                    <div class="text-sm font-black font-mono ${sim.keyMilestones.maxDeficitLeg ? 'text-amber-300' : 'text-emerald-400'}">
                                        ${sim.keyMilestones.maxDeficitLeg ? `Leg ${sim.keyMilestones.maxDeficitLeg.legNumber} Deficit: ${sim.keyMilestones.maxDeficitLeg.deficitStr}` : 'Zero Deficit (Never Behind)'}
                                    </div>
                                    <p class="text-[10px] text-slate-400">
                                        ${sim.keyMilestones.maxDeficitLeg
                                            ? `Peak wake wash exposure on ${sim.keyMilestones.maxDeficitLeg.label.replace(/^Leg \d+ • /, '')}.`
                                            : `100% clean undisturbed water across all 8 legs.`}
                                    </p>
                                </div>

                                <!-- Milestone 3: Peak Lead / Separation -->
                                <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                                        <span>🏆</span>
                                        <span>Peak Margin Separation:</span>
                                    </span>
                                    <div class="text-sm font-black font-mono text-purple-300">
                                        ${sim.keyMilestones.maxLeadLeg ? `Leg ${sim.keyMilestones.maxLeadLeg.legNumber} Lead: ${sim.keyMilestones.maxLeadLeg.leadStr}` : '0.00s'}
                                    </div>
                                    <p class="text-[10px] text-slate-400">
                                        ${sim.keyMilestones.cleanWaterRating} • ${sim.keyMilestones.tacticalSummary}
                                    </p>
                                </div>
                            </div>

                            <!-- Split-by-Split Cumulative Time Table (Requirement 2 & 3) -->
                            <div class="space-y-2 pt-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                        Split-by-Split Progression vs Traditional Opponent:
                                    </span>
                                    <span class="text-[10px] text-slate-400 font-mono">
                                        Highlighted rows indicate lead changes &amp; peak deficit/lead points
                                    </span>
                                </div>

                                <div class="overflow-x-auto rounded-lg border border-slate-800">
                                    <table class="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr class="bg-slate-900 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                                                <th class="py-2.5 px-2.5 text-center">Leg</th>
                                                <th class="py-2.5 px-3">Our Swimmer (${comp.cannonStrategy || 'TRADITIONAL'})</th>
                                                <th class="py-2.5 px-2.5 text-right">Our Split</th>
                                                <th class="py-2.5 px-2.5 text-right">Our Cumulative</th>
                                                <th class="py-2.5 px-3">Simulated Opponent (Traditional)</th>
                                                <th class="py-2.5 px-2.5 text-right">Opp Split</th>
                                                <th class="py-2.5 px-2.5 text-right">Opp Cumulative</th>
                                                <th class="py-2.5 px-3 text-center">Head-to-Head Delta</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-800/60 font-mono">
                                            ${sim.legsComparison.map((row, idx) => {
                                                const isLeadChange = row.isTakeLeadLeg;
                                                const isMaxDef = row.isMaxDeficitLeg;
                                                const isMaxLead = row.isMaxLeadLeg;

                                                let rowBg = idx % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900/40';
                                                let rowBorder = '';
                                                if (isLeadChange) {
                                                    rowBg = 'bg-cyan-950/40';
                                                    rowBorder = 'border-l-4 border-cyan-400';
                                                } else if (isMaxDef) {
                                                    rowBg = 'bg-amber-950/30';
                                                    rowBorder = 'border-l-4 border-amber-400';
                                                } else if (isMaxLead) {
                                                    rowBg = 'bg-purple-950/40';
                                                    rowBorder = 'border-l-4 border-purple-400';
                                                }

                                                return `
                                                    <tr class="${rowBg} ${rowBorder} hover:bg-slate-800/40 transition">
                                                        <td class="py-2.5 px-2.5 text-center font-bold text-slate-300">
                                                            Leg ${row.legNumber}
                                                        </td>
                                                        <td class="py-2.5 px-3 font-sans">
                                                            <div class="font-bold text-white text-xs truncate">${row.ourLeg.swimmer}</div>
                                                            <div class="text-[10px] text-slate-400 truncate">${row.ourLeg.label ? row.ourLeg.label.replace(/^Leg \d+ • /, '') : ''}</div>
                                                        </td>
                                                        <td class="py-2.5 px-2.5 text-right font-bold text-cyan-300">
                                                            ${row.ourLeg.splitTimeStr}
                                                        </td>
                                                        <td class="py-2.5 px-2.5 text-right font-black text-white">
                                                            ${row.ourLeg.cumTimeStr}
                                                        </td>
                                                        <td class="py-2.5 px-3 font-sans">
                                                            <div class="font-medium text-slate-300 text-xs truncate">${row.opponentLeg.swimmer}</div>
                                                            <div class="text-[10px] text-slate-500 truncate">${row.opponentLeg.label}</div>
                                                        </td>
                                                        <td class="py-2.5 px-2.5 text-right text-slate-300">
                                                            ${row.opponentLeg.splitTimeStr}
                                                        </td>
                                                        <td class="py-2.5 px-2.5 text-right text-slate-400">
                                                            ${row.opponentLeg.cumTimeStr}
                                                        </td>
                                                        <td class="py-2.5 px-3 text-center">
                                                            <div class="inline-flex items-center space-x-1.5">
                                                                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${row.isLeading ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : (row.isDeficit ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300')}">
                                                                    ${row.deltaStr}
                                                                </span>
                                                                ${isLeadChange ? `<span class="px-1.5 py-0.5 rounded bg-cyan-600 text-slate-950 font-black text-[9px] uppercase tracking-wider">Takes Lead</span>` : ''}
                                                                ${isMaxDef ? `<span class="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">Max Deficit</span>` : ''}
                                                                ${isMaxLead && !isLeadChange ? `<span class="px-1.5 py-0.5 rounded bg-purple-500 text-white font-black text-[9px] uppercase tracking-wider">Peak Lead</span>` : ''}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Split Calculations & Takeover Deductions Summary -->
                    <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                        <div>
                            <span>Flat PB Sum (${legs.length} legs):</span>
                            <strong class="text-slate-200 font-mono ml-1 text-sm">${res.rawSumFormatted}</strong>
                        </div>
                        ${isSquadron ? `
                            <div>
                                <span>Flat Penalty (Leg 1):</span>
                                <strong class="text-amber-300 font-mono ml-1 text-sm">+0.65s</strong>
                            </div>
                            <div>
                                <span>Flying Delta (Legs 2–8):</span>
                                <strong class="text-cyan-300 font-mono ml-1 text-sm">7 &times; -0.45s (-3.15s)</strong>
                            </div>
                            ${(comp.totalFatiguePenaltyMs || 0) > 0 ? `
                                <div>
                                    <span>Total Fatigue Overhead:</span>
                                    <strong class="text-amber-400 font-mono ml-1 text-sm">+${((comp.totalFatiguePenaltyMs || 0) / 1000).toFixed(2)}s</strong>
                                </div>
                            ` : ''}
                        ` : `
                            <div>
                                <span>Takeover Bonus (${exchanges} exchanges &times; -${(this.state.autoRelayTakeoverBonus).toFixed(2)}s):</span>
                                <strong class="text-purple-300 font-mono ml-1 text-sm">-${bonusSec}s</strong>
                            </div>
                        `}
                        <div>
                            <span>Composite Relay Time:</span>
                            <strong class="text-cyan-300 font-mono ml-1 text-base font-black">${res.compositeTimeFormatted}</strong>
                        </div>
                    </div>

                    <!-- Unassigned Warning Banner -->
                    ${hasUnassigned ? `
                        <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-300">
                            <div class="flex items-center space-x-2">
                                <span class="text-base">⚠️</span>
                                <span><strong>${unassignedLegs.length} leg(s) unassigned (Leg ${unassignedLegs.map(l => l.legNumber).join(', ')}).</strong> Showing provisional benchmark split until all swimmers are chosen.</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <button onclick="window.tacticalApp.deployCurrentRelayComposition()" 
                                class="w-full sm:w-2/3 py-2.5 rounded-lg ${hasUnassigned ? 'bg-slate-800 border border-amber-500/40 text-amber-200 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-md shadow-purple-500/20'} font-bold text-xs transition flex items-center justify-center space-x-1.5">
                            <span>🚀 Deploy Amended Relay Squad (${legs.length} Swimmers) to Lineup &rarr;</span>
                        </button>
                        <button onclick="window.tacticalApp.runRelayAutoCompose()" 
                                class="w-full sm:w-1/3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition">
                            Reset to Auto-Fastest
                        </button>
                    </div>

                    <!-- Opponents Relay Seed Field Breakdown -->
                    <div class="pt-2 border-t border-slate-800">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Field Comparison vs Competing Clubs:</span>
                        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
                            ${(res.fieldComparison || []).map(f => {
                                const isWeston = f.club.name === 'Weston S Mare';
                                return `
                                    <div class="p-2 rounded text-center text-[10px] ${isWeston ? 'bg-cyan-950/40 border border-cyan-500/60 font-bold' : 'bg-slate-900 border border-slate-800'}">
                                        <span class="block truncate ${isWeston ? 'text-cyan-300 font-black' : 'text-slate-400'}">${f.club.name}</span>
                                        <span class="font-mono ${isWeston ? 'text-white font-bold' : 'text-slate-300'}">${f.timeStr}</span>
                                        <span class="block text-slate-500">Rank #${f.rank} (${f.points}p)</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;

            this.dom.autoRelayResultsContainer.innerHTML = html;
        }

        deleteRelayLegSwimmer(legIndex) {
            if (!this.state.currentRelayComposition) return;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            leg.swimmer = '';
            leg.timeMs = 0;
            leg.timeStr = '';
            leg.isDeleted = true;

            this.recalcCurrentRelayComposition();
        }

        addNewSwimmerToLeg(legIndex) {
            if (!this.state.currentRelayComposition) return;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            const nameEl = document.getElementById(`new-swimmer-name-${legIndex}`);
            const timeEl = document.getElementById(`new-swimmer-time-${legIndex}`);
            const name = nameEl ? nameEl.value.trim() : '';
            const timeStr = timeEl ? timeEl.value.trim() : '';

            if (!name) {
                alert('Please enter a swimmer name.');
                return;
            }
            if (!timeStr) {
                alert('Please enter a 50m split time (e.g. 34.50).');
                return;
            }

            const parsed = TimeUtils.parseTimeToMs(timeStr);
            if (!parsed || parsed.ms <= 0) {
                alert('Invalid time format. Please enter as ss.ms (e.g. 34.50).');
                return;
            }

            // Save to storageManager's timesDB so swimmer remains in registry
            this.storage.addSwimmerTime('weston', leg.age, leg.gender, StorageManager.makeStrokeKey('Freestyle', 50), {
                swimmer: name,
                timeMs: parsed.ms,
                timeStr: parsed.formatted,
                round: 'Manual Coach Entry',
                date: new Date().toISOString().split('T')[0],
                isDQ: false
            });

            // Update candidate list for this leg
            if (!leg.candidates) leg.candidates = [];
            const exists = leg.candidates.find(c => c.swimmer.toLowerCase() === name.toLowerCase());
            if (!exists) {
                leg.candidates.unshift({
                    swimmer: name,
                    timeMs: parsed.ms,
                    timeStr: parsed.formatted,
                    round: 'Manual Coach Entry',
                    date: new Date().toISOString().split('T')[0]
                });
            } else {
                exists.timeMs = parsed.ms;
                exists.timeStr = parsed.formatted;
            }

            // Assign to leg
            leg.swimmer = name;
            leg.timeMs = parsed.ms;
            leg.timeStr = parsed.formatted;
            leg.isDeleted = false;

            this.recalcCurrentRelayComposition();
        }

        updateRelayLegSwimmer(legIndex, encodedSwimmer) {
            if (!this.state.currentRelayComposition) return;
            if (!encodedSwimmer) return;

            if (encodedSwimmer === '__BROWSE__') {
                this.openRelaySwimmerPicker(legIndex);
                return;
            }

            const swimmerName = decodeURIComponent(encodedSwimmer);
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            const candidate = (leg.candidates || []).find(c => c.swimmer === swimmerName);
            if (candidate) {
                leg.swimmer = candidate.swimmer;
                leg.timeMs = candidate.timeMs;
                leg.timeStr = candidate.timeStr;
                leg.isDeleted = false;
            }

            this.recalcCurrentRelayComposition();
        }

        updateRelayLegManual(legIndex, newName, newTimeStr) {
            if (!this.state.currentRelayComposition) return;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            if (newName !== null && newName !== undefined) {
                const trimmed = newName.trim();
                if (trimmed) {
                    leg.swimmer = trimmed;
                    leg.isDeleted = false;
                }
            }

            if (newTimeStr !== null && newTimeStr !== undefined) {
                const parsed = TimeUtils.parseTimeToMs(newTimeStr);
                if (parsed.ms > 0) {
                    leg.timeMs = parsed.ms;
                    leg.timeStr = parsed.formatted;
                    leg.isDeleted = false;
                }
            }

            this.recalcCurrentRelayComposition();
        }

        openRelaySwimmerPicker(legIndex) {
            if (!this.state.currentRelayComposition) return;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg || !this.dom.relaySwimmerPickerModal) return;

            this.state.activePickerLegIndex = legIndex;
            if (this.dom.relayPickerTitle) {
                this.dom.relayPickerTitle.textContent = `Switch Swimmer — Leg ${leg.legNumber}`;
            }
            if (this.dom.relayPickerSubtitle) {
                this.dom.relayPickerSubtitle.textContent = `Target Age Category: ${leg.gender === 'Female' ? 'Girls' : 'Boys'} ${leg.age} (50m Freestyle)`;
            }
            if (this.dom.relayPickerSearch) {
                this.dom.relayPickerSearch.value = '';
            }
            if (this.dom.relayPickerAllowSwimup) {
                this.dom.relayPickerAllowSwimup.checked = false;
            }

            this.renderRelayPickerCandidates();
            this.dom.relaySwimmerPickerModal.classList.remove('hidden');
        }

        closeRelaySwimmerPicker() {
            if (this.dom.relaySwimmerPickerModal) {
                this.dom.relaySwimmerPickerModal.classList.add('hidden');
            }
        }

        renderRelayPickerCandidates() {
            if (!this.state.currentRelayComposition || this.state.activePickerLegIndex === undefined) return;
            const leg = this.state.currentRelayComposition.legs[this.state.activePickerLegIndex];
            if (!leg || !this.dom.relayPickerCandidatesList) return;

            const query = (this.dom.relayPickerSearch ? this.dom.relayPickerSearch.value : '').toLowerCase().trim();
            const allowSwimup = this.dom.relayPickerAllowSwimup ? this.dom.relayPickerAllowSwimup.checked : false;

            let candidatePool = [];

            if (allowSwimup) {
                // Fetch all registered swimmers across all age groups with 50m Free times
                const all = this.storage.timesDB['weston'] || {};
                const seen = new Set();
                Object.keys(all).forEach(ageGroup => {
                    const byGen = all[ageGroup] || {};
                    const targetGenders = [leg.gender];
                    targetGenders.forEach(g => {
                        const strokes = byGen[g] || {};
                        const free50 = strokes['Freestyle_50'] || strokes['Free_50'] || [];
                        free50.forEach(t => {
                            if (!t.isDQ && t.timeMs > 0 && !seen.has(t.swimmer)) {
                                seen.add(t.swimmer);
                                candidatePool.push({
                                    swimmer: t.swimmer,
                                    timeMs: t.timeMs,
                                    timeStr: t.timeStr,
                                    age: ageGroup,
                                    gender: g,
                                    round: t.round || 'Squad Roster'
                                });
                            }
                        });
                    });
                });
            } else {
                candidatePool = (leg.candidates || []).map(c => ({
                    ...c,
                    age: leg.age,
                    gender: leg.gender
                }));
            }

            if (query) {
                candidatePool = candidatePool.filter(c => c.swimmer.toLowerCase().includes(query));
            }

            candidatePool.sort((a, b) => a.timeMs - b.timeMs);

            if (candidatePool.length === 0) {
                this.dom.relayPickerCandidatesList.innerHTML = `
                    <div class="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400">
                        No swimmers found matching "${query}". Use the manual form above to add a new swimmer.
                    </div>
                `;
                return;
            }

            let html = '';
            candidatePool.forEach(c => {
                const isCurrent = c.swimmer === leg.swimmer && !leg.isDeleted;
                html += `
                    <div class="bg-slate-950 p-2.5 rounded-lg border ${isCurrent ? 'border-cyan-500/70 bg-cyan-950/20' : 'border-slate-800'} flex items-center justify-between text-xs">
                        <div>
                            <div class="flex items-center space-x-1.5">
                                <span class="font-bold text-white">${c.swimmer}</span>
                                <span class="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">${c.age} ${c.gender}</span>
                            </div>
                            <span class="text-[10px] text-slate-500 block">${c.round || 'Squad PB'}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="font-mono font-bold text-cyan-300">${c.timeStr}</span>
                            ${isCurrent ? 
                                '<span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">CURRENT</span>' : 
                                `<button onclick="window.tacticalApp.assignCandidateFromPicker('${encodeURIComponent(c.swimmer)}', ${c.timeMs}, '${c.timeStr}')" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition">Select &rarr;</button>`
                            }
                        </div>
                    </div>
                `;
            });

            this.dom.relayPickerCandidatesList.innerHTML = html;
        }

        assignCandidateFromPicker(encodedSwimmer, timeMs, timeStr) {
            if (!this.state.currentRelayComposition || this.state.activePickerLegIndex === undefined) return;
            const legIndex = this.state.activePickerLegIndex;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            const swimmer = decodeURIComponent(encodedSwimmer);
            leg.swimmer = swimmer;
            leg.timeMs = timeMs;
            leg.timeStr = timeStr;
            leg.isDeleted = false;

            this.closeRelaySwimmerPicker();
            this.recalcCurrentRelayComposition();
        }

        submitRelayPickerNewSwimmer() {
            if (!this.state.currentRelayComposition || this.state.activePickerLegIndex === undefined) return;
            const legIndex = this.state.activePickerLegIndex;
            const leg = this.state.currentRelayComposition.legs[legIndex];
            if (!leg) return;

            const name = this.dom.relayPickerNewName ? this.dom.relayPickerNewName.value.trim() : '';
            const timeStr = this.dom.relayPickerNewTime ? this.dom.relayPickerNewTime.value.trim() : '';

            if (!name || !timeStr) {
                alert('Please enter both swimmer name and split time.');
                return;
            }

            const parsed = TimeUtils.parseTimeToMs(timeStr);
            if (!parsed || parsed.ms <= 0) {
                alert('Invalid time format. Please enter as ss.ms (e.g. 35.50).');
                return;
            }

            this.storage.addSwimmerTime('weston', leg.age, leg.gender, StorageManager.makeStrokeKey('Freestyle', 50), {
                swimmer: name,
                timeMs: parsed.ms,
                timeStr: parsed.formatted,
                round: 'Manual Coach Entry',
                date: new Date().toISOString().split('T')[0],
                isDQ: false
            });

            if (!leg.candidates) leg.candidates = [];
            leg.candidates.unshift({
                swimmer: name,
                timeMs: parsed.ms,
                timeStr: parsed.formatted,
                round: 'Manual Coach Entry',
                date: new Date().toISOString().split('T')[0]
            });

            leg.swimmer = name;
            leg.timeMs = parsed.ms;
            leg.timeStr = parsed.formatted;
            leg.isDeleted = false;

            if (this.dom.relayPickerNewName) this.dom.relayPickerNewName.value = '';
            if (this.dom.relayPickerNewTime) this.dom.relayPickerNewTime.value = '';

            this.closeRelaySwimmerPicker();
            this.recalcCurrentRelayComposition();
        }

        recalcCurrentRelayComposition() {
            if (!this.state.currentRelayComposition) return;
            const evNum = this.state.selectedRelayEvent;
            const bonusMs = Math.round(this.state.autoRelayTakeoverBonus * 1000);
            const flatStartPenaltyMs = Math.round(this.state.cannonFlatStartPenalty * 1000);
            const flyingStartDeltaMs = Math.round(this.state.cannonFlyingDelta * 1000);
            const legs = this.state.currentRelayComposition.legs;

            const res = this.optimizer.evaluateCustomRelayComposition(evNum, legs, {
                takeoverBonusMs: bonusMs,
                flatStartPenaltyMs,
                flyingStartDeltaMs
            });
            if (res) {
                this.state.currentRelayComposition.relayResult = res.relayResult;
                this.state.currentRelayComposition.legs = res.legs;
                this.renderRelayComposer();
            }
        }

        async deployCurrentRelayComposition() {
            if (!this.state.currentRelayComposition) return;
            const evNum = this.state.selectedRelayEvent;
            const bonusMs = Math.round(this.state.autoRelayTakeoverBonus * 1000);
            const legs = this.state.currentRelayComposition.legs;

            const res = this.optimizer.deployRelayTeam(evNum, legs, bonusMs);
            if (res && res.error) {
                alert(res.message);
                return;
            }

            // Sync with Arena Race Manager live API for Race 51 (or any relay event)
            let serverSynced = false;
            try {
                const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000';
                const activeRound = (typeof localStorage !== 'undefined' && localStorage.getItem('arena_current_round')) ? localStorage.getItem('arena_current_round') : 'round-1';

                // Step 1: Clear existing selections on this race to avoid duplicate swimmer collisions across legs
                for (let i = 0; i < legs.length; i++) {
                    await fetch(`${origin}/api/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            round_id: activeRound,
                            race_id: evNum,
                            leg_index: i,
                            swimmer_id: null
                        })
                    }).catch(() => null);
                }

                // Step 2: Assign each leg with its newly ordered swimmer
                for (let i = 0; i < legs.length; i++) {
                    const leg = legs[i];
                    let swimmerId = leg.swimmer_id;
                    if (!swimmerId && leg.swimmer && this.state.swimmersByName) {
                        swimmerId = this.state.swimmersByName[leg.swimmer.trim().toLowerCase()];
                    }
                    if (swimmerId) {
                        await fetch(`${origin}/api/assign`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                round_id: activeRound,
                                race_id: evNum,
                                leg_index: i,
                                swimmer_id: swimmerId
                            })
                        }).catch(() => null);
                    }
                }
                serverSynced = true;
            } catch (err) {
                console.warn('Live API assign error (offline mode):', err.message);
            }

            if (res) {
                this.state.lastDeployedRelayFeedback = {
                    eventNumber: evNum,
                    isSquadron: legs.length === 8,
                    swimmerName: res.swimmer || res.swimmerName,
                    timeStr: res.timeStr,
                    rank: res.eventRankAfter !== undefined ? res.eventRankAfter : (res.rank !== undefined ? res.rank : 1),
                    points: res.eventPointsAfter !== undefined ? res.eventPointsAfter : (res.points !== undefined ? res.points : 0),
                    deltaPoints: res.eventPointsDelta !== undefined ? res.eventPointsDelta : (res.deltaPoints !== undefined ? res.deltaPoints : 0),
                    deltaRank: res.eventRankDelta !== undefined ? res.eventRankDelta : (res.deltaRank !== undefined ? res.deltaRank : 0),
                    serverSynced,
                    timestamp: Date.now()
                };
                this.showSwapFeedback(res);
                this.renderAll();
                this.recalcCurrentRelayComposition();
            }
        }

        scrollToMatrixEvent(eventNumber) {
            this.switchTab('side-by-side');
            setTimeout(() => {
                const el = document.getElementById(`matrix-event-card-${eventNumber}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-950/40');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-950/40');
                    }, 3500);
                }
            }, 100);
        }

        renderMatrix() {
            if (!this.dom.matrixEventsContainer) return;

            const det = this.predictor.runDeterministicProjection();
            let events = det.eventProjections;

            // Filter stroke
            if (this.state.matrixStrokeFilter !== 'ALL') {
                events = events.filter(p => p.event.stroke.toUpperCase().includes(this.state.matrixStrokeFilter));
            }

            // Search query
            if (this.state.matrixSearchQuery) {
                events = events.filter(p => `${p.event.number} ${p.event.name}`.toLowerCase().includes(this.state.matrixSearchQuery));
            }

            let html = '';
            events.forEach(p => {
                const ev = p.event;
                html += `
                    <div id="matrix-event-card-${ev.number}" class="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2 transition-all duration-300">
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-bold">#${ev.number}</span>
                                <h4 class="font-bold text-white text-sm">${ev.name}</h4>
                            </div>
                            <button onclick="window.tacticalApp.selectEventForSwap(${ev.number})" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700">
                                ${ev.isRelay ? (ev.number >= 50 ? '⚡ Cannon Optimizer &rarr;' : '⚡ Relay Optimizer &rarr;') : 'Tactical Swap &rarr;'}
                            </button>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            ${p.field.map(f => {
                                let displayName = f.swimmerName;
                                if (ev.isRelay) {
                                    if (f.club.name === 'Weston S Mare') {
                                        const override = this.storage.lineups.overrides[ev.number];
                                        if (override && override.swimmer) {
                                            displayName = override.swimmer;
                                        } else if (f.swimmerName && !f.swimmerName.includes('Squad')) {
                                            displayName = f.swimmerName;
                                        } else {
                                            displayName = ev.number >= 50 ? '8x50m Mixed Cannon Squad' : 'Relay Squad';
                                        }
                                    } else {
                                        displayName = `${f.club.shortCode || f.club.name} Squad`;
                                    }
                                }
                                return `
                                <div class="bg-slate-950 p-2 rounded border ${f.club.name === 'Weston S Mare' ? 'border-cyan-500/70 bg-cyan-950/20' : 'border-slate-800/80'} text-xs">
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-[11px] ${f.club.name === 'Weston S Mare' ? 'text-cyan-300' : 'text-slate-300'} truncate">${f.club.shortCode || f.club.name}</span>
                                        <span class="font-mono text-[10px] text-amber-400 font-bold">#${f.rank}</span>
                                    </div>
                                    <div class="font-mono text-xs font-bold text-white mt-1">${f.timeStr}</div>
                                    <div class="text-[9px] text-slate-400 truncate mt-0.5" title="${displayName}">
                                        ${displayName}
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            });

            this.dom.matrixEventsContainer.innerHTML = html;
        }

        // Modals & Ingestion
        openImportModal() {
            if (this.dom.importerModal) this.dom.importerModal.classList.remove('hidden');
        }

        closeImportModal() {
            if (this.dom.importerModal) this.dom.importerModal.classList.add('hidden');
        }

        switchImportTab(tab) {
            this.state.importTab = tab;
            const isOcr = tab === 'ocr';
            if (this.dom.importPanelOcr) this.dom.importPanelOcr.classList.toggle('hidden', !isOcr);
            if (this.dom.importPanelJson) this.dom.importPanelJson.classList.toggle('hidden', isOcr);
            if (this.dom.importTabOcrBtn) {
                this.dom.importTabOcrBtn.className = isOcr ? 'font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'font-bold text-slate-400 hover:text-white pb-1';
            }
            if (this.dom.importTabJsonBtn) {
                this.dom.importTabJsonBtn.className = !isOcr ? 'font-bold text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'font-bold text-slate-400 hover:text-white pb-1';
            }
        }

        executeOcrImport() {
            const rawText = this.dom.importOcrText ? this.dom.importOcrText.value.trim() : '';
            const roundLabel = this.dom.importRoundLabel ? this.dom.importRoundLabel.value.trim() : 'Round 1';
            if (!rawText) return;

            const res = GalaImporter.parseAndMergeGalaText(rawText, this.storage, { roundLabel });

            if (this.dom.importFeedback) {
                if (res.success) {
                    this.dom.importFeedback.className = 'text-xs font-semibold text-emerald-400';
                    this.dom.importFeedback.textContent = `✓ Ingestion Success! Merged ${res.parsedSwimsCount} swims across ${res.parsedEventsCount} events for ${res.clubsDetected.length} clubs.`;
                    this.refreshPredictorFromStorage();
                    this.renderAll();
                    setTimeout(() => this.closeImportModal(), 1500);
                } else {
                    this.dom.importFeedback.className = 'text-xs font-semibold text-rose-400';
                    this.dom.importFeedback.textContent = `Parse warning: No valid times found. Please ensure lines contain recognizable club names and times.`;
                }
            }
        }

        downloadDatabaseJSON() {
            const jsonStr = this.storage.exportDatabaseJSON();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Arena_Times_DB_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        copyDatabaseJSON() {
            const jsonStr = this.storage.exportDatabaseJSON();
            navigator.clipboard.writeText(jsonStr).then(() => {
                alert('Database state JSON copied to clipboard!');
            });
        }

        restoreDatabaseJSON() {
            const jsonStr = this.dom.importJsonText ? this.dom.importJsonText.value.trim() : '';
            if (!jsonStr) return;
            try {
                this.storage.importDatabaseJSON(jsonStr);
                this.refreshPredictorFromStorage();
                this.renderAll();
                alert('Database restored successfully from JSON!');
                this.closeImportModal();
            } catch (e) {
                alert(`Import failed: ${e.message}`);
            }
        }

        openCompetitorModal() {
            if (!this.dom.competitorModal || !this.dom.competitorLanesInputs) return;

            const activeGala = this.storage.getActiveGalaLineup();
            const masterClubs = this.storage.getMasterClubs();

            let html = '';
            for (let lane = 1; lane <= 8; lane++) {
                const assigned = activeGala.competingClubs.find(c => c.lane === lane);
                html += `
                    <div class="flex items-center space-x-2">
                        <span class="w-16 font-mono font-bold text-slate-400">Lane ${lane}:</span>
                        <select id="competitor-lane-${lane}" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400">
                            ${masterClubs.map(m => `
                                <option value="${m.name}" ${assigned && assigned.name === m.name ? 'selected' : ''}>
                                    ${m.name} (${m.shortCode})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
            }

            this.dom.competitorLanesInputs.innerHTML = html;
            this.dom.competitorModal.classList.remove('hidden');
        }

        closeCompetitorModal() {
            if (this.dom.competitorModal) this.dom.competitorModal.classList.add('hidden');
        }

        saveCompetitorLineup() {
            const newClubNames = [];
            for (let lane = 1; lane <= 8; lane++) {
                const sel = document.getElementById(`competitor-lane-${lane}`);
                if (sel) newClubNames.push(sel.value);
            }

            const activeGala = this.storage.getActiveGalaLineup();
            this.storage.createOrUpdateGalaLineup({
                galaId: activeGala.galaId,
                name: activeGala.name,
                date: activeGala.date,
                venue: activeGala.venue,
                competingClubs: newClubNames
            });

            this.refreshPredictorFromStorage();
            this.renderAll();
            this.closeCompetitorModal();
        }
    }

    return TacticalDashboardViewController;
}));
