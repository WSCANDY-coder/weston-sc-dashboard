/**
 * ImportPreviewModal.js
 * Interactive "Raw Paste & Diff" Audit Modal for Arena Race Manager
 * 
 * Features:
 * - Two-step ingestion workflow:
 *   Step 1: Raw text paste area with fixture and round label configuration.
 *   Step 2: Color-coded audit & clean preview table prior to database commit:
 *     - Green: Confident parse
 *     - Amber: Auto-corrected OCR with editable field for manual override
 *     - Red: Flagged DQ / 0:00.00 / unresolvable
 * - Summary stats bar (Total Swims, Confident, Warnings, DQs).
 * - Inline manual editing of times and names directly in the audit table.
 * - Single-click "Commit to Master Timebase" button merging validated entries into timesDB.
 * - Single-click "Export JSON Backup" (arena_times_backup.json).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../modules/dataSanitizer', '../modules/galaImporter', '../modules/storageManager'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const DataSanitizer = require('../modules/dataSanitizer');
        const GalaImporter = require('../modules/galaImporter');
        const StorageManager = require('../modules/storageManager');
        module.exports = factory(DataSanitizer, GalaImporter, StorageManager);
    } else {
        const g = root || globalThis || window || self || {};
        g.ImportPreviewModal = factory(g.DataSanitizer, g.GalaImporter, g.StorageManager);
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (DataSanitizer, GalaImporter, StorageManager) {
    'use strict';

    class ImportPreviewModal {
        /**
         * @param {StorageManager} storage - Persistent StorageManager instance
         * @param {Function} [onCommitCallback] - Callback invoked after successful database commit
         */
        constructor(storage, onCommitCallback = null) {
            this.storage = storage;
            this.onCommitCallback = onCommitCallback;

            this.modalElement = null;
            this.currentStep = 1; // 1: Paste, 2: Preview Audit
            this.parsedRoundData = null;
            this.auditFilter = 'ALL'; // 'ALL' | 'WARNINGS' | 'DQ'
        }

        /**
         * Initializes and mounts the modal in DOM
         */
        mount() {
            if (this.modalElement) return;

            const modalWrapper = document.createElement('div');
            modalWrapper.id = 'import-preview-modal-root';
            modalWrapper.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 hidden';
            modalWrapper.innerHTML = `
                <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
                    
                    <!-- Header -->
                    <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                        <div class="flex items-center space-x-3">
                            <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-md shadow-cyan-500/20">
                                📥
                            </span>
                            <div>
                                <h3 class="font-extrabold text-white text-base">Gala Results Sanitizer & Audit Pipeline</h3>
                                <p class="text-xs text-slate-400">Two-step ingestion: Paste Raw OCR &bull; Audit & Correct &bull; Commit to Master Timebase</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button id="ipm-export-backup-btn" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition" title="Save full database JSON backup">
                                <span>💾 arena_times_backup.json</span>
                            </button>
                            <button id="ipm-close-modal-btn" class="text-slate-400 hover:text-white text-2xl font-bold leading-none px-2">&times;</button>
                        </div>
                    </div>

                    <!-- Step Tracker -->
                    <div class="bg-slate-950/90 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div class="flex items-center space-x-6">
                            <div id="ipm-step-1-indicator" class="flex items-center space-x-2 font-bold text-cyan-400">
                                <span class="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[11px]">1</span>
                                <span>Paste Raw OCR / Sheet</span>
                            </div>
                            <span class="text-slate-600">&rarr;</span>
                            <div id="ipm-step-2-indicator" class="flex items-center space-x-2 font-semibold text-slate-500">
                                <span class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">2</span>
                                <span>Audit & Color-Coded Clean Preview</span>
                            </div>
                        </div>
                        <span id="ipm-step-badge" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">Step 1 of 2</span>
                    </div>

                    <!-- Modal Body (Dynamic Step Content) -->
                    <div id="ipm-modal-body" class="p-4 sm:p-5 overflow-y-auto flex-grow text-xs space-y-4">
                        <!-- Rendered by renderStepContent() -->
                    </div>

                    <!-- Modal Footer -->
                    <div id="ipm-modal-footer" class="p-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
                        <!-- Rendered by renderFooter() -->
                    </div>

                </div>
            `;

            document.body.appendChild(modalWrapper);
            this.modalElement = modalWrapper;
            this.bindCoreEvents();
        }

        bindCoreEvents() {
            const closeBtn = document.getElementById('ipm-close-modal-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.close());

            const exportBtn = document.getElementById('ipm-export-backup-btn');
            if (exportBtn) exportBtn.addEventListener('click', () => this.downloadBackupJSON());
        }

        open(step = 1) {
            this.mount();
            this.currentStep = step;
            this.modalElement.classList.remove('hidden');
            this.render();
        }

        close() {
            if (this.modalElement) {
                this.modalElement.classList.add('hidden');
            }
        }

        render() {
            this.updateStepIndicators();
            this.renderStepContent();
            this.renderFooter();
        }

        updateStepIndicators() {
            const ind1 = document.getElementById('ipm-step-1-indicator');
            const ind2 = document.getElementById('ipm-step-2-indicator');
            const badge = document.getElementById('ipm-step-badge');

            if (this.currentStep === 1) {
                if (ind1) ind1.className = 'flex items-center space-x-2 font-bold text-cyan-400';
                if (ind2) ind2.className = 'flex items-center space-x-2 font-semibold text-slate-500';
                if (badge) badge.textContent = 'Step 1 of 2: Ingestion';
            } else {
                if (ind1) ind1.className = 'flex items-center space-x-2 font-semibold text-slate-400';
                if (ind2) ind2.className = 'flex items-center space-x-2 font-bold text-purple-400';
                if (badge) badge.textContent = 'Step 2 of 2: Audit & Validation';
            }
        }

        renderStepContent() {
            const body = document.getElementById('ipm-modal-body');
            if (!body) return;

            if (this.currentStep === 1) {
                // STEP 1: Paste Input Area
                body.innerHTML = `
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="font-bold text-slate-200 block">Round / Fixture Stage:</label>
                                <select id="ipm-round-select" class="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-400">
                                    <option value="Round 1" selected>Round 1 Results</option>
                                    <option value="Round 2">Round 2 Results</option>
                                    <option value="Round 3">Round 3 Results / Finals</option>
                                    <option value="Time Trial">Time Trial / Mock Gala</option>
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="font-bold text-slate-200 block">Fixture / Sheet Title:</label>
                                <input id="ipm-fixture-title" type="text" value="Division 1 Gala 1 - Millfield (12 noon)" 
                                       class="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-400 font-medium" />
                            </div>
                        </div>

                        <!-- Drag & Drop File Zone -->
                        <div class="border-2 border-dashed border-slate-700 hover:border-cyan-400/80 rounded-xl p-3 bg-slate-950/40 text-center cursor-pointer transition flex items-center justify-between space-x-3" 
                             onclick="document.getElementById('ipm-file-upload-input').click()"
                             ondragover="event.preventDefault(); this.classList.add('border-cyan-400');"
                             ondragleave="this.classList.remove('border-cyan-400');"
                             ondrop="event.preventDefault(); this.classList.remove('border-cyan-400'); window.importPreviewModal.handleDropFile(event);">
                            <input type="file" id="ipm-file-upload-input" accept=".pdf,.txt,.json" class="hidden" onchange="window.importPreviewModal.handleFileInput(event)" />
                            <div class="flex items-center space-x-3">
                                <span class="text-2xl">📁</span>
                                <div class="text-left">
                                    <div class="font-bold text-xs text-white">Click to Upload or Drag &amp; Drop Gala Results File</div>
                                    <div class="text-[11px] text-slate-400">Accepts <strong class="text-cyan-300">.PDF</strong> (extracts race sheets), <strong class="text-amber-300">.TXT</strong>, or <strong class="text-purple-300">.JSON</strong></div>
                                </div>
                            </div>
                            <span id="ipm-file-status" class="text-xs font-semibold text-cyan-400"></span>
                        </div>

                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <label class="font-bold text-slate-200">Paste Raw Sheet Text or OCR Copy:</label>
                                <div class="flex items-center space-x-2">
                                    <button onclick="window.importPreviewModal.loadGala2HuttonMoor()" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center space-x-1">
                                        <span>📄 Load Division-1-Gala-2-Hutton-Moor-5pm.pdf</span>
                                    </button>
                                    <button onclick="window.importPreviewModal.loadSampleOcr()" class="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline">
                                        ⚡ Sample Gala 1 (Millfield)
                                    </button>
                                </div>
                            </div>
                            <textarea id="ipm-raw-text-area" rows="10" 
                                      placeholder="Paste lines directly from PDF results or OCR text...&#10;&#10;Example:&#10;Event 1 Women Open 200m Ind Medley&#10;1 Truro City S. Bennett :104.72 8&#10;2 Caradon J. Tremayne 240.14: 7&#10;3 Brixham E. Jones 0:00.00&#10;4 Weston S Mare Harriet PageDove- 2:24.10 5" 
                                      class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none leading-relaxed"></textarea>
                        </div>

                        <!-- Sanitization Rules Summary Box -->
                        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-400">
                            <span class="font-bold text-cyan-300 block text-xs">Automated Sanitization Pipeline Active:</span>
                            <ul class="list-disc list-inside space-y-0.5 text-[11px]">
                                <li>Repairs misplaced colons and digit swaps (<code class="text-amber-300">240.14:</code> &rarr; <code class="text-emerald-300">2:40.14</code>, <code class="text-amber-300">:104.72</code> &rarr; <code class="text-emerald-300">1:04.72</code>, <code class="text-amber-300">:16.471</code> &rarr; <code class="text-emerald-300">1:16.47</code>).</li>
                                <li>Strips trailing rank digits (<code class="text-amber-300">2:25.28 2</code> &rarr; <code class="text-emerald-300">2:25.28</code>).</li>
                                <li>Fixes hyphenation & stray numbers (<code class="text-amber-300">Harriet PageDove-</code> &rarr; <code class="text-emerald-300">Harriet Page-Dove</code>, <code class="text-amber-300">Isia Edwards 9</code> &rarr; <code class="text-emerald-300">Isia Edwards</code>).</li>
                                <li>Disambiguates club names (<code class="text-amber-300">N Comwall</code> &rarr; <code class="text-emerald-300">North Cornwall Dragons</code>, <code class="text-amber-300">Weston S Mare</code> &rarr; <code class="text-emerald-300">Weston SC</code>).</li>
                                <li>Aggregates relay events (<code class="text-purple-300">Events 3-10, 43-51</code>) into composite squad entries.</li>
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                // STEP 2: Color-Coded Audit & Clean Preview Table
                const p = this.parsedRoundData;
                if (!p) return;

                const stats = p.stats;

                // Filter entries
                let displayedEvents = p.events;

                body.innerHTML = `
                    <div class="space-y-4">
                        
                        <!-- Top Audit Summary Badges -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                                <span class="text-[10px] text-slate-400 block font-semibold uppercase">Total Extracted Swims</span>
                                <span class="text-xl font-black font-mono text-white">${stats.totalSwims}</span>
                            </div>
                            <div class="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30 text-center">
                                <span class="text-[10px] text-emerald-400 block font-semibold uppercase">Confident Parses</span>
                                <span class="text-xl font-black font-mono text-emerald-300">${stats.confidentCount}</span>
                            </div>
                            <div class="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-center">
                                <span class="text-[10px] text-amber-400 block font-semibold uppercase">Auto-Corrected OCR</span>
                                <span class="text-xl font-black font-mono text-amber-300">${stats.warningCount}</span>
                            </div>
                            <div class="bg-slate-950 p-2.5 rounded-xl border border-rose-500/30 text-center">
                                <span class="text-[10px] text-rose-400 block font-semibold uppercase">DQ / Non-Scoring</span>
                                <span class="text-xl font-black font-mono text-rose-300">${stats.dqCount}</span>
                            </div>
                        </div>

                        <!-- Filter Controls -->
                        <div class="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
                            <div class="flex items-center space-x-2">
                                <span class="text-slate-400 font-semibold">Audit Filter:</span>
                                <button onclick="window.importPreviewModal.setAuditFilter('ALL')" class="px-2.5 py-1 rounded text-xs font-semibold ${this.auditFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'}">All Swims (${stats.totalSwims})</button>
                                <button onclick="window.importPreviewModal.setAuditFilter('WARNINGS')" class="px-2.5 py-1 rounded text-xs font-semibold ${this.auditFilter === 'WARNINGS' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-400'}">⚠️ Auto-Corrected (${stats.warningCount})</button>
                                <button onclick="window.importPreviewModal.setAuditFilter('DQ')" class="px-2.5 py-1 rounded text-xs font-semibold ${this.auditFilter === 'DQ' ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40' : 'bg-slate-800 text-slate-400'}">🚫 DQs (${stats.dqCount})</button>
                            </div>
                            <span class="text-[11px] text-slate-400 italic">Review fields below. Values are inline-editable before committing.</span>
                        </div>

                        <!-- Data Audit Table -->
                        <div class="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 max-h-[50vh]">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead class="bg-slate-900 text-slate-400 uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-800">
                                    <tr>
                                        <th class="py-2.5 px-3 w-16 text-center">Status</th>
                                        <th class="py-2.5 px-3 w-16 text-center">Event</th>
                                        <th class="py-2.5 px-3">Standardized Club</th>
                                        <th class="py-2.5 px-3">Swimmer / Squad Name</th>
                                        <th class="py-2.5 px-3 text-right">Raw Text</th>
                                        <th class="py-2.5 px-3 text-right">Cleaned Time</th>
                                        <th class="py-2.5 px-3 text-center w-14">DQ</th>
                                        <th class="py-2.5 px-3">Audit Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderAuditRows(displayedEvents)}
                                </tbody>
                            </table>
                        </div>

                    </div>
                `;
            }
        }

        renderAuditRows(events) {
            let html = '';
            events.forEach(ev => {
                ev.entries.forEach(entry => {
                    if (this.auditFilter === 'WARNINGS' && entry.status !== 'amber') return;
                    if (this.auditFilter === 'DQ' && entry.status !== 'red') return;

                    const statusBadge = entry.status === 'green'
                        ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✓ Confident</span>'
                        : (entry.status === 'amber'
                            ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚠️ Corrected</span>'
                            : '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">🚫 DQ / 0:00</span>');

                    const rowBg = entry.status === 'amber'
                        ? 'bg-amber-950/15 hover:bg-amber-950/25'
                        : (entry.status === 'red' ? 'bg-rose-950/15 hover:bg-rose-950/25' : 'hover:bg-slate-900/60');

                    html += `
                        <tr class="border-b border-slate-800/60 ${rowBg} transition-colors">
                            <td class="py-2 px-3 text-center">${statusBadge}</td>
                            <td class="py-2 px-3 text-center font-mono font-bold text-slate-300">#${ev.eventNumber}</td>
                            <td class="py-2 px-3 font-semibold text-slate-200">${entry.club}</td>
                            <td class="py-2 px-3">
                                <input type="text" value="${entry.swimmer}" 
                                       onchange="window.importPreviewModal.updateEntryField('${entry.id}', 'swimmer', this.value)"
                                       class="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs w-full focus:border-cyan-400 outline-none" />
                            </td>
                            <td class="py-2 px-3 text-right font-mono text-slate-400 text-[11px]">${entry.rawTime || '—'}</td>
                            <td class="py-2 px-3 text-right">
                                <input type="text" value="${entry.timeStr}" 
                                       onchange="window.importPreviewModal.updateEntryTime('${entry.id}', this.value)"
                                       class="w-24 px-2 py-1 rounded bg-slate-900 border ${entry.status === 'amber' ? 'border-amber-500/60 font-bold text-amber-300' : 'border-slate-700 text-cyan-300'} text-xs font-mono text-center focus:border-cyan-400 outline-none" />
                            </td>
                            <td class="py-2 px-3 text-center">
                                <input type="checkbox" ${entry.isDQ ? 'checked' : ''} 
                                       onchange="window.importPreviewModal.updateEntryField('${entry.id}', 'isDQ', this.checked)"
                                       class="rounded bg-slate-800 text-rose-500 cursor-pointer" />
                            </td>
                            <td class="py-2 px-3 text-[11px] text-slate-400 truncate max-w-xs" title="${entry.note || ''}">
                                ${entry.note || '—'}
                            </td>
                        </tr>
                    `;
                });
            });

            if (!html) {
                html = `
                    <tr>
                        <td colspan="8" class="p-6 text-center text-slate-400">
                            No records match the current filter.
                        </td>
                    </tr>
                `;
            }

            return html;
        }

        renderFooter() {
            const footer = document.getElementById('ipm-modal-footer');
            if (!footer) return;

            if (this.currentStep === 1) {
                footer.innerHTML = `
                    <button onclick="window.importPreviewModal.close()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition">
                        Cancel
                    </button>
                    <button onclick="window.importPreviewModal.processRawPaste()" class="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-1.5">
                        <span>Inspect & Audit Sheet &rarr;</span>
                    </button>
                `;
            } else {
                footer.innerHTML = `
                    <button onclick="window.importPreviewModal.open(1)" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition">
                        &larr; Back to Paste Area
                    </button>
                    <div class="flex items-center space-x-2">
                        <button onclick="window.importPreviewModal.close()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition">
                            Cancel
                        </button>
                        <button onclick="window.importPreviewModal.commitToMaster()" class="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5">
                            <span>✓ Commit to Master Timebase</span>
                        </button>
                    </div>
                `;
            }
        }

        processRawPaste() {
            const area = document.getElementById('ipm-raw-text-area');
            const roundSel = document.getElementById('ipm-round-select');
            const titleInput = document.getElementById('ipm-fixture-title');

            const rawText = area ? area.value.trim() : '';
            if (!rawText) {
                alert('Please paste sheet text or click "Load Sample Messy OCR Sheet" to test.');
                return;
            }

            const roundLabel = roundSel ? roundSel.value : 'Round 1';
            const galaTitle = titleInput ? titleInput.value : 'Arena Gala';

            const parsed = GalaImporter.parseSheet(rawText, {
                roundLabel,
                galaTitle
            });

            if (!parsed.success || parsed.stats.totalSwims === 0) {
                alert('Parsing warning: Could not identify club results. Ensure lines contain club names (e.g. Caradon, Truro, Weston, Brixham) and times.');
                return;
            }

            this.parsedRoundData = parsed;
            this.currentStep = 2;
            this.render();
        }

        setAuditFilter(filter) {
            this.auditFilter = filter;
            this.render();
        }

        updateEntryField(entryId, field, value) {
            if (!this.parsedRoundData) return;
            for (const ev of this.parsedRoundData.events) {
                const entry = ev.entries.find(e => e.id === entryId);
                if (entry) {
                    entry[field] = value;
                    break;
                }
            }
        }

        updateEntryTime(entryId, newTimeStr) {
            if (!this.parsedRoundData) return;
            const cleaned = DataSanitizer.cleanTime(newTimeStr);
            for (const ev of this.parsedRoundData.events) {
                const entry = ev.entries.find(e => e.id === entryId);
                if (entry) {
                    entry.timeStr = cleaned.formatted;
                    entry.timeMs = cleaned.timeMs;
                    entry.isDQ = cleaned.isDQ;
                    entry.status = cleaned.status;
                    entry.note = `Manual override: ${cleaned.note}`;
                    break;
                }
            }
            this.render();
        }

        commitToMaster() {
            if (!this.parsedRoundData || !this.storage) return;

            const res = GalaImporter.commitToDatabase(this.parsedRoundData, this.storage);
            if (res.success) {
                alert(`✓ Successfully committed ${res.insertedSwims} swims to Master Timebase registry!`);
                this.close();
                if (typeof this.onCommitCallback === 'function') {
                    this.onCommitCallback(res);
                }
            }
        }

        downloadBackupJSON() {
            if (!this.storage) return;
            const jsonStr = this.storage.exportDatabaseJSON();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'arena_times_backup.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        loadGala2HuttonMoor() {
            const area = document.getElementById('ipm-raw-text-area');
            const roundSelect = document.getElementById('ipm-round-select');
            const fixtureInput = document.getElementById('ipm-fixture-title');

            if (roundSelect) roundSelect.value = 'Round 1';
            if (fixtureInput) fixtureInput.value = 'Division 1 Gala 2 - Hutton Moor (5pm)';

            if (typeof window !== 'undefined' && window.ROUND_1_DATA && window.ROUND_1_DATA.RAW_HUTTON_MOOR_OCR_TEXT) {
                if (area) area.value = window.ROUND_1_DATA.RAW_HUTTON_MOOR_OCR_TEXT;
            } else if (typeof require !== 'undefined') {
                try {
                    const r1 = require('../round1Data');
                    if (area && r1.RAW_HUTTON_MOOR_OCR_TEXT) area.value = r1.RAW_HUTTON_MOOR_OCR_TEXT;
                } catch (e) {}
            }
        }

        loadSampleOcr() {
            const area = document.getElementById('ipm-raw-text-area');
            if (area) {
                area.value = `NATIONAL ARENA SWIMMING LEAGUE - WESTERN DIVISION
Round 1 - Gala 1 Results (Division 1)

Event 1 Women Open 200m Ind Medley
1 Truro City S. Bennett :104.72 8
2 Caradon J. Tremayne 240.14: 7
3 Brixham E. Jones 0:00.00
4 N Comwall C. Davies 2:31.20 5
5 Bridgwater L. Smith 2:33.50 4
6 Weston S Mare Harriet PageDove- 2:24.10 6

Event 10 Men Open 100m Backstroke
1 Weston-super-Mare Austin Hodder 1:00.10 8
2 Truro City T. Adams :16.471 7
3 Plymouth Lea R. Clark 1:02.10 6
4 Swindon ASC Isia Edwards 9 10.311: 5
5 Bradford on Avon K. Phillips 1:08.20 27
6 Caradon M. Cole 2:25.28 2

Event 43 Girls 9-11 4x50m Freestyle Relay
1 Weston S Mare Relay 2:13.90 8
2 Truro City 4x50 Free 2:12.40 7
3 Caradon 2:15.80 6
4 Brixham 2:20.10 5
`;
            }
        }

        handleFileInput(event) {
            const file = event.target.files && event.target.files[0];
            if (file) this.processUploadedFile(file);
        }

        handleDropFile(event) {
            const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (file) this.processUploadedFile(file);
        }

        async processUploadedFile(file) {
            if (!file) return;
            const statusEl = document.getElementById('ipm-file-status');
            const fixtureInput = document.getElementById('ipm-fixture-title');
            const rawArea = document.getElementById('ipm-raw-text-area');

            if (statusEl) statusEl.textContent = `Reading ${file.name}...`;

            // Auto-populate fixture title from filename
            const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
            if (fixtureInput && (!fixtureInput.value || fixtureInput.value.includes('Millfield'))) {
                fixtureInput.value = cleanTitle;
            }

            const ext = file.name.split('.').pop().toLowerCase();

            try {
                if (ext === 'pdf') {
                    if (statusEl) statusEl.textContent = `Extracting PDF text...`;
                    if (typeof pdfjsLib === 'undefined') {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                            script.onload = resolve;
                            script.onerror = () => reject(new Error('PDF engine unavailable.'));
                            document.head.appendChild(script);
                        });
                    }
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = '';
                    for (let p = 1; p <= pdf.numPages; p++) {
                        if (statusEl) statusEl.textContent = `Extracting page ${p}/${pdf.numPages}...`;
                        const page = await pdf.getPage(p);
                        const content = await page.getTextContent();
                        let lastY, pageStr = '';
                        for (let item of content.items) {
                            if (lastY === undefined || Math.abs(lastY - item.transform[5]) < 5) {
                                pageStr += ' ' + item.str;
                            } else {
                                pageStr += '\n' + item.str;
                            }
                            lastY = item.transform[5];
                        }
                        fullText += `\n# --- Page ${p} ---\n` + pageStr;
                    }
                    if (rawArea) rawArea.value = fullText.trim();
                    if (statusEl) statusEl.textContent = `✓ Extracted ${pdf.numPages} pages! Launching audit preview...`;
                    setTimeout(() => {
                        this.parseInputText();
                    }, 350);
                } else if (ext === 'json') {
                    const text = await file.text();
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed.timesDB) {
                            if (confirm(`Detected full database backup with ${Object.keys(parsed.timesDB).length} clubs. Restore directly into local timebase?`)) {
                                this.storage.importDatabaseJSON(text);
                                alert("✓ Successfully restored master times database!");
                                this.close();
                                if (this.onCommitCallback) this.onCommitCallback({ success: true });
                                return;
                            }
                        }
                    } catch (e) {}
                    if (rawArea) rawArea.value = text;
                    if (statusEl) statusEl.textContent = `✓ Loaded JSON file`;
                    setTimeout(() => this.parseInputText(), 350);
                } else {
                    const text = await file.text();
                    if (rawArea) rawArea.value = text;
                    if (statusEl) statusEl.textContent = `✓ Loaded text file. Launching audit preview...`;
                    setTimeout(() => this.parseInputText(), 350);
                }
            } catch (err) {
                console.error(err);
                if (statusEl) statusEl.textContent = `⚠️ ${err.message}`;
                alert(`Could not extract file automatically: ${err.message}\n\nYou can always open the PDF, copy all text (Ctrl+A, Ctrl+C), and paste directly into the box.`);
            }
        }
    }

    return ImportPreviewModal;
}));
