// GitLab release of the tested userscripts, run by the release job of .gitlab-ci.yml with the CI job token only.
// One release per @version: a push without a version bump publishes nothing. The beta branch publishes betas only.

import { readFileSync } from 'node:fs';
import { parseChangelog } from './changelog.mjs';

const FILES = ['nightango.min.user.js', 'nightango.user.js', 'SHA256SUMS'];
const env = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run this script from the GitLab release job.`);
  return value;
};
const API = `${env('CI_API_V4_URL')}/projects/${env('CI_PROJECT_ID')}`;
const AUTH = { 'JOB-TOKEN': env('CI_JOB_TOKEN') };

/**
 * Calls the GitLab API of this project with the job token.
 * @param {string} path Path after the project, starting with a slash.
 * @param {object} init Options of fetch, headers merged with the token.
 */
async function api(path, init = {}) {
  return fetch(API + path, { ...init, headers: { ...AUTH, ...init.headers } });
}

/**
 * Writes the release notes of a version from its CHANGELOG.md section.
 * @param {string} version Version without its v.
 */
function notesOf(version) {
  const release = parseChangelog(readFileSync('CHANGELOG.md', 'utf8')).find((r) => r.version === version);
  if (!release) throw new Error(`CHANGELOG.md has no section for ${version}.`);
  return release.groups.map((g) => `### ${g.title}\n\n${g.items.map((i) => `- ${i}`).join('\n')}`).join('\n\n');
}

const version = (/^\/\/ @version\s+(\S+)/m.exec(readFileSync('src/loader/skin-loader.js', 'utf8')) || [])[1];
if (!/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(version || '')) throw new Error(`Invalid @version '${version}' in src/loader/skin-loader.js.`);
const branch = env('CI_COMMIT_BRANCH'), beta = version.includes('-beta.');
if (branch === 'beta' && !beta) {
  console.log(`@version ${version} is not a beta, nothing to publish from beta.`);
  process.exit(0);
}
if (branch === 'main' && beta) throw new Error('main publishes stable releases only: set @version to X.Y.Z in src/loader/skin-loader.js.');

const tag = `v${version}`;
const existing = await api(`/releases/${encodeURIComponent(tag)}`);
if (existing.ok) {
  console.log(`Release ${tag} already exists, nothing to publish.`);
  process.exit(0);
}
if (existing.status !== 404) throw new Error(`Reading release ${tag} failed: HTTP ${existing.status}.`);

// The files go to the generic package registry, where the release links to them: a public project serves them without sign-in.
const links = [];
for (const file of FILES) {
  const url = `${API}/packages/generic/nightango/${version}/${file}`;
  const put = await fetch(url, { method: 'PUT', headers: AUTH, body: readFileSync(`dist/${file}`) });
  if (!put.ok) throw new Error(`Uploading ${file} failed: HTTP ${put.status}.`);
  links.push({ name: file, url, direct_asset_path: `/${file}`, link_type: 'package' });
}

const created = await api('/releases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: tag, tag_name: tag, ref: env('CI_COMMIT_SHA'), description: notesOf(version), assets: { links } })
});
if (!created.ok) throw new Error(`Creating release ${tag} failed: HTTP ${created.status} ${await created.text()}`);
console.log(`Published ${tag}.`);
