/**
 * dataSanitizer.js
 * Comprehensive Regex Matching & Numeric Time Converter for Arena Race Manager
 * 
 * Provides:
 * - Time Parser & Normalizer:
 *   - Resolves OCR quirks ("240.14:" -> "2:40.14", ":104.72" -> "1:04.72", ":16.471" -> "1:16.47", "10.311:" -> "1:10.31")
 *   - Strips leading/trailing rank and points digits attached by OCR ("2:25.28 2" -> "2:25.28")
 *   - Detects non-scoring / DQ entries ("0:00.00", "DQ", "DNS", "DNC", etc.)
 *   - Returns confidence status: 'green' (confident), 'amber' (auto-corrected), 'red' (DQ/invalid)
 * - Swimmer & Club Name Disambiguation:
 *   - Resolves hyphenation artifacts ("Harriet PageDove-" -> "Harriet Page-Dove")
 *   - Removes stray numeric relics ("Isia Edwards 9" -> "Isia Edwards")
 *   - Standardizes club identifiers across all rounds
 * - Relay Detection & Aggregation:
 *   - Flags standard relay event numbers and squad entries
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const g = root || globalThis || window || self || {};
        g.DataSanitizer = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function () {
    'use strict';

    // Standard list of relay event numbers in various Arena programs
    // Standard NASL relays: 3, 4, 5, 6, 7, 8, 9, 10, 43, 44, 45, 46, 47, 48, 49, 50, 51
    const RELAY_EVENT_NUMBERS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]);

    /**
     * Standard club aliases dictionary
     */
    const CLUB_STANDARDIZATION_MAP = [
        { patterns: [/N\s*CO(?:RN|M)WALL/i, /N\s*CORNWALL/i, /NORTH\s+CORNWALL/i, /^NCD$/i], canonical: 'North Cornwall Dragons' },
        { patterns: [/PLYMOUTH\s+LEA(?:NDER)?/i, /^PLM$/i], canonical: 'Plymouth Leander' },
        { patterns: [/WESTON\s*(?:S(?:UPER)?\s*MARE|-SUPER-MARE)?/i, /^WSM$/i, /^WESTON$/i], canonical: 'Weston SC' },
        { patterns: [/TRURO\s*(?:CITY)?/i, /^TRU$/i], canonical: 'Truro City' },
        { patterns: [/PAIGNTON/i], canonical: 'Paignton' },
        { patterns: [/BRIXHAM/i, /^BRX$/i], canonical: 'Brixham' },
        { patterns: [/BRIDG?WATER/i, /^BDG$/i], canonical: 'Bridgwater' },
        { patterns: [/WELLS/i], canonical: 'Wells' },
        { patterns: [/CARADON/i, /^CAR$/i], canonical: 'Caradon' },
        { patterns: [/SWINDON\s*(?:ASC|DOLPHIN)?/i, /^SWN$/i], canonical: 'Swindon ASC' },
        { patterns: [/BRADFORD\s*(?:ON\s*AVON|-ON-AVON)?/i, /^BOA$/i], canonical: 'Bradford on Avon' },
        { patterns: [/CITY\s+OF\s+BRISTOL\s*B?/i, /^BRISTOL\s*B?$/i, /^CBB$/i], canonical: 'City of Bristol B' },
        { patterns: [/BACKWELL/i, /^BKW$/i], canonical: 'Backwell' },
        { patterns: [/CHIPPENHAM/i, /^CHIP$/i], canonical: 'Chippenham' },
        { patterns: [/SOUTHWOLD/i, /^SWD$/i], canonical: 'Southwold' },
        { patterns: [/CIRENCESTER/i, /^CIR$/i], canonical: 'Cirencester' },
        { patterns: [/SEVERNSIDE\s*(?:TRITONS)?/i, /^SVT$/i], canonical: 'Severnside Tritons' },
        { patterns: [/GLOUCESTER/i, /^GLO$/i], canonical: 'City of Gloucester' },
        { patterns: [/NEWPORT/i, /^NEW$/i], canonical: 'City of Newport' }
    ];

    class DataSanitizer {
        /**
         * Parses and cleans a raw time string from messy OCR gala results.
         * 
         * @param {string|number} rawStr - Raw input string (e.g. "240.14:", ":104.72", ":16.471", "0:00.00")
         * @param {Object} [eventContext] - Optional context { eventNumber, distance, stroke }
         * @returns {{ timeMs: number|null, isDQ: boolean, rawTime: string, formatted: string, status: 'green'|'amber'|'red', note: string }}
         */
        static cleanTime(rawStr, eventContext = null) {
            if (rawStr === null || rawStr === undefined) {
                return {
                    timeMs: null,
                    isDQ: true,
                    rawTime: '0:00.00',
                    formatted: '0:00.00',
                    status: 'red',
                    note: 'Missing time entry'
                };
            }

            let str = String(rawStr).trim();
            if (!str) {
                return {
                    timeMs: null,
                    isDQ: true,
                    rawTime: '0:00.00',
                    formatted: '0:00.00',
                    status: 'red',
                    note: 'Empty time entry'
                };
            }

            const upper = str.toUpperCase();

            // Check for non-scoring / DQ entries
            if (/^(0[:.]00([:.]00)?|DQ|DNS|DNF|DNC|DISQ|DISQUALIFIED|NT|NO TIME)$/i.test(upper) ||
                upper.includes('DISQ') ||
                upper.includes('RULE') ||
                upper === '0' || upper === '0.00') {
                return {
                    timeMs: null,
                    isDQ: true,
                    rawTime: '0:00.00',
                    formatted: '0:00.00',
                    status: 'red',
                    note: 'Flagged DQ / Non-Scoring'
                };
            }

            let status = 'green';
            const notes = [];

            // 1. Remove trailing rank/points digits attached by OCR: e.g. "2:25.28 2" -> "2:25.28", "1:26.54 27" -> "1:26.54"
            const trailingRankMatch = str.match(/^([:\d.]+)\s+(\d{1,2})$/);
            if (trailingRankMatch) {
                str = trailingRankMatch[1];
                status = 'amber';
                notes.push(`Stripped trailing rank/points '${trailingRankMatch[2]}'`);
            }

            // 2. Remove leading lane/rank digits: e.g. "8 1:04.50" -> "1:04.50"
            const leadingRankMatch = str.match(/^(\d{1,2})\s+([:\d.]+)$/);
            if (leadingRankMatch) {
                str = leadingRankMatch[2];
                status = 'amber';
                notes.push(`Stripped leading lane '${leadingRankMatch[1]}'`);
            }

            // 3. Format ":16.471" -> OCR digit swap where minute digit 1 dropped to the end: ":SS.MSd" -> "d:SS.MS"
            const digitSwapMatch1 = str.match(/^:(\d{2})\.(\d{2})(\d)$/);
            if (digitSwapMatch1) {
                const minDigit = digitSwapMatch1[3];
                const sec = digitSwapMatch1[1];
                const hundredths = digitSwapMatch1[2];
                str = `${minDigit}:${sec}.${hundredths}`;
                status = 'amber';
                notes.push(`Corrected OCR digit swap '${rawStr}' -> '${str}'`);
            }

            // 4. Format "10.311:" -> trailing colon with 3 digits after decimal, e.g. "10.311:" -> "1:10.31"
            const digitSwapMatch2 = str.match(/^(\d{2})\.(\d{2})(\d)[:;]?$/);
            if (digitSwapMatch2) {
                const minDigit = digitSwapMatch2[3];
                const sec = digitSwapMatch2[1];
                const hundredths = digitSwapMatch2[2];
                str = `${minDigit}:${sec}.${hundredths}`;
                status = 'amber';
                notes.push(`Corrected OCR trailing digit colon swap '${rawStr}' -> '${str}'`);
            }

            // 5. Format "240.14:" or "240.14" -> "2:40.14" (3-4 digit strings preceding or followed by colons)
            const quirk240WithColon = str.match(/^(\d)(\d{2})\.(\d{2})[:;]+$/);
            if (quirk240WithColon) {
                str = `${quirk240WithColon[1]}:${quirk240WithColon[2]}.${quirk240WithColon[3]}`;
                status = 'amber';
                notes.push(`Inserted missing colon in 3-digit time '${rawStr}' -> '${str}'`);
            } else {
                // If no colon at all and whole part has 3 digits: e.g. "104.72" or "240.14"
                const quirkNoColon3Digit = str.match(/^(\d)(\d{2})\.(\d{2})$/);
                if (quirkNoColon3Digit) {
                    str = `${quirkNoColon3Digit[1]}:${quirkNoColon3Digit[2]}.${quirkNoColon3Digit[3]}`;
                    status = 'amber';
                    notes.push(`Converted 3-digit flat time '${rawStr}' -> '${str}'`);
                }
            }

            // 6. Format ":104.72" -> "1:04.72" (leading colon with 3+ digits before decimal)
            const quirkLeadingColon3Digit = str.match(/^:(\d)(\d{2})\.(\d{2})$/);
            if (quirkLeadingColon3Digit) {
                str = `${quirkLeadingColon3Digit[1]}:${quirkLeadingColon3Digit[2]}.${quirkLeadingColon3Digit[3]}`;
                status = 'amber';
                notes.push(`Repaired leading colon 3-digit time '${rawStr}' -> '${str}'`);
            }

            // Strip any remaining leading or trailing punctuation
            str = str.replace(/[:;]+$/, '').replace(/^[:;]+/, '');

            // Standard parsing to minutes, seconds, milliseconds
            let minutes = 0;
            let seconds = 0;
            let ms = 0;

            if (str.includes(':')) {
                const parts = str.split(':');
                minutes = parseInt(parts[0], 10) || 0;
                const secParts = (parts[1] || '0').split('.');
                seconds = parseInt(secParts[0], 10) || 0;
                const hundredthsStr = (secParts[1] || '0').padEnd(2, '0').slice(0, 2);
                ms = parseInt(hundredthsStr, 10) * 10;
            } else {
                const dotParts = str.split('.');
                seconds = parseInt(dotParts[0], 10) || 0;
                const hundredthsStr = (dotParts[1] || '0').padEnd(2, '0').slice(0, 2);
                ms = parseInt(hundredthsStr, 10) * 10;
            }

            const totalMs = (minutes * 60 * 1000) + (seconds * 1000) + ms;

            if (isNaN(totalMs) || totalMs <= 0) {
                return {
                    timeMs: null,
                    isDQ: true,
                    rawTime: String(rawStr),
                    formatted: '0:00.00',
                    status: 'red',
                    note: 'Unresolvable time format'
                };
            }

            // Standard formatted string mm:ss.ms or ss.ms
            const secPad = String(seconds).padStart(2, '0');
            const hundPad = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
            const formatted = minutes > 0 ? `${minutes}:${secPad}.${hundPad}` : `${seconds}.${hundPad}`;

            return {
                timeMs: totalMs,
                isDQ: false,
                rawTime: String(rawStr),
                formatted: formatted,
                status: status,
                note: notes.join('; ') || 'Valid'
            };
        }

        /**
         * Cleans swimmer names:
         * - Resolves hyphenation artifacts: "Harriet PageDove-" -> "Harriet Page-Dove"
         * - Removes stray numeric relics: "Isia Edwards 9" -> "Isia Edwards"
         * - Removes lane or rank prefixes: "4 John Smith" -> "John Smith"
         * 
         * @param {string} rawName
         * @returns {string}
         */
        static cleanSwimmerName(rawName) {
            if (!rawName) return '';
            let name = String(rawName).trim();

            // 1. Remove lane markers, e.g. "Lane 4 John Smith", "Lane undefined John Smith", or leading digits
            name = name.replace(/^(?:Lane\s*)?(?:\d+|undefined)?\s*/i, '');
            name = name.replace(/^[1-8]\s+/, '');

            // 2. Remove trailing rank, points, or age digits, e.g. "Isia Edwards 9" or "Emily Daubney 7 2"
            name = name.replace(/\s+\d{1,2}\s+\d{1,2}$/, '');
            name = name.replace(/\s+\d{1,2}$/, '');

            // 3. Fix hyphenation artifacts:
            // "Harriet PageDove-" -> "Harriet Page-Dove"
            if (name.endsWith('-')) {
                name = name.slice(0, -1).trim();
                // Check if last word is camelCased jammed together (e.g. PageDove)
                name = name.replace(/([a-z])([A-Z])/g, '$1-$2');
            }
            // "Smith- Jones" or "Smith - Jones" -> "Smith-Jones"
            name = name.replace(/\s*-\s*/g, '-');

            // 4. Strip stray trailing punctuation
            name = name.replace(/[:;,.]+$/, '').trim();

            return name;
        }

        /**
         * Standardizes club identifiers across rounds:
         * - "N Cornwall" / "N Comwall" -> "North Cornwall Dragons"
         * - "Plymouth Lea" -> "Plymouth Leander"
         * - "Weston S Mare" / "Weston-super-Mare" -> "Weston SC"
         * - "Truro City" -> "Truro City"
         * - "Paignton" -> "Paignton"
         * - "Brixham" -> "Brixham"
         * - "Bridgwater" -> "Bridgwater"
         * - "Wells" -> "Wells"
         * - "Caradon" -> "Caradon"
         * 
         * @param {string} rawClub
         * @returns {string}
         */
        static cleanClubName(rawClub) {
            if (!rawClub) return 'Unknown Club';
            const cleanStr = String(rawClub).trim();

            for (const item of CLUB_STANDARDIZATION_MAP) {
                for (const pattern of item.patterns) {
                    if (pattern.test(cleanStr)) {
                        return item.canonical;
                    }
                }
            }

            return cleanStr;
        }

        /**
         * Identifies whether an event is a relay event.
         * Relay Events:
         * - Explicit numbers: 3, 4, 5, 6, 7, 8, 9, 10, 43, 44, 45, 46, 47, 48, 49, 50, 51
         * - Or matching keywords in event name (Relay, 4x50, 4x25, Cannon, Squadron)
         * 
         * @param {number|string} eventNum
         * @param {string} [eventName]
         * @returns {boolean}
         */
        static isRelayEvent(eventNum, eventName = '') {
            const num = parseInt(eventNum, 10);
            if (RELAY_EVENT_NUMBERS.has(num)) {
                return true;
            }

            if (eventName) {
                const upper = String(eventName).toUpperCase();
                if (upper.includes('RELAY') || upper.includes('4X50') || upper.includes('4X25') ||
                    upper.includes('CANNON') || upper.includes('SQUADRON')) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Formats milliseconds into swimming time string
         * @param {number} ms
         * @param {boolean} [forceMinutes=false]
         * @returns {string}
         */
        static formatMs(ms, forceMinutes = false) {
            if (ms === null || ms === undefined || ms <= 0 || isNaN(ms)) return '0:00.00';
            const totalHundredths = Math.round(ms / 10);
            const hundredths = totalHundredths % 100;
            const totalSeconds = Math.floor(totalHundredths / 100);
            const seconds = totalSeconds % 60;
            const minutes = Math.floor(totalSeconds / 60);

            const pad2 = n => String(n).padStart(2, '0');
            if (minutes > 0 || forceMinutes) {
                return `${minutes}:${pad2(seconds)}.${pad2(hundredths)}`;
            }
            return `${seconds}.${pad2(hundredths)}`;
        }
    }

    DataSanitizer.RELAY_EVENT_NUMBERS = RELAY_EVENT_NUMBERS;
    DataSanitizer.CLUB_STANDARDIZATION_MAP = CLUB_STANDARDIZATION_MAP;

    return DataSanitizer;
}));
