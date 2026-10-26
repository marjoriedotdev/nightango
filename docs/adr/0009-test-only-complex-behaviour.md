---
status: accepted
date: 2026-10
---

# Tests: complex behaviour only

## Context

The previous rule required a test case for every fix. The user chose to limit tests to complex behaviour. A test that freezes a UI detail costs maintenance without protecting any real behaviour.

## Decision

A test is written only for complex behaviour: exact format of a frame, pagination, presence, history merge, loader startup, sanitizing of member content. Every new test is seen failing before the code it protects. No test per fix by default.

## Consequences

- Replaces the "one test case for every fix" rule of the former handover document.
- A simple fix is checked by the existing suites and by the user in Tampermonkey.
