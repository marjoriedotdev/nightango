# Changelog

Changes in Nightango that you can see, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The build shows these notes in Settings, What's new, and refuses a `@version` without its section.

## [0.28.0] - 2026-10-30

### Added

- You can now edit your own private messages and quote any private message from the message menu, as you already could in groups.
- When you reply to a message or edit one, a line under it reminds you that only Nightango and BetterChatango users see it as a reply or an edit. Other Chatango apps show it as a new message.

### Fixed

- After a mention or a private message, the tab title keeps your unread count. For this, Nightango turns off BetterChatango's own tab title alerts, so they also stay off when you use BetterChatango on its own.
- If you turned on desktop notifications in BetterChatango, a mention now shows one notification instead of two.
- Some mini profiles showed up blank. They now show their text.

## [0.27.1] - 2026-10-29

### Fixed

- Images uploaded to a chat now show at full size instead of Chatango's blurry thumbnail, and starring one saves the full size image to your media.

## [0.27.0] - 2026-10-29

### Added

- Each group and private conversation remembers what you were typing when you switch away, until you reload the page.
- A new Same text size for everyone switch in Settings, Appearance, on by default: messages use your text size, whatever size their authors picked. Mini profiles keep their own sizes.

### Fixed

- On a member's Premium background, the badges in their profile and in Meet people now use the Premium text color instead of Nightango orange.

## [0.26.0] - 2026-10-29

### Added

- In a group, typing @ opens a list of members above the message field, with their picture, presence and staff role. Move through it with the arrow keys, pick a name with Tab, Enter or a click, and close it with Escape. It replaces cycling through names with Tab.

### Changed

- Developer and Premium badges are now icons in messages, member lists and Meet people, with their name on hover. An open profile still spells them out under the name, Premium included.

## [0.25.0] - 2026-10-28

### Changed

- A file you pick now waits above the message field, with a preview and a remove button, until you press Send. It then goes out with your text in a single message, and nothing is uploaded before that.
- When a message already shows an image, a video, an audio file or a YouTube video, its link no longer repeats in the text.
- Menus, popovers and dialogs fade in when they open, and buttons, rows and tabs fade on hover.
- Rounded corners follow the same scale everywhere, and the veil behind dialogs is lighter in the dawn theme.

### Fixed

- On a narrow screen, keyboard focus no longer gets lost in the closed navigation drawer.

## [0.24.0] - 2026-10-28

### Added

- The BetterChatango sign-in screen now uses Nightango's colors, fonts and theme. BetterChatango still handles your sign-in.
- About Nightango now links to Nightango's source code and issue tracker on GitHub.

### Changed

- When the connection drops, a single banner says Reconnecting, then Reconnected once you're back. If every attempt fails, it offers Try again and Reload.
- Gender now shows as M or F in your profile and in Meet people.

### Fixed

- In Meet people, you pick the age range with a two-handle slider that always covers at least one year. Asking for a single age used to show an empty list.
- Groups show their initial instead of Chatango's "?" picture.
- On iPhone and iPad, tapping a field on the sign-in screen no longer zooms into the page.

## [0.23.0] - 2026-10-27

### Added

- You can reply to a private message, as in groups. The reply shows the message it answers, and clicking it takes you back there. Messages sent from the official Chatango client can't be replied to.

## [0.22.2] - 2026-10-27

### Fixed

- Your private message list no longer shows people who aren't your friends as online hours after they went offline.
- After your private messages reconnect, the open conversation still shows when the other person comes online or goes offline.

## [0.22.1] - 2026-10-27

### Fixed

- Profile pictures no longer flicker when you switch views or groups.

## [0.22.0] - 2026-10-27

### Added

- When a newer version of Nightango is out, a notice at sign-in offers to download it.
- Who is this is now in the private conversation menu, the private message list menu, the profile panel and the staff list menu.

### Changed

- Messages in the red, blue and staff channels are highlighted with a gradient in their channel color, like mentions. A mention keeps its own highlight.

