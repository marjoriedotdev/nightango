# Matt Pocock skills (vendored copy)

Agent skills from `https://github.com/mattpocock/skills`, commit `59db609eb1e18aaf59b63284d0e52255aff0c63c` (2026-10-27), plugin `mattpocock-skills` version 1.3.1. MIT licence, copyright Matt Pocock (see `LICENSE`).

## Why a copy

A cloud session does not install the plugins a repository declares in `.claude/settings.json`, but it loads the skills committed under `.claude/skills/` (Claude Code docs, Configure cloud environments, What carries over from your setup). The copy also pins the version: an upstream change reaches this repo only through a reviewed commit.

## Contents

The 27 skills listed in the upstream `.claude-plugin/plugin.json`, flattened to `.claude/skills/<name>/` (upstream keeps them under `skills/engineering/` and `skills/productivity/`). The `in-progress/` and `misc/` skills are not copied.

The per-repo setup that `setup-matt-pocock-skills` writes is already in place: the Agent skills section of `AGENTS.md` and `docs/agents/`.

## Local changes

The upstream `code-review` skill is renamed `two-axis-review`, so it does not shadow the `code-review` skill built into Claude Code:

- `two-axis-review/SKILL.md`: `name` in the frontmatter
- `implement/SKILL.md`, `implement-spec/SKILL.md`, `ask-matt/SKILL.md`, `tdd/SKILL.md`: references to `code-review`

Every other file is identical to upstream.

## Updating

1. Clone the upstream repository at the new commit.
2. Replace the skill folders listed in its `plugin.json`, remove the ones it no longer lists, replace `LICENSE`.
3. Reapply the local changes above.
4. Update the commit, date and version in this file.
