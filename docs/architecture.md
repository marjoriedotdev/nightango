# Architecture

Torch Skin est une seule application React 18 écrite en JavaScript ES5, sans JSX ni bundler. Le même code sert deux cibles : le userscript branché sur le client Torch vivant, et un prototype hébergé à données simulées.

## Arborescence

```
src/
  core/       socle partagé, évalué en premier
    globals.js       alias React, wrapper T (avatars live), hooks
    util.js          temps, stockage local, copie, lecture d'un fichier JSON, téléchargement d'un fichier JSON
    colors.js        couleurs et contraste, polices, canaux
    roles.js         permissions, rôles (owner, admin, mod), bits de droits Chatango (PERM_FLAG), droits par défaut d'un rôle, réglages de groupe par défaut
    sample-data.js   données d'exemple du prototype, visites simulées, médiathèque d'exemple en mémoire
    prefs.js         préférences par défaut
    ui.js            contexte React, Portal (calque #layer), useFloating (calque ancré à son déclencheur), MenuButton, Dialog, ConfirmDialog, Toasts, JsonFileButton,
                     Person (avatar et nom qui ouvrent le profil), badges de rôle et « You », présence des listes,
                     useRightColumn (seul seuil de 1180 px : colonne de droite au-dessus, plein écran en dessous)
    rich-text.js     MessageText (emphase, citations, mentions, liens), hôtes de confiance (isTrustedUrl), RichText (mini profil assaini), fullProfileDoc
    selectors.js     lecture de l'état : rôles, droits d'un membre dans un groupe (groupRights, canBanMember), utilisateur, thème, compteurs, conversations listées, message affiché d'une entrée de l'historique privé
  bridge/     le pont vers Torch
    live-model.js    LIVE, JOURNAL, avatarSrc (et version des photos de son compte), pagination vissle, bits Chatango (GROUP_FLAG, CHANNEL_FLAG, MSG_FLAG),
                     table des émoticônes (EMOTICONS)
    live-parse.js    fonctions pures du pont : contenu des messages (parseContent, médias), trames de groupe,
                     fond Premium (parseMiniCss, formulaire de fond), réponse de updateprofile, fond de message (parseMsgBg), comptes liés (parseWho), présence, horodatages,
                     références de message, enregistrements de l'historique privé (lecture, tri d'un import),
                     entrées de la médiathèque (validation, ordre des pages, tri d'un import)
    live-bridge.js   liveBridge : trames entrantes et sortantes, avertissements, connexions,
                     profils, recherche, historique privé, médiathèque, vissle, création de groupe
  views/      écrans principaux
    login, shell (barre latérale), group, message (ligne, médias),
    message-log (fil de groupe et de MP : suivi du bas, lecture gardée en place, pages plus anciennes, saut vers un message),
    members (liste, fiche profil, comptes liés, bannissement, lien externe, lien de profil), dm (Chats et recherche dans les MP, Friends),
    meet (Meet people), mentions (mentions récentes de tous les groupes, ligne d'un message hors de son fil),
    profile (résumé commun à la fiche et au panneau, profil complet, panneau), new-dm, message-style (style perso),
    emoji-picker (sélecteur d'émoticônes et de médias des composeurs), attach (envoi de fichier des composeurs),
    media (médiathèque de Torch : onglet Media, étoile des images de message, complétion :nom),
    commands (/join, /leave, /chat et /help des composeurs),
    discover, palette (Ctrl K), live-joined, session (fenêtre de session coupée)
  settings/   réglages
    shell, profile (Visitors et tracker vissle compris), appearance, notifications, privacy (et Safety, compte),
    language-a11y-about (et Diagnostics), premium
    group-view, group-pages                                             réglages de groupe du prototype
    group-staff                                                         pages Staff and roles, Members et Invites, communes au live et au prototype
    avatar-crop                                                         recadrage de sa photo de profil (live)
    live-group-view, live-group-pages, live-group-staff, live-account   variantes live
  app/        racine
    sound.js
    state.js         préférences persistées
    live-state.js    état live construit pour Root : monde au login, groupe, listes de bannissements, session coupée
    pm.js            MP : réception, fusion de l'historique privé, non-lus lus dans l'archive (base de Torch, ou mémoire dans le prototype et sans base)
    root.js          Root : état, actions, actions live, handleLiveOp
    start.js         montage
  loader/
    skin-loader.js   userscript côté bac à sable : en-tête et @version, garde page d'accueil,
                     injection du code page, pont vissle (GM_xmlhttpRequest)
    skin-page.js     code page : anti double démarrage, démarre Torch, charge React (SRI),
                     attend Torch, monte le Shadow DOM
    skin-journal.js  journal de diagnostic, inséré par le build en tête du code page (ADR-0011)
  styles/
    app.css          styles de l'application
scripts/
  build.mjs          build Node (concaténation, assemblage des userscripts, minification esbuild)
  ds-components.mjs  régénère README.md et preview.html des composants du design system
tests/               suites jsdom et lanceur run.mjs
torchds/project/     design system : tokens, components/bundle.js (namespace window.Torch), CSS, types
torch/project/       canevas de maquettes (11 écrans)
dist/                sorties du build, non versionnées
```

