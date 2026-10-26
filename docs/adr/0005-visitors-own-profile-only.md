---
status: accepted
date: 2026-10
---

# Visitors: own profile only

## Context

The vissle tracker (`track1/activity`) has no authentication: it answers for any profile. BetterChatango already offers the feature natively for the signed-in account: the user installs the tracker through "Add profile tracker", and BetterChatango's "track" panel shows it. Looking up the activity of another member's profile would be surveillance of third parties.

## Decision

The Visitors section shows only the activity of the signed-in user's profile, like BetterChatango. The loader bridge ignores any `profile` sent by the page and reads `client.user.name` from the BetterChatango session. No lookup of another profile's activity is added.

## Consequences

- Even compromised page code cannot query another profile through the bridge.
- The section stays empty until the user has installed the tracker.
