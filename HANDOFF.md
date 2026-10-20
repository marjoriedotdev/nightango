# Passation : Torch Skin

Ce document vit à la racine du dépôt git `torch-skin`. Il donne à une nouvelle session tout le contexte pour reprendre le projet sans rien redécouvrir. Lis-le en entier avant de toucher au code.

## 1. Le projet en deux phrases

**Torch** (vissle.me) est un client web tiers pour Chatango, fonctionnel mais à l'interface datée.

**Torch Skin** est un userscript Tampermonkey qui, sur https://st.chatango.com/ :
1. démarre Torch, comme le favori officiel ;
2. laisse l'utilisateur se connecter sur l'écran de Torch ;
3. affiche ensuite une interface refaite (React 18, dans un Shadow DOM) branchée sur le client Torch vivant.

Version actuelle : **0.8.1**. La 0.6.0 est en usage réel, installée par l'utilisateur dans Tampermonkey.

## 2. Règles non négociables

1. **Le mot de passe n'est jamais lu, stocké, journalisé ni transmis par notre code.**
   - La connexion se fait sur l'écran de Torch.
   - On n'appelle aucune fonction de Torch qui ajoute le mot de passe à une requête. Dans `client.post`, cela exclut toute option `credential`.
   - Les seuls appels HTTP autorisés sont les suivants :
     - `client.post(url, form, {})` ou `client.post(url, form, { cookie: true })` ;
     - les GET publics (`mod1.xml`, `mod2.xml`, `custom_profile.css`) ;
     - la recherche `chatango.com/search` avec `credentials: 'include'`, comme le fait Torch ;
     - `POST https://vissle.me/track1/activity`, via le pont `GM_xmlhttpRequest` du loader, avec `anonymous: true`.
2. **Pas de trame Chatango inventée.** Chaque trame envoyée vient du code de Torch lui-même ou d'une bibliothèque de référence maintenue :
   - chadango (Go) : https://github.com/n0h4rt/chadango
   - chatango-lib (Python) : https://github.com/neokuze/chatango-lib
   - ch.py, plus ancienne : https://github.com/asl97/ch.py

   S'il n'y a pas de source, la fonction reste marquée « not wired » et l'interface le dit honnêtement.
3. **Aucun faux succès en mode live.** Une action qui n'est pas réellement envoyée doit être masquée, ou indiquer clairement qu'elle n'est pas disponible.
4. **Le HTML écrit par les membres (profils) n'est jamais injecté.**
   - Mini profil : reconstruction en éléments React d'une liste blanche de balises (`RichText`, dans `src/core/rich-text.js`).
   - Profil complet : `iframe` `sandbox` sans `allow-scripts` ni `allow-same-origin`, avec une politique CSP en `<meta>` (`fullProfileDoc`).
5. **Pas de nouvelle dépendance sans validation explicite de l'utilisateur.** React 18.3.1 se charge depuis cdnjs avec SRI (empreintes vérifiées contre npm). Dépendances de développement validées : jsdom, react et react-dom (tests), esbuild (minification du userscript).
6. **Visiteurs du profil : uniquement le profil de l'utilisateur connecté.** Torch propose déjà la fonction de façon native : le tracker s'installe par « Add profile tracker », et le panneau « track » l'affiche. La section Visitors l'affiche à nouveau. Le pont du loader ignore tout `profile` envoyé par la page et lit `client.user.name`. Ne jamais ajouter de consultation de l'activité d'un autre profil.

## 3. Préférences de l'utilisateur

- **Langues :**
  - réponses en français ;
  - identifiants de code en anglais ;
  - commentaires en français ;
  - textes d'interface et logs en anglais.
- **Qualité :** niveau production, pas de « vite fait ». Plan court avant tout changement qui touche plus de 2 ou 3 fichiers.
- **Style :**
  - concis, avec le contexte utile sur les choix non évidents ;
  - pas d'emoji, pas d'em-dash, pas de tournures creuses ;
  - pas de résumé final inutile ;
  - pas de fichiers `.md` non demandés.
- **Outils :** pnpm, jamais npm ni yarn. Git sur GitLab auto-hébergé.

## 4. Organisation du code

