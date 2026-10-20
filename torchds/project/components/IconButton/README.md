# IconButton

A square button that holds a single icon, with a required accessible label.

Provide `icon` and `label`. The label becomes `aria-label` and the tooltip. Default size 32 in headers, 28 in message toolbars, 26 for dismiss buttons, 44 on touch screens.

- Pass `pressed` for toggles (members panel, profile panel) so the state is announced and shown with `selected`.
- Color is `text-2` at rest and `text` on hover.
