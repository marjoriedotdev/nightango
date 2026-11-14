Nightango is a calm, readable skin for BetterChatango, a web client for Chatango. Its theme is a full-moon night with scattered clouds, and a torch: cool moonlight frames the interface, warm ember marks what is alive and what asks for the reader. Conversations stay on solid surfaces and carry the color. Build every screen from these tokens and the `Torch` components; never paste raw values.

## Content fundamentals

- Write interface copy in English, sentence case: "Save changes", "Private messages", "Discover groups". Capitals only for `label-caps` section labels (FAVORITES, STAFF · 3).
- Buttons start with a verb and say what happens: "Join", "Send reset link", "Create account". Never "OK" or "Submit".
- A menu entry that opens a dialog to confirm or complete the action ends with an ellipsis (…, not three dots): "Block…", "Leave group…", "Create a group…". Entries that act at once or only show something ("Copy text", "View profile") have none, and neither do buttons, even one that asks for confirmation ("Clear all").
- Address the reader as "you", the product as "Nightango". A setting does not speak as the reader: "Join groups you own", not "Join groups I own". The one exception is the set phrase "Don't warn me again".
- Other people are "people", "members" inside a group and "friends" on the friends list, never "users". They come online and go offline, they do not connect.
- Buttons say "Log in" and "Log out", and sentences follow them: "Reload the page and log in again."
- BetterChatango is named when BetterChatango does the work: logging in, the private message history, the media library, its own settings. vissle is "vissle" when it does the work, "vissle.me" only as an address. Chatango is named when an action goes to Chatango: "Your Chatango profile. Everyone on Chatango sees it."
- Settings are statements of what happens, followed by one line of consequence: "Mark new messages" / "Draws a line above the first message you haven't read." The line is optional: leave it out when it would only repeat the label ("Friend comes online" needs none).
- Write the way people talk: contractions ("can't", "didn't", "you're"), the active voice, everyday words. "Couldn't save the announcement.", not "The announcement could not be saved." The legal notice in About keeps the full form, and the two texts of a connection that stays lost keep the wording of the official client.
- Errors say what to do next: "Use letters, numbers and dashes only." Not "Invalid input". A status code, a file name or a protocol word never reaches the reader: it goes to the diagnostic log.
- No emoji in the interface, no exclamation marks, no filler ("Oops", "Awesome").
- Be honest about trade-offs where they affect trust. The login screen states that credentials are stored encrypted on BetterChatango servers.
- Roles: next to a name, the short role is a `Badge` with its icon: Owner with a crown in the `moon` tone, Mod and Admin with a shield in the `moon-quiet` tone. The long role (Moderator) belongs in a sentence or a title. The viewer's own row carries a `You` badge, never "(you)" in text.
- Traits of a person (Nightango developer, Premium) are an icon-only `Badge` in the `moon` tone next to the name in lists and messages, and a badge with its full text in the open profile.

## Color

- Dark (night) is the default theme, light (dawn) is the alternative; both use the same token names. The sky (`sky-top` to `sky-bottom`, `star`, `cloud`) sits behind everything. At night an afterglow (`sky-horizon`) lights its foot, plum on the left and teal on the right. In front of it, put surfaces in this order from back to front: `sidebar`, `bg`, `panel`, `subtle`, `raised`.
- Two lights, two meanings. Moonlight (`moon`, `moon-ink`, `moon-lit-top` to `moon-lit-bottom`) for structure, presence and the mark. At night the drawn moon shows the seas and bright craters of its near side (`moon-maria`, `moon-crater`) with a darker edge (`moon-limb`). At dawn it takes the colors of a sunrise, gold to coral, without its seas. Moonlight also marks the standing of a person: `moon-text` on a `moon-soft` fill for the Owner badge and for traits, `moon-text` on the icon alone for the other staff badges. Ember (`accent`) only for what asks for attention.
- Text: `text` for names, headings and labels, `text-body` for message bodies, `text-2` for secondary text and icons, `text-3` for timestamps and hints. All four hold 4.5:1 on every surface in both themes.
- `accent` (ember) is a fill: primary buttons, unread counts, the send button, the on state of switches. Primary buttons, counts and the send button carry `shadow-glow`, the light of the torch. Text and icons on it use `on-accent`, never white.
- An unread count is a `CountBadge` on the navigation item that leads to the list. A filter inside the list does not repeat it.
- When the accent is text or an icon (mentions, links, the announcement pin), use `accent-text`, which is darkened in light for contrast. A message that mentions the viewer is lit from the left: the accent fades through `accent-soft` to the surface.
- Use `danger` as text only, on destructive actions that also say what they do (Block, Log out, Close group). Use `warning` for the icon of a warning banner; the sentence carries the meaning.
- A favorite is a star filled with `favorite`, at the end of the name line of its list row, never right after the name, where it would read as part of it.
- Presence is a moon phase: full moon (`status-online`), crescent (`status-idle`), new moon outline (`status-offline`). The shape carries the state, so a list reads in grayscale. Where one person is shown (a conversation header, a profile), a text label sits next to the dot (Online, Idle, Last online …). In a list, the phase may stand alone on screen; the row's accessible name then states the status.
- Focus: a 2px solid `focus-ring` outline offset by 2px on every interactive element. It holds 3:1 on every surface.

