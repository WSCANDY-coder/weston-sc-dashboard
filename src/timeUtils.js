/**
 * timeUtils.js
 * Comprehensive Swimming Race Time Utilities & Parser for Arena Race Manager
 * 
 * Supports:
 * - Parsing raw race times to milliseconds with OCR quirk cleaning.
 * - Formatting milliseconds back to standard swimming format (mm:ss.ms or ss.ms).
 * - Time validation and DQ/DNS detection.
 * - Relay split accumulation with rolling takeover adjustments.
 * - Gala Round 1 results sheet parser: parseRound1GalaData(rawPdfJsonOrText).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const g = root || globalThis || window || self || {};
        g.TimeUtils = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function () {
    'use strict';

    /**
     * Standard club name aliases map for normalization
     */
    const CLUB_ALIASES = {
        'CARADON': 'Caradon',
        'CARADON S.C.': 'Caradon',
        'BRIXHAM': 'Brixham',
        'BRIXHAM SC': 'Brixham',
        'TRURO': 'Truro City',
        'TRURO CITY': 'Truro City',
        'TRURO CITY SC': 'Truro City',
        'SWINDON': 'Swindon ASC',
        'SWINDON ASC': 'Swindon ASC',
        'SWINDON DOLPHIN': 'Swindon ASC',
        'NORTH CORNWALL': 'North Cornwall Dragons',
        'NORTH CORNWALL DRAGONS': 'North Cornwall Dragons',
        'N CORNWALL': 'North Cornwall Dragons',
        'NCD': 'North Cornwall Dragons',
        'BRADFORD ON AVON': 'Bradford on Avon',
        'BRADFORD-ON-AVON': 'Bradford on Avon',
        'BOA': 'Bradford on Avon',
        'BRIDGWATER': 'Bridgwater',
        'BRIDGWATER SC': 'Bridgwater',
        'WESTON S MARE': 'Weston S Mare',
        'WESTON-SUPER-MARE': 'Weston S Mare',
        'WESTON SUPER MARE': 'Weston S Mare',
        'WESTON': 'Weston S Mare',
        'WSM': 'Weston S Mare'
    };

    /**
     * Normalizes a club name to canonical form
     * @param {string} rawClubName
     * @returns {string}
     */
    function normalizeClubName(rawClubName) {
        if (!rawClubName) return 'Unknown Club';
        const cleaned = String(rawClubName).trim();
        const upper = cleaned.toUpperCase().replace(/\s+/g, ' ');
        return CLUB_ALIASES[upper] || cleaned;
    }

    /**
     * Checks if a raw time string denotes a disqualification, no show, or no time
     * @param {string|number} raw
     * @returns {boolean}
     */
    function isDqOrNoTime(raw) {
        if (raw === null || raw === undefined) return true;
        const str = String(raw).trim().toUpperCase();
        if (!str || str === '0' || str === '0:00.00' || str === '00:00.00' || str === '0.00' || str === 'NT') return true;
        return /^(DQ|DNS|DNF|DNC|DISQ|DISQUALIFIED|NO TIME|RULE\s*\d+|DQ\..*)$/i.test(str) ||
               str.includes('DISQ') ||
               str.includes('DQ') ||
               str.includes('RULE');
    }

    /**
     * Cleans OCR artifacts and quirks from a raw time string.
     * Examples:
     *   "240.14:" -> "2:40.14"
     *   ":104.72" -> "1:04.72"
     *   "104.72:" -> "1:04.72"
     *   "1:05.53" -> "1:05.53"
     *   "31.42"   -> "31.42"
     *   "0:00.00" -> DQ
     * 
     * @param {string|number} raw
     * @returns {{ ms: number, isDisqualified: boolean, formatted: string, raw: string }}
     */
    function parseTimeToMs(raw) {
        const rawStr = raw === null || raw === undefined ? '' : String(raw).trim();

        if (isDqOrNoTime(rawStr)) {
            return {
                ms: 0,
                isDisqualified: true,
                formatted: 'DQ',
                raw: rawStr
            };
        }

        // Strip leading/trailing non-numeric punctuation except valid time chars
        let clean = rawStr.replace(/^[^\d:]+/, '').replace(/[^\d]+$/, '');

        // Remove trailing or leading colons/semicolons (e.g., "240.14:" or ":104.72")
        clean = clean.replace(/[:;]+$/, '').replace(/^[:;]+/, '');

        let minutes = 0;
        let seconds = 0;
        let ms = 0;

        if (clean.includes(':')) {
            // Standard format: m:ss.ms or mm:ss.ms
            const colonParts = clean.split(':');
            minutes = parseInt(colonParts[0], 10) || 0;
            const secStr = colonParts[1] || '0';
            const dotParts = secStr.split('.');
            seconds = parseInt(dotParts[0], 10) || 0;
            const frac = (dotParts[1] || '0').padEnd(2, '0').slice(0, 2);
            ms = parseInt(frac, 10) * 10;
        } else {
            // No colon in clean string. Could be:
            // 1. "31.42" -> 31 seconds 420 ms
            // 2. OCR missing colon: "104.72" -> 1 min, 4 secs, 720 ms
            // 3. OCR missing colon: "240.14" -> 2 mins, 40 secs, 140 ms
            const dotParts = clean.split('.');
            const whole = dotParts[0] || '0';
            const frac = (dotParts[1] || '0').padEnd(2, '0').slice(0, 2);
            const msVal = parseInt(frac, 10) * 10;

            if (whole.length >= 3) {
                // First 1 or 2 digits are minutes, last 2 digits are seconds
                minutes = parseInt(whole.slice(0, whole.length - 2), 10) || 0;
                seconds = parseInt(whole.slice(whole.length - 2), 10) || 0;
                ms = msVal;
            } else {
                seconds = parseInt(whole, 10) || 0;
                ms = msVal;
            }
        }

        const totalMs = (minutes * 60 * 1000) + (seconds * 1000) + ms;

        if (isNaN(totalMs) || totalMs <= 0) {
            return {
                ms: 0,
                isDisqualified: true,
                formatted: 'DQ',
                raw: rawStr
            };
        }

        return {
            ms: totalMs,
            isDisqualified: false,
            formatted: formatMsToTime(totalMs),
            raw: rawStr
        };
    }

    /**
     * Converts numeric milliseconds to formatted swimming time string
     * @param {number} ms - Milliseconds
     * @param {boolean} [forceMinutes=false] - Whether to always include minutes (e.g. 0:31.42)
     * @returns {string} - e.g. "1:05.53" or "31.42"
     */
    function formatMsToTime(ms, forceMinutes = false) {
        if (!ms || ms <= 0 || isNaN(ms)) return 'DQ';
        const totalHundredths = Math.round(ms / 10);
        const hundredths = totalHundredths % 100;
        const totalSeconds = Math.floor(totalHundredths / 100);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);

        const pad2 = (n) => String(n).padStart(2, '0');

        if (minutes > 0 || forceMinutes) {
            return `${minutes}:${pad2(seconds)}.${pad2(hundredths)}`;
        }
        return `${seconds}.${pad2(hundredths)}`;
    }

    /**
     * Compares two times in milliseconds for sorting (fastest first).
     * DQs (0 ms) are always sorted to the end.
     * @param {number} aMs
     * @param {number} bMs
     * @returns {number}
     */
    function compareTimes(aMs, bMs) {
        const aValid = aMs > 0;
        const bValid = bMs > 0;
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        return aMs - bMs;
    }

    /**
     * Validates whether a given string or number can be parsed as a valid swimming time
     * @param {string|number} timeStr
     * @returns {boolean}
     */
    function isValidTime(timeStr) {
        if (isDqOrNoTime(timeStr)) return false;
        const parsed = parseTimeToMs(timeStr);
        return !parsed.isDisqualified && parsed.ms > 0 && parsed.ms < 3600000;
    }

    /**
     * Computes composite relay time from individual flat times with rolling takeover adjustments.
     * In swimming relays, takeovers after the 1st leg are rolling (flying starts),
     * which typically yield a 0.40s - 0.80s advantage per exchange (default -0.60s).
     * For Cannon relays (8x50m), a flat-start penalty (e.g. +0.65s) applies to Leg 1,
     * and a flying-start relay delta (e.g. -0.45s) applies to Legs 2 through 8.
     * 
     * @param {number[]} legTimesMs - Array of individual swimmer flat times in ms
     * @param {number|Object} [takeoverBonusOrOptions=600] - Rolling start bonus in ms per takeover OR options object
     * @param {number} [flatStartPenaltyMs=0] - Flat start penalty in ms applied ONLY to leg 1
     * @param {number} [flyingStartDeltaMs=null] - Flying start delta in ms applied to legs 2..N
     * @returns {{ totalMs: number, rawSumMs: number, bonusMs: number, flatStartPenaltyMs: number, flyingStartDeltaMs: number, legSplitsMs: number[], formatted: string }}
     */
    function calculateRelayTime(legTimesMs, takeoverBonusOrOptions = 600, flatStartPenaltyMs = 0, flyingStartDeltaMs = null) {
        if (!Array.isArray(legTimesMs) || legTimesMs.length === 0) {
            return { totalMs: 0, rawSumMs: 0, bonusMs: 0, flatStartPenaltyMs: 0, flyingStartDeltaMs: 0, legSplitsMs: [], formatted: 'DQ' };
        }

        let takeoverBonusMs = 600;
        let flatStartPenalty = flatStartPenaltyMs || 0;
        let flyingDelta = flyingStartDeltaMs;

        if (typeof takeoverBonusOrOptions === 'object' && takeoverBonusOrOptions !== null) {
            if (takeoverBonusOrOptions.takeoverBonusMs !== undefined) takeoverBonusMs = takeoverBonusOrOptions.takeoverBonusMs;
            else if (takeoverBonusOrOptions.bonusMs !== undefined) takeoverBonusMs = takeoverBonusOrOptions.bonusMs;
            if (takeoverBonusOrOptions.flatStartPenaltyMs !== undefined) flatStartPenalty = takeoverBonusOrOptions.flatStartPenaltyMs;
            else if (takeoverBonusOrOptions.flatStartPenalty !== undefined) flatStartPenalty = Math.round(takeoverBonusOrOptions.flatStartPenalty * 1000);
            if (takeoverBonusOrOptions.flyingStartDeltaMs !== undefined) flyingDelta = takeoverBonusOrOptions.flyingStartDeltaMs;
            else if (takeoverBonusOrOptions.flyingStartDelta !== undefined) flyingDelta = Math.round(takeoverBonusOrOptions.flyingStartDelta * 1000);
        } else if (typeof takeoverBonusOrOptions === 'number') {
            takeoverBonusMs = takeoverBonusOrOptions;
        }

        if (flyingDelta === null || flyingDelta === undefined) {
            flyingDelta = -takeoverBonusMs;
        }

        let rawSum = 0;
        for (let t of legTimesMs) {
            if (!t || t <= 0) return { totalMs: 0, rawSumMs: 0, bonusMs: 0, flatStartPenaltyMs: flatStartPenalty, flyingStartDeltaMs: flyingDelta, legSplitsMs: [], formatted: 'DQ' };
            rawSum += t;
        }

        const legSplitsMs = legTimesMs.map((t, idx) => {
            const delta = idx === 0 ? flatStartPenalty : flyingDelta;
            return Math.max(1000, t + delta);
        });

        const totalMs = legSplitsMs.reduce((acc, split) => acc + split, 0);
        const exchanges = Math.max(0, legTimesMs.length - 1);
        const totalBonus = Math.max(0, rawSum - totalMs);

        return {
            totalMs,
            rawSumMs: rawSum,
            bonusMs: totalBonus,
            flatStartPenaltyMs: flatStartPenalty,
            flyingStartDeltaMs: flyingDelta,
            legSplitsMs,
            formatted: formatMsToTime(totalMs)
        };
    }

    /**
     * Parses raw Round 1 Gala Data from either:
     * - An existing JSON object/string
     * - Raw text extracted from a Round 1 gala PDF (e.g. Division-1-Gala-1-Millfield-12-noon.pdf)
     * 
     * Output schema:
     * indexed by [eventNumber][clubName] = { swimmerName, timeMs, timeStr, isDisqualified, lane? }
     * 
     * @param {string|object} rawInput
     * @returns {Object.<number, Object.<string, {swimmerName: string, timeMs: number, timeStr: string, isDisqualified: boolean, lane?: number}>>}
     */
    function parseRound1GalaData(rawInput) {
        const eventsData = {};

        if (!rawInput) return eventsData;

        // If JSON object or string
        if (typeof rawInput === 'object') {
            return normalizeGalaDataObject(rawInput);
        }

        const text = String(rawInput).trim();
        if (text.startsWith('{') || text.startsWith('[')) {
            try {
                const parsed = JSON.parse(text);
                return normalizeGalaDataObject(parsed);
            } catch (e) {
                // Fall back to line-by-line regex parsing
            }
        }

        // Line-by-line text parsing from PDF / text export
        const lines = text.split(/\r?\n/);
        let currentEvent = null;

        // Common patterns in Arena League Gala result sheets:
        // "Event 1 Women Open 200m Ind Medley" or "Event 1:"
        const eventHeaderRegex = /(?:Event|Race)\s+(\d+)\b/i;

        // Result line formats:
        // "1 Caradon Smith, John 2:14.53 8"
        // "Lane 1 Caradon John Smith 2:14.53"
        // "Brixham Jane Doe 1:04.72"
        const clubs = [
            'Caradon', 'Brixham', 'Truro City', 'Truro', 'Swindon ASC', 'Swindon',
            'North Cornwall Dragons', 'North Cornwall', 'N Cornwall', 'Bradford on Avon',
            'Bradford-on-Avon', 'Bridgwater', 'Weston S Mare', 'Weston', 'Weston-super-Mare'
        ];
        const clubRegexPattern = new RegExp(`\\b(${clubs.join('|')})\\b`, 'i');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Check if line declares a new event
            const eventMatch = trimmed.match(eventHeaderRegex);
            if (eventMatch) {
                currentEvent = parseInt(eventMatch[1], 10);
                if (!eventsData[currentEvent]) eventsData[currentEvent] = {};
                return;
            }

            // If we are inside an event, search for club names and times
            if (currentEvent !== null) {
                const clubMatch = trimmed.match(clubRegexPattern);
                if (clubMatch) {
                    const canonicalClub = normalizeClubName(clubMatch[1]);
                    
                    // Look for time pattern: e.g., 2:14.53 or 240.14: or :104.72 or 31.42 or DQ
                    const timeRegex = /(?:\b\d{1,2}:\d{2}\.\d{2}\b|\b\d{1,3}\.\d{2}:?\b|:\d{2,3}\.\d{2}\b|\b(?:DQ|DNS|DNF|DISQ|0:00\.00)\b)/i;
                    const timeMatch = trimmed.match(timeRegex);

                    let timeObj = { ms: 0, isDisqualified: true, formatted: 'DQ', raw: 'DQ' };
                    if (timeMatch) {
                        timeObj = parseTimeToMs(timeMatch[0]);
                    }

                    // Extract swimmer name if present
                    let swimmerName = '';
                    // Remove club and time from line to find swimmer
                    let remaining = trimmed.replace(clubMatch[0], '').replace(timeMatch ? timeMatch[0] : '', '').trim();
                    // Clean lane numbers or points and trailing punctuation
                    remaining = remaining.replace(/\bLane\s*\d+\b/i, '').replace(/^[1-8]\s+/, '').replace(/\s+[1-8]$/, '').trim();
                    remaining = remaining.replace(/[:;,.]+$/, '').trim();
                    if (remaining.length > 2 && !/^\d+$/.test(remaining)) {
                        swimmerName = remaining;
                    }

                    if (!eventsData[currentEvent]) eventsData[currentEvent] = {};
                    eventsData[currentEvent][canonicalClub] = {
                        swimmerName: swimmerName || 'Club Representative',
                        timeMs: timeObj.ms,
                        timeStr: timeObj.formatted,
                        isDisqualified: timeObj.isDisqualified,
                        raw: timeObj.raw
                    };
                }
            }
        });

        return eventsData;
    }

    /**
     * Helper to normalize a JSON object into indexed schema
     * @param {object|array} obj
     * @returns {object}
     */
    function normalizeGalaDataObject(obj) {
        if (obj && obj.SEED_DATA_FULL) {
            obj = obj.SEED_DATA_FULL;
        }
        const result = {};
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                const evNum = parseInt(item.event || item.eventNumber || item.eventId, 10);
                if (!evNum) return;
                if (!result[evNum]) result[evNum] = {};

                const club = normalizeClubName(item.club || item.clubName || item.team);
                const parsedTime = parseTimeToMs(item.time || item.timeStr || item.timeMs);
                result[evNum][club] = {
                    swimmerName: item.swimmer || item.swimmerName || 'Club Swimmer',
                    timeMs: parsedTime.ms,
                    timeStr: parsedTime.formatted,
                    isDisqualified: parsedTime.isDisqualified,
                    lane: item.lane || null
                };
            });
            return result;
        }

        // Keyed object by event
        Object.keys(obj).forEach(evKey => {
            const evNum = parseInt(evKey, 10);
            if (isNaN(evNum)) return;
            result[evNum] = {};

            const clubsObj = obj[evKey];
            if (typeof clubsObj === 'object' && clubsObj !== null) {
                Object.keys(clubsObj).forEach(rawClub => {
                    const canonicalClub = normalizeClubName(rawClub);
                    const clubData = clubsObj[rawClub];
                    if (typeof clubData === 'string' || typeof clubData === 'number') {
                        const parsed = parseTimeToMs(clubData);
                        result[evNum][canonicalClub] = {
                            swimmerName: 'Club Swimmer',
                            timeMs: parsed.ms,
                            timeStr: parsed.formatted,
                            isDisqualified: parsed.isDisqualified
                        };
                    } else if (clubData && typeof clubData === 'object') {
                        const parsed = parseTimeToMs(clubData.timeMs || clubData.timeStr || clubData.time);
                        result[evNum][canonicalClub] = {
                            swimmerName: clubData.swimmerName || clubData.swimmer || 'Club Swimmer',
                            timeMs: parsed.ms,
                            timeStr: parsed.formatted,
                            isDisqualified: clubData.isDisqualified !== undefined ? clubData.isDisqualified : parsed.isDisqualified,
                            lane: clubData.lane || null
                        };
                    }
                });
            }
        });

        return result;
    }

    return {
        CLUB_ALIASES,
        normalizeClubName,
        isDqOrNoTime,
        parseTimeToMs,
        formatMsToTime,
        compareTimes,
        isValidTime,
        calculateRelayTime,
        parseRound1GalaData
    };
}));
