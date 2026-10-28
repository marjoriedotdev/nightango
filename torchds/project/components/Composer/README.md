# Composer

The message input with reply or edit context, optional tools and send button.

Provide `placeholder` ("Message #community", "Message sable") and `onSend(text)`. Enter sends, Shift+Enter adds a line. A click anywhere in the composer outside its controls focuses the input.

- `context` shows the message the send relates to, above the input: `{icon, verb, author, text, cancelLabel}`, such as `{icon: 'reply', verb: 'Replying to', cancelLabel: 'Cancel reply'}` or `{icon: 'edit', verb: 'Editing', cancelLabel: 'Cancel edit'}`. A new context focuses the input with the cursor at the end. Escape and the cancel button call `onCancelContext`.
- `status` shows a send in progress above the input, with a spinner and no cancel button: "Uploading cat.png".
- `attachment` shows the file that leaves with the next send, above the input: `{name, preview, icon, note, onRemove}`. `preview` is an image address for the thumbnail, otherwise `icon` stands in (`image`, `play`, `volume`). `note` says where the file goes, such as "vissle.me hosts it when you send. Anyone with the link can open it." While it is set, Send works with an empty input. Leave out `onRemove` while the file is being sent.
- `onEmoji` and `onAttach` each show their tool button; leave them out when the feature does not exist.
- `aside` holds the channel picker. `beforeSend` holds one icon button placed right before Send, such as the message style.
- Pass `value` and `onChange` when the view writes into the input, such as a mention, and `inputRef` to focus it afterwards.
- `onKeyDown(e)` sees each key before the composer does. Call `e.preventDefault()` to keep the key from it, such as Tab completing a mention. Leave Tab alone when there is nothing to complete, so focus moves on.
- `hint` puts a short text in the bar, before `aside`, and describes the input for assistive tech, such as "240 characters left". Its digits are tabular. With `hintTone: 'warning'`, the `alert` icon in `warning` comes first and the text says what to do: "Shorten your message by 12 characters to send it."
- `canSend={false}` disables Send, and Enter neither sends nor clears the input. Say why in `hint`.