## Seasons

- A season dresses the night for a few days a year, read from the device date: Halloween from October 24 to November 2, winter from December 1 to January 6 (June 1 to July 6 with the southern sky), Christmas from December 18 to 26 in place of winter and under both skies, Valentine's Day from February 10 to 14. Its tokens (`color.seasons` in `tokens.json`) replace the tokens of the same name under the `season-<id>` class on the root, in both themes, and add the colors of its decorations (`season-*`).
- A season keeps every contrast rule above: text at 4.5:1 on every surface, and `bg` and `selected` at least as far from text as in the base theme, since member colors and the accent as text are corrected against the base values. The accent stays the reader's choice.
- The moon keeps its real phase; only its colors change. At Halloween it turns into a harvest moon, gold to rust, over a violet night. At Christmas it turns gold over a fir green night, with a red and gold afterglow at the foot of the sky. In winter and on Valentine's Day only its glow changes, cold or rose: surfaces and text keep the base theme.
- Decorations are inline SVG, hidden from assistive technology, never over text or a control: silhouettes, frost, snowflakes, a string of lights, a fir branch or hearts on the sky band, a star beside the moon of the brand, a cobweb in a column corner, a costume on member avatars from 24px through the `decor` slot of `Avatar` at Halloween, in winter and at Christmas. Group icons wear none. Snow falls only under the northern sky, at Christmas too.
- Seasonal motion stops with Calm sky and with reduced motion. Seasonal decorations, in Appearance, turns the whole season off.
- New Year, on top of the season of the date: a countdown in `text-2` under the moon during the last minute of December 31, then "Happy New Year" and fireworks (`season-spark-*`) for the first minute of January 1, in the sky behind the panels and on the sky band above the name, never behind text. Only the greeting is announced, once. Calm sky and reduced motion keep the countdown and drop the fireworks.

## Typography

- Geist (`font-sans`) for everything people read and click. Instrument Serif (`font-display`) for places and people: page titles, conversation header names, profile names, empty state titles, the wordmark. Geist Mono (`font-mono`) only for version numbers. All three are embedded from `fonts/fonts.css` (SIL Open Font License 1.1, see `fonts/OFL.txt`).
- Instrument Serif comes in one weight. Never bold it: a name in a header stays at 400.
- Numbers that stack or update in place (times, counters, sliders) use tabular figures, so their digits line up.
- Default text is `body` (14/20). Author names and unread rows use `body-strong`. Descriptions use `caption`.
- A control takes its text size from its height: `control` (13.5px) at `size-control-md`, `caption` at `size-control-sm`, `body` at `size-control-lg`. A button and the field next to it share one size.
- In CSS a font size is the variable of its style, `--font-size-<style>` (`--font-size-body`, `--font-size-control`), never a pixel value.
- Page titles use `display-lg`, profile names and empty state titles `display-md`, conversation header names `display-sm`. Section titles stay `title-sm`, dialog titles `title-md`.
- Timestamps are `meta-sm` in `text-3`: `12:42`, never "12:42 PM" unless the reader turns off 24-hour time.

## Spacing, radius and layout

- Spacing steps: `space-2` between an icon and its label, `space-3` between an avatar and a message, `space-5` for the message log side padding and settings rows, `space-6` between settings sections, `space-10` and `space-12` for settings page padding.
- Radius: `radius-md` for rows and icon buttons, `radius-lg` for buttons, inputs and banners, `radius-xl` for sections, cards, the composer, the save bar, menus, popovers and toasts, `radius-panel` for the panels over the sky and dialogs, `radius-full` for avatars, presence, switches and the send button.
- App shell: panels floating over the sky with a 10px gutter: `size-sidebar` navigation, a fluid center column, an optional `size-members` column on the right (members in a group, profile in a private conversation). Below 1180px the right column hides; its header control then opens the same content full screen. Below 860px the panels go edge to edge and the sidebar becomes a drawer.
- Settings pages: navigation on the left, content capped at 820px, sections stacked with `space-6`.
- Targets: `size-control-md` on desktop, at least `size-touch` on mobile.

