// New Year: the last-minute countdown and the fireworks minute around local midnight, on src/core/util.js.
const fs = require('fs'), vm = require('vm');
const util = {};
vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/core/util.js', 'utf8'), util);
const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || !detail ? '' : ' ' + JSON.stringify(detail)));
const at = (y, mo, d, h, mi, s, ms) => util.newYearAt(new Date(y, mo - 1, d, h, mi, s, ms).getTime());
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Countdown: the 60 seconds before local midnight on December 31, each second shown until it is over */
check(same(at(2026, 12, 31, 23, 58, 59, 999), { phase: null, next: 1 }), 'nothing a millisecond before the last minute, the countdown due next', at(2026, 12, 31, 23, 58, 59, 999));
check(same(at(2026, 12, 31, 23, 59, 0, 0), { phase: 'countdown', seconds: 60, next: 1000 }), 'countdown from 60 at 23:59:00', at(2026, 12, 31, 23, 59, 0, 0));
check(same(at(2026, 12, 31, 23, 59, 30, 250), { phase: 'countdown', seconds: 30, next: 750 }), 'countdown at 30 halfway, next second 750 ms later', at(2026, 12, 31, 23, 59, 30, 250));
check(same(at(2026, 12, 31, 23, 59, 59, 999), { phase: 'countdown', seconds: 1, next: 1 }), 'countdown at 1 a millisecond before midnight', at(2026, 12, 31, 23, 59, 59, 999));

/* Fireworks: the first minute of January 1, also for a page opened during it */
check(same(at(2027, 1, 1, 0, 0, 0, 0), { phase: 'fireworks', next: 60000 }), 'fireworks at midnight for a minute', at(2027, 1, 1, 0, 0, 0, 0));
check(same(at(2027, 1, 1, 0, 0, 42, 0), { phase: 'fireworks', next: 18000 }), 'fireworks for a page opened 42 seconds after midnight, until 00:01', at(2027, 1, 1, 0, 0, 42, 0));
check(same(at(2027, 1, 1, 0, 0, 59, 999), { phase: 'fireworks', next: 1 }), 'fireworks a millisecond before 00:01', at(2027, 1, 1, 0, 0, 59, 999));

/* Rest of the year: nothing, the next countdown due on December 31 at 23:59 */
const next = (y, mo, d, h, mi) => new Date(y, 11, 31, 23, 59).getTime() - new Date(y, mo - 1, d, h, mi).getTime();
check(same(at(2027, 1, 1, 0, 1, 0, 0), { phase: null, next: next(2027, 1, 1, 0, 1) }), 'nothing from 00:01, the next countdown due at the end of the year', at(2027, 1, 1, 0, 1, 0, 0));
check(same(at(2027, 6, 15, 12, 0, 0, 0), { phase: null, next: next(2027, 6, 15, 12, 0) }), 'nothing in June', at(2027, 6, 15, 12, 0, 0, 0));
check(at(2026, 1, 1, 23, 59, 30, 0).phase === null && at(2026, 12, 30, 23, 59, 30, 0).phase === null && at(2026, 12, 31, 0, 0, 30, 0).phase === null, 'no countdown on another day at 23:59 nor fireworks at 00:00 on December 31');
