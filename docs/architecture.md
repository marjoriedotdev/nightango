# Architecture

Torch Skin est une seule application React 18 écrite en JavaScript ES5, sans JSX ni bundler. Le même code sert deux cibles : le userscript branché sur le client Torch vivant, et un prototype hébergé à données simulées.

## Arborescence

```
src/
  core/       socle partagé, évalué en premier
    globals.js       alias React, wrapper T (avatars live), hooks
    util.js          APP_VERSION, temps, stockage local, copie
    colors.js        couleurs et contraste, polices, canaux
    roles.js         permissions, rôles, réglages de groupe par défaut
    sample-data.js   données d'exemple du prototype, visites simulées
    prefs.js         préférences par défaut
    ui.js            contexte React, Portal (calque #layer), MenuButton, Dialog, ConfirmDialog, Toasts,
                     Person (avatar et nom qui ouvrent le profil), badges de rôle et « You », présence des listes
    rich-text.js     MessageText, RichText (mini profil assaini), fullProfileDoc
    selectors.js     lecture de l'état : rôles, utilisateur, thème, compteurs
  bridge/     le pont vers Torch
    live-model.js    LIVE, avatarSrc, pagination vissle, bits Chatango (GROUP_FLAG, PERM_FLAG, CHANNEL_FLAG), modèles live
    live-parse.js    fonctions pures du pont : contenu des messages (parseContent, médias), trames de groupe,
                     fond Premium (parseMiniCss), présence, horodatages, références de message
    live-bridge.js   liveBridge : trames entrantes et sortantes, avertissements, connexions,
                     profils, recherche, historique privé, vissle, création de groupe
  views/      écrans principaux
    login, shell (barre latérale), group, message (ligne et médias),
    members (liste, fiche profil, bannissement, lien externe), dm (Chats, Friends),
    meet (Meet people), profile (profil complet, panneau), new-dm, message-style (style perso),
    commands (/join, /leave, /chat et /help des composeurs),
    discover, palette (Ctrl K), live-joined, session (fenêtre de session coupée)
  settings/   réglages
    shell, profile (Visitors compris), appearance, notifications, privacy (et Safety, compte),
    language-a11y-about, premium
    group-view, group-pages, group-staff                                réglages de groupe du prototype
    live-group-view, live-group-pages, live-group-staff, live-account   variantes live
  app/        racine
    sound.js
    state.js         préférences persistées
    root.js          Root : état, actions, actions live, handleLiveOp
    start.js         montage
  loader/
    skin-loader.js   userscript côté bac à sable : en-tête et @version, garde page d'accueil,
                     injection du code page, pont vissle (GM_xmlhttpRequest)
    skin-page.js     code page : anti double démarrage, démarre Torch, charge React (SRI),
                     attend Torch, monte le Shadow DOM
  styles/
    app.css          styles de l'application
    login.css        habillage de l'écran de login de Torch, posé par skin-page.js
scripts/
  build.mjs          build Node (concaténation, assemblage des userscripts, minification esbuild)
  ds-components.mjs  régénère README.md et preview.html des composants du design system
tests/               suites jsdom et lanceur run.mjs
torchds/project/     design system : tokens, components/bundle.js (namespace window.Torch), CSS, types
torch/project/       canevas de maquettes (11 écrans)
dist/                sorties du build, non versionnées
```

`bridge/live-parse.js` ne contient que des fonctions qui ne lisent ni le client Torch, ni `emit`, ni aucune variable de la closure du pont. Une fonction qui dépend de cette closure reste dans `bridge/live-bridge.js`. Le reste du pont (une IIFE) et `app/root.js` (le composant `Root`) restent d'un seul tenant : leurs parties partagent une closure, les découper demande une vraie refonte.

## Concaténation

`scripts/build.mjs` concatène les fichiers de `src/` dans une IIFE unique, dans l'ordre de `APP_SOURCES`. C'est le seul endroit qui déclare cette liste. Tous les fichiers partagent donc une portée : un nouveau fichier s'ajoute à `APP_SOURCES`, à sa place dans l'ordre.

`bridge/live-parse.js` se place juste avant `bridge/live-bridge.js`, après `bridge/live-model.js` dont il lit `FONT_FACES`. Ses fonctions deviennent des noms de la portée unique, partagés avec tous les fichiers : un nom qui en double un autre remplace le premier sans erreur.

Le build refuse un code applicatif ou un bundle qui contient `</script`, et une feuille du userscript qui vise encore `:root` ou `html,body{`.

## Userscript en deux contextes

Tampermonkey exécute `skin-loader.js` dans un bac à sable qui ne voit ni Torch ni React. Le userscript se découpe donc en deux contextes ([ADR-0003](adr/0003-two-context-loader.md)).

