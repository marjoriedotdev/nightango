# Toolbar

A row of icon buttons that act on one field, reached with a single Tab stop.

Pass `label` for the toolbar's accessible name and `controls` with the id of the field it edits. Put it in a `TextField` through `toolbar`.

- Children are `IconButton`s at size 30 with 16px icons, like the composer bar. Disabled buttons are skipped.
- Tab enters on the last button used. Left and Right arrows move between buttons and wrap, Home and End jump to the ends.
- Separate groups with a `span.tc-toolbar-sep`.
- Every button has a label that names the format, verb free: "Bold", "Text color", "Add a link".
