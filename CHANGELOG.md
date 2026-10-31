# Changelog

Changes in Nightango that you can see, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The build shows these notes in Settings, What's new, and refuses a `@version` without its section.

## [0.31.0] - 2026-10-31

### Added

- X posts show as a card laid out like on X: author, text, first photo or video, time.
- Links from fxtwitter, vxtwitter, fixupx and fixvx show the same card.
- Embed X posts can be turned off in Settings, Safety.

## [0.30.2] - 2026-10-31

### Added

- TikTok videos show their thumbnail when external media aren't blocked or TikTok is a trusted site.

## [0.30.0] - 2026-10-31

### Added

- Halloween decorations from October 24 to November 2, visible only to you.
- Seasonal decorations can be turned off in Settings, Appearance.

## [0.29.0] - 2026-10-31

### Added

- TikTok links show a Play video button that opens TikTok's player.
- Nightango asks for access to tiktok.com, used only to read TikTok links in your chats.

## [0.28.0] - 2026-10-30

### Added

- Edit your own private messages and quote any private message.
- Replies and edits show a reminder that only Nightango and BetterChatango users see them as such.

### Fixed

- The tab title keeps your unread count. BetterChatango's own tab title alerts are turned off for this.
- A mention shows one desktop notification instead of two.
- Some mini profiles showed up blank.

## [0.27.1] - 2026-10-29

### Fixed

- Uploaded images show at full size, and starring one saves the full size image.

## [0.27.0] - 2026-10-29

### Added

- Each conversation keeps your unsent text until you reload.
- Same text size for everyone, on by default: messages use your text size.

### Fixed

- Badges on a Premium background use the Premium text color.

## [0.26.0] - 2026-10-29

### Added

- Typing @ in a group opens a list of members to mention. It replaces Tab completion.

### Changed

- Developer and Premium badges are icons, with their name on hover.

## [0.25.0] - 2026-10-28

### Changed

- A picked file waits above the message field and is sent with your text when you press Send.
- A link no longer repeats in the text when its media is shown.
- Menus, dialogs and hover states fade in.
- Rounded corners are consistent, and the dialog veil is lighter in the dawn theme.

### Fixed

- On narrow screens, keyboard focus no longer gets lost in the closed navigation drawer.

## [0.24.0] - 2026-10-28

### Added

- The BetterChatango sign-in screen uses Nightango's look.
- About Nightango links to the source code and issue tracker.

### Changed

- A single banner shows the reconnection state, with Try again and Reload if it fails.
- Gender shows as M or F.

### Fixed

- The Meet people age range can no longer be empty.
- Groups show their initial instead of Chatango's "?" picture.
- Tapping a sign-in field no longer zooms the page on iPhone and iPad.

## [0.23.0] - 2026-10-27

### Added

- Reply to private messages, except those sent from the official Chatango client.

## [0.22.2] - 2026-10-27

### Fixed

- Non-friends no longer stay shown as online after they left.
- The open private conversation keeps showing presence after a reconnection.

## [0.22.1] - 2026-10-27

### Fixed

- Profile pictures no longer flicker.

## [0.22.0] - 2026-10-27

### Added

- A notice at sign-in when a newer version is out.
- Who is this is available from more menus and the profile panel.

### Changed

- Red, blue and staff channel messages are highlighted in their channel color.

### Fixed

- Idle shows as a crescent moon in the status menu.
- Comic Sans MS no longer turns into handwriting on iPhone and iPad.

## [0.21.0] - 2026-10-26

### Added

- A Nightango developer badge.

### Changed

- The userscript file is now `nightango.min.user.js`.
- Group settings show the title and description as text.
- Clearer descriptions for Reduce motion and some staff permissions.

### Removed

- The Highlight new features switch, which did nothing.

## [0.20.2] - 2026-10-26

### Fixed

- Text alignment shows in BetterChatango too.
- Text sizes are in pixels, as BetterChatango and Chatango read them.
- Mini profile paragraphs are spaced as in BetterChatango.

### Removed

- The strikethrough button, which BetterChatango doesn't show.

## [0.20.1] - 2026-10-25

### Fixed

- Visitors works with the Userscripts app on iPhone and iPad.
- Going back before signing in no longer logs an error.
- A dropped connection shows a single banner, without a duplicate Reconnect button.

## [0.20.0] - 2026-10-25

### Added

- A formatting toolbar for your bio and full profile, with keyboard shortcuts and undo.
- Formatting on the same text uses fewer characters.

## [0.19.0] - 2026-10-25

### Added

- Choose between tonight's moon and a fixed phase.

### Changed

- The logo is the moon alone.
- The moon takes sunrise colors in the light theme and looks like the real moon in the dark theme.

## [0.18.0] - 2026-10-25

### Added

- A night sky theme.
- The moon by the Nightango name shows tonight's phase. Day dividers show each night's moon.
- Calm sky and Southern hemisphere settings.

### Changed

- Torch Skin is now called Nightango, still a skin for BetterChatango.
- The tab title and notifications say Nightango.
- Presence shows as a moon phase.
- Titles use the Instrument Serif typeface.
- The light theme becomes dawn.
- New look for unread markers, main buttons and mentions.
- Group headers no longer show # before the name.
- On phones, the members button only shows the count.

