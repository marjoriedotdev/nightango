# Changelog

Changes in Nightango that you can see, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The build shows these notes in Settings, What's new, and refuses a `@version` without its section.

## [0.19.0] - 2026-10-25

### Added

- Settings, Appearance, Sky, Moon: keep tonight's moon next to Nightango (the default) or pick a fixed phase. Day dividers keep the moon of each night.

### Changed

- The Nightango mark is the moon alone. The small spark at its edge, which took the accent color, is gone.
- In the light theme, the moon takes the colors of a sunrise, gold to coral, and the presence moons are orange instead of brown.
- In the dark theme, the moon looks like the real one: its seas, the bright craters Tycho and Copernicus, and a darker edge. In the southern hemisphere it is turned half a turn, as seen from there.

## [0.18.0] - 2026-10-25

### Added

- A night sky theme: the panels float over a starry sky, and a cloud drifts across the top of the navigation.
- The moon next to the Nightango name is tonight's moon, at its real phase, computed on your device. Day dividers show the moon of each night.
- Settings, Appearance, Sky: Calm sky stops the drifting cloud, Southern hemisphere draws the moon as it looks south of the equator.

### Changed

- Torch Skin is now called Nightango. It is still a skin for BetterChatango: About Nightango in Settings says what BetterChatango does for you.
- The tab title and desktop notifications show Nightango.
- Presence shows as a moon phase: full moon for online, crescent for idle, new moon for offline.
- Group names, profile names and page titles use a serif typeface, Instrument Serif.
- The light theme becomes dawn: a lavender sky over warm paper.
- Groups with new messages show a star. Unread counts, the send button and primary buttons glow like a torch.
- Messages that mention you are lit from the left.
- Group headers no longer show a # before the group name.
- On phones, the members button in a group header shows only the count, so the group name fits.

### Removed

- The BetterChatango sign-in screen is no longer restyled. You sign in on BetterChatango's original screen.

## [0.17.0] - 2026-10-25

### Added

- Upload a new profile picture from Settings, Profile, then crop the square your avatar shows.
- Adjust the crop of your current profile picture, with the mouse or the keyboard.
- Premium members can set the background color, text color, link color and background image of their mini profile. Paste an image link or upload the image to vissle.

### Fixed

- The profile preview shows your Premium background colors and image.
- Opening Profile in the hosted prototype no longer raises an error while the visitors list loads.

## [0.16.1] - 2026-10-25

### Changed

- Editing a private message no longer plays the mention sound, even when the original is too old to be shown.

## [0.16.0] - 2026-10-24

### Added

- Chats shows a banner when this browser can't save private messages, and still counts unread messages until you reload.

### Changed

- Unread counts for private messages come from the history BetterChatango keeps in this browser, so they stay right after a reload or a reconnection.
- In the hosted prototype, message requests and the "Who can message you" setting are gone, as on Chatango.

## [0.15.4] - 2026-10-24

### Changed

- Premium profile backgrounds from a trusted site load without a click, like images in messages.

## [0.15.3] - 2026-10-24

### Changed

- Staff and roles describes admins as moderators allowed to change group settings, as Chatango does.
- In the hosted prototype, group staff work as on Chatango: an owner and moderators with their own permissions. Co-owners are gone, and only staff can delete messages.

## [0.15.2] - 2026-10-24

### Changed

- Group and private message threads now share one scrolling behaviour: staying at the bottom, keeping your place, loading earlier messages and jumping to a message.

## [0.15.1] - 2026-10-24

### Added

- Groups and private messages reconnect on their own after Chatango drops the connection, up to three attempts.
- Private messages shows a banner with a Reconnect button when they disconnect.

### Changed

- Closed connections reconnect when you come back to the page, not only when your network comes back.

## [0.15.0] - 2026-10-24

### Added

- Private messages warns you with a banner when vissle reports that your private messages are restricted.

## [0.14.2] - 2026-10-24

### Added

- Settings, Diagnostics records connection and page events in this browser, to find out why a group or your private messages disconnect. Copy or download the log to share it.

## [0.14.1] - 2026-10-24

### Fixed

- Images, videos and audio linked over http, such as Chatango uploads, show in messages again.

## [0.14.0] - 2026-10-24

### Added

- What's new lists the changes of each version.

### Changed

- Who is this shows each linked account as a mini profile card that opens its profile.
- The friends list is split into Online and Offline sections.

## [0.13.0] - 2026-10-24

### Fixed

- Message logs stay at the bottom while media and older history load.
- Your reading position holds in browsers without scroll anchoring.
- Profile dialogs open at the top.

## [0.12.0] - 2026-10-23

### Added

