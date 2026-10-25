Nightango is a calm, readable skin for Torch, a web client for Chatango. Its theme is a full-moon night with scattered clouds, and a torch: cool moonlight frames the interface, warm ember marks what is alive and what asks for the reader. Conversations stay on solid surfaces and carry the color. Build every screen from these tokens and the `Torch` components; never paste raw values.

## Content fundamentals

- Write interface copy in English, sentence case: "Save changes", "Private messages", "Discover groups". Capitals only for `label-caps` section labels (FAVORITES, STAFF · 3).
- Buttons start with a verb and say what happens: "Join", "Send reset link", "Create account". Never "OK" or "Submit".
- A menu entry that opens a dialog to confirm or complete the action ends with an ellipsis (…, not three dots): "Block…", "Leave group…", "Create a group…". Entries that act at once or only show something ("Copy text", "View profile") have none, and neither do buttons, even one that asks for confirmation ("Clear all").
- Address the reader as "you", the product as "Nightango". Torch is named when Torch does the work: sign-in, the private message history, the media library, its own settings. Chatango is named when an action goes to Chatango: "This is your Chatango profile. Everyone on Chatango sees it."
- Settings are statements of what happens, followed by one line of consequence: "Mark new messages" / "Draws a line above the first message you haven't read."
- Errors say what to do next: "Use letters, numbers and dashes only." Not "Invalid input".
- No emoji in the interface, no exclamation marks, no filler ("Oops", "Awesome").
- Be honest about trade-offs where they affect trust. The login screen states that credentials are stored encrypted on Torch servers.
- Roles: next to a name, the short role is a `Badge` with its icon (Mod with a shield, Owner with a crown). The long role (Moderator) belongs in a sentence or a title. The viewer's own row carries a `You` badge, never "(you)" in text.

## Color

- Dark (night) is the default theme, light (dawn) is the alternative; both use the same token names. The sky (`sky-top` to `sky-bottom`, `star`, `cloud`) sits behind everything. In front of it, put surfaces in this order from back to front: `sidebar`, `bg`, `panel`, `subtle`, `raised`.
- Two lights, two meanings. Moonlight (`moon`, `moon-ink`) for structure, presence and the mark. Ember (`accent`) only for what asks for attention.
- Text: `text` for names, headings and labels, `text-body` for message bodies, `text-2` for secondary text and icons, `text-3` for timestamps and hints. All four hold 4.5:1 on every surface in both themes.
- `accent` (ember) is a fill: primary buttons, unread counts, the send button, the on state of switches, the spark of the mark. Primary buttons, counts and the send button carry `shadow-glow`, the light of the torch. Text and icons on it use `on-accent`, never white.
- An unread count is a `CountBadge` on the navigation item that leads to the list. A filter inside the list does not repeat it.
- When the accent is text or an icon (mentions, links, the announcement pin), use `accent-text`, which is darkened in light for contrast. A message that mentions the viewer is lit from the left: the accent fades through `accent-soft` to the surface.
- Use `danger` as text only, on destructive actions that also say what they do (Block, Log out, Close group). Use `warning` for the icon of a warning banner; the sentence carries the meaning.
- Presence is a moon phase: full moon (`status-online`), crescent (`status-idle`), new moon outline (`status-offline`). The shape carries the state, so a list reads in grayscale. Where one person is shown (a conversation header, a profile), a text label sits next to the dot (Online, Idle, Last online …). In a list, the phase may stand alone on screen; the row's accessible name then states the status.
- Focus: a 2px solid `focus-ring` outline offset by 2px on every interactive element. It holds 3:1 on every surface.

## Typography

- Geist (`font-sans`) for everything people read and click. Instrument Serif (`font-display`) for places and people: page titles, conversation header names, profile names, empty state titles, the wordmark. Geist Mono (`font-mono`) only for version numbers. All three are embedded from `fonts/fonts.css` (SIL Open Font License 1.1, see `fonts/OFL.txt`).
- Instrument Serif comes in one weight. Never bold it: a name in a header stays at 400.
- Numbers that stack or update in place (times, counters, sliders) use tabular figures, so their digits line up.
- Default text is `body` (14/20). Author names and unread rows use `body-strong`. Descriptions use `caption`.
- Page titles use `display-lg`, profile names and empty state titles `display-md`, conversation header names `display-sm`. Section titles stay `title-sm`, dialog titles `title-md`.
- Timestamps are `meta-sm` in `text-3`: `12:42`, never "12:42 PM" unless the reader turns off 24-hour time.