```
Bac à sable Tampermonkey (skin-loader.js)        Page st.chatango.com
  garde : page d'accueil seulement      ---->     <script> inline (code page en littéral JSON)
  pont vissle (GM_xmlhttpRequest)                   skin-page.js : Torch, React, Shadow DOM
        ^                                           application (bundle + src/)
        |  CustomEvent torch-skin:vissle-request          |
        +--------------------------------------------------+
           CustomEvent torch-skin:vissle-response
```

- En-tête : `@match https://st.chatango.com/*`, `@noframes`, `@grant GM_xmlhttpRequest`, `@grant unsafeWindow`, `@connect vissle.me`, `@run-at document-idle`.
- Le loader s'arrête hors de la page d'accueil (`window.top !== window` ou `pathname !== '/'`) : st.chatango.com sert aussi les fenêtres de discussion intégrées aux autres sites.
- Le code page est injecté par un `<script>` dont le `textContent` est un littéral de chaîne JSON limité à l'ASCII. Il n'est jamais analysé comme HTML.
- Seul le pont vissle tourne dans le bac à sable. Il lit le profil interrogé dans `unsafeWindow.__torchRefs.client.user.name` et ignore celui que la page demanderait ([ADR-0005](adr/0005-visitors-own-profile-only.md)).
- `skin-page.js` se protège d'un double démarrage (`window.__TORCH_SKIN__`), ajoute le script de démarrage de Torch, charge React et ReactDOM depuis cdnjs avec SRI, attend les objets globaux de Torch, puis monte l'interface.
- Si le démarrage échoue, le client Torch d'origine reste en place.

## Montage et affichage

- L'hôte `#torch-skin` est créé après le démarrage de Torch, qui reconstruit sa page. Il porte un Shadow DOM ouvert qui contient la feuille de l'application et le point de montage `#app`.
- La feuille de l'application est adaptée au Shadow DOM par le build : `:root` devient `:host`, et les classes globales (`reduce-motion`, `underline-links`) passent sur `:host(...)`.
- L'interface reste masquée tant que la session Torch n'est pas ouverte. La connexion se fait sur l'écran de Torch, habillé par `styles/login.css`.
- À la connexion, `window.__TORCH_SHOW__` retire l'habillage du login, masque le reste de la page de Torch et affiche l'hôte.
- Les fenêtres, menus et notifications passent par `Portal`, rendu dans un calque `#layer` voisin de `#app`, pour ne pas déformer la mise en page.
- Les polices de l'interface (Geist, Geist Mono) sont embarquées : fichiers woff2 du sous-ensemble latin dans `torchds/project/fonts/`, sous SIL OFL 1.1 (`OFL.txt`). Le build les encode en `data:` base64 dans les `@font-face` de `fonts.css`. `skin-page.js` pose ces `@font-face` dans une `<style id="torch-skin-fonts">` de `document.head`, avec l'habillage du login puis au montage : Chrome ignore un `@font-face` déclaré seulement dans le shadow root. Le prototype hébergé reçoit les mêmes `@font-face` dans sa feuille. Les aperçus du design system et les maquettes lient `fonts.css`. Aucune requête de police externe.

## Mode live et mode prototype

- `LIVE = !!window.__TORCH_LIVE__` (`bridge/live-model.js`). `skin-page.js` pose le drapeau, le prototype hébergé ne le pose pas.
- Les écarts entre les deux modes sont gardés par `if (LIVE)`.
- En live, les actions de `app/root.js` sont surchargées par celles du bloc « Mode live ». Le pont (`liveBridge`) traduit les trames de Torch en opérations, que `handleLiveOp` applique à l'état.
- Les sons de Torch Skin sont coupés en live : Torch joue déjà les siens.

## État React

- `Root` (`app/root.js`) tient tout l'état de l'application. `update(fn)` clone l'état par `JSON.parse(JSON.stringify(prev))`, applique `fn` au clone, puis le remplace. L'état doit donc rester sérialisable en JSON.
- Les préférences sont persistées dans `localStorage` sous `torch-prototype-prefs` (`app/state.js`).
- Les données propres au compte sont persistées sous `torch-skin:<pseudo>` : conversations fermées (`hidden`) et style perso (`style`). En live, les favoris, les sourdines de groupe et les membres ignorés sont ceux de Torch (`docs/torch-protocol.md`, Réglages de démarrage de Torch). Le prototype garde les siens dans son état.
- Les profils lus (mini profil, fond Premium dans `u.miniStyle`) sont mis en cache avec l'utilisateur.

## Contenu des membres

