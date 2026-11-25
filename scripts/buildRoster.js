const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'westonRosterTimes.json');
const jsPath = path.join(__dirname, '..', 'src', 'data', 'westonRosterTimes.js');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const content = `/**
 * westonRosterTimes.js
 * Official Weston SC Squad Baseline Times from Arena_V6_10th_Oct_Swimmer.csv
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const g = root || globalThis || window || self || {};
        g.WESTON_ROSTER_TIMES = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this)), function () {
    'use strict';
    return ${JSON.stringify(data, null, 2)};
}));
`;

fs.writeFileSync(jsPath, content, 'utf8');
console.log('Successfully generated westonRosterTimes.js with', data.length, 'entries');