Tout est en JavaScript ES5 avec des appels `h = React.createElement`, sans JSX ni bundler. Le build concatène les fichiers de `src/` dans une IIFE unique, dans l'ordre de `APP_SOURCES` (`scripts/build.mjs`), seul endroit qui déclare cette liste. Tous les fichiers partagent donc une portée : un nouveau fichier s'ajoute à `APP_SOURCES`, à sa place dans l'ordre.

```
src/
  core/       socle partagé, évalué en premier
    globals.js       alias React, wrapper T (avatars live), hooks
    util.js          APP_VERSION, temps, stockage local, copie
    colors.js        couleurs et contraste, polices, canaux
    roles.js         permissions, rôles, réglages de groupe par défaut
    sample-data.js   données d'exemple du prototype, visites simulées
    prefs.js         préférences par défaut
    ui.js            contexte React, Portal (calque #layer), MenuButton, Dialog, ConfirmDialog, Toasts
    rich-text.js     MessageText, RichText (mini profil assaini), fullProfileDoc
    selectors.js     lecture de l'état : rôles, utilisateur, thème, compteurs
  bridge/     le pont vers Torch
    live-model.js    LIVE, avatarSrc, pagination vissle, bits Chatango (GROUP_FLAG, PERM_FLAG, CHANNEL_FLAG), modèles live
    live-bridge.js   liveBridge : trames entrantes et sortantes, avertissements, connexions, profils, recherche, historique privé, vissle, création de groupe
  views/      écrans principaux
    login, shell (barre latérale), group, message (ligne et médias), members (liste, fiche profil, bannissement, lien externe),
    dm (Chats, Friends), meet (Meet people), profile (profil complet, panneau), new-dm, message-style (style perso), discover, palette (Ctrl K), live-joined,
    session (fenêtre de session coupée)
  settings/   réglages
    shell, profile (Visitors compris), appearance, notifications, privacy (et Safety, compte), language-a11y-about, premium,
    group-view, group-pages, group-staff                         réglages de groupe du prototype
    live-group-view, live-group-pages, live-group-staff, live-account   variantes live
  app/        racine
    sound.js, state.js (préférences persistées), root.js (Root : état, actions, actions live, handleLiveOp), start.js (montage)
  loader/
    skin-loader.js   userscript côté bac à sable Tampermonkey : garde page d'accueil, injection du code page par <script> inline, pont vissle (GM_xmlhttpRequest), @version
    skin-page.js     code page : anti double démarrage, démarre Torch, charge React (SRI), attend Torch, monte le Shadow DOM
  styles/app.css     styles de l'application
  styles/login.css   habillage de l'écran de login de Torch, posé par skin-page.js
scripts/
  build.mjs          build Node : dist/torch-client.html, dist/app.js, dist/torch-skin.user.js, dist/torch-skin.min.user.js
  ds-components.mjs  régénère README.md et preview.html des composants du design system (pnpm build:ds)
  tokenize.py        migration ponctuelle déjà appliquée aux maquettes torch/project (couleurs codées en dur vers variables de thème), hors build
tests/               suites jsdom et lanceur run.mjs
torchds/project/     design system : tokens, components/bundle.js (namespace window.Torch), CSS, types
torch/project/       canevas de maquettes (11 écrans)
dist/                sorties du build, non versionnées
```

`bridge/live-bridge.js` (une IIFE) et `app/root.js` (le composant `Root`) restent d'un seul tenant : leurs parties partagent une closure, les découper demande une vraie refonte.

**Mode live et mode prototype.** `LIVE = !!window.__TORCH_LIVE__`. Le même code sert le prototype hébergé (données simulées) et le userscript. Les écarts sont gardés par `if (LIVE)`. En live, les actions de `app/root.js` sont surchargées par celles du bloc « Mode live ».

## 5. Build et tests

Node, plus esbuild pour la minification seule (pas de bundler : la concaténation reste celle de `build.mjs`). pnpm 10 bloque les scripts d'installation par défaut : `pnpm.onlyBuiltDependencies` dans `package.json` autorise celui d'esbuild, qui vérifie son binaire natif.

```
pnpm install          # jsdom 24.1.3, react et react-dom 18.3.1, esbuild 0.28.2 (devDependencies)
pnpm build            # écrit dist/torch-client.html, dist/app.js et les deux userscripts, avec leurs tailles
pnpm test             # build puis toutes les suites, échoue si une suite échoue
pnpm test live_ui     # build puis les suites nommées seulement
pnpm build:ds         # régénère la doc des composants du design system
```

