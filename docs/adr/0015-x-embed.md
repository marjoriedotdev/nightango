---
status: accepted
date: 2026-10
---

# X posts as a card, read by the loader from the oEmbed and the syndication

## Context

Members post links to X posts (`x.com/{user}/status/{id}`, `twitter.com/...`), often through a mirror that fixes the preview in other apps (`fxtwitter.com`, `vxtwitter.com`, `fixupx.com`, `fixvx.com`), with the same path. BetterChatango shows them as plain links.

X documents a single way to embed a post (Embedded Posts, checked on 2026-10-31): a `<blockquote>` that its script `widgets.js` turns into an iframe, the blockquote being given by the oEmbed `https://publish.x.com/oembed`, without authentication or rate limit. `widgets.js` would run unpinned third-party code in the page that holds the BetterChatango session, and does not see the Shadow DOM. The oEmbed sends no `Access-Control-Allow-Origin`: the page cannot read it. Its reply gives `author_name`, `author_url` and `html` (text, author, date), never a media.

The only anonymous source of the media is the syndication `https://cdn.syndication.twimg.com/tweet-result?id={id}&token={token}` that `platform.twitter.com` reads itself. X does not document it. Its use is known from the code of `vercel/react-tweet` (`fetch-tweet.ts`), which derives the token from the post id. Its CORS admits `https://platform.twitter.com` only. Its reply gives `created_at`, `user.profile_image_url_https` (the author picture on `pbs.twimg.com/profile_images`, in the 48 pixel `_normal` size), `possibly_sensitive` and `mediaDetails`: the photo or video poster on `pbs.twimg.com`, the size, and the mp4 variants of a video on `video.twimg.com`.

## Decision

Owner decisions of 2026-10-31 (0.31.0), the mirrors and the layout close to an X post added before the release:

- the setting "Embed X posts" (`safety.embedX`, on by default) shows an X post link as a card laid out like an X post, in the Nightango theme: author picture, name and handle, the X logo, the text, the first media of the post, then the time and date. The logo and the time open the post through the link warning. Off, the link stays a link
- neither engagement counts nor verified badge: a snapshot of counts goes stale, and the card stays a preview of the post
- the post is read under the rules of the YouTube thumbnail: when the link shows only if "Block external media until I click" (`proxyMedia`) is off or the host of the link is trusted. Otherwise a "Show post" button followed by the host, and nothing goes to X before the click
- the sandbox accepts only a post link on `x.com` or `twitter.com` (with `www.` or `mobile.`), the hosts of X's documentation, or on one of the four mirrors, and rebuilds it as `https://x.com/{user}/status/{id}`. A mirror is never called. Any script of the page can send it a request ([ADR-0003](0003-two-context-loader.md))
- for one request, the sandbox makes two calls through `GM_xmlhttpRequest`, `anonymous: true`: the oEmbed (`@connect publish.x.com`, `omit_script=true&dnt=true&hide_thread=true`) and the syndication (`@connect cdn.syndication.twimg.com`). The oEmbed `html` is parsed in an inert `DOMParser` document. The sandbox replies with the text fields of the card and, from the syndication: the time of the post, the author picture in the 73 pixel `_bigger` size, and the https address of the first photo or poster on `pbs.twimg.com`, its size, the sensitive flag and, for a video, one mp4 on `video.twimg.com` up to 720p. Never the HTML or the rest of the reply
- the text decides: without the oEmbed, the card turns back into a link that goes through the link warning, with a toast on click. Without the syndication, the card shows the author initials, the date of the oEmbed and no media
- the author picture, the photo and the poster show in `<img referrerPolicy="no-referrer">` once the card shows (`T.Avatar` takes `referrerPolicy` for this). A media X flags as sensitive waits for a click. The video plays in `<video controls>` only after a click, like a video file
- one reading per post and per page, a failure being read again at a click, as for TikTok
- the X logo is a filled brand mark of the design system (`x-logo`), taken from Simple Icons (CC0), only for a link to an X post
- the calls and the media join the closed lists of `docs/betterchatango-protocol.md#allowed-http-calls` ([ADR-0001](0001-password-never-read.md))
- the prototype has no loader: its sample post shows a sample photo, any other post turns back into a link on click.

## Consequences

- With media not blocked, X gets the user's IP address twice for each post shown, once per page, then once more for the media. Otherwise only on click.
- The picture, the time and the media depend on an undocumented endpoint and on a token computed like X's own script: they can disappear without notice, and cards stay text.
- The userscript declares two more domains, which Tampermonkey lists among its permissions.
- `<video>` takes no `referrerPolicy`: `video.twimg.com` receives the referrer according to the page policy, as for video files.