### Fixed

- In the status menu, Idle now shows as a crescent moon, matching your avatar.
- Messages in Comic Sans MS no longer turn into joined-up handwriting on iPhone and iPad.

## [0.21.0] - 2026-10-26

### Added

- Nightango developers now have a "Nightango developer" badge next to their name in messages, member lists, Meet people and profiles.

### Changed

- The userscript file is now called `nightango.min.user.js`. Paste it over your existing Nightango script, as before.
- Group settings now show the group title and description as text.
- The description of Reduce motion now only talks about transitions.
- In Staff and roles, the descriptions of Configure AutoMod, Edit group info and Edit restrictions now list only what these permissions cover.

### Removed

- The Highlight new features switch, which did nothing.

## [0.20.2] - 2026-10-26

### Fixed

- Text you align with the formatting toolbar now shows aligned in BetterChatango too.
- Text sizes set with the toolbar are now in pixels, the way BetterChatango and Chatango read them, and mini profiles show sizes the same way.
- Paragraphs in mini profiles are spaced as in BetterChatango.

### Removed

- The strikethrough button, since BetterChatango doesn't show struck-through text.

## [0.20.1] - 2026-10-25

### Fixed

- Visitors now works with the Userscripts app on iPhone and iPad.
- Going back to the page before signing in no longer logs an error.
- When the connection drops, you only see the connection banner. A second notice used to appear, and its Reconnect button could open a duplicate connection.

## [0.20.0] - 2026-10-25

### Added

- A formatting toolbar in Settings, Profile, above your bio and your full profile: bold, italic, underline, strikethrough, text color, font, size, alignment, links and images. Ctrl+B, Ctrl+I and Ctrl+U work in both fields, and Ctrl+Z undoes each change.
- Color, font and size applied to the same text are saved together, so they use fewer of your characters.

## [0.19.0] - 2026-10-25

### Added

- In Settings, Appearance, Sky, Moon, you can keep tonight's moon next to Nightango, which is the default, or pick a fixed phase. Day dividers keep showing the moon of each night.

### Changed

- The Nightango logo is now the moon alone. The small spark on its edge, in your accent color, is gone.
- In the light theme, the moon takes the colors of a sunrise, from gold to coral, and the presence moons are orange instead of brown.
- In the dark theme, the moon looks like the real one, with its seas, the bright craters Tycho and Copernicus, and a darker edge. In the southern hemisphere it is turned upside down, as you see it from there.

## [0.18.0] - 2026-10-25

### Added

- A night sky theme: the panels float over a starry sky, with a cloud drifting across the top of the navigation.
- The moon next to the Nightango name is tonight's moon, at its real phase, worked out on your device. Day dividers show the moon of each night.
- In Settings, Appearance, Sky, Calm sky stops the drifting cloud, and Southern hemisphere draws the moon as it looks south of the equator.

### Changed

- Torch Skin is now called Nightango. It is still a skin for BetterChatango, and About Nightango in Settings explains what BetterChatango does for you.
- The tab title and desktop notifications now say Nightango.
- Presence shows as a moon phase: a full moon when someone is online, a crescent when idle, a new moon when offline.
- Group names, profile names and page titles use a serif typeface, Instrument Serif.
- The light theme becomes dawn, a lavender sky over warm paper.
- Groups with new messages show a star, and unread counts, the Send button and main buttons glow like a torch.
- Messages that mention you are lit from the left.
- Group headers no longer put a # before the group name.
- On phones, the members button in a group header only shows the count, so the group name fits.

### Removed

- The BetterChatango sign-in screen is no longer restyled: you sign in on BetterChatango's original screen.

## [0.17.0] - 2026-10-25

### Added

- You can upload a new profile picture from Settings, Profile, then choose the square your avatar shows.
- You can adjust the crop of your current profile picture with the mouse or the keyboard.
- If you have Premium, you can set the background color, text color, link color and background image of your mini profile. Paste an image link or upload the image to vissle.

### Fixed

