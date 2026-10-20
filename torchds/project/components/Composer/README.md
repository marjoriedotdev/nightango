# Composer

The message input with formatting tools, reply context and send button.

Provide `placeholder` ("Message #community", "Message sable") and `onSend(text)`. Enter sends, Shift+Enter adds a line, Escape cancels a reply. Pass `replyTo` as `{author, text}` with `onCancelReply`. `aside` holds the channel picker. Set `tools={false}` on mobile.
