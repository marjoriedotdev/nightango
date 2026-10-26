---
status: accepted
date: 2026-10
---

# Member HTML is never injected

## Context

Chatango profiles contain HTML and CSS written by their members (`mod1.xml`, `mod2.xml`, `custom_profile.css`). The application runs in the BetterChatango page, next to the Chatango session: injected HTML could run scripts, read the page or exfiltrate data. Injected CSS could distort the interface or load resources that expose the user.

## Decision

- Mini profile: `RichText` (`src/core/rich-text.js`) rebuilds an allowlist of tags as React elements.
- Full profile: `fullProfileDoc` renders it in a `sandbox` `iframe` without `allow-scripts` or `allow-same-origin`, with a CSP policy in a `<meta>`.
- Premium background: `custom_profile.css` is parsed by `parseMiniCss`, which keeps only hex colors and an `https` image from it. The CSS itself is never injected.
- Message background: `msgbg.xml` is read by `parseMsgBg`, which keeps only a hex color, bounded opacities and an alignment from a closed list. The `msgbg.jpg` image is a `no-referrer` `<img>` whose URL comes from the member's name, never from the file.

## Consequences

- The full profile reuses the colors and the background image of `custom_profile.css`, in the `<style>` of the iframe document: colors as checked hex, repeat from a closed list, `https` URL rejected if it contains `<`, `>`, a quote, a backslash, a parenthesis or a space. The document carries `<meta name="referrer" content="no-referrer">`, because a `srcdoc` otherwise inherits the parent's policy and the iframe's `referrerPolicy` attribute does not cover its subresources.
- In the mini profile, the Premium background image is an `<img>` with `referrerPolicy="no-referrer"`, as a cover behind the header of the profile dialog, whose background and colors are the member's (hex colors, guaranteed contrast). `background-repeat` is not reproduced there, because a CSS background in the page would send the referrer. It is reproduced only in the full profile iframe.
- A new tag or property is added to the allowlist, never through a switch to raw HTML.