- The profile preview shows your Premium background colors and image.
- Opening Profile in the hosted prototype no longer shows an error while the visitors list loads.

## [0.16.1] - 2026-10-25

### Changed

- Editing a private message no longer plays the mention sound, even when the original is too old to be shown.

## [0.16.0] - 2026-10-24

### Added

- Chats shows a banner when this browser can't save private messages, and keeps counting unread messages until you reload.

### Changed

- Unread counts for private messages now come from the history BetterChatango keeps in this browser, so they stay right after a reload or a reconnection.
- In the hosted prototype, message requests and the Who can message you setting are gone, as on Chatango.

## [0.15.4] - 2026-10-24

### Changed

- Premium profile backgrounds from a site you trust now load without a click, like images in messages.

## [0.15.3] - 2026-10-24

### Changed

- Staff and roles describes admins as moderators who can change group settings, as Chatango does.
- In the hosted prototype, group staff work as on Chatango: one owner, and moderators with their own permissions. Co-owners are gone, and only staff can delete messages.

## [0.15.2] - 2026-10-24

### Changed

- Groups and private conversations now scroll the same way: they stay at the bottom, keep your place, load earlier messages and jump to a message alike.

## [0.15.1] - 2026-10-24

### Added

- Groups and private messages reconnect on their own when Chatango drops the connection, up to three times.
- When your private messages disconnect, a banner offers a Reconnect button.

### Changed

- Closed connections now reconnect when you come back to the page, not only when your network comes back.

## [0.15.0] - 2026-10-24

### Added

- A banner warns you when vissle reports that your private messages are restricted.

## [0.14.2] - 2026-10-24

### Added

- Settings, Diagnostics keeps a log of connection and page events in this browser, to help find out why a group or your private messages disconnect. You can copy or download it to share it.

## [0.14.1] - 2026-10-24

### Fixed

- Images, videos and audio linked over http, such as Chatango uploads, show in messages again.

## [0.14.0] - 2026-10-24

### Added

- What's new lists the changes in each version.

### Changed

- Who is this shows each linked account as a mini profile card that opens its profile.
- Your friends list is split into Online and Offline.

## [0.13.0] - 2026-10-24

### Fixed

- Conversations stay scrolled to the bottom while media and older messages load.
- Your reading position holds in browsers without scroll anchoring.
- Profile dialogs open at the top.

## [0.12.0] - 2026-10-23

### Added

- You can edit your own group messages, quote a message, and jump to the message a reply answers.
- Click a member's name to mention them, or complete an @mention with Tab.
- Recent mentions from all your groups are gathered in one list.
- Chatango emoticons show in messages, and a picker in both message fields offers BetterChatango emoticons.
- Video, audio and YouTube links in a message are embedded.
- You can send a file through vissle and reuse the media library BetterChatango keeps in this browser.
- The message field counts the characters you have left.
- A setting formats Markdown when you send.
- Members' Premium message backgrounds are shown.
- You can hide guest messages and announcements, messages from chosen channels, or a member's style.
- Compact mode shows role and channel.
- Named guests appear in the member list.
- Groups you own or visited recently appear even if you haven't joined them.
- name.chatango.com links open the member's profile.
- Clicking an author's avatar opens their profile, in groups and private messages.
- Scroll up to load older private messages, and search what they say.
- You can export and import your private message history.
- You can remove a private message from this browser.
- Private messages have an actions menu.
- Your private message style can use strikethrough.
- The Density setting applies to private messages too.
- You can see whether your account's private messages are restricted.
- You can see whether people who aren't your friends are online.
- View profile is in the Chats and Friends row menus, and in the conversation header at any width.
- Removing a friend asks for confirmation.
- You can edit your full profile, and add or remove the vissle tracker in your bio.
- Who is this shows someone's linked accounts.
- The ban list loads page by page, can be searched, and shows recent unbans. Guests are left out.
- Staff who can see IP addresses see the author's IP.
- In Privacy, you can trust sites for links and media.
- You can adjust BetterChatango's sounds.

