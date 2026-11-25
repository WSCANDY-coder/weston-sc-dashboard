/**
 * round1Data.js
 * Pre-compiled Round 1 Gala Results & Reference Times for Arena Race Manager
 * Division 1 Gala 1 Target Lineup:
 * Caradon, Brixham, Truro City, Swindon ASC, North Cornwall Dragons, Bradford on Avon, Bridgwater, Weston S Mare
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const g = root || globalThis || window || self || {};
        g.ROUND_1_DATA = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function () {
    'use strict';

    // Realistic baseline seed times per event for the 8 clubs
    // Times based on Western Division 1 standards (short course 25m)
        const SEED_DATA_FULL = {
        1: {
            'Caradon': { swimmerName: 'J. Tremayne', timeStr: '2:24.50' },
            'Brixham': { swimmerName: 'E. Jones', timeStr: '2:27.10' },
            'Truro City': { swimmerName: 'S. Bennett', timeStr: '2:23.80' },
            'Swindon ASC': { swimmerName: 'Aimee Masters', timeStr: '2:38.12' },
            'North Cornwall Dragons': { swimmerName: 'C. Davies', timeStr: '2:31.20' },
            'Bradford on Avon': { swimmerName: 'Bradford Swimmer', timeStr: '2:50.45' },
            'Bridgwater': { swimmerName: 'L. Smith', timeStr: '2:33.50' },
            'Weston S Mare': { swimmerName: 'Madeleine Soper', timeStr: '2:29.21' }
        },
        2: {
            'Caradon': { swimmerName: 'M. Cole', timeStr: '2:12.30' },
            'Brixham': { swimmerName: 'R. Clark', timeStr: '2:15.80' },
            'Truro City': { swimmerName: 'T. Adams', timeStr: '2:10.50' },
            'Swindon ASC': { swimmerName: 'Fraiser Hawkins', timeStr: '2:26.88' },
            'North Cornwall Dragons': { swimmerName: 'T. Harris', timeStr: '2:18.90' },
            'Bradford on Avon': { swimmerName: 'Harry Britner', timeStr: '2:31.27' },
            'Bridgwater': { swimmerName: 'O. Walker', timeStr: '2:19.50' },
            'Weston S Mare': { swimmerName: 'Oliver Tomlinson', timeStr: '2:34.76' }
        },
        3: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:29.33' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:17.47' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:27.98' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:29.25' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:27.69' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:38.13' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:30.75' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:40.35' }
        },
        4: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:54.78' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:41.31' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:22.42' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:20.63' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:35.52' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:22.36' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:24.86' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '0:00.00' }
        },
        5: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:35.27' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:21.53' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:21.12' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:17.66' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:18.12' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:38.13' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:24.91' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:42.50' }
        },
        6: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '3:12.87' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:24.84' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:13.78' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:22.40' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:32.77' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:35.20' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:28.98' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:38.10' }
        },
        7: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:01.42' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:02.08' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '1:57.91' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:01.80' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '1:57.00' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:04.50' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:08.81' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:09.20' }
        },
        8: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '1:54.14' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:02.55' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '1:55.75' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '1:50.40' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '1:48.11' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '1:52.10' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:05.37' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '1:56.80' }
        },
        9: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:05.82' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:09.53' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:06.35' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:12.40' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:05.53' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:15.80' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:17.57' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:19.40' }
        },
        10: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:04.52' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:02.11' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:00.04' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '1:58.90' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '1:58.10' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:01.20' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:00.50' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:04.50' }
        },
        11: {
            'Caradon': { swimmerName: 'L. Richards', timeStr: '36.80' },
            'Brixham': { swimmerName: 'A. Kelly', timeStr: '38.10' },
            'Truro City': { swimmerName: 'F. Williams', timeStr: '35.90' },
            'Swindon ASC': { swimmerName: 'Aria Restuccia', timeStr: '0:41.06' },
            'North Cornwall Dragons': { swimmerName: 'H. Roberts', timeStr: '39.80' },
            'Bradford on Avon': { swimmerName: 'Alicia Mckerracher', timeStr: '0:45.59' },
            'Bridgwater': { swimmerName: 'M. Brown', timeStr: '41.10' },
            'Weston S Mare': { swimmerName: 'Bethany Thomas', timeStr: '0:45.58' }
        },
        12: {
            'Caradon': { swimmerName: 'J. Pascoe', timeStr: '37.50' },
            'Brixham': { swimmerName: 'C. Evans', timeStr: '39.20' },
            'Truro City': { swimmerName: 'B. Rowe', timeStr: '36.80' },
            'Swindon ASC': { swimmerName: 'Connor Lacey', timeStr: '0:38.50' },
            'North Cornwall Dragons': { swimmerName: 'L. White', timeStr: '41.00' },
            'Bradford on Avon': { swimmerName: 'Jack Daniell', timeStr: '0:40.74' },
            'Bridgwater': { swimmerName: 'T. Hughes', timeStr: '40.30' },
            'Weston S Mare': { swimmerName: 'Billy Marshall', timeStr: '0:38.85' }
        },
        13: {
            'Caradon': { swimmerName: 'E. Hawke', timeStr: '1:13.20' },
            'Brixham': { swimmerName: 'S. Collins', timeStr: '1:16.00' },
            'Truro City': { swimmerName: 'M. Trevethan', timeStr: '1:11.90' },
            'Swindon ASC': { swimmerName: 'Bethany Middleditch', timeStr: '1:25.16' },
            'North Cornwall Dragons': { swimmerName: 'A. Matthews', timeStr: '1:17.80' },
            'Bradford on Avon': { swimmerName: 'Amira Aliri', timeStr: '1:31.03' },
            'Bridgwater': { swimmerName: 'K. James', timeStr: '1:18.50' },
            'Weston S Mare': { swimmerName: 'Rosie Livesey', timeStr: '1:25.14' }
        },
        14: {
            'Caradon': { swimmerName: 'R. Pengelly', timeStr: '1:11.80' },
            'Brixham': { swimmerName: 'J. Foster', timeStr: '1:13.90' },
            'Truro City': { swimmerName: 'E. Hosking', timeStr: '1:09.70' },
            'Swindon ASC': { swimmerName: 'Ethan Parker', timeStr: '1:33.70' },
            'North Cornwall Dragons': { swimmerName: 'S. Knight', timeStr: '1:16.40' },
            'Bradford on Avon': { swimmerName: 'Benjamin Hancock', timeStr: '1:31.45' },
            'Bridgwater': { swimmerName: 'M. Jenkins', timeStr: '1:16.90' },
            'Weston S Mare': { swimmerName: 'Austin Hodder', timeStr: '1:26.39' }
        },
        15: {
            'Caradon': { swimmerName: 'C. Hocking', timeStr: '1:09.10' },
            'Brixham': { swimmerName: 'N. Powell', timeStr: '1:11.40' },
            'Truro City': { swimmerName: 'L. Jeffery', timeStr: '1:07.80' },
            'Swindon ASC': { swimmerName: 'Charlotte Holborow', timeStr: '1:14.43' },
            'North Cornwall Dragons': { swimmerName: 'P. Dennis', timeStr: '1:13.20' },
            'Bradford on Avon': { swimmerName: 'Polly Bateman', timeStr: '1:13.00' },
            'Bridgwater': { swimmerName: 'H. Bennett', timeStr: '1:14.50' },
            'Weston S Mare': { swimmerName: 'Ava Mitchard', timeStr: '1:20.07' }
        },
        16: {
            'Caradon': { swimmerName: 'O. Jasper', timeStr: '1:04.50' },
            'Brixham': { swimmerName: 'M. Barnes', timeStr: '1:06.80' },
            'Truro City': { swimmerName: 'J. Chenoweth', timeStr: '1:02.90' },
            'Swindon ASC': { swimmerName: 'Rhys Evans', timeStr: '1:11.37' },
            'North Cornwall Dragons': { swimmerName: 'B. Bray', timeStr: '1:08.90' },
            'Bradford on Avon': { swimmerName: 'Jacob Green', timeStr: '1:12.76' },
            'Bridgwater': { swimmerName: 'N. Reed', timeStr: '1:09.80' },
            'Weston S Mare': { swimmerName: 'Oliver Waller', timeStr: '1:20.94' }
        },
        17: {
            'Caradon': { swimmerName: 'J. Tremayne', timeStr: '1:05.20' },
            'Brixham': { swimmerName: 'E. Jones', timeStr: '1:06.90' },
            'Truro City': { swimmerName: 'A. Bray', timeStr: '1:03.80' },
            'Swindon ASC': { swimmerName: 'Amelia Cripps', timeStr: '1:04.22' },
            'North Cornwall Dragons': { swimmerName: 'C. Davies', timeStr: '1:08.40' },
            'Bradford on Avon': { swimmerName: 'Victoria Williams', timeStr: '1:14.57' },
            'Bridgwater': { swimmerName: 'L. Smith', timeStr: '1:09.90' },
            'Weston S Mare': { swimmerName: 'Ruby Soper', timeStr: '1:21.22' }
        },
        18: {
            'Caradon': { swimmerName: 'M. Cole', timeStr: '58.80' },
            'Brixham': { swimmerName: 'R. Clark', timeStr: '1:00.50' },
            'Truro City': { swimmerName: 'T. Adams', timeStr: '57.40' },
            'Swindon ASC': { swimmerName: 'Tyler Checchia', timeStr: '1:01.37' },
            'North Cornwall Dragons': { swimmerName: 'T. Harris', timeStr: '1:02.50' },
            'Bradford on Avon': { swimmerName: 'Harry Britner', timeStr: '1:06.22' },
            'Bridgwater': { swimmerName: 'O. Walker', timeStr: '1:03.70' },
            'Weston S Mare': { swimmerName: 'Oliver Tomlinson', timeStr: '1:07.49' }
        },
        19: {
            'Caradon': { swimmerName: 'L. Richards', timeStr: '42.90' },
            'Brixham': { swimmerName: 'A. Kelly', timeStr: '44.50' },
            'Truro City': { swimmerName: 'F. Williams', timeStr: '41.80' },
            'Swindon ASC': { swimmerName: 'Aria Restuccia', timeStr: '0:38.21' },
            'North Cornwall Dragons': { swimmerName: 'H. Roberts', timeStr: '46.10' },
            'Bradford on Avon': { swimmerName: 'Frankie Miles', timeStr: '0:46.87' },
            'Bridgwater': { swimmerName: 'M. Brown', timeStr: '47.50' },
            'Weston S Mare': { swimmerName: 'Bethany Thomas', timeStr: '0:41.51' }
        },
        20: {
            'Caradon': { swimmerName: 'J. Pascoe', timeStr: '43.50' },
            'Brixham': { swimmerName: 'C. Evans', timeStr: '45.20' },
            'Truro City': { swimmerName: 'B. Rowe', timeStr: '42.40' },
            'Swindon ASC': { swimmerName: 'Connor Lacey', timeStr: '0:35.58' },
            'North Cornwall Dragons': { swimmerName: 'L. White', timeStr: '47.10' },
            'Bradford on Avon': { swimmerName: 'Joseph Noad', timeStr: '0:40.97' },
            'Bridgwater': { swimmerName: 'T. Hughes', timeStr: '46.60' },
            'Weston S Mare': { swimmerName: 'Billy Marshall', timeStr: '0:40.62' }
        },
        21: {
            'Caradon': { swimmerName: 'E. Hawke', timeStr: '1:23.50' },
            'Brixham': { swimmerName: 'S. Collins', timeStr: '1:26.10' },
            'Truro City': { swimmerName: 'M. Trevethan', timeStr: '1:22.00' },
            'Swindon ASC': { swimmerName: 'Lucy Paines', timeStr: '1:13.77' },
            'North Cornwall Dragons': { swimmerName: 'A. Matthews', timeStr: '1:28.00' },
            'Bradford on Avon': { swimmerName: 'Isla Quelch', timeStr: '1:14.97' },
            'Bridgwater': { swimmerName: 'K. James', timeStr: '1:29.50' },
            'Weston S Mare': { swimmerName: 'Rosie Livesey', timeStr: '1:18.12' }
        },
        22: {
            'Caradon': { swimmerName: 'R. Pengelly', timeStr: '1:21.40' },
            'Brixham': { swimmerName: 'J. Foster', timeStr: '1:23.80' },
            'Truro City': { swimmerName: 'E. Hosking', timeStr: '1:19.60' },
            'Swindon ASC': { swimmerName: 'Cole Parker', timeStr: '1:15.25' },
            'North Cornwall Dragons': { swimmerName: 'S. Knight', timeStr: '1:25.90' },
            'Bradford on Avon': { swimmerName: 'Toby Edwards', timeStr: '1:22.64' },
            'Bridgwater': { swimmerName: 'M. Jenkins', timeStr: '1:26.70' },
            'Weston S Mare': { swimmerName: 'Freddie Marshall', timeStr: '1:23.39' }
        },
        23: {
            'Caradon': { swimmerName: 'C. Hocking', timeStr: '1:19.40' },
            'Brixham': { swimmerName: 'N. Powell', timeStr: '1:21.90' },
            'Truro City': { swimmerName: 'L. Jeffery', timeStr: '1:17.80' },
            'Swindon ASC': { swimmerName: 'Isla Wall', timeStr: '1:12.53' },
            'North Cornwall Dragons': { swimmerName: 'P. Dennis', timeStr: '1:23.70' },
            'Bradford on Avon': { swimmerName: 'Ida Hibbard', timeStr: '1:24.27' },
            'Bridgwater': { swimmerName: 'H. Bennett', timeStr: '1:25.00' },
            'Weston S Mare': { swimmerName: 'Emily Butcher', timeStr: '1:26.06' }
        },
        24: {
            'Caradon': { swimmerName: 'O. Jasper', timeStr: '1:14.20' },
            'Brixham': { swimmerName: 'M. Barnes', timeStr: '1:16.80' },
            'Truro City': { swimmerName: 'J. Chenoweth', timeStr: '1:12.60' },
            'Swindon ASC': { swimmerName: 'Fletcher Mutton', timeStr: '1:06.92' },
            'North Cornwall Dragons': { swimmerName: 'B. Bray', timeStr: '1:18.80' },
            'Bradford on Avon': { swimmerName: 'Oscar Dommett', timeStr: '1:08.47' },
            'Bridgwater': { swimmerName: 'N. Reed', timeStr: '1:19.90' },
            'Weston S Mare': { swimmerName: 'Freddie Marshall', timeStr: '1:27.46' }
        },
        25: {
            'Caradon': { swimmerName: 'J. Tremayne', timeStr: '1:15.50' },
            'Brixham': { swimmerName: 'E. Jones', timeStr: '1:17.60' },
            'Truro City': { swimmerName: 'A. Bray', timeStr: '1:14.20' },
            'Swindon ASC': { swimmerName: 'Aimee Masters', timeStr: '1:09.90' },
            'North Cornwall Dragons': { swimmerName: 'C. Davies', timeStr: '1:19.80' },
            'Bradford on Avon': { swimmerName: 'Flora Kirtley', timeStr: '1:11.43' },
            'Bridgwater': { swimmerName: 'L. Smith', timeStr: '1:21.00' },
            'Weston S Mare': { swimmerName: 'Madeleine Soper', timeStr: '1:07.23' }
        },
        26: {
            'Caradon': { swimmerName: 'M. Cole', timeStr: '1:07.20' },
            'Brixham': { swimmerName: 'R. Clark', timeStr: '1:09.10' },
            'Truro City': { swimmerName: 'T. Adams', timeStr: '1:05.80' },
            'Swindon ASC': { swimmerName: 'Rhys Evans', timeStr: '1:12.49' },
            'North Cornwall Dragons': { swimmerName: 'T. Harris', timeStr: '1:11.40' },
            'Bradford on Avon': { swimmerName: 'Harry Britner', timeStr: '1:09.99' },
            'Bridgwater': { swimmerName: 'O. Walker', timeStr: '1:12.60' },
            'Weston S Mare': { swimmerName: 'Zac Oates', timeStr: '1:14.22' }
        },
        27: {
            'Caradon': { swimmerName: 'L. Richards', timeStr: '32.50' },
            'Brixham': { swimmerName: 'A. Kelly', timeStr: '33.80' },
            'Truro City': { swimmerName: 'F. Williams', timeStr: '31.90' },
            'Swindon ASC': { swimmerName: 'Seren Jones', timeStr: '0:47.40' },
            'North Cornwall Dragons': { swimmerName: 'H. Roberts', timeStr: '34.90' },
            'Bradford on Avon': { swimmerName: 'Sophia Carrivick', timeStr: '0:44.78' },
            'Bridgwater': { swimmerName: 'M. Brown', timeStr: '35.80' },
            'Weston S Mare': { swimmerName: 'Alexie Tembey-Barnard', timeStr: '0:46.37' }
        },
        28: {
            'Caradon': { swimmerName: 'J. Pascoe', timeStr: '33.10' },
            'Brixham': { swimmerName: 'C. Evans', timeStr: '34.40' },
            'Truro City': { swimmerName: 'B. Rowe', timeStr: '32.30' },
            'Swindon ASC': { swimmerName: 'Daniel Paines', timeStr: '0:45.50' },
            'North Cornwall Dragons': { swimmerName: 'L. White', timeStr: '35.60' },
            'Bradford on Avon': { swimmerName: 'Noah Romain', timeStr: '0:45.07' },
            'Bridgwater': { swimmerName: 'T. Hughes', timeStr: '35.20' },
            'Weston S Mare': { swimmerName: 'Emil Faradzov', timeStr: '0:49.82' }
        },
        29: {
            'Caradon': { swimmerName: 'E. Hawke', timeStr: '1:04.20' },
            'Brixham': { swimmerName: 'S. Collins', timeStr: '1:06.50' },
            'Truro City': { swimmerName: 'M. Trevethan', timeStr: '1:03.10' },
            'Swindon ASC': { swimmerName: 'Bethany Middleditch', timeStr: '1:23.91' },
            'North Cornwall Dragons': { swimmerName: 'A. Matthews', timeStr: '1:08.00' },
            'Bradford on Avon': { swimmerName: 'Amira Aliri', timeStr: '1:18.15' },
            'Bridgwater': { swimmerName: 'K. James', timeStr: '1:09.20' },
            'Weston S Mare': { swimmerName: 'Felicity Thomas', timeStr: '1:22.30' }
        },
        30: {
            'Caradon': { swimmerName: 'R. Pengelly', timeStr: '1:02.80' },
            'Brixham': { swimmerName: 'J. Foster', timeStr: '1:04.60' },
            'Truro City': { swimmerName: 'E. Hosking', timeStr: '1:01.30' },
            'Swindon ASC': { swimmerName: 'Elliot Couchman', timeStr: '1:14.53' },
            'North Cornwall Dragons': { swimmerName: 'S. Knight', timeStr: '1:06.50' },
            'Bradford on Avon': { swimmerName: 'Owen Rickard', timeStr: '1:20.93' },
            'Bridgwater': { swimmerName: 'M. Jenkins', timeStr: '1:07.10' },
            'Weston S Mare': { swimmerName: 'Freddie Marshall', timeStr: '1:30.68' }
        },
        31: {
            'Caradon': { swimmerName: 'C. Hocking', timeStr: '1:01.50' },
            'Brixham': { swimmerName: 'N. Powell', timeStr: '1:03.40' },
            'Truro City': { swimmerName: 'L. Jeffery', timeStr: '1:00.60' },
            'Swindon ASC': { swimmerName: 'Phoebe Miller', timeStr: '1:05.66' },
            'North Cornwall Dragons': { swimmerName: 'P. Dennis', timeStr: '1:05.10' },
            'Bradford on Avon': { swimmerName: 'Polly Bateman', timeStr: '1:07.95' },
            'Bridgwater': { swimmerName: 'H. Bennett', timeStr: '1:06.30' },
            'Weston S Mare': { swimmerName: 'Emily Butcher', timeStr: '1:13.15' }
        },
        32: {
            'Caradon': { swimmerName: 'O. Jasper', timeStr: '56.90' },
            'Brixham': { swimmerName: 'M. Barnes', timeStr: '58.80' },
            'Truro City': { swimmerName: 'J. Chenoweth', timeStr: '55.50' },
            'Swindon ASC': { swimmerName: 'Oscar Harvey-Sullivan', timeStr: '0:59.45' },
            'North Cornwall Dragons': { swimmerName: 'B. Bray', timeStr: '1:00.60' },
            'Bradford on Avon': { swimmerName: 'Roan Watkin', timeStr: '1:00.53' },
            'Bridgwater': { swimmerName: 'N. Reed', timeStr: '1:01.50' },
            'Weston S Mare': { swimmerName: 'Oliver Waller', timeStr: '1:09.41' }
        },
        33: {
            'Caradon': { swimmerName: 'J. Tremayne', timeStr: '58.90' },
            'Brixham': { swimmerName: 'E. Jones', timeStr: '1:00.80' },
            'Truro City': { swimmerName: 'A. Bray', timeStr: '57.90' },
            'Swindon ASC': { swimmerName: 'Aimee Masters', timeStr: '1:27.11' },
            'North Cornwall Dragons': { swimmerName: 'C. Davies', timeStr: '1:02.10' },
            'Bradford on Avon': { swimmerName: 'Felicity Hobbs', timeStr: '1:26.04' },
            'Bridgwater': { swimmerName: 'L. Smith', timeStr: '1:03.50' },
            'Weston S Mare': { swimmerName: 'Siena Blackshaw', timeStr: '1:32.03' }
        },
        34: {
            'Caradon': { swimmerName: 'M. Cole', timeStr: '53.10' },
            'Brixham': { swimmerName: 'R. Clark', timeStr: '54.80' },
            'Truro City': { swimmerName: 'T. Adams', timeStr: '51.90' },
            'Swindon ASC': { swimmerName: 'Thomas Sprawson', timeStr: '1:16.41' },
            'North Cornwall Dragons': { swimmerName: 'T. Harris', timeStr: '56.20' },
            'Bradford on Avon': { swimmerName: 'Harrison Bown', timeStr: '1:20.51' },
            'Bridgwater': { swimmerName: 'O. Walker', timeStr: '57.40' },
            'Weston S Mare': { swimmerName: 'Zac Oates', timeStr: '1:26.10' }
        },
        35: {
            'Caradon': { swimmerName: 'Aaliyah Best', timeStr: '0:38.54' },
            'Brixham': { swimmerName: 'Isla King', timeStr: '0:31.98' },
            'Truro City': { swimmerName: 'Nola Manser', timeStr: '0:37.56' },
            'Swindon ASC': { swimmerName: 'Imogen Harris', timeStr: '0:36.85' },
            'North Cornwall Dragons': { swimmerName: 'Josie Faragher', timeStr: '0:34.96' },
            'Bradford on Avon': { swimmerName: 'Alicia Mckerracher', timeStr: '0:38.51' },
            'Bridgwater': { swimmerName: 'Frankie James', timeStr: '0:38.01' },
            'Weston S Mare': { swimmerName: 'Alexie Tembey-Barnard', timeStr: '0:37.91' }
        },
        36: {
            'Caradon': { swimmerName: 'Leopold Thomas', timeStr: '0:37.57' },
            'Brixham': { swimmerName: 'Edward Critchley', timeStr: '0:36.40' },
            'Truro City': { swimmerName: 'Luke Byatt', timeStr: '0:32.21' },
            'Swindon ASC': { swimmerName: 'Daniel Paines', timeStr: '0:33.37' },
            'North Cornwall Dragons': { swimmerName: 'Benjamin Leeming', timeStr: '0:38.62' },
            'Bradford on Avon': { swimmerName: 'Archie Biddell', timeStr: '0:32.95' },
            'Bridgwater': { swimmerName: 'Aaryan Arif', timeStr: '0:34.39' },
            'Weston S Mare': { swimmerName: 'Emil Faradzov', timeStr: '0:39.81' }
        },
        37: {
            'Caradon': { swimmerName: 'Pepper Mccormack', timeStr: '1:09.98' },
            'Brixham': { swimmerName: 'Marley Selway', timeStr: '1:09.31' },
            'Truro City': { swimmerName: 'Ella Holmes', timeStr: '1:06.00' },
            'Swindon ASC': { swimmerName: 'Phoebe Miller', timeStr: '1:06.47' },
            'North Cornwall Dragons': { swimmerName: 'Lerryn Godfrey', timeStr: '1:06.21' },
            'Bradford on Avon': { swimmerName: 'Thea Williams', timeStr: '1:07.61' },
            'Bridgwater': { swimmerName: 'Olivia Davey', timeStr: '1:10.51' },
            'Weston S Mare': { swimmerName: 'Felicity Thomas', timeStr: '1:13.67' }
        },
        38: {
            'Caradon': { swimmerName: 'Phoenix Elwell', timeStr: '1:25.26' },
            'Brixham': { swimmerName: 'Stephan Todor', timeStr: '1:15.57' },
            'Truro City': { swimmerName: 'Marley Wood', timeStr: '1:02.00' },
            'Swindon ASC': { swimmerName: 'Elliot Couchman', timeStr: '1:08.57' },
            'North Cornwall Dragons': { swimmerName: 'Isaac Brown', timeStr: '1:09.68' },
            'Bradford on Avon': { swimmerName: 'Frederick Eveleigh', timeStr: '1:14.70' },
            'Bridgwater': { swimmerName: 'Brody O\'Brien', timeStr: '1:08.16' },
            'Weston S Mare': { swimmerName: 'Austin Hodder', timeStr: '1:13.34' }
        },
        39: {
            'Caradon': { swimmerName: 'Alice Sneddon', timeStr: '1:25.21' },
            'Brixham': { swimmerName: 'Mia Rixon', timeStr: '1:25.09' },
            'Truro City': { swimmerName: 'Ava Morcom', timeStr: '1:26.07' },
            'Swindon ASC': { swimmerName: 'Robyn Whitehead', timeStr: '1:24.55' },
            'North Cornwall Dragons': { swimmerName: 'Meg Lee', timeStr: '1:26.62' },
            'Bradford on Avon': { swimmerName: 'Isobel Tansley', timeStr: '1:23.98' },
            'Bridgwater': { swimmerName: 'Beth Wintle', timeStr: '1:29.48' },
            'Weston S Mare': { swimmerName: 'Lola Tembey Barnard', timeStr: '1:29.77' }
        },
        40: {
            'Caradon': { swimmerName: 'Noah George', timeStr: '1:19.03' },
            'Brixham': { swimmerName: 'Finn Timmins', timeStr: '1:17.49' },
            'Truro City': { swimmerName: 'Dylan Espey', timeStr: '1:26.09' },
            'Swindon ASC': { swimmerName: 'Rhys Evans', timeStr: '1:18.12' },
            'North Cornwall Dragons': { swimmerName: 'Samuel Cornelius', timeStr: '1:15.32' },
            'Bradford on Avon': { swimmerName: 'Abe Hibbard', timeStr: '1:13.60' },
            'Bridgwater': { swimmerName: 'Heath Tottle', timeStr: '1:23.11' },
            'Weston S Mare': { swimmerName: 'Seth Gould', timeStr: '1:31.41' }
        },
        41: {
            'Caradon': { swimmerName: 'Lucia Grant', timeStr: '1:05.66' },
            'Brixham': { swimmerName: 'Lara Todor', timeStr: '1:06.94' },
            'Truro City': { swimmerName: 'Evie Skinner', timeStr: '1:00.76' },
            'Swindon ASC': { swimmerName: 'Amelia Cripps', timeStr: '0:58.42' },
            'North Cornwall Dragons': { swimmerName: 'Robyn Fitzhenry', timeStr: '1:00.39' },
            'Bradford on Avon': { swimmerName: 'Rebecca Smith', timeStr: '1:03.99' },
            'Bridgwater': { swimmerName: 'Emily Wright', timeStr: '1:05.46' },
            'Weston S Mare': { swimmerName: 'Jessica Knight', timeStr: '1:02.77' }
        },
        42: {
            'Caradon': { swimmerName: 'Matthew Holland', timeStr: '1:01.11' },
            'Brixham': { swimmerName: 'Brendan Budd', timeStr: '1:00.35' },
            'Truro City': { swimmerName: 'George Mitchell', timeStr: '0:55.81' },
            'Swindon ASC': { swimmerName: 'Evan Kane', timeStr: '0:58.12' },
            'North Cornwall Dragons': { swimmerName: 'William Davies', timeStr: '0:53.90' },
            'Bradford on Avon': { swimmerName: 'Oscar Dommett', timeStr: '1:00.85' },
            'Bridgwater': { swimmerName: 'Malakai Prothero', timeStr: '0:59.47' },
            'Weston S Mare': { swimmerName: 'Zac Oates', timeStr: '1:01.51' }
        },
        43: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '3:11.37' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:40.59' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '0:00.00' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:50.43' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:54.16' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '3:03.35' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '3:00.86' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '3:14.12' }
        },
        44: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '3:36.72' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '3:10.10' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:45.92' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:41.74' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '3:05.25' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:49.65' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:57.81' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '0:00.00' }
        },
        45: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:13.28' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:07.55' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:04.74' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:02.18' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:03.67' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:08.09' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:09.34' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:23.15' }
        },
        46: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:40.14' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:11.09' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '1:59.50' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:03.20' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:10.67' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:15.69' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:15.65' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:19.72' }
        },
        47: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:18.31' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:15.70' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:14.77' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:17.44' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:12.61' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:18.84' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:30.73' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:39.75' }
        },
        48: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '2:10.97' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:17.46' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '2:11.76' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '2:02.59' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '2:03.50' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:01.55' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:26.94' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:33.82' }
        },
        49: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '1:55.64' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '2:00.09' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '1:55.69' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '1:58.07' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '1:58.07' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '2:03.20' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '2:00.51' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '2:03.18' }
        },
        50: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '1:55.33' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '1:47.82' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '1:44.99' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '1:45.96' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '1:47.18' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '1:50.09' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '1:47.28' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '1:51.54' }
        },
        51: {
            'Caradon': { swimmerName: 'Caradon Squad', timeStr: '0:00.00' },
            'Brixham': { swimmerName: 'Brixham Squad', timeStr: '4:03.26' },
            'Truro City': { swimmerName: 'Truro City Squad', timeStr: '3:55.13' },
            'Swindon ASC': { swimmerName: 'Swindon ASC Squad', timeStr: '4:01.85' },
            'North Cornwall Dragons': { swimmerName: 'North Cornwall Dragons Squad', timeStr: '3:57.20' },
            'Bradford on Avon': { swimmerName: 'Bradford on Avon Squad', timeStr: '4:06.49' },
            'Bridgwater': { swimmerName: 'Bridgwater Squad', timeStr: '4:06.44' },
            'Weston S Mare': { swimmerName: 'Weston SC Squad', timeStr: '4:21.62' }
        }
    };

    /**
     * Raw text export mimicking scanned OCR output from
     * Division-1-Gala-1-Millfield-12-noon.pdf
     */
    const RAW_MILLFIELD_OCR_TEXT = `NATIONAL ARENA SWIMMING LEAGUE - WESTERN DIVISION
Round 1 - Division 1 Gala 1 - Millfield (12:00 Noon)
Results Sheet

Event 1 Women Open 200m Ind Medley
1 Truro City S. Bennett 2:23.80 8
2 Caradon J. Tremayne 2:24.50 7
3 Brixham E. Jones 2:27.10 6
4 North Cornwall Dragons C. Davies 2:31.20 5
5 Bridgwater L. Smith 2:33.50 4

Event 2 Men Open 200m Ind Medley
1 Truro City T. Adams 2:10.50 8
2 Caradon M. Cole :104.72: 7
3 Brixham R. Clark 2:15.80 6
4 North Cornwall Dragons T. Harris 2:18.90 5
5 Bridgwater O. Walker 2:19.50 4

Event 3 Girls 9-11 50m Backstroke
1 Truro City F. Williams 37.60 8
2 Caradon L. Richards 38.40 7
3 Brixham A. Kelly 39.80 6
4 North Cornwall Dragons H. Roberts 41.20 5
5 Bridgwater M. Brown 42.00 4

Event 4 Boys 9-11 50m Backstroke
1 Truro City B. Rowe 38.20 8
2 Caradon J. Pascoe 39.10 7
3 Brixham C. Evans 40.50 6
4 Bridgwater T. Hughes 41.40 5
5 North Cornwall Dragons L. White 42.80 4

Event 5 Girls 13/U 100m Backstroke
1 Truro City M. Trevethan 1:13.50 8
2 Caradon E. Hawke 1:14.20 7
3 Brixham S. Collins 1:16.80 6
4 North Cornwall Dragons A. Matthews 1:18.40 5
5 Bridgwater K. James 1:19.30 4

Event 6 Boys 13/U 100m Backstroke
1 Truro City E. Hosking 1:11.80 8
2 Caradon R. Pengelly 1:13.90 7
3 Brixham J. Foster 1:15.40 6
4 Bridgwater M. Jenkins 1:17.80 5
5 North Cornwall Dragons S. Knight 1:18.00 4

Event 7 Girls 15/U 100m Backstroke
1 Truro City L. Jeffery 1:09.80 8
2 Caradon C. Hocking 1:10.50 7
3 Brixham N. Powell 1:12.70 6
4 North Cornwall Dragons P. Dennis 1:14.30 5
5 Bridgwater H. Bennett 1:15.10 4

Event 8 Boys 15/U 100m Backstroke
1 Truro City J. Chenoweth 1:04.90 8
2 Caradon O. Jasper 1:06.10 7
3 Brixham M. Barnes 1:08.50 6
4 North Cornwall Dragons B. Bray 1:10.40 5
5 Bridgwater N. Reed 1:11.20 4

Event 9 Women Open 100m Backstroke
1 Truro City A. Bray 1:04.90 8
2 Caradon J. Tremayne 1:05.80 7
3 Brixham E. Jones 1:07.40 6
4 North Cornwall Dragons C. Davies 1:09.10 5
5 Bridgwater L. Smith 1:10.80 4

Event 10 Men Open 100m Backstroke
1 Truro City T. Adams 59.20 8
2 Caradon M. Cole 1:00.40 7
3 Brixham R. Clark 1:02.10 6
4 North Cornwall Dragons T. Harris 1:04.20 5
5 Bridgwater O. Walker 1:05.30 4
`;

    /**
     * Raw text export from Division-1-Gala-2-Hutton-Moor-5pm (1).pdf
     */
    const RAW_HUTTON_MOOR_OCR_TEXT = `# Division 1 Gala 2 - Hutton Moor (5pm)
# Venue: Hutton Moor / Weston Super Mare
# Date: 10/10/2026 - License: 3SW262350

Event 1 Women Open 200m Ind Medley
Lane undefined Swindon ASC Aimee Masters 2:38.12 3 6
Lane undefined City of Bristol B Lydia Bulmer 2:35.41 2 7
Lane undefined Backwell Isabel Mason 2:43.25 6 3
Lane undefined Chippenham Emily Daubney 2:45.41 7 2
Lane undefined Southwold Rosie Johnson 2:42.19 5 4
Lane undefined Cirencester Amelia Stenson 2:40.62 4 5
Lane undefined Bradford on Avon Bradford Swimmer 2:50.45 8 1
Lane undefined Weston SC Madeleine Soper 2:29.21 1 8

Event 2 Men Open 200m Ind Medley
Lane undefined Swindon ASC Fraiser Hawkins 2:26.88 5 4
Lane undefined City of Bristol B Benjamin Cox 2:25.55 4 5
Lane undefined Backwell Barnaby Wheeler 2:18.15 1 8
Lane undefined Chippenham Beau Young 2:19.25 2 7
Lane undefined Southwold Ben Rawlins 2:24.67 3 6
Lane undefined Cirencester Archie James 2:27.47 6 3
Lane undefined Bradford on Avon Harry Britner 2:31.27 7 2
Lane undefined Weston SC Oliver Tomlinson 2:34.76 8 1

Event 3 Girls 9/11 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:29.25 4 5
Lane undefined City of Bristol B City of Bristol B Squad 2:24.83 2 7
Lane undefined Backwell Backwell Squad 2:26.21 3 6
Lane undefined Chippenham Chippenham Squad 2:36.18 5 4
Lane undefined Southwold Southwold Squad 2:55.60 8 1
Lane undefined Cirencester Cirencester Squad 2:14.83 1 8
Lane undefined Bradford on Avon Bradford on Avon Squad 2:38.13 6 3
Lane undefined Weston SC Weston SC Squad 2:40.35 7 2

Event 4 Boys 9/11 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:20.63 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:43.22 5 4
Lane undefined Backwell Backwell Squad 0:00.00 0 0
Lane undefined Chippenham Chippenham Squad 2:55.81 6 3
Lane undefined Southwold Southwold Squad 2:38.11 4 5
Lane undefined Cirencester Cirencester Squad 2:17.98 1 8
Lane undefined Bradford on Avon Bradford on Avon Squad 2:22.36 3 6
Lane undefined Weston SC Weston SC Squad 0:00.00 0 0

Event 5 Girls 13/U 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:17.66 1 8
Lane undefined City of Bristol B City of Bristol B Squad 2:19.72 2 7
Lane undefined Backwell Backwell Squad 2:24.87 5 4
Lane undefined Chippenham Chippenham Squad 2:38.72 8 1
Lane undefined Southwold Southwold Squad 2:29.75 6 3
Lane undefined Cirencester Cirencester Squad 2:23.17 4 5
Lane undefined Bradford on Avon Bradford on Avon Squad 2:21.95 3 6
Lane undefined Weston SC Weston SC Squad 2:35.14 7 2

Event 6 Boys 13/U 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:21.67 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:22.81 3 6
Lane undefined Backwell Backwell Squad 2:14.24 1 8
Lane undefined Chippenham Chippenham Squad 2:52.90 8 1
Lane undefined Southwold Southwold Squad 2:26.04 4 5
Lane undefined Cirencester Cirencester Squad 2:27.14 5 4
Lane undefined Bradford on Avon Bradford on Avon Squad 2:29.84 6 3
Lane undefined Weston SC Weston SC Squad 2:36.28 7 2

Event 7 Girls 15/U 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:01.59 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:00.23 1 8
Lane undefined Backwell Backwell Squad 2:08.37 7 2
Lane undefined Chippenham Chippenham Squad 2:04.46 4 5
Lane undefined Southwold Southwold Squad 2:04.57 5 4
Lane undefined Cirencester Cirencester Squad 2:04.90 6 3
Lane undefined Bradford on Avon Bradford on Avon Squad 2:04.07 3 6
Lane undefined Weston SC Weston SC Squad 2:13.90 8 1

Event 8 Boys 15/U 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 1:47.99 2 7
Lane undefined City of Bristol B City of Bristol B Squad 1:51.87 4 5
Lane undefined Backwell Backwell Squad 1:55.23 7 2
Lane undefined Chippenham Chippenham Squad 1:54.89 6 3
Lane undefined Southwold Southwold Squad 1:54.76 5 4
Lane undefined Cirencester Cirencester Squad 1:47.46 1 8
Lane undefined Bradford on Avon Bradford on Avon Squad 1:48.68 3 6
Lane undefined Weston SC Weston SC Squad 2:06.11 8 1

Event 9 Women Open 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:07.70 1 8
Lane undefined City of Bristol B City of Bristol B Squad 2:08.82 2 7
Lane undefined Backwell Backwell Squad 2:17.24 6 3
Lane undefined Chippenham Chippenham Squad 2:14.80 4 5
Lane undefined Southwold Southwold Squad 2:17.60 8 1
Lane undefined Cirencester Cirencester Squad 2:14.70 3 6
Lane undefined Bradford on Avon Bradford on Avon Squad 2:15.88 5 4
Lane undefined Weston SC Weston SC Squad 2:17.24 6 3

Event 10 Men Open 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 1:59.19 5 4
Lane undefined City of Bristol B City of Bristol B Squad 1:59.01 4 5
Lane undefined Backwell Backwell Squad 1:57.75 2 7
Lane undefined Chippenham Chippenham Squad 2:00.51 6 3
Lane undefined Southwold Southwold Squad 1:57.11 1 8
Lane undefined Cirencester Cirencester Squad 2:01.43 7 2
Lane undefined Bradford on Avon Bradford on Avon Squad 1:58.15 3 6
Lane undefined Weston SC Weston SC Squad 2:09.85 8 1

Event 11 Girls 10/11 50m Backstroke
Lane undefined Swindon ASC Aria Restuccia 0:41.06 2 7
Lane undefined City of Bristol B Margot Rippon 0:41.72 3 6
Lane undefined Backwell Imogen Bishop 0:43.37 4 5
Lane undefined Chippenham Emily Berry 0:43.42 5 4
Lane undefined Southwold Darby Wallis 0:44.39 6 3
Lane undefined Cirencester Millie Harris 0:37.79 1 8
Lane undefined Bradford on Avon Alicia Mckerracher 0:45.59 8 1
Lane undefined Weston SC Bethany Thomas 0:45.58 7 2

Event 12 Boys 10/11 50m Backstroke
Lane undefined Swindon ASC Connor Lacey 0:38.50 3 6
Lane undefined City of Bristol B Hamish Reid 0:44.52 6 3
Lane undefined Backwell Theo King 1:06.26 8 1
Lane undefined Chippenham Caesar Mena 0:37.37 2 7
Lane undefined Southwold Jamie Kimber 0:47.05 7 2
Lane undefined Cirencester Jacob Snow 0:36.93 1 8
Lane undefined Bradford on Avon Jack Daniell 0:40.74 5 4
Lane undefined Weston SC Billy Marshall 0:38.85 4 5

Event 13 Girls 13/U 100m Breaststroke
Lane undefined Swindon ASC Bethany Middleditch 1:25.16 3 6
Lane undefined City of Bristol B Isla English 1:30.09 4 5
Lane undefined Backwell Amy O'Halloran 1:32.16 6 3
Lane undefined Chippenham Clara Rogers 1:34.25 7 2
Lane undefined Southwold Ria Thompson 1:37.34 8 1
Lane undefined Cirencester Sophia Hewitt 1:24.96 1 8
Lane undefined Bradford on Avon Amira Aliri 1:31.03 5 4
Lane undefined Weston SC Rosie Livesey 1:25.14 2 7

Event 14 Boys 13/U 100m Breaststroke
Lane undefined Swindon ASC Ethan Parker 1:33.70 6 3
Lane undefined City of Bristol B Jake English 1:25.82 1 8
Lane undefined Backwell Oliver King 1:32.21 5 4
Lane undefined Chippenham William Gilbertson 1:46.37 8 1
Lane undefined Southwold Lenard Reece 1:34.94 7 2
Lane undefined Cirencester Luca Sage 1:31.07 3 6
Lane undefined Bradford on Avon Benjamin Hancock 1:31.45 4 5
Lane undefined Weston SC Austin Hodder 1:26.39 2 7

Event 15 Girls 15/U 100m Backstroke
Lane undefined Swindon ASC Charlotte Holborow 1:14.43 4 5
Lane undefined City of Bristol B Beau Mitchell 1:13.83 2 7
Lane undefined Backwell Elizabeth Bishop 1:24.00 8 1
Lane undefined Chippenham Robyn Armstrong 1:14.66 5 4
Lane undefined Southwold Evie-Mai White 1:20.38 7 2
Lane undefined Cirencester Daisy Worboys 1:13.90 3 6
Lane undefined Bradford on Avon Polly Bateman 1:13.00 1 8
Lane undefined Weston SC Ava Mitchard 1:20.07 6 3

Event 16 Boys 15/U 100m Backstroke
Lane undefined Swindon ASC Rhys Evans 1:11.37 5 4
Lane undefined City of Bristol B Ethan Palmer 1:10.17 2 7
Lane undefined Backwell Finley Entwistle 1:12.30 6 3
Lane undefined Chippenham Joel Young 1:10.37 3 6
Lane undefined Southwold Alfred Robinson 1:11.32 4 5
Lane undefined Cirencester Morgan Dodd 1:08.06 1 8
Lane undefined Bradford on Avon Jacob Green 1:12.76 7 2
Lane undefined Weston SC Oliver Waller 1:20.94 8 1

Event 17 Women Open 100m Butterfly
Lane undefined Swindon ASC Amelia Cripps 1:04.22 1 8
Lane undefined City of Bristol B Lydia Bulmer 1:07.51 2 7
Lane undefined Backwell Lily Hunter 1:19.80 7 2
Lane undefined Chippenham Emily Daubney 1:15.90 5 4
Lane undefined Southwold Natasha Williamson 1:17.89 6 3
Lane undefined Cirencester Amelia Stenson 1:13.19 3 6
Lane undefined Bradford on Avon Victoria Williams 1:14.57 4 5
Lane undefined Weston SC Ruby Soper 1:21.22 8 1

Event 18 Men Open 100m Butterfly
Lane undefined Swindon ASC Tyler Checchia 1:01.37 1 8
Lane undefined City of Bristol B Nathan Bull 1:02.48 2 7
Lane undefined Backwell Guus Verkade 1:08.58 8 1
Lane undefined Chippenham Sam John 1:06.80 5 4
Lane undefined Southwold Thomas Johnson 1:04.48 3 6
Lane undefined Cirencester Archie James 1:07.66 7 2
Lane undefined Bradford on Avon Harry Britner 1:06.22 4 5
Lane undefined Weston SC Oliver Tomlinson 1:07.49 6 3

Event 19 Girls 10/11 50m Butterfly
Lane undefined Swindon ASC Aria Restuccia 0:38.21 2 7
Lane undefined City of Bristol B Lola Ortizdelandalucekinnaird 0:41.53 5 4
Lane undefined Backwell Elizabeth King 0:36.72 1 8
Lane undefined Chippenham Winter Green 0:48.69 7 2
Lane undefined Southwold Esme Court 0:50.73 8 1
Lane undefined Cirencester Florence Wright 0:39.36 3 6
Lane undefined Bradford on Avon Frankie Miles 0:46.87 6 3
Lane undefined Weston SC Bethany Thomas 0:41.51 4 5

Event 20 Boys 10/11 50m Butterfly
Lane undefined Swindon ASC Connor Lacey 0:35.58 1 8
Lane undefined City of Bristol B William Bamford 0:49.41 8 1
Lane undefined Backwell Bear Gibbs 0:49.23 7 2
Lane undefined Chippenham Caesar Mena 0:40.89 4 5
Lane undefined Southwold David Li 0:41.73 6 3
Lane undefined Cirencester Henry Wood 0:39.30 2 7
Lane undefined Bradford on Avon Joseph Noad 0:40.97 5 4
Lane undefined Weston SC Billy Marshall 0:40.62 3 6

Event 21 Girls 13/U 100m Backstroke
Lane undefined Swindon ASC Lucy Paines 1:13.77 1 8
Lane undefined City of Bristol B Nelly Stopa 1:18.06 4 5
Lane undefined Backwell Elsie Jones 1:15.44 3 6
Lane undefined Chippenham Clara Rogers 0:00.00 0 0
Lane undefined Southwold Emelia Welsford 1:23.56 7 2
Lane undefined Cirencester Matilda Perkins 1:18.94 6 3
Lane undefined Bradford on Avon Isla Quelch 1:14.97 2 7
Lane undefined Weston SC Rosie Livesey 1:18.12 5 4

Event 22 Boys 13/U 100m Backstroke
Lane undefined Swindon ASC Cole Parker 1:15.25 2 7
Lane undefined City of Bristol B Reuben Barry 1:21.25 5 4
Lane undefined Backwell Ben Simpson 1:13.76 1 8
Lane undefined Chippenham William Gilbertson 1:32.84 8 1
Lane undefined Southwold Elis Hughes 1:15.35 3 6
Lane undefined Cirencester Noah Taylor 1:20.01 4 5
Lane undefined Bradford on Avon Toby Edwards 1:22.64 6 3
Lane undefined Weston SC Freddie Marshall 1:23.39 7 2

Event 23 Girls 15/U 100m Butterfly
Lane undefined Swindon ASC Isla Wall 1:12.53 4 5
Lane undefined City of Bristol B Chloe Clements 1:10.09 2 7
Lane undefined Backwell Ena Stagg 1:26.15 8 1
Lane undefined Chippenham Annabelle Godson 1:07.74 1 8
Lane undefined Southwold Jessica Johnson 1:10.78 3 6
Lane undefined Cirencester Harriet Hughes 1:16.50 5 4
Lane undefined Bradford on Avon Ida Hibbard 1:24.27 6 3
Lane undefined Weston SC Emily Butcher 1:26.06 7 2

Event 24 Boys 15/U 100m Butterfly
Lane undefined Swindon ASC Fletcher Mutton 1:06.92 2 7
Lane undefined City of Bristol B Joseph Tingay 1:07.93 3 6
Lane undefined Backwell Barnaby Wheeler 1:03.83 1 8
Lane undefined Chippenham Joel Young 1:22.51 7 2
Lane undefined Southwold Toby Montagu 1:11.91 5 4
Lane undefined Cirencester Elliot Fountain 1:11.93 6 3
Lane undefined Bradford on Avon Oscar Dommett 1:08.47 4 5
Lane undefined Weston SC Freddie Marshall 1:27.46 8 1

Event 25 Women Open 100m Backstroke
Lane undefined Swindon ASC Aimee Masters 1:09.90 2 7
Lane undefined City of Bristol B Thea Faubel 1:15.43 6 3
Lane undefined Backwell Seren Johnston 1:20.89 8 1
Lane undefined Chippenham Robyn Armstrong 1:17.03 7 2
Lane undefined Southwold Esme Moss 1:13.89 4 5
Lane undefined Cirencester Ruby Hourigan 1:14.56 5 4
Lane undefined Bradford on Avon Flora Kirtley 1:11.43 3 6
Lane undefined Weston SC Madeleine Soper 1:07.23 1 8

Event 26 Men Open 100m Backstroke
Lane undefined Swindon ASC Rhys Evans 1:12.49 7 2
Lane undefined City of Bristol B Benjamin Cox 1:08.51 4 5
Lane undefined Backwell Harry Nias 1:07.42 3 6
Lane undefined Chippenham Thomas Bateman 1:11.99 6 3
Lane undefined Southwold Thomas Johnson 1:06.50 2 7
Lane undefined Cirencester Oliver Hodgson 1:01.54 1 8
Lane undefined Bradford on Avon Harry Britner 1:09.99 5 4
Lane undefined Weston SC Zac Oates 1:14.22 8 1

Event 27 Girls 10/11 50m Breaststroke
Lane undefined Swindon ASC Seren Jones 0:47.40 6 3
Lane undefined City of Bristol B Alicja Morgan 0:46.84 5 4
Lane undefined Backwell Elizabeth King 0:41.23 1 8
Lane undefined Chippenham Clara Herbert 0:46.09 3 6
Lane undefined Southwold Lauren Bradnick 1:02.24 8 1
Lane undefined Cirencester Georgia Hewitt 0:47.47 7 2
Lane undefined Bradford on Avon Sophia Carrivick 0:44.78 2 7
Lane undefined Weston SC Alexie Tembey-Barnard 0:46.37 4 5

Event 28 Boys 10/11 50m Breaststroke
Lane undefined Swindon ASC Daniel Paines 0:45.50 2 7
Lane undefined City of Bristol B Alexander Rolls 0:52.37 6 3
Lane undefined Backwell Theo King 1:14.75 8 1
Lane undefined Chippenham George Kearns 0:58.41 7 2
Lane undefined Southwold David Li 0:51.82 5 4
Lane undefined Cirencester Jamie Wimbush 0:47.29 3 6
Lane undefined Bradford on Avon Noah Romain 0:45.07 1 8
Lane undefined Weston SC Emil Faradzov 0:49.82 4 5

Event 29 Girls 13/U 100m Butterfly
Lane undefined Swindon ASC Bethany Middleditch 1:23.91 7 2
Lane undefined City of Bristol B Amy Leah 1:18.33 2 7
Lane undefined Backwell Matilda Evans 1:19.77 4 5
Lane undefined Chippenham Florence Mcmyn 1:29.94 8 1
Lane undefined Southwold Annie Heeley 1:21.60 5 4
Lane undefined Cirencester Isla Wright 1:18.88 3 6
Lane undefined Bradford on Avon Amira Aliri 1:18.15 1 8
Lane undefined Weston SC Felicity Thomas 1:22.30 6 3

Event 30 Boys 13/U 100m Butterfly
Lane undefined Swindon ASC Elliot Couchman 1:14.53 2 7
Lane undefined City of Bristol B Leo White 1:20.19 3 6
Lane undefined Backwell Nonso Ajayi 1:07.22 1 8
Lane undefined Chippenham Caesar Mena 1:32.58 8 1
Lane undefined Southwold Ridley Murray 1:24.05 6 3
Lane undefined Cirencester Gabriel Hope 1:20.88 4 5
Lane undefined Bradford on Avon Owen Rickard 1:20.93 5 4
Lane undefined Weston SC Freddie Marshall 1:30.68 7 2

Event 31 Girls 15/U 100m Freestyle
Lane undefined Swindon ASC Phoebe Miller 1:05.66 2 7
Lane undefined City of Bristol B Aaliyah Croucher 1:05.13 1 8
Lane undefined Backwell Tahlia Thorne 1:13.57 8 1
Lane undefined Chippenham Phoebe Blacker 1:07.68 3 6
Lane undefined Southwold Isobel Lane 1:08.68 5 4
Lane undefined Cirencester Claudia Hills 1:08.89 6 3
Lane undefined Bradford on Avon Polly Bateman 1:07.95 4 5
Lane undefined Weston SC Emily Butcher 1:13.15 7 2

Event 32 Boys 15/U 100m Freestyle
Lane undefined Swindon ASC Oscar Harvey-Sullivan 0:59.45 2 7
Lane undefined City of Bristol B Vince Ecseri 0:59.40 1 8
Lane undefined Backwell Jackson Zyfi 1:03.72 6 3
Lane undefined Chippenham Judah Boney 1:04.36 7 2
Lane undefined Southwold Douglas Heeley 1:03.70 5 4
Lane undefined Cirencester Oscar Harris 1:00.53 3 6
Lane undefined Bradford on Avon Roan Watkin 1:00.53 3 6
Lane undefined Weston SC Oliver Waller 1:09.41 8 1

Event 33 Women Open 100m Breaststroke
Lane undefined Swindon ASC Aimee Masters 1:27.11 6 3
Lane undefined City of Bristol B Olivia Chard 1:23.74 1 8
Lane undefined Backwell Isabel Mason 1:24.52 3 6
Lane undefined Chippenham Isabella Thomas 1:28.69 7 2
Lane undefined Southwold Rosie Johnson 1:24.51 2 7
Lane undefined Cirencester Eleanor Sheffield 1:26.18 5 4
Lane undefined Bradford on Avon Felicity Hobbs 1:26.04 4 5
Lane undefined Weston SC Siena Blackshaw 1:32.03 8 1

Event 34 Men Open 100m Breaststroke
Lane undefined Swindon ASC Thomas Sprawson 1:16.41 5 4
Lane undefined City of Bristol B Tadas Linkus 1:15.53 4 5
Lane undefined Backwell Phillip Duma 1:13.67 2 7
Lane undefined Chippenham Beau Young 1:11.21 1 8
Lane undefined Southwold Toby Hawkins 1:14.33 3 6
Lane undefined Cirencester Morgan Dodd 1:17.32 6 3
Lane undefined Bradford on Avon Harrison Bown 1:20.51 7 2
Lane undefined Weston SC Zac Oates 1:26.10 8 1

Event 35 Girls 10/11 50m Freestyle
Lane undefined Swindon ASC Imogen Harris 0:36.85 3 6
Lane undefined City of Bristol B Margot Rippon 0:36.25 2 7
Lane undefined Backwell Eleanor Shepherd 0:37.46 4 5
Lane undefined Chippenham Emily Berry 0:37.56 5 4
Lane undefined Southwold Emily Allen 0:45.41 8 1
Lane undefined Cirencester Millie Harris 0:31.60 1 8
Lane undefined Bradford on Avon Alicia Mckerracher 0:38.51 7 2
Lane undefined Weston SC Alexie Tembey-Barnard 0:37.91 6 3

Event 36 Boys 10/11 50m Freestyle
Lane undefined Swindon ASC Daniel Paines 0:33.37 2 7
Lane undefined City of Bristol B William Bamford 0:39.95 8 1
Lane undefined Backwell Bear Gibbs 0:39.17 5 4
Lane undefined Chippenham George Funnell 0:39.94 7 2
Lane undefined Southwold Lincoln Fish 0:38.42 4 5
Lane undefined Cirencester Archie Meeres-Barrow 0:37.76 3 6
Lane undefined Bradford on Avon Archie Biddell 0:32.95 1 8
Lane undefined Weston SC Emil Faradzov 0:39.81 6 3

Event 37 Girls 13/U 100m Freestyle
Lane undefined Swindon ASC Phoebe Miller 1:06.47 3 6
Lane undefined City of Bristol B Elsie Truan-Thatcher 1:06.36 2 7
Lane undefined Backwell Elsie Jones 1:06.08 1 8
Lane undefined Chippenham Florence Mcmyn 1:18.49 8 1
Lane undefined Southwold Ruby Luton 1:11.30 6 3
Lane undefined Cirencester Brooke Taylor 1:07.67 5 4
Lane undefined Bradford on Avon Thea Williams 1:07.61 4 5
Lane undefined Weston SC Felicity Thomas 1:13.67 7 2

Event 38 Boys 13/U 100m Freestyle
Lane undefined Swindon ASC Elliot Couchman 1:08.57 2 7
Lane undefined City of Bristol B Leo White 1:08.90 3 6
Lane undefined Backwell Nonso Ajayi 1:03.14 1 8
Lane undefined Chippenham Hector Kerr 1:22.33 8 1
Lane undefined Southwold Casper Andrews 1:12.12 5 4
Lane undefined Cirencester Luca Sage 1:11.14 4 5
Lane undefined Bradford on Avon Frederick Eveleigh 1:14.70 7 2
Lane undefined Weston SC Austin Hodder 1:13.34 6 3

Event 39 Girls 15/U 100m Breaststroke
Lane undefined Swindon ASC Robyn Whitehead 1:24.55 4 5
Lane undefined City of Bristol B Savannah Williams 1:18.78 1 8
Lane undefined Backwell Annabelle Ellison 1:26.75 6 3
Lane undefined Chippenham Annabelle Godson 1:23.86 2 7
Lane undefined Southwold Jessica Johnson 1:25.11 5 4
Lane undefined Cirencester Emma Cunningham 1:27.49 7 2
Lane undefined Bradford on Avon Isobel Tansley 1:23.98 3 6
Lane undefined Weston SC Lola Tembey Barnard 1:29.77 8 1

Event 40 Boys 15/U 100m Breaststroke
Lane undefined Swindon ASC Rhys Evans 1:18.12 3 6
Lane undefined City of Bristol B Orrin Taylor 1:18.12 3 6
Lane undefined Backwell Jackson Zyfi 1:27.63 6 3
Lane undefined Chippenham Elijah Mena 1:34.32 8 1
Lane undefined Southwold Harry Bennett 1:22.69 5 4
Lane undefined Cirencester Elliot Fountain 1:17.27 2 7
Lane undefined Bradford on Avon Abe Hibbard 1:13.60 1 8
Lane undefined Weston SC Seth Gould 1:31.41 7 2

Event 41 Women Open 100m Freestyle
Lane undefined Swindon ASC Amelia Cripps 0:58.42 1 8
Lane undefined City of Bristol B Maisie Thorn 1:06.19 5 4
Lane undefined Backwell Lily Hunter 1:06.90 7 2
Lane undefined Chippenham Emily Daubney 1:06.34 6 3
Lane undefined Southwold Esme Moss 1:07.39 8 1
Lane undefined Cirencester Sophie Steele 1:05.61 4 5
Lane undefined Bradford on Avon Rebecca Smith 1:03.99 3 6
Lane undefined Weston SC Jessica Knight 1:02.77 2 7

Event 42 Men Open 100m Freestyle
Lane undefined Swindon ASC Evan Kane 0:58.12 2 7
Lane undefined City of Bristol B Tadas Linkus 0:59.80 4 5
Lane undefined Backwell Guus Verkade 1:00.45 5 4
Lane undefined Chippenham Tom Stewart 0:59.43 3 6
Lane undefined Southwold Oliver Montagu 0:57.42 1 8
Lane undefined Cirencester Ernests Katlis 1:02.04 8 1
Lane undefined Bradford on Avon Oscar Dommett 1:00.85 6 3
Lane undefined Weston SC Zac Oates 1:01.51 7 2

Event 43 Girls 9/11 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:50.43 3 6
Lane undefined City of Bristol B City of Bristol B Squad 2:51.66 4 5
Lane undefined Backwell Backwell Squad 2:48.87 2 7
Lane undefined Chippenham Chippenham Squad 3:11.06 6 3
Lane undefined Southwold Southwold Squad 3:30.29 8 1
Lane undefined Cirencester Cirencester Squad 2:45.16 1 8
Lane undefined Bradford on Avon Bradford on Avon Squad 3:03.35 5 4
Lane undefined Weston SC Weston SC Squad 3:14.12 7 2

Event 44 Boys 9/11 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:41.74 1 8
Lane undefined City of Bristol B City of Bristol B Squad 3:04.11 4 5
Lane undefined Backwell Backwell Squad 0:00.00 0 0
Lane undefined Chippenham Chippenham Squad 3:22.05 6 3
Lane undefined Southwold Southwold Squad 3:06.60 5 4
Lane undefined Cirencester Cirencester Squad 2:50.93 3 6
Lane undefined Bradford on Avon Bradford on Avon Squad 2:49.65 2 7
Lane undefined Weston SC Weston SC Squad 0:00.00 0 0

Event 45 Girls 13/U 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:02.18 1 8
Lane undefined City of Bristol B City of Bristol B Squad 2:04.54 2 7
Lane undefined Backwell Backwell Squad 2:13.53 6 3
Lane undefined Chippenham Chippenham Squad 2:23.02 7 2
Lane undefined Southwold Southwold Squad 2:11.65 5 4
Lane undefined Cirencester Cirencester Squad 2:07.19 3 6
Lane undefined Bradford on Avon Bradford on Avon Squad 2:08.09 4 5
Lane undefined Weston SC Weston SC Squad 2:23.15 8 1

Event 46 Boys 13/U 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:03.20 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:08.03 3 6
Lane undefined Backwell Backwell Squad 1:59.65 1 8
Lane undefined Chippenham Chippenham Squad 2:33.28 8 1
Lane undefined Southwold Southwold Squad 2:08.99 5 4
Lane undefined Cirencester Cirencester Squad 2:08.77 4 5
Lane undefined Bradford on Avon Bradford on Avon Squad 2:15.69 6 3
Lane undefined Weston SC Weston SC Squad 2:19.72 7 2

Event 47 Girls 15/U 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:17.44 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:13.92 1 8
Lane undefined Backwell Backwell Squad 2:30.51 7 2
Lane undefined Chippenham Chippenham Squad 2:17.83 3 6
Lane undefined Southwold Southwold Squad 2:25.24 6 3
Lane undefined Cirencester Cirencester Squad 2:21.96 5 4
Lane undefined Bradford on Avon Bradford on Avon Squad 2:18.84 4 5
Lane undefined Weston SC Weston SC Squad 2:39.75 8 1

Event 48 Boys 15/U 4x50m Medley Relay
Lane undefined Swindon ASC Swindon ASC Squad 2:02.59 2 7
Lane undefined City of Bristol B City of Bristol B Squad 2:06.33 3 6
Lane undefined Backwell Backwell Squad 2:15.96 6 3
Lane undefined Chippenham Chippenham Squad 2:16.47 7 2
Lane undefined Southwold Southwold Squad 2:10.11 5 4
Lane undefined Cirencester Cirencester Squad 2:07.05 4 5
Lane undefined Bradford on Avon Bradford on Avon Squad 2:01.55 1 8
Lane undefined Weston SC Weston SC Squad 2:33.82 8 1

Event 49 Women Open 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 1:58.07 1 8
Lane undefined City of Bristol B City of Bristol B Squad 1:58.57 2 7
Lane undefined Backwell Backwell Squad 2:01.71 4 5
Lane undefined Chippenham Chippenham Squad 2:02.84 5 4
Lane undefined Southwold Southwold Squad 2:04.96 8 1
Lane undefined Cirencester Cirencester Squad 2:01.51 3 6
Lane undefined Bradford on Avon Bradford on Avon Squad 2:03.20 7 2
Lane undefined Weston SC Weston SC Squad 2:03.18 6 3

Event 50 Men Open 4x50m Freestyle Relay
Lane undefined Swindon ASC Swindon ASC Squad 1:45.96 4 5
Lane undefined City of Bristol B City of Bristol B Squad 1:45.76 3 6
Lane undefined Backwell Backwell Squad 1:48.45 6 3
Lane undefined Chippenham Chippenham Squad 1:48.05 5 4
Lane undefined Southwold Southwold Squad 1:45.05 1 8
Lane undefined Cirencester Cirencester Squad 1:45.72 2 7
Lane undefined Bradford on Avon Bradford on Avon Squad 1:50.09 7 2
Lane undefined Weston SC Weston SC Squad 1:51.54 8 1

Event 51 Mixed 8x50m Squadron Relay
Lane undefined Swindon ASC Swindon ASC Squad 4:01.85 2 7
Lane undefined City of Bristol B City of Bristol B Squad 4:08.55 5 4
Lane undefined Backwell Backwell Squad 4:07.84 4 5
Lane undefined Chippenham Chippenham Squad 4:17.76 7 2
Lane undefined Southwold Southwold Squad 4:11.02 6 3
Lane undefined Cirencester Cirencester Squad 3:58.16 1 8
Lane undefined Bradford on Avon Bradford on Avon Squad 4:06.49 3 6
Lane undefined Weston SC Weston SC Squad 4:21.62 8 1
`;

    const GALA2_HUTTON_MOOR_DATA = {
    "1": {
        "Swindon ASC": {
            "swimmer": "Aimee Masters",
            "timeMs": 158120,
            "timeStr": "2:38.12",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Lydia Bulmer",
            "timeMs": 155410,
            "timeStr": "2:35.41",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Isabel Mason",
            "timeMs": 163250,
            "timeStr": "2:43.25",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Emily Daubney",
            "timeMs": 165410,
            "timeStr": "2:45.41",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Rosie Johnson",
            "timeMs": 162190,
            "timeStr": "2:42.19",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Amelia Stenson",
            "timeMs": 160620,
            "timeStr": "2:40.62",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Bradford Swimmer",
            "timeMs": 170450,
            "timeStr": "2:50.45",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Weston SC": {
            "swimmer": "Madeleine Soper",
            "timeMs": 149210,
            "timeStr": "2:29.21",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        }
    },
    "2": {
        "Swindon ASC": {
            "swimmer": "Fraiser Hawkins",
            "timeMs": 146880,
            "timeStr": "2:26.88",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "City of Bristol B": {
            "swimmer": "Benjamin Cox",
            "timeMs": 145550,
            "timeStr": "2:25.55",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Barnaby Wheeler",
            "timeMs": 138150,
            "timeStr": "2:18.15",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Beau Young",
            "timeMs": 139250,
            "timeStr": "2:19.25",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Southwold": {
            "swimmer": "Ben Rawlins",
            "timeMs": 144670,
            "timeStr": "2:24.67",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Cirencester": {
            "swimmer": "Archie James",
            "timeMs": 147470,
            "timeStr": "2:27.47",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Harry Britner",
            "timeMs": 151270,
            "timeStr": "2:31.27",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Oliver Tomlinson",
            "timeMs": 154760,
            "timeStr": "2:34.76",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "3": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 149250,
            "timeStr": "2:29.25",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 144830,
            "timeStr": "2:24.83",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 146210,
            "timeStr": "2:26.21",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 156180,
            "timeStr": "2:36.18",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 175600,
            "timeStr": "2:55.60",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 134830,
            "timeStr": "2:14.83",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 158130,
            "timeStr": "2:38.13",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 160350,
            "timeStr": "2:40.35",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "4": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 140630,
            "timeStr": "2:20.63",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 163220,
            "timeStr": "2:43.22",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": null,
            "timeStr": "0:00.00",
            "isDisqualified": true,
            "place": 0,
            "points": 0
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 175810,
            "timeStr": "2:55.81",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 158110,
            "timeStr": "2:38.11",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 137980,
            "timeStr": "2:17.98",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 142360,
            "timeStr": "2:22.36",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": null,
            "timeStr": "0:00.00",
            "isDisqualified": true,
            "place": 0,
            "points": 0
        }
    },
    "5": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 137660,
            "timeStr": "2:17.66",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 139720,
            "timeStr": "2:19.72",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 144870,
            "timeStr": "2:24.87",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 158720,
            "timeStr": "2:38.72",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 149750,
            "timeStr": "2:29.75",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 143170,
            "timeStr": "2:23.17",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 141950,
            "timeStr": "2:21.95",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 155140,
            "timeStr": "2:35.14",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "6": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 141670,
            "timeStr": "2:21.67",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 142810,
            "timeStr": "2:22.81",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 134240,
            "timeStr": "2:14.24",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 172900,
            "timeStr": "2:52.90",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 146040,
            "timeStr": "2:26.04",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 147140,
            "timeStr": "2:27.14",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 149840,
            "timeStr": "2:29.84",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 156280,
            "timeStr": "2:36.28",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "7": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 121590,
            "timeStr": "2:01.59",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 120230,
            "timeStr": "2:00.23",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 128370,
            "timeStr": "2:08.37",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 124460,
            "timeStr": "2:04.46",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 124570,
            "timeStr": "2:04.57",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 124900,
            "timeStr": "2:04.90",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 124070,
            "timeStr": "2:04.07",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 133900,
            "timeStr": "2:13.90",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "8": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 107990,
            "timeStr": "1:47.99",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 111870,
            "timeStr": "1:51.87",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 115230,
            "timeStr": "1:55.23",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 114890,
            "timeStr": "1:54.89",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 114760,
            "timeStr": "1:54.76",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 107460,
            "timeStr": "1:47.46",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 108680,
            "timeStr": "1:48.68",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 126110,
            "timeStr": "2:06.11",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "9": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 127700,
            "timeStr": "2:07.70",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 128820,
            "timeStr": "2:08.82",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 137240,
            "timeStr": "2:17.24",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 134800,
            "timeStr": "2:14.80",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 137600,
            "timeStr": "2:17.60",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 134700,
            "timeStr": "2:14.70",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 135880,
            "timeStr": "2:15.88",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 137240,
            "timeStr": "2:17.24",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "10": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 119190,
            "timeStr": "1:59.19",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 119010,
            "timeStr": "1:59.01",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 117750,
            "timeStr": "1:57.75",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 120510,
            "timeStr": "2:00.51",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 117110,
            "timeStr": "1:57.11",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 121430,
            "timeStr": "2:01.43",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 118150,
            "timeStr": "1:58.15",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 129850,
            "timeStr": "2:09.85",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "11": {
        "Swindon ASC": {
            "swimmer": "Aria Restuccia",
            "timeMs": 41060,
            "timeStr": "0:41.06",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Margot Rippon",
            "timeMs": 41720,
            "timeStr": "0:41.72",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Imogen Bishop",
            "timeMs": 43370,
            "timeStr": "0:43.37",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Chippenham": {
            "swimmer": "Emily Berry",
            "timeMs": 43420,
            "timeStr": "0:43.42",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Darby Wallis",
            "timeMs": 44390,
            "timeStr": "0:44.39",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Millie Harris",
            "timeMs": 37790,
            "timeStr": "0:37.79",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Alicia Mckerracher",
            "timeMs": 45590,
            "timeStr": "0:45.59",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Weston SC": {
            "swimmer": "Bethany Thomas",
            "timeMs": 45580,
            "timeStr": "0:45.58",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "12": {
        "Swindon ASC": {
            "swimmer": "Connor Lacey",
            "timeMs": 38500,
            "timeStr": "0:38.50",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Hamish Reid",
            "timeMs": 44520,
            "timeStr": "0:44.52",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Backwell": {
            "swimmer": "Theo King",
            "timeMs": 66260,
            "timeStr": "1:06.26",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Caesar Mena",
            "timeMs": 37370,
            "timeStr": "0:37.37",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Southwold": {
            "swimmer": "Jamie Kimber",
            "timeMs": 47050,
            "timeStr": "0:47.05",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Cirencester": {
            "swimmer": "Jacob Snow",
            "timeMs": 36930,
            "timeStr": "0:36.93",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Jack Daniell",
            "timeMs": 40740,
            "timeStr": "0:40.74",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Billy Marshall",
            "timeMs": 38850,
            "timeStr": "0:38.85",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        }
    },
    "13": {
        "Swindon ASC": {
            "swimmer": "Bethany Middleditch",
            "timeMs": 85160,
            "timeStr": "1:25.16",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Isla English",
            "timeMs": 90090,
            "timeStr": "1:30.09",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Amy O'Halloran",
            "timeMs": 92160,
            "timeStr": "1:32.16",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Clara Rogers",
            "timeMs": 94250,
            "timeStr": "1:34.25",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Ria Thompson",
            "timeMs": 97340,
            "timeStr": "1:37.34",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Sophia Hewitt",
            "timeMs": 84960,
            "timeStr": "1:24.96",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Amira Aliri",
            "timeMs": 91030,
            "timeStr": "1:31.03",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Rosie Livesey",
            "timeMs": 85140,
            "timeStr": "1:25.14",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        }
    },
    "14": {
        "Swindon ASC": {
            "swimmer": "Ethan Parker",
            "timeMs": 93700,
            "timeStr": "1:33.70",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "City of Bristol B": {
            "swimmer": "Jake English",
            "timeMs": 85820,
            "timeStr": "1:25.82",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Oliver King",
            "timeMs": 92210,
            "timeStr": "1:32.21",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Chippenham": {
            "swimmer": "William Gilbertson",
            "timeMs": 106370,
            "timeStr": "1:46.37",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Lenard Reece",
            "timeMs": 94940,
            "timeStr": "1:34.94",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Cirencester": {
            "swimmer": "Luca Sage",
            "timeMs": 91070,
            "timeStr": "1:31.07",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Benjamin Hancock",
            "timeMs": 91450,
            "timeStr": "1:31.45",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Austin Hodder",
            "timeMs": 86390,
            "timeStr": "1:26.39",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        }
    },
    "15": {
        "Swindon ASC": {
            "swimmer": "Charlotte Holborow",
            "timeMs": 74430,
            "timeStr": "1:14.43",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "City of Bristol B": {
            "swimmer": "Beau Mitchell",
            "timeMs": 73830,
            "timeStr": "1:13.83",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Elizabeth Bishop",
            "timeMs": 84000,
            "timeStr": "1:24.00",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Robyn Armstrong",
            "timeMs": 74660,
            "timeStr": "1:14.66",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Evie-Mai White",
            "timeMs": 80380,
            "timeStr": "1:20.38",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Cirencester": {
            "swimmer": "Daisy Worboys",
            "timeMs": 73900,
            "timeStr": "1:13.90",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Polly Bateman",
            "timeMs": 73000,
            "timeStr": "1:13.00",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Ava Mitchard",
            "timeMs": 80070,
            "timeStr": "1:20.07",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "16": {
        "Swindon ASC": {
            "swimmer": "Rhys Evans",
            "timeMs": 71370,
            "timeStr": "1:11.37",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "City of Bristol B": {
            "swimmer": "Ethan Palmer",
            "timeMs": 70170,
            "timeStr": "1:10.17",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Finley Entwistle",
            "timeMs": 72300,
            "timeStr": "1:12.30",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Joel Young",
            "timeMs": 70370,
            "timeStr": "1:10.37",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Southwold": {
            "swimmer": "Alfred Robinson",
            "timeMs": 71320,
            "timeStr": "1:11.32",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Cirencester": {
            "swimmer": "Morgan Dodd",
            "timeMs": 68060,
            "timeStr": "1:08.06",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Jacob Green",
            "timeMs": 72760,
            "timeStr": "1:12.76",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Oliver Waller",
            "timeMs": 80940,
            "timeStr": "1:20.94",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "17": {
        "Swindon ASC": {
            "swimmer": "Amelia Cripps",
            "timeMs": 64220,
            "timeStr": "1:04.22",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "Lydia Bulmer",
            "timeMs": 67510,
            "timeStr": "1:07.51",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Lily Hunter",
            "timeMs": 79800,
            "timeStr": "1:19.80",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Emily Daubney",
            "timeMs": 75900,
            "timeStr": "1:15.90",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Natasha Williamson",
            "timeMs": 77890,
            "timeStr": "1:17.89",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Amelia Stenson",
            "timeMs": 73190,
            "timeStr": "1:13.19",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Victoria Williams",
            "timeMs": 74570,
            "timeStr": "1:14.57",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Ruby Soper",
            "timeMs": 81220,
            "timeStr": "1:21.22",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "18": {
        "Swindon ASC": {
            "swimmer": "Tyler Checchia",
            "timeMs": 61370,
            "timeStr": "1:01.37",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "Nathan Bull",
            "timeMs": 62480,
            "timeStr": "1:02.48",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Guus Verkade",
            "timeMs": 68580,
            "timeStr": "1:08.58",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Sam John",
            "timeMs": 66800,
            "timeStr": "1:06.80",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Thomas Johnson",
            "timeMs": 64480,
            "timeStr": "1:04.48",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Cirencester": {
            "swimmer": "Archie James",
            "timeMs": 67660,
            "timeStr": "1:07.66",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Bradford on Avon": {
            "swimmer": "Harry Britner",
            "timeMs": 66220,
            "timeStr": "1:06.22",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Oliver Tomlinson",
            "timeMs": 67490,
            "timeStr": "1:07.49",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "19": {
        "Swindon ASC": {
            "swimmer": "Aria Restuccia",
            "timeMs": 38210,
            "timeStr": "0:38.21",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Lola Ortizdelandalucekinnaird",
            "timeMs": 41530,
            "timeStr": "0:41.53",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Elizabeth King",
            "timeMs": 36720,
            "timeStr": "0:36.72",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Winter Green",
            "timeMs": 48690,
            "timeStr": "0:48.69",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Esme Court",
            "timeMs": 50730,
            "timeStr": "0:50.73",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Florence Wright",
            "timeMs": 39360,
            "timeStr": "0:39.36",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Frankie Miles",
            "timeMs": 46870,
            "timeStr": "0:46.87",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Bethany Thomas",
            "timeMs": 41510,
            "timeStr": "0:41.51",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        }
    },
    "20": {
        "Swindon ASC": {
            "swimmer": "Connor Lacey",
            "timeMs": 35580,
            "timeStr": "0:35.58",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "William Bamford",
            "timeMs": 49410,
            "timeStr": "0:49.41",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Backwell": {
            "swimmer": "Bear Gibbs",
            "timeMs": 49230,
            "timeStr": "0:49.23",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Caesar Mena",
            "timeMs": 40890,
            "timeStr": "0:40.89",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Southwold": {
            "swimmer": "David Li",
            "timeMs": 41730,
            "timeStr": "0:41.73",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Henry Wood",
            "timeMs": 39300,
            "timeStr": "0:39.30",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Bradford on Avon": {
            "swimmer": "Joseph Noad",
            "timeMs": 40970,
            "timeStr": "0:40.97",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Billy Marshall",
            "timeMs": 40620,
            "timeStr": "0:40.62",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        }
    },
    "21": {
        "Swindon ASC": {
            "swimmer": "Lucy Paines",
            "timeMs": 73770,
            "timeStr": "1:13.77",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "Nelly Stopa",
            "timeMs": 78060,
            "timeStr": "1:18.06",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Elsie Jones",
            "timeMs": 75440,
            "timeStr": "1:15.44",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Chippenham": {
            "swimmer": "Clara Rogers",
            "timeMs": null,
            "timeStr": "0:00.00",
            "isDisqualified": true,
            "place": 0,
            "points": 0
        },
        "Southwold": {
            "swimmer": "Emelia Welsford",
            "timeMs": 83560,
            "timeStr": "1:23.56",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Cirencester": {
            "swimmer": "Matilda Perkins",
            "timeMs": 78940,
            "timeStr": "1:18.94",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Isla Quelch",
            "timeMs": 74970,
            "timeStr": "1:14.97",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Weston SC": {
            "swimmer": "Rosie Livesey",
            "timeMs": 78120,
            "timeStr": "1:18.12",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        }
    },
    "22": {
        "Swindon ASC": {
            "swimmer": "Cole Parker",
            "timeMs": 75250,
            "timeStr": "1:15.25",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Reuben Barry",
            "timeMs": 81250,
            "timeStr": "1:21.25",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Ben Simpson",
            "timeMs": 73760,
            "timeStr": "1:13.76",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "William Gilbertson",
            "timeMs": 92840,
            "timeStr": "1:32.84",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Elis Hughes",
            "timeMs": 75350,
            "timeStr": "1:15.35",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Cirencester": {
            "swimmer": "Noah Taylor",
            "timeMs": 80010,
            "timeStr": "1:20.01",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Toby Edwards",
            "timeMs": 82640,
            "timeStr": "1:22.64",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Freddie Marshall",
            "timeMs": 83390,
            "timeStr": "1:23.39",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "23": {
        "Swindon ASC": {
            "swimmer": "Isla Wall",
            "timeMs": 72530,
            "timeStr": "1:12.53",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "City of Bristol B": {
            "swimmer": "Chloe Clements",
            "timeMs": 70090,
            "timeStr": "1:10.09",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Ena Stagg",
            "timeMs": 86150,
            "timeStr": "1:26.15",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Annabelle Godson",
            "timeMs": 67740,
            "timeStr": "1:07.74",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Southwold": {
            "swimmer": "Jessica Johnson",
            "timeMs": 70780,
            "timeStr": "1:10.78",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Cirencester": {
            "swimmer": "Harriet Hughes",
            "timeMs": 76500,
            "timeStr": "1:16.50",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Ida Hibbard",
            "timeMs": 84270,
            "timeStr": "1:24.27",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Emily Butcher",
            "timeMs": 86060,
            "timeStr": "1:26.06",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "24": {
        "Swindon ASC": {
            "swimmer": "Fletcher Mutton",
            "timeMs": 66920,
            "timeStr": "1:06.92",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Joseph Tingay",
            "timeMs": 67930,
            "timeStr": "1:07.93",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Barnaby Wheeler",
            "timeMs": 63830,
            "timeStr": "1:03.83",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Joel Young",
            "timeMs": 82510,
            "timeStr": "1:22.51",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Toby Montagu",
            "timeMs": 71910,
            "timeStr": "1:11.91",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Elliot Fountain",
            "timeMs": 71930,
            "timeStr": "1:11.93",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Oscar Dommett",
            "timeMs": 68470,
            "timeStr": "1:08.47",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Freddie Marshall",
            "timeMs": 87460,
            "timeStr": "1:27.46",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "25": {
        "Swindon ASC": {
            "swimmer": "Aimee Masters",
            "timeMs": 69900,
            "timeStr": "1:09.90",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Thea Faubel",
            "timeMs": 75430,
            "timeStr": "1:15.43",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Backwell": {
            "swimmer": "Seren Johnston",
            "timeMs": 80890,
            "timeStr": "1:20.89",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Robyn Armstrong",
            "timeMs": 77030,
            "timeStr": "1:17.03",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Esme Moss",
            "timeMs": 73890,
            "timeStr": "1:13.89",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Cirencester": {
            "swimmer": "Ruby Hourigan",
            "timeMs": 74560,
            "timeStr": "1:14.56",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Flora Kirtley",
            "timeMs": 71430,
            "timeStr": "1:11.43",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Madeleine Soper",
            "timeMs": 67230,
            "timeStr": "1:07.23",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        }
    },
    "26": {
        "Swindon ASC": {
            "swimmer": "Rhys Evans",
            "timeMs": 72490,
            "timeStr": "1:12.49",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "City of Bristol B": {
            "swimmer": "Benjamin Cox",
            "timeMs": 68510,
            "timeStr": "1:08.51",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Harry Nias",
            "timeMs": 67420,
            "timeStr": "1:07.42",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Chippenham": {
            "swimmer": "Thomas Bateman",
            "timeMs": 71990,
            "timeStr": "1:11.99",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Thomas Johnson",
            "timeMs": 66500,
            "timeStr": "1:06.50",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Cirencester": {
            "swimmer": "Oliver Hodgson",
            "timeMs": 61540,
            "timeStr": "1:01.54",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Harry Britner",
            "timeMs": 69990,
            "timeStr": "1:09.99",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Zac Oates",
            "timeMs": 74220,
            "timeStr": "1:14.22",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "27": {
        "Swindon ASC": {
            "swimmer": "Seren Jones",
            "timeMs": 47400,
            "timeStr": "0:47.40",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "City of Bristol B": {
            "swimmer": "Alicja Morgan",
            "timeMs": 46840,
            "timeStr": "0:46.84",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Elizabeth King",
            "timeMs": 41230,
            "timeStr": "0:41.23",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Clara Herbert",
            "timeMs": 46090,
            "timeStr": "0:46.09",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Southwold": {
            "swimmer": "Lauren Bradnick",
            "timeMs": 62240,
            "timeStr": "1:02.24",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Georgia Hewitt",
            "timeMs": 47470,
            "timeStr": "0:47.47",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Bradford on Avon": {
            "swimmer": "Sophia Carrivick",
            "timeMs": 44780,
            "timeStr": "0:44.78",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Weston SC": {
            "swimmer": "Alexie Tembey-Barnard",
            "timeMs": 46370,
            "timeStr": "0:46.37",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        }
    },
    "28": {
        "Swindon ASC": {
            "swimmer": "Daniel Paines",
            "timeMs": 45500,
            "timeStr": "0:45.50",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Alexander Rolls",
            "timeMs": 52370,
            "timeStr": "0:52.37",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Backwell": {
            "swimmer": "Theo King",
            "timeMs": 74750,
            "timeStr": "1:14.75",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "George Kearns",
            "timeMs": 58410,
            "timeStr": "0:58.41",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "David Li",
            "timeMs": 51820,
            "timeStr": "0:51.82",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Jamie Wimbush",
            "timeMs": 47290,
            "timeStr": "0:47.29",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Noah Romain",
            "timeMs": 45070,
            "timeStr": "0:45.07",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Emil Faradzov",
            "timeMs": 49820,
            "timeStr": "0:49.82",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        }
    },
    "29": {
        "Swindon ASC": {
            "swimmer": "Bethany Middleditch",
            "timeMs": 83910,
            "timeStr": "1:23.91",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "City of Bristol B": {
            "swimmer": "Amy Leah",
            "timeMs": 78330,
            "timeStr": "1:18.33",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Matilda Evans",
            "timeMs": 79770,
            "timeStr": "1:19.77",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Chippenham": {
            "swimmer": "Florence Mcmyn",
            "timeMs": 89940,
            "timeStr": "1:29.94",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Annie Heeley",
            "timeMs": 81600,
            "timeStr": "1:21.60",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Isla Wright",
            "timeMs": 78880,
            "timeStr": "1:18.88",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Amira Aliri",
            "timeMs": 78150,
            "timeStr": "1:18.15",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Felicity Thomas",
            "timeMs": 82300,
            "timeStr": "1:22.30",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "30": {
        "Swindon ASC": {
            "swimmer": "Elliot Couchman",
            "timeMs": 74530,
            "timeStr": "1:14.53",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Leo White",
            "timeMs": 80190,
            "timeStr": "1:20.19",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Nonso Ajayi",
            "timeMs": 67220,
            "timeStr": "1:07.22",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Caesar Mena",
            "timeMs": 92580,
            "timeStr": "1:32.58",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Ridley Murray",
            "timeMs": 84050,
            "timeStr": "1:24.05",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Gabriel Hope",
            "timeMs": 80880,
            "timeStr": "1:20.88",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Owen Rickard",
            "timeMs": 80930,
            "timeStr": "1:20.93",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Freddie Marshall",
            "timeMs": 90680,
            "timeStr": "1:30.68",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "31": {
        "Swindon ASC": {
            "swimmer": "Phoebe Miller",
            "timeMs": 65660,
            "timeStr": "1:05.66",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Aaliyah Croucher",
            "timeMs": 65130,
            "timeStr": "1:05.13",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Tahlia Thorne",
            "timeMs": 73570,
            "timeStr": "1:13.57",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Chippenham": {
            "swimmer": "Phoebe Blacker",
            "timeMs": 67680,
            "timeStr": "1:07.68",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Southwold": {
            "swimmer": "Isobel Lane",
            "timeMs": 68680,
            "timeStr": "1:08.68",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Claudia Hills",
            "timeMs": 68890,
            "timeStr": "1:08.89",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Polly Bateman",
            "timeMs": 67950,
            "timeStr": "1:07.95",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Emily Butcher",
            "timeMs": 73150,
            "timeStr": "1:13.15",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "32": {
        "Swindon ASC": {
            "swimmer": "Oscar Harvey-Sullivan",
            "timeMs": 59450,
            "timeStr": "0:59.45",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Vince Ecseri",
            "timeMs": 59400,
            "timeStr": "0:59.40",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Jackson Zyfi",
            "timeMs": 63720,
            "timeStr": "1:03.72",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Judah Boney",
            "timeMs": 64360,
            "timeStr": "1:04.36",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Douglas Heeley",
            "timeMs": 63700,
            "timeStr": "1:03.70",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Oscar Harris",
            "timeMs": 60530,
            "timeStr": "1:00.53",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Roan Watkin",
            "timeMs": 60530,
            "timeStr": "1:00.53",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Oliver Waller",
            "timeMs": 69410,
            "timeStr": "1:09.41",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "33": {
        "Swindon ASC": {
            "swimmer": "Aimee Masters",
            "timeMs": 87110,
            "timeStr": "1:27.11",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "City of Bristol B": {
            "swimmer": "Olivia Chard",
            "timeMs": 83740,
            "timeStr": "1:23.74",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Isabel Mason",
            "timeMs": 84520,
            "timeStr": "1:24.52",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Chippenham": {
            "swimmer": "Isabella Thomas",
            "timeMs": 88690,
            "timeStr": "1:28.69",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Rosie Johnson",
            "timeMs": 84510,
            "timeStr": "1:24.51",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Cirencester": {
            "swimmer": "Eleanor Sheffield",
            "timeMs": 86180,
            "timeStr": "1:26.18",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Felicity Hobbs",
            "timeMs": 86040,
            "timeStr": "1:26.04",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Siena Blackshaw",
            "timeMs": 92030,
            "timeStr": "1:32.03",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "34": {
        "Swindon ASC": {
            "swimmer": "Thomas Sprawson",
            "timeMs": 76410,
            "timeStr": "1:16.41",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "City of Bristol B": {
            "swimmer": "Tadas Linkus",
            "timeMs": 75530,
            "timeStr": "1:15.53",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Phillip Duma",
            "timeMs": 73670,
            "timeStr": "1:13.67",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Chippenham": {
            "swimmer": "Beau Young",
            "timeMs": 71210,
            "timeStr": "1:11.21",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Southwold": {
            "swimmer": "Toby Hawkins",
            "timeMs": 74330,
            "timeStr": "1:14.33",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Cirencester": {
            "swimmer": "Morgan Dodd",
            "timeMs": 77320,
            "timeStr": "1:17.32",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Bradford on Avon": {
            "swimmer": "Harrison Bown",
            "timeMs": 80510,
            "timeStr": "1:20.51",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Zac Oates",
            "timeMs": 86100,
            "timeStr": "1:26.10",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "35": {
        "Swindon ASC": {
            "swimmer": "Imogen Harris",
            "timeMs": 36850,
            "timeStr": "0:36.85",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Margot Rippon",
            "timeMs": 36250,
            "timeStr": "0:36.25",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Eleanor Shepherd",
            "timeMs": 37460,
            "timeStr": "0:37.46",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Chippenham": {
            "swimmer": "Emily Berry",
            "timeMs": 37560,
            "timeStr": "0:37.56",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Emily Allen",
            "timeMs": 45410,
            "timeStr": "0:45.41",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Millie Harris",
            "timeMs": 31600,
            "timeStr": "0:31.60",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Alicia Mckerracher",
            "timeMs": 38510,
            "timeStr": "0:38.51",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Alexie Tembey-Barnard",
            "timeMs": 37910,
            "timeStr": "0:37.91",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "36": {
        "Swindon ASC": {
            "swimmer": "Daniel Paines",
            "timeMs": 33370,
            "timeStr": "0:33.37",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "William Bamford",
            "timeMs": 39950,
            "timeStr": "0:39.95",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Backwell": {
            "swimmer": "Bear Gibbs",
            "timeMs": 39170,
            "timeStr": "0:39.17",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Chippenham": {
            "swimmer": "George Funnell",
            "timeMs": 39940,
            "timeStr": "0:39.94",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Lincoln Fish",
            "timeMs": 38420,
            "timeStr": "0:38.42",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Cirencester": {
            "swimmer": "Archie Meeres-Barrow",
            "timeMs": 37760,
            "timeStr": "0:37.76",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Archie Biddell",
            "timeMs": 32950,
            "timeStr": "0:32.95",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Emil Faradzov",
            "timeMs": 39810,
            "timeStr": "0:39.81",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "37": {
        "Swindon ASC": {
            "swimmer": "Phoebe Miller",
            "timeMs": 66470,
            "timeStr": "1:06.47",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Elsie Truan-Thatcher",
            "timeMs": 66360,
            "timeStr": "1:06.36",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Elsie Jones",
            "timeMs": 66080,
            "timeStr": "1:06.08",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Florence Mcmyn",
            "timeMs": 78490,
            "timeStr": "1:18.49",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Ruby Luton",
            "timeMs": 71300,
            "timeStr": "1:11.30",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Brooke Taylor",
            "timeMs": 67670,
            "timeStr": "1:07.67",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Thea Williams",
            "timeMs": 67610,
            "timeStr": "1:07.61",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Felicity Thomas",
            "timeMs": 73670,
            "timeStr": "1:13.67",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "38": {
        "Swindon ASC": {
            "swimmer": "Elliot Couchman",
            "timeMs": 68570,
            "timeStr": "1:08.57",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Leo White",
            "timeMs": 68900,
            "timeStr": "1:08.90",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Nonso Ajayi",
            "timeMs": 63140,
            "timeStr": "1:03.14",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Hector Kerr",
            "timeMs": 82330,
            "timeStr": "1:22.33",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Casper Andrews",
            "timeMs": 72120,
            "timeStr": "1:12.12",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Luca Sage",
            "timeMs": 71140,
            "timeStr": "1:11.14",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Frederick Eveleigh",
            "timeMs": 74700,
            "timeStr": "1:14.70",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Austin Hodder",
            "timeMs": 73340,
            "timeStr": "1:13.34",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "39": {
        "Swindon ASC": {
            "swimmer": "Robyn Whitehead",
            "timeMs": 84550,
            "timeStr": "1:24.55",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "City of Bristol B": {
            "swimmer": "Savannah Williams",
            "timeMs": 78780,
            "timeStr": "1:18.78",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Annabelle Ellison",
            "timeMs": 86750,
            "timeStr": "1:26.75",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Annabelle Godson",
            "timeMs": 83860,
            "timeStr": "1:23.86",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Southwold": {
            "swimmer": "Jessica Johnson",
            "timeMs": 85110,
            "timeStr": "1:25.11",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Emma Cunningham",
            "timeMs": 87490,
            "timeStr": "1:27.49",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Bradford on Avon": {
            "swimmer": "Isobel Tansley",
            "timeMs": 83980,
            "timeStr": "1:23.98",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Lola Tembey Barnard",
            "timeMs": 89770,
            "timeStr": "1:29.77",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "40": {
        "Swindon ASC": {
            "swimmer": "Rhys Evans",
            "timeMs": 78120,
            "timeStr": "1:18.12",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "Orrin Taylor",
            "timeMs": 78120,
            "timeStr": "1:18.12",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Jackson Zyfi",
            "timeMs": 87630,
            "timeStr": "1:27.63",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Elijah Mena",
            "timeMs": 94320,
            "timeStr": "1:34.32",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Harry Bennett",
            "timeMs": 82690,
            "timeStr": "1:22.69",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Elliot Fountain",
            "timeMs": 77270,
            "timeStr": "1:17.27",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Bradford on Avon": {
            "swimmer": "Abe Hibbard",
            "timeMs": 73600,
            "timeStr": "1:13.60",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Seth Gould",
            "timeMs": 91410,
            "timeStr": "1:31.41",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "41": {
        "Swindon ASC": {
            "swimmer": "Amelia Cripps",
            "timeMs": 58420,
            "timeStr": "0:58.42",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "Maisie Thorn",
            "timeMs": 66190,
            "timeStr": "1:06.19",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Lily Hunter",
            "timeMs": 66900,
            "timeStr": "1:06.90",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Emily Daubney",
            "timeMs": 66340,
            "timeStr": "1:06.34",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Esme Moss",
            "timeMs": 67390,
            "timeStr": "1:07.39",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Sophie Steele",
            "timeMs": 65610,
            "timeStr": "1:05.61",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Rebecca Smith",
            "timeMs": 63990,
            "timeStr": "1:03.99",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Jessica Knight",
            "timeMs": 62770,
            "timeStr": "1:02.77",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        }
    },
    "42": {
        "Swindon ASC": {
            "swimmer": "Evan Kane",
            "timeMs": 58120,
            "timeStr": "0:58.12",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "Tadas Linkus",
            "timeMs": 59800,
            "timeStr": "0:59.80",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Guus Verkade",
            "timeMs": 60450,
            "timeStr": "1:00.45",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Chippenham": {
            "swimmer": "Tom Stewart",
            "timeMs": 59430,
            "timeStr": "0:59.43",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Southwold": {
            "swimmer": "Oliver Montagu",
            "timeMs": 57420,
            "timeStr": "0:57.42",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Cirencester": {
            "swimmer": "Ernests Katlis",
            "timeMs": 62040,
            "timeStr": "1:02.04",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Bradford on Avon": {
            "swimmer": "Oscar Dommett",
            "timeMs": 60850,
            "timeStr": "1:00.85",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Zac Oates",
            "timeMs": 61510,
            "timeStr": "1:01.51",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "43": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 170430,
            "timeStr": "2:50.43",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 171660,
            "timeStr": "2:51.66",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 168870,
            "timeStr": "2:48.87",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 191060,
            "timeStr": "3:11.06",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 210290,
            "timeStr": "3:30.29",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 165160,
            "timeStr": "2:45.16",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 183350,
            "timeStr": "3:03.35",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 194120,
            "timeStr": "3:14.12",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "44": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 161740,
            "timeStr": "2:41.74",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 184110,
            "timeStr": "3:04.11",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": null,
            "timeStr": "0:00.00",
            "isDisqualified": true,
            "place": 0,
            "points": 0
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 202050,
            "timeStr": "3:22.05",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 186600,
            "timeStr": "3:06.60",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 170930,
            "timeStr": "2:50.93",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 169650,
            "timeStr": "2:49.65",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": null,
            "timeStr": "0:00.00",
            "isDisqualified": true,
            "place": 0,
            "points": 0
        }
    },
    "45": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 122180,
            "timeStr": "2:02.18",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 124540,
            "timeStr": "2:04.54",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 133530,
            "timeStr": "2:13.53",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 143020,
            "timeStr": "2:23.02",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 131650,
            "timeStr": "2:11.65",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 127190,
            "timeStr": "2:07.19",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 128090,
            "timeStr": "2:08.09",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 143150,
            "timeStr": "2:23.15",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "46": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 123200,
            "timeStr": "2:03.20",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 128030,
            "timeStr": "2:08.03",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 119650,
            "timeStr": "1:59.65",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 153280,
            "timeStr": "2:33.28",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 128990,
            "timeStr": "2:08.99",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 128770,
            "timeStr": "2:08.77",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 135690,
            "timeStr": "2:15.69",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 139720,
            "timeStr": "2:19.72",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        }
    },
    "47": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 137440,
            "timeStr": "2:17.44",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 133920,
            "timeStr": "2:13.92",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 150510,
            "timeStr": "2:30.51",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 137830,
            "timeStr": "2:17.83",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 145240,
            "timeStr": "2:25.24",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 141960,
            "timeStr": "2:21.96",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 138840,
            "timeStr": "2:18.84",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 159750,
            "timeStr": "2:39.75",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "48": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 122590,
            "timeStr": "2:02.59",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 126330,
            "timeStr": "2:06.33",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 135960,
            "timeStr": "2:15.96",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 136470,
            "timeStr": "2:16.47",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 130110,
            "timeStr": "2:10.11",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 127050,
            "timeStr": "2:07.05",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 121550,
            "timeStr": "2:01.55",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 153820,
            "timeStr": "2:33.82",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "49": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 118070,
            "timeStr": "1:58.07",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 118570,
            "timeStr": "1:58.57",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 121710,
            "timeStr": "2:01.71",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 122840,
            "timeStr": "2:02.84",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 124960,
            "timeStr": "2:04.96",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 121510,
            "timeStr": "2:01.51",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 123200,
            "timeStr": "2:03.20",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 123180,
            "timeStr": "2:03.18",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        }
    },
    "50": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 105960,
            "timeStr": "1:45.96",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 105760,
            "timeStr": "1:45.76",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 108450,
            "timeStr": "1:48.45",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 108050,
            "timeStr": "1:48.05",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 105050,
            "timeStr": "1:45.05",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 105720,
            "timeStr": "1:45.72",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 110090,
            "timeStr": "1:50.09",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 111540,
            "timeStr": "1:51.54",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    },
    "51": {
        "Swindon ASC": {
            "swimmer": "Swindon ASC Squad",
            "timeMs": 241850,
            "timeStr": "4:01.85",
            "isDisqualified": false,
            "place": 2,
            "points": 7
        },
        "City of Bristol B": {
            "swimmer": "City of Bristol B Squad",
            "timeMs": 248550,
            "timeStr": "4:08.55",
            "isDisqualified": false,
            "place": 5,
            "points": 4
        },
        "Backwell": {
            "swimmer": "Backwell Squad",
            "timeMs": 247840,
            "timeStr": "4:07.84",
            "isDisqualified": false,
            "place": 4,
            "points": 5
        },
        "Chippenham": {
            "swimmer": "Chippenham Squad",
            "timeMs": 257760,
            "timeStr": "4:17.76",
            "isDisqualified": false,
            "place": 7,
            "points": 2
        },
        "Southwold": {
            "swimmer": "Southwold Squad",
            "timeMs": 251020,
            "timeStr": "4:11.02",
            "isDisqualified": false,
            "place": 6,
            "points": 3
        },
        "Cirencester": {
            "swimmer": "Cirencester Squad",
            "timeMs": 238160,
            "timeStr": "3:58.16",
            "isDisqualified": false,
            "place": 1,
            "points": 8
        },
        "Bradford on Avon": {
            "swimmer": "Bradford on Avon Squad",
            "timeMs": 246490,
            "timeStr": "4:06.49",
            "isDisqualified": false,
            "place": 3,
            "points": 6
        },
        "Weston SC": {
            "swimmer": "Weston SC Squad",
            "timeMs": 261620,
            "timeStr": "4:21.62",
            "isDisqualified": false,
            "place": 8,
            "points": 1
        }
    }
};

    return {
        SEED_DATA_FULL,
        RAW_MILLFIELD_OCR_TEXT,
        RAW_HUTTON_MOOR_OCR_TEXT,
        GALA2_HUTTON_MOOR_DATA
    };
}));