`bridge/live-parse.js` ne contient que des fonctions qui ne lisent ni le client Torch, ni `emit`, ni aucune variable de la closure du pont. Une fonction qui dépend de cette closure reste dans `bridge/live-bridge.js`. Le pont garde les étapes propres à Torch : l'attente des réponses de Chatango et leurs délais, la demande d'annonce et la lecture des infos d'un groupe après `inited`, le son de mention d'un MP, les identifiants provisoires `k:` des messages. Il n'émet vers `Root` que des faits. `Root` (`app/root.js`) les applique à l'état, avec `app/pm.js` pour les MP et `app/live-state.js` pour l'état live qu'il construit.

## Concaténation

`scripts/build.mjs` concatène les fichiers de `src/` dans une IIFE unique, dans l'ordre de `APP_SOURCES`. C'est le seul endroit qui déclare cette liste. Tous les fichiers partagent donc une portée : un nouveau fichier s'ajoute à `APP_SOURCES`, à sa place dans l'ordre.

Le build ouvre l'IIFE sur deux noms : `APP_VERSION`, le `@version` de `src/loader/skin-loader.js`, et `RELEASE_NOTES`, les sections de `CHANGELOG.md` lues au format Keep a Changelog (`{ version, date, groups: [{ title, items }] }`, la plus récente d'abord). Le prototype et le userscript reçoivent donc la même version et les mêmes notes. Le build refuse un `CHANGELOG.md` mal formé ou dont la première section n'est pas celle du `@version`.

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
- `skin-page.js` se protège d'un double démarrage (`window.__TORCH_SKIN__`), pose le journal de diagnostic (`skin-journal.js`, à la place de `/*JOURNAL*/`) avant tout socket de Torch, ajoute le script de démarrage de Torch, charge React et ReactDOM depuis cdnjs avec SRI, attend les objets globaux de Torch, puis monte l'interface.
- Si le démarrage échoue, le client Torch d'origine reste en place.

## Journal de diagnostic

- `skin-journal.js` enveloppe le constructeur `WebSocket` et la console, écoute la vie de la page et les erreurs, et garde les 1 000 derniers événements dans `localStorage` sous `torch-skin:journal`. Ce qu'il garde et ne garde jamais : [ADR-0011](adr/0011-diagnostic-journal.md).
- L'application le lit par `JOURNAL` (`bridge/live-model.js`, `window.__TORCH_JOURNAL__`), `null` dans le prototype et dans les suites qui ne chargent que le pont. Le pont y note ses connexions et les avertissements de Torch. La page Diagnostics, listée seulement si `JOURNAL` existe, le montre, le copie, le télécharge et l'efface.

## Montage et affichage

- L'hôte `#torch-skin` est créé après le démarrage de Torch, qui reconstruit sa page. Il porte un Shadow DOM ouvert qui contient la feuille de l'application et le point de montage `#app`.
- La feuille de l'application est adaptée au Shadow DOM par le build : `:root` devient `:host`, et les classes globales (`reduce-motion`, `underline-links`) passent sur `:host(...)`.
- L'interface reste masquée tant que la session Torch n'est pas ouverte. La connexion se fait sur l'écran de Torch, laissé tel quel.
- À la connexion, `window.__TORCH_SHOW__` masque le reste de la page de Torch et affiche l'hôte.
- Les fenêtres, menus et notifications passent par `Portal`, rendu dans un calque `#layer` voisin de `#app`, pour ne pas déformer la mise en page.
- Les polices de l'interface (Geist, Geist Mono) sont embarquées : fichiers woff2 du sous-ensemble latin dans `torchds/project/fonts/`, sous SIL OFL 1.1 (`OFL.txt`). Le build les encode en `data:` base64 dans les `@font-face` de `fonts.css`. `skin-page.js` pose ces `@font-face` dans une `<style id="torch-skin-fonts">` de `document.head`, avec l'habillage du login puis au montage : Chrome ignore un `@font-face` déclaré seulement dans le shadow root. Le prototype hébergé reçoit les mêmes `@font-face` dans sa feuille. Les aperçus du design system et les maquettes lient `fonts.css`. Aucune requête de police externe.

