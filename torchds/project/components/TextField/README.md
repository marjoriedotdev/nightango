# TextField

A labelled text input or textarea with an optional hint or error.

Always pass `label`; the field links it, the hint and the error for assistive tech. Use `hint` for format rules and `error` once the value is known to be wrong, written as what to do: "Enter a group name".

- `multiline` renders a textarea (bio, group description). `labelAside` holds a counter like `96 / 2000` in `mono-sm`.
- Focus shows a `focus-ring` border and an `accent-soft` halo.
