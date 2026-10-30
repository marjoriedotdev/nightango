# Nightango

Nightango dresses BetterChatango, a third-party Chatango client, in a rebuilt interface, without changing what BetterChatango sends to Chatango. This glossary fixes the vocabulary of the code, the docs and the issues.

## Products and actors

**Chatango**:
Online chat service (groups, private messages, profiles) that everything relies on.

**BetterChatango**:
Third-party web client for Chatango, published by vissle, that holds the session and the connections. Its code, its screens and its `torch` global keep its internal name, Torch. In interface text, "BetterChatango" only names what BetterChatango does: sign-in, PM history, the media library, its settings.
_Avoid_: Torch, Torch Client (internal name, except to cite its code or its screens)

**vissle**:
Publisher of BetterChatango (vissle.me), which also hosts the profile tracker.

**Nightango**:
This project: a skin for BetterChatango, shipped as a Tampermonkey userscript that starts BetterChatango and then shows a rebuilt interface on top of it, wired to BetterChatango. Display name since 0.18.0. Technical identifiers keep `torch-skin`: userscript namespace, `#torch-skin` host, `__TORCH_*__` globals, bridge events, storage keys, log prefix, deliverable.
_Avoid_: Torch Skin (former name), theme

**Official client**:
Chatango's own web client, used as a source for formats and text.

**Reference library**:
Maintained third-party project that implements the Chatango protocol and serves as the source for a frame: chadango, chatango-lib or ch.py.

## Architecture

**Bridge**:
Layer that translates BetterChatango's frames and objects into operations for the interface, and the interface's actions into calls to BetterChatango.
_Avoid_: adapter, wrapper

**vissle bridge**:
Sandbox relay that queries the vissle tracker on behalf of the page.

**Frame**:
Text message of the Chatango protocol on a connection, with fields separated by `:`.
_Avoid_: command, packet

**Event table**:
BetterChatango table that maps an incoming frame name to its handler, one for groups and one for private messages.

**Private connection**:
Chatango connection that carries PMs, the friend list and presence, separate from group connections.

**Live**:
Mode where the interface is wired to the running BetterChatango client and acts on the real account.

**Prototype**:
Hosted mode where the same interface runs on simulated data.
_Avoid_: demo, mockup

**Sandbox**:
Isolated context where Tampermonkey runs the userscript, with its privileges but without access to BetterChatango.

**Page**:
st.chatango.com context where BetterChatango and the interface live, without the userscript's privileges.

**Loader**:
Part of the userscript that runs in the sandbox and injects the page code.

**Page code**:
Part of the userscript injected into the page, which starts BetterChatango and mounts the interface.

**Not wired**:
State of an interface feature without a sourced frame, shown as unavailable in live.

**Deliverable**:
The minified userscript the user installs in Tampermonkey, with the same file name from one version to the next.

**Design system**:
Nightango's tokens, components and guidelines (torchds, namespace `window.Torch`), from which the interface is built.

## Groups

**Group**:
Public Chatango chat room, identified by its name.
_Avoid_: room, chat room

**Channel**:
Marking on a group message: red, blue, or Staff (reserved for moderators who have the right).

**Announcement**:
Group message republished at a regular interval.

**Moderator**:
Member to whom a group owner gave moderation rights, chosen one by one.
_Avoid_: mod (in prose), staff

**Slow mode**:
Minimum delay enforced between two messages from the same member in a group.
_Avoid_: rate limit (in prose)

**Banned words**:
List of words, partial or whole, refused in a group's messages.

**Ban**:
Block of a member or a guest in a group, made from one of their messages.
_Avoid_: block (reserved for PMs)

## Private messages

**PM**:
Private conversation between two Chatango accounts.
_Avoid_: DM, direct message. The interface says "Chats".

**msgoff**:
PM received while the recipient was offline, delivered once when they reconnect.

**Private history**:
Local copy of PMs that BetterChatango keeps in the browser. Chatango keeps none.

**Closed conversation**:
PM removed from the list with its history kept, which comes back on an incoming PM or when reopened.
_Avoid_: hidden conversation, archived conversation

**Deleted conversation**:
Closed PM whose private history was also erased from this browser.

**Unread**:
Received PM that the user has not read yet, as the private history marks it. A PM edit is not one.

**Friend**:
Account the user follows in their friend list to see its presence.
_Avoid_: contact, watch list

**Block**:
Refusal of an account's PMs, on the private message side.

## Media

**Media library**:
Favorite images that BetterChatango keeps in this browser, shared by all its accounts, inserted into a message by their address. The interface says "Library", a tab of the Media picker, and "media" on the stars ("Add to media").
_Avoid_: favorites (reserved for groups), gallery

**Media picker**:
Layer opened by the Media button of a composer, with the Upload, Library and Memes tabs. It inserts an address or picks the file that leaves with the next message, and never sends on its own.
_Avoid_: attach menu, gallery

**Meme template**:
Blank meme image listed by Imgflip, posted as it is by its link. Nightango adds no caption.
_Avoid_: meme (for the posted image), GIF

**Trusted host**:
Exact host chosen by the user, whose links open without a warning and whose images, videos and audio load without a click. In live, the list is BetterChatango's (`safety.whitelist.domain`). The interface says "Trusted sites".
_Avoid_: trusted domain, whitelist (ambiguous with the domain list that the BetterChatango server sends)

## Presence

**Presence**:
State of an account: online, idle or offline. A connection from the mobile app counts as online.
_Avoid_: status (reserved for the status text)

**Idle**:
Online account whose last sign of activity is several minutes old.
_Avoid_: away, absent

**Last online**:
Moment an offline account was last seen online, shown as "Last online".
_Avoid_: last seen

## Profiles

**Mini profile**:
Short public card of a member: age, gender, location, bio and Premium end date.
_Avoid_: card, profile preview

**Full profile**:
Free-form page of a member, written in HTML, shown isolated.
_Avoid_: big profile, personal page

**ASL**:
Age, gender and location of a member, as the mini profile gives them and as Meet people filters them.

**Premium**:
Paid Chatango subscription, active until an end date published in the mini profile.

**Premium background**:
Colors and background image that a Premium member attaches to their mini profile.
_Avoid_: mini background, profile theme

**Message background**:
Background color and image that a Premium member attaches to their group messages. Nightango shows the color and the image under "Message backgrounds".

**vissle tracker**:
vissle service that the user installs on their profile to log the activity it receives.

**Visitors**:
Section that shows the activity on the signed-in user's profile: visits, likes, dislikes, comments and referrals.
_Avoid_: visits (for the whole section), stats

**Meet people**:
Search for Chatango members filtered by age, gender, photo and presence.
_Avoid_: discovery (reserved for Discover, the list of groups to join)

**Linked accounts**:
Other accounts that vissle matches to an account, sorted by match level (Definite to Weak), using a method that BetterChatango's code does not reveal. Requested on a click on "Who is this", shown to the user only, never kept.
_Avoid_: alts, multi-accounts, duplicate accounts

## Style

**Message style**:
Font, size, text and name colors, bold, italic and underline of a message.

**Account style**:
Message style saved on Chatango for the account.

**Own style**:
Message style chosen in Nightango, kept in this browser only and applied to every message sent. It can also strike through the text, in PMs only.
_Avoid_: local style, message theme

**Hidden style**:
Message style and message background of a member that the user chose to stop showing, in groups as in PMs. Kept with the account data in this browser.
_Avoid_: muted style, blocked style

## Session

**Session loss**:
Loss of the BetterChatango session that blocks the interface: signed in elsewhere, session expired, offline or connection lost.
_Avoid_: disconnection (ambiguous with closing a single group)