### Changed

- Unread counts only show on navigation items, and count conversations the same way everywhere.
- Each action has the same label and icon in every menu.
- Loading and empty states look the same in every section.

### Removed

- The Requests tab and the Language page, which did nothing.
- The Privacy banner pointing to a BetterChatango idle setting that had no effect.

### Fixed

- Unread private message counts survive a reload.
- Editing a private message replaces the original.
- Messages you receive keep their bold, italic, underline and strikethrough.
- Commands you type run instead of being sent as text.
- Deleting a group message asks for confirmation.
- A sound plays for private messages outside the open conversation.
- The member list follows sign-ins and sign-outs.
- Ignored members follow BetterChatango's ignore list, and muted groups follow BetterChatango's.
- Announcements keep their line breaks, emphasis and background mode when you save them.
- A server error no longer shows up as an empty full profile.
- Add friend in the conversation menu, and Undo after removing a friend, now tell you whether they worked.
- Notify when online is only offered for friends.
- Ctrl+K no longer lists closed conversations and requests.
- The Groups section hides when all your joined groups are favorites.
- Jumping to a message no longer loads every older page on the way.

## [0.11.0] - 2026-10-23

### Added

- Chat and friend rows show, at the top right, how long someone has been idle or when they were last online.

### Changed

- You only show as idle after three minutes without activity.

## [0.10.0] - 2026-10-22

### Added

- Scroll up to load older group messages.
- Favorites follow BetterChatango's favorite list.
- BetterChatango's startup settings are in Settings.
- The full profile shows the member's colors and background. The profile dialog has a new look and opens the full size photo.
- Group announcements show media.
- Members' font sizes show in group and private messages.
- On touch screens, swipe a friend row for its actions, and pull down to refresh Meet people.
- The Geist and Geist Mono fonts are built into the script, so Nightango no longer calls Google Fonts.

### Changed

- BetterChatango errors show as notifications instead of lines in the conversation.
- Joins, leaves and friend presence no longer show in the conversation.
- Waiting and needless success notifications are gone.
- Private message notifications preview up to three lines.

### Removed

- The private messages startup switch, which did nothing.

### Fixed

- Earlier messages stay reachable after a failed load, and loading stops at the history limit.
- A conversation keeps its position when older messages are added above.
- On mobile, you can pick a channel, see the group description and members, and read the banner text under its title.
- You're told when Chatango refuses or never confirms a friend add. The Add button stays busy until the friend shows up.
- Favorites that BetterChatango didn't save are reported instead of quietly dropped.
- Notify when online stays separate from conversations and in sync with BetterChatango.
- Escape only closes the dialog on top.
- Your own style always applies when you send, even if your clock is behind.
- A member's newest style wins over older history.
- Media in a private message you send shows right away, and only once it's sent.
- Profile backgrounds repeat the way their author set them.

## [0.8.1] - 2026-10-22

### Added

- A redesigned interface on top of BetterChatango, with dark and light themes, the accent color of your choice and a compact density.
- You sign in on BetterChatango's own screen, restyled to match. Nightango, then called Torch Skin, never sees your password.
- Groups: messages, replies, edited messages, channels, older history, presence and reconnection.
- Moderation: delete messages, ban and unban, clear the group, close the group.
- Group settings: announcement, banned words, slow mode, spam filters, links and media, broadcast mode, moderator permissions and the moderation log.
- Private messages: your history from BetterChatango, friends with when they were last online, adding and removing friends, blocking, your status, closing or deleting a conversation.
- Private messages received while you were away arrive with a single notification.
- Your own message style, kept in this browser.
- Meet people, with filters, colored bios and infinite scroll.
- Mini profiles with Premium backgrounds, the full profile in an isolated frame, and editing your own profile.
- See who visited your profile, with filters.
- Create a group.
- Loading screens and placeholders, and a clear message when your session is cut, with a way to reconnect.
- Media wait for a click when your settings ask for it.
