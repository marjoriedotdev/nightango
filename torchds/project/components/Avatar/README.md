# Avatar

Profile picture or initials on a muted color derived from the username, with optional presence.

Pass `src` to show a profile picture. The initials stay underneath and remain visible while it loads or if it fails (account without a picture, guest); a failed URL is not requested again on the same page. The picture fades in once loaded, and shows at once when the page already loaded it. `onLoad` is called each time the picture loads, to offer actions that need it, such as opening the full photo.

Pass `name`; the color comes from a fixed palette of eight muted tones so a user keeps the same color everywhere. `status` is online, idle or offline, and the dot is never the only cue: where one person is shown, write the status next to the avatar (Online, Idle, Last online …); in a list row, the dot may stand alone and the row's accessible name states the status. Set `ring` to the surface color behind the avatar so the presence dot is cut out cleanly. `square` renders a group icon.

Sizes:

- 16 in reply previews.
- 22 in the sidebar and in groups in common.
- 28 in every list row, with one or two lines of text: conversations, friends, members, settings lists.
- 36 in messages.
- 72 in the profile panel.
- 96 in the profile dialog.
