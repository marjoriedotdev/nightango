# NavItem

A row in the sidebar or a list: groups, private messages, settings pages.

Pass `label` and either `icon` or `avatar`. State props, from strongest to weakest: `active` (current page, `selected` fill), `count` with `mention`, `unread` (bold label and dot), `muted` (dimmed with a muted icon). Use `href` for real navigation and `onClick` otherwise.