## Elevation and borders

- Panels (navigation, main, members, settings) float over the sky with a `border` hairline and `shadow-panel`. Inside a panel, separate areas with `border` hairlines, not shadows. Rows inside a section use `divider`.
- Floating elements get a shadow: `shadow-popover` for the message toolbar and menus, `shadow-floating` for the save bar and dialogs.
- Dialogs and the open navigation drawer sit on a `scrim` veil.
- Gradients belong to the sky only: the sky itself and its afterglow, the sky band at the top of the navigation, the dusk at the top of the main panel, the mention light, hairlines that fade at their ends. Text never sits on the sky or on a cloud.
- No glass effects, no colored left borders. One exception: a message posted on a Chatango channel carries a 3px stripe and a light tint in the channel color, and the message head still names the channel.

## States and behavior

- Hover: `hover` on rows, `hover-2` on buttons. Current item: `selected`. Pressed toggles: `selected` plus `aria-pressed`.
- Local preferences (theme, notifications, density) save on change and say so in the page description. Changes that go to Chatango (profile, group settings, roles) collect in a `SaveBar` and are saved together.
- Destructive actions ask for confirmation in a dialog that repeats the consequence.
- A toast carries its tone as an icon in a tinted disc: a check for something done, the info icon on `accent-soft` for a notice, the alert icon in `warning` for a failure. Its action is a text button, and its close button shows on hover or focus, always on touch. It stays 4.5 to 10 seconds with the length of its text, 8 seconds at least for a failure, and waits while it is hovered or focused and while the page is hidden. The same text shown again starts the delay over instead of stacking.
- A lost connection never blocks the app: a banner says it, above the message box or at the top of the page, with a ring that empties until the next automatic attempt, then the attempt in progress. Reconnect now stays secondary while Nightango tries on its own and turns `accent` once it has stopped trying, next to Reload. Back online, the banner says Reconnected and folds away.
- Signed in somewhere else, an expired session and being offline block the app with a centered dialog, one icon per reason.
- A row in Chats or Friends opens the conversation. A row in Meet people or a member list opens the profile. A row about a person whose main action is not the profile offers View profile in its menu.
- Loading: a list with no rows yet shows skeleton rows shaped like its rows. A list loading its next page keeps its rows and shows a `Spinner` below them. A single block (a form, a profile, one control) says what is loading in one line of text.
- Interface motion uses the motion tokens, all on `ease-out`: `duration-fast` for buttons, `duration-base` for colors, opacity and short moves, `duration-surface` for surfaces that travel (the navigation drawer, a swiped row, pull to refresh). Hover feedback fades on every interactive element; keyboard selection in a list (menus, the palette, suggestions) moves at once. Menus, popovers and dialogs fade in as they open and close at once; a dialog also grows from 98%. A toast fades out and folds, so the stack closes up instead of jumping. Nothing bounces.
- Ambient motion: one cloud drifts across the sky band over 150s. Calm sky (Appearance) and reduced motion stop it.
- The moon is the real one: `Moon` draws the phase of the moment, computed on the device. Southern hemisphere (Appearance) turns it half a turn, as seen south of the equator.

## Members' Chatango styles

Chatango lets members choose name colors, fonts, text colors and message backgrounds. Nightango does not render them by default. Appearance settings expose three switches (Name colors, Fonts and text colors, Message backgrounds); when one is on, Nightango still corrects colors that fall under 4.5:1 on the current theme.

## Iconography

- Stroke icons on a 24px grid at 2px, round caps and joins, drawn at 14 to 18px through `Torch.Icon`. The set follows Lucide's geometry (ISC license).
- Icons inherit the text color of their parent. Icon-only buttons always have a label (`IconButton`).
- No emoji as icons. Group icons and avatars are initials on the eight avatar tones, 45° apart in hue at one lightness, so two neighbors in a list rarely look alike and none competes with the accent; real images replace them when the member has one.

## Logo

The mark is tonight's moon: a 30px `Moon` with its phase name as accessible label, in its moonlight colors whatever the accent. The word Nightango follows in `font-display` at `wordmark` (28px). The mark changes with the moon; do not freeze it into a fixed full moon.
