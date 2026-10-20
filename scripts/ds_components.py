"""Génère README.md et preview.html de chaque composant du design system Torch."""
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) / "project" / "components"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{name}, preview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>body{{margin:0;padding:16px;background:var(--bg);color:var(--text);font-family:var(--font-sans);font-size:14px;line-height:1.45}}.row{{display:flex;flex-wrap:wrap;align-items:center;gap:12px}}.col{{display:flex;flex-direction:column;gap:12px}}</style>
</head>
<body>
<div id="root"></div>
<script>
var T = window.Torch, h = React.createElement;
function Demo() {{
{body}
}}
ReactDOM.createRoot(document.getElementById('root')).render(h(Demo));
</script>
</body>
</html>
"""

COMPONENTS = [
    ("Icon", "Foundations", 64,
     "Stroke icons drawn at 2px on a 24px grid, sized 14 to 18px.",
     """Pass `name` from `Torch.iconNames`. Size 16 next to body text, 17 in 32px icon buttons, 14 inside badges and small buttons. Icons inherit `currentColor`: color the parent, never the icon.

- Decorative by default (`aria-hidden`). Give `label` only when the icon is the sole carrier of meaning, such as the muted marker on a nav item.
- Never use emoji as icons.""",
     """  return h('div', { className: 'row', style: { color: 'var(--text-2)' } }, ['search','plus','send','reply','smile','hash','users','bell','pin','lock','shield','crown','message','compass','sliders','trash'].map(function (n) { return h(T.Icon, { key: n, name: n, size: 18 }); }));"""),
    ("Button", "Actions", 96,
     "Text buttons in four variants: primary, secondary, ghost and danger.",
     """Provide the label as children, verb first in sentence case: "Save changes", "Join", "Create account".

- `primary` (accent fill, `on-accent` text): at most one per view, for the action the view exists for.
- `secondary` (outlined with `control`): every other action that changes something.
- `ghost`: cancel, discard, navigation-like actions.
- `danger`: destructive actions, always followed by a confirmation.
- Sizes: `sm` inside cards and lists, `md` default, `lg` for login and dialogs. Use `block` to fill a form column.""",
     """  return h('div', { className: 'col' },
    h('div', { className: 'row' }, h(T.Button, { variant: 'primary' }, 'Save changes'), h(T.Button, null, 'Manage'), h(T.Button, { variant: 'ghost' }, 'Discard'), h(T.Button, { variant: 'danger', icon: 'ban' }, 'Block')),
    h('div', { className: 'row' }, h(T.Button, { variant: 'primary', size: 'lg', icon: 'plus' }, 'Create a group'), h(T.Button, { size: 'sm' }, 'Join'), h(T.Button, { variant: 'primary', disabled: true }, 'Disabled')));"""),
    ("IconButton", "Actions", 64,
     "A square button that holds a single icon, with a required accessible label.",
     """Provide `icon` and `label`. The label becomes `aria-label` and the tooltip. Default size 32 in headers, 28 in message toolbars, 26 for dismiss buttons, 44 on touch screens.

- Pass `pressed` for toggles (members panel, profile panel) so the state is announced and shown with `selected`.
- Color is `text-2` at rest and `text` on hover.""",
     """  return h('div', { className: 'row' }, h(T.IconButton, { icon: 'search', label: 'Search' }), h(T.IconButton, { icon: 'bell', label: 'Notifications' }), h(T.IconButton, { icon: 'users', label: 'Members', pressed: true }), h(T.IconButton, { icon: 'more', label: 'More actions' }), h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 14 }));"""),
    ("TextField", "Forms", 220,
     "A labelled text input or textarea with an optional hint or error.",
     """Always pass `label`; the field links it, the hint and the error for assistive tech. Use `hint` for format rules and `error` once the value is known to be wrong, written as what to do: "Enter a group name".

- `multiline` renders a textarea (bio, group description). `labelAside` holds a counter like `96 / 2000` in `mono-sm`.
- Focus shows a `focus-ring` border and an `accent-soft` halo.""",
     """  return h('div', { className: 'col', style: { maxWidth: 360 } },
    h(T.TextField, { label: 'Username', defaultValue: 'orrin', hint: "It can't be changed later." }),
    h(T.TextField, { label: 'Group name', defaultValue: 'my group!', error: 'Use letters, numbers and dashes only.' }));"""),
    ("Switch", "Forms", 72,
     "An on or off setting that applies immediately.",
     """Use a Switch for preferences that take effect at once. Put it in a `SettingRow` so the whole row is the click target and the row title is its label. Alone, pass `label` for `aria-label`.

