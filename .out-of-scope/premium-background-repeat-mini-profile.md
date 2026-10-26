# Repeated Premium background in the mini profile

In the mini profile (About card), the Premium background image shows as a 120 px banner (`object-fit: cover`) above the text, which stays on the plain background color. Its repeat (`background-repeat` in `custom_profile.css`) is not reproduced, and the image is not placed behind the text. Meet cards show only the color.

## Why this is out of scope

The member's CSS is never injected ([ADR-0004](../docs/adr/0004-member-html-never-injected.md)), and the image must be loaded without a referrer. In the application's Shadow DOM, a CSS background (`background-image`) follows the referrer policy of the st.chatango.com page, which Nightango does not control: setting a `<meta name="referrer">` on the page would change the referrer of every BetterChatango and Chatango request.

The techniques that would respect the constraint cost more than they bring for a card of a few lines:

- a grid of tiled `<img referrerPolicy="no-referrer">`, sized from `naturalWidth` / `naturalHeight`, behind a veil of the background color to keep the contrast
- a `<canvas>` with `createPattern`, to resize and adapt to the DPR.

The full background, repeat included, is reproduced where it belongs: the full profile, in the isolated iframe that carries its own `no-referrer` policy (#7).

## What would reopen the question

A native way to apply `no-referrer` to a CSS background in a shadow root, without touching the page.

## Prior requests

- #8: "feat(profile): repeat the Premium background without a referrer"
