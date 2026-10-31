# Nightango

![A Nightango group chat on desktop and on a phone](docs/readme/hero.webp)

Nightango is a Tampermonkey userscript for [st.chatango.com](https://st.chatango.com/). It starts [BetterChatango](https://vissle.me), a third-party Chatango client, and replaces its interface with another one: group chats, private messages, profiles, moderation and Meet people, on desktop and on phones.

> [!IMPORTANT]
> Nightango is an independent project. It is not affiliated with, endorsed by or sponsored by BetterChatango or Chatango.

> [!WARNING]
> Nearly all of Nightango's code was written by an AI coding agent. It runs with your Chatango session and sends what you do in it to Chatango, like any client. It comes with no warranty: use it at your own risk.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Download `nightango.min.user.js` and `SHA256SUMS` from the [latest release](https://github.com/marjoriedotdev/nightango/releases/latest).
3. Check the file, as shown in [Check the download](#check-the-download).
4. In Tampermonkey, create a new script and replace its content with the file. Save.
5. Open https://st.chatango.com/ and sign in on the BetterChatango screen. Nightango appears once the session is open.

To update, check the new release the same way, then paste it over the same script. Settings > What's new lists the changes of each version.

### Check the download

`SHA256SUMS` lists the SHA-256 checksum of both userscripts of the release, taken from the files the CI tested before publishing them. In the folder where you saved the file, compute the checksum of your copy:

- macOS: `shasum -a 256 nightango.min.user.js`
- Linux: `sha256sum nightango.min.user.js`
- Windows, in PowerShell: `Get-FileHash nightango.min.user.js`

Compare the result with the `nightango.min.user.js` line of `SHA256SUMS`. PowerShell prints it in capital letters: apart from the case, the two values must be the same. If they differ, don't install the file: download it again from the release page.

A matching checksum tells you that your copy is the file the release published, the one the CI tested. The checksum comes from the same release, so it can't vouch for the release itself.

## Preview

![Group chat in the dark and light themes](docs/readme/themes.webp)

![Group chat, group info and friends list on a phone](docs/readme/mobile.webp)

![A Premium member's profile card](docs/readme/profile.webp)

![The navigation in the six accent colors](docs/readme/customisation.webp)

## Privacy

- Nightango never reads, stores, logs or sends your password. Sign-in happens on BetterChatango's screen.
- Using Nightango means trusting vissle.me with your Chatango account: Nightango loads BetterChatango from vissle.me as published there, and BetterChatango handles the sign-in and keeps your credentials on its servers.
- Every HTTP call Nightango makes is listed in [docs/betterchatango-protocol.md](docs/betterchatango-protocol.md#allowed-http-calls). Nothing outside that list is called.
- Every Chatango frame it sends comes from BetterChatango's code or a reference library.
- Member HTML is rebuilt from an allow list, never injected.
- Profile backgrounds and full-size profile pictures load without a referrer. Message backgrounds load with the page referrer, from Chatango only.
- Fonts ship inside the userscript.
- The diagnostic journal (Settings > Diagnostics) stays in the browser, one log per account, and never records frame contents or what you send.

## Support

For any question or problem, send a private message to [marjorie](https://marjorie.chatango.com) on Chatango.

## Development

Requires pnpm and Node.js 24, the version the CI uses (`engines` in `package.json`).

```
pnpm install
pnpm build            # writes dist/
pnpm test             # build, then every jsdom suite
pnpm test live_ui     # build, then one suite
```

`pnpm build` writes:
- `dist/nightango.min.user.js`: the userscript to install.
- `dist/nightango.user.js`: the same script, readable.
- `dist/nightango.html` and `dist/app.js`: a prototype with simulated data.

Docs:
- [AGENTS.md](AGENTS.md): project rules, commands, releases
- [GLOSSARY.md](GLOSSARY.md): domain vocabulary
- [docs/architecture.md](docs/architecture.md): code and build layout
- [docs/betterchatango-protocol.md](docs/betterchatango-protocol.md): BetterChatango and the Chatango protocol
- [docs/coding-conventions.md](docs/coding-conventions.md): code and test conventions
- [docs/adr/](docs/adr/): architecture decisions

Bug reports go to the [issue tracker](https://github.com/marjoriedotdev/nightango/issues).

## License

Nightango is released under the [MIT License](LICENSE).

BetterChatango is by Vissle, under the [MIT License](https://github.com/Vissle-Drissle/Torch-Client).

Geist, Geist Mono and Instrument Serif are embedded under the SIL Open Font License 1.1 ([torchds/project/fonts/OFL.txt](torchds/project/fonts/OFL.txt)).
