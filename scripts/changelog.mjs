// Release notes of CHANGELOG.md, read by the build (What's new) and by the CI release (release notes).

const CHANGE_TYPES = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);

/**
 * Reads the release notes of CHANGELOG.md newest first.
 * @param {string} text Content of CHANGELOG.md.
 */
export function parseChangelog(text) {
  const releases = [];
  let release = null, group = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const fail = (why) => { throw new Error(`CHANGELOG.md:${i + 1}: ${why}`); };
    let m;
    if ((m = /^## \[(\d+\.\d+\.\d+(?:-beta\.\d+)?)\] - (\d{4}-\d{2}-\d{2})$/.exec(line))) {
      release = { version: m[1], date: m[2], groups: [] };
      group = null;
      releases.push(release);
    } else if ((m = /^### (\w+)$/.exec(line))) {
      if (!release) fail('change type outside a release.');
      if (!CHANGE_TYPES.has(m[1])) fail(`unknown change type ${m[1]}.`);
      group = { title: m[1], items: [] };
      release.groups.push(group);
    } else if ((m = /^- (\S.*)$/.exec(line))) {
      if (group) group.items.push(m[1]);
      else if (release) fail('item outside a change type.');
    } else if (release && line.trim()) {
      fail('expected a "## [x.y.z] - YYYY-MM-DD" or "## [x.y.z-beta.n] - YYYY-MM-DD" heading, a "### Type" heading or a "- " item.');
    }
  });
  for (const r of releases) {
    if (!r.groups.length || r.groups.some((g) => !g.items.length)) throw new Error(`CHANGELOG.md: release ${r.version} has an empty section.`);
  }
  return releases;
}
