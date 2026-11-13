# IconButton

A square button that holds a single icon, with a required accessible label.

Provide `icon` and `label`. The label becomes `aria-label` and the tooltip. Default size 32 in headers, 28 in message toolbars, 26 for dismiss buttons, 44 on touch screens.

- Pass `pressed` for toggles (members panel, profile panel) so the state is announced and shown with `selected`.
- Pass `count` on a button that leads to what waits for the user, such as the mobile navigation button: the number shows on its corner, 99+ past 99, and joins the accessible name as "5 unread".
- Color is `text-2` at rest and `text` on hover.
