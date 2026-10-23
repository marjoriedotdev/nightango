# Composer

The message input with reply or edit context, optional tools and send button.

Provide `placeholder` ("Message #community", "Message sable") and `onSend(text)`. Enter sends, Shift+Enter adds a line. A click anywhere in the composer outside its controls focuses the input.

- `context` shows the message the send relates to, above the input: `{icon, verb, author, text, cancelLabel}`, such as `{icon: 'reply', verb: 'Replying to', cancelLabel: 'Cancel reply'}` or `{icon: 'edit', verb: 'Editing', cancelLabel: 'Cancel edit'}`. A new context focuses the input with the cursor at the end. Escape and the cancel button call `onCancelContext`.
- `onEmoji` and `onAttach` each show their tool button; leave them out when the feature does not exist.
- `aside` holds the channel picker. `beforeSend` holds one icon button placed right before Send, such as the message style.
- Pass `value` and `onChange` when the view writes into the input, such as a mention, and `inputRef` to focus it afterwards.
- `onKeyDown(e)` sees each key before the composer does. Call `e.preventDefault()` to keep the key from it, such as Tab completing a mention. Leave Tab alone when there is nothing to complete, so focus moves on.