## Spacing, radius and layout

- Spacing steps: `space-2` between an icon and its label, `space-3` between an avatar and a message, `space-5` for the message log side padding and settings rows, `space-6` between settings sections, `space-10` and `space-12` for settings page padding.
- Radius: `radius-md` for rows and icon buttons, `radius-lg` for buttons, inputs and banners, `radius-xl` for sections, cards, the composer and the save bar, `radius-panel` for the panels over the sky, `radius-full` for avatars, presence, switches and the send button.
- App shell: panels floating over the sky with a 10px gutter: `size-sidebar` navigation, a fluid center column, an optional `size-members` column on the right (members in a group, profile in a private conversation). Below 1180px the right column hides; its header control then opens the same content full screen. Below 860px the panels go edge to edge and the sidebar becomes a drawer.
- Settings pages: navigation on the left, content capped at 820px, sections stacked with `space-6`.
- Targets: `size-control-md` on desktop, at least `size-touch` on mobile.

## Elevation and borders

- Panels (navigation, main, members, settings) float over the sky with a `border` hairline and `shadow-panel`. Inside a panel, separate areas with `border` hairlines, not shadows. Rows inside a section use `divider`.
- Floating elements get a shadow: `shadow-popover` for the message toolbar and menus, `shadow-floating` for the save bar and dialogs.
- Gradients belong to the sky only: the sky itself, the sky band at the top of the navigation, the dusk at the top of the main panel, the mention light, hairlines that fade at their ends. Text never sits on the sky or on a cloud.
- No glass effects, no colored left borders. One exception: a message posted on a Chatango channel carries a 3px stripe and a light tint in the channel color, and the message head still names the channel.

## States and behavior

- Hover: `hover` on rows, `hover-2` on buttons. Current item: `selected`. Pressed toggles: `selected` plus `aria-pressed`.
- Local preferences (theme, notifications, density) save on change and say so in the page description. Changes that go to Chatango (profile, group settings, roles) collect in a `SaveBar` and are saved together.
- Destructive actions ask for confirmation in a dialog that repeats the consequence.
- A row in Chats or Friends opens the conversation. A row in Meet people or a member list opens the profile. A row about a person whose main action is not the profile offers View profile in its menu.
- Loading: a list with no rows yet shows skeleton rows shaped like its rows. A list loading its next page keeps its rows and shows a `Spinner` below them. A single block (a form, a profile, one control) says what is loading in one line of text.
- Interface motion is limited to 120 to 150ms color and position transitions. Nothing bounces.
- Ambient motion: one cloud drifts across the sky band over 150s. Calm sky (Appearance) and reduced motion stop it.
- The moon is the real one: `Moon` draws the phase of the moment, computed on the device. Southern hemisphere (Appearance) mirrors it.

## Members' Chatango styles

Chatango lets members choose name colors, fonts, text colors and message backgrounds. Nightango does not render them by default. Appearance settings expose three switches (Name colors, Fonts and text colors, Message backgrounds); when one is on, Nightango still corrects colors that fall under 4.5:1 on the current theme.

## Iconography

- Stroke icons on a 24px grid at 2px, round caps and joins, drawn at 14 to 18px through `Torch.Icon`. The set follows Lucide's geometry (ISC license).
- Icons inherit the text color of their parent. Icon-only buttons always have a label (`IconButton`).
- No emoji as icons. Group icons and avatars are initials on the eight muted avatar tones; real images replace them when the member has one.

## Logo

The mark is tonight's moon: a 30px `Moon` with its phase name as accessible label, and an ember spark (`accent`, with its glow) at its lower right, the torch under the moon. The word Nightango follows in `font-display` at 28px. The mark changes with the moon; do not freeze it into a fixed full moon.
