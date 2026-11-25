/**
 * galaImporter.js
 * Sheet Ingestion Orchestrator for Arena Race Manager
 * 
 * Uses DataSanitizer to:
 * - Parse raw OCR / PDF result sheets line-by-line.
 * - Map 8 lanes per event into structured round records.
 * - Flag entries as 'green' (confident), 'amber' (auto-corrected OCR), or 'red' (DQ / invalid).
 * - Handle relay events by aggregating into composite squad entries.
 * - Provide a staging output for the interactive Audit & Clean Preview Modal.
 * - Commit validated round records into StorageManager's persistent timesDB.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./dataSanitizer', './storageManager', '../timeUtils'], factory);
    } else if (typeof module === 'object' && module.exports) {
        const DataSanitizer = require('./dataSanitizer');
        const StorageManager = require('./storageManager');
        const TimeUtils = require('../timeUtils');
        module.exports = factory(DataSanitizer, StorageManager, TimeUtils);
    } else {
        root.GalaImporter = factory(root.DataSanitizer, root.StorageManager, root.TimeUtils);
    }
}(typeof self !== 'undefined' ? self : this, function (DataSanitizer, StorageManager, TimeUtils) {
    'use strict';

    /**
     * Recognized club match regex built from DataSanitizer's standardization map
     */
    const KNOWN_CLUB_PATTERNS = [
        'North Cornwall Dragons', 'North Cornwall', 'N Cornwall', 'N Comwall', 'NCD',
        'Plymouth Leander', 'Plymouth Lea', 'Plymouth', 'PLM',
        'Weston SC', 'Weston S Mare', 'Weston-super-Mare', 'Weston Super Mare', 'Weston', 'WSM',
        'Truro City', 'Truro', 'TRU',
        'Paignton', 'Brixham', 'BRX',
        'Bridgwater', 'BDG', 'Wells',
        'Caradon', 'CAR',
        'Swindon ASC', 'Swindon', 'SWN',
        'Bradford on Avon', 'Bradford-on-Avon', 'BOA',
        'City of Bristol B', 'City of Bristol', 'Bristol B', 'CBB',
        'Backwell', 'BKW',
        'Chippenham', 'CHIP',
        'Southwold', 'SWD',
        'Cirencester', 'CIR',
        'Severnside Tritons', 'Severnside', 'SVT',
        'City of Gloucester', 'Gloucester', 'GLO',
        'City of Newport', 'Newport', 'NEW'
    ];

    const CLUB_DETECT_REGEX = new RegExp(`\\b(${KNOWN_CLUB_PATTERNS.map(p => p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'i');

    /**
     * Regex to match swim times (both clean and OCR quirk patterns)
     */
    const TIME_DETECT_REGEX = /(?:\b\d{1,2}:\d{2}\.\d{2}\b|\b\d{1,3}\.\d{2}:?\b|:\d{2,3}\.\d{2}\b|:\d{2}\.\d{3}\b|\b\d{2}\.\d{3}:?\b|\b(?:DQ|DNS|DNF|DNC|DISQ|0[:.]00(?:[:.]00)?|RULE\s*\d+(?:\.\d+)?)\b)/i;

    /**
     * GalaImporter class
     */
    class GalaImporter {
        /**
         * Parses raw pasted OCR/PDF text into structured round records with validation preview data.
         * 
         * @param {string} rawText - Unsanitized raw text from gala result sheet
         * @param {Object} [options] - { roundLabel: 'Round 1', galaId: '2026_R1_Millfield', galaTitle: '' }
         * @returns {Object} Structured round audit preview
         */
        static parseSheet(rawText, options = {}) {
            if (!rawText || typeof rawText !== 'string') {
                return {
                    success: false,
                    roundLabel: options.roundLabel || 'Round 1',
                    galaId: options.galaId || 'GALA_IMPORT',
                    events: [],
                    stats: { totalSwims: 0, confidentCount: 0, warningCount: 0, dqCount: 0 },
                    errors: ['Input text is empty']
                };
            }

            const roundLabel = options.roundLabel || 'Round 1';
            const galaId = options.galaId || `GALA_${Date.now()}`;
            const galaTitle = options.galaTitle || `Arena League ${roundLabel}`;

            const lines = rawText.split(/\r?\n/);
            const eventsMap = new Map();
            let currentEventNumber = null;
            let currentEventName = '';
            const errors = [];

            // Event header matching, e.g.:
            // "Event 1 Women Open 200m Ind Medley" or "Event 10: Men 100m Backstroke"
            const eventHeaderRegex = /(?:Event|Race)\s+(\d+)(?:[:\s]+(.*))?/i;

            lines.forEach((line, lineIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                const eventMatch = trimmed.match(eventHeaderRegex);
                if (eventMatch) {
                    currentEventNumber = parseInt(eventMatch[1], 10);
                    currentEventName = eventMatch[2] ? eventMatch[2].trim() : `Event ${currentEventNumber}`;

                    if (!eventsMap.has(currentEventNumber)) {
                        const meta = GalaImporter.inferEventMetadata(currentEventNumber, currentEventName);
                        eventsMap.set(currentEventNumber, {
                            eventNumber: currentEventNumber,
                            eventName: currentEventName || meta.name,
                            ageGroup: meta.age,
                            gender: meta.gender,
                            stroke: meta.stroke,
                            distance: meta.distance,
                            isRelay: meta.isRelay,
                            entries: []
                        });
                    }
                    return;
                }

                // If currently inside an event, search for club results
                if (currentEventNumber !== null) {
                    const clubMatch = trimmed.match(CLUB_DETECT_REGEX);
                    if (clubMatch) {
                        const rawClub = clubMatch[0];
                        const standardizedClub = DataSanitizer.cleanClubName(rawClub);
                        const clubId = StorageManager.getClubId(standardizedClub);

                        const currentEventObj = eventsMap.get(currentEventNumber);
                        const isRelay = currentEventObj ? currentEventObj.isRelay : DataSanitizer.isRelayEvent(currentEventNumber);

                        // Find time
                        const timeMatch = trimmed.match(TIME_DETECT_REGEX);
                        const rawTimeStr = timeMatch ? timeMatch[0] : '';
                        const sanitizedTime = DataSanitizer.cleanTime(rawTimeStr, currentEventObj);

                        // Extract swimmer name or relay squad
                        let remaining = trimmed
                            .replace(clubMatch[0], '')
                            .replace(timeMatch ? timeMatch[0] : '', '')
                            .trim();

                        // Strip lane indicators, leading/trailing ranks
                        remaining = remaining.replace(/\bLane\s*(?:\d+|undefined)?\b/gi, '')
                                             .replace(/^[1-8]\s+/, '')
                                             .replace(/\s+\d+\s+\d+$/, '')
                                             .replace(/\s+[1-8]$/, '')
                                             .replace(/[:;,.]+$/, '')
                                             .trim();

                        let swimmerName = '';
                        if (isRelay) {
                            // Relay events aggregate as composite squad entries
                            swimmerName = `${standardizedClub} Squad`;
                        } else {
                            const cleanedSwimmer = DataSanitizer.cleanSwimmerName(remaining);
                            swimmerName = (cleanedSwimmer.length > 2 && !/^\d+$/.test(cleanedSwimmer))
                                ? cleanedSwimmer
                                : `${standardizedClub} Swimmer`;
                        }

                        // Determine lane if mentioned in line
                        let lane = null;
                        const laneMatch = trimmed.match(/\bLane\s*([1-8])\b/i);
                        if (laneMatch) {
                            lane = parseInt(laneMatch[1], 10);
                        }

                        const entryRecord = {
                            id: `entry_${currentEventNumber}_${clubId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            eventNumber: currentEventNumber,
                            club: standardizedClub,
                            clubId: clubId,
                            swimmer: swimmerName,
                            timeMs: sanitizedTime.timeMs,
                            timeStr: sanitizedTime.formatted,
                            rawTime: sanitizedTime.rawTime,
                            isDQ: sanitizedTime.isDQ,
                            lane: lane,
                            status: sanitizedTime.status, // 'green' | 'amber' | 'red'
                            note: sanitizedTime.note,
                            rawLine: trimmed
                        };

                        currentEventObj.entries.push(entryRecord);
                    }
                }
            });

            // Convert map to array and compute audit statistics
            const eventsArray = Array.from(eventsMap.values()).sort((a, b) => a.eventNumber - b.eventNumber);

            let totalSwims = 0;
            let confidentCount = 0;
            let warningCount = 0;
            let dqCount = 0;

            eventsArray.forEach(ev => {
                ev.entries.forEach(entry => {
                    totalSwims++;
                    if (entry.status === 'green') confidentCount++;
                    else if (entry.status === 'amber') warningCount++;
                    else if (entry.status === 'red') dqCount++;
                });
            });

            return {
                success: totalSwims > 0,
                galaId,
                galaTitle,
                roundLabel,
                events: eventsArray,
                stats: {
                    totalSwims,
                    confidentCount,
                    warningCount,
                    dqCount
                },
                errors
            };
        }

        /**
         * Infers event metadata (age, gender, stroke, distance, isRelay) using DataSanitizer
         */
        static inferEventMetadata(eventNumber, textDesc) {
            const desc = String(textDesc || '').toUpperCase();
            const isRelay = DataSanitizer.isRelayEvent(eventNumber, desc);

            // Gender
            let gender = 'Mixed';
            if (desc.includes('WOMEN') || desc.includes('GIRLS') || desc.includes('GIRL') || desc.includes('FEMALE')) {
                gender = 'Female';
            } else if (desc.includes('MEN') || desc.includes('BOYS') || desc.includes('BOY') || desc.includes('MALE')) {
                gender = 'Male';
            }

            // Age Group
            let age = 'Open';
            if (desc.includes('9-11') || desc.includes('9/11') || desc.includes('11/U') || desc.includes('10-11')) {
                age = '9-11';
            } else if (desc.includes('13/U') || desc.includes('13-U') || desc.includes('12-13') || desc.includes('13 & UNDER')) {
                age = '13/U';
            } else if (desc.includes('15/U') || desc.includes('15-U') || desc.includes('14-15') || desc.includes('15 & UNDER')) {
                age = '15/U';
            }

            // Stroke & Distance
            let stroke = isRelay ? 'Freestyle Relay' : 'Freestyle';
            let distance = isRelay ? 200 : 50;

            if (desc.includes('CANNON') || desc.includes('SQUADRON')) {
                stroke = 'Cannon Relay';
                distance = 400;
                gender = 'Mixed';
                age = 'Open';
            } else if (desc.includes('MEDLEY RELAY') || (desc.includes('MEDLEY') && isRelay)) {
                stroke = 'Medley Relay';
                distance = 200;
            } else if (desc.includes('FREE RELAY') || desc.includes('FREESTYLE RELAY')) {
                stroke = 'Freestyle Relay';
                distance = 200;
            } else if (desc.includes('MEDLEY') || desc.includes('I.M.') || desc.includes('IM')) {
                stroke = 'Medley';
                distance = 200;
            } else if (desc.includes('BACKSTROKE') || desc.includes('BACK')) {
                stroke = 'Backstroke';
                distance = desc.includes('100') ? 100 : 50;
            } else if (desc.includes('BUTTERFLY') || desc.includes('FLY')) {
                stroke = 'Butterfly';
                distance = desc.includes('100') ? 100 : 50;
            } else if (desc.includes('BREASTSTROKE') || desc.includes('BREAST')) {
                stroke = 'Breaststroke';
                distance = desc.includes('100') ? 100 : 50;
            } else if (desc.includes('FREESTYLE') || desc.includes('FREE')) {
                stroke = 'Freestyle';
                distance = desc.includes('100') ? 100 : 50;
            }

            return {
                name: textDesc || `Event ${eventNumber} ${age} ${gender} ${distance}m ${stroke}`,
                gender,
                age,
                stroke,
                distance,
                isRelay
            };
        }

        /**
         * Merges an audited/validated round record into StorageManager's timesDB and saves to localStorage
         * 
         * @param {Object} parsedRound - Output from parseSheet()
         * @param {StorageManager} storage - StorageManager instance
         * @returns {Object} Commit receipt with count of inserted swims
         */
        static commitToDatabase(parsedRound, storage) {
            if (!parsedRound || !parsedRound.events || !storage) {
                return { success: false, insertedSwims: 0, error: 'Invalid parsedRound or storage instance' };
            }

            let insertedSwims = 0;
            const roundLabel = parsedRound.roundLabel || 'Round 1';
            const date = new Date().toISOString().split('T')[0];

            parsedRound.events.forEach(ev => {
                const strokeDistKey = StorageManager.makeStrokeKey(ev.stroke, ev.distance);

                ev.entries.forEach(entry => {
                    storage.addSwimmerTime(entry.clubId, ev.ageGroup, ev.gender, strokeDistKey, {
                        swimmer: entry.swimmer,
                        timeMs: entry.timeMs || 0,
                        timeStr: entry.timeStr || '0:00.00',
                        round: roundLabel,
                        date: date,
                        isDQ: entry.isDQ,
                        eventNumber: ev.eventNumber
                    });
                    insertedSwims++;
                });
            });

            // Save state
            if (typeof storage.save === 'function') {
                storage.save();
            }

            return {
                success: true,
                insertedSwims,
                roundLabel,
                galaId: parsedRound.galaId
            };
        }
    }

    return GalaImporter;
}));
