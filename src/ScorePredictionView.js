/**
 * ScorePredictionView.js
 * Arena Race Manager - UI Controller for Predictive Scoring Engine
 * 
 * Coordinates:
 * - Deterministic and Monte Carlo simulation rendering.
 * - Live leaderboard with animated bar charts and milestone checkpoints.
 * - Swing events radar (< 0.30s delta).
 * - Head-to-head comparison matrix.
 * - Relay split estimator.
 * - What-if scenario editor and data ingestion modal.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./timeUtils', './predictionEngine', './round1Data'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./timeUtils'),
            require('./predictionEngine'),
            require('./round1Data')
        );
    } else {
        root.ScorePredictionViewController = factory(
            root.TimeUtils,
            root.RacePredictor,
            root.ROUND_1_DATA
        );
    }
}(typeof self !== 'undefined' ? self : this, function (TimeUtils, RacePredictor, Round1Data) {
    'use strict';

    class ScorePredictionViewController {
        constructor(storage = null) {
            this.storage = storage;
            this.predictor = new RacePredictor({
                seedData: Round1Data ? Round1Data.SEED_DATA_FULL : {}
            });

            this.state = {
                activeMode: 'deterministic', // 'deterministic' | 'monte-carlo'
                variance: 0.012, // 1.2%
                iterations: 500,
                selectedClubA: 'Weston S Mare',
                selectedClubB: 'Truro City',
                selectedRelayEvent: 42,
                relayLegTimes: ['28.50', '31.20', '26.80', '24.50'],
                relayTakeoverBonus: 0.60,
                activeEventFilter: 'ALL',
                searchQuery: '',
                activeH2HFilter: 'ALL',
                activeTab: 'leaderboard', // 'leaderboard' | 'swing' | 'h2h' | 'relay' | 'events'
                lastMonteCarloResults: null
            };

            this.dom = {};
        }

        init(containerId = 'score-prediction-app') {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.warn(`Container #${containerId} not found.`);
                return;
            }

            this.cacheDomElements();
            this.bindEvents();
            this.renderAll();
            this.syncWithRaceManager();
        }

        async syncWithRaceManager() {
            try {
                const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000';
                const [simRes, selections] = await Promise.all([
                    fetch(`${origin}/api/simulation?round_id=round-2`).then(r => r.json()).catch(() => null),
                    fetch(`${origin}/api/selections?round_id=round-2`).then(r => r.json()).catch(() => null)
                ]);

                const selByRace = {};
                if (Array.isArray(selections)) {
                    selections.forEach(s => {
                        if (!selByRace[s.race_id]) selByRace[s.race_id] = [];
                        selByRace[s.race_id].push(s);
                    });
                }

                if (simRes && Array.isArray(simRes.event_simulations)) {
                    simRes.event_simulations.forEach(es => {
                        if (es.seed_time_sec && es.formatted_seed_time) {
                            const sels = selByRace[es.race_no] || [];
                            const ev = this.predictor.events.find(e => e.number === es.race_no);
                            let swimmerName = 'Weston Swimmer';
                            let relayLegs = null;
                            if ((ev && ev.isRelay) || sels.length > 1) {
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
                            }
                            this.predictor.setEntryOverride(es.race_no, 'Weston S Mare', {
                                swimmerName: swimmerName,
                                timeStr: es.formatted_seed_time,
                                timeMs: Math.round(es.seed_time_sec * 1000),
                                isDisqualified: false,
                                relayLegs: relayLegs
                            });
                        }
                    });
                    this.renderAll();
                }
            } catch (e) {
                // Ignore if offline
            }
        }

        cacheDomElements() {
            const get = (id) => document.getElementById(id);
            this.dom = {
                // KPI cards
                kpiProjectedWinner: get('kpi-projected-winner'),
                kpiWinnerScore: get('kpi-winner-score'),
                kpiWinnerProb: get('kpi-winner-prob'),
                kpiWestonFinish: get('kpi-weston-finish'),
                kpiWestonScore: get('kpi-weston-score'),
                kpiWestonWinProb: get('kpi-weston-win-prob'),
                kpiSwingCount: get('kpi-swing-count'),
                kpiTotalEvents: get('kpi-total-events'),

                // Controls
                modeDeterministicBtn: get('mode-deterministic-btn'),
                modeMonteCarloBtn: get('mode-monte-carlo-btn'),
                mcSettingsPanel: get('mc-settings-panel'),
                varianceSlider: get('variance-slider'),
                varianceValText: get('variance-val-text'),
                iterationsSelect: get('iterations-select'),
                runSimulationBtn: get('run-simulation-btn'),

                // Navigation Tabs
                tabBtns: document.querySelectorAll('.prediction-tab-btn'),
                tabPanels: document.querySelectorAll('.prediction-tab-panel'),

                // Sections
                leaderboardBody: get('leaderboard-table-body'),
                checkpointsTableHead: get('checkpoints-table-head'),
                checkpointsTableBody: get('checkpoints-table-body'),
                swingEventsList: get('swing-events-list'),
                swingFilterSelect: get('swing-filter-select'),

                // Head-to-Head
                h2hClubASelect: get('h2h-club-a-select'),
                h2hClubBSelect: get('h2h-club-b-select'),
                h2hScoreBoard: get('h2h-scoreboard'),
                h2hFilterSelect: get('h2h-filter-select'),
                h2hTableBody: get('h2h-table-body'),

                // Relay Estimator
                relayEventSelect: get('relay-event-select'),
                relayTakeoverBonusInput: get('relay-takeover-bonus'),
                relayTakeoverBonusVal: get('relay-takeover-bonus-val'),
                relayLeg1Input: get('relay-leg-1'),
                relayLeg2Input: get('relay-leg-2'),
                relayLeg3Input: get('relay-leg-3'),
                relayLeg4Input: get('relay-leg-4'),
                relayCalcResultCard: get('relay-calc-result-card'),
                relayFieldTableBody: get('relay-field-table-body'),

                // Events master list
                eventsSearchInput: get('events-search-input'),
                eventsStrokeFilter: get('events-stroke-filter'),
                eventsMasterList: get('events-master-list'),

                // Modals
                dataModal: get('prediction-data-modal'),
                dataInputText: get('prediction-data-input'),
                dataImportStatus: get('data-import-status'),
                scenarioModal: get('scenario-modal'),
                scenarioModalContent: get('scenario-modal-content')
            };
        }

        bindEvents() {
            // Mode switching
            if (this.dom.modeDeterministicBtn) {
                this.dom.modeDeterministicBtn.addEventListener('click', () => {
                    this.state.activeMode = 'deterministic';
                    this.dom.modeDeterministicBtn.classList.add('bg-cyan-500', 'text-slate-950');
                    this.dom.modeDeterministicBtn.classList.remove('bg-slate-800', 'text-slate-300');
                    this.dom.modeMonteCarloBtn.classList.remove('bg-cyan-500', 'text-slate-950');
                    this.dom.modeMonteCarloBtn.classList.add('bg-slate-800', 'text-slate-300');
                    if (this.dom.mcSettingsPanel) this.dom.mcSettingsPanel.classList.add('hidden');
                    this.renderLeaderboard();
                    this.renderKpis();
                });
            }

            if (this.dom.modeMonteCarloBtn) {
                this.dom.modeMonteCarloBtn.addEventListener('click', () => {
                    this.state.activeMode = 'monte-carlo';
                    this.dom.modeMonteCarloBtn.classList.add('bg-cyan-500', 'text-slate-950');
                    this.dom.modeMonteCarloBtn.classList.remove('bg-slate-800', 'text-slate-300');
                    this.dom.modeDeterministicBtn.classList.remove('bg-cyan-500', 'text-slate-950');
                    this.dom.modeDeterministicBtn.classList.add('bg-slate-800', 'text-slate-300');
                    if (this.dom.mcSettingsPanel) this.dom.mcSettingsPanel.classList.remove('hidden');
                    this.runMonteCarlo();
                });
            }

            // Variance Slider
            if (this.dom.varianceSlider) {
                this.dom.varianceSlider.addEventListener('input', (e) => {
                    const pct = parseFloat(e.target.value);
                    this.state.variance = pct / 100;
                    if (this.dom.varianceValText) this.dom.varianceValText.textContent = `${pct.toFixed(1)}%`;
                });
                this.dom.varianceSlider.addEventListener('change', () => {
                    if (this.state.activeMode === 'monte-carlo') {
                        this.runMonteCarlo();
                    }
                });
            }

            // Iterations select
            if (this.dom.iterationsSelect) {
                this.dom.iterationsSelect.addEventListener('change', (e) => {
                    this.state.iterations = parseInt(e.target.value, 10);
                    if (this.state.activeMode === 'monte-carlo') {
                        this.runMonteCarlo();
                    }
                });
            }

            // Run Simulation Button
            if (this.dom.runSimulationBtn) {
                this.dom.runSimulationBtn.addEventListener('click', () => {
                    this.runMonteCarlo();
                });
            }

            // Navigation tabs
            if (this.dom.tabBtns) {
                this.dom.tabBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tabKey = btn.getAttribute('data-tab');
                        this.switchTab(tabKey);
                    });
                });
            }

            // Head to Head Selects
            if (this.dom.h2hClubASelect) {
                this.dom.h2hClubASelect.addEventListener('change', (e) => {
                    this.state.selectedClubA = e.target.value;
                    this.renderHeadToHead();
                });
            }
            if (this.dom.h2hClubBSelect) {
                this.dom.h2hClubBSelect.addEventListener('change', (e) => {
                    this.state.selectedClubB = e.target.value;
                    this.renderHeadToHead();
                });
            }
            if (this.dom.h2hFilterSelect) {
                this.dom.h2hFilterSelect.addEventListener('change', (e) => {
                    this.state.activeH2HFilter = e.target.value;
                    this.renderHeadToHead();
                });
            }

            // Swing Filter Select
            if (this.dom.swingFilterSelect) {
                this.dom.swingFilterSelect.addEventListener('change', () => {
                    this.renderSwingEvents();
                });
            }

            // Relay Estimator Inputs
            if (this.dom.relayEventSelect) {
                this.dom.relayEventSelect.addEventListener('change', (e) => {
                    this.state.selectedRelayEvent = parseInt(e.target.value, 10);
                    this.updateRelayInputsForEvent(this.state.selectedRelayEvent);
                    this.renderRelayEstimator();
                });
            }

            if (this.dom.relayTakeoverBonusInput) {
                this.dom.relayTakeoverBonusInput.addEventListener('input', (e) => {
                    const sec = parseFloat(e.target.value);
                    this.state.relayTakeoverBonus = sec;
                    if (this.dom.relayTakeoverBonusVal) {
                        this.dom.relayTakeoverBonusVal.textContent = `-${sec.toFixed(2)}s`;
                    }
                    this.renderRelayEstimator();
                });
            }

            const legInputs = [this.dom.relayLeg1Input, this.dom.relayLeg2Input, this.dom.relayLeg3Input, this.dom.relayLeg4Input];
            legInputs.forEach((inp, idx) => {
                if (inp) {
                    inp.addEventListener('input', (e) => {
                        this.state.relayLegTimes[idx] = e.target.value;
                        this.renderRelayEstimator();
                    });
                }
            });

            // Events Search & Filter
            if (this.dom.eventsSearchInput) {
                this.dom.eventsSearchInput.addEventListener('input', (e) => {
                    this.state.searchQuery = e.target.value.toLowerCase();
                    this.renderEventsMasterList();
                });
            }
            if (this.dom.eventsStrokeFilter) {
                this.dom.eventsStrokeFilter.addEventListener('change', (e) => {
                    this.state.activeEventFilter = e.target.value;
                    this.renderEventsMasterList();
                });
            }
        }

        switchTab(tabKey) {
            this.state.activeTab = tabKey;
            if (this.dom.tabBtns) {
                this.dom.tabBtns.forEach(btn => {
                    const active = btn.getAttribute('data-tab') === tabKey;
                    if (active) {
                        btn.classList.add('border-cyan-400', 'text-cyan-400');
                        btn.classList.remove('border-transparent', 'text-slate-400');
                    } else {
                        btn.classList.remove('border-cyan-400', 'text-cyan-400');
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

        runMonteCarlo() {
            if (this.dom.runSimulationBtn) {
                this.dom.runSimulationBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg> Running...
                `;
            }

            setTimeout(() => {
                const results = this.predictor.runMonteCarloSimulation(
                    this.state.iterations,
                    this.state.variance
                );
                this.state.lastMonteCarloResults = results;

                if (this.dom.runSimulationBtn) {
                    this.dom.runSimulationBtn.innerHTML = `
                        <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> Run Monte Carlo (${this.state.iterations})
                    `;
                }

                this.renderLeaderboard();
                this.renderKpis();
                this.renderSwingEvents();
            }, 50);
        }

        renderAll() {
            this.populateDropdowns();
            this.renderKpis();
            this.renderLeaderboard();
            this.renderMilestoneCheckpoints();
            this.renderSwingEvents();
            this.renderHeadToHead();
            this.renderRelayEstimator();
            this.renderEventsMasterList();
        }

        populateDropdowns() {
            const clubs = this.predictor.clubs;

            // Head to Head Selects
            if (this.dom.h2hClubASelect && this.dom.h2hClubASelect.children.length === 0) {
                clubs.forEach(c => {
                    const optA = document.createElement('option');
                    optA.value = c.name;
                    optA.textContent = `${c.name} (Lane ${c.lane})`;
                    if (c.name === this.state.selectedClubA) optA.selected = true;
                    this.dom.h2hClubASelect.appendChild(optA);

                    const optB = document.createElement('option');
                    optB.value = c.name;
                    optB.textContent = `${c.name} (Lane ${c.lane})`;
                    if (c.name === this.state.selectedClubB) optB.selected = true;
                    this.dom.h2hClubBSelect.appendChild(optB);
                });
            }

            // Relay Events Select
            if (this.dom.relayEventSelect && this.dom.relayEventSelect.children.length === 0) {
                const relayEvents = this.predictor.events.filter(e => e.isRelay);
                relayEvents.forEach(re => {
                    const opt = document.createElement('option');
                    opt.value = re.number;
                    opt.textContent = `Event ${re.number}: ${re.name}`;
                    if (re.number === this.state.selectedRelayEvent) opt.selected = true;
                    this.dom.relayEventSelect.appendChild(opt);
                });
            }
        }

        renderKpis() {
            const det = this.predictor.runDeterministicProjection();
            const topClub = det.rankedClubs[0];
            const weston = det.rankedClubs.find(c => c.club.name === 'Weston S Mare');

            let winnerName = topClub.club.name;
            let winnerScore = `${topClub.totalPoints} pts`;
            let winnerProb = '100% (Det)';
            let westonRank = weston ? `#${weston.projectedRank}` : '—';
            let westonScore = weston ? `${weston.totalPoints} pts` : '—';
            let westonWinProb = '0%';

            if (this.state.activeMode === 'monte-carlo' && this.state.lastMonteCarloResults) {
                const mc = this.state.lastMonteCarloResults;
                const mcTop = mc.aggregatedClubs[0];
                const mcWeston = mc.aggregatedClubs.find(c => c.club.name === 'Weston S Mare');

                winnerName = mcTop.club.name;
                winnerScore = `${mcTop.meanScore} ± ${mcTop.stdDev}`;
                winnerProb = `${mcTop.winProbability}% Win Prob`;

                if (mcWeston) {
                    westonRank = `#${mcWeston.projectedRank}`;
                    westonScore = `${mcWeston.meanScore} pts`;
                    westonWinProb = `${mcWeston.winProbability}% (Top 3: ${mcWeston.top3Probability}%)`;
                }
            }

            if (this.dom.kpiProjectedWinner) this.dom.kpiProjectedWinner.textContent = winnerName;
            if (this.dom.kpiWinnerScore) this.dom.kpiWinnerScore.textContent = winnerScore;
            if (this.dom.kpiWinnerProb) this.dom.kpiWinnerProb.textContent = winnerProb;

            if (this.dom.kpiWestonFinish) this.dom.kpiWestonFinish.textContent = westonRank;
            if (this.dom.kpiWestonScore) this.dom.kpiWestonScore.textContent = westonScore;
            if (this.dom.kpiWestonWinProb) this.dom.kpiWestonWinProb.textContent = westonWinProb;

            const swingCount = det.eventProjections.filter(p => p.swingAnalysis.isSwingEvent).length;
            if (this.dom.kpiSwingCount) this.dom.kpiSwingCount.textContent = swingCount;
            if (this.dom.kpiTotalEvents) this.dom.kpiTotalEvents.textContent = this.predictor.events.length;
        }

        renderLeaderboard() {
            if (!this.dom.leaderboardBody) return;

            const isMC = this.state.activeMode === 'monte-carlo' && this.state.lastMonteCarloResults;
            let ranked = [];
            const MAX_POINTS = 51 * 8; // 408 points max possible

            if (isMC) {
                ranked = this.state.lastMonteCarloResults.aggregatedClubs;
            } else {
                const det = this.predictor.runDeterministicProjection();
                ranked = det.rankedClubs;
            }

            let html = '';
            ranked.forEach((item, index) => {
                const club = item.club;
                const rank = item.projectedRank || index + 1;
                const isWeston = club.name === 'Weston S Mare';

                let scoreDisplay = '';
                let statsExtra = '';
                let barPct = 0;

                if (isMC) {
                    scoreDisplay = `${item.meanScore} <span class="text-xs text-slate-400 font-normal">±${item.stdDev}</span>`;
                    barPct = Math.min(100, (item.meanScore / MAX_POINTS) * 100);
                    statsExtra = `
                        <div class="flex items-center gap-2 text-xs">
                            <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold" title="Win Probability">🥇 ${item.winProbability}%</span>
                            <span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold" title="Podium Finish (Top 3)">🏅 ${item.top3Probability}%</span>
                            <span class="text-slate-400">Range: ${item.minScore}-${item.maxScore}</span>
                        </div>
                    `;
                } else {
                    scoreDisplay = `${item.totalPoints} <span class="text-xs text-slate-400 font-normal">pts</span>`;
                    barPct = Math.min(100, (item.totalPoints / MAX_POINTS) * 100);
                    statsExtra = `
                        <div class="flex items-center gap-2 text-xs text-slate-300">
                            <span class="text-amber-400">🥇 ${item.firstPlaces}</span>
                            <span class="text-slate-300">🥈 ${item.secondPlaces}</span>
                            <span class="text-amber-600">🥉 ${item.thirdPlaces}</span>
                            ${item.dqCount > 0 ? `<span class="text-rose-400 font-bold">DQ: ${item.dqCount}</span>` : ''}
                        </div>
                    `;
                }

                const rankBadgeClass = rank === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                    : rank === 2 ? 'bg-slate-300 text-slate-950 font-bold'
                    : rank === 3 ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 font-semibold';

                const rowBg = isWeston 
                    ? 'bg-cyan-950/40 border-cyan-500/50 hover:bg-cyan-900/40' 
                    : 'hover:bg-slate-800/50';

                html += `
                    <tr class="border-b border-slate-800/80 transition-colors ${rowBg}">
                        <td class="py-3.5 px-4 text-center">
                            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${rankBadgeClass}">${rank}</span>
                        </td>
                        <td class="py-3.5 px-4">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${club.color || '#38bdf8'}"></span>
                                <span class="font-bold ${isWeston ? 'text-cyan-300 text-base' : 'text-slate-100'}">${club.name}</span>
                                <span class="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Lane ${club.lane}</span>
                                ${isWeston ? '<span class="text-xs px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">HOST CLUB</span>' : ''}
                            </div>
                        </td>
                        <td class="py-3.5 px-4 text-right font-mono font-black text-lg text-white">
                            ${scoreDisplay}
                        </td>
                        <td class="py-3.5 px-4 min-w-[200px]">
                            <div class="space-y-1.5">
                                <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                                    <div class="h-2.5 rounded-full transition-all duration-500" style="width: ${barPct}%; background-color: ${club.color || '#38bdf8'}"></div>
                                </div>
                                <div class="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>${barPct.toFixed(1)}% of max potential</span>
                                    ${statsExtra}
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });

            this.dom.leaderboardBody.innerHTML = html;
        }

        renderMilestoneCheckpoints() {
            if (!this.dom.checkpointsTableBody) return;

            const det = this.predictor.runDeterministicProjection();
            const checkpoints = [10, 18, 26, 34, 42, 51];

            let html = '';
            det.rankedClubs.forEach(rc => {
                const isWeston = rc.club.name === 'Weston S Mare';
                const rowBg = isWeston ? 'bg-cyan-950/30 font-bold text-cyan-300' : 'text-slate-200';

                html += `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 ${rowBg}">
                        <td class="py-2.5 px-3 whitespace-nowrap font-semibold">
                            <span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${rc.club.color}"></span>
                            ${rc.club.name}
                        </td>
                        ${checkpoints.map(cp => `
                            <td class="py-2.5 px-3 text-center font-mono">
                                <span class="px-2 py-1 rounded bg-slate-800/90 border border-slate-700/60 text-xs">
                                    ${rc.checkpointScores[cp] || 0}
                                </span>
                            </td>
                        `).join('')}
                    </tr>
                `;
            });

            this.dom.checkpointsTableBody.innerHTML = html;
        }

        renderSwingEvents() {
            if (!this.dom.swingEventsList) return;

            const det = this.predictor.runDeterministicProjection();
            let swingEvents = det.eventProjections.filter(p => p.swingAnalysis.isSwingEvent);

            const filter = this.dom.swingFilterSelect ? this.dom.swingFilterSelect.value : 'ALL';
            if (filter === 'WESTON') {
                swingEvents = swingEvents.filter(p => 
                    p.swingAnalysis.swingPairs.some(pair => pair.clubA === 'Weston S Mare' || pair.clubB === 'Weston S Mare')
                );
            } else if (filter === 'RELAY') {
                swingEvents = swingEvents.filter(p => p.event.isRelay);
            }

            if (swingEvents.length === 0) {
                this.dom.swingEventsList.innerHTML = `
                    <div class="p-8 text-center text-slate-400 bg-slate-850 rounded-xl border border-slate-800">
                        <svg class="w-10 h-10 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="font-medium text-slate-300">No swing events found for selected filter.</p>
                        <p class="text-xs text-slate-500 mt-1">All competitors in this group have seed gaps > 0.30s.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            swingEvents.forEach(se => {
                const ev = se.event;
                const tightest = se.swingAnalysis.tightestDeltaMs;
                const tightestStr = tightest !== null ? (tightest / 1000).toFixed(2) + 's' : '—';
                const pairs = se.swingAnalysis.swingPairs;

                html += `
                    <div class="bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all shadow-md">
                        <div class="flex items-start justify-between flex-wrap gap-2 mb-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                                        ⚡ SWING EVENT #${ev.number}
                                    </span>
                                    <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        Tightest Gap: <strong class="text-amber-300 font-mono">${tightestStr}</strong>
                                    </span>
                                    ${ev.isRelay ? '<span class="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">Relay</span>' : ''}
                                </div>
                                <h4 class="text-base font-bold text-white mt-1">${ev.name}</h4>
                            </div>
                            <button onclick="window.appController.openEventInspector(${ev.number})" class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition">
                                Inspect Field & What-If &rarr;
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            ${pairs.map(p => `
                                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold text-slate-200">${p.clubA}</span>
                                        <span class="text-slate-500">vs</span>
                                        <span class="font-bold text-slate-200">${p.clubB}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-amber-400 font-bold">&Delta; ${p.deltaFormatted}</span>
                                        <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold" title="Point Swing Potential">
                                            &plusmn;${Math.max(1, p.pointsDifference || 1)} pts
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });

            this.dom.swingEventsList.innerHTML = html;
        }

        renderHeadToHead() {
            if (!this.dom.h2hTableBody || !this.dom.h2hScoreBoard) return;

            const clubA = this.state.selectedClubA;
            const clubB = this.state.selectedClubB;

            if (clubA === clubB) {
                this.dom.h2hScoreBoard.innerHTML = `
                    <div class="p-6 text-center text-amber-400 font-semibold bg-amber-500/10 rounded-xl border border-amber-500/30">
                        Please select two different clubs to generate Head-to-Head comparison.
                    </div>
                `;
                this.dom.h2hTableBody.innerHTML = '';
                return;
            }

            const matrix = this.predictor.getHeadToHeadMatrix(clubA, clubB);

            // Render Scoreboard Banner
            const diff = matrix.pointDifferential;
            const leaderName = diff > 0 ? clubA : (diff < 0 ? clubB : 'Tied');
            const diffDisplay = Math.abs(diff);

            this.dom.h2hScoreBoard.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <!-- Club A Card -->
                    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Club 1</span>
                        <h3 class="text-xl font-bold text-cyan-400 mt-0.5">${matrix.clubA.name}</h3>
                        <div class="text-3xl font-black font-mono text-white mt-1">${matrix.totalPointsA} <span class="text-sm font-normal text-slate-400">pts</span></div>
                        <div class="text-xs text-slate-400 mt-1">${matrix.winsA} Events Won</div>
                    </div>

                    <!-- Center Battle Differential -->
                    <div class="text-center p-3">
                        <span class="text-xs font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                            Head-to-Head Margin
                        </span>
                        <div class="text-2xl font-black text-white mt-2">
                            ${diff === 0 ? 'TIED' : `${leaderName} +${diffDisplay} pts`}
                        </div>
                        <p class="text-xs text-slate-400 mt-1">
                            ${matrix.swingBattlesCount} Swing Battles (&le; 0.30s)
                        </p>
                    </div>

                    <!-- Club B Card -->
                    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Club 2</span>
                        <h3 class="text-xl font-bold text-amber-400 mt-0.5">${matrix.clubB.name}</h3>
                        <div class="text-3xl font-black font-mono text-white mt-1">${matrix.totalPointsB} <span class="text-sm font-normal text-slate-400">pts</span></div>
                        <div class="text-xs text-slate-400 mt-1">${matrix.winsB} Events Won</div>
                    </div>
                </div>
            `;

            // Filter table rows
            let rows = matrix.eventsMatrix;
            const filter = this.state.activeH2HFilter;
            if (filter === 'ADV_A') rows = rows.filter(r => r.advantage === clubA);
            else if (filter === 'ADV_B') rows = rows.filter(r => r.advantage === clubB);
            else if (filter === 'SWING') rows = rows.filter(r => r.isSwing);

            let html = '';
            rows.forEach(r => {
                let badgeClass = 'bg-slate-800 text-slate-400 border border-slate-700';
                if (r.isSwing) badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
                else if (r.advantage === clubA) badgeClass = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold';
                else if (r.advantage === clubB) badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold';

                html += `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800/30 text-xs">
                        <td class="py-2.5 px-3 font-mono font-bold text-slate-400">#${r.eventNumber}</td>
                        <td class="py-2.5 px-3 font-medium text-slate-200">
                            ${r.eventName}
                            ${r.isRelay ? '<span class="ml-1 text-[10px] text-purple-400">Relay</span>' : ''}
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono">
                            <span class="${r.clubA.isImputed ? 'text-amber-400/80' : 'text-slate-100'}">${r.clubA.timeStr}</span>
                            <span class="text-[10px] text-slate-500 block">R${r.clubA.rank} (${r.clubA.points}pts)</span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono">
                            <span class="${r.clubB.isImputed ? 'text-amber-400/80' : 'text-slate-100'}">${r.clubB.timeStr}</span>
                            <span class="text-[10px] text-slate-500 block">R${r.clubB.rank} (${r.clubB.points}pts)</span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                            ${r.timeDeltaStr}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <span class="px-2 py-0.5 rounded text-[11px] ${badgeClass}">
                                ${r.advantage}
                            </span>
                        </td>
                    </tr>
                `;
            });

            this.dom.h2hTableBody.innerHTML = html;
        }

        updateRelayInputsForEvent(eventNumber) {
            const ev = this.predictor.events.find(e => e.number === eventNumber);
            if (!ev) return;

            // Preload sample realistic 50m flat times based on age/stroke
            let samples = ['28.50', '31.20', '26.80', '24.50'];
            if (ev.age === '9-11') samples = ['36.20', '39.80', '37.10', '32.40'];
            else if (ev.age === '13/U') samples = ['30.50', '34.20', '31.00', '27.40'];
            else if (ev.age === '15/U') samples = ['27.80', '30.50', '26.90', '24.80'];

            this.state.relayLegTimes = samples;
            if (this.dom.relayLeg1Input) this.dom.relayLeg1Input.value = samples[0];
            if (this.dom.relayLeg2Input) this.dom.relayLeg2Input.value = samples[1];
            if (this.dom.relayLeg3Input) this.dom.relayLeg3Input.value = samples[2];
            if (this.dom.relayLeg4Input) this.dom.relayLeg4Input.value = samples[3];
        }

        renderRelayEstimator() {
            if (!this.dom.relayCalcResultCard || !this.dom.relayFieldTableBody) return;

            const evNum = this.state.selectedRelayEvent;
            const legTimesMs = this.state.relayLegTimes.map(t => TimeUtils.parseTimeToMs(t).ms);
            const takeoverBonusMs = Math.round(this.state.relayTakeoverBonus * 1000);

            const proj = this.predictor.projectRelayPerformance(
                evNum,
                legTimesMs,
                takeoverBonusMs,
                'Weston S Mare'
            );

            // Render Result Card
            this.dom.relayCalcResultCard.innerHTML = `
                ${(evNum >= 50) ? `
                    <div class="mb-3 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div class="space-y-0.5">
                            <div class="flex items-center space-x-2">
                                <span class="text-base">⚡</span>
                                <strong class="text-white font-bold">Event #${evNum}: 8 &times; 50m Mixed Cannon Relay Lineup Optimizer</strong>
                            </div>
                            <p class="text-slate-300">
                                Configure Cannon strategies (Traditional, Reverse Front-Load, Pure Speed, Sandwich Buffer, Hunter Anchor), fatigue models, and simulate split progression with 1-click deployment to the Gala Programme.
                            </p>
                        </div>
                        <a href="components/TacticalDashboardView.html?event=${evNum}#relay-auto" class="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition whitespace-nowrap flex items-center space-x-1.5 shadow">
                            <span>⚡ Open Cannon Optimizer &rarr;</span>
                        </a>
                    </div>
                ` : ''}
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span class="text-[11px] text-slate-400 block">Flat Sum of Legs</span>
                        <span class="text-lg font-mono font-bold text-slate-200">${proj.rawSumFormatted}</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span class="text-[11px] text-slate-400 block">Takeover Bonus (${proj.totalExchanges}x)</span>
                        <span class="text-lg font-mono font-bold text-emerald-400">-${(proj.bonusMs / 1000).toFixed(2)}s</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-cyan-500/40">
                        <span class="text-[11px] text-cyan-300 block font-semibold">Projected Relay Time</span>
                        <span class="text-xl font-mono font-black text-cyan-300">${proj.compositeTimeFormatted}</span>
                    </div>
                    <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span class="text-[11px] text-slate-400 block">Projected Finish</span>
                        <span class="text-lg font-mono font-black text-amber-400">Rank #${proj.projectedRank} (${proj.projectedPoints} pts)</span>
                    </div>
                </div>
            `;

            // Render Field Comparison Table
            let html = '';
            proj.fieldComparison.forEach((item, idx) => {
                const rank = idx + 1;
                const isWeston = item.isProjectedRelay || item.club.name === 'Weston S Mare';
                const rowBg = isWeston ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-bold' : 'text-slate-300';

                html += `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 ${rowBg} text-xs">
                        <td class="py-2.5 px-3 text-center font-mono">
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300">${rank}</span>
                        </td>
                        <td class="py-2.5 px-3 font-semibold">
                            ${item.club.name}
                            ${isWeston ? '<span class="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300">ESTIMATED</span>' : ''}
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold">
                            ${item.timeStr}
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono text-slate-400">
                            ${rank <= 8 ? RacePredictor.STANDARD_POINTS[rank - 1] : 1} pts
                        </td>
                    </tr>
                `;
            });

            this.dom.relayFieldTableBody.innerHTML = html;
        }

        renderEventsMasterList() {
            if (!this.dom.eventsMasterList) return;

            const det = this.predictor.runDeterministicProjection();
            let events = det.eventProjections;

            // Stroke filter
            if (this.state.activeEventFilter !== 'ALL') {
                events = events.filter(p => {
                    const stroke = p.event.stroke.toUpperCase();
                    return stroke.includes(this.state.activeEventFilter);
                });
            }

            // Search query
            if (this.state.searchQuery) {
                events = events.filter(p => {
                    const str = `${p.event.number} ${p.event.name} ${p.event.age} ${p.event.gender}`.toLowerCase();
                    return str.includes(this.state.searchQuery);
                });
            }

            let html = '';
            events.forEach(p => {
                const ev = p.event;
                const swing = p.swingAnalysis;

                html += `
                    <div class="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition">
                        <div class="bg-slate-800/60 p-3 flex items-center justify-between flex-wrap gap-2 border-b border-slate-800">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-xs font-mono font-bold">#${ev.number}</span>
                                <h4 class="font-bold text-white text-sm">${ev.name}</h4>
                                ${ev.isCheckpoint ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">CHECKPOINT</span>' : ''}
                                ${swing.isSwingEvent ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">⚡ SWING</span>' : ''}
                            </div>
                            <div class="flex items-center gap-2">
                                ${ev.isRelay ? `
                                    <a href="components/TacticalDashboardView.html?event=${ev.number}#relay-auto" class="text-xs px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-semibold transition flex items-center space-x-1">
                                        <span>⚡ ${ev.number >= 50 ? '8x50m Cannon' : 'Relay'} Optimizer &rarr;</span>
                                    </a>
                                ` : ''}
                                <button onclick="window.appController.openEventInspector(${ev.number})" class="text-xs px-2.5 py-1 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-200 font-medium transition">
                                    What-If Override &rarr;
                                </button>
                            </div>
                        </div>

                        <div class="p-3 overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead>
                                    <tr class="text-slate-400 border-b border-slate-800/60">
                                        <th class="pb-1.5 px-2">Rank</th>
                                        <th class="pb-1.5 px-2">Club</th>
                                        <th class="pb-1.5 px-2">Swimmer</th>
                                        <th class="pb-1.5 px-2 text-right">Seed Time</th>
                                        <th class="pb-1.5 px-2 text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${p.field.map(f => `
                                        <tr class="border-b border-slate-800/40 hover:bg-slate-800/30 ${f.club.name === 'Weston S Mare' ? 'text-cyan-300 font-bold' : 'text-slate-300'}">
                                            <td class="py-1.5 px-2 font-mono font-bold">#${f.rank}</td>
                                            <td class="py-1.5 px-2">
                                                <span class="inline-block w-2 h-2 rounded-full mr-1.5" style="background-color: ${f.club.color}"></span>
                                                ${f.club.name} (L${f.club.lane})
                                            </td>
                                            <td class="py-1.5 px-2 text-slate-400">${f.swimmerName}</td>
                                            <td class="py-1.5 px-2 text-right font-mono font-semibold">
                                                ${f.timeStr}
                                                ${f.isImputed ? '<span class="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 ml-1">Imputed</span>' : ''}
                                                ${f.isOverride ? '<span class="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 ml-1">Override</span>' : ''}
                                            </td>
                                            <td class="py-1.5 px-2 text-right font-mono font-bold text-white">${f.points}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            this.dom.eventsMasterList.innerHTML = html;
        }

        openEventInspector(eventNumber) {
            const ev = this.predictor.events.find(e => e.number === eventNumber);
            if (!ev || !this.dom.scenarioModal) return;

            let html = `
                <div class="p-6">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
                        <div>
                            <span class="text-xs text-cyan-400 font-bold font-mono">EVENT #${ev.number} SCENARIO EDITOR</span>
                            <h3 class="text-xl font-black text-white">${ev.name}</h3>
                        </div>
                        <button onclick="window.appController.closeScenarioModal()" class="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
                    </div>

                    <p class="text-xs text-slate-300 mb-4">
                        Adjust swimmer seed times or toggle disqualifications to run instant "What-If" tactical simulations.
                    </p>

                    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        ${this.predictor.clubs.map(c => {
                            const entry = this.predictor.getClubEntry(ev.number, c.name, true);
                            return `
                                <div class="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                                    <div class="flex items-center gap-2">
                                        <span class="w-3 h-3 rounded-full" style="background-color: ${c.color}"></span>
                                        <span class="font-bold text-white">${c.name} (Lane ${c.lane})</span>
                                        ${entry.isImputed ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Median Imputed</span>' : ''}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="override-time-${ev.number}-${c.id}" value="${entry.timeStr}" 
                                            class="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-center text-xs focus:border-cyan-400 outline-none" />
                                        <label class="flex items-center gap-1 text-slate-400 cursor-pointer">
                                            <input type="checkbox" id="override-dq-${ev.number}-${c.id}" ${entry.isDisqualified ? 'checked' : ''} class="rounded bg-slate-800 text-rose-500" />
                                            <span>DQ</span>
                                        </label>
                                        <button onclick="window.appController.saveClubOverride(${ev.number}, '${c.name}', '${c.id}')" 
                                            class="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition">
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                        <button onclick="window.appController.closeScenarioModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
                            Done
                        </button>
                    </div>
                </div>
            `;

            this.dom.scenarioModalContent.innerHTML = html;
            this.dom.scenarioModal.classList.remove('hidden');
        }

        saveClubOverride(eventNumber, clubName, clubId) {
            const timeInp = document.getElementById(`override-time-${eventNumber}-${clubId}`);
            const dqInp = document.getElementById(`override-dq-${eventNumber}-${clubId}`);
            if (!timeInp) return;

            const timeStr = timeInp.value.trim();
            const isDisqualified = dqInp ? dqInp.checked : false;

            this.predictor.setEntryOverride(eventNumber, clubName, {
                timeStr,
                isDisqualified
            });

            this.renderAll();
        }

        closeScenarioModal() {
            if (this.dom.scenarioModal) this.dom.scenarioModal.classList.add('hidden');
        }

        openDataModal() {
            if (this.dom.dataModal) this.dom.dataModal.classList.remove('hidden');
        }

        closeDataModal() {
            if (this.dom.dataModal) this.dom.dataModal.classList.add('hidden');
        }

        loadFullBaselineData() {
            this.predictor.clearOverrides();
            this.predictor.loadSeedData(Round1Data.SEED_DATA_FULL);
            this.renderAll();
            this.showNotification('Loaded authentic Round 1 Lineup baseline for all 8 clubs.');
            this.closeDataModal();
        }

        loadMillfieldData() {
            this.predictor.clearOverrides();
            this.predictor.loadSeedData(Round1Data.RAW_MILLFIELD_OCR_TEXT);
            this.renderAll();
            this.showNotification('Loaded Millfield Gala 1 scrape with automatic Median Imputation for missing clubs.');
            this.closeDataModal();
        }

        importCustomData() {
            if (!this.dom.dataInputText) return;
            const text = this.dom.dataInputText.value.trim();
            if (!text) return;

            try {
                this.predictor.clearOverrides();
                this.predictor.loadSeedData(text);
                this.renderAll();
                this.showNotification('Successfully parsed and imported custom round data!');
                this.closeDataModal();
            } catch (err) {
                if (this.dom.dataImportStatus) {
                    this.dom.dataImportStatus.textContent = `Error: ${err.message}`;
                }
            }
        }

        openRoundBuilder() {
            if (window.roundDrawBuilder) {
                window.roundDrawBuilder.open();
            }
        }

        applyGalaDraw(activeGala) {
            if (!activeGala || !activeGala.competingClubs) return;

            this.predictor.clubs = activeGala.competingClubs.map(c => ({
                id: c.id,
                name: c.name,
                lane: c.lane,
                shortCode: c.shortCode,
                color: c.color,
                isHome: c.isHome || c.name === 'Weston S Mare'
            }));

            // Sync entries from storage / seedData
            if (this.storage) {
                activeGala.competingClubs.forEach(club => {
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
            }

            this.predictor.recalculateMedianBaselines();
            this.state.lastMonteCarloResults = null;

            // Re-select H2H default clubs if they were changed
            if (activeGala.competingClubs.length >= 2) {
                this.state.selectedClubA = 'Weston S Mare';
                const rival = activeGala.competingClubs.find(c => c.name !== 'Weston S Mare');
                this.state.selectedClubB = rival ? rival.name : activeGala.competingClubs[0].name;
            }

            // Clear and repopulate dropdowns
            if (this.dom.h2hClubASelect) this.dom.h2hClubASelect.innerHTML = '';
            if (this.dom.h2hClubBSelect) this.dom.h2hClubBSelect.innerHTML = '';

            this.populateSelectDropdowns();
            this.renderAll();
            this.showNotification(`Active draw updated: ${activeGala.name} (${activeGala.competingClubs.length} Clubs)`);
        }

        showNotification(msg) {
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-cyan-600 text-white font-semibold text-xs shadow-xl transition-opacity duration-300';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    return ScorePredictionViewController;
}));
