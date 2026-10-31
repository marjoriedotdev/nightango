---
status: accepted
date: 2026-10
---

# Member HTML is never injected

## Context

Chatango profiles contain HTML and CSS written by their members (`mod1.xml`, `mod2.xml`, `custom_profile.css`). The application runs in the BetterChatango page, next to the Chatango session: injected HTML could run scripts, read the page or exfiltrate data. Injected CSS could distort the interface or load resources that expose the user.

## Decision

- Mini profile: `RichText` (`src/core/rich-text.js`) rebuilds an allowlist of tags as React elements.
- Full profile: `fullProfileDoc` renders it in a `sandbox` `iframe` with no permission at all (no `allow-scripts`, `allow-same-origin` or `allow-popups`), with a CSP policy in a `<meta>`.
- Full profile links, owner decision of 2026-10-31: before the member HTML goes into the frame, `unlinkFullProfile` parses it with `DOMParser`, like the mini profile, which runs and loads nothing. Every link loses its address: `a` (HTML and SVG), `area`, and an `href` on a MathML element, which Firefox follows. Its content stays in the page as plain text. Two shapes give a link its address only in the frame, so they are removed whole: a `template`, whose content the frame's parser attaches as a declarative shadow root while the walk of the parsed tree never visits it, and an SVG `animate` or `set` whose `attributeName` is `href` or ends in `:href`, which sets the address once the frame shows it. Neither is listed. Below the frame, "Links in this profile" lists each distinct `http` or `https` address once, as Nightango links (`memberLink`) that go through the link warning, the trusted hosts and the `{name}.chatango.com` profile link handling, like links in messages. Other schemes are dropped.
- Premium background: `custom_profile.css` is parsed by `parseMiniCss`, which keeps only hex colors and an `https` image from it. The CSS itself is never injected.
- Message background: `msgbg.xml` is read by `parseMsgBg`, which keeps only a hex color, bounded opacities and an alignment from a closed list. `parseMsgBg` also keeps the `tile` flag. The `msgbg.jpg` image is a CSS background of the row, tiled or not, whose URL comes from the member's name, never from the file.

## Consequences

- The full profile reuses the colors and the background image of `custom_profile.css`, in the `<style>` of the iframe document: colors as checked hex, repeat from a closed list, `https` URL rejected if it contains `<`, `>`, a quote, a backslash, a parenthesis or a space. The document carries `<meta name="referrer" content="no-referrer">`, because a `srcdoc` otherwise inherits the parent's policy and the iframe's `referrerPolicy` attribute does not cover its subresources.
- In the mini profile, the Premium background image is an `<img>` with `referrerPolicy="no-referrer"`, as a cover behind the header of the profile dialog, whose background and colors are the member's (hex colors, guaranteed contrast). `background-repeat` is not reproduced there, because a CSS background in the page would send the referrer. It is reproduced only in the full profile iframe.
- The message background is the only member image loaded as a CSS background in the page, because an `<img>` cannot tile. Its URL is always `ust.chatango.com/…/msgbg.jpg`, built by BetterChatango from the member's name: the referrer then goes to Chatango, which already serves the page, and to no third-party host.
- No link opens from the full profile frame. The interface cannot see a click inside a frame without scripts, so a link there would skip the link warning and the trusted hosts.
- The frame receives the serialization of the parsed member HTML, parsed again until a parse finds nothing to remove: a serialized tree can parse into new elements (mutation XSS). The serialization keeps the member's `<body>` element, so the frame still applies its attributes. The member HTML is still never injected into the page.
- A new tag or property is added to the allowlist, never through a switch to raw HTML.
