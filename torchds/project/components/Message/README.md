# Message

One message in a chat log, with author, time, optional reply context and hover actions.

Provide `author`, `time` and the text as children; `@name` tokens render as mention chips. Consecutive messages from the same author within five minutes use `continued`, which hides the avatar and shows the time on hover. Set `mention` when the message names the viewer. `role` adds a Mod or Owner badge. Pass `reply` as `{author, text}` for a quoted parent. Pass `onReply`, `onReact`, `onMore` to show the hover toolbar.

- Members' Chatango fonts and colors are not applied here; see Appearance in the brand book.