- Use a `Checkbox` instead inside tables and forms that are submitted.
- `disabled` keeps the value visible for permissions the current role cannot change.""",
     """  return h('div', { className: 'row' }, h(T.Switch, { label: 'On', defaultChecked: true }), h(T.Switch, { label: 'Off' }), h(T.Switch, { label: 'Locked', disabled: true }));"""),
    ("Checkbox", "Forms", 72,
     "A box for choices that are submitted or that sit in a matrix.",
     """Use it in the notification matrix (one per event and channel) and in forms like the terms agreement. Pass `label` for a visible label or `ariaLabel` inside table cells, written as "Mentions, Sound".""",
     """  return h('div', { className: 'row' }, h(T.Checkbox, { label: 'Keep me signed in', defaultChecked: true }), h(T.Checkbox, { label: 'I agree to the Terms of Service' }), h(T.Checkbox, { ariaLabel: 'Mentions, Email' }));"""),
    ("SegmentedControl", "Forms", 72,
     "Two to four mutually exclusive options shown side by side.",
     """Provide `options` (strings or `{value, label}`), `value`, `onChange` and a `label` for the group. Use it for modes and presets: Log in or Sign up, Comfortable or Compact, AutoMod level. More than four options: use a select.

- `block` stretches segments evenly across the container.""",
     """  var s = React.useState('standard');
  return h(T.SegmentedControl, { label: 'Protection level', options: [{ value: 'off', label: 'Off' }, { value: 'standard', label: 'Standard' }, { value: 'strict', label: 'Strict' }, { value: 'custom', label: 'Custom' }], value: s[0], onChange: s[1] });"""),
    ("Badge", "Status", 56,
     "A short label for roles and qualifiers next to a name or title.",
     """Children are one or two words. Default tone (`selected` fill, `text-2`) for roles like Mod or Owner, with the matching icon. `accent` tone for qualifiers that need attention, such as Sensitive on a permission.""",
     """  return h('div', { className: 'row' }, h(T.Badge, { icon: 'shield' }, 'Mod'), h(T.Badge, { icon: 'crown' }, 'Owner'), h(T.Badge, { tone: 'accent' }, 'Sensitive'), h(T.Badge, null, 'Friend'));"""),
    ("CountBadge", "Status", 56,
     "An accent pill with an unread or mention count.",
     """Pass `count`; it renders nothing at zero and caps at 99+. Pass `mention` to prefix @ for mentions, which outrank plain unread counts. A plain unread state with no count uses the 6px `tc-dot` instead.""",
     """  return h('div', { className: 'row' }, h(T.CountBadge, { count: 2 }), h(T.CountBadge, { count: 3, mention: true }), h(T.CountBadge, { count: 140 }));"""),
    ("Avatar", "Identity", 80,
     "Initials on a muted color derived from the username, with optional presence.",
     """Pass `name`; the color comes from a fixed palette of eight muted tones so a user keeps the same color everywhere. `status` is online, idle or offline and must also be stated in text nearby (Online, Idle). Set `ring` to the surface color behind the avatar so the presence dot is cut out cleanly. `square` renders a group icon.

Sizes: 16 in reply previews, 22 in the sidebar, 28 in lists, 36 in messages, 64 to 72 on profiles.""",
     """  return h('div', { className: 'row' }, h(T.Avatar, { name: 'sable', status: 'online' }), h(T.Avatar, { name: 'quill', status: 'idle' }), h(T.Avatar, { name: 'halcyon', status: 'offline' }), h(T.Avatar, { name: 'orrin', size: 64, status: 'online' }), h(T.Avatar, { name: 'community', square: true, size: 22 }));"""),
    ("NavItem", "Navigation", 200,
     "A row in the sidebar or a list: groups, private messages, settings pages.",
     """Pass `label` and either `icon` or `avatar`. State props, from strongest to weakest: `active` (current page, `selected` fill), `count` with `mention`, `unread` (bold label and dot), `muted` (dimmed with a muted icon). Use `href` for real navigation and `onClick` otherwise.""",
     """  return h('div', { style: { width: 240, background: 'var(--sidebar)', padding: 8, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 } },
    h(T.NavItem, { icon: 'message', label: 'Private messages', count: 2 }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'community', square: true, size: 22, color: 'var(--accent)' }), label: 'community', active: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'torchdev', square: true, size: 22 }), label: 'torchdev', count: 2, mention: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'trade', square: true, size: 22 }), label: 'trade', unread: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'artcorner', square: true, size: 22 }), label: 'artcorner', muted: true }));"""),
    ("Message", "Chat", 300,
     "One message in a chat log, with author, time, optional reply context and hover actions.",
     """Provide `author`, `time` and the text as children; `@name` tokens render as mention chips. Consecutive messages from the same author within five minutes use `continued`, which hides the avatar and shows the time on hover. Set `mention` when the message names the viewer. `role` adds a Mod or Owner badge. Pass `reply` as `{author, text}` for a quoted parent. Pass `onReply`, `onReact`, `onMore` to show the hover toolbar.

