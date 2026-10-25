# TextField

A labelled text input or textarea with an optional hint or error.

Always pass `label`; the field links it, the hint and the error for assistive tech. Use `hint` for format rules and `error` once the value is known to be wrong, written as what to do: "Enter a group name".

- `multiline` renders a textarea (bio, group description). `labelAside` holds a counter like `96 / 2000` in `meta-sm`.
- `action` puts a default size button on the input's line, `space-2` apart, for forms of one field: Join, Add, Ban. The hint or error goes under both, so the button stays level with the input.
- `toolbar` takes a `Toolbar` placed between the label and the field. `inputRef` receives the input or textarea, for a toolbar that edits it.
- Inputs are `size-control-md` tall, like default buttons.
- Focus shows a `focus-ring` border and an `accent-soft` halo.
