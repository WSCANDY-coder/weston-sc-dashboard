/**
 * lineupOptimizer.js
 * Tactical Lineup Optimizer & Opportunity Finder for Arena Race Manager
 * 
 * Capabilities:
 * - Opportunity Finder: Scans gala events to identify High-Risk Points (< 0.35s lead in 1st/2nd)
 *   and Easy Pickups (trailing by < 0.50s in 3rd-5th).
 * - Interactive Swimmer Swapper: Real-time recalculation of projected gala points and standings upon roster swaps.
 * - Relay Auto-Composer & Split Estimator: Automatically finds the fastest 4-swimmer composition with flying takeovers (-0.60s).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../timeUtils', '../predictionEngine', './storageManager'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const TimeUtils = require('../timeUtils');
        const RacePredictor = require('../predictionEngine');
        const StorageManager = require('./storageManager');
        module.exports = factory(TimeUtils, RacePredictor, StorageManager);
    } else {
        const g = root || globalThis || window || self || {};
        g.LineupOptimizer = factory(g.TimeUtils, g.RacePredictor, g.StorageManager);
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (TimeUtils, RacePredictor, StorageManager) {
    'use strict';

    const CANNON_STRATEGIES = Object.freeze({
        TRADITIONAL: 'TRADITIONAL',
        REVERSE_FRONTLOAD: 'REVERSE_FRONTLOAD',
        PURE_SPEED_DESC: 'PURE_SPEED_DESC',
        SANDWICH_BUFFER: 'SANDWICH_BUFFER',
        HUNTER_ANCHOR: 'HUNTER_ANCHOR'
    });

    class LineupOptimizer {
        static get CANNON_STRATEGIES() {
            return CANNON_STRATEGIES;
        }

        get CANNON_STRATEGIES() {
            return CANNON_STRATEGIES;
        }
        /**
         * @param {StorageManager} storageManager
         * @param {RacePredictor} predictor
         */
        constructor(storageManager, predictor) {
            this.storage = storageManager;
            this.predictor = predictor;
            this.targetClubId = 'weston';
            this.targetClubName = 'Weston S Mare';
        }

        /**
         * Sets target focus club (defaults to Weston S Mare)
         */
        setTargetClub(clubId, clubName) {
            this.targetClubId = StorageManager.getClubId(clubId);
            this.targetClubName = clubName || 'Weston S Mare';
        }

        /**
         * Scans the current lineup and returns the "Opportunity Finder" analysis
         * 
         * Classifications:
         * 1. High-Risk Points: Seeded 1st or 2nd, but lead over the trailing swimmer is < 0.35s (350 ms).
         * 2. Easy Pickups: Seeded 3rd to 5th, but trailing the next higher place by < 0.50s (500 ms).
         * 3. Comfortable Leads: Seeded 1st by >= 0.75s.
         * 4. Swing Battles: Clustered within 0.30s of multiple competitors.
         * 
         * @param {Object} [deterministicRun] - Optional pre-computed deterministic projection
         * @returns {Object} Opportunity Finder metrics
         */
        findTacticalOpportunities(deterministicRun = null) {
            const det = deterministicRun || this.predictor.runDeterministicProjection();
            const targetName = this.targetClubName;

            const highRisk = [];
            const easyPickups = [];
            const comfortableLeads = [];
            const allTargetEvents = [];

            det.eventProjections.forEach(ep => {
                const ev = ep.event;
                const field = ep.field;

                // Find target club's position in this event
                const targetIdx = field.findIndex(f => TimeUtils.normalizeClubName(f.club.name) === targetName);
                if (targetIdx === -1) return;

                const targetEntry = field[targetIdx];
                if (targetEntry.isDisqualified || targetEntry.timeMs <= 0) return;

                const myRank = targetEntry.rank;
                const myTime = targetEntry.timeMs;
                const myPoints = targetEntry.points;

                // Check gap to the swimmer immediately behind
                let leadOverNextMs = null;
                let chaserEntry = null;
                if (targetIdx + 1 < field.length && !field[targetIdx + 1].isDisqualified && field[targetIdx + 1].timeMs > 0) {
                    leadOverNextMs = field[targetIdx + 1].timeMs - myTime;
                    chaserEntry = field[targetIdx + 1];
                }

                // Check gap to the swimmer immediately ahead
                let trailBehindPrevMs = null;
                let targetAboveEntry = null;
                if (targetIdx - 1 >= 0 && !field[targetIdx - 1].isDisqualified && field[targetIdx - 1].timeMs > 0) {
                    trailBehindPrevMs = myTime - field[targetIdx - 1].timeMs;
                    targetAboveEntry = field[targetIdx - 1];
                }

                const eventSummary = {
                    eventNumber: ev.number,
                    eventName: ev.name,
                    isRelay: ev.isRelay,
                    myRank,
                    myPoints,
                    myTimeStr: targetEntry.timeStr,
                    myTimeMs: myTime,
                    swimmerName: targetEntry.swimmerName,
                    leadOverNextMs,
                    trailBehindPrevMs,
                    chaser: chaserEntry ? { club: chaserEntry.club.name, timeStr: chaserEntry.timeStr, gapStr: (leadOverNextMs / 1000).toFixed(2) + 's' } : null,
                    leaderAhead: targetAboveEntry ? { club: targetAboveEntry.club.name, timeStr: targetAboveEntry.timeStr, gapStr: (trailBehindPrevMs / 1000).toFixed(2) + 's' } : null
                };

                allTargetEvents.push(eventSummary);

                // 1. High-Risk Points Check: Seeded 1st or 2nd, but lead over next is < 0.35s (350 ms)
                if ((myRank === 1 || myRank === 2) && leadOverNextMs !== null && leadOverNextMs <= 350) {
                    highRisk.push({
                        ...eventSummary,
                        riskDeltaMs: leadOverNextMs,
                        riskDeltaStr: (leadOverNextMs / 1000).toFixed(2) + 's',
                        chaserClub: chaserEntry.club.name,
                        vulnerablePoints: myRank === 1 ? 1 : 1 // Drop 1 position = 1 pt swing
                    });
                }

                // 2. Easy Pickups Check: Seeded 3rd to 7th, but trailing next position by < 0.50s (500 ms)
                if ((myRank >= 3 && myRank <= 7) && trailBehindPrevMs !== null && trailBehindPrevMs <= 500) {
                    easyPickups.push({
                        ...eventSummary,
                        pickupDeltaMs: trailBehindPrevMs,
                        pickupDeltaStr: (trailBehindPrevMs / 1000).toFixed(2) + 's',
                        targetClubAhead: targetAboveEntry.club.name,
                        gainPoints: 1
                    });
                }

                // 3. Comfortable Leads: Seeded 1st by >= 0.75s
                if (myRank === 1 && leadOverNextMs !== null && leadOverNextMs >= 750) {
                    comfortableLeads.push(eventSummary);
                }
            });

            // Sort by urgency / tightest margin
            highRisk.sort((a, b) => a.riskDeltaMs - b.riskDeltaMs);
            easyPickups.sort((a, b) => a.pickupDeltaMs - b.pickupDeltaMs);

            return {
                targetClub: targetName,
                totalEvents: allTargetEvents.length,
                highRiskCount: highRisk.length,
                easyPickupsCount: easyPickups.length,
                comfortableLeadsCount: comfortableLeads.length,
                highRisk,
                easyPickups,
                comfortableLeads,
                allTargetEvents
            };
        }

        /**
         * Simulates swapping a swimmer or entering a new time in real time,
         * calculating gala points delta, position changes, and overall gala standing impact.
         * 
         * @param {number} eventNumber
         * @param {Object} newEntry - { swimmer, timeStr, timeMs, isDQ }
         * @param {string} [clubName] - Club to apply swap to (defaults to target club)
         * @returns {Object} Real-time swap impact analysis
         */
        evaluateTacticalSwap(eventNumber, newEntry, clubName = null) {
            const targetName = clubName || this.targetClubName;
            const targetId = StorageManager.getClubId(targetName);

            // 1. Current baseline without this swap
            const baselineDet = this.predictor.runDeterministicProjection();
            const baseRanked = baselineDet.rankedClubs;
            const baseTarget = baseRanked.find(r => TimeUtils.normalizeClubName(r.club.name) === targetName);
            const baseEventProj = baselineDet.eventProjections.find(p => p.event.number === eventNumber);
            const baseFieldEntry = baseEventProj ? baseEventProj.field.find(f => TimeUtils.normalizeClubName(f.club.name) === targetName) : null;

            const baseEventRank = baseFieldEntry ? baseFieldEntry.rank : 8;
            const baseEventPoints = baseFieldEntry ? baseFieldEntry.points : 1;
            const baseTotalPoints = baseTarget ? baseTarget.totalPoints : 0;
            const baseOverallRank = baseTarget ? baseTarget.projectedRank : 8;

            // 2. Temporarily set override in predictor
            this.predictor.setEntryOverride(eventNumber, targetName, newEntry);

            // Also persist in storage active lineup
            if (this.storage) {
                this.storage.setLineupOverride(eventNumber, targetId, newEntry);
            }

            // 3. Re-run deterministic projection with swap active
            const updatedDet = this.predictor.runDeterministicProjection();
            const updatedRanked = updatedDet.rankedClubs;
            const updatedTarget = updatedRanked.find(r => TimeUtils.normalizeClubName(r.club.name) === targetName);
            const updatedEventProj = updatedDet.eventProjections.find(p => p.event.number === eventNumber);
            const updatedFieldEntry = updatedEventProj ? updatedEventProj.field.find(f => TimeUtils.normalizeClubName(f.club.name) === targetName) : null;

            const newEventRank = updatedFieldEntry ? updatedFieldEntry.rank : 8;
            const newEventPoints = updatedFieldEntry ? updatedFieldEntry.points : 1;
            const newTotalPoints = updatedTarget ? updatedTarget.totalPoints : 0;
            const newOverallRank = updatedTarget ? updatedTarget.projectedRank : 8;

            return {
                eventNumber,
                clubName: targetName,
                swimmer: newEntry.swimmer,
                timeStr: newEntry.timeStr,
                timeMs: newEntry.timeMs,
                isDQ: !!newEntry.isDQ,

                // Event Level Deltas
                eventRankBefore: baseEventRank,
                eventRankAfter: newEventRank,
                eventRankDelta: baseEventRank - newEventRank, // positive = gained positions
                eventPointsBefore: baseEventPoints,
                eventPointsAfter: newEventPoints,
                eventPointsDelta: newEventPoints - baseEventPoints, // positive = gained points

                // Gala Leaderboard Deltas
                galaTotalPointsBefore: baseTotalPoints,
                galaTotalPointsAfter: newTotalPoints,
                galaTotalPointsDelta: newTotalPoints - baseTotalPoints,
                galaOverallRankBefore: baseOverallRank,
                galaOverallRankAfter: newOverallRank,
                galaOverallRankDelta: baseOverallRank - newOverallRank,

                updatedRankedClubs: updatedRanked
            };
        }

        /**
         * Checks whether an event represents the 8x50m Mixed Cannon Relay (Event 50 or 51)
         * 
         * @param {number} eventNumber
         * @param {Object} [ev]
         * @returns {boolean}
         */
        isCannonRelay(eventNumber, ev = null) {
            if (!ev && eventNumber) {
                ev = this.predictor.events.find(e => e.number === eventNumber);
            }
            if (eventNumber === 50 || eventNumber === 51) {
                if (ev) {
                    if (ev.legs === 8 || ev.gender === 'Mixed') return true;
                    const name = (ev.name || '').toLowerCase();
                    const stroke = (ev.stroke || '').toLowerCase();
                    if (name.includes('cannon') || name.includes('squadron') || stroke.includes('cannon')) return true;
                }
                return true;
            }
            if (ev) {
                if (ev.legs === 8) return true;
                const name = (ev.name || '').toLowerCase();
                const stroke = (ev.stroke || '').toLowerCase();
                if (name.includes('cannon') || name.includes('squadron') || stroke.includes('cannon')) return true;
            }
            return false;
        }

        /**
         * Returns official leg specifications for a relay event.
         * For Event 50 / 51 (8 x 50m Mixed Cannon Relay):
         * Supports configurable cannonStrategy modes:
         *   - TRADITIONAL: Strict ascending age order (9/11 -> 13/u -> 15/u -> Open)
         *   - REVERSE_FRONTLOAD: Strict descending age order (Open -> 15/u -> 13/u -> 9/11)
         *   - PURE_SPEED_DESC: Fastest 50m PB to slowest 50m PB across all 8 swimmers
         *   - SANDWICH_BUFFER: Fastest Open (Leg 1), 9/11 & 13/u (Legs 2-5), 15/u (Legs 6-7), second Open (Leg 8 anchor)
         *   - HUNTER_ANCHOR: 15/u -> 13/u -> 9/11 -> Open (Legs 7 & 8 anchor)
         * 
         * For 4x50m Medley Relays:
         *   Leg 1: Backstroke (50m)
         *   Leg 2: Breaststroke (50m)
         *   Leg 3: Butterfly (50m)
         *   Leg 4: Freestyle (50m)
         * 
         * For 4x50m Freestyle Relays:
         *   Legs 1-4: Freestyle (50m)
         * 
         * @param {number} eventNumber
         * @param {string} [cannonStrategy='TRADITIONAL']
         * @returns {Array<Object>}
         */
        getRelayLegDefinitions(eventNumber, cannonStrategy = 'TRADITIONAL') {
            const ev = this.predictor.events.find(e => e.number === eventNumber);
            const isCannon = this.isCannonRelay(eventNumber, ev);

            // 8 x 50m Mixed Cannon Relay
            if (isCannon) {
                const strat = cannonStrategy || CANNON_STRATEGIES.TRADITIONAL;
                switch (strat) {
                    case CANNON_STRATEGIES.REVERSE_FRONTLOAD:
                        return [
                            { legNumber: 1, label: 'Leg 1 • Open (50m Free)', age: 'Open', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Lead-off Open (Fastest Open)' },
                            { legNumber: 2, label: 'Leg 2 • Open (50m Free)', age: 'Open', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 2 Open (Slower Open)' },
                            { legNumber: 3, label: 'Leg 3 • 15/u (50m Free)', age: '14-15', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 3 15/u (Fastest 15/u)' },
                            { legNumber: 4, label: 'Leg 4 • 15/u (50m Free)', age: '14-15', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 4 15/u (Slower 15/u)' },
                            { legNumber: 5, label: 'Leg 5 • 13/u (50m Free)', age: '12-13', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 5 13/u (Fastest 13/u)' },
                            { legNumber: 6, label: 'Leg 6 • 13/u (50m Free)', age: '12-13', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 6 13/u (Slower 13/u)' },
                            { legNumber: 7, label: 'Leg 7 • 9/11 (50m Free)', age: '9-11', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 7 9/11 (Fastest 9/11)' },
                            { legNumber: 8, label: 'Leg 8 • 9/11 (50m Free)', age: '9-11', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 8 Anchor 9/11 (Slower 9/11)' }
                        ];

                    case CANNON_STRATEGIES.PURE_SPEED_DESC:
                        return [
                            { legNumber: 1, label: 'Leg 1 • Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 1 • Ranked 1st by 50m Free PB' },
                            { legNumber: 2, label: 'Leg 2 • 2nd Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 2 • Ranked 2nd by 50m Free PB' },
                            { legNumber: 3, label: 'Leg 3 • 3rd Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 3 • Ranked 3rd by 50m Free PB' },
                            { legNumber: 4, label: 'Leg 4 • 4th Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 4 • Ranked 4th by 50m Free PB' },
                            { legNumber: 5, label: 'Leg 5 • 5th Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 5 • Ranked 5th by 50m Free PB' },
                            { legNumber: 6, label: 'Leg 6 • 6th Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 6 • Ranked 6th by 50m Free PB' },
                            { legNumber: 7, label: 'Leg 7 • 7th Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 7 • Ranked 7th by 50m Free PB' },
                            { legNumber: 8, label: 'Leg 8 • 8th Fastest 50m Free PB', age: 'Open', gender: 'Mixed', stroke: 'Freestyle', distance: 50, role: 'Leg 8 • Ranked 8th by 50m Free PB' }
                        ];

                    case CANNON_STRATEGIES.SANDWICH_BUFFER:
                        return [
                            { legNumber: 1, label: 'Leg 1 • Men 16+/Open (50m Free)', age: '16+', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 1 Lead-off Buffer (Fastest Open)' },
                            { legNumber: 2, label: 'Leg 2 • Girls 9-11 (50m Free)', age: '9-11', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 2 (9/11 Girls)' },
                            { legNumber: 3, label: 'Leg 3 • Boys 9-11 (50m Free)', age: '9-11', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 3 (9/11 Boys)' },
                            { legNumber: 4, label: 'Leg 4 • Girls 12-13 (50m Free)', age: '12-13', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 4 (13/u Girls)' },
                            { legNumber: 5, label: 'Leg 5 • Boys 12-13 (50m Free)', age: '12-13', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 5 (13/u Boys)' },
                            { legNumber: 6, label: 'Leg 6 • Girls 14-15 (50m Free)', age: '14-15', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 6 (15/u Girls)' },
                            { legNumber: 7, label: 'Leg 7 • Boys 14-15 (50m Free)', age: '14-15', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 7 (15/u Boys)' },
                            { legNumber: 8, label: 'Leg 8 • Women 16+/Open (50m Free)', age: '16+', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 8 Anchor (Second Open)' }
                        ];

                    case CANNON_STRATEGIES.HUNTER_ANCHOR:
                        return [
                            { legNumber: 1, label: 'Leg 1 • Girls 14-15 (50m Free)', age: '14-15', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 1 (15/u Girls)' },
                            { legNumber: 2, label: 'Leg 2 • Boys 14-15 (50m Free)', age: '14-15', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 2 (15/u Boys)' },
                            { legNumber: 3, label: 'Leg 3 • Girls 12-13 (50m Free)', age: '12-13', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 3 (13/u Girls)' },
                            { legNumber: 4, label: 'Leg 4 • Boys 12-13 (50m Free)', age: '12-13', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 4 (13/u Boys)' },
                            { legNumber: 5, label: 'Leg 5 • Girls 9-11 (50m Free)', age: '9-11', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 5 (9/11 Girls)' },
                            { legNumber: 6, label: 'Leg 6 • Boys 9-11 (50m Free)', age: '9-11', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 6 (9/11 Boys)' },
                            { legNumber: 7, label: 'Leg 7 • Women 16+/Open (50m Free)', age: '16+', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 7 Pre-Anchor (Open Slower)' },
                            { legNumber: 8, label: 'Leg 8 • Men 16+/Open (50m Free)', age: '16+', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 8 Hunter Anchor (Fastest Open)' }
                        ];

                    case CANNON_STRATEGIES.TRADITIONAL:
                    default:
                        return [
                            { legNumber: 1, label: 'Leg 1 • Girls 9-11 (50m Free)', age: '9-11', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 1 (9/11 Girls)' },
                            { legNumber: 2, label: 'Leg 2 • Boys 9-11 (50m Free)', age: '9-11', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 2 (9/11 Boys)' },
                            { legNumber: 3, label: 'Leg 3 • Girls 12-13 (50m Free)', age: '12-13', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 3 (13/u Girls)' },
                            { legNumber: 4, label: 'Leg 4 • Boys 12-13 (50m Free)', age: '12-13', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 4 (13/u Boys)' },
                            { legNumber: 5, label: 'Leg 5 • Girls 14-15 (50m Free)', age: '14-15', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 5 (15/u Girls)' },
                            { legNumber: 6, label: 'Leg 6 • Boys 14-15 (50m Free)', age: '14-15', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 6 (15/u Boys)' },
                            { legNumber: 7, label: 'Leg 7 • Women 16+/Open (50m Free)', age: '16+', gender: 'Female', stroke: 'Freestyle', distance: 50, role: 'Leg 7 (Open Girls)' },
                            { legNumber: 8, label: 'Leg 8 • Men 16+/Open (50m Free)', age: '16+', gender: 'Male', stroke: 'Freestyle', distance: 50, role: 'Leg 8 Anchor (Open Boys)' }
                        ];
                }
            }

            if (!ev || !ev.isRelay) return [];

            // 4 x 50m Medley Relay
            const isMedley = ev.stroke === 'individualmedley' || (ev.name && ev.name.toLowerCase().includes('medley'));
            if (isMedley) {
                const gLabel = ev.gender === 'Female' ? 'Girls' : 'Boys';
                return [
                    { legNumber: 1, label: `Leg 1 • ${gLabel} ${ev.age} (50m Back)`, age: ev.age, gender: ev.gender, stroke: 'Backstroke', distance: 50 },
                    { legNumber: 2, label: `Leg 2 • ${gLabel} ${ev.age} (50m Breast)`, age: ev.age, gender: ev.gender, stroke: 'Breaststroke', distance: 50 },
                    { legNumber: 3, label: `Leg 3 • ${gLabel} ${ev.age} (50m Fly)`, age: ev.age, gender: ev.gender, stroke: 'Butterfly', distance: 50 },
                    { legNumber: 4, label: `Leg 4 • ${gLabel} ${ev.age} (50m Free)`, age: ev.age, gender: ev.gender, stroke: 'Freestyle', distance: 50 }
                ];
            }

            // 4 x 50m Freestyle Relay
            const gLabel = ev.gender === 'Female' ? 'Girls' : 'Boys';
            return [
                { legNumber: 1, label: `Leg 1 • ${gLabel} ${ev.age} (50m Free)`, age: ev.age, gender: ev.gender, stroke: 'Freestyle', distance: 50 },
                { legNumber: 2, label: `Leg 2 • ${gLabel} ${ev.age} (50m Free)`, age: ev.age, gender: ev.gender, stroke: 'Freestyle', distance: 50 },
                { legNumber: 3, label: `Leg 3 • ${gLabel} ${ev.age} (50m Free)`, age: ev.age, gender: ev.gender, stroke: 'Freestyle', distance: 50 },
                { legNumber: 4, label: `Leg 4 • ${gLabel} ${ev.age} (50m Free)`, age: ev.age, gender: ev.gender, stroke: 'Freestyle', distance: 50 }
            ];
        }

        /**
         * Normalizes swimmer name for matching across gala records, relays, and timesDB
         * @private
         */
        _normalizeSwimmerName(name) {
            if (!name || typeof name !== 'string') return '';
            return name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        /**
         * Determines if two swimmer name strings refer to the same individual
         * Supports exact matching, initial matching (e.g. "A. Hodder" vs "Austin Hodder"),
         * and inverted names (e.g. "Hodder, Austin").
         * Excludes generic benchmark/squad strings.
         * @private
         */
        _isSameSwimmer(nameA, nameB) {
            if (!nameA || !nameB) return false;
            const normA = this._normalizeSwimmerName(nameA);
            const normB = this._normalizeSwimmerName(nameB);
            if (!normA || !normB) return false;

            // Disallow generic placeholder tokens
            const genericTerms = ['squad swimmer', 'selected swimmer', 'standard benchmark', 'squad', 'benchmark', 'tba'];
            if (genericTerms.some(t => normA.includes(t) || normB.includes(t))) return false;

            if (normA === normB) return true;

            const partsA = normA.split(' ');
            const partsB = normB.split(' ');

            if (partsA.length >= 2 && partsB.length >= 2) {
                const lastA = partsA[partsA.length - 1];
                const lastB = partsB[partsB.length - 1];
                const firstA = partsA[0];
                const firstB = partsB[0];

                if (lastA === lastB) {
                    if (firstA === firstB) return true;
                    if (firstA[0] === firstB[0] && (firstA.length === 1 || firstB.length === 1)) return true;
                }
                // Inverted "Last First" match
                if (partsA[0] === partsB[partsB.length - 1] && partsA[partsA.length - 1] === partsB[0]) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Checks whether a swimmer is mentioned inside a relay team descriptor string
         * e.g. "Weston S Mare (A. Hodder, E. Mitchard, ...)"
         * @private
         */
        _isSwimmerInTeamDescriptor(descriptor, swimmerName) {
            if (!descriptor || !swimmerName) return false;
            const normD = this._normalizeSwimmerName(descriptor);
            const normS = this._normalizeSwimmerName(swimmerName);
            if (!normD || !normS) return false;

            const genericTerms = ['squad swimmer', 'selected swimmer', 'standard benchmark', 'tba'];
            if (genericTerms.some(t => normS.includes(t))) return false;

            if (normD.includes(normS)) return true;

            const parts = normS.split(' ');
            if (parts.length >= 2) {
                const lastName = parts[parts.length - 1];
                const initial = parts[0][0];
                if (normD.includes(`${initial} ${lastName}`) || normD.includes(`${initial}.${lastName}`)) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Queries a swimmer's total assigned workload across Events 1 to 49.
         * Scans individual events and relays from:
         * 1. Predictor overrides (including relayLegs)
         * 2. Active Gala overrides
         * 3. Predictor seedData
         * 4. timesDB event-tagged entries
         * 
         * Returns:
         * - raceCount: total races assigned in Events 1 to 49
         * - totalMeters: cumulative meters swum
         * - events: array of { eventNumber, eventName, isRelay, meters }
         * - hasBackToBack46_49: boolean indicating if swimmer swum consecutive events in 46–49
         * 
         * @param {string} swimmerName
         * @param {string} [clubName=null]
         * @returns {{ swimmerName: string, raceCount: number, totalMeters: number, events: Array<Object>, eventNumbers: Array<number>, hasBackToBack46_49: boolean }}
         */
        getSwimmerWorkload(swimmerName, clubName = null) {
            if (!swimmerName) {
                return { swimmerName: '', raceCount: 0, totalMeters: 0, events: [], eventNumbers: [], hasBackToBack46_49: false };
            }

            const cName = clubName || this.targetClubName;
            const cId = StorageManager.getClubId(cName);
            const canonicalClub = TimeUtils.normalizeClubName(cName);
            const gala = this.storage ? this.storage.getActiveGalaLineup() : null;

            const assignedEvents = new Map(); // evNum -> { eventNumber, eventName, isRelay, meters }

            // Scan Events 1 to 49
            for (let evNum = 1; evNum <= 49; evNum++) {
                let ev = this.predictor.events.find(e => e.number === evNum);
                if (!ev) {
                    ev = { number: evNum, distance: 50, isRelay: false, legs: 1 };
                }

                let isAssigned = false;

                // 1. Predictor overrides
                if (this.predictor && this.predictor.overrides && this.predictor.overrides[evNum] && this.predictor.overrides[evNum][canonicalClub]) {
                    const o = this.predictor.overrides[evNum][canonicalClub];
                    if (!o.isDisqualified) {
                        if (o.relayLegs && Array.isArray(o.relayLegs)) {
                            if (o.relayLegs.some(l => this._isSameSwimmer(l.swimmer || l.swimmerName, swimmerName))) {
                                isAssigned = true;
                            }
                        } else if (this._isSameSwimmer(o.swimmerName || o.swimmer, swimmerName) || this._isSwimmerInTeamDescriptor(o.swimmerName || o.swimmer, swimmerName)) {
                            isAssigned = true;
                        }
                    }
                }

                // 2. Storage active gala overrides
                if (!isAssigned && gala && gala.overrides && gala.overrides[evNum] && gala.overrides[evNum][cId]) {
                    const go = gala.overrides[evNum][cId];
                    if (!go.isDQ) {
                        if (go.relayLegs && Array.isArray(go.relayLegs)) {
                            if (go.relayLegs.some(l => this._isSameSwimmer(l.swimmer || l.swimmerName, swimmerName))) {
                                isAssigned = true;
                            }
                        } else if (this._isSameSwimmer(go.swimmer, swimmerName) || this._isSwimmerInTeamDescriptor(go.swimmer, swimmerName)) {
                            isAssigned = true;
                        }
                    }
                }

                // 3. Predictor seedData
                if (!isAssigned && this.predictor && this.predictor.seedData && this.predictor.seedData[evNum] && this.predictor.seedData[evNum][canonicalClub]) {
                    const s = this.predictor.seedData[evNum][canonicalClub];
                    if (!s.isDisqualified) {
                        if (s.relayLegs && Array.isArray(s.relayLegs)) {
                            if (s.relayLegs.some(l => this._isSameSwimmer(l.swimmer || l.swimmerName, swimmerName))) {
                                isAssigned = true;
                            }
                        } else if (this._isSameSwimmer(s.swimmerName, swimmerName) || this._isSwimmerInTeamDescriptor(s.swimmerName, swimmerName)) {
                            isAssigned = true;
                        }
                    }
                }

                // 4. Storage timesDB
                if (!isAssigned && this.storage && this.storage.timesDB && this.storage.timesDB[cId]) {
                    const clubDb = this.storage.timesDB[cId];
                    outerLoop: for (const ageKey of Object.keys(clubDb)) {
                        for (const genKey of Object.keys(clubDb[ageKey])) {
                            for (const sdKey of Object.keys(clubDb[ageKey][genKey])) {
                                const entries = clubDb[ageKey][genKey][sdKey];
                                for (const entry of entries) {
                                    if (entry.eventNumber === evNum && !entry.isDQ) {
                                        if (this._isSameSwimmer(entry.swimmer, swimmerName) || this._isSwimmerInTeamDescriptor(entry.swimmer, swimmerName)) {
                                            isAssigned = true;
                                            break outerLoop;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (isAssigned) {
                    const legCount = (ev.isRelay && ev.legs) ? ev.legs : (ev.isRelay ? 4 : 1);
                    const meters = ev.isRelay ? Math.round(ev.distance / legCount) : ev.distance;
                    assignedEvents.set(evNum, {
                        eventNumber: evNum,
                        eventName: ev.name || `Event ${evNum}`,
                        isRelay: !!ev.isRelay,
                        meters: meters
                    });
                }
            }

            const eventsList = Array.from(assignedEvents.values()).sort((a, b) => a.eventNumber - b.eventNumber);
            const eventNumbers = eventsList.map(e => e.eventNumber);
            const raceCount = eventsList.length;
            const totalMeters = eventsList.reduce((acc, e) => acc + (e.meters || 0), 0);

            // Back-to-back in Events 46-49 check:
            // Swimmer swum consecutive events in range 46 to 49 (e.g. 46&47, 47&48, 48&49)
            let hasBackToBack46_49 = false;
            for (let i = 0; i < eventNumbers.length - 1; i++) {
                const curr = eventNumbers[i];
                const next = eventNumbers[i + 1];
                if (curr >= 46 && next <= 49 && (next - curr === 1)) {
                    hasBackToBack46_49 = true;
                    break;
                }
            }

            return {
                swimmerName,
                raceCount,
                totalMeters,
                events: eventsList,
                eventNumbers,
                hasBackToBack46_49
            };
        }

        /**
         * Deprioritizes any swimmer who already swam back-to-back in Events 46–49
         * from Leg 1 or Leg 2 of the Cannon relay, unless no alternative exists.
         * 
         * Preference hierarchy:
         * 1. Replace with a fresher alternative candidate within the same age/gender slot.
         * 2. Swap leg positions with a later leg (Legs 3–8) if the strategy permits.
         * 3. Keep original if no alternative exists.
         * 
         * @private
         */
        _deprioritizeBackToBackFromEarlyLegs(orderedSwimmers, eligibleCandidatesBySlot, cannonStrategy) {
            const result = orderedSwimmers.slice();

            for (let legIdx = 0; legIdx <= 1; legIdx++) {
                const current = result[legIdx];
                if (!current || !current.hasBackToBack46_49) continue;

                let replaced = false;

                // 1. Look for alternative candidate in same slot without back-to-back
                if (current.candidates && current.candidates.length > 1) {
                    const fresherCandidate = current.candidates.find(c => !c.hasBackToBack46_49 && c.swimmer !== current.swimmer);
                    if (fresherCandidate) {
                        result[legIdx] = {
                            ...current,
                            swimmer: fresherCandidate.swimmer,
                            timeMs: fresherCandidate.timeMs,
                            timeStr: fresherCandidate.timeStr,
                            adjustedTimeMs: fresherCandidate.adjustedTimeMs,
                            adjustedTimeStr: fresherCandidate.adjustedTimeStr,
                            workload: fresherCandidate.workload,
                            raceCount: fresherCandidate.raceCount,
                            totalMeters: fresherCandidate.totalMeters,
                            fatiguePenaltyMs: fresherCandidate.fatiguePenaltyMs,
                            fatiguePenaltyStr: fresherCandidate.fatiguePenaltyStr,
                            isHighFatigueRisk: fresherCandidate.isHighFatigueRisk,
                            hasBackToBack46_49: fresherCandidate.hasBackToBack46_49
                        };
                        replaced = true;
                    }
                }

                // 2. If no alternative candidate in slot, check if strategy permits swapping with a later leg
                if (!replaced) {
                    if (cannonStrategy === CANNON_STRATEGIES.PURE_SPEED_DESC) {
                        for (let laterIdx = 2; laterIdx < result.length; laterIdx++) {
                            if (!result[laterIdx].hasBackToBack46_49) {
                                const temp = result[legIdx];
                                result[legIdx] = result[laterIdx];
                                result[laterIdx] = temp;
                                replaced = true;
                                break;
                            }
                        }
                    } else if (cannonStrategy === CANNON_STRATEGIES.SANDWICH_BUFFER && legIdx === 0) {
                        if (!result[7].hasBackToBack46_49) {
                            const temp = result[0];
                            result[0] = result[7];
                            result[7] = temp;
                            replaced = true;
                        }
                    } else if (cannonStrategy === CANNON_STRATEGIES.REVERSE_FRONTLOAD && legIdx === 0) {
                        if (!result[1].hasBackToBack46_49) {
                            const temp = result[0];
                            result[0] = result[1];
                            result[1] = temp;
                            replaced = true;
                        }
                    } else if (cannonStrategy === CANNON_STRATEGIES.HUNTER_ANCHOR && legIdx === 0) {
                        if (!result[1].hasBackToBack46_49) {
                            const temp = result[0];
                            result[0] = result[1];
                            result[1] = temp;
                            replaced = true;
                        }
                    } else if (cannonStrategy === CANNON_STRATEGIES.TRADITIONAL && legIdx === 0) {
                        if (!result[1].hasBackToBack46_49) {
                            const temp = result[0];
                            result[0] = result[1];
                            result[1] = temp;
                            replaced = true;
                        }
                    }
                }
            }

            return result;
        }

        /**
         * Fetches available candidate squad swimmers from timesDB for a specific leg definition.
         * Evaluates prior gala workload (Events 1 to 49) and calculates fatigue adjustments:
         * - Configurable fatiguePenaltyPerRace (default: +0.20s / 200ms for races above 3 events)
         * - 0.30s tiebreaker comparator: prioritizes swimmers with fewer prior races (fresher legs)
         * - Flags High Fatigue Risk on swimmers with excess races or back-to-back in 46–49.
         * 
         * @param {Object} legDef
         * @param {string} [clubId=null]
         * @param {Object} [options={}]
         * @returns {Array<Object>}
         */
        getCandidatesForRelayLeg(legDef, clubId = null, options = {}) {
            const targetId = clubId || this.targetClubId;
            const strokeDist = StorageManager.makeStrokeKey(legDef.stroke, legDef.distance);
            const rawCandidates = [];
            const seen = new Set();

            const fatiguePenaltyPerRaceMs = options.fatiguePenaltyPerRaceMs !== undefined
                ? options.fatiguePenaltyPerRaceMs
                : (options.fatiguePenaltyPerRace !== undefined ? Math.round(options.fatiguePenaltyPerRace * 1000) : 200);
            const fatigueRaceThreshold = options.fatigueRaceThreshold !== undefined ? options.fatigueRaceThreshold : 3;
            const fatigueTiebreakerMs = options.fatigueTiebreakerMs !== undefined ? options.fatigueTiebreakerMs : 300;

            const ageAliasMap = {
                '9-11': ['9-11', '10-11', '11/U', '9/11', '11/u'],
                '9/11': ['9-11', '10-11', '11/U', '9/11', '11/u'],
                '10-11': ['10-11', '9-11', '11/U', '9/11', '11/u'],
                '11/U': ['11/U', '9-11', '10-11', '9/11', '11/u'],
                '11/u': ['11/U', '9-11', '10-11', '9/11', '11/u'],
                '12-13': ['12-13', '13/U', '13/u', '13&U'],
                '13/U': ['13/U', '13/u', '12-13', '13&U'],
                '13/u': ['13/u', '13/U', '12-13', '13&U'],
                '14-15': ['14-15', '15/U', '15/u', '15&U'],
                '15/U': ['15/U', '15/u', '14-15', '15&U'],
                '15/u': ['15/u', '15/U', '14-15', '15&U'],
                '16+': ['16+', 'Open', 'open', '16/O', '16/Over'],
                'Open': ['Open', 'open', '16+', '16/O', '16/Over']
            };
            const ageCandidates = ageAliasMap[legDef.age] || [legDef.age];

            if (this.storage && this.storage.timesDB[targetId]) {
                for (const a of ageCandidates) {
                    const ageGroupObj = this.storage.timesDB[targetId][a];
                    if (ageGroupObj && ageGroupObj[legDef.gender] && ageGroupObj[legDef.gender][strokeDist]) {
                        ageGroupObj[legDef.gender][strokeDist].forEach(t => {
                            if (!t.isDQ && t.timeMs > 0 && !seen.has(t.swimmer)) {
                                seen.add(t.swimmer);
                                rawCandidates.push({
                                    swimmer: t.swimmer,
                                    timeMs: t.timeMs,
                                    timeStr: t.timeStr,
                                    round: t.round || 'Squad PB',
                                    date: t.date || ''
                                });
                            }
                        });
                    }
                }
            }

            // Fallback candidate if database has no entry
            if (rawCandidates.length === 0) {
                let defaultMs = 30000;
                const isFem = legDef.gender === 'Female';
                if (legDef.age === '9-11' || legDef.age === '9/11') defaultMs = isFem ? 38500 : 34500;
                else if (legDef.age === '12-13' || legDef.age === '13/U' || legDef.age === '13/u') defaultMs = isFem ? 33000 : 30500;
                else if (legDef.age === '14-15' || legDef.age === '15/U' || legDef.age === '15/u') defaultMs = isFem ? 31000 : 28500;
                else defaultMs = isFem ? 29000 : 26000;

                rawCandidates.push({
                    swimmer: `${isFem ? 'Girls' : 'Boys'} ${legDef.age} Squad Swimmer`,
                    timeMs: defaultMs,
                    timeStr: TimeUtils.formatMsToTime(defaultMs),
                    round: 'Standard Benchmark',
                    date: '2026-10-10'
                });
            }

            // Enrich each candidate with workload and fatigue penalties
            const candidates = rawCandidates.map(c => {
                const workload = this.getSwimmerWorkload(c.swimmer, targetId);
                const excessRaces = Math.max(0, workload.raceCount - fatigueRaceThreshold);
                const fatiguePenaltyMs = excessRaces * fatiguePenaltyPerRaceMs;
                const adjustedTimeMs = c.timeMs + fatiguePenaltyMs;
                const adjustedTimeStr = TimeUtils.formatMsToTime(adjustedTimeMs);
                const isHighFatigueRisk = (workload.raceCount >= 4 || workload.hasBackToBack46_49);

                return {
                    ...c,
                    workload,
                    raceCount: workload.raceCount,
                    totalMeters: workload.totalMeters,
                    fatiguePenaltyMs,
                    fatiguePenaltyStr: fatiguePenaltyMs > 0 ? `+${(fatiguePenaltyMs / 1000).toFixed(2)}s` : '0.00s',
                    adjustedTimeMs,
                    adjustedTimeStr,
                    isHighFatigueRisk,
                    hasBackToBack46_49: workload.hasBackToBack46_49
                };
            });

            // Requirement 3: Prioritize fresher legs if within 0.30s (fatigueTiebreakerMs)
            candidates.sort((a, b) => {
                const diff = Math.abs(a.adjustedTimeMs - b.adjustedTimeMs);
                if (diff <= fatigueTiebreakerMs) {
                    // 1. Back-to-back in 46-49 avoidance
                    if (a.hasBackToBack46_49 !== b.hasBackToBack46_49) {
                        return a.hasBackToBack46_49 ? 1 : -1;
                    }
                    // 2. Fewer prior races (fresher legs)
                    if (a.raceCount !== b.raceCount) {
                        return a.raceCount - b.raceCount;
                    }
                    // 3. Fewer total meters swum
                    if (a.totalMeters !== b.totalMeters) {
                        return a.totalMeters - b.totalMeters;
                    }
                    // 4. Equal workload: sort by adjusted time
                    return a.adjustedTimeMs - b.adjustedTimeMs;
                }
                // Outside tiebreaker window: sort strictly by adjusted time
                return a.adjustedTimeMs - b.adjustedTimeMs;
            });

            return candidates;
        }

        /**
         * Core Cannon Lineup Generator for Event 50 / 51 (8x50m Freestyle Cannon).
         * Strictly preserves the eligibility constraint:
         * Exactly 1 boy and 1 girl from each of the 4 age groups: 9/11, 13/u, 15/u, Open.
         * 
         * Selectable modes for cannonStrategy:
         * 1. TRADITIONAL: Strict ascending age order (9/11 -> 13/u -> 15/u -> Open).
         * 2. REVERSE_FRONTLOAD: Strict descending age order (Open -> 15/u -> 13/u -> 9/11) to maximize early lead and clean water.
         * 3. PURE_SPEED_DESC: Sort all 8 eligible swimmers strictly by their fastest 50m Freestyle PB (fastest on Leg 1 to slowest on Leg 8), regardless of age or gender.
         * 4. SANDWICH_BUFFER: Place fastest Open swimmer on Leg 1, group 9/11 & 13/u in Legs 2-5, place 15/u in Legs 6-7, reserve 2nd Open swimmer as Leg 8 anchor.
         * 5. HUNTER_ANCHOR: Order 15/u -> 13/u -> 9/11 -> Open (Legs 7 & 8) to maximize final-100m overtaking momentum.
         * 
         * Applies flat-start time penalty (+0.65s default) ONLY to whoever is assigned Leg 1,
         * and applies flying-start relay delta (-0.45s default) to Legs 2 through 8 so total predicted team time
         * updates dynamically based on who takes the flat start.
         * 
         * @private
         */
        _autoComposeCannonTeam(eventNumber, ev, options = {}) {
            const cannonStrategy = options.cannonStrategy || CANNON_STRATEGIES.TRADITIONAL;
            const flatStartPenaltyMs = options.flatStartPenaltyMs !== undefined ? options.flatStartPenaltyMs : 650;
            const flyingStartDeltaMs = options.flyingStartDeltaMs !== undefined ? options.flyingStartDeltaMs : -450;
            const takeoverBonusMs = options.takeoverBonusMs !== undefined ? options.takeoverBonusMs : Math.abs(flyingStartDeltaMs);
            const clubId = options.clubId || this.targetClubId;

            const fatiguePenaltyPerRaceMs = options.fatiguePenaltyPerRaceMs !== undefined
                ? options.fatiguePenaltyPerRaceMs
                : (options.fatiguePenaltyPerRace !== undefined ? Math.round(options.fatiguePenaltyPerRace * 1000) : 200);
            const fatigueRaceThreshold = options.fatigueRaceThreshold !== undefined ? options.fatigueRaceThreshold : 3;
            const fatigueTiebreakerMs = options.fatigueTiebreakerMs !== undefined ? options.fatigueTiebreakerMs : 300;
            const deprioritizeBackToBack = options.deprioritizeBackToBack !== false;

            // Step 1: Strictly enforce eligibility constraint:
            // Exactly 1 boy and 1 girl from each of the 4 age groups: 9/11, 13/u, 15/u, Open.
            const ageSlots = [
                { age: '9-11', gender: 'Female', key: 'g9_11', labelAge: '9/11', labelGender: 'Girls' },
                { age: '9-11', gender: 'Male', key: 'b9_11', labelAge: '9/11', labelGender: 'Boys' },
                { age: '13/U', gender: 'Female', key: 'g13', labelAge: '13/u', labelGender: 'Girls' },
                { age: '13/U', gender: 'Male', key: 'b13', labelAge: '13/u', labelGender: 'Boys' },
                { age: '15/U', gender: 'Female', key: 'g15', labelAge: '15/u', labelGender: 'Girls' },
                { age: '15/U', gender: 'Male', key: 'b15', labelAge: '15/u', labelGender: 'Boys' },
                { age: 'Open', gender: 'Female', key: 'gOpen', labelAge: 'Open', labelGender: 'Girls' },
                { age: 'Open', gender: 'Male', key: 'bOpen', labelAge: 'Open', labelGender: 'Boys' }
            ];

            const baselineList = Array.isArray(options.baselineSwimmers || options.draftedSwimmers)
                ? (options.baselineSwimmers || options.draftedSwimmers).slice()
                : [];

            const slotMatcher = (slot, idx) => {
                if (!baselineList || baselineList.length === 0) return null;
                // 1. Match by leg_index if traditional sequence provided in baseline
                const byLeg = baselineList.find(b => b.leg_index === idx);
                if (byLeg) {
                    const bGen = (byLeg.gender === 'Female' || byLeg.gender === 'F') ? 'Female' : 'Male';
                    if (bGen === slot.gender) return byLeg;
                }
                // 2. Match by gender and age bracket
                return baselineList.find(b => {
                    const bGen = (b.gender === 'Female' || b.gender === 'F' || b.swimmer_gender === 'F' || b.swimmer_gender === 'Female') ? 'Female' : 'Male';
                    if (bGen !== slot.gender) return false;
                    const rawAge = b.age !== undefined ? b.age : b.swimmer_age;
                    const ageNum = parseInt(rawAge, 10);
                    if (slot.age === '9-11') return !isNaN(ageNum) && ageNum <= 11;
                    if (slot.age === '13/U' || slot.age === '12-13') return !isNaN(ageNum) && (ageNum === 12 || ageNum === 13);
                    if (slot.age === '15/U' || slot.age === '14-15') return !isNaN(ageNum) && (ageNum === 14 || ageNum === 15);
                    if (slot.age === 'Open' || slot.age === '16+') return !isNaN(ageNum) && ageNum >= 16;
                    return false;
                });
            };

            const eligibleSwimmers = {};
            ageSlots.forEach((slot, slotIdx) => {
                const candidates = this.getCandidatesForRelayLeg({
                    age: slot.age,
                    gender: slot.gender,
                    stroke: 'Freestyle',
                    distance: 50
                }, clubId, {
                    fatiguePenaltyPerRaceMs,
                    fatigueRaceThreshold,
                    fatigueTiebreakerMs
                });

                const baselineMatch = slotMatcher(slot, slotIdx);
                let best = candidates[0];

                if (baselineMatch) {
                    const matchName = baselineMatch.swimmer || baselineMatch.swimmer_name;
                    const foundCand = candidates.find(c => this._isSameSwimmer(c.swimmer, matchName));
                    if (foundCand) {
                        best = {
                            ...foundCand,
                            swimmer_id: baselineMatch.swimmer_id || foundCand.swimmer_id
                        };
                    } else if (matchName) {
                        const timeMs = baselineMatch.timeMs || Math.round((baselineMatch.time_sec || baselineMatch.timeSec || 30) * 1000);
                        const timeStr = baselineMatch.timeStr || baselineMatch.formatted_time || TimeUtils.formatMsToTime(timeMs);
                        const workload = this.getSwimmerWorkload(matchName, clubId);
                        const excessRaces = Math.max(0, workload.raceCount - fatigueRaceThreshold);
                        const fatiguePenaltyMs = excessRaces * fatiguePenaltyPerRaceMs;
                        const adjustedTimeMs = timeMs + fatiguePenaltyMs;
                        best = {
                            swimmer: matchName,
                            swimmer_id: baselineMatch.swimmer_id,
                            timeMs,
                            timeStr,
                            adjustedTimeMs,
                            adjustedTimeStr: TimeUtils.formatMsToTime(adjustedTimeMs),
                            workload,
                            raceCount: workload.raceCount,
                            totalMeters: workload.totalMeters,
                            fatiguePenaltyMs,
                            fatiguePenaltyStr: fatiguePenaltyMs > 0 ? `+${(fatiguePenaltyMs / 1000).toFixed(2)}s` : '0.00s',
                            isHighFatigueRisk: (workload.raceCount >= 4 || workload.hasBackToBack46_49),
                            hasBackToBack46_49: workload.hasBackToBack46_49
                        };
                        candidates.unshift(best);
                    }
                }

                eligibleSwimmers[slot.key] = {
                    swimmer: best.swimmer,
                    swimmer_id: best.swimmer_id,
                    timeMs: best.timeMs,
                    timeStr: best.timeStr,
                    adjustedTimeMs: best.adjustedTimeMs !== undefined ? best.adjustedTimeMs : best.timeMs,
                    adjustedTimeStr: best.adjustedTimeStr || best.timeStr,
                    workload: best.workload,
                    raceCount: best.raceCount || 0,
                    totalMeters: best.totalMeters || 0,
                    fatiguePenaltyMs: best.fatiguePenaltyMs || 0,
                    fatiguePenaltyStr: best.fatiguePenaltyStr || '0.00s',
                    isHighFatigueRisk: !!best.isHighFatigueRisk,
                    hasBackToBack46_49: !!best.hasBackToBack46_49,
                    age: slot.age,
                    gender: slot.gender,
                    labelAge: slot.labelAge,
                    labelGender: slot.labelGender,
                    stroke: 'Freestyle',
                    distance: 50,
                    candidates
                };
            });

            const g9_11 = eligibleSwimmers['g9_11'];
            const b9_11 = eligibleSwimmers['b9_11'];
            const g13 = eligibleSwimmers['g13'];
            const b13 = eligibleSwimmers['b13'];
            const g15 = eligibleSwimmers['g15'];
            const b15 = eligibleSwimmers['b15'];
            const gOpen = eligibleSwimmers['gOpen'];
            const bOpen = eligibleSwimmers['bOpen'];

            let orderedSwimmers = [];

            switch (cannonStrategy) {
                case CANNON_STRATEGIES.REVERSE_FRONTLOAD: {
                    // Strict descending age order (Open -> 15/u -> 13/u -> 9/11) to maximize early lead and clean water.
                    // Within each age pair, place the faster swimmer first (by adjustedTimeMs) to maximize early lead.
                    const openPair = [bOpen, gOpen].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    const pair15 = [b15, g15].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    const pair13 = [b13, g13].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    const pair911 = [b9_11, g9_11].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);

                    orderedSwimmers = [
                        openPair[0], openPair[1],
                        pair15[0], pair15[1],
                        pair13[0], pair13[1],
                        pair911[0], pair911[1]
                    ];
                    break;
                }

                case CANNON_STRATEGIES.PURE_SPEED_DESC: {
                    // Sort all 8 eligible swimmers strictly by their fastest adjusted 50m Freestyle time
                    // (fastest on Leg 1 to slowest on Leg 8), regardless of age or gender.
                    const all8 = [g9_11, b9_11, g13, b13, g15, b15, gOpen, bOpen];
                    orderedSwimmers = all8.slice().sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    break;
                }

                case CANNON_STRATEGIES.SANDWICH_BUFFER: {
                    // Place the fastest Open swimmer on Leg 1, group the 9/11 and 13/u swimmers in Legs 2–5,
                    // place 15/u on Legs 6–7, and reserve the second Open swimmer as the Leg 8 anchor.
                    const openPair = [bOpen, gOpen].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    const fastestOpen = openPair[0];
                    const secondOpen = openPair[1];

                    orderedSwimmers = [
                        fastestOpen,
                        g9_11,
                        b9_11,
                        g13,
                        b13,
                        g15,
                        b15,
                        secondOpen
                    ];
                    break;
                }

                case CANNON_STRATEGIES.HUNTER_ANCHOR: {
                    // Order 15/u -> 13/u -> 9/11 -> Open (Legs 7 & 8) to maximize final-100m overtaking momentum.
                    // The faster Open swimmer anchors on Leg 8 for maximum finish surge.
                    const openPair = [bOpen, gOpen].sort((a, b) => a.adjustedTimeMs - b.adjustedTimeMs);
                    const openAnchor = openPair[0];   // fastest Open swimmer on Leg 8
                    const openPreAnchor = openPair[1]; // second Open swimmer on Leg 7

                    orderedSwimmers = [
                        g15,
                        b15,
                        g13,
                        b13,
                        g9_11,
                        b9_11,
                        openPreAnchor,
                        openAnchor
                    ];
                    break;
                }

                case CANNON_STRATEGIES.TRADITIONAL:
                default: {
                    // Strict ascending age order (9/11 -> 13/u -> 15/u -> Open).
                    // Defaults to chronological: 9/11 Girls, 9/11 Boys, 13/u Girls, 13/u Boys, 15/u Girls, 15/u Boys, Open Girls, Open Boys.
                    orderedSwimmers = [
                        g9_11,
                        b9_11,
                        g13,
                        b13,
                        g15,
                        b15,
                        gOpen,
                        bOpen
                    ];
                    break;
                }
            }

            // Step 2: Requirement 4 - Deprioritize any swimmer who already swam back-to-back in Events 46–49
            // from Leg 1 or Leg 2 of the Cannon unless no alternative exists.
            if (deprioritizeBackToBack) {
                orderedSwimmers = this._deprioritizeBackToBackFromEarlyLegs(orderedSwimmers, eligibleSwimmers, cannonStrategy);
            }

            // Step 3: Apply start adjustments & calculate projected splits:
            // Flat-start time penalty (e.g. +0.65s) ONLY to whoever is assigned Leg 1
            // Flying-start relay delta (e.g. -0.45s) to Legs 2 through 8
            const composedLegs = orderedSwimmers.map((s, idx) => {
                const legNum = idx + 1;
                const isFlatStart = (legNum === 1);
                const startDeltaMs = isFlatStart ? flatStartPenaltyMs : flyingStartDeltaMs;
                const effectiveTimeMs = s.adjustedTimeMs !== undefined ? s.adjustedTimeMs : s.timeMs;
                const splitTimeMs = Math.max(1000, effectiveTimeMs + startDeltaMs);
                const splitTimeStr = TimeUtils.formatMsToTime(splitTimeMs);

                let gTitle = s.gender === 'Female' ? 'Girls' : 'Boys';
                if (s.age === 'Open' || s.age === '16+') {
                    gTitle = s.gender === 'Female' ? 'Women' : 'Men';
                }

                return {
                    legNumber: legNum,
                    label: `Leg ${legNum} • ${gTitle} ${s.age} (50m Free)`,
                    age: s.age,
                    gender: s.gender,
                    stroke: 'Freestyle',
                    distance: 50,
                    swimmer: s.swimmer,
                    swimmer_id: s.swimmer_id,
                    timeMs: s.timeMs,
                    timeStr: s.timeStr,
                    adjustedTimeMs: s.adjustedTimeMs !== undefined ? s.adjustedTimeMs : s.timeMs,
                    adjustedTimeStr: s.adjustedTimeStr || s.timeStr,
                    workload: s.workload,
                    raceCount: s.raceCount || 0,
                    totalMeters: s.totalMeters || 0,
                    fatiguePenaltyMs: s.fatiguePenaltyMs || 0,
                    fatiguePenaltyStr: s.fatiguePenaltyStr || '0.00s',
                    isHighFatigueRisk: !!s.isHighFatigueRisk,
                    hasBackToBack46_49: !!s.hasBackToBack46_49,
                    isFlatStart,
                    startDeltaMs,
                    startDeltaStr: (startDeltaMs >= 0 ? '+' : '') + (startDeltaMs / 1000).toFixed(2) + 's',
                    splitTimeMs,
                    splitTimeStr,
                    candidates: s.candidates
                };
            });

            // Step 4: Compute projected relay performance dynamically using fatigue-adjusted times
            const legTimesMs = composedLegs.map(l => l.adjustedTimeMs || l.timeMs);
            const relayResult = this.predictor.projectRelayPerformance(
                eventNumber,
                legTimesMs,
                {
                    takeoverBonusMs: Math.abs(flyingStartDeltaMs),
                    flatStartPenaltyMs,
                    flyingStartDeltaMs
                },
                this.targetClubName
            );

            const totalFatiguePenaltyMs = composedLegs.reduce((acc, l) => acc + (l.fatiguePenaltyMs || 0), 0);

            return {
                event: ev,
                cannonStrategy,
                flatStartPenaltyMs,
                flyingStartDeltaMs,
                takeoverBonusMs: Math.abs(flyingStartDeltaMs),
                fatiguePenaltyPerRaceMs,
                totalFatiguePenaltyMs,
                selectedLegs: composedLegs, // for backward compatibility
                legs: composedLegs,
                relayResult
            };
        }

        /**
         * Auto-composes the fastest relay team for an event from recorded squad times.
         * For Event 50 / 51 (8 x 50m Mixed Cannon Relay), supports selectable cannonStrategy modes
         * and applies flat-start penalty ONLY to Leg 1 and flying delta to Legs 2-8.
         * 
         * @param {number} eventNumber
         * @param {number|Object} [takeoverBonusOrOptions=600]
         * @param {string} [cannonStrategyParam=null]
         * @param {Object} [extraOptions={}]
         * @returns {Object}
         */
        autoComposeRelayTeam(eventNumber, takeoverBonusOrOptions = 600, cannonStrategyParam = null, extraOptions = {}) {
            let takeoverBonusMs = 600;
            let cannonStrategy = cannonStrategyParam;
            let flatStartPenaltyMs = 650;
            let flyingStartDeltaMs = -450;
            let clubId = this.targetClubId;
            let fatiguePenaltyPerRaceMs = 200;
            let fatigueRaceThreshold = 3;
            let fatigueTiebreakerMs = 300;
            let deprioritizeBackToBack = true;
            let baselineSwimmers = null;

            if (typeof takeoverBonusOrOptions === 'object' && takeoverBonusOrOptions !== null) {
                const opts = takeoverBonusOrOptions;
                if (opts.takeoverBonusMs !== undefined) takeoverBonusMs = opts.takeoverBonusMs;
                else if (opts.bonusMs !== undefined) takeoverBonusMs = opts.bonusMs;
                if (opts.cannonStrategy) cannonStrategy = opts.cannonStrategy;
                else if (opts.strategy) cannonStrategy = opts.strategy;
                if (opts.flatStartPenaltyMs !== undefined) flatStartPenaltyMs = opts.flatStartPenaltyMs;
                else if (opts.flatStartPenalty !== undefined) flatStartPenaltyMs = Math.round(opts.flatStartPenalty * 1000);
                if (opts.flyingStartDeltaMs !== undefined) flyingStartDeltaMs = opts.flyingStartDeltaMs;
                else if (opts.flyingStartDelta !== undefined) flyingStartDeltaMs = Math.round(opts.flyingStartDelta * 1000);
                if (opts.clubId) clubId = opts.clubId;
                if (opts.fatiguePenaltyPerRaceMs !== undefined) fatiguePenaltyPerRaceMs = opts.fatiguePenaltyPerRaceMs;
                else if (opts.fatiguePenaltyPerRace !== undefined) fatiguePenaltyPerRaceMs = Math.round(opts.fatiguePenaltyPerRace * 1000);
                if (opts.fatigueRaceThreshold !== undefined) fatigueRaceThreshold = opts.fatigueRaceThreshold;
                if (opts.fatigueTiebreakerMs !== undefined) fatigueTiebreakerMs = opts.fatigueTiebreakerMs;
                if (opts.deprioritizeBackToBack !== undefined) deprioritizeBackToBack = opts.deprioritizeBackToBack;
                if (opts.baselineSwimmers) baselineSwimmers = opts.baselineSwimmers;
                else if (opts.draftedSwimmers) baselineSwimmers = opts.draftedSwimmers;
            } else if (typeof takeoverBonusOrOptions === 'number') {
                takeoverBonusMs = takeoverBonusOrOptions;
                const opts = typeof extraOptions === 'object' && extraOptions !== null ? extraOptions : {};
                if (opts.cannonStrategy) cannonStrategy = opts.cannonStrategy;
                else if (opts.strategy) cannonStrategy = opts.strategy;
                if (opts.flatStartPenaltyMs !== undefined) flatStartPenaltyMs = opts.flatStartPenaltyMs;
                else if (opts.flatStartPenalty !== undefined) flatStartPenaltyMs = Math.round(opts.flatStartPenalty * 1000);
                if (opts.flyingStartDeltaMs !== undefined) flyingStartDeltaMs = opts.flyingStartDeltaMs;
                else if (opts.flyingStartDelta !== undefined) flyingStartDeltaMs = Math.round(opts.flyingStartDelta * 1000);
                if (opts.clubId) clubId = opts.clubId;
                if (opts.fatiguePenaltyPerRaceMs !== undefined) fatiguePenaltyPerRaceMs = opts.fatiguePenaltyPerRaceMs;
                else if (opts.fatiguePenaltyPerRace !== undefined) fatiguePenaltyPerRaceMs = Math.round(opts.fatiguePenaltyPerRace * 1000);
                if (opts.fatigueRaceThreshold !== undefined) fatigueRaceThreshold = opts.fatigueRaceThreshold;
                if (opts.fatigueTiebreakerMs !== undefined) fatigueTiebreakerMs = opts.fatigueTiebreakerMs;
                if (opts.deprioritizeBackToBack !== undefined) deprioritizeBackToBack = opts.deprioritizeBackToBack;
                if (opts.baselineSwimmers) baselineSwimmers = opts.baselineSwimmers;
                else if (opts.draftedSwimmers) baselineSwimmers = opts.draftedSwimmers;
            }

            if (!cannonStrategy) {
                cannonStrategy = CANNON_STRATEGIES.TRADITIONAL;
            }

            let ev = this.predictor.events.find(e => e.number === eventNumber);
            const isCannon = this.isCannonRelay(eventNumber, ev);

            if (!ev) {
                if (isCannon) {
                    ev = { number: eventNumber, name: `Event ${eventNumber} (8x50m Freestyle Cannon)`, isRelay: true, legs: 8, stroke: 'Cannon Relay', gender: 'Mixed', age: 'Open', distance: 400 };
                } else {
                    return null;
                }
            }

            // Route Cannon composition
            if (isCannon) {
                return this._autoComposeCannonTeam(eventNumber, ev, {
                    cannonStrategy,
                    flatStartPenaltyMs,
                    flyingStartDeltaMs,
                    takeoverBonusMs,
                    clubId,
                    fatiguePenaltyPerRaceMs,
                    fatigueRaceThreshold,
                    fatigueTiebreakerMs,
                    deprioritizeBackToBack,
                    baselineSwimmers
                });
            }

            // Standard 4-leg relay composition
            const legDefs = this.getRelayLegDefinitions(eventNumber);
            const assignedSwimmers = new Set();
            const composedLegs = [];

            const isSingleAgeGroup = legDefs.length > 0 && legDefs.every(l => l.age === legDefs[0].age && l.gender === legDefs[0].gender && l.stroke === legDefs[0].stroke);

            legDefs.forEach((legDef) => {
                const candidates = this.getCandidatesForRelayLeg(legDef, clubId, {
                    fatiguePenaltyPerRaceMs,
                    fatigueRaceThreshold,
                    fatigueTiebreakerMs
                });
                let chosen = null;

                if (isSingleAgeGroup) {
                    chosen = candidates.find(c => !assignedSwimmers.has(c.swimmer));
                }

                if (!chosen) {
                    chosen = candidates[0];
                }

                assignedSwimmers.add(chosen.swimmer);

                composedLegs.push({
                    legNumber: legDef.legNumber,
                    label: legDef.label,
                    age: legDef.age,
                    gender: legDef.gender,
                    stroke: legDef.stroke,
                    distance: legDef.distance,
                    swimmer: chosen.swimmer,
                    timeMs: chosen.timeMs,
                    timeStr: chosen.timeStr,
                    adjustedTimeMs: chosen.adjustedTimeMs !== undefined ? chosen.adjustedTimeMs : chosen.timeMs,
                    adjustedTimeStr: chosen.adjustedTimeStr || chosen.timeStr,
                    workload: chosen.workload,
                    raceCount: chosen.raceCount || 0,
                    totalMeters: chosen.totalMeters || 0,
                    fatiguePenaltyMs: chosen.fatiguePenaltyMs || 0,
                    fatiguePenaltyStr: chosen.fatiguePenaltyStr || '0.00s',
                    isHighFatigueRisk: !!chosen.isHighFatigueRisk,
                    hasBackToBack46_49: !!chosen.hasBackToBack46_49,
                    candidates: candidates
                });
            });

            const legTimesMs = composedLegs.map(l => l.adjustedTimeMs || l.timeMs);
            const relayResult = this.predictor.projectRelayPerformance(
                eventNumber,
                legTimesMs,
                takeoverBonusMs,
                this.targetClubName
            );

            return {
                event: ev,
                selectedLegs: composedLegs, // for backward compatibility
                legs: composedLegs,
                takeoverBonusMs,
                relayResult
            };
        }

        /**
         * Convenience method to generate the 8x50m Cannon lineup
         * 
         * @param {Object} [options={}]
         * @returns {Object}
         */
        autoComposeCannonTeam(options = {}) {
            const evNum = options.eventNumber || 50;
            return this.autoComposeRelayTeam(evNum, options);
        }

        /**
         * Alias for autoComposeCannonTeam
         */
        generateCannonLineup(options = {}) {
            return this.autoComposeCannonTeam(options);
        }

        /**
         * Simulates a head-to-head Cannon Relay (Event 50/51) race between
         * our team using a selected strategy and a simulated opponent
         * running a TRADITIONAL ascending age order (9/11 -> 13/u -> 15/u -> Open),
         * constructed from opponent average 50m PBs imported from previous rounds.
         * 
         * Provides split-by-split cumulative times, lead/deficit tracking,
         * clean-water advantage metrics, and exact leg highlights for:
         * - Leg where our team takes the lead
         * - Leg where our team faces the biggest deficit
         * - Peak separation lead
         * 
         * @param {Object} [options={}]
         * @returns {Object} Head-to-head simulation analysis
         */
        simulateCannonHeadToHead(options = {}) {
            const cannonStrategy = options.cannonStrategy || options.strategy || CANNON_STRATEGIES.TRADITIONAL;
            const evNum = options.eventNumber || 50;
            const clubId = options.clubId || this.targetClubId;

            // 1. Generate our team's composition under the specified strategy
            const ourComposition = this.autoComposeRelayTeam(evNum, {
                ...options,
                cannonStrategy,
                clubId
            });
            const ourLegs = ourComposition ? (ourComposition.legs || ourComposition.selectedLegs || []) : [];

            // 2. Generate simulated opponent running TRADITIONAL ascending age lineup
            // 9/11 Girls, 9/11 Boys, 13/u Girls, 13/u Boys, 15/u Girls, 15/u Boys, Open Girls, Open Boys
            const opponentSlots = [
                { age: '9-11', gender: 'Female', label: '9/11 Girls', defaultMs: 36600 },
                { age: '9-11', gender: 'Male', label: '9/11 Boys', defaultMs: 35100 },
                { age: '13/U', gender: 'Female', label: '13/u Girls', defaultMs: 32300 },
                { age: '13/U', gender: 'Male', label: '13/u Boys', defaultMs: 34200 },
                { age: '15/U', gender: 'Female', label: '15/u Girls', defaultMs: 30600 },
                { age: '15/U', gender: 'Male', label: '15/u Boys', defaultMs: 28000 },
                { age: 'Open', gender: 'Female', label: 'Open Girls', defaultMs: 30000 },
                { age: 'Open', gender: 'Male', label: 'Open Boys', defaultMs: 27800 }
            ];

            // Query other clubs in active gala or timesDB
            const activeGala = this.storage ? this.storage.getActiveGalaLineup() : null;
            let opposingClubs = [];
            if (activeGala && activeGala.competingClubs) {
                opposingClubs = activeGala.competingClubs
                    .map(c => StorageManager.getClubId(c.id || c.name))
                    .filter(cId => cId !== StorageManager.getClubId(clubId));
            }
            if (opposingClubs.length === 0 && this.storage && this.storage.timesDB) {
                opposingClubs = Object.keys(this.storage.timesDB).filter(cId => cId !== StorageManager.getClubId(clubId));
            }

            const flatStartPenaltyMs = options.flatStartPenaltyMs !== undefined ? options.flatStartPenaltyMs : 650;
            const flyingStartDeltaMs = options.flyingStartDeltaMs !== undefined ? options.flyingStartDeltaMs : -450;

            const opponentLegs = opponentSlots.map((slot, idx) => {
                let totalMs = 0;
                let count = 0;

                opposingClubs.forEach(cId => {
                    if (!this.storage || !this.storage.timesDB || !this.storage.timesDB[cId]) return;
                    // Try 50m Free
                    const ev50 = { age: slot.age, gender: slot.gender, stroke: 'Freestyle', distance: 50 };
                    const seed50 = this.storage.getBestSeedTime(cId, ev50);
                    if (seed50 && seed50.timeMs > 0 && !seed50.isDQ) {
                        totalMs += seed50.timeMs;
                        count++;
                    } else {
                        // Fallback to 100m Free with 0.475 conversion
                        const ev100 = { age: slot.age, gender: slot.gender, stroke: 'Freestyle', distance: 100 };
                        const seed100 = this.storage.getBestSeedTime(cId, ev100);
                        if (seed100 && seed100.timeMs > 0 && !seed100.isDQ) {
                            totalMs += Math.round(seed100.timeMs * 0.475);
                            count++;
                        }
                    }
                });

                const avgPbMs = count > 0 ? Math.round(totalMs / count) : slot.defaultMs;
                const isFlat = (idx === 0);
                const startDeltaMs = isFlat ? flatStartPenaltyMs : flyingStartDeltaMs;
                const splitTimeMs = Math.max(1000, avgPbMs + startDeltaMs);

                return {
                    legNumber: idx + 1,
                    age: slot.age,
                    gender: slot.gender,
                    label: `Leg ${idx + 1} • ${slot.label}`,
                    swimmer: `Simulated Opponent (${slot.label})`,
                    timeMs: avgPbMs,
                    timeStr: TimeUtils.formatMsToTime(avgPbMs),
                    isFlatStart: isFlat,
                    startDeltaMs,
                    splitTimeMs,
                    splitTimeStr: TimeUtils.formatMsToTime(splitTimeMs)
                };
            });

            // 3. Compute cumulative times, leg-by-leg gaps, lead transitions, and highlights
            let ourCumMs = 0;
            let oppCumMs = 0;

            let maxLeadMs = 0;
            let maxLeadLeg = null;
            let maxDeficitMs = 0;
            let maxDeficitLeg = null;
            let takeLeadLeg = null;
            let previouslyBehind = true;

            const legsComparison = [];

            for (let idx = 0; idx < 8; idx++) {
                const legNum = idx + 1;
                const ourLeg = ourLegs[idx] || {
                    legNumber: legNum,
                    swimmer: 'Unassigned',
                    label: `Leg ${legNum}`,
                    splitTimeMs: 30000,
                    splitTimeStr: '30.00'
                };
                const oppLeg = opponentLegs[idx];

                ourCumMs += ourLeg.splitTimeMs;
                oppCumMs += oppLeg.splitTimeMs;

                // Gap in ms: positive = our team is leading (ahead by X ms)
                // negative = our team is trailing (behind / deficit of X ms)
                const marginMs = oppCumMs - ourCumMs;
                const isLeading = marginMs > 0;
                const isDeficit = marginMs < 0;
                const isTied = marginMs === 0;

                const status = isLeading ? 'LEAD' : (isDeficit ? 'DEFICIT' : 'TIED');
                const absSec = (Math.abs(marginMs) / 1000).toFixed(2);
                const deltaStr = isLeading ? `+${absSec}s Lead` : (isDeficit ? `-${absSec}s Deficit` : `0.00s Tied`);

                // Check Lead Taken leg (first leg where we lead, or transition from deficit/tied to lead)
                if (isLeading && previouslyBehind && takeLeadLeg === null) {
                    takeLeadLeg = {
                        legNumber: legNum,
                        leadMs: marginMs,
                        leadStr: `+${absSec}s Lead`,
                        swimmer: ourLeg.swimmer,
                        label: ourLeg.label
                    };
                }
                if (!isLeading) {
                    previouslyBehind = true;
                } else {
                    previouslyBehind = false;
                }

                // Check Peak Lead
                if (marginMs > maxLeadMs) {
                    maxLeadMs = marginMs;
                    maxLeadLeg = {
                        legNumber: legNum,
                        leadMs: marginMs,
                        leadStr: `+${absSec}s Lead`,
                        swimmer: ourLeg.swimmer,
                        label: ourLeg.label
                    };
                }

                // Check Max Deficit
                const deficitMs = -marginMs;
                if (deficitMs > maxDeficitMs) {
                    maxDeficitMs = deficitMs;
                    maxDeficitLeg = {
                        legNumber: legNum,
                        deficitMs: deficitMs,
                        deficitStr: `-${absSec}s Deficit`,
                        swimmer: ourLeg.swimmer,
                        label: ourLeg.label
                    };
                }

                legsComparison.push({
                    legNumber: legNum,
                    ourLeg: {
                        swimmer: ourLeg.swimmer,
                        age: ourLeg.age,
                        gender: ourLeg.gender,
                        label: ourLeg.label,
                        timeStr: ourLeg.timeStr,
                        splitTimeMs: ourLeg.splitTimeMs,
                        splitTimeStr: ourLeg.splitTimeStr,
                        cumTimeMs: ourCumMs,
                        cumTimeStr: TimeUtils.formatMsToTime(ourCumMs),
                        isHighFatigueRisk: !!ourLeg.isHighFatigueRisk,
                        hasBackToBack46_49: !!ourLeg.hasBackToBack46_49
                    },
                    opponentLeg: {
                        swimmer: oppLeg.swimmer,
                        label: oppLeg.label,
                        splitTimeMs: oppLeg.splitTimeMs,
                        splitTimeStr: oppLeg.splitTimeStr,
                        cumTimeMs: oppCumMs,
                        cumTimeStr: TimeUtils.formatMsToTime(oppCumMs)
                    },
                    marginMs,
                    marginSec: parseFloat((marginMs / 1000).toFixed(2)),
                    status,
                    deltaStr,
                    isLeading,
                    isDeficit,
                    isTied
                });
            }

            // Tag milestone flags on individual legs
            legsComparison.forEach(l => {
                l.isTakeLeadLeg = !!(takeLeadLeg && l.legNumber === takeLeadLeg.legNumber);
                l.isMaxLeadLeg = !!(maxLeadLeg && l.legNumber === maxLeadLeg.legNumber);
                l.isMaxDeficitLeg = !!(maxDeficitLeg && l.legNumber === maxDeficitLeg.legNumber);
            });

            const finalMarginMs = oppCumMs - ourCumMs;
            const finalAbsSec = (Math.abs(finalMarginMs) / 1000).toFixed(2);
            const finalMarginStr = finalMarginMs > 0 ? `+${finalAbsSec}s Victory` : (finalMarginMs < 0 ? `-${finalAbsSec}s Deficit` : 'Tie');
            const isWireToWireLead = legsComparison.every(l => l.isLeading);

            // Clean water & psychological narrative
            let tacticalSummary = '';
            let cleanWaterRating = 'Clean Water Advantage';

            if (cannonStrategy === CANNON_STRATEGIES.REVERSE_FRONTLOAD) {
                tacticalSummary = `Massive early lead (+${(maxLeadMs / 1000).toFixed(2)}s peak) secures undisturbed clean water from Leg 1, forcing opponents into heavy wake wash and psychological chase pressure.`;
                cleanWaterRating = 'Maximum Clean-Water Advantage';
            } else if (cannonStrategy === CANNON_STRATEGIES.PURE_SPEED_DESC) {
                tacticalSummary = `Fastest swimmers front-loaded to dominate opening legs (+${(maxLeadMs / 1000).toFixed(2)}s peak), creating insurmountable wake for opposition.`;
                cleanWaterRating = 'High Clean-Water Advantage';
            } else if (cannonStrategy === CANNON_STRATEGIES.SANDWICH_BUFFER) {
                tacticalSummary = `Fastest Open swimmer creates an immediate clean-water cushion on Leg 1, protecting younger middle legs before an Open anchor finish.`;
                cleanWaterRating = 'Buffered Middle Clean Water';
            } else if (cannonStrategy === CANNON_STRATEGIES.HUNTER_ANCHOR) {
                tacticalSummary = `15/u and 13/u establish opening margin; despite tighter mid-race wash, Open anchors surge home for decisive overtaking momentum.`;
                cleanWaterRating = 'Anchor Hunter Surge';
            } else {
                tacticalSummary = `Direct chronological mirroring. Tight racing in opening 9/11 legs with decisive break in later legs.`;
                cleanWaterRating = 'Head-to-Head Mirror';
            }

            return {
                cannonStrategy,
                ourTeam: {
                    clubName: this.targetClubName,
                    totalTimeMs: ourCumMs,
                    totalTimeFormatted: TimeUtils.formatMsToTime(ourCumMs)
                },
                opponent: {
                    clubName: 'Simulated Opponent (League Avg PBs • Traditional Lineup)',
                    totalTimeMs: oppCumMs,
                    totalTimeFormatted: TimeUtils.formatMsToTime(oppCumMs)
                },
                legsComparison,
                keyMilestones: {
                    takeLeadLeg: takeLeadLeg ? {
                        legNumber: takeLeadLeg.legNumber,
                        leadMs: takeLeadLeg.leadMs,
                        leadStr: takeLeadLeg.leadStr,
                        swimmer: takeLeadLeg.swimmer,
                        label: `Leg ${takeLeadLeg.legNumber} Lead: ${takeLeadLeg.leadStr}`
                    } : null,
                    maxLeadLeg: maxLeadLeg ? {
                        legNumber: maxLeadLeg.legNumber,
                        leadMs: maxLeadLeg.leadMs,
                        leadStr: maxLeadLeg.leadStr,
                        swimmer: maxLeadLeg.swimmer,
                        label: `Leg ${maxLeadLeg.legNumber} Peak Lead: ${maxLeadLeg.leadStr}`
                    } : null,
                    maxDeficitLeg: maxDeficitLeg ? {
                        legNumber: maxDeficitLeg.legNumber,
                        deficitMs: maxDeficitLeg.deficitMs,
                        deficitStr: maxDeficitLeg.deficitStr,
                        swimmer: maxDeficitLeg.swimmer,
                        label: `Leg ${maxDeficitLeg.legNumber} Deficit: ${maxDeficitLeg.deficitStr}`
                    } : null,
                    finalMarginMs,
                    finalMarginStr,
                    isWireToWireLead,
                    cleanWaterRating,
                    tacticalSummary
                }
            };
        }

        /**
         * Evaluates a custom or amended relay composition with specific leg swimmers.
         * For Cannon relays, accurately preserves flat-start penalty on Leg 1 and flying delta on Legs 2-8,
         * while evaluating swimmer fatigue and workload penalties.
         * 
         * @param {number} eventNumber
         * @param {Array<Object>} legs - Array of { swimmer, timeMs, timeStr }
         * @param {number|Object} [takeoverBonusOrOptions=600]
         * @param {Object} [extraOptions={}]
         * @returns {Object}
         */
        evaluateCustomRelayComposition(eventNumber, legs, takeoverBonusOrOptions = 600, extraOptions = {}) {
            let ev = this.predictor.events.find(e => e.number === eventNumber);
            const isCannon = this.isCannonRelay(eventNumber, ev) || (Array.isArray(legs) && legs.length === 8);

            if (!ev) {
                if (isCannon) {
                    ev = { number: eventNumber, name: `Event ${eventNumber} (8x50m Freestyle Cannon)`, isRelay: true, legs: 8, stroke: 'Cannon Relay', gender: 'Mixed', age: 'Open', distance: 400 };
                } else {
                    return null;
                }
            }

            let takeoverBonusMs = 600;
            let flatStartPenaltyMs = isCannon ? 650 : 0;
            let flyingStartDeltaMs = isCannon ? -450 : -600;
            let clubId = this.targetClubId;
            let fatiguePenaltyPerRaceMs = 200;
            let fatigueRaceThreshold = 3;

            if (typeof takeoverBonusOrOptions === 'object' && takeoverBonusOrOptions !== null) {
                const opts = takeoverBonusOrOptions;
                if (opts.takeoverBonusMs !== undefined) takeoverBonusMs = opts.takeoverBonusMs;
                else if (opts.bonusMs !== undefined) takeoverBonusMs = opts.bonusMs;
                if (opts.flatStartPenaltyMs !== undefined) flatStartPenaltyMs = opts.flatStartPenaltyMs;
                else if (opts.flatStartPenalty !== undefined) flatStartPenaltyMs = Math.round(opts.flatStartPenalty * 1000);
                if (opts.flyingStartDeltaMs !== undefined) flyingStartDeltaMs = opts.flyingStartDeltaMs;
                else if (opts.flyingStartDelta !== undefined) flyingStartDeltaMs = Math.round(opts.flyingStartDelta * 1000);
                if (opts.clubId) clubId = opts.clubId;
                if (opts.fatiguePenaltyPerRaceMs !== undefined) fatiguePenaltyPerRaceMs = opts.fatiguePenaltyPerRaceMs;
                else if (opts.fatiguePenaltyPerRace !== undefined) fatiguePenaltyPerRaceMs = Math.round(opts.fatiguePenaltyPerRace * 1000);
                if (opts.fatigueRaceThreshold !== undefined) fatigueRaceThreshold = opts.fatigueRaceThreshold;
            } else if (typeof takeoverBonusOrOptions === 'number') {
                takeoverBonusMs = takeoverBonusOrOptions;
                const opts = typeof extraOptions === 'object' && extraOptions !== null ? extraOptions : {};
                if (opts.flatStartPenaltyMs !== undefined) flatStartPenaltyMs = opts.flatStartPenaltyMs;
                else if (opts.flatStartPenalty !== undefined) flatStartPenaltyMs = Math.round(opts.flatStartPenalty * 1000);
                if (opts.flyingStartDeltaMs !== undefined) flyingStartDeltaMs = opts.flyingStartDeltaMs;
                else if (opts.flyingStartDelta !== undefined) flyingStartDeltaMs = Math.round(opts.flyingStartDelta * 1000);
                if (opts.clubId) clubId = opts.clubId;
                if (opts.fatiguePenaltyPerRaceMs !== undefined) fatiguePenaltyPerRaceMs = opts.fatiguePenaltyPerRaceMs;
                else if (opts.fatiguePenaltyPerRace !== undefined) fatiguePenaltyPerRaceMs = Math.round(opts.fatiguePenaltyPerRace * 1000);
                if (opts.fatigueRaceThreshold !== undefined) fatigueRaceThreshold = opts.fatigueRaceThreshold;
            }

            const unassignedLegs = (legs || []).filter(l => !l.swimmer || !l.timeMs || l.timeMs <= 0 || l.isDeleted);
            const hasUnassigned = unassignedLegs.length > 0;

            // If a leg is unassigned or deleted, use realistic age/gender benchmark time for preview projection
            const enrichedLegs = (legs || []).map((l, idx) => {
                const legNum = idx + 1;
                const isFlatStart = (legNum === 1);
                const startDeltaMs = isFlatStart ? flatStartPenaltyMs : flyingStartDeltaMs;

                let baseMs = l.timeMs;
                if (!baseMs || baseMs <= 0 || l.isDeleted) {
                    const isFem = l.gender === 'Female';
                    if (l.age === '9-11' || l.age === '9/11') baseMs = isFem ? 38500 : 34500;
                    else if (l.age === '12-13' || l.age === '13/U' || l.age === '13/u') baseMs = isFem ? 33000 : 30500;
                    else if (l.age === '14-15' || l.age === '15/U' || l.age === '15/u') baseMs = isFem ? 31000 : 28500;
                    else baseMs = isFem ? 29000 : 26000;
                }

                const workload = this.getSwimmerWorkload(l.swimmer, clubId);
                const excessRaces = Math.max(0, workload.raceCount - fatigueRaceThreshold);
                const fatiguePenaltyMs = excessRaces * fatiguePenaltyPerRaceMs;
                const adjustedTimeMs = baseMs + fatiguePenaltyMs;
                const isHighFatigueRisk = (workload.raceCount >= 4 || workload.hasBackToBack46_49);

                const splitTimeMs = Math.max(1000, adjustedTimeMs + startDeltaMs);
                return {
                    ...l,
                    legNumber: legNum,
                    timeMs: baseMs,
                    timeStr: l.timeStr || TimeUtils.formatMsToTime(baseMs),
                    adjustedTimeMs,
                    adjustedTimeStr: TimeUtils.formatMsToTime(adjustedTimeMs),
                    workload,
                    raceCount: workload.raceCount,
                    totalMeters: workload.totalMeters,
                    fatiguePenaltyMs,
                    fatiguePenaltyStr: fatiguePenaltyMs > 0 ? `+${(fatiguePenaltyMs / 1000).toFixed(2)}s` : '0.00s',
                    isHighFatigueRisk,
                    hasBackToBack46_49: workload.hasBackToBack46_49,
                    isFlatStart,
                    startDeltaMs,
                    startDeltaStr: (startDeltaMs >= 0 ? '+' : '') + (startDeltaMs / 1000).toFixed(2) + 's',
                    splitTimeMs,
                    splitTimeStr: TimeUtils.formatMsToTime(splitTimeMs)
                };
            });

            const legTimesMs = enrichedLegs.map(l => l.adjustedTimeMs || l.timeMs);
            const relayResult = this.predictor.projectRelayPerformance(
                eventNumber,
                legTimesMs,
                {
                    takeoverBonusMs: Math.abs(flyingStartDeltaMs),
                    flatStartPenaltyMs,
                    flyingStartDeltaMs
                },
                this.targetClubName
            );

            const totalFatiguePenaltyMs = enrichedLegs.reduce((acc, l) => acc + (l.fatiguePenaltyMs || 0), 0);

            return {
                event: ev,
                legs: enrichedLegs,
                selectedLegs: enrichedLegs,
                hasUnassigned,
                unassignedCount: unassignedLegs.length,
                unassignedLegNumbers: unassignedLegs.map(l => l.legNumber),
                takeoverBonusMs: Math.abs(flyingStartDeltaMs),
                flatStartPenaltyMs,
                flyingStartDeltaMs,
                fatiguePenaltyPerRaceMs,
                totalFatiguePenaltyMs,
                relayResult
            };
        }

        /**
         * Deploys an amended relay squad to the lineup optimizer, saving the full team composition
         * 
         * @param {number} eventNumber
         * @param {Array<Object>} legs
         * @param {number|Object} [takeoverBonusOrOptions=600]
         * @param {Object} [extraOptions={}]
         * @returns {Object} Real-time swap impact analysis
         */
        deployRelayTeam(eventNumber, legs, takeoverBonusOrOptions = 600, extraOptions = {}) {
            const ev = this.predictor.events.find(e => e.number === eventNumber) || { number: eventNumber, isRelay: true };
            if (!ev || !ev.isRelay) return null;

            const unassignedLegs = legs.filter(l => !l.swimmer || !l.timeMs || l.timeMs <= 0 || l.isDeleted);
            if (unassignedLegs.length > 0) {
                return {
                    error: true,
                    message: `Cannot deploy relay: Leg(s) ${unassignedLegs.map(l => l.legNumber).join(', ')} currently have no swimmer assigned. Please select or add swimmers for these legs first.`
                };
            }

            const res = this.evaluateCustomRelayComposition(eventNumber, legs, takeoverBonusOrOptions, extraOptions);
            if (!res || !res.relayResult) return null;

            // Build informative swimmer team descriptor
            const swimmerList = (res.legs || legs).map(l => {
                const parts = (l.swimmer || '').trim().split(' ');
                if (parts.length > 1) {
                    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
                }
                return l.swimmer;
            }).join(', ');

            const teamDescriptor = `Weston SC (${swimmerList})`;

            return this.evaluateTacticalSwap(eventNumber, {
                swimmer: teamDescriptor,
                timeStr: res.relayResult.compositeTimeFormatted,
                timeMs: res.relayResult.compositeTimeMs,
                isDQ: false,
                relayLegs: res.legs || legs
            });
        }
    }

    return LineupOptimizer;
}));
