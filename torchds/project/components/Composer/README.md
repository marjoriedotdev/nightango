# Composer

The message input with reply context, optional tools and send button.

Provide `placeholder` ("Message #community", "Message sable") and `onSend(text)`. Enter sends, Shift+Enter adds a line, Escape cancels a reply. Pass `replyTo` as `{author, text}` with `onCancelReply`. A click anywhere in the composer outside its controls focuses the input.

- `onEmoji` and `onAttach` each show their tool button; leave them out when the feature does not exist.
- `aside` holds the channel picker. `beforeSend` holds one icon button placed right before Send, such as the message style.
