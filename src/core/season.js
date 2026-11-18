import { MIN } from './util.js';
// -- Seasons, sky and New Year ------------------------------------------------
export var SEASONS = ['halloween', 'winter', 'christmas', 'valentine'];
/**
 * Returns the season of a local date, or null outside every season: Halloween from October 24 to November 2,
 * winter from December 1 to January 6 (June 1 to July 6 in the southern hemisphere), Christmas from December 18 to 26
 * in place of winter, Valentine's Day from February 10 to 14.
 * @param {Date} d Date read on the device.
 * @param {boolean} south Sky seen from the southern hemisphere.
 */
export function seasonOf(d, south) {
  var m = d.getMonth(), day = d.getDate(), winter = south ? 5 : 11;
  if ((m === 9 && day >= 24) || (m === 10 && day <= 2)) return 'halloween';
  if (m === 11 && day >= 18 && day <= 26) return 'christmas';
  if (m === winter || (m === (winter + 1) % 12 && day <= 6)) return 'winter';
  if (m === 1 && day >= 10 && day <= 14) return 'valentine';
  return null;
}
// Sky keyframes as [local hour, early sky, late sky]: a sky holds between two equal keyframes and blends between different ones.
var SKY_HOURS = {
  dark: [[0, 0, 0], [4, 0, 0], [5.5, 1, 0], [7.5, 0, 0], [17, 0, 0], [19.5, 0, 1], [22.5, 0, 0], [24, 0, 0]],
  light: [[0, 0, 0], [8, 0, 0], [12, 1, 0], [16, 1, 0], [19, 0, 1], [21.5, 0, 0], [24, 0, 0]]
};
/**
 * Returns the sky of a theme at a local hour, as the two shares the stylesheet mixes into the base sky: first light and dusk
 * in the dark theme, full daylight and golden hour in the light theme. Outside their hours both are zero and the base sky shows.
 * @param {string} theme dark or light.
 * @param {number} hour Local hour from 0 to 24, minutes as its fraction.
 * @returns {{early: number, late: number}} Percent of the late sky, and percent of the early sky in what the late sky leaves.
 */
export function skyAt(theme, hour) {
  var keys = SKY_HOURS[theme], i = 1;
  while (keys[i][0] < hour) i++;
  var a = keys[i - 1], b = keys[i], t = (hour - a[0]) / (b[0] - a[0]);
  t = t * t * (3 - 2 * t);
  var early = a[1] + (b[1] - a[1]) * t, late = a[2] + (b[2] - a[2]) * t;
  // Under a whole late sky nothing is left to share: the early share is then free, and zero.
  return { early: late < 1 ? early / (1 - late) * 100 : 0, late: late * 100 };
}
/**
 * Returns where a local time stands around New Year's midnight: the countdown in the last minute of December 31,
 * the fireworks in the first minute of January 1, or nothing.
 * @param {number} ts Time read on the device.
 * @returns {{phase: ?string, seconds: (number|undefined), next: number}} Phase, seconds left in the countdown,
 *   and the delay until what is shown changes.
 */
export function newYearAt(ts) {
  var year = new Date(ts).getFullYear(), midnight = new Date(year + 1, 0, 1).getTime(), started = new Date(year, 0, 1).getTime();
  var left = midnight - ts;
  if (left <= MIN) {
    var seconds = Math.ceil(left / 1000);
    return { phase: 'countdown', seconds: seconds, next: left - (seconds - 1) * 1000 };
  }
  if (ts - started < MIN) return { phase: 'fireworks', next: started + MIN - ts };
  return { phase: null, next: left - MIN };
}