- Mini profil : `RichText` reconstruit une liste blanche de balises en éléments React. Le mode `inline` (cartes Meet) ignore blocs, liens, images, taille et alignement.
- Profil complet : `fullProfileDoc` produit un document isolé dans une `iframe` `sandbox`, avec une CSP et `referrer` `no-referrer` en `<meta>`. Sous `styles.profileBackgrounds`, son `<style>` reprend le fond Premium choisi par `miniStyleOf` (couleurs hex, image `https` avec sa répétition si les médias sont autorisés), chaque valeur vérifiée avant d'être écrite.
- Fond Premium : couleurs tirées de `custom_profile.css` par `parseMiniCss`, contraste garanti. Dans la fenêtre de profil, `miniSkin` applique le fond, le texte et les jetons de couleur du thème (texte secondaire à 4,5:1, bordures, survols) à toute la fenêtre. L'image est une `<img>` en `referrerPolicy="no-referrer"`, en couverture de 120 px (`object-fit: cover`) derrière l'avatar, fondue vers la couleur de fond. Le panneau de profil des MP garde le fond sur le seul bloc de texte, avec l'image en bandeau au-dessus. Les cartes Meet n'affichent que la couleur. L'image du fond Premium suit les réglages de médias et `styles.profileBackgrounds`.
- Photo de profil : l'avatar de la fenêtre de profil, une fois sa miniature chargée, ouvre une visionneuse plein écran de `full.jpg` en `<img>` `no-referrer`, avec repli sur la miniature.
- Médias des messages : rien n'est chargé avant le clic quand `embedImages`, `embedVideos` ou `proxyMedia` le demandent.

Voir [ADR-0004](adr/0004-member-html-never-injected.md).

## Design system

- `torchds/project/` contient les jetons (`tokens.json`), les composants (`components/bundle.js`, namespace `window.Torch`, et `bundle.css`), leurs types (`index.d.ts`), les polices embarquées (`fonts/`) et la charte (`README.md`).
- `components/bundle.js` et `bundle.css` sont maintenus à la main. Le `README.md` et le `preview.html` de chaque composant sont générés par `pnpm build:ds`.
- Le build produit la feuille des jetons depuis `tokens.json` : thème sombre par défaut, thème clair par préférence système ou par choix explicite.
- `torch/project/` contient les maquettes (11 écrans) et leur canevas.

## Sorties du build

- `dist/torch-skin.min.user.js` : le livrable. Même assemblage que la version lisible, avec la transformation esbuild (`transform`, cible ES5, `minify`) appliquée au code page, au code du loader et aux deux feuilles. L'en-tête `==UserScript==` est recopié tel quel, sans source map ([ADR-0008](adr/0008-separate-minified-output.md)).
- `dist/torch-skin.user.js` : version lisible, pour le débogage et l'audit.
- `dist/torch-client.html` et `dist/app.js` : prototype hébergé.

Les deux userscripts sortent de la même fonction `userscript()`, qui décrit les étapes d'assemblage une seule fois. esbuild ne sert qu'à la minification : la concaténation reste celle de `build.mjs`.

## Tests

Suites jsdom dans `tests/`, lancées par `tests/run.mjs` après le build :

- `smoke` : prototype hébergé, chargé depuis `dist/torch-client.html`.
- `live_ui` : mode live avec un faux client Torch, sur `dist/app.js` et le bundle du design system. Il enregistre chaque trame envoyée et vérifie son format exact.
- `loader` : userscript, démarrage de Torch, pages ignorées, double démarrage, feuille de login, pont vissle. Jouée sur `dist/torch-skin.user.js` puis sur `dist/torch-skin.min.user.js`. C'est la seule suite qui exécute les userscripts.
- `live_login` : détection de connexion, sur la concaténation des sources de `src/bridge/`.
- `avatar` : avatars, sur le bundle du design system et les sources de `src/bridge/`.
- `check_ds` : rendu des aperçus du design system, sur `torchds/project/components/bundle.js`.

Politique de tests : [ADR-0009](adr/0009-test-only-complex-behaviour.md) et `docs/coding-conventions.md`.

## Intégration continue

- `.github/workflows/ci.yml`, job `test` : `pnpm install --frozen-lockfile` puis `pnpm test` sur chaque push et pull request vers `main`.
- Même workflow, job `release` : sur un push vers `main`, après `test`. Il lit le `@version` de `src/loader/skin-loader.js`, puis, si la release `v` suivi de ce numéro n'existe pas encore, il refait `pnpm build` et crée le tag sur le commit testé et la release GitHub avec les deux userscripts attachés. Sinon il ne publie rien. Les publications passent une par une (`concurrency: release`).
- Les actions sont épinglées sur le SHA complet du commit de leur release, la version en commentaire. pnpm vient du champ `packageManager` de `package.json`.

## Copie de référence de Torch

`reference/torch/` contient le code de Torch tel que servi par vissle.me le 2026-10-19, en lecture seule. Ni `scripts/build.mjs` ni les tests ne la lisent : le build ne prend que les fichiers listés dans `APP_SOURCES` et `torchds/project/`.

## Artefacts publiés

Sur le compte claude.ai de l'utilisateur :

- Maquettes (Design) : https://claude.ai/artifact/JuDrFE7mapqwAzCDjcFeFQ
- Design system : https://claude.ai/artifact/ATzDF31PsVNFEYWmUWA3GW
- Prototype hébergé (données simulées) : https://claude.ai/artifact/D2Em5urvHC1FCpcmMmWHgH

Une session peut les mettre à jour en passant leur adresse au publish, après les avoir relus.