- Members' Chatango fonts and colors are not applied here; see Appearance in the brand book.""",
     """  var noop = function () {};
  return h('div', { style: { paddingTop: 16 } },
    h(T.Message, { author: 'sable', time: '12:42', role: 'Mod', onReply: noop, onReact: noop, onMore: noop }, "Known issue on server s12, it's on Chatango's side."),
    h(T.Message, { author: 'sable', time: '12:42', continued: true }, 'Reconnecting twice usually sticks.'),
    h(T.Message, { author: 'quill', time: '12:44', reply: { author: 'sable', text: "Known issue on server s12, it's on Chatango's side." } }, 'Confirmed, the second reconnect held.'),
    h(T.Message, { author: 'nightowl', time: '12:48', mention: true }, '@orrin the theme you exported imports cleanly now.'));"""),
    ("DayDivider", "Chat", 56,
     "A centered date label between two hairlines in the chat log.",
     """Children are Today, Yesterday or a short date (Mon 12 Oct). Place one before the first message of each day.""",
     """  return h(T.DayDivider, null, 'Today');"""),
    ("Banner", "Feedback", 120,
     "A one-line notice above content: group announcements and permission warnings.",
     """`tone` is `info` (pin icon in `accent-text`) or `warning` (alert icon in `warning`). Give a short `title`, the text as children, an optional `action` button and `onDismiss` when the reader may hide it. One banner per view.""",
     """  return h('div', { className: 'col' },
    h(T.Banner, { title: 'Announcement', onDismiss: function () {} }, 'Server s12 drops connections today. Reconnect twice.'),
    h(T.Banner, { tone: 'warning', action: h(T.Button, { size: 'sm' }, 'Allow in browser') }, 'Your browser blocks desktop notifications for this site.'));"""),
    ("SettingsSection", "Settings", 220,
     "A titled card that groups related settings.",
     """Provide `title`, an optional `description` and rows as children (`SettingRow`, or any content with `padded`). `headerAside` holds one action such as Import file. Stack sections with `space-6` between them; never nest them.""",
     """  return h(T.SettingsSection, { title: 'Sound', description: 'Applies to every alert sound.' },
    h(T.SettingRow, { title: 'Only when Torch is in focus', description: "Stay silent while you're in another tab.", control: h(T.Switch, { defaultChecked: true }) }),
    h(T.SettingRow, { title: 'Play a sound when mentioned', control: h(T.Switch, null) }));"""),
    ("SettingRow", "Settings", 140,
     "A setting with a title, a one-line description and its control on the right.",
     """Provide `title`, `description` and `control`. The row is a label by default so clicking anywhere toggles a Switch; set `asLabel={false}` when the control is a button or a select. Write the title as the thing that happens ("Show mentions in the tab title"), not as a question.""",
     """  return h('div', { className: 'tc-section' },
    h(T.SettingRow, { title: 'Mark new messages', description: "Draws a line above the first message you haven't read.", control: h(T.Switch, { defaultChecked: true }) }),
    h(T.SettingRow, { title: 'Delete all conversations', description: 'Removes every private message from your account.', asLabel: false, control: h(T.Button, { variant: 'danger', size: 'sm' }, 'Delete') }));"""),
    ("SaveBar", "Settings", 96,
     "A floating bar that appears when a page has unsaved changes that go to Chatango.",
     """Use it only where changes are sent to Chatango (profile, group settings). Local preferences save on change and never show it. Children say what will change ("Moderator role changed. Applies to sable and vantage."). Provide `onDiscard` and `onSave`.""",
     """  return h(T.SaveBar, { onDiscard: function () {}, onSave: function () {} }, 'You have 2 unsaved changes');"""),
    ("Composer", "Chat", 150,
     "The message input with formatting tools, reply context and send button.",
     """Provide `placeholder` ("Message #community", "Message sable") and `onSend(text)`. Enter sends, Shift+Enter adds a line, Escape cancels a reply. Pass `replyTo` as `{author, text}` with `onCancelReply`. `aside` holds the channel picker. Set `tools={false}` on mobile.""",
     """  return h(T.Composer, { placeholder: 'Message #community', replyTo: { author: 'sable', text: "Known issue on server s12" }, onCancelReply: function () {}, onSend: function () {} });"""),
]

for name, group, height, summary, guide, body in COMPONENTS:
    folder = ROOT / name
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "README.md").write_text(f"# {name}\n\n{summary}\n\n{guide}\n", encoding="utf-8")
    marker = f'<!-- @dsCard group="{group}" height={height} -->\n'
    (folder / "preview.html").write_text(marker + HEAD.format(name=name, body=body), encoding="utf-8")
    print(name)