Suites (`tests/`, lancées par `tests/run.mjs`) :
- `smoke` : prototype hébergé (51 étapes) ;
- `live_ui` : mode live avec faux client Torch (109 étapes) ;
- `loader` : userscript, démarrage de Torch, pages ignorées, double démarrage, feuille de login, pont vissle (13 étapes, jouées sur chacun des deux userscripts, 26 en tout) ;
- `live_login` : détection de connexion (3 étapes) ;
- `avatar` : avatars (7 étapes) ;
- `check_ds` : rendu des aperçus du design system.

Deux userscripts sortent du même assemblage (`userscript()` dans `build.mjs`), qui décrit les étapes une seule fois :
- `dist/torch-skin.user.js` : version lisible, inchangée par la minification ; c'est sur elle que tournent les autres suites ;
- `dist/torch-skin.min.user.js` : même assemblage, avec la transformation esbuild (`transform`, cible ES5, `minify`) appliquée au code page, au code du loader et aux deux feuilles (skin et login). L'en-tête `==UserScript==` est recopié tel quel, sans source map.

Tous ces tests doivent rester verts. Le lanceur juge chaque suite sur son code de sortie et sur sa sortie (lignes `FAIL`, `CRASH`, `ERRORS:` non vide), car certaines suites sortent en 0 malgré un échec. `live_ui.js` simule un client Torch, enregistre chaque trame envoyée et vérifie leur format exact. Ajoute un cas de test pour chaque correctif.

## 6. Comment Torch fonctionne (vérifié dans son code)

- **Démarrage.** Le favori officiel ajoute un script `https://vissle.me/client/start`. Torch construit alors sa page et expose des variables globales : `client`, `chatango`, `sidebar`, `torch`. Le code page (`skin-page.js`) les lit avec un script sonde injecté.
- **Événements.** `client.on(evt, cb)` est un `CustomEvent` sur `document` nommé `chatango_<evt>`. Le callback reçoit l'événement, pas le client. Le pont détecte la connexion avec `clientLogin`, et en secours par sondage de `client.user.name`.
- **Trames entrantes.**
  - Les tables `client.event.group` et `client.event.private` sont appelées `(client, socket, room, argsArray)`, la trame étant déjà découpée sur `:`.
  - Le pont enveloppe ces tables et y ajoute les gestionnaires qui manquent (le dispatcher fait `command in table`).
  - Le salon technique `torch.environment` est ignoré.
- **Envoi.** `client.socket(gid, frame, errorText)`. Pour les messages, `client.sendMessage(text, true, gid)` renvoie le corps stylé sans l'envoyer. Torch attend du HTML, donc le texte doit être échappé (`&`, `<`, `>`). Le pont y insère `<r{ref}/>` pour une réponse, puis envoie `bm:{id}:{flag}:{body}`.
- **Références de message.** `<r…/>` et `<e…/>` : id sans le `=` final, avec `-` remplacé par `hypheN` et `_` par `underS`.
- **Avertissements.** `client.systemMessage(...)` et `client.setNotice(...)` sont interceptés, puis affichés dans le fil ou en notification.
- **Session et reconnexion.**
  - `kickingoff` (table `private`) : le compte s'est connecté aux MP ailleurs. Torch ferme sa connexion privée et l'annonce par `systemMessage`. Le pont émet `session` (`kicked`) et tait cette notice. Pas de reconnexion automatique, sinon les deux fenêtres se renvoient la session.
  - `DENIED` (table `private`) : jeton expiré. Torch répond par un `alert()` bloquant. Le pont ne l'appelle pas et émet `session` (`denied`). Seul un rechargement en sort.
  - Torch ne se reconnecte jamais seul. À la fermeture d'un socket, il affiche « You have disconnected from #g » avec Reconnect (remonté en notification). Il occupe `window.onoffline` et `window.ononline` : le pont écoute `offline` et `online` par `addEventListener` sans y toucher.
  - `client.connect(gid)` passe par `socketEvent`, qui ignore la demande, avec une promesse jamais réglée, tant que `gid` est dans `client.cache.connect`. Torch l'en retire après chaque tentative. Le pont fait de même autour de chacun de ses appels (`connect()` dans `live-bridge.js`), sinon un second Reconnect reste sans effet.
  - Sources : Torch `inject.js` (`kickingoff`, `DENIED`, `socketEvent`, `window.onoffline`). Textes de la fenêtre « Connection lost » repris du client officiel.