### Removed

- The restyled BetterChatango sign-in screen.

## [0.17.0] - 2026-10-25

### Added

- Upload a new profile picture and adjust its crop.
- Premium members can set their mini profile colors and background image.

### Fixed

- The profile preview shows Premium backgrounds.
- Profile no longer shows an error in the hosted prototype.

## [0.16.1] - 2026-10-25

### Changed

- Editing a private message no longer plays the mention sound.

## [0.16.0] - 2026-10-24

### Added

- A banner when this browser can't save private messages.

### Changed

- Private message unread counts come from BetterChatango's history and survive a reload.
- Message requests are gone from the hosted prototype.

## [0.15.4] - 2026-10-24

### Changed

- Premium backgrounds from trusted sites load without a click.

## [0.15.3] - 2026-10-24

### Changed

- Admins are described as in Chatango.
- Group staff in the hosted prototype work as on Chatango.

## [0.15.2] - 2026-10-24

### Changed

- Groups and private conversations scroll the same way.

## [0.15.1] - 2026-10-24

### Added

- Automatic reconnection, up to three times.
- A Reconnect button when private messages disconnect.

### Changed

- Closed connections reconnect when you come back to the page.

## [0.15.0] - 2026-10-24

### Added

- A banner when vissle reports your private messages are restricted.

## [0.14.2] - 2026-10-24

### Added

- A diagnostics log of connection events, kept in this browser.

## [0.14.1] - 2026-10-24

### Fixed

- Media linked over http show again.

## [0.14.0] - 2026-10-24

### Added

- What's new lists the changes in each version.

### Changed

- Who is this shows linked accounts as cards.
- The friends list is split into Online and Offline.

## [0.13.0] - 2026-10-24

### Fixed

- Conversations stay at the bottom while content loads.
- Reading position holds in all browsers.
- Profile dialogs open at the top.

## [0.12.0] - 2026-10-23

### Added

- Edit and quote group messages, and jump to the message a reply answers.
- Mention a member by clicking their name or with Tab.
- Recent mentions from all groups in one list.
- Chatango emoticons and an emoticon picker.
- Embedded video, audio and YouTube links.
- File sending and the media library.
- A character counter.
- Optional Markdown formatting.
- Premium message backgrounds.
- Hide guests, announcements, channels or a member's style.
- Role and channel in compact mode.
- Named guests in the member list.
- Owned and recently visited groups in the list.
- Profile links, avatars and names open profiles.
- Older private messages, search, export, import and removal.
- A private message actions menu.
- The Density setting applies to private messages.
- Private message restriction status and non-friend presence.
- More places to open a profile.
- Confirmation before removing a friend.
- Full profile editing and the vissle tracker option.
- Who is this shows linked accounts.
- A paged, searchable ban list.
- IP addresses for staff allowed to see them.
- Trusted sites for links and media.
- BetterChatango sound settings.

### Changed

- Unread counts are consistent and only on navigation items.
- Actions, loading and empty states are consistent everywhere.

### Removed

- The Requests tab, the Language page and an ineffective Privacy banner.

### Fixed

- Private message unread counts survive a reload.
- Editing a private message replaces the original.
- Received messages keep their formatting.
- Typed commands run.
- Deleting a group message asks for confirmation.
- Sounds for private messages outside the open conversation.
- The member list follows sign-ins and sign-outs.
- Ignore list and muted groups follow BetterChatango.
- Announcements keep their formatting when saved.
- A server error no longer shows as an empty full profile.
- Friend actions report whether they worked.
- Notify when online is only offered for friends.
- Ctrl+K no longer lists closed conversations.
- The Groups section hides when all joined groups are favorites.
- Jumping to a message no longer loads every older page.

## [0.11.0] - 2026-10-23

### Added

- Chat and friend rows show idle time or last seen.

### Changed

- Idle starts after three minutes without activity.

## [0.10.0] - 2026-10-22

### Added

- Older group messages.
- Favorites follow BetterChatango.
- BetterChatango startup settings.
- Full profiles show the member's colors and background.
- Media in announcements.
- Members' font sizes.
- Swipe actions and pull to refresh on touch screens.
- Fonts built in, with no call to Google Fonts.

### Changed

- BetterChatango errors show as notifications.
- Joins, leaves and presence no longer show in the conversation.
- Fewer notifications.
- Private message notifications preview up to three lines.

### Removed

- The private messages startup switch, which did nothing.

### Fixed

- History loading after a failure and at the history limit.
- Scroll position when older messages load.
- Channel, description and members on mobile.
- Friend add errors are reported.
- Unsaved favorites are reported.
- Notify when online stays in sync with BetterChatango.
- Escape only closes the top dialog.
- Your style applies even with a late clock.
- A member's newest style wins.
- Sent private message media show once sent.
- Profile backgrounds repeat as set.

## [0.8.1] - 2026-10-22

### Added

- A new interface on top of BetterChatango, with themes, accent color and compact density.
- Sign-in stays on BetterChatango's screen. Nightango never sees your password.
- Groups, moderation and group settings.
- Private messages and friends.
- Your own message style, kept in this browser.
- Meet people, profiles, visitors and group creation.
- Media wait for a click when your settings ask for it.
