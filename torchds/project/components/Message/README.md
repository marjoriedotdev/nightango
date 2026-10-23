# Message

The row shell of a chat log, shared by groups and private messages: full, continued or compact, with slots for the parts the app owns.

Provide `time` and the body as children. A text child renders as `tc-msg-text`, with `@name` tokens as mention chips. An element child renders as is, for rich text and embeds.

- Full row: `avatar`, then a header with `author`, `meta` (role badge, channel label) and the time. Pass `reply` as `{author, avatar, text}` to quote the parent above it, with a 16px avatar. Add `onJump` when the parent is in the log: the quoted text becomes a button that goes to it.
- `continued`: a message from the same author within five minutes. No avatar or header, the time shows in the gutter on hover.
- `compact`: the Compact density. Time first, then the author, `meta` and the body on one line, no avatar. On a narrow screen, what does not fit wraps to a second line. It wins over `continued`.
- `author` as text renders as `tc-msg-author`. Pass an element for a styled or clickable name.
- `actions` fills the hover toolbar with icon buttons at size 28. Leave it out when nothing can be done, such as a deleted message.
- `mention` tints a message that names the viewer. `className` and `style` go on the row, for states and member backgrounds.
- `msgId` lands on the row as `data-msg-id`, so the app can find the message in the log. `highlight` gives the row the `selected` background, above a member background, for the message the reader just jumped to. The background fades in and out in 150ms.

- Members' Chatango fonts and colors are not applied here; see Appearance in the brand book.
