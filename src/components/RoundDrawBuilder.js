/**
 * RoundDrawBuilder.js
 * Interactive Club Round Draw Builder & Fixture Manager for Arena Race Manager
 * 
 * Enables coaches and managers to:
 * - 1-Click select official NASL Gala Draws (e.g. 2026 Round 2 Plymouth with Weston as host).
 * - Interactively build custom 8-lane round draws for Round 3 or finals.
 * - Paste or drag-and-drop draw sheets/announcements to auto-extract lane allocations.
 * - Synchronize active competing clubs with both Predictive Scoring Engine and Tactical Lineup Optimizer.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../modules/storageManager', '../timeUtils'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const StorageManager = require('../modules/storageManager');
        const TimeUtils = require('../timeUtils');
        module.exports = factory(StorageManager, TimeUtils);
    } else {
        const g = root || globalThis || window || self || {};
        g.RoundDrawBuilder = factory(g.StorageManager, g.TimeUtils);
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (StorageManager, TimeUtils) {
    'use strict';

    /**
     * Standard official draw presets from official National Arena Swimming League PDF releases
     */
    const OFFICIAL_DRAW_PRESETS = [
        {
            id: '2026_R2_Plymouth',
            title: '2026 Round 2 – Div 1 Gala 1 (Plymouth 1pm)',
            subtitle: 'Weston S Mare (HOST) • 14th November 2026 • Licence: 3SW262354',
            badge: 'Target Round 2',
            badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/20',
            lanes: [
                { lane: 1, club: 'Caradon' },
                { lane: 2, club: 'Brixham' },
                { lane: 3, club: 'Truro City' },
                { lane: 4, club: 'Swindon ASC' },
                { lane: 5, club: 'North Cornwall Dragons' },
                { lane: 6, club: 'Bradford on Avon' },
                { lane: 7, club: 'Bridgwater' },
                { lane: 8, club: 'Weston S Mare' }
            ]
        },
        {
            id: '2026_R2_Newport',
            title: '2026 Round 2 – Div 1 Gala 2 (Newport 1pm)',
            subtitle: 'Cirencester (HOST) • 14th November 2026 • Licence: 3SW262357',
            badge: 'Division 1 Newport',
            badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/20',
            lanes: [
                { lane: 1, club: 'Chippenham' },
                { lane: 2, club: 'Backwell' },
                { lane: 3, club: 'Cirencester' },
                { lane: 4, club: 'City of Bristol B' },
                { lane: 5, club: 'Plymouth Leander' },
                { lane: 6, club: 'Paignton' },
                { lane: 7, club: 'Southwold' },
                { lane: 8, club: 'Wells' }
            ]
        },
        {
            id: '2026_R1_Millfield',
            title: '2026 Round 1 – Div 1 Gala 1 (Millfield 12pm)',
            subtitle: 'Historical Gala 1 • Millfield School',
            badge: 'Round 1 Reference',
            badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/20',
            lanes: [
                { lane: 1, club: 'Caradon' },
                { lane: 2, club: 'Brixham' },
                { lane: 3, club: 'Truro City' },
                { lane: 4, club: 'North Cornwall Dragons' },
                { lane: 5, club: 'Bridgwater' },
                { lane: 6, club: 'Paignton' },
                { lane: 7, club: 'Wells' },
                { lane: 8, club: 'Plymouth Leander' }
            ]
        },
        {
            id: '2026_R1_HuttonMoor',
            title: '2026 Round 1 – Div 1 Gala 2 (Hutton Moor 5pm)',
            subtitle: 'Historical Gala 2 • Hutton Moor, Weston-super-Mare',
            badge: 'Round 1 Reference',
            badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20',
            lanes: [
                { lane: 1, club: 'Swindon ASC' },
                { lane: 2, club: 'City of Bristol B' },
                { lane: 3, club: 'Backwell' },
                { lane: 4, club: 'Chippenham' },
                { lane: 5, club: 'Southwold' },
                { lane: 6, club: 'Cirencester' },
                { lane: 7, club: 'Bradford on Avon' },
                { lane: 8, club: 'Weston S Mare' }
            ]
        }
    ];

    class RoundDrawBuilder {
        /**
         * @param {StorageManager} storage
         * @param {Function} [onDrawAppliedCallback]
         */
        constructor(storage, onDrawAppliedCallback = null) {
            this.storage = storage || new StorageManager();
            this.onDrawAppliedCallback = onDrawAppliedCallback;
            this.modalElement = null;
            this.activeTab = 'presets'; // 'presets' | 'builder' | 'paste'
            this.customLanes = [
                'Caradon', 'Brixham', 'Truro City', 'Swindon ASC',
                'North Cornwall Dragons', 'Bradford on Avon', 'Bridgwater', 'Weston S Mare'
            ];
            this.customGalaId = '2026_R3_Custom';
            this.customGalaTitle = '2026 Round 3 – Division 1 Draw';
        }

        mount() {
            if (this.modalElement) return;

            const modalWrapper = document.createElement('div');
            modalWrapper.id = 'round-draw-builder-root';
            modalWrapper.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 hidden';
            modalWrapper.innerHTML = `
                <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
                    
                    <!-- Header -->
                    <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                        <div class="flex items-center space-x-3">
                            <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-amber-500/20">
                                📋
                            </span>
                            <div>
                                <h3 class="font-extrabold text-white text-base">Club Round Draw Builder</h3>
                                <p class="text-xs text-slate-400">Configure competing clubs & lane draw for Round 2, Round 3, or custom galas</p>
                            </div>
                        </div>
                        <button id="rdb-close-modal-btn" class="text-slate-400 hover:text-white text-2xl font-bold leading-none px-2">&times;</button>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="bg-slate-950/90 px-6 pt-3 border-b border-slate-800 flex items-center space-x-6 text-xs">
                        <button id="rdb-tab-presets-btn" class="pb-2.5 font-bold border-b-2 border-cyan-400 text-cyan-400 flex items-center space-x-1.5 transition">
                            <span>🏆 Official Draw Presets</span>
                        </button>
                        <button id="rdb-tab-builder-btn" class="pb-2.5 font-semibold border-b-2 border-transparent text-slate-400 hover:text-white flex items-center space-x-1.5 transition">
                            <span>🛠️ 8-Lane Custom Builder (Round 3)</span>
                        </button>
                        <button id="rdb-tab-paste-btn" class="pb-2.5 font-semibold border-b-2 border-transparent text-slate-400 hover:text-white flex items-center space-x-1.5 transition">
                            <span>📄 Paste / Import Draw</span>
                        </button>
                    </div>

                    <!-- Body Content -->
                    <div id="rdb-modal-body" class="p-4 sm:p-5 overflow-y-auto flex-grow text-xs space-y-4">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- Footer -->
                    <div class="p-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
                        <div id="rdb-active-info" class="text-xs text-slate-400 flex items-center space-x-2">
                            <span>Active Draw:</span>
                            <span id="rdb-active-gala-badge" class="font-bold text-cyan-300 font-mono">--</span>
                        </div>
                        <button id="rdb-close-btn" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition">
                            Close
                        </button>
                    </div>

                </div>
            `;

            document.body.appendChild(modalWrapper);
            this.modalElement = modalWrapper;
            this.bindEvents();
        }

        bindEvents() {
            const closeBtn = document.getElementById('rdb-close-modal-btn');
            const footerClose = document.getElementById('rdb-close-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());
            if (footerClose) footerClose.addEventListener('click', () => this.close());

            const tabPresets = document.getElementById('rdb-tab-presets-btn');
            const tabBuilder = document.getElementById('rdb-tab-builder-btn');
            const tabPaste = document.getElementById('rdb-tab-paste-btn');

            if (tabPresets) tabPresets.addEventListener('click', () => this.switchTab('presets'));
            if (tabBuilder) tabBuilder.addEventListener('click', () => this.switchTab('builder'));
            if (tabPaste) tabPaste.addEventListener('click', () => this.switchTab('paste'));
        }

        open() {
            this.mount();
            const activeGala = this.storage.getActiveGalaLineup();
            if (activeGala && activeGala.competingClubs) {
                this.customLanes = activeGala.competingClubs.map(c => c.name);
                this.customGalaTitle = activeGala.name || 'Current Lineup';
            }
            this.modalElement.classList.remove('hidden');
            this.render();
        }

        close() {
            if (this.modalElement) {
                this.modalElement.classList.add('hidden');
            }
        }

        switchTab(tab) {
            this.activeTab = tab;
            const tabPresets = document.getElementById('rdb-tab-presets-btn');
            const tabBuilder = document.getElementById('rdb-tab-builder-btn');
            const tabPaste = document.getElementById('rdb-tab-paste-btn');

            [tabPresets, tabBuilder, tabPaste].forEach(t => {
                if (t) {
                    t.className = 'pb-2.5 font-semibold border-b-2 border-transparent text-slate-400 hover:text-white flex items-center space-x-1.5 transition';
                }
            });

            if (tab === 'presets' && tabPresets) {
                tabPresets.className = 'pb-2.5 font-bold border-b-2 border-cyan-400 text-cyan-400 flex items-center space-x-1.5 transition';
            } else if (tab === 'builder' && tabBuilder) {
                tabBuilder.className = 'pb-2.5 font-bold border-b-2 border-cyan-400 text-cyan-400 flex items-center space-x-1.5 transition';
            } else if (tab === 'paste' && tabPaste) {
                tabPaste.className = 'pb-2.5 font-bold border-b-2 border-cyan-400 text-cyan-400 flex items-center space-x-1.5 transition';
            }

            this.render();
        }

        render() {
            if (typeof document === 'undefined') return;
            const body = document.getElementById('rdb-modal-body');
            const activeBadge = document.getElementById('rdb-active-gala-badge');
            if (!body) return;

            const activeGala = this.storage.getActiveGalaLineup();
            if (activeBadge) {
                activeBadge.textContent = activeGala ? activeGala.name : 'None';
            }

            if (this.activeTab === 'presets') {
                this.renderPresetsTab(body, activeGala);
            } else if (this.activeTab === 'builder') {
                this.renderBuilderTab(body);
            } else if (this.activeTab === 'paste') {
                this.renderPasteTab(body);
            }
        }

        renderPresetsTab(container, activeGala) {
            let html = `
                <div class="space-y-4">
                    <p class="text-xs text-slate-400">
                        Select an official gala round draw from the 2026 National Arena Swimming League programme. 
                        Activating a draw instantly re-simulates all 51 events with the exact 8 competing clubs and their lane allocations.
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            `;

            OFFICIAL_DRAW_PRESETS.forEach(preset => {
                const isActive = activeGala && (activeGala.galaId === preset.id || activeGala.name === preset.title);

                html += `
                    <div class="bg-slate-950 p-4 rounded-xl border ${isActive ? 'border-cyan-400/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10' : 'border-slate-800'} space-y-3 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${preset.badgeColor}">
                                    ${preset.badge}
                                </span>
                                ${isActive ? '<span class="text-[11px] font-extrabold text-cyan-400">✓ ACTIVE DRAW</span>' : ''}
                            </div>
                            <h4 class="font-bold text-white text-sm">${preset.title}</h4>
                            <p class="text-[11px] text-slate-400">${preset.subtitle}</p>

                            <!-- Lane Grid Preview -->
                            <div class="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                                ${preset.lanes.map(l => `
                                    <div class="flex items-center space-x-1.5 ${l.club.includes('Weston') ? 'font-bold text-cyan-300' : 'text-slate-300'}">
                                        <span class="w-4 text-[10px] font-mono text-slate-500">L${l.lane}:</span>
                                        <span class="truncate">${l.club}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <button onclick="window.roundDrawBuilder.activatePreset('${preset.id}')" 
                                class="w-full mt-2 py-2 rounded-lg ${isActive ? 'bg-slate-800 text-slate-400 cursor-default' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20'} font-bold text-xs transition">
                            ${isActive ? 'Currently Active' : '⚡ Activate This Draw & Run Simulation'}
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        renderBuilderTab(container) {
            const masterClubs = this.storage.getMasterClubs();

            let html = `
                <div class="space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div class="space-y-1 flex-1 min-w-[240px]">
                            <label class="font-bold text-slate-200 block text-xs">Round / Gala Fixture Title:</label>
                            <input id="rdb-builder-title" type="text" value="${this.customGalaTitle}" 
                                   class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium outline-none focus:border-cyan-400 text-xs" />
                        </div>
                        <div class="flex items-center space-x-2 self-end">
                            <button onclick="window.roundDrawBuilder.setWestonHost()" class="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition">
                                📌 Weston Host (Lane 8)
                            </button>
                            <button onclick="window.roundDrawBuilder.resetToDivision1()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    <!-- 8 Lane Pickers -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            `;

            for (let lane = 1; lane <= 8; lane++) {
                const currentClub = this.customLanes[lane - 1] || masterClubs[(lane - 1) % masterClubs.length].name;
                const isWeston = currentClub.includes('Weston');

                html += `
                    <div class="bg-slate-950 p-2.5 rounded-xl border ${isWeston ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800'} flex items-center space-x-2.5">
                        <div class="w-12 text-center font-mono font-bold text-xs ${isWeston ? 'text-cyan-400' : 'text-slate-400'}">
                            Lane ${lane}
                        </div>
                        <select id="rdb-lane-${lane}" onchange="window.roundDrawBuilder.updateCustomLane(${lane}, this.value)"
                                class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400 font-semibold">
                            ${masterClubs.map(c => `
                                <option value="${c.name}" ${c.name === currentClub ? 'selected' : ''}>
                                    ${c.name} ${c.shortCode ? `(${c.shortCode})` : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
            }

            html += `
                    </div>

                    <!-- Action Bar -->
                    <div class="pt-2 flex justify-end">
                        <button onclick="window.roundDrawBuilder.commitCustomLineup()" 
                                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2">
                            <span>✓ Save &amp; Run Simulation with These 8 Clubs</span>
                        </button>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        renderPasteTab(container) {
            container.innerHTML = `
                <div class="space-y-4">
                    <p class="text-xs text-slate-400">
                        When Round 3 draw is announced, paste the draw text or drop the draw notice below. 
                        The parser recognizes lines like <code class="text-amber-300">Lane 1: Caradon</code>, <code class="text-amber-300">1 Truro City</code>, or lane tables.
                    </p>

                    <div class="space-y-2">
                        <textarea id="rdb-paste-input" rows="8" 
                                  placeholder="Example:&#10;Round 3 Draw - Division 1 Finals&#10;Lane 1 Caradon&#10;Lane 2 Brixham&#10;Lane 3 Truro City&#10;Lane 4 Swindon ASC&#10;Lane 5 North Cornwall Dragons&#10;Lane 6 Bradford on Avon&#10;Lane 7 Bridgwater&#10;Lane 8 Weston S Mare HOST"
                                  class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none leading-relaxed"></textarea>

                        <button onclick="window.roundDrawBuilder.parsePastedDraw()" 
                                class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center space-x-1.5">
                            <span>⚡ Extract Lanes &amp; Populate Custom Builder</span>
                        </button>
                    </div>
                </div>
            `;
        }

        activatePreset(presetId) {
            const preset = OFFICIAL_DRAW_PRESETS.find(p => p.id === presetId);
            if (!preset) return;

            const clubNames = preset.lanes.map(l => l.club);

            this.storage.createOrUpdateGalaLineup({
                galaId: preset.id,
                name: preset.title,
                competingClubs: clubNames
            });
            this.storage.setActiveGalaId(preset.id);

            this.customLanes = [...clubNames];
            this.customGalaTitle = preset.title;

            this.triggerApplied();
            this.render();
        }

        updateCustomLane(laneNumber, clubName) {
            this.customLanes[laneNumber - 1] = clubName;
        }

        setWestonHost() {
            this.customLanes[7] = 'Weston S Mare';
            this.render();
        }

        resetToDivision1() {
            this.customLanes = [
                'Caradon', 'Brixham', 'Truro City', 'Swindon ASC',
                'North Cornwall Dragons', 'Bradford on Avon', 'Bridgwater', 'Weston S Mare'
            ];
            this.render();
        }

        commitCustomLineup() {
            const titleInput = typeof document !== 'undefined' ? document.getElementById('rdb-builder-title') : null;
            const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : (this.customGalaTitle || 'Custom Round Draw');
            const galaId = 'custom_' + Date.now();

            this.storage.createOrUpdateGalaLineup({
                galaId: galaId,
                name: title,
                competingClubs: this.customLanes
            });
            this.storage.setActiveGalaId(galaId);

            this.triggerApplied();
            if (typeof alert !== 'undefined') {
                alert(`✓ Active simulation updated to: "${title}" with 8 competing clubs!`);
            }
            this.close();
        }

        parsePastedDraw() {
            const textInput = document.getElementById('rdb-paste-input');
            const text = textInput ? textInput.value : '';
            if (!text.trim()) {
                alert('Please paste draw text first.');
                return;
            }

            const masterClubs = this.storage.getMasterClubs();
            const extracted = [];
            const lines = text.split(/\r?\n/);

            lines.forEach(line => {
                const laneMatch = line.match(/\b(?:Lane|L)\s*([1-8])\b/i) || line.match(/^([1-8])\b/);
                let matchedClub = null;

                for (const mc of masterClubs) {
                    const regex = new RegExp(`\\b${mc.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
                    if (regex.test(line)) {
                        matchedClub = mc.name;
                        break;
                    }
                }

                if (matchedClub) {
                    if (laneMatch) {
                        const lNum = parseInt(laneMatch[1], 10);
                        extracted[lNum - 1] = matchedClub;
                    } else if (extracted.length < 8) {
                        extracted.push(matchedClub);
                    }
                }
            });

            if (extracted.filter(Boolean).length >= 4) {
                // Populate custom lanes
                for (let i = 0; i < 8; i++) {
                    if (extracted[i]) this.customLanes[i] = extracted[i];
                }
                this.customGalaTitle = 'Imported Round Draw';
                this.switchTab('builder');
                alert(`✓ Successfully identified clubs for the lanes! Review and click Save.`);
            } else {
                alert('Could not identify at least 4 clubs in the pasted text. Ensure club names match standard names.');
            }
        }

        triggerApplied() {
            const activeGala = this.storage.getActiveGalaLineup();
            if (typeof this.onDrawAppliedCallback === 'function') {
                this.onDrawAppliedCallback(activeGala);
            }

            // Also trigger standard window event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('arena-draw-changed', {
                    detail: { activeGala }
                }));
            }
        }
    }

    return RoundDrawBuilder;
}));
