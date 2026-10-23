import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// -- Gabarit ------------------------------------------------------------------

const COMPONENTS_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), 'torchds', 'project', 'components');

const HEAD = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{name}, preview</title>
<link rel="stylesheet" href="../../fonts/fonts.css">
<style>body{margin:0;padding:16px;background:var(--bg);color:var(--text);font-family:var(--font-sans);font-size:14px;line-height:1.45}.row{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.col{display:flex;flex-direction:column;gap:12px}</style>
</head>
<body>
<div id="root"></div>
<script>
var T = window.Torch, h = React.createElement;
function Demo() {
{body}
}
ReactDOM.createRoot(document.getElementById('root')).render(h(Demo));
</script>
</body>
</html>
`;

// -- Composants ---------------------------------------------------------------

const COMPONENTS = [
  ['Icon', 'Foundations', 64,
    'Stroke icons drawn at 2px on a 24px grid, sized 14 to 18px.',
    `Pass \`name\` from \`Torch.iconNames\`. Size 16 next to body text, 17 in 32px icon buttons, 14 inside badges and small buttons. Icons inherit \`currentColor\`: color the parent, never the icon.

- Decorative by default (\`aria-hidden\`). Give \`label\` only when the icon is the sole carrier of meaning, such as the muted marker on a nav item.
- Never use emoji as icons.`,
    `  return h('div', { className: 'row', style: { color: 'var(--text-2)' } }, ['search','plus','send','reply','smile','hash','users','bell','pin','lock','shield','crown','message','compass','sliders','trash'].map(function (n) { return h(T.Icon, { key: n, name: n, size: 18 }); }));`],
  ['Button', 'Actions', 96,
    'Text buttons in four variants: primary, secondary, ghost and danger.',
    `Provide the label as children, verb first in sentence case: "Save changes", "Join", "Create account".

- \`primary\` (accent fill, \`on-accent\` text): at most one per view, for the action the view exists for.
- \`secondary\` (outlined with \`control\`): every other action that changes something.
- \`ghost\`: cancel, discard, navigation-like actions.
- \`danger\`: destructive actions, always followed by a confirmation.
- Sizes: \`sm\` inside cards and lists, \`md\` default, \`lg\` for login and dialogs. Use \`block\` to fill a form column.`,
    `  return h('div', { className: 'col' },
    h('div', { className: 'row' }, h(T.Button, { variant: 'primary' }, 'Save changes'), h(T.Button, null, 'Manage'), h(T.Button, { variant: 'ghost' }, 'Discard'), h(T.Button, { variant: 'danger', icon: 'ban' }, 'Block')),
    h('div', { className: 'row' }, h(T.Button, { variant: 'primary', size: 'lg', icon: 'plus' }, 'Create a group'), h(T.Button, { size: 'sm' }, 'Join'), h(T.Button, { variant: 'primary', disabled: true }, 'Disabled')));`],
  ['IconButton', 'Actions', 64,
    'A square button that holds a single icon, with a required accessible label.',
    `Provide \`icon\` and \`label\`. The label becomes \`aria-label\` and the tooltip. Default size 32 in headers, 28 in message toolbars, 26 for dismiss buttons, 44 on touch screens.

- Pass \`pressed\` for toggles (members panel, profile panel) so the state is announced and shown with \`selected\`.
- Color is \`text-2\` at rest and \`text\` on hover.`,
    `  return h('div', { className: 'row' }, h(T.IconButton, { icon: 'search', label: 'Search' }), h(T.IconButton, { icon: 'bell', label: 'Notifications' }), h(T.IconButton, { icon: 'users', label: 'Members', pressed: true }), h(T.IconButton, { icon: 'more', label: 'More actions' }), h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 14 }));`],
  ['TextField', 'Forms', 220,
    'A labelled text input or textarea with an optional hint or error.',
    `Always pass \`label\`; the field links it, the hint and the error for assistive tech. Use \`hint\` for format rules and \`error\` once the value is known to be wrong, written as what to do: "Enter a group name".

- \`multiline\` renders a textarea (bio, group description). \`labelAside\` holds a counter like \`96 / 2000\` in \`meta-sm\`.
- Focus shows a \`focus-ring\` border and an \`accent-soft\` halo.`,
    `  return h('div', { className: 'col', style: { maxWidth: 360 } },
    h(T.TextField, { label: 'Username', defaultValue: 'orrin', hint: "It can't be changed later." }),
    h(T.TextField, { label: 'Group name', defaultValue: 'my group!', error: 'Use letters, numbers and dashes only.' }));`],
  ['Switch', 'Forms', 72,
    'An on or off setting that applies immediately.',
    `Use a Switch for preferences that take effect at once. Put it in a \`SettingRow\` so the whole row is the click target and the row title is its label. Alone, pass \`label\` for \`aria-label\`.

- Use a \`Checkbox\` instead inside tables and forms that are submitted.
- \`disabled\` keeps the value visible for permissions the current role cannot change.`,
    `  return h('div', { className: 'row' }, h(T.Switch, { label: 'On', defaultChecked: true }), h(T.Switch, { label: 'Off' }), h(T.Switch, { label: 'Locked', disabled: true }));`],
  ['Checkbox', 'Forms', 72,
    'A box for choices that are submitted or that sit in a matrix.',
    `Use it in the notification matrix (one per event and channel) and in forms like the terms agreement. Pass \`label\` for a visible label or \`ariaLabel\` inside table cells, written as "Mentions, Sound".`,
    `  return h('div', { className: 'row' }, h(T.Checkbox, { label: 'Keep me signed in', defaultChecked: true }), h(T.Checkbox, { label: 'I agree to the Terms of Service' }), h(T.Checkbox, { ariaLabel: 'Mentions, Email' }));`],
  ['SegmentedControl', 'Forms', 72,
    'Two to four mutually exclusive options shown side by side.',
    `Provide \`options\` (strings or \`{value, label}\`), \`value\`, \`onChange\` and a \`label\` for the group. Use it for modes and presets: Log in or Sign up, Comfortable or Compact, AutoMod level. More than four options: use a select.

- \`block\` stretches segments evenly across the container.`,
    `  var s = React.useState('standard');
  return h(T.SegmentedControl, { label: 'Protection level', options: [{ value: 'off', label: 'Off' }, { value: 'standard', label: 'Standard' }, { value: 'strict', label: 'Strict' }, { value: 'custom', label: 'Custom' }], value: s[0], onChange: s[1] });`],
  ['Badge', 'Status', 56,
    'A short label for roles and qualifiers next to a name or title.',
    `Children are one or two words. Default tone (\`selected\` fill, \`text-2\`) for roles like Mod or Owner, with the matching icon. \`accent\` tone for qualifiers that need attention, such as Sensitive on a permission. Mark the viewer's own row with a default-tone You badge.`,
    `  return h('div', { className: 'row' }, h(T.Badge, { icon: 'shield' }, 'Mod'), h(T.Badge, { icon: 'crown' }, 'Owner'), h(T.Badge, { tone: 'accent' }, 'Sensitive'), h(T.Badge, null, 'Friend'));`],
  ['CountBadge', 'Status', 56,
    'An accent pill with an unread or mention count.',
    `Pass \`count\`; it renders nothing at zero and caps at 99+. Pass \`mention\` to prefix @ for mentions, which outrank plain unread counts. A plain unread state with no count uses the 6px \`tc-dot\` instead.`,
    `  return h('div', { className: 'row' }, h(T.CountBadge, { count: 2 }), h(T.CountBadge, { count: 3, mention: true }), h(T.CountBadge, { count: 140 }));`],
  ['Avatar', 'Identity', 80,
    'Profile picture or initials on a muted color derived from the username, with optional presence.',
    `Pass \`src\` to show a profile picture. The initials stay underneath and remain visible while it loads or if it fails (account without a picture, guest); a failed URL is not requested again on the same page. The picture fades in once loaded, and shows at once when the page already loaded it. \`onLoad\` is called each time the picture loads, to offer actions that need it, such as opening the full photo.

Pass \`name\`; the color comes from a fixed palette of eight muted tones so a user keeps the same color everywhere. \`status\` is online, idle or offline, and the dot is never the only cue: where one person is shown, write the status next to the avatar (Online, Idle, Last online …); in a list row, the dot may stand alone and the row's accessible name states the status. Set \`ring\` to the surface color behind the avatar so the presence dot is cut out cleanly. \`square\` renders a group icon.

Sizes:

- 16 in reply previews.
- 22 in the sidebar and in groups in common.
- 28 in every list row, with one or two lines of text: conversations, friends, members, settings lists.
- 36 in messages.
- 72 in the profile panel.
- 96 in the profile dialog.`,
    `  return h('div', { className: 'row' }, h(T.Avatar, { name: 'sable', status: 'online' }), h(T.Avatar, { name: 'quill', status: 'idle' }), h(T.Avatar, { name: 'halcyon', status: 'offline' }), h(T.Avatar, { name: 'orrin', size: 64, status: 'online' }), h(T.Avatar, { name: 'community', square: true, size: 22 }));`],
  ['NavItem', 'Navigation', 200,
    'A row in the sidebar or a list: groups, private messages, settings pages.',
    `Pass \`label\` and either \`icon\` or \`avatar\`. State props, from strongest to weakest: \`active\` (current page, \`selected\` fill), \`count\` with \`mention\`, \`unread\` (bold label and dot), \`muted\` (dimmed with a muted icon). Use \`href\` for real navigation and \`onClick\` otherwise.`,
    `  return h('div', { style: { width: 240, background: 'var(--sidebar)', padding: 8, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 } },
    h(T.NavItem, { icon: 'message', label: 'Private messages', count: 2 }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'community', square: true, size: 22, color: 'var(--accent)' }), label: 'community', active: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'torchdev', square: true, size: 22 }), label: 'torchdev', count: 2, mention: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'trade', square: true, size: 22 }), label: 'trade', unread: true }),
    h(T.NavItem, { avatar: h(T.Avatar, { name: 'artcorner', square: true, size: 22 }), label: 'artcorner', muted: true }));`],
  ['Message', 'Chat', 480,
    'The row shell of a chat log, shared by groups and private messages: full, continued or compact, with slots for the parts the app owns.',
    `Provide \`time\` and the body as children. A text child renders as \`tc-msg-text\`, with \`@name\` tokens as mention chips. An element child renders as is, for rich text and embeds.

- Full row: \`avatar\`, then a header with \`author\`, \`meta\` (role badge, channel label) and the time. Pass \`reply\` as \`{author, avatar, text}\` to quote the parent above it, with a 16px avatar. Add \`onJump\` when the parent is in the log: the quoted text becomes a button that goes to it.
- \`continued\`: a message from the same author within five minutes. No avatar or header, the time shows in the gutter on hover.
- \`compact\`: the Compact density. Time first, then the author, \`meta\` and the body on one line, no avatar. On a narrow screen, what does not fit wraps to a second line. It wins over \`continued\`.
- \`author\` as text renders as \`tc-msg-author\`. Pass an element for a styled or clickable name.
- \`actions\` fills the hover toolbar with icon buttons at size 28. Leave it out when nothing can be done, such as a deleted message.
- \`mention\` tints a message that names the viewer. \`className\` and \`style\` go on the row, for states and member backgrounds.
- \`msgId\` lands on the row as \`data-msg-id\`, so the app can find the message in the log. \`highlight\` gives the row the \`selected\` background, above a member background, for the message the reader just jumped to. The background fades in and out in 150ms.
- \`background\` is drawn behind the whole row and under its text, such as a member's message background image. An image keeps its natural size, placed with \`object-position\` and clipped to the row. \`highlight\` hides it.

- Members' Chatango fonts and colors are not applied here; see Appearance in the brand book.`,
    `  var actions = h(React.Fragment, null, h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16 }), h(T.IconButton, { icon: 'more', label: 'More actions', size: 28, iconSize: 16 }));
  var parent = "Known issue on server s12, it's on Chatango's side.";
  return h('div', { className: 'col', style: { paddingTop: 16 } },
    h('div', null,
      h(T.Message, { author: 'sable', avatar: h(T.Avatar, { name: 'sable' }), meta: h(T.Badge, { icon: 'shield' }, 'Mod'), time: '12:42', actions: actions }, parent),
      h(T.Message, { time: '12:42', continued: true, actions: actions }, 'Reconnecting twice usually sticks.'),
      h(T.Message, { author: 'quill', avatar: h(T.Avatar, { name: 'quill' }), time: '12:44', reply: { author: 'sable', avatar: h(T.Avatar, { name: 'sable', size: 16 }), text: parent, onJump: function () {} } }, 'Confirmed, the second reconnect held.'),
      h(T.Message, { author: 'nightowl', avatar: h(T.Avatar, { name: 'nightowl' }), time: '12:48', mention: true }, '@orrin the theme you exported imports cleanly now.'),
      h(T.Message, { author: 'kestrel', avatar: h(T.Avatar, { name: 'kestrel' }), time: '12:50', highlight: true }, 'Back online on s12.')),
    h('div', null,
      h(T.Message, { compact: true, author: 'sable', meta: h(T.Badge, { icon: 'shield' }, 'Mod'), time: '12:42', actions: actions }, parent),
      h(T.Message, { compact: true, author: 'quill', time: '12:44', reply: { author: 'sable', avatar: h(T.Avatar, { name: 'sable', size: 16 }), text: parent } }, 'Confirmed, the second reconnect held.'),
      h(T.Message, { compact: true, author: 'nightowl', time: '12:48', mention: true }, '@orrin the theme you exported imports cleanly now.')));`],
  ['DayDivider', 'Chat', 56,
    'A centered date label between two hairlines in the chat log.',
    `Children are Today, Yesterday or a short date (Mon 12 Oct). Place one before the first message of each day.`,
    `  return h(T.DayDivider, null, 'Today');`],
  ['Banner', 'Feedback', 120,
    'A one-line notice above content: group announcements and permission warnings.',
    `\`tone\` is \`info\` (pin icon in \`accent-text\`) or \`warning\` (alert icon in \`warning\`). Give a short \`title\`, the text as children, an optional \`action\` button and \`onDismiss\` when the reader may hide it. Below 860px the text goes under the title. One banner per view.`,
    `  return h('div', { className: 'col' },
    h(T.Banner, { title: 'Announcement', onDismiss: function () {} }, 'Server s12 drops connections today. Reconnect twice.'),
    h(T.Banner, { tone: 'warning', action: h(T.Button, { size: 'sm' }, 'Allow in browser') }, 'Your browser blocks desktop notifications for this site.'));`],
  ['SettingsSection', 'Settings', 220,
    'A titled card that groups related settings.',
    `Provide \`title\`, an optional \`description\` and rows as children (\`SettingRow\`, or any content with \`padded\`). \`headerAside\` holds one action such as Import file. Stack sections with \`space-6\` between them; never nest them.`,
    `  return h(T.SettingsSection, { title: 'Sound', description: 'Applies to every alert sound.' },
    h(T.SettingRow, { title: 'Only when Torch is in focus', description: "Stay silent while you're in another tab.", control: h(T.Switch, { defaultChecked: true }) }),
    h(T.SettingRow, { title: 'Play a sound when mentioned', control: h(T.Switch, null) }));`],
  ['SettingRow', 'Settings', 140,
    'A setting with a title, a one-line description and its control on the right.',
    `Provide \`title\`, \`description\` and \`control\`. The row is a label by default so clicking anywhere toggles a Switch; set \`asLabel={false}\` when the control is a button or a select. Write the title as the thing that happens ("Show mentions in the tab title"), not as a question.`,
    `  return h('div', { className: 'tc-section' },
    h(T.SettingRow, { title: 'Mark new messages', description: "Draws a line above the first message you haven't read.", control: h(T.Switch, { defaultChecked: true }) }),
    h(T.SettingRow, { title: 'Delete all conversations', description: 'Removes every private message from your account.', asLabel: false, control: h(T.Button, { variant: 'danger', size: 'sm' }, 'Delete') }));`],
  ['SaveBar', 'Settings', 96,
    'A floating bar that appears when a page has unsaved changes that go to Chatango.',
    `Use it only where changes are sent to Chatango (profile, group settings). Local preferences save on change and never show it. Children say what will change ("Moderator role changed. Applies to sable and vantage."). Provide \`onDiscard\` and \`onSave\`.`,
    `  return h(T.SaveBar, { onDiscard: function () {}, onSave: function () {} }, 'You have 2 unsaved changes');`],
  ['Composer', 'Chat', 150,
    'The message input with reply context, optional tools and send button.',
    `Provide \`placeholder\` ("Message #community", "Message sable") and \`onSend(text)\`. Enter sends, Shift+Enter adds a line, Escape cancels a reply. Pass \`replyTo\` as \`{author, text}\` with \`onCancelReply\`. A click anywhere in the composer outside its controls focuses the input.

- \`onEmoji\` and \`onAttach\` each show their tool button; leave them out when the feature does not exist.
- \`aside\` holds the channel picker. \`beforeSend\` holds one icon button placed right before Send, such as the message style.
- Pass \`value\` and \`onChange\` when the view writes into the input, such as a mention, and \`inputRef\` to focus it afterwards.`,
    `  return h(T.Composer, { placeholder: 'Message #community', replyTo: { author: 'sable', text: "Known issue on server s12" }, onCancelReply: function () {}, onSend: function () {}, beforeSend: h(T.IconButton, { icon: 'type', label: 'Message style', size: 30, iconSize: 16 }) });`],
  ['Skeleton', 'Feedback', 120,
    'A shimmering placeholder that holds the place of content still loading.',
    `Pass \`width\` and \`height\` in pixels, or \`circle\` for an avatar. Compose them in the shape of the rows they replace (avatar plus one or two lines) so the layout does not jump when the content arrives. Use them only while data is on its way: an empty list says so in words.

- Skeletons are hidden from assistive tech: the region that loads announces it once, in text.
- The shimmer stops when the reader asks for reduced motion.
- Add \`tc-fade-in\` on content that replaces a skeleton or appears late, such as a loaded picture.`,
    `  function line(w) { return h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } }, h(T.Skeleton, { circle: true, width: 36, height: 36 }), h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } }, h(T.Skeleton, { width: w, height: 12 }), h(T.Skeleton, { width: w + 60, height: 10 }))); }
  return h('div', { className: 'col', style: { maxWidth: 320 } }, line(90), line(130), line(70));`],
  ['Spinner', 'Feedback', 64,
    'A turning ring for a short wait triggered by the reader.',
    `Use it inline where an action is in progress: loading earlier messages, signing in. Prefer a Skeleton when the shape of the coming content is known. It takes \`currentColor\`; \`size\` defaults to 16.

- Pass \`label\` when no visible text says what is loading; leave it out next to a text such as "Signing in".
- It stops turning when the reader asks for reduced motion.`,
    `  return h('div', { className: 'row', style: { color: 'var(--text-2)' } }, h(T.Spinner, { label: 'Loading' }), h(T.Spinner, { size: 24 }), h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 8 } }, h(T.Spinner, null), 'Signing in'));`]
];

// -- Génération ---------------------------------------------------------------

for (const [name, group, height, summary, guide, body] of COMPONENTS) {
  const folder = join(COMPONENTS_DIR, name);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'README.md'), `# ${name}\n\n${summary}\n\n${guide}\n`);
  const marker = `<!-- @dsCard group="${group}" height=${height} -->\n`;
  writeFileSync(join(folder, 'preview.html'), marker + HEAD.replace('{name}', () => name).replace('{body}', () => body));
  console.log(name);
}
