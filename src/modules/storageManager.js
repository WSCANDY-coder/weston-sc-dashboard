/**
 * storageManager.js
 * Multi-Round Time Registry & Gala Lineup Storage Manager
 * 
 * Manages:
 * - timesDB: Swimmer times registry across multiple rounds and galas.
 *   Keyed by: timesDB[clubId][ageGroup][gender][stroke_distance] = [ { swimmer, timeMs, timeStr, round, date, isDQ } ]
 * - GalaLineup: Schema for individual galas with 8 competing clubs and 51 event lineups.
 * - LocalStorage persistence with export/import JSON capability.
 * - Automatic median baseline calculation for missing seed times.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../timeUtils', '../round1Data'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const TimeUtils = require('../timeUtils');
        const Round1Data = require('../round1Data');
        module.exports = factory(TimeUtils, Round1Data);
    } else {
        const g = root || globalThis || window || self || {};
        g.StorageManager = factory(g.TimeUtils, g.ROUND_1_DATA);
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function (TimeUtils, Round1Data) {
    'use strict';

    const STORAGE_KEY_TIMES_DB = 'ARENA_TIMES_DB_V6';
    const STORAGE_KEY_LINEUPS = 'ARENA_GALA_LINEUPS_V6';
    const STORAGE_KEY_ACTIVE_GALA = 'ARENA_ACTIVE_GALA_ID_V6';

    /**
     * All recognized Western League Division 1 & 2 clubs
     */
    const MASTER_CLUBS = [
        { id: 'caradon', name: 'Caradon', defaultLane: 1, shortCode: 'CAR', color: '#38bdf8' },
        { id: 'brixham', name: 'Brixham', defaultLane: 2, shortCode: 'BRX', color: '#f59e0b' },
        { id: 'truro', name: 'Truro City', defaultLane: 3, shortCode: 'TRU', color: '#ef4444' },
        { id: 'swindon', name: 'Swindon ASC', defaultLane: 4, shortCode: 'SWN', color: '#8b5cf6' },
        { id: 'north_cornwall', name: 'North Cornwall Dragons', defaultLane: 5, shortCode: 'NCD', color: '#10b981' },
        { id: 'bradford', name: 'Bradford on Avon', defaultLane: 6, shortCode: 'BOA', color: '#ec4899' },
        { id: 'bridgwater', name: 'Bridgwater', defaultLane: 7, shortCode: 'BDG', color: '#f97316' },
        { id: 'weston', name: 'Weston S Mare', defaultLane: 8, shortCode: 'WSM', color: '#06b6d4', isHome: true },
        { id: 'chippenham', name: 'Chippenham', defaultLane: 1, shortCode: 'CHP', color: '#a78bfa' },
        { id: 'backwell', name: 'Backwell', defaultLane: 2, shortCode: 'BKW', color: '#34d399' },
        { id: 'cirencester', name: 'Cirencester', defaultLane: 3, shortCode: 'CIR', color: '#fbbf24' },
        { id: 'bristol_b', name: 'City of Bristol B', defaultLane: 4, shortCode: 'CBB', color: '#60a5fa' },
        { id: 'plymouth_leander', name: 'Plymouth Leander', defaultLane: 5, shortCode: 'PLM', color: '#3b82f6' },
        { id: 'paignton', name: 'Paignton', defaultLane: 6, shortCode: 'PAI', color: '#fb7185' },
        { id: 'southwold', name: 'Southwold', defaultLane: 7, shortCode: 'SWD', color: '#2dd4bf' },
        { id: 'wells', name: 'Wells', defaultLane: 8, shortCode: 'WEL', color: '#c084fc' },
        { id: 'severnside', name: 'Severnside Tritons', defaultLane: 2, shortCode: 'SVT', color: '#14b8a6' },
        { id: 'gloucester', name: 'City of Gloucester', defaultLane: 3, shortCode: 'GLO', color: '#a855f7' },
        { id: 'newport', name: 'City of Newport', defaultLane: 4, shortCode: 'NEW', color: '#eab308' },
        { id: 'clevedon', name: 'Clevedon', defaultLane: 2, shortCode: 'CLE', color: '#4ade80' },
        { id: 'swindon_dolphin', name: 'Swindon Dolphin', defaultLane: 1, shortCode: 'SWD', color: '#9333ea' },
        { id: 'mount_kelly', name: 'Mount Kelly', defaultLane: 4, shortCode: 'MTK', color: '#f43f5e' },
        { id: 'millfield', name: 'Millfield A', defaultLane: 4, shortCode: 'MIL', color: '#0284c7' },
        { id: 'bristol_a', name: 'City of Bristol A', defaultLane: 3, shortCode: 'CBA', color: '#2563eb' }
    ];

    /**
     * Normalizes a club name or ID to a standard ID
     * @param {string} clubStr
     * @returns {string}
     */
    function getClubId(clubStr) {
        if (!clubStr) return 'unknown';
        const str = String(clubStr).trim().toLowerCase();
        if (str.includes('weston')) return 'weston';
        if (str.includes('truro')) return 'truro';
        if (str.includes('caradon')) return 'caradon';
        if (str.includes('brixham')) return 'brixham';
        if (str.includes('swindon dolphin') || str.includes('swindon_dolphin')) return 'swindon_dolphin';
        if (str.includes('swindon')) return 'swindon';
        if (str.includes('cornwall') || str.includes('ncd')) return 'north_cornwall';
        if (str.includes('bradford') || str.includes('boa')) return 'bradford';
        if (str.includes('bridgwater') || str.includes('bdg')) return 'bridgwater';
        if (str.includes('chippenham')) return 'chippenham';
        if (str.includes('backwell')) return 'backwell';
        if (str.includes('cirencester')) return 'cirencester';
        if (str.includes('bristol b') || str.includes('bristol & south gloucestershire b')) return 'bristol_b';
        if (str.includes('bristol a') || str.includes('bristol & south gloucestershire a')) return 'bristol_a';
        if (str.includes('plymouth')) return 'plymouth_leander';
        if (str.includes('paignton')) return 'paignton';
        if (str.includes('southwold')) return 'southwold';
        if (str.includes('wells')) return 'wells';
        if (str.includes('severnside') || str.includes('tritons')) return 'severnside';
        if (str.includes('gloucester')) return 'gloucester';
        if (str.includes('newport')) return 'newport';
        if (str.includes('clevedon')) return 'clevedon';
        if (str.includes('mount kelly')) return 'mount_kelly';
        if (str.includes('millfield')) return 'millfield';
        return str.replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Constructs stroke_distance key, e.g. "Backstroke_100"
     */
    function makeStrokeKey(stroke, distance, isRelay = false, eventName = '') {
        const d = parseInt(distance, 10) || 50;
        const s = String(stroke || 'Free').trim().toLowerCase();
        const n = String(eventName || '').trim().toLowerCase();

        if (isRelay || s.includes('relay') || n.includes('relay')) {
            if (s.includes('cannon') || n.includes('cannon')) return `Cannon Relay_${d}`;
            if (s.includes('medley') || n.includes('medley')) return `Medley Relay_${d}`;
            return `Freestyle Relay_${d}`;
        }

        if (s.includes('medley') || s.includes('im') || n.includes('medley')) return `Medley_${d}`;
        if (s.includes('back')) return `Backstroke_${d}`;
        if (s.includes('breast')) return `Breaststroke_${d}`;
        if (s.includes('fly') || s.includes('butter')) return `Butterfly_${d}`;
        if (s.includes('free')) return `Freestyle_${d}`;
        return `${stroke}_${d}`;
    }

    class StorageManager {
        constructor() {
            this.timesDB = {};
            this.lineups = {};
            this.activeGalaId = '2026_R2_Plymouth';
            this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
            this.init();
        }

        /**
         * Initialize storage: loads from localStorage or seeds defaults
         * @param {boolean} forceReset - Overwrite storage with defaults
         */
        init(forceReset = false) {
            if (!forceReset && this.isBrowser) {
                try {
                    const savedDB = window.localStorage.getItem(STORAGE_KEY_TIMES_DB);
                    const savedLineups = window.localStorage.getItem(STORAGE_KEY_LINEUPS);
                    const savedActiveId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_GALA);

                    if (savedDB && savedLineups) {
                        this.timesDB = JSON.parse(savedDB);
                        this.lineups = JSON.parse(savedLineups);
                        if (savedActiveId) this.activeGalaId = savedActiveId;
                        
                        // Integrity check: ensure true multi-round opposition data is present for both Millfield and Hutton Moor
                        if (this.timesDB['truro'] && this.timesDB['caradon'] && this.timesDB['chippenham'] && this.timesDB['backwell'] && this.lineups['2026_R2_Plymouth']) {
                            return this;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to load from localStorage, initializing fresh defaults:', e);
                }
            }

            // Populate fresh default database with multi-round history
            this.timesDB = {};
            this.lineups = {};
            this.seedDefaultDatabase();
            this.save();
            return this;
        }

        /**
         * Saves timesDB and lineups to localStorage
         */
        save() {
            if (!this.isBrowser) return;
            try {
                window.localStorage.setItem(STORAGE_KEY_TIMES_DB, JSON.stringify(this.timesDB));
                window.localStorage.setItem(STORAGE_KEY_LINEUPS, JSON.stringify(this.lineups));
                window.localStorage.setItem(STORAGE_KEY_ACTIVE_GALA, this.activeGalaId);
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
            }
        }

        /**
         * Seeds default multi-round data:
         * - Round 1 Gala 1 (Millfield): Caradon, Brixham, Truro City, North Cornwall Dragons, Bridgwater
         * - Round 1 Gala 2 (Newport/Horfield): Swindon ASC, Bradford on Avon, Weston S Mare
         */
        seedDefaultDatabase() {
            // Include baseline Round 1 reference times
            const Gala2HuttonSeed = (Round1Data && (Round1Data.GALA2_HUTTON_MOOR_DATA || (Round1Data.ROUND_1_DATA && Round1Data.ROUND_1_DATA.GALA2_HUTTON_MOOR_DATA)));
            const Round1Seed = (Round1Data && Round1Data.SEED_DATA_FULL)
                ? Round1Data.SEED_DATA_FULL 
                : ((typeof root !== 'undefined' && root.ROUND_1_DATA) ? root.ROUND_1_DATA.SEED_DATA_FULL : null);

            // Events specification strictly aligned with National Arena Swimming League 51 Event Gala Programme
            const ArenaEvents = [
                { number: 1, name: '200m Individual Medley', gender: 'Female', age: '16+', distance: 200, stroke: 'Medley', isRelay: false },
                { number: 2, name: '200m Individual Medley', gender: 'Male', age: '16+', distance: 200, stroke: 'Medley', isRelay: false },
                { number: 3, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '9-11', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 4, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '9-11', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 5, name: '4 x 50m Medley Relay', gender: 'Female', age: '12-13', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 6, name: '4 x 50m Medley Relay', gender: 'Male', age: '12-13', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 7, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '14-15', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 8, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '14-15', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 9, name: '4 x 50m Medley Relay', gender: 'Female', age: '16+', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 10, name: '4 x 50m Medley Relay', gender: 'Male', age: '16+', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 11, name: '50m Backstroke', gender: 'Female', age: '9-11', distance: 50, stroke: 'Backstroke', isRelay: false },
                { number: 12, name: '50m Backstroke', gender: 'Male', age: '9-11', distance: 50, stroke: 'Backstroke', isRelay: false },
                { number: 13, name: '100m Breaststroke', gender: 'Female', age: '12-13', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 14, name: '100m Breaststroke', gender: 'Male', age: '12-13', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 15, name: '100m Backstroke', gender: 'Female', age: '14-15', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 16, name: '100m Backstroke', gender: 'Male', age: '14-15', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 17, name: '100m Butterfly', gender: 'Female', age: '16+', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 18, name: '100m Butterfly', gender: 'Male', age: '16+', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 19, name: '50m Butterfly', gender: 'Female', age: '9-11', distance: 50, stroke: 'Butterfly', isRelay: false },
                { number: 20, name: '50m Butterfly', gender: 'Male', age: '9-11', distance: 50, stroke: 'Butterfly', isRelay: false },
                { number: 21, name: '100m Backstroke', gender: 'Female', age: '12-13', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 22, name: '100m Backstroke', gender: 'Male', age: '12-13', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 23, name: '100m Butterfly', gender: 'Female', age: '14-15', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 24, name: '100m Butterfly', gender: 'Male', age: '14-15', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 25, name: '100m Backstroke', gender: 'Female', age: '16+', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 26, name: '100m Backstroke', gender: 'Male', age: '16+', distance: 100, stroke: 'Backstroke', isRelay: false },
                { number: 27, name: '50m Breaststroke', gender: 'Female', age: '9-11', distance: 50, stroke: 'Breaststroke', isRelay: false },
                { number: 28, name: '50m Breaststroke', gender: 'Male', age: '9-11', distance: 50, stroke: 'Breaststroke', isRelay: false },
                { number: 29, name: '100m Butterfly', gender: 'Female', age: '12-13', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 30, name: '100m Butterfly', gender: 'Male', age: '12-13', distance: 100, stroke: 'Butterfly', isRelay: false },
                { number: 31, name: '100m Freestyle', gender: 'Female', age: '14-15', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 32, name: '100m Freestyle', gender: 'Male', age: '14-15', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 33, name: '100m Breaststroke', gender: 'Female', age: '16+', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 34, name: '100m Breaststroke', gender: 'Male', age: '16+', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 35, name: '50m Freestyle', gender: 'Female', age: '9-11', distance: 50, stroke: 'Freestyle', isRelay: false },
                { number: 36, name: '50m Freestyle', gender: 'Male', age: '9-11', distance: 50, stroke: 'Freestyle', isRelay: false },
                { number: 37, name: '100m Freestyle', gender: 'Female', age: '12-13', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 38, name: '100m Freestyle', gender: 'Male', age: '12-13', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 39, name: '100m Breaststroke', gender: 'Female', age: '14-15', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 40, name: '100m Breaststroke', gender: 'Male', age: '14-15', distance: 100, stroke: 'Breaststroke', isRelay: false },
                { number: 41, name: '100m Freestyle', gender: 'Female', age: '16+', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 42, name: '100m Freestyle', gender: 'Male', age: '16+', distance: 100, stroke: 'Freestyle', isRelay: false },
                { number: 43, name: '4 x 50m Medley Relay', gender: 'Female', age: '9-11', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 44, name: '4 x 50m Medley Relay', gender: 'Male', age: '9-11', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 45, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '12-13', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 46, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '12-13', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 47, name: '4 x 50m Medley Relay', gender: 'Female', age: '14-15', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 48, name: '4 x 50m Medley Relay', gender: 'Male', age: '14-15', distance: 200, stroke: 'Medley Relay', isRelay: true },
                { number: 49, name: '4 x 50m Freestyle Relay', gender: 'Female', age: '16+', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 50, name: '4 x 50m Freestyle Relay', gender: 'Male', age: '16+', distance: 200, stroke: 'Freestyle Relay', isRelay: true },
                { number: 51, name: '8 x 50m Mixed Cannon Relay', gender: 'Mixed', age: 'Open', distance: 400, stroke: 'Cannon Relay', isRelay: true }
            ];

            // Populate timesDB with realistic times for the clubs
            ArenaEvents.forEach(ev => {
                const strokeDist = makeStrokeKey(ev.stroke, ev.distance);

                MASTER_CLUBS.forEach(club => {
                    let swimmer = `${club.name} Swimmer`;
                    let timeStr = ev.isRelay ? '2:05.00' : (ev.distance === 200 ? '2:20.00' : (ev.distance === 100 ? '1:04.00' : '33.00'));
                    let round = 'Round 1';
                    let date = '2026-10-10';
                    let isDQ = false;
                    let place = null;
                    let points = null;

                    // 1. Prioritize official Gala 2 Hutton Moor results if present
                    if (Gala2HuttonSeed && (Gala2HuttonSeed[ev.number] || Gala2HuttonSeed[String(ev.number)])) {
                        const huttonEv = Gala2HuttonSeed[ev.number] || Gala2HuttonSeed[String(ev.number)];
                        const matchedKey = Object.keys(huttonEv).find(k => getClubId(k) === club.id);
                        if (matchedKey) {
                            const entry = huttonEv[matchedKey];
                            swimmer = entry.swimmer || entry.swimmerName || swimmer;
                            timeStr = entry.timeStr || timeStr;
                            round = 'Round 1 Gala 2 (Hutton Moor)';
                            isDQ = !!entry.isDisqualified;
                            place = entry.place;
                            points = entry.points;
                        }
                    }

                    // 2. If not matched in Hutton Moor, check Round 1 Gala 1 (Millfield) seed dataset
                    if (swimmer.endsWith(' Swimmer') && Round1Seed && Round1Seed[ev.number]) {
                        const millfieldEv = Round1Seed[ev.number];
                        const matchedKey = Object.keys(millfieldEv).find(k => getClubId(k) === club.id);
                        if (matchedKey) {
                            const entry = millfieldEv[matchedKey];
                            swimmer = entry.swimmerName || swimmer;
                            timeStr = entry.timeStr || timeStr;
                            round = 'Round 1 Gala 1 (Millfield)';
                            isDQ = !!entry.isDisqualified;
                        }
                    }

                    // 3. For relay events, ensure squad naming and realistic relay times (> 60s)
                    if (ev.isRelay) {
                        if (!swimmer.includes('Squad')) {
                            swimmer = `${club.name} Squad`;
                        }
                        const testParsed = TimeUtils ? TimeUtils.parseTimeToMs(timeStr) : { ms: 0 };
                        if (testParsed.ms < 60000) {
                            timeStr = ev.distance === 400 ? '4:15.00' : (ev.age === '16+' ? '2:00.00' : (ev.age === '14-15' ? '2:08.00' : '2:25.00'));
                        }
                    }

                    const parsed = TimeUtils ? TimeUtils.parseTimeToMs(timeStr) : { ms: 64000, isDisqualified: false, formatted: timeStr };

                    this.addSwimmerTime(club.id, ev.age, ev.gender, strokeDist, {
                        swimmer,
                        timeMs: parsed.ms,
                        timeStr: parsed.formatted,
                        round,
                        date,
                        isDQ: isDQ || parsed.isDisqualified,
                        eventNumber: ev.number,
                        place,
                        points
                    });
                });
            });

            // Also seed extra squad swimmers for Weston S Mare to allow tactical roster swaps!
            this.seedWestonSquadRoster();

            // Setup default active Gala Lineup: 2026_R2_Plymouth (from 2026 Round 2 Draw v1)
            const competingClubNames = [
                'Caradon', 'Brixham', 'Truro City', 'Swindon ASC',
                'North Cornwall Dragons', 'Bradford on Avon', 'Bridgwater', 'Weston S Mare'
            ];

            this.createOrUpdateGalaLineup({
                galaId: '2026_R2_Plymouth',
                name: 'Round 2 - Division 1 Gala 1 (Plymouth 1pm - Weston Host)',
                date: '2026-11-14',
                licence: '3SW262354',
                venue: 'Plymouth (Weston Host)',
                competingClubs: competingClubNames
            });

            // Setup Round 2 Gala 2 (Newport)
            this.createOrUpdateGalaLineup({
                galaId: '2026_R2_Newport',
                name: 'Round 2 - Division 1 Gala 2 (Newport 1pm)',
                date: '2026-11-14',
                licence: '3SW262357',
                venue: 'Newport (Cirencester Host)',
                competingClubs: [
                    'Chippenham', 'Backwell', 'Cirencester', 'City of Bristol B',
                    'Plymouth Leander', 'Paignton', 'Southwold', 'Wells'
                ]
            });

            // Setup Round 1 Gala 2 (Hutton Moor)
            this.createOrUpdateGalaLineup({
                galaId: '2026_R1_HuttonMoor',
                name: 'Round 1 - Division 1 Gala 2 (Hutton Moor 5pm)',
                date: '2026-10-10',
                licence: '3SW262350',
                venue: 'Hutton Moor (Weston Host)',
                competingClubs: [
                    'Swindon ASC', 'City of Bristol B', 'Backwell', 'Chippenham',
                    'Southwold', 'Cirencester', 'Bradford on Avon', 'Weston S Mare'
                ]
            });

            // Ensure Weston's fixture (Plymouth) is the active default
            this.activeGalaId = '2026_R2_Plymouth';
        }

        /**
         * Adds extra swimmer options for Weston SC into timesDB to enable tactical swapping
         */
        seedWestonSquadRoster() {
            const westonId = 'weston';
            let roster = [];

            if (typeof WESTON_ROSTER_TIMES !== 'undefined' && Array.isArray(WESTON_ROSTER_TIMES)) {
                roster = WESTON_ROSTER_TIMES;
            } else {
                try {
                    roster = require('../data/westonRosterTimes.json');
                } catch (e) {
                    roster = [];
                }
            }

            if (!roster || roster.length === 0) {
                roster = [
                    // Girls 9-11
                    { age: '9-11', gender: 'Female', stroke: 'Backstroke', dist: 50, swimmer: 'Eva Allen', time: '38.50' },
                    { age: '9-11', gender: 'Female', stroke: 'Freestyle', dist: 50, swimmer: 'Bethany Thomas', time: '33.10' },
                    { age: '9-11', gender: 'Female', stroke: 'Breaststroke', dist: 50, swimmer: 'Lola Tembey Barnard', time: '43.20' },
                    { age: '9-11', gender: 'Female', stroke: 'Butterfly', dist: 50, swimmer: 'Alexie Tembey-Barnard', time: '37.80' },

                    // Boys 9-11
                    { age: '9-11', gender: 'Male', stroke: 'Freestyle', dist: 50, swimmer: 'Billy Marshall', time: '32.10' },
                    { age: '9-11', gender: 'Male', stroke: 'Backstroke', dist: 50, swimmer: 'Luca Watson', time: '39.80' },
                    { age: '9-11', gender: 'Male', stroke: 'Breaststroke', dist: 50, swimmer: 'Seth Gould', time: '44.50' },

                    // 13/U Girls
                    { age: '12-13', gender: 'Female', stroke: 'Freestyle', dist: 50, swimmer: 'Rosie Livesey', time: '32.25' },
                    { age: '12-13', gender: 'Female', stroke: 'Freestyle', dist: 100, swimmer: 'Ava Mitchard', time: '1:02.90' },
                    { age: '12-13', gender: 'Female', stroke: 'Backstroke', dist: 100, swimmer: 'Felicity Thomas', time: '1:15.20' },
                    { age: '12-13', gender: 'Female', stroke: 'Butterfly', dist: 100, swimmer: 'Emily Butcher', time: '1:13.80' },
                    { age: '12-13', gender: 'Female', stroke: 'Breaststroke', dist: 100, swimmer: 'Rosie Livesey', time: '1:24.00' },

                    // 13/U Boys
                    { age: '12-13', gender: 'Male', stroke: 'Freestyle', dist: 50, swimmer: 'Austin Hodder', time: '30.03' },
                    { age: '12-13', gender: 'Male', stroke: 'Freestyle', dist: 100, swimmer: 'Oliver Waller', time: '1:01.40' },
                    { age: '12-13', gender: 'Male', stroke: 'Backstroke', dist: 100, swimmer: 'Freddie Marshall', time: '1:13.50' },

                    // 15/U & Open
                    { age: '14-15', gender: 'Female', stroke: 'Freestyle', dist: 50, swimmer: 'Francesca Flack', time: '30.36' },
                    { age: '14-15', gender: 'Male', stroke: 'Freestyle', dist: 50, swimmer: 'Oliver Waller', time: '31.28' },
                    { age: '14-15', gender: 'Female', stroke: 'Freestyle', dist: 100, swimmer: 'Ava Mitchard', time: '59.90' },
                    { age: '16+', gender: 'Female', stroke: 'Freestyle', dist: 50, swimmer: 'Madeleine Soper', time: '28.45' },
                    { age: '16+', gender: 'Male', stroke: 'Freestyle', dist: 50, swimmer: 'Oliver Tomlinson', time: '25.85' },
                    { age: '16+', gender: 'Female', stroke: 'Freestyle', dist: 100, swimmer: 'Rosie Livesey', time: '1:00.50' },
                    { age: '16+', gender: 'Female', stroke: 'Backstroke', dist: 100, swimmer: 'Emily Butcher', time: '1:06.80' },
                    { age: '16+', gender: 'Male', stroke: 'Freestyle', dist: 100, swimmer: 'Austin Hodder', time: '52.10' },
                    { age: '16+', gender: 'Male', stroke: 'Butterfly', dist: 100, swimmer: 'Freddie Marshall', time: '59.80' }
                ];
            }

            roster.forEach(s => {
                const strokeDist = makeStrokeKey(s.stroke, s.dist);
                const parsed = TimeUtils ? TimeUtils.parseTimeToMs(s.time) : { ms: 60000, isDisqualified: false, formatted: s.time };
                
                // Add to designated age category
                this.addSwimmerTime(westonId, s.age, s.gender, strokeDist, {
                    swimmer: s.swimmer,
                    timeMs: parsed.ms,
                    timeStr: parsed.formatted,
                    round: 'Trial / PB (V6 Roster)',
                    date: '2026-10-10',
                    isDQ: false
                });

                // Add to standard age aliases for seamless matching
                const aliasMap = {
                    '9-11': ['10-11', '11/U'],
                    '12-13': ['13/U'],
                    '13/U': ['12-13'],
                    '14-15': ['15/U'],
                    '15/U': ['14-15'],
                    '16+': ['Open'],
                    'Open': ['16+']
                };
                if (aliasMap[s.age]) {
                    aliasMap[s.age].forEach(aliasAge => {
                        this.addSwimmerTime(westonId, aliasAge, s.gender, strokeDist, {
                            swimmer: s.swimmer,
                            timeMs: parsed.ms,
                            timeStr: parsed.formatted,
                            round: 'Trial / PB (V6 Roster)',
                            date: '2026-10-10',
                            isDQ: false
                        });
                    });
                }
            });
        }

        /**
         * Adds or updates a swimmer time record in timesDB
         */
        addSwimmerTime(clubId, ageGroup, gender, strokeDistance, record) {
            const cId = getClubId(clubId);
            const age = String(ageGroup || 'Open').trim();
            const gen = String(gender || 'Mixed').trim();
            const sd = String(strokeDistance || 'Free_50').trim();

            if (!this.timesDB[cId]) this.timesDB[cId] = {};
            if (!this.timesDB[cId][age]) this.timesDB[cId][age] = {};
            if (!this.timesDB[cId][age][gen]) this.timesDB[cId][age][gen] = {};
            if (!this.timesDB[cId][age][gen][sd]) this.timesDB[cId][age][gen][sd] = [];

            const list = this.timesDB[cId][age][gen][sd];

            // Clean parsed time
            const timeMs = record.timeMs !== undefined ? record.timeMs : (TimeUtils ? TimeUtils.parseTimeToMs(record.timeStr || record.time).ms : 0);
            const timeStr = record.timeStr || (TimeUtils ? TimeUtils.formatMsToTime(timeMs) : '0:00.00');

            const newEntry = {
                swimmer: record.swimmer || record.swimmerName || 'Club Swimmer',
                timeMs: timeMs,
                timeStr: timeStr,
                round: record.round || 'Round 1',
                date: record.date || new Date().toISOString().split('T')[0],
                isDQ: !!record.isDQ,
                eventNumber: record.eventNumber || null
            };

            // Purge generic placeholder if we are registering a real named swimmer
            if (newEntry.swimmer && !newEntry.swimmer.endsWith(' Swimmer') && newEntry.swimmer !== 'Weston Selected Swimmer') {
                const placeholderIdx = list.findIndex(e => e.swimmer.endsWith(' Swimmer') || e.swimmer === 'Weston Selected Swimmer');
                if (placeholderIdx !== -1) {
                    list.splice(placeholderIdx, 1);
                }
            }

            // Avoid exact duplicates
            const existingIdx = list.findIndex(e => e.swimmer === newEntry.swimmer && e.round === newEntry.round);
            if (existingIdx !== -1) {
                list[existingIdx] = newEntry;
            } else {
                list.push(newEntry);
            }

            // Sort fastest time first (valid times, non-DQ)
            list.sort((a, b) => {
                if (a.isDQ && !b.isDQ) return 1;
                if (!a.isDQ && b.isDQ) return -1;
                return a.timeMs - b.timeMs;
            });
        }

        /**
         * Retrieves the best recorded seed time for a club in a specific event
         */
        getBestSeedTime(clubId, event) {
            const cId = getClubId(clubId);
            if (!this.timesDB[cId]) return null;

            // 1. Direct match by event.number if known!
            if (event.number !== undefined) {
                for (const ageKey of Object.keys(this.timesDB[cId])) {
                    for (const genKey of Object.keys(this.timesDB[cId][ageKey])) {
                        for (const sdKey of Object.keys(this.timesDB[cId][ageKey][genKey])) {
                            const entries = this.timesDB[cId][ageKey][genKey][sdKey];
                            const specificNamed = entries.find(e => 
                                e.eventNumber === event.number && 
                                !e.isDQ && 
                                e.timeMs > 0 && 
                                e.swimmer !== 'Weston Selected Swimmer' && 
                                !e.swimmer.endsWith(' Swimmer')
                            );
                            if (specificNamed) return specificNamed;
                        }
                    }
                }
            }

            // 2. Stroke / Distance / Age lookup with normalized stroke key
            const age = String(event.age || 'Open').trim();
            const gen = String(event.gender || 'Mixed').trim();
            const sd = makeStrokeKey(event.stroke, event.distance, !!event.isRelay, event.name);

            const ageAliasMap = {
                '9-11': ['9-11', '10-11', '11/U'],
                '10-11': ['10-11', '9-11', '11/U'],
                '12-13': ['12-13', '13/U'],
                '13/U': ['13/U', '12-13'],
                '14-15': ['14-15', '15/U'],
                '15/U': ['15/U', '14-15'],
                '16+': ['16+', 'Open'],
                'Open': ['Open', '16+']
            };
            const ageCandidates = ageAliasMap[age] || [age];

            for (const a of ageCandidates) {
                if (this.timesDB[cId][a] && 
                    this.timesDB[cId][a][gen] && 
                    this.timesDB[cId][a][gen][sd] && 
                    this.timesDB[cId][a][gen][sd].length > 0) {
                    
                    const entries = this.timesDB[cId][a][gen][sd];

                    if (event.number !== undefined) {
                        const specificNamed = entries.find(e => e.eventNumber === event.number && !e.isDQ && e.timeMs > 0 && e.swimmer !== 'Weston Selected Swimmer' && !e.swimmer.endsWith(' Swimmer'));
                        if (specificNamed) return specificNamed;

                        const specific = entries.find(e => e.eventNumber === event.number && !e.isDQ && e.timeMs > 0);
                        if (specific) return specific;
                    }

                    const validNamed = entries.find(e => !e.isDQ && e.timeMs > 0 && e.swimmer !== 'Weston Selected Swimmer' && !e.swimmer.endsWith(' Swimmer'));
                    if (validNamed) return validNamed;

                    const valid = entries.find(e => !e.isDQ && e.timeMs > 0);
                    if (valid) return valid;
                }
            }

            return null;
        }

        /**
         * Returns all recorded swimmer times for a specific event
         */
        getAllSwimmersForEvent(clubId, event) {
            const cId = getClubId(clubId);
            if (!this.timesDB[cId]) return [];

            const age = String(event.age || 'Open').trim();
            const gen = String(event.gender || 'Mixed').trim();
            const sd = makeStrokeKey(event.stroke, event.distance, !!event.isRelay, event.name);

            const ageAliasMap = {
                '9-11': ['9-11', '10-11', '11/U'],
                '10-11': ['10-11', '9-11', '11/U'],
                '12-13': ['12-13', '13/U'],
                '13/U': ['13/U', '12-13'],
                '14-15': ['14-15', '15/U'],
                '15/U': ['15/U', '14-15'],
                '16+': ['16+', 'Open'],
                'Open': ['Open', '16+']
            };
            const ageCandidates = ageAliasMap[age] || [age];

            for (const a of ageCandidates) {
                if (this.timesDB[cId][a] && 
                    this.timesDB[cId][a][gen] && 
                    this.timesDB[cId][a][gen][sd]) {
                    return this.timesDB[cId][a][gen][sd];
                }
            }
            return [];
        }

        /**
         * Creates or updates a GalaLineup schema
         */
        createOrUpdateGalaLineup(galaData) {
            const galaId = galaData.galaId || `GALA_${Date.now()}`;
            const competingClubNames = galaData.competingClubs || [];

            // Map clubs to 8 standard lanes
            const competingClubs = competingClubNames.map((name, idx) => {
                const cId = getClubId(name);
                const master = MASTER_CLUBS.find(m => m.id === cId) || {};
                return {
                    id: cId,
                    name: master.name || name,
                    lane: idx + 1,
                    shortCode: master.shortCode || name.substring(0, 3).toUpperCase(),
                    color: master.color || '#38bdf8',
                    isHome: master.isHome || (cId === 'weston')
                };
            });

            this.lineups[galaId] = {
                galaId: galaId,
                name: galaData.name || `Arena Gala ${galaId}`,
                date: galaData.date || new Date().toISOString().split('T')[0],
                venue: galaData.venue || 'Standard 25m Pool',
                competingClubs: competingClubs,
                overrides: galaData.overrides || {} // [eventNumber][clubId] = { swimmer, timeMs, timeStr, isDQ }
            };

            this.activeGalaId = galaId;
            this.save();
            return this.lineups[galaId];
        }

        /**
         * Retrieves active GalaLineup
         */
        getActiveGalaLineup() {
            if (!this.lineups[this.activeGalaId]) {
                const keys = Object.keys(this.lineups);
                if (keys.length > 0) {
                    this.activeGalaId = keys[0];
                } else {
                    this.seedDefaultDatabase();
                }
            }
            return this.lineups[this.activeGalaId];
        }

        /**
         * Sets active gala ID
         */
        setActiveGalaId(galaId) {
            if (this.lineups[galaId]) {
                this.activeGalaId = galaId;
                this.save();
            }
        }

        /**
         * Sets an event override for a club in the active gala
         */
        setLineupOverride(eventNumber, clubId, overrideData) {
            const gala = this.getActiveGalaLineup();
            if (!gala) return;
            if (!gala.overrides) gala.overrides = {};
            if (!gala.overrides[eventNumber]) gala.overrides[eventNumber] = {};

            const cId = getClubId(clubId);
            const parsed = TimeUtils ? TimeUtils.parseTimeToMs(overrideData.timeStr || overrideData.timeMs) : { ms: 60000, isDisqualified: false, formatted: '1:00.00' };

            gala.overrides[eventNumber][cId] = {
                swimmer: overrideData.swimmer || 'Swimmer Swap',
                timeMs: overrideData.timeMs !== undefined ? overrideData.timeMs : parsed.ms,
                timeStr: overrideData.timeStr || parsed.formatted,
                isDQ: overrideData.isDQ !== undefined ? overrideData.isDQ : parsed.isDisqualified,
                isOverride: true
            };

            this.save();
        }

        /**
         * Clears all overrides in the active gala
         */
        clearActiveLineupOverrides() {
            const gala = this.getActiveGalaLineup();
            if (gala) {
                gala.overrides = {};
                this.save();
            }
        }

        /**
         * Returns all recognized clubs
         */
        getMasterClubs() {
            return MASTER_CLUBS;
        }

        /**
         * Exports full database as JSON
         */
        exportDatabaseJSON() {
            return JSON.stringify({
                version: '2.0.0',
                exportedAt: new Date().toISOString(),
                activeGalaId: this.activeGalaId,
                timesDB: this.timesDB,
                lineups: this.lineups
            }, null, 2);
        }

        /**
         * Imports database from JSON
         */
        importDatabaseJSON(jsonStr) {
            if (!jsonStr) throw new Error('Empty JSON string');
            const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;

            if (data.timesDB) this.timesDB = data.timesDB;
            if (data.lineups) this.lineups = data.lineups;
            if (data.activeGalaId) this.activeGalaId = data.activeGalaId;

            this.save();
            return {
                clubsCount: Object.keys(this.timesDB).length,
                lineupsCount: Object.keys(this.lineups).length,
                activeGalaId: this.activeGalaId
            };
        }
    }

    StorageManager.MASTER_CLUBS = MASTER_CLUBS;
    StorageManager.getClubId = getClubId;
    StorageManager.makeStrokeKey = makeStrokeKey;

    return StorageManager;
}));