- **Historique privé.** Base IndexedDB `<pseudo>_history`, version 1, magasin `messages` (keyPath `ts`), index `target_idx`, `target_read_idx`, `target_ts_idx`. Torch ne l'ouvre que depuis son propre écran privé. Le pont l'ouvre avec le même schéma, puis l'assigne à `client.database.pm`.
  - Enregistrement (Torch `saveMessage`, même format que le client officiel) : `{ target, ts, data, unread }`, où `data` est la trame brute complète `msg:nom:…:ts:flags:corps`, balises comprises.
  - Aucune suppression d'historique MP n'existe côté serveur. `client.private.clearHistory(target)` efface la copie locale par curseur sur `target_idx`. Torch la définit sans l'appeler. Le bouton « Delete » du client officiel fait l'équivalent.
- **Style d'un MP.** Le corps a la forme `<n{couleur nom}/><m v="1"><g x{taille}s{couleur}="{police}">…</g></m>`, différente du format de groupe `<f x{taille}{couleur}="{police}">`. Sources : chadango `PrivateFontStyleRe`, Torch `renderMessage`, client officiel. La police doit être ancrée sur la balise `<g x`/`<f x` : Torch a une regex gourmande qui lit `h="93"` d'une balise `<i>`.
- **Médias.** Balise `<i s="…" [w h]/>` en groupe comme en MP. Seuls préfixes connus (client officiel) : `vid://yt:{id 11}`, `img://cam:{id}` et `img://lib:{id}`, qui donnent `https://chatango.com/pmmessageimg?i={id}` (Torch). Le reste, ce sont des URL https. Torch charge l'oEmbed YouTube automatiquement. Nous ne l'appelons jamais, et l'iframe `youtube-nocookie.com` ne se crée qu'au clic.
- **Profil.** Torch remplit des champs cachés `[data-text-field="age|gender|location|about|full"]` et `[data-setting="show_profile"] input` à la connexion. L'enregistrement passe par `client.post(chatango.path('updateprofile'), form, {})` avec `auth=token`, `arch=h5`, `src=group`, `action=update`, `age`, `gender`, `location`, `line`, `full_profile`, `dir`. Le profil complet est toujours renvoyé intact.
- **Création de groupe.** `client.post(chatango.path('script/creategrouploginjs','st'), form, { cookie: true })` avec `authType=cookie`, `uns=0`, `u`, `n`, `d`, `owner` et `discovery`. La réponse attendue est `groupcreated`.
- **Meet people.**
  - POST sur `chatango.path('search')` avec `credentials: 'include'` et les champs `ami`, `ama`, `imc` (0 tous, 1 photos, 2 personnages), `s` (B, M ou F), `ss`, `o` (1 = en ligne seulement), `h5=1`, `f` et `t` (plage d'index début et fin, chadango `people_query.go`).
  - Réponse : `h=nom;…:nom;…`.
  - Pagination : la page suivante part de `meet.next` (`f` de la page précédente plus le nombre de noms reçus), pas du nombre de résultats affichés, qui écarte les doublons. Une page de moins de 40 noms termine la liste. Les résultats gardent le compte connecté, marqué « You ».
  - Le pont envoie ensuite `getpresence:a;b` sur la connexion privée. Réponse `presence` : triplets nom, minutes, état (`online`, `app` ou `offline`).
- **Présence des amis (connexion privée).** Les horodatages sont en secondes. `None` ou 0 veut dire inconnu.
  - `wl` : quadruplets `nom:horodatage:état:minutes`, état `on`, `off` ou `app`. En `on`, des minutes non nulles veulent dire inactif. En `off`, l'horodatage est la dernière connexion.
  - `wladd:nom:état:valeur` : minutes d'inactivité en `on`, horodatage en `off` ou `app`. `wladd:nom:invalid` pour un nom inconnu.
  - `wlonline:nom`, `wlapp:nom` (connecté depuis l'application mobile), `wloffline:nom:horodatage` (ch.py).
  - `status:nom:horodatage:état`, état `online`, `app` ou `offline` (ch.py, chatango-lib). Elle ne dit pas si le compte est inactif : un état idle connu est gardé. Torch ne s'en sert que pour son écran de MP.
  - `presence` : en `online` ou `app`, les minutes sont de l'inactivité. En `offline`, elles donnent une dernière connexion approchée.
  - Le pont en tire `lastOn` (millisecondes, 0 si inconnu). Un passage hors ligne sans horodatage prend l'heure courante (`app/root.js`). Un ami hors ligne affiche « Last online » avec cette date.
- **Activité du profil (vissle).**
  - Transport : `POST https://vissle.me/track1/activity`, corps `JSON.stringify({action:'activity', profile, page, order, get})` en text/plain. Pas d'authentification (source : `vissle.me/js/track.js`).
  - Aucun en-tête CORS : la page ne peut pas lire la réponse avec `fetch`. D'où le pont `GM_xmlhttpRequest` dans le bac à sable du userscript, et l'application injectée dans la page par un `<script>` inline.
  - Réponse : `{get:[{user, name?, action, time, msg?}]}` ou `{error}` dans une réponse 200.
  - Pagination : 16 éléments par réponse, dont 15 affichés. Page suivante : `page` = `time` du dernier élément affiché.
  - `get` : `all|log|like|dislike|msg|refer`. `order` : `desc|asc`.
  - Pas de temps réel : le socket.io de vissle refuse l'origine st.chatango.com.
- **Mini profil.** `https://ust.chatango.com/profileimg/{a}/{b}/{nom}/mod1.xml`, avec les balises `b` (date de naissance), `s`, `l`, `body` (encodé URL) et `d` (fin du Premium). Profil complet : `mod2.xml`, balise `body`.
  - Fond Premium : `custom_profile.css` dans le même dossier, sans le préfixe `sp/sp` (Torch `chatango.subdomain.custom_profile`). Torch ne le lit que si le Premium est actif (`d` × 1000 > maintenant), le pont aussi.
  - Sans fichier, Chatango renvoie une petite image JPEG : le pont exige `r.ok` et un `content-type` `text/css`.
  - Format relevé (compte goddess), une règle par sélecteur, espaces et `!important` variables :
    `body { background-color; background-image: url(…); background-repeat; color }`, `.profile_text { color }`, `a, a:visited, a:active { color; text-decoration }`, `a:hover { … }`.
  - Le CSS n'est jamais injecté. Le pont (`parseMiniCss`) en tire `{bg, text, link, image}` : couleurs converties en hex (hex, nom CSS, `rgb()`), texte de `body` ou à défaut de `.profile_text`, image en `https` seulement (`http` réécrit). Résultat dans `u.miniStyle`, mis en cache avec le profil.
- **Avatars.** `ust.chatango.com/profileimg/{1re}/{2e ou 1re}/{nom}/thumb.jpg` ou `thumb_m.jpg`, avec le préfixe `sp/sp{nom}` pour les noms qui commencent par `_` ou `-`.

### Trames de groupe utilisées et leur source

- **Source Torch :**
  - `delmsg:{id}`
  - `delallmsg:{unid}:{ip}:{name}` (nom vide pour un invité)
  - `block:{unid}:{ip}:{name}`
  - `removeblock:{unid}:{ip}`
  - `blocklist:block:0:next:500:anons:1`
  - `updateannouncement:{0|1}:{secondes}:{style}{texte}`
  - `getannouncement`
  - `get_more:20:{client.groups[g].load}`
- **Source chadango ou chatango-lib :**
  - `updategroupflags:{ajouts}:{retraits}`
  - `setbannedwords:{partiel}:{entier}` (encodés URL)
  - `getbannedwords`
  - `getratelimit`, `setratelimit:{s}`
  - `addmod:{nom}:{droits}` (ajout et mise à jour)
  - `removemod:{nom}`
  - `unbanall`
  - `clearall`
  - `getmodactions:prev:0:50` (offset 0 confirmé par un script Pastebin, source moins fiable)
- **Messages privés :**
  - `idle:0` ou `idle:1`
  - `wladd:{n}`, `wldelete:{n}`
  - `block:{n}:{n}:S`, `unblock:{n}`
  - `wl`, `getblock`

Les bits de drapeaux de groupe, de droits de modérateur et de canaux sont dans `src/bridge/live-model.js` (`GROUP_FLAG`, `PERM_FLAG`, `CHANNEL_FLAG`), relevés dans `chatango.flags` de Torch.

## 7. Ce qui est fait

- Refonte complète : thème sombre et clair, accent ajustable, design system, maquettes.
- **Groupes :**
  - messages, réponses, messages modifiés, canaux, historique plus ancien ;
  - présence, état de connexion avec bouton de reconnexion ;
  - avertissements de Torch remontés dans le fil.
- **Modération :** supprimer, supprimer tout d'un membre, bannir le message ciblé, débannir, tout débannir, vider le groupe, fermer le groupe.
- **Réglages de groupe :**
  - annonce (style d'origine conservé), mots bannis, mode lent ;
  - filtres anti-spam, proxys, liens, images et vidéos, mode diffusion ;
  - droits de chaque modérateur, journal de modération.
  - L'enregistrement n'envoie que les écarts avec la version ouverte, ce qui préserve les changements d'un autre modérateur. L'écran attend la confirmation de Chatango.
- **Messages privés :**
  - historique depuis la base de Torch, liste d'amis, ajout et retrait d'amis, blocage, statut ;
  - police et couleurs des autres membres, en direct et depuis l'historique ;
  - « Close » : menu de la ligne (bouton « … » ou clic droit), swipe tactile, ou menu du fil. La conversation est retirée de la liste, l'historique est gardé. Elle reste fermée (champ `hidden` de `torch-skin:<pseudo>`) jusqu'à un MP entrant ou une réouverture manuelle ;
  - « Delete » : fermer, plus effacer la copie locale de Torch (`clearHistory`), avec confirmation.
- **Médias (groupes et MP) :** vidéos YouTube, images, photos MP. Ils suivent les réglages `embedImages`, `embedVideos` et `proxyMedia` (rien n'est chargé avant le clic). Les aperçus affichent « Video », « Image » ou « Photo ».
- **Meet people :** cartes de mini profil, fenêtre de filtres, étiquettes retirables, bouton Refresh.
- **Profils :** mini profil assaini, profil complet isolé, édition de son propre profil (âge, genre, lieu, bio, Meet people).
- **Création de groupe.**
- Favoris, sourdines, membres ignorés et conversations masquées conservés par compte dans `localStorage` (`torch-skin:<pseudo>`).
- Fenêtres, menus et notifications rendus dans un calque (`Portal`, `#layer`) pour ne pas déformer la mise en page.
- **Visitors :** activité de son propre profil (visites, likes, commentaires, parrainages) dans l'écran profil, avec filtres, pagination et Refresh.
- **0.7.0 :**
  - composeur : un clic sur la barre place le curseur dans le champ, boutons gras, italique et lien retirés, emoji et pièce jointe seulement dans le prototype ;
  - nouveau MP sans suggestions ;
  - bio : line Chatango brute dans le champ, aperçu rendu ;
  - style perso (police, taille, couleurs du texte et du nom, gras, italique, souligné) : écrit dans les champs de style de Torch juste avant chaque envoi, conservé dans `torch-skin:<pseudo>` (champ `style`), jamais enregistré chez Chatango. « Use account style » rétablit le style du compte ;
  - écran de login de Torch habillé en CSS seul (`styles/login.css`), retiré à `__TORCH_SHOW__` ;
  - chargements : écran de démarrage, squelettes (groupes, MP, amis, membres, profils), Spinner pour l'historique, fondu des avatars ;
  - session coupée : fenêtre bloquante (connecté ailleurs, session expirée, hors ligne, connexion perdue) avec Reload et reconnexion. Au retour du réseau, les groupes rejoints fermés et les MP sont reconnectés.
- **0.8.0 :**
  - amis : dernière connexion (« Last online »), tri en ligne, inactif, puis hors ligne du plus récent au plus ancien ; genre abrégé en M ou F ; plus de texte de statut sur les lignes, la pastille suffit ;
  - Chats : compteur de non lus sur l'onglet, ligne en grille nom et heure, informations, aperçu et compteur. Actions Close et Delete par le menu « … », le clic droit ou le swipe tactile ;
  - squelettes du design system en balayage lumineux (`tc-shimmer`), coupé en mouvement réduit (préférence système ou réglage de l'application) ;
  - Meet people : cartes de hauteur constante (ligne d'informations et deux lignes de bio réservées, squelettes pendant le chargement), défilement infini (sentinelle observée par `IntersectionObserver`, Spinner en bas, plus de bouton Load more), le compte connecté apparaît avec un badge « You » et ouvre sa fiche profil.
- **0.8.1 :**
  - MP reçus hors ligne : la base d'historique est ouverte avant la connexion privée (les `msgoff` ne sont livrés qu'une fois, juste après `OK`), pas de doublon à la fusion avec l'historique, une seule notification « N messages received while you were away. » ;
  - bio en couleur dans les cartes Meet (`RichText` en mode `inline` : ni bloc, ni lien, ni image, taille et alignement ignorés). `RichText` accepte les couleurs nommées et `rgb()` ;
  - fond Premium du mini profil : couleur de fond sur la carte Meet, fond, texte et liens sur le bloc About de la fiche, avec contraste garanti. L'image de fond n'apparaît que sur la fiche, suit `embedImages` et `proxyMedia` (bouton « Show background »), sous un voile de la couleur de fond. Réglage « Profile backgrounds » dans Apparence (`styles.profileBackgrounds`).
- **Userscript :** deux contextes. L'application tourne dans la page, et seul le pont vissle tourne dans le bac à sable (`@grant GM_xmlhttpRequest`, `@connect vissle.me`). Démarrage automatique, page d'accueil seulement (`@noframes` et vérification `pathname === '/'`), pas de double démarrage, SRI sur React.

## 8. Ce qui reste ouvert

- **Taille de police des membres :** elle est lue, mais appliquée nulle part (ni en groupe ni en MP). Torch l'applique, avec 11 = 100 %, bornée entre 82 et 200 %.
- **Style écrasé par l'historique :** l'historique, de groupe comme de MP, fusionne de vieux styles dans l'utilisateur partagé, ce qui peut remplacer un style plus récent.
- **Médias :** `applyEdit` gère les embeds, mais un MP envoyé localement n'a pas d'embeds tant que l'historique n'est pas rechargé. Les annonces affichent leurs médias en texte.
- **Style perso :** il reste local à ce navigateur. L'enregistrer sur le compte passe par le formulaire de style de Torch (`updatemsgstyles`), qui transmet le mot de passe : exclu par la règle 1.
- **Groupe :** titre, description et icône non modifiables. Aucune source fiable trouvée.
- **Profil :** photo de profil non modifiable, couleurs du profil complet non reproduites.
- **Fond Premium :** l'image est une `<img>` en `referrerPolicy="no-referrer"`, affichée une fois en `contain` en haut à gauche. `background-repeat` n'est pas reproduit : la répétition demanderait un fond CSS, qui envoie le referrer.
- **Réglages de Torch :** les réglages propres à Torch (qui peut écrire, groupes rejoints au démarrage) restent dans Torch.
- **Sons :** ils sont joués par Torch, avec ses réglages. Les nôtres restent coupés en live pour éviter le double signal.
- **Polices de l'interface :** elles sont chargées depuis Google Fonts. L'utilisateur est sensible à la confidentialité, ce choix pourra être revu.
- **Mode lent :** `setratelimit:0` comme valeur « off » n'est pas confirmé.

## 9. Livrer une nouvelle version

1. Incrémenter `@version` dans `src/loader/skin-loader.js`. Le build l'injecte dans `APP_VERSION`.
2. `pnpm test` (build compris) : toutes les suites vertes.
3. Envoyer `dist/torch-skin.min.user.js` à l'utilisateur : c'est le fichier à uploader. Ce nom est fixe d'une version à l'autre (choix de l'utilisateur depuis la 0.8.1, il remplace `torch-skin.user.js` pour l'envoi vers ses userscripts). Il remplace le contenu du script dans Tampermonkey. `dist/torch-skin.user.js` sert au débogage et à l'audit.

## 10. Artefacts publiés (compte de l'utilisateur)

- Maquettes (Design) : https://claude.ai/artifact/JuDrFE7mapqwAzCDjcFeFQ
- Design system : https://claude.ai/artifact/ATzDF31PsVNFEYWmUWA3GW
- Prototype hébergé (données simulées) : https://claude.ai/artifact/D2Em5urvHC1FCpcmMmWHgH

Une nouvelle session peut les mettre à jour en passant leur adresse au publish, après les avoir relus.