- Edit your own group messages, quote a message and jump to the original message of a reply.
- Mention a member by clicking their name, or complete an @mention with Tab.
- Recent mentions from every group in one list.
- Chatango emoticons in messages, and BetterChatango emoticons in a picker in both composers.
- Video, audio and YouTube links typed in text are embedded.
- Send a file through vissle, and reuse the media library BetterChatango keeps in this browser.
- The composer counts the characters you have left.
- Format Markdown when sending, in Settings.
- Members' Premium message backgrounds are shown.
- Hide guest messages and announcements, messages from chosen channels, or one member's style.
- Compact mode shows role and channel.
- Named guests appear in the member list.
- Groups you own or visited recently appear even when you have not joined them.
- name.chatango.com links open the profile.
- Open a profile from the author's avatar in groups and private messages.
- Load older private messages by scrolling up, and search their content.
- Export and import your private message history.
- Remove a private message from this browser.
- An actions menu on private messages.
- Strikethrough in your private message style.
- The Density setting applies to private messages.
- See your account's private message restriction.
- See the presence of people who are not your friends.
- View profile from the Chats and Friends row menus and from the conversation header at any width.
- Confirm before removing a friend.
- Edit your full profile, and add or remove the vissle tracker in your bio.
- See linked accounts with Who is this.
- Load the ban list page by page, search it, and see recent unbans. Guests are left out.
- Staff who can see IPs see the author's IP.
- Trust sites for links and media, in Privacy.
- Adjust BetterChatango's sounds.

### Changed

- The unread count appears only on navigation items, and counts conversations the same way everywhere.
- Each action has one label and one icon across menus.
- Loading and empty states look the same in every section.

### Removed

- The Requests tab and the Language page, which had no effect.
- The Privacy banner pointing to a BetterChatango idle setting with no effect.

### Fixed

- Unread private message counts survive a reload.
- Editing a private message replaces the original.
- Received messages keep bold, italic, underline and strikethrough.
- Typed commands run instead of being sent as text.
- Deleting a group message asks for confirmation.
- A sound plays for private messages outside the open chat.
- The member list follows account sign-in and sign-out.
- Ignored members follow BetterChatango's ignore list, and group mute follows BetterChatango's muted groups.
- Announcements keep their line breaks, emphasis and background mode on save.
- A server error no longer shows as an empty full profile.
- Add friend from the conversation menu, and Undo after removing a friend, report their result.
- Notify when online is offered for friends only.
- Ctrl K no longer lists closed conversations and requests.
- The Groups section hides when every joined group is a favorite.
- Jumping to a message no longer loads older pages on the way.

## [0.11.0] - 2026-10-23

### Added

- Chat and friend rows show idle time and last online at the top right.

### Changed

- Idle status appears only after three minutes of inactivity.

## [0.10.0] - 2026-10-22

### Added

- Load older group messages by scrolling up.
- Favorites follow BetterChatango's favorite list.
- BetterChatango startup settings, in Settings.
- The full profile shows member colors and background. The profile dialog is restyled and opens the full photo.
- Media in group announcements.
- Member font sizes in group and private messages.
- Swipe actions on friend rows and pull to refresh in Meet people, on touch screens.
- Geist and Geist Mono are embedded in the script. No more requests to Google Fonts.

### Changed

- BetterChatango errors show as notifications instead of lines in the thread.
- Joins, leaves and friend presence no longer appear in the thread.
- Pending and redundant success notifications are gone.
- Private message notifications preview up to three lines.

### Removed

- The private messages startup switch, which had no effect.

### Fixed

- Earlier history stays reachable after a failed load, and loading stops at the history limit.
- The thread keeps its position when older messages are added above.
- On mobile, you can pick a channel, see the group description and members, and read banner text under its title.
- You're told when Chatango refuses or never confirms a friend add. The Add button stays busy until the friend arrives.
- Favorites BetterChatango did not save are reported instead of dropped.
- Notify when online stays apart from conversations and in sync with BetterChatango.
- Escape closes only the topmost dialog.
- Your own style always applies on send, even when the clock is behind.
- A member's newest style wins over older history.
- Media in a private message you send shows at once, and only once it is sent.
- Profile backgrounds repeat as their author set them.

## [0.8.1] - 2026-10-22

### Added

- A redesigned interface on top of BetterChatango: dark and light themes, adjustable accent color, compact density.
- Sign in on BetterChatango's own screen, restyled to match. Torch Skin never sees your password.
- Groups: messages, replies, edited messages, channels, older history, presence and reconnection.
- Moderation: delete, ban, unban, clear the group, close the group.
- Group settings: announcement, banned words, slow mode, spam filters, links and media, broadcast mode, moderator permissions and moderation log.
- Private messages: history from BetterChatango, friends with last online, add and remove friends, block, status, close or delete a conversation.
- Private messages received while you were away arrive with one notification.
- Your own message style, kept in this browser.
- Meet people with filters, colored bios and infinite scroll.
- Mini profiles with Premium backgrounds, the full profile in an isolated frame, and editing your own profile.
- Who visited your profile, with filters.
- Create a group.
- Loading screens and skeletons, and a clear message when your session is cut, with a way to reconnect.
- Media wait for a click when your settings ask for it.
