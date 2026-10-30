---
status: accepted
date: 2026-10
---

# Meme templates from Imgflip, asked when the Memes tab opens

## Context

The owner wants a gallery of blank meme templates in the composer, to post as they are. The vissle "Uploaded" gallery (`/api/v1/uploads/{name}`) cannot serve it: it lists the images a member uploaded to Chatango (`ust.chatango.com/um/…/img/l_{id}.jpg`), and Nightango cannot upload there, since `uploadimg` carries the password in BetterChatango, chadango and chatango-lib ([ADR-0001](0001-password-never-read.md)).

Imgflip publishes its popular blank templates at `https://api.imgflip.com/get_memes`, without key or account. Each template has a name and an image on `i.imgflip.com`. Captioning (`caption_image`) needs the username and password of an Imgflip account.

GIF providers were set aside on 2026-10-30: Tenor closed its API on 2026-06-30, Giphy and Klipy need an API key that a userscript publishes to anyone who reads it.

## Decision

Owner decision of 2026-10-30: the composer Media picker has a Memes tab that lists Imgflip's popular blank templates. A click inserts the image link in the field, like a media item. The prototype shows sample templates and makes no call.

Guards:

- the call joins the closed list (`docs/betterchatango-protocol.md#allowed-http-calls`): `GET https://api.imgflip.com/get_memes` through `fetch` from the page, with `referrerPolicy: 'no-referrer'`, without cookie or credential, and without a new `@connect`
- it goes out only when the Memes tab is shown, once per page while it succeeds. A failure lets the next opening ask again
- only `name` and `url` are read. A template is kept only if its name is a non-empty string and its URL is `https://i.imgflip.com/{letters and digits}.{jpg|png|gif}`. Nothing is stored
- thumbnails follow the media library thumbnail rules (`embedImages`, `proxyMedia`, trusted hosts), as `<img>` `referrerPolicy="no-referrer"`
- no caption, no Imgflip account.

## Consequences

- Imgflip gets the user's IP address on the first opening of the Memes tab, and `i.imgflip.com` gets it for each thumbnail shown.
- Members who receive the link load the image from `i.imgflip.com` under their own media settings.
- The list is Imgflip's: its size and order can change without notice.
- Not checked on a real account: that the reply lets the `st.chatango.com` page read it (CORS). Without it, the tab shows its error and the call has to move to the loader's `GM_xmlhttpRequest` with `@connect api.imgflip.com`, which revises this decision.
