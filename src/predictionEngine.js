/**
 * predictionEngine.js
 * Arena Race Manager - Predictive Scoring Engine
 * 
 * Provides:
 * - Deterministic scoring projection based on seed times.
 * - Stochastic Monte Carlo simulation with Gaussian variance perturbation.
 * - Median imputation baseline for missing seed times.
 * - Swing event detection (< 0.30s time delta with 2+ point swing).
 * - Head-to-Head club comparison matrix.
 * - Relay split estimator with composite takeover bonus.
 * - Standard 8-lane scoring with countback tiebreaking.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./timeUtils'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const TimeUtils = require('./timeUtils');
        module.exports = factory(TimeUtils);
    } else {
        const g = root || globalThis || window || self || {};
        g.RacePredictor = factory(g.TimeUtils);
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (TimeUtils) {
    'use strict';

    if (!TimeUtils) {
        console.error('TimeUtils dependency is required for RacePredictor.');
    }

    /**
     * Standard 8-lane club lineup for Division 1 Gala 1
     */
    const DEFAULT_CLUBS = [
        { id: 'caradon', name: 'Caradon', lane: 1, shortCode: 'CAR', color: '#38bdf8' },
        { id: 'brixham', name: 'Brixham', lane: 2, shortCode: 'BRX', color: '#f59e0b' },
        { id: 'truro', name: 'Truro City', lane: 3, shortCode: 'TRU', color: '#ef4444' },
        { id: 'swindon', name: 'Swindon ASC', lane: 4, shortCode: 'SWN', color: '#8b5cf6' },
        { id: 'north_cornwall', name: 'North Cornwall Dragons', lane: 5, shortCode: 'NCD', color: '#10b981' },
        { id: 'bradford', name: 'Bradford on Avon', lane: 6, shortCode: 'BOA', color: '#ec4899' },
        { id: 'bridgwater', name: 'Bridgwater', lane: 7, shortCode: 'BDG', color: '#f97316' },
        { id: 'weston', name: 'Weston S Mare', lane: 8, shortCode: 'WSM', color: '#06b6d4', isHome: true }
    ];

    /**
     * Standard 51-event program for National Arena Swimming League
     * Milestone checkpoints: Events 10, 18, 26, 34, 42, 51
     */
    const ARENA_EVENTS = [
        { number: 1, name: '200m Individual Medley', gender: 'Female', age: '16+', distance: 200, stroke: 'individualmedley', isRelay: false, legs: 1 },
        { number: 2, name: '200m Individual Medley', gender: 'Male', age: '16+', distance: 200, stroke: 'individualmedley', isRelay: false, legs: 1 },
        { number: 3, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '9-11', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 4, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '9-11', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 5, name: '4 x 50m Medley Relay', gender: 'Female', age: '12-13', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 6, name: '4 x 50m Medley Relay', gender: 'Male', age: '12-13', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 7, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '14-15', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 8, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '14-15', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 9, name: '4 x 50m Medley Relay', gender: 'Female', age: '16+', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 10, name: '4 x 50m Medley Relay', gender: 'Male', age: '16+', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4, isCheckpoint: true },
        { number: 11, name: '50m Backstroke', gender: 'Female', age: '9-11', distance: 50, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 12, name: '50m Backstroke', gender: 'Male', age: '9-11', distance: 50, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 13, name: '100m Breaststroke', gender: 'Female', age: '12-13', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 14, name: '100m Breaststroke', gender: 'Male', age: '12-13', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 15, name: '100m Backstroke', gender: 'Female', age: '14-15', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 16, name: '100m Backstroke', gender: 'Male', age: '14-15', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 17, name: '100m Butterfly', gender: 'Female', age: '16+', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 18, name: '100m Butterfly', gender: 'Male', age: '16+', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1, isCheckpoint: true },
        { number: 19, name: '50m Butterfly', gender: 'Female', age: '9-11', distance: 50, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 20, name: '50m Butterfly', gender: 'Male', age: '9-11', distance: 50, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 21, name: '100m Backstroke', gender: 'Female', age: '12-13', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 22, name: '100m Backstroke', gender: 'Male', age: '12-13', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 23, name: '100m Butterfly', gender: 'Female', age: '14-15', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 24, name: '100m Butterfly', gender: 'Male', age: '14-15', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 25, name: '100m Backstroke', gender: 'Female', age: '16+', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1 },
        { number: 26, name: '100m Backstroke', gender: 'Male', age: '16+', distance: 100, stroke: 'backstroke', isRelay: false, legs: 1, isCheckpoint: true },
        { number: 27, name: '50m Breaststroke', gender: 'Female', age: '9-11', distance: 50, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 28, name: '50m Breaststroke', gender: 'Male', age: '9-11', distance: 50, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 29, name: '100m Butterfly', gender: 'Female', age: '12-13', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 30, name: '100m Butterfly', gender: 'Male', age: '12-13', distance: 100, stroke: 'butterfly', isRelay: false, legs: 1 },
        { number: 31, name: '100m Freestyle', gender: 'Female', age: '14-15', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 32, name: '100m Freestyle', gender: 'Male', age: '14-15', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 33, name: '100m Breaststroke', gender: 'Female', age: '16+', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 34, name: '100m Breaststroke', gender: 'Male', age: '16+', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1, isCheckpoint: true },
        { number: 35, name: '50m Freestyle', gender: 'Female', age: '9-11', distance: 50, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 36, name: '50m Freestyle', gender: 'Male', age: '9-11', distance: 50, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 37, name: '100m Freestyle', gender: 'Female', age: '12-13', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 38, name: '100m Freestyle', gender: 'Male', age: '12-13', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 39, name: '100m Breaststroke', gender: 'Female', age: '14-15', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 40, name: '100m Breaststroke', gender: 'Male', age: '14-15', distance: 100, stroke: 'breaststroke', isRelay: false, legs: 1 },
        { number: 41, name: '100m Freestyle', gender: 'Female', age: '16+', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1 },
        { number: 42, name: '100m Freestyle', gender: 'Male', age: '16+', distance: 100, stroke: 'freestyle', isRelay: false, legs: 1, isCheckpoint: true },
        { number: 43, name: '4 x 50m Medley Relay', gender: 'Female', age: '9-11', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 44, name: '4 x 50m Medley Relay', gender: 'Male', age: '9-11', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 45, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '12-13', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 46, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '12-13', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 47, name: '4 x 50m Medley Relay', gender: 'Female', age: '14-15', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 48, name: '4 x 50m Medley Relay', gender: 'Male', age: '14-15', distance: 200, stroke: 'individualmedley', isRelay: true, legs: 4 },
        { number: 49, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '16+', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 50, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '16+', distance: 200, stroke: 'freestyle', isRelay: true, legs: 4 },
        { number: 51, name: '8 x 50m Mixed Squadron', gender: 'Mixed', age: 'Open', distance: 400, stroke: 'freestyle', isRelay: true, legs: 8, isCheckpoint: true }
    ];

    /**
     * Standard 8-lane points distribution: 8 pts for 1st down to 1 pt for 8th.
     */
    const STANDARD_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

    /**
     * Box-Muller transform for generating Gaussian (normal) random numbers
     * @param {number} mean
     * @param {number} stdDev
     * @returns {number}
     */
    function randomNormal(mean = 0, stdDev = 1) {
        let u1 = 0, u2 = 0;
        while (u1 === 0) u1 = Math.random();
        while (u2 === 0) u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * stdDev;
    }

    /**
     * Main RacePredictor class
     */
    class RacePredictor {
        constructor(options = {}) {
            this.clubs = options.clubs ? JSON.parse(JSON.stringify(options.clubs)) : JSON.parse(JSON.stringify(DEFAULT_CLUBS));
            this.events = options.events ? JSON.parse(JSON.stringify(options.events)) : JSON.parse(JSON.stringify(ARENA_EVENTS));
            
            // Raw or parsed seed times: [eventNumber][clubName] = { swimmerName, timeMs, timeStr, isDisqualified }
            this.seedData = {};

            // Overrides for what-if scenarios: [eventNumber][clubName] = { timeMs, isDisqualified, swimmerName }
            this.overrides = {};

            // Cached calculation of median baselines for missing clubs
            this.medianBaselines = {};

            // Default simulation settings
            this.simulationVariance = options.variance !== undefined ? options.variance : 0.012; // 1.2% realistic variation
            this.monteCarloIterations = options.iterations || 1000;
            this.relayTakeoverBonusMs = options.takeoverBonusMs !== undefined ? options.takeoverBonusMs : 600; // -0.60s per exchange

            if (options.seedData) {
                this.loadSeedData(options.seedData);
            }
        }

        /**
         * Load seed data from JSON, raw text, or structured object
         * @param {string|object} rawInput
         */
        loadSeedData(rawInput) {
            this.seedData = TimeUtils.parseRound1GalaData(rawInput);
            this.recalculateMedianBaselines();
            return this;
        }

        /**
         * Set or override an entry for a specific event and club
         * @param {number} eventNumber
         * @param {string} clubName
         * @param {object} entry - { timeMs, timeStr, isDisqualified, swimmerName }
         */
        setEntryOverride(eventNumber, clubName, entry) {
            const canonicalClub = TimeUtils.normalizeClubName(clubName);
            if (!this.overrides[eventNumber]) this.overrides[eventNumber] = {};
            
            let parsed = { ms: 0, isDisqualified: false, formatted: '0:00.00' };
            if (entry.timeMs !== undefined) {
                parsed = {
                    ms: entry.timeMs,
                    isDisqualified: entry.isDisqualified || entry.timeMs <= 0,
                    formatted: TimeUtils.formatMsToTime(entry.timeMs)
                };
            } else if (entry.timeStr !== undefined || entry.time !== undefined) {
                parsed = TimeUtils.parseTimeToMs(entry.timeStr || entry.time);
            }

            this.overrides[eventNumber][canonicalClub] = {
                swimmerName: entry.swimmerName || 'Club Swimmer',
                timeMs: parsed.ms,
                timeStr: parsed.formatted,
                isDisqualified: entry.isDisqualified !== undefined ? entry.isDisqualified : parsed.isDisqualified
            };

            this.recalculateMedianBaselines();
        }

        /**
         * Clears all manual overrides
         */
        clearOverrides() {
            this.overrides = {};
            this.recalculateMedianBaselines();
        }

        /**
         * Recalculates median baseline times for every event across all clubs with known times.
         * Used to automatically impute missing clubs or historical DQs (Median Imputation Baseline).
         */
        recalculateMedianBaselines() {
            this.medianBaselines = {};

            this.events.forEach(ev => {
                const validTimes = [];
                const evNum = ev.number;

                this.clubs.forEach(club => {
                    const canonical = TimeUtils.normalizeClubName(club.name);
                    let rawTime = null;
                    if (this.overrides[evNum] && this.overrides[evNum][canonical] && !this.overrides[evNum][canonical].isDisqualified && this.overrides[evNum][canonical].timeMs > 0) {
                        rawTime = this.overrides[evNum][canonical].timeMs;
                    } else if (this.seedData[evNum] && this.seedData[evNum][canonical] && !this.seedData[evNum][canonical].isDisqualified && this.seedData[evNum][canonical].timeMs > 0) {
                        rawTime = this.seedData[evNum][canonical].timeMs;
                    }
                    if (rawTime > 0) {
                        validTimes.push(rawTime);
                    }
                });

                if (validTimes.length > 0) {
                    validTimes.sort((a, b) => a - b);
                    const mid = Math.floor(validTimes.length / 2);
                    let median = validTimes.length % 2 !== 0 
                        ? validTimes[mid] 
                        : Math.round((validTimes[mid - 1] + validTimes[mid]) / 2);
                    this.medianBaselines[evNum] = {
                        medianMs: median,
                        count: validTimes.length,
                        formatted: TimeUtils.formatMsToTime(median)
                    };
                } else {
                    // Fallback baseline standard based on stroke and distance if no times exist
                    const defaultSec = ev.isRelay ? (ev.legs * 31) : (ev.distance === 200 ? 145 : (ev.distance === 100 ? 65 : 32));
                    const defaultMs = defaultSec * 1000;
                    this.medianBaselines[evNum] = {
                        medianMs: defaultMs,
                        count: 0,
                        formatted: TimeUtils.formatMsToTime(defaultMs)
                    };
                }
            });
        }

        /**
         * Retrieves the effective entry for an event and club, applying:
         * 1. Manual Overrides (if present)
         * 2. Seed Data from Round 1 / Timebase
         * 3. Automatic Median Imputation (if missing or past DQ)
         * 
         * NOTE: In race prediction, DQs are accidental race-day infractions and are NOT predictable.
         * Therefore, predicted entries always assume a valid swim (isDisqualified = false),
         * imputing the event median if a historical entry only had a DQ.
         * 
         * @param {number} eventNumber
         * @param {string} clubName
         * @param {boolean} [allowImputation=true]
         * @returns {{ swimmerName: string, timeMs: number, timeStr: string, isDisqualified: boolean, isImputed: boolean }}
         */
        getClubEntry(eventNumber, clubName, allowImputation = true) {
            const canonicalClub = TimeUtils.normalizeClubName(clubName);

            // 1. Manual override
            if (this.overrides[eventNumber] && this.overrides[eventNumber][canonicalClub]) {
                const o = this.overrides[eventNumber][canonicalClub];
                if (o.timeMs > 0 && !o.isDisqualified) {
                    return {
                        swimmerName: o.swimmerName,
                        timeMs: o.timeMs,
                        timeStr: o.timeStr,
                        isDisqualified: false,
                        isImputed: false,
                        isOverride: true,
                        relayLegs: o.relayLegs || null
                    };
                }
            }

            // 2. Seed Data
            if (this.seedData[eventNumber] && this.seedData[eventNumber][canonicalClub]) {
                const s = this.seedData[eventNumber][canonicalClub];
                if (!s.isDisqualified && s.timeMs > 0) {
                    return {
                        swimmerName: s.swimmerName,
                        timeMs: s.timeMs,
                        timeStr: s.timeStr,
                        isDisqualified: false,
                        isImputed: false,
                        isOverride: false
                    };
                }
            }

            if (!allowImputation) return null;

            // 3. Fallback: Median Imputation Baseline (DQs are non-predictable procedural events)
            const baseline = this.medianBaselines[eventNumber] || {
                medianMs: 65000,
                formatted: '1:05.00'
            };

            const historicalSwimmer = (this.seedData[eventNumber] && this.seedData[eventNumber][canonicalClub])
                ? this.seedData[eventNumber][canonicalClub].swimmerName
                : (this.overrides[eventNumber] && this.overrides[eventNumber][canonicalClub] ? this.overrides[eventNumber][canonicalClub].swimmerName : null);

            return {
                swimmerName: (historicalSwimmer && historicalSwimmer !== 'DQ') ? historicalSwimmer : `${canonicalClub} Swimmer`,
                timeMs: baseline.medianMs,
                timeStr: baseline.formatted,
                isDisqualified: false,
                isImputed: true,
                isOverride: false
            };
        }

        /**
         * Runs Deterministic Projection across all 51 events.
         * Sorts the 8 clubs by predicted seed time, assigns standard points (8 down to 1, 0 for DQ),
         * tracks countback for tiebreaking, and logs milestone checkpoints.
         * 
         * @returns {Object} Deterministic projection results
         */
        runDeterministicProjection() {
            // Club totals structure
            const clubScores = {};
            const countbacks = {}; // countbacks[clubName][place] = count

            this.clubs.forEach(c => {
                clubScores[c.name] = {
                    club: c,
                    totalPoints: 0,
                    checkpointScores: {},
                    eventResults: [],
                    firstPlaces: 0,
                    secondPlaces: 0,
                    thirdPlaces: 0,
                    dqCount: 0
                };
                countbacks[c.name] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
            });

            const eventProjections = [];

            this.events.forEach(ev => {
                const evNum = ev.number;
                const field = [];

                this.clubs.forEach(c => {
                    const entry = this.getClubEntry(evNum, c.name, true);
                    field.push({
                        club: c,
                        swimmerName: entry.swimmerName,
                        timeMs: entry.timeMs,
                        timeStr: entry.timeStr,
                        isDisqualified: entry.isDisqualified,
                        isImputed: entry.isImputed,
                        isOverride: entry.isOverride,
                        relayLegs: entry.relayLegs || null
                    });
                });

                // Sort: valid times ascending, DQs at the end
                field.sort((a, b) => {
                    return TimeUtils.compareTimes(a.timeMs, b.timeMs);
                });

                // Allocate standard 8-lane points (handle ties). In prediction mode, all competitors receive valid points.
                let i = 0;
                while (i < field.length) {
                    // Find ties
                    let tieEnd = i;
                    while (tieEnd + 1 < field.length && 
                           field[tieEnd + 1].timeMs === field[i].timeMs) {
                        tieEnd++;
                    }

                    const tieCount = tieEnd - i + 1;
                    let sumPoints = 0;
                    for (let p = i; p <= tieEnd; p++) {
                        sumPoints += p < STANDARD_POINTS.length ? STANDARD_POINTS[p] : 1;
                    }
                    const awardedPoints = Number((sumPoints / tieCount).toFixed(1));
                    const assignedRank = i + 1;

                    for (let p = i; p <= tieEnd; p++) {
                        field[p].rank = assignedRank;
                        field[p].points = awardedPoints;
                        
                        // Countback stats
                        if (assignedRank <= 8) {
                            countbacks[field[p].club.name][assignedRank] = (countbacks[field[p].club.name][assignedRank] || 0) + 1;
                            if (assignedRank === 1) clubScores[field[p].club.name].firstPlaces++;
                            if (assignedRank === 2) clubScores[field[p].club.name].secondPlaces++;
                            if (assignedRank === 3) clubScores[field[p].club.name].thirdPlaces++;
                        }
                    }

                    i = tieEnd + 1;
                }

                // Add to club cumulative totals
                field.forEach(f => {
                    clubScores[f.club.name].totalPoints += f.points;
                    clubScores[f.club.name].eventResults.push({
                        eventNumber: evNum,
                        eventName: ev.name,
                        rank: f.rank,
                        points: f.points,
                        timeStr: f.timeStr,
                        timeMs: f.timeMs,
                        isImputed: f.isImputed,
                        isDisqualified: f.isDisqualified,
                        cumulativePoints: clubScores[f.club.name].totalPoints
                    });

                    // Log checkpoint if this event is a milestone
                    if (ev.isCheckpoint || evNum === 10 || evNum === 18 || evNum === 26 || evNum === 34 || evNum === 42 || evNum === 51) {
                        clubScores[f.club.name].checkpointScores[evNum] = clubScores[f.club.name].totalPoints;
                    }
                });

                // Detect Swing Event opportunities in this event (< 0.30s delta)
                const swingAnalysis = this.analyzeEventSwing(field);

                eventProjections.push({
                    event: ev,
                    field: field,
                    swingAnalysis: swingAnalysis
                });
            });

            // Overall ranking with tiebreak countback
            const rankedClubs = Object.values(clubScores).sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }
                // Countback tiebreak: 1st places, then 2nd places, etc.
                for (let rank = 1; rank <= 8; rank++) {
                    const diff = (countbacks[b.club.name][rank] || 0) - (countbacks[a.club.name][rank] || 0);
                    if (diff !== 0) return diff;
                }
                return 0;
            });

            rankedClubs.forEach((c, idx) => {
                c.projectedRank = idx + 1;
            });

            return {
                rankedClubs,
                eventProjections,
                milestoneCheckpoints: [10, 18, 26, 34, 42, 51]
            };
        }

        /**
         * Analyzes a field for swing events:
         * Where time differences < 0.30s result in a 2+ point swing
         * @param {Array} field - Sorted array of club entries in the event
         * @returns {Object}
         */
        analyzeEventSwing(field) {
            let isSwingEvent = false;
            let swingPairs = [];

            for (let i = 0; i < field.length - 1; i++) {
                const current = field[i];
                const next = field[i + 1];

                if (current.isDisqualified || next.isDisqualified) continue;
                if (current.timeMs <= 0 || next.timeMs <= 0) continue;

                const deltaMs = Math.abs(next.timeMs - current.timeMs);
                if (deltaMs <= 300) { // < 0.30s (300 ms)
                    // Point differential swing
                    isSwingEvent = true;
                    swingPairs.push({
                        clubA: current.club.name,
                        clubB: next.club.name,
                        deltaMs: deltaMs,
                        deltaFormatted: (deltaMs / 1000).toFixed(2) + 's',
                        rankA: current.rank,
                        rankB: next.rank,
                        pointsDifference: current.points - next.points
                    });
                }
            }

            // Check if top 3 or top 4 are clustered within 0.5s causing a 2+ pt swing
            let clusterSwing = false;
            if (field.length >= 3 && !field[0].isDisqualified && !field[2].isDisqualified) {
                if (field[2].timeMs - field[0].timeMs <= 500) {
                    clusterSwing = true;
                    isSwingEvent = true;
                }
            }

            return {
                isSwingEvent,
                clusterSwing,
                swingPairs,
                tightestDeltaMs: swingPairs.length > 0 ? Math.min(...swingPairs.map(p => p.deltaMs)) : null
            };
        }

        /**
         * Runs Stochastic Monte Carlo Simulation
         * Perturbs seed times using Gaussian distribution: simulatedTime = seedTime * (1 + N(0, σ))
         * Runs N iterations (default 500 to 1,000) to output:
         * - Expected Mean Score ± standard deviation for each club
         * - Probability (%) of finishing 1st, 2nd, 3rd, ..., 8th
         * - Swing events volatility ranking
         * 
         * @param {number} [iterations=1000]
         * @param {number} [variance=0.012] - Realistic Variance slider (0% to 2.5%, e.g., 0.012 = 1.2%)
         * @returns {Object} Monte Carlo simulation results
         */
        runMonteCarloSimulation(iterations = null, variance = null) {
            const numRuns = iterations || this.monteCarloIterations;
            const sigma = variance !== undefined ? variance : this.simulationVariance;

            // Tracking per club
            const clubStats = {};
            this.clubs.forEach(c => {
                clubStats[c.name] = {
                    club: c,
                    scores: new Float64Array(numRuns),
                    ranks: new Int32Array(numRuns),
                    rankCounts: new Array(9).fill(0), // index 1..8
                    eventPointVariances: {} // [eventNum] = array of points
                };
            });

            // Pre-fetch entries to minimize lookups
            const preparedEvents = this.events.map(ev => {
                const evNum = ev.number;
                const fieldEntries = this.clubs.map(c => {
                    const entry = this.getClubEntry(evNum, c.name, true);
                    return {
                        clubName: c.name,
                        timeMs: entry.timeMs,
                        isDisqualified: entry.isDisqualified
                    };
                });
                return {
                    number: evNum,
                    entries: fieldEntries
                };
            });

            // Track swing events volatility
            const eventVolatility = {};
            this.events.forEach(ev => {
                eventVolatility[ev.number] = {
                    event: ev,
                    positionChanges: 0,
                    seedDeltaTightest: 999999,
                    simulatedPointSpread: []
                };
            });

            // Simulation loop
            for (let run = 0; run < numRuns; run++) {
                const runTotals = {};
                this.clubs.forEach(c => { runTotals[c.name] = 0; });

                preparedEvents.forEach(ev => {
                    const simulatedField = [];

                    ev.entries.forEach(entry => {
                        let simTime = entry.timeMs > 0 ? entry.timeMs : 65000;
                        if (sigma > 0) {
                            // Perturb seed time with Gaussian noise
                            const noise = randomNormal(0, sigma);
                            simTime = Math.max(1000, Math.round(simTime * (1 + noise)));
                        }

                        simulatedField.push({
                            clubName: entry.clubName,
                            timeMs: simTime,
                            isDisqualified: false
                        });
                    });

                    // Sort simulated field
                    simulatedField.sort((a, b) => a.timeMs - b.timeMs);

                    // Award points
                    let i = 0;
                    while (i < simulatedField.length) {
                        let tieEnd = i;
                        while (tieEnd + 1 < simulatedField.length && 
                               simulatedField[tieEnd + 1].timeMs === simulatedField[i].timeMs) {
                            tieEnd++;
                        }

                        const tieCount = tieEnd - i + 1;
                        let sumPoints = 0;
                        for (let p = i; p <= tieEnd; p++) {
                            sumPoints += p < STANDARD_POINTS.length ? STANDARD_POINTS[p] : 1;
                        }
                        const awardedPoints = sumPoints / tieCount;

                        for (let p = i; p <= tieEnd; p++) {
                            runTotals[simulatedField[p].clubName] += awardedPoints;
                        }

                        i = tieEnd + 1;
                    }
                });

                // Rank clubs for this run
                const sortedClubsThisRun = this.clubs.map(c => ({
                    name: c.name,
                    score: runTotals[c.name]
                })).sort((a, b) => b.score - a.score);

                sortedClubsThisRun.forEach((sc, rankIdx) => {
                    const finishRank = rankIdx + 1;
                    clubStats[sc.name].scores[run] = sc.score;
                    clubStats[sc.name].ranks[run] = finishRank;
                    clubStats[sc.name].rankCounts[finishRank]++;
                });
            }

            // Aggregate metrics (Mean, StdDev, Win Probabilities)
            const aggregatedClubs = this.clubs.map(c => {
                const stats = clubStats[c.name];
                const scores = stats.scores;
                let sum = 0;
                for (let i = 0; i < numRuns; i++) sum += scores[i];
                const mean = sum / numRuns;

                let varianceSum = 0;
                for (let i = 0; i < numRuns; i++) {
                    const diff = scores[i] - mean;
                    varianceSum += diff * diff;
                }
                const stdDev = Math.sqrt(varianceSum / numRuns);

                // Probability of 1st, 2nd, 3rd, etc.
                const finishProbabilities = {};
                for (let r = 1; r <= 8; r++) {
                    finishProbabilities[r] = Number(((stats.rankCounts[r] / numRuns) * 100).toFixed(1));
                }

                // Min and max scores
                let minScore = scores[0];
                let maxScore = scores[0];
                for (let i = 1; i < numRuns; i++) {
                    if (scores[i] < minScore) minScore = scores[i];
                    if (scores[i] > maxScore) maxScore = scores[i];
                }

                return {
                    club: c,
                    meanScore: Number(mean.toFixed(1)),
                    stdDev: Number(stdDev.toFixed(2)),
                    minScore: Math.round(minScore),
                    maxScore: Math.round(maxScore),
                    winProbability: finishProbabilities[1],
                    top3Probability: Number((finishProbabilities[1] + finishProbabilities[2] + finishProbabilities[3]).toFixed(1)),
                    finishProbabilities
                };
            });

            // Sort by expected mean score
            aggregatedClubs.sort((a, b) => b.meanScore - a.meanScore);
            aggregatedClubs.forEach((c, idx) => {
                c.projectedRank = idx + 1;
            });

            // Find top swing events by examining close seed deltas (< 0.30s)
            const deterministicRun = this.runDeterministicProjection();
            const swingEvents = deterministicRun.eventProjections
                .filter(ep => ep.swingAnalysis.isSwingEvent)
                .map(ep => ({
                    eventNumber: ep.event.number,
                    eventName: ep.event.name,
                    tightestDeltaMs: ep.swingAnalysis.tightestDeltaMs,
                    tightestDeltaStr: ep.swingAnalysis.tightestDeltaMs !== null ? (ep.swingAnalysis.tightestDeltaMs / 1000).toFixed(2) + 's' : '—',
                    swingPairs: ep.swingAnalysis.swingPairs
                }))
                .sort((a, b) => (a.tightestDeltaMs || 9999) - (b.tightestDeltaMs || 9999));

            return {
                iterations: numRuns,
                variance: sigma,
                aggregatedClubs,
                swingEvents,
                deterministicRun
            };
        }

        /**
         * Generates Head-to-Head Comparison Matrix between two specific clubs
         * Highlights where Club A has advantage, Club B has advantage, or Swing Event battles (< 0.30s).
         * 
         * @param {string} clubAName
         * @param {string} clubBName
         * @returns {Object}
         */
        getHeadToHeadMatrix(clubAName, clubBName) {
            const canonicalA = TimeUtils.normalizeClubName(clubAName);
            const canonicalB = TimeUtils.normalizeClubName(clubBName);

            const clubA = this.clubs.find(c => TimeUtils.normalizeClubName(c.name) === canonicalA) || { name: canonicalA };
            const clubB = this.clubs.find(c => TimeUtils.normalizeClubName(c.name) === canonicalB) || { name: canonicalB };

            const deterministic = this.runDeterministicProjection();

            let scoreA = 0;
            let scoreB = 0;
            let winsA = 0;
            let winsB = 0;
            let ties = 0;
            let swingBattlesCount = 0;

            const eventsMatrix = [];

            this.events.forEach(ev => {
                const evNum = ev.number;
                const proj = deterministic.eventProjections.find(p => p.event.number === evNum);
                const field = proj ? proj.field : [];

                const resA = field.find(f => TimeUtils.normalizeClubName(f.club.name) === canonicalA);
                const resB = field.find(f => TimeUtils.normalizeClubName(f.club.name) === canonicalB);

                const timeA = resA ? resA.timeMs : 0;
                const timeB = resB ? resB.timeMs : 0;
                const ptsA = resA ? resA.points : 0;
                const ptsB = resB ? resB.points : 0;

                scoreA += ptsA;
                scoreB += ptsB;

                let deltaMs = null;
                let deltaStr = '—';
                let advantage = 'Even';
                let isSwing = false;

                if (resA && resB && timeA > 0 && timeB > 0) {
                    deltaMs = timeB - timeA; // positive means A is faster
                    const absDelta = Math.abs(deltaMs);
                    deltaStr = (absDelta / 1000).toFixed(2) + 's';

                    if (absDelta <= 300) { // <= 0.30s is a Swing Battle!
                        advantage = 'Swing Battle';
                        isSwing = true;
                        swingBattlesCount++;
                    } else if (deltaMs > 0) {
                        advantage = clubA.name;
                    } else {
                        advantage = clubB.name;
                    }

                    if (timeA < timeB) winsA++;
                    else if (timeB < timeA) winsB++;
                    else ties++;
                } else {
                    ties++;
                }

                eventsMatrix.push({
                    eventNumber: evNum,
                    eventName: ev.name,
                    isRelay: ev.isRelay,
                    clubA: {
                        name: clubA.name,
                        timeStr: resA ? resA.timeStr : 'DQ',
                        timeMs: timeA,
                        rank: resA ? resA.rank : 8,
                        points: ptsA,
                        isImputed: resA ? resA.isImputed : false
                    },
                    clubB: {
                        name: clubB.name,
                        timeStr: resB ? resB.timeStr : 'DQ',
                        timeMs: timeB,
                        rank: resB ? resB.rank : 8,
                        points: ptsB,
                        isImputed: resB ? resB.isImputed : false
                    },
                    pointsDifferential: ptsA - ptsB, // positive = A ahead
                    timeDeltaMs: deltaMs,
                    timeDeltaStr: deltaStr,
                    advantage,
                    isSwing
                });
            });

            return {
                clubA,
                clubB,
                totalPointsA: scoreA,
                totalPointsB: scoreB,
                pointDifferential: scoreA - scoreB,
                winsA,
                winsB,
                ties,
                swingBattlesCount,
                eventsMatrix
            };
        }

        /**
         * Relay Split Estimator
         * Computes projected relay time from 4 flat 50m times with rolling takeover bonus (-0.60s per exchange).
         * Compares against existing field seed times in that relay event to project finish position & points.
         * 
         * @param {number} eventNumber - Target relay event number
         * @param {number[]} swimmerFlatTimesMs - Array of individual 50m flat times in ms
         * @param {number} [takeoverBonusMs=600] - Rolling takeover bonus in ms
         * @param {string} [targetClub='Weston S Mare']
         * @returns {Object}
         */
        projectRelayPerformance(eventNumber, swimmerFlatTimesMs, takeoverBonusMs = 600, targetClub = 'Weston S Mare') {
            const canonicalTarget = TimeUtils.normalizeClubName(targetClub);
            let targetEvNumber = eventNumber;
            let ev = this.events.find(e => e.number === eventNumber);

            // If eventNumber is 50, but swimmerFlatTimesMs has 8 legs (or represents 8x50m Cannon)
            // and event 51 exists in this.events with legs: 8, link targetEvNumber to event 51 for opponent times
            if (Array.isArray(swimmerFlatTimesMs) && swimmerFlatTimesMs.length === 8 && ev && ev.legs !== 8) {
                const cannonEv = this.events.find(e => e.legs === 8 || e.number === 51 || (e.name && (e.name.toLowerCase().includes('cannon') || e.name.toLowerCase().includes('squadron'))));
                if (cannonEv) {
                    targetEvNumber = cannonEv.number;
                    ev = cannonEv;
                }
            } else if (!ev) {
                ev = { number: eventNumber, name: `Event ${eventNumber} Relay`, isRelay: true, legs: Array.isArray(swimmerFlatTimesMs) ? swimmerFlatTimesMs.length : 4 };
            }

            const relayCalc = TimeUtils.calculateRelayTime(swimmerFlatTimesMs, takeoverBonusMs);

            // Fetch current opponents' seed times
            const opponents = [];
            this.clubs.forEach(c => {
                const cName = TimeUtils.normalizeClubName(c.name);
                if (cName !== canonicalTarget) {
                    const entry = this.getClubEntry(targetEvNumber, c.name, true);
                    opponents.push({
                        club: c,
                        timeMs: entry.timeMs,
                        timeStr: entry.timeStr,
                        isDisqualified: entry.isDisqualified
                    });
                }
            });

            // Insert projected relay performance
            const fullField = [
                ...opponents,
                {
                    club: this.clubs.find(c => TimeUtils.normalizeClubName(c.name) === canonicalTarget) || { name: canonicalTarget },
                    timeMs: relayCalc.totalMs,
                    timeStr: relayCalc.formatted,
                    isDisqualified: relayCalc.totalMs <= 0,
                    isProjectedRelay: true
                }
            ];

            fullField.sort((a, b) => TimeUtils.compareTimes(a.timeMs, b.timeMs));

            let projectedRank = 8;
            let projectedPoints = 1;

            fullField.forEach((item, idx) => {
                if (item.isProjectedRelay) {
                    projectedRank = idx + 1;
                    projectedPoints = item.isDisqualified ? 0 : (projectedRank <= 8 ? STANDARD_POINTS[projectedRank - 1] : 1);
                }
            });

            return {
                event: ev,
                targetClub: canonicalTarget,
                swimmerFlatTimesMs,
                takeoverBonusMs,
                totalExchanges: Math.max(0, swimmerFlatTimesMs.length - 1),
                compositeTimeMs: relayCalc.totalMs,
                compositeTimeFormatted: relayCalc.formatted,
                rawSumMs: relayCalc.rawSumMs,
                rawSumFormatted: TimeUtils.formatMsToTime(relayCalc.rawSumMs),
                bonusMs: relayCalc.bonusMs,
                flatStartPenaltyMs: relayCalc.flatStartPenaltyMs,
                flyingStartDeltaMs: relayCalc.flyingStartDeltaMs,
                legSplitsMs: relayCalc.legSplitsMs,
                projectedRank,
                projectedPoints,
                field: fullField,
                fieldComparison: fullField
            };
        }

        /**
         * Compares Weston SC performance between Division 1 Benchmark Points (e.g. 130 pts)
         * and Gala Head-to-Head Simulation Points (e.g. 139.5 pts).
         * 
         * @param {Object} [benchmarkSimData] - Result from /api/simulation
         * @returns {Object} Mismatch analysis and event-by-event comparison
         */
        getScoreAlignmentAnalysis(benchmarkSimData = null) {
            const det = this.runDeterministicProjection();
            const westonH2H = det.rankedClubs.find(c => c.club.name === 'Weston S Mare');
            const h2hTotalPoints = westonH2H ? westonH2H.totalPoints : 0;
            const benchmarkTotalPoints = benchmarkSimData ? benchmarkSimData.total_projected_points : 130;

            const comparisons = [];
            let totalUpside = 0;
            let totalRisk = 0;
            let upsideCount = 0;
            let riskCount = 0;
            let alignedCount = 0;

            det.eventProjections.forEach((ep, idx) => {
                const evNum = ep.event.number;
                const field = ep.field;
                const westonField = field.find(f => f.club.name === 'Weston S Mare');
                const h2hRank = westonField ? westonField.rank : 8;
                const h2hPts = westonField ? westonField.points : 1;
                const timeStr = westonField ? westonField.timeStr : '—';
                const timeMs = westonField ? westonField.timeMs : 0;
                const swimmer = westonField ? westonField.swimmerName : 'Weston Swimmer';
                const relayLegs = westonField ? westonField.relayLegs : null;

                let benchPlace = 8;
                let benchPts = 1;
                if (benchmarkSimData && benchmarkSimData.event_simulations) {
                    const es = benchmarkSimData.event_simulations.find(s => s.race_no === evNum) || benchmarkSimData.event_simulations[idx];
                    if (es) {
                        benchPlace = es.projected_place;
                        benchPts = es.projected_points;
                    }
                }

                const delta = Number((h2hPts - benchPts).toFixed(1));
                let classification = 'aligned';
                if (delta > 0) {
                    classification = 'upside';
                    totalUpside += delta;
                    upsideCount++;
                } else if (delta < 0) {
                    classification = 'risk';
                    totalRisk += Math.abs(delta);
                    riskCount++;
                } else {
                    alignedCount++;
                }

                const wIdx = field.findIndex(f => f.club.name === 'Weston S Mare');
                let rivalAhead = null;
                let rivalBehind = null;
                if (wIdx > 0) {
                    const ra = field[wIdx - 1];
                    const gapSec = ((timeMs - ra.timeMs) / 1000).toFixed(2);
                    rivalAhead = { club: ra.club.name, timeStr: ra.timeStr, gap: gapSec + 's' };
                }
                if (wIdx < field.length - 1) {
                    const rb = field[wIdx + 1];
                    const gapSec = ((rb.timeMs - timeMs) / 1000).toFixed(2);
                    rivalBehind = { club: rb.club.name, timeStr: rb.timeStr, gap: gapSec + 's' };
                }

                comparisons.push({
                    eventNumber: evNum,
                    eventName: ep.event.name,
                    age: ep.event.age,
                    gender: ep.event.gender,
                    stroke: ep.event.stroke,
                    distance: ep.event.distance,
                    isRelay: ep.event.isRelay,
                    swimmerName: swimmer,
                    relayLegs: relayLegs,
                    timeStr,
                    timeMs,
                    benchPlace,
                    benchPts,
                    h2hRank,
                    h2hPts,
                    delta,
                    classification,
                    rivalAhead,
                    rivalBehind
                });
            });

            return {
                benchmarkTotalPoints,
                h2hTotalPoints,
                netVariance: Number((h2hTotalPoints - benchmarkTotalPoints).toFixed(1)),
                totalUpside: Number(totalUpside.toFixed(1)),
                totalRisk: Number(totalRisk.toFixed(1)),
                upsideCount,
                riskCount,
                alignedCount,
                comparisons
            };
        }
    }

    // Export helpers & class
    RacePredictor.DEFAULT_CLUBS = DEFAULT_CLUBS;
    RacePredictor.ARENA_EVENTS = ARENA_EVENTS;
    RacePredictor.STANDARD_POINTS = STANDARD_POINTS;

    return RacePredictor;
}));