## Mode live et mode prototype

- `LIVE = !!window.__TORCH_LIVE__` (`bridge/live-model.js`). `skin-page.js` pose le drapeau, le prototype hébergé ne le pose pas.
- Les écarts entre les deux modes sont gardés par `if (LIVE)`.
- Les droits dans un groupe suivent le modèle de Chatango dans les deux modes : un propriétaire et des modérateurs avec leurs bits de droits (`settings.staff`, `settings.modFlags`), lus par `groupRights`. Le prototype n'a aucun rôle que Chatango n'a pas.
- En live, les actions de `app/root.js` sont surchargées par celles du bloc « Mode live ». Le pont (`liveBridge`) traduit les trames de Torch en opérations, que `handleLiveOp` applique à l'état.
- Les sons de Torch Skin sont coupés en live : Torch joue déjà les siens. Le pont lui fait seulement jouer son son de mention pour un MP hors de la conversation ouverte (`docs/torch-protocol.md`, Ce qui reste dans Torch).

## État React

- `Root` (`app/root.js`) tient tout l'état de l'application. `update(fn)` clone l'état par `JSON.parse(JSON.stringify(prev))`, applique `fn` au clone, puis le remplace. L'état doit donc rester sérialisable en JSON.
- Les préférences sont persistées dans `localStorage` sous `torch-prototype-prefs` (`app/state.js`). En live, celles de `TORCH_PREFS` (`core/prefs.js` : messages d'invités, annonces) sont des réglages de Torch : relues dans ses réglages à la connexion, et `usePref().sw` ne les bascule qu'une fois écrites chez lui. Les hôtes de confiance (`safety.trustedHosts`) suivent la même règle : en live, c'est la liste de Torch, relue à la connexion (`null` si illisible) et changée par `actions.setTrustedHost` une fois écrite chez lui.
- Les données propres au compte sont persistées sous `torch-skin:<pseudo>` : conversations fermées (`hidden`), canaux masqués de chaque groupe (`channels`), membres au style coupé (`unstyled`) et style perso (`style`). Le pont y pose aussi le drapeau de migration des non-lus (`pmReadMigrated`, `docs/torch-protocol.md`, Historique privé) : `Root` fusionne ses écritures avec le contenu stocké pour le garder. En live, les favoris, les sourdines de groupe et les membres ignorés sont ceux de Torch (`docs/torch-protocol.md`, Réglages de démarrage de Torch). Le prototype garde les siens dans son état.
- Les non-lus des MP viennent de l'archive (`app/pm.js`) : la base d'historique de Torch en live, une archive en mémoire dans le prototype ou quand cette base manque. `unread` d'une conversation n'en est qu'une copie, que seul `app/pm.js` écrit ([ADR-0012](adr/0012-pm-unread-from-history.md)).
- Les profils lus (mini profil, fond Premium dans `u.miniStyle`) et les fonds de message (`u.msgBg`) sont mis en cache avec l'utilisateur.
- La médiathèque de Torch reste hors de l'état : l'onglet Media, les étoiles et la complétion la lisent par les actions de `Root`, en live dans la base `favorite_media` de Torch (pont), en prototype dans la médiathèque d'exemple (`sampleMedia`). Chaque écriture augmente `mediaRev`, qui les fait relire (`docs/torch-protocol.md`, Médiathèque).
- La page Mentions lit `mentionLog` : les 100 derniers messages de groupe, en direct ou d'historique, qui mentionnent l'utilisateur, le plus récent en tête. La liste vit dans l'état seulement et repart vide à chaque chargement de la page.

## Contenu des membres

- Messages : `parseContent` garde le texte brut dans `text`, sans les marqueurs d'une paire `▓…▒`, et découpe le corps en segments marqués (`parts`) selon la liste blanche de Torch : `b`, `i` sans attribut, `u`, `s`, `strike` et les paires `▓…▒`. `MessageText` les reconstruit en éléments `b`, `i`, `u`, `s`, quel que soit le réglage « Fonts and text colors ». Toute autre balise est retirée.
- Citations : dans chaque segment, `MessageText` reconnaît `` @nom: `texte` `` comme le rendu de Torch (`docs/torch-protocol.md`, Envoi) et la reconstruit en éléments React, le nom en mention et le texte cité à part.
- Émoticônes : `parseContent` remplace une balise `<i s="sm://{nom}"/>` par l'emoji système que la table `EMOTICONS` associe au nom, dans `text` comme dans `parts`. Du membre, seul le nom est gardé et comparé à la table (`docs/torch-protocol.md`, Émoticônes).
- Mini profil : `RichText` reconstruit une liste blanche de balises en éléments React. Le mode `inline` (cartes Meet) ignore blocs, liens, images, taille et alignement.
- Profil complet : `fullProfileDoc` produit un document isolé dans une `iframe` `sandbox`, avec une CSP et `referrer` `no-referrer` en `<meta>`. Le cadre est le composant `FullProfileFrame`, partagé par la fenêtre de profil complet et l'aperçu de la page Profile, avec `useFullProfileMedia` pour le bouton « Load images ». Sous `styles.profileBackgrounds`, son `<style>` reprend le fond Premium choisi par `miniStyleOf` (couleurs hex, image `https` avec sa répétition si les médias sont autorisés), chaque valeur vérifiée avant d'être écrite.
- Fond Premium : couleurs tirées de `custom_profile.css` par `parseMiniCss`, contraste garanti. Dans la fenêtre de profil, `miniSkin` applique le fond, le texte et les jetons de couleur du thème (texte secondaire à 4,5:1, bordures, survols) à toute la fenêtre. L'image est une `<img>` en `referrerPolicy="no-referrer"`, en couverture de 120 px (`object-fit: cover`) derrière l'avatar, fondue vers la couleur de fond. Le panneau de profil des MP garde le fond sur le seul bloc de texte, avec l'image en bandeau au-dessus. Les cartes Meet n'affichent que la couleur. L'image du fond Premium suit les réglages de médias, les hôtes de confiance (`waitsForClick`) et `styles.profileBackgrounds`.
- Fond de message : sous `styles.backgrounds`, la couleur tirée de `msgbg.xml` par `parseMsgBg` colore la ligne d'un message de groupe marqué `bg`, texte et nom à 4,5:1. L'image `msgbg.jpg` est une `<img>` `no-referrer` derrière le texte (emplacement `background` de `T.Message`), à sa taille naturelle, placée selon l'alignement du membre, seulement si `embedImages` est actif et `proxyMedia` coupé.
- Style coupé : « Hide style », dans le menu d'un message ou les actions sur une personne, marque le membre `unstyled`. `memberStyles` rend alors ses lignes, en groupe et en MP, comme si `styles.names`, `styles.fonts` et `styles.backgrounds` étaient coupés pour lui seul, sans lire son fond de message, et `MessageText` retire son gras, son italique et son souligné, le barré restant. Référence : `/style nom` de Torch (`inject.js:7308-7350`), qui ne touche que les messages déjà affichés et ne garde rien au rechargement.
- Photo de profil : l'avatar de la fenêtre et du panneau de profil, une fois sa miniature chargée, ouvre une visionneuse plein écran de `full.jpg` en `<img>` `no-referrer`, avec repli sur la miniature.
- Médias des membres : rien n'est chargé avant le clic quand `embedImages`, `embedVideos` ou `proxyMedia` le demandent. Un seul test, `waitsForClick` (`core/rich-text.js`), décide qu'un média attend le clic : jamais pour une URL d'un hôte de confiance (`isTrustedUrl`), sinon toujours pour un fichier vidéo ou audio, et sous `proxyMedia` pour une image, la miniature YouTube, une vignette de la médiathèque, une image du mini profil ou l'image du fond Premium. Deux exceptions voulues : l'image du fond de message, toujours sur `ust.chatango.com`, ne suit que `embedImages` et `proxyMedia` (`docs/torch-protocol.md`, Ressources chargées par le loader et l'interface), et le profil complet charge toutes ses images d'un coup par « Load images ». `parseContent` relève aussi les liens YouTube, les images et les fichiers vidéo et audio tapés en texte (`docs/torch-protocol.md`, Médias). Une image affichée porte l'étoile de la médiathèque, « Add to media » ou « Remove from media ».

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
- `loader` : userscript, démarrage de Torch, pages ignorées, double démarrage, feuille de login, pont vissle, journal de diagnostic. Jouée sur `dist/torch-skin.user.js` puis sur `dist/torch-skin.min.user.js`. C'est la seule suite qui exécute les userscripts.
- `pm` : non-lus des MP et fusion de l'historique privé, sur les sources de `src/core/`, `src/bridge/` et `src/app/pm.js`, avec la fausse base d'historique de `tests/fake-pm-db.js`, partagée avec `live_ui`.
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
