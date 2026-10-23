# Protocole Torch et Chatango

Ce document décrit ce que Torch Skin sait du client Torch (vissle.me) et du protocole Chatango. Chaque point a été vérifié dans le code de Torch, dans le client officiel de Chatango ou dans une bibliothèque de référence. Une trame ou un format absent d'ici n'a pas de source connue : ne l'envoie pas (voir [ADR-0002](adr/0002-no-invented-frames.md)).

## Sources de référence

- Torch : son code chargé par `https://vissle.me/client/start`, en particulier `inject.js` (`kickingoff`, `DENIED`, `socketEvent`, `window.onoffline`, `saveMessage`, `renderMessage`). Une copie en lecture seule, téléchargée le 2026-10-19, est dans `reference/torch/` (`start.js`, `inject.js`, `client.html`, `client.css`). Une référence `inject.js:NNNN` renvoie à une ligne de cette copie. Le code servi par vissle.me peut avoir changé depuis : en cas de doute, compare avec la version en ligne.
- Client officiel de Chatango : textes de la fenêtre « Connection lost », format de l'historique privé, bouton « Delete », préfixes de médias.
- chadango (Go) : https://github.com/n0h4rt/chadango
- chatango-lib (Python) : https://github.com/neokuze/chatango-lib
- ch.py (Python, plus ancienne) : https://github.com/asl97/ch.py
- vissle : `vissle.me/js/track.js` pour le tracker de profil. Ce script n'est pas copié dans `reference/torch/` : il ne fait pas partie du client Torch et aucune licence connue ne le couvre.

## Démarrage de Torch

- Le favori officiel de Torch ajoute le script `https://vissle.me/client/start`. Torch construit alors sa page et expose les variables globales `client`, `chatango`, `sidebar` et `torch`.
- Ces variables vivent dans la page. Le code page (`skin-page.js`) les lit avec un script sonde injecté, qui les range dans `window.__torchRefs`.
- Le salon technique `torch.environment` est ignoré par le pont.

## Événements

- `client.on(evt, cb)` est un `CustomEvent` sur `document` nommé `chatango_<evt>`. Le callback reçoit l'événement, pas le client.
- Le pont détecte la connexion par l'événement `clientLogin`, et en secours par sondage de `client.user.name`.

## Trames entrantes

- Les tables `client.event.group` et `client.event.private` sont appelées avec `(client, socket, room, argsArray)`. La trame est déjà découpée sur `:`.
- Le dispatcher de Torch teste `command in table`. Le pont enveloppe donc ces tables et y ajoute les gestionnaires qui manquent.

## Envoi

- Une trame part par `client.socket(gid, frame, errorText)`.
- Pour un message, `client.sendMessage(text, true, gid)` renvoie le corps stylé sans l'envoyer. Torch attend du HTML : le texte doit être échappé (`&`, `<`, `>`).
- Le pont insère `<r{ref}/>` pour une réponse, puis envoie `bm:{id}:{flag}:{body}`.
- Références de message `<r…/>` et `<e…/>` : id sans le `=` final, `-` remplacé par `hypheN` et `_` par `underS`.

## Avertissements de Torch

`client.systemMessage(...)` et `client.setNotice(...)` sont interceptés par le pont, puis affichés en notification (toast), jamais dans le fil : Torch les adresse au groupe qu'il croit ouvert (`client.focus`), pas forcément au groupe concerné.

- Présence d'un ami : Torch émet « X is now online. », « …offline. » ou « …idle… » avec `unique: "status"` et sans `group`, pour le MP qu'il croit ouvert (gestionnaires `status` et `idleupdate`, `inject.js:4187` et `inject.js:4294`). Le pont les tait : la liste d'amis montre déjà la présence.

## Session et reconnexion

- `kickingoff` (table `private`) : le compte s'est connecté aux MP ailleurs. Torch ferme sa connexion privée et l'annonce par `systemMessage`. Le pont émet `session` (`kicked`) et tait cette notice. Il n'y a pas de reconnexion automatique, sinon les deux fenêtres se renvoient la session.
- `DENIED` (table `private`) : jeton expiré. Torch répond par un `alert()` bloquant. Le pont ne l'appelle pas et émet `session` (`denied`). Seul un rechargement en sort.
- Torch ne se reconnecte jamais seul. À la fermeture d'un socket, il affiche « You have disconnected from #g » avec un bouton Reconnect, que le pont remonte en notification.
- Torch occupe `window.onoffline` et `window.ononline`. Le pont écoute `offline` et `online` par `addEventListener`, sans toucher aux propriétés de Torch.
- Au retour du réseau (`online`), l'application (`reconnectClosed()` dans `app/root.js`) reconnecte les groupes rejoints dont le socket est fermé, puis la connexion privée si elle est fermée. La connexion privée reste coupée après `kickingoff` ou `DENIED`.
- `client.connect(gid)` passe par `socketEvent`. Tant que `gid` est dans `client.cache.connect`, la demande est ignorée et la promesse n'est jamais réglée. Torch retire `gid` après chaque tentative. Le pont fait de même autour de chacun de ses appels (`connect()` dans `live-bridge.js`), sinon un second Reconnect reste sans effet.
- Les textes de la fenêtre « Connection lost » de Torch Skin sont repris du client officiel.

## Appels HTTP autorisés

Cette liste est fermée. Elle couvre les appels que le code applicatif (pont, loader, écrans) fait lui-même vers Chatango et vissle, par `fetch`, `client.post` ou `GM_xmlhttpRequest`. Aucun de ces appels ne transporte le mot de passe ([ADR-0001](adr/0001-password-never-read.md)).

- `client.post(url, form, {})` ou `client.post(url, form, { cookie: true })`. Jamais d'option `credential`, qui ajoute le mot de passe.
- Les GET publics sur `ust.chatango.com` : `mod1.xml`, `mod2.xml`, `custom_profile.css`.
- La recherche `chatango.com/search` avec `credentials: 'include'`, comme le fait Torch.
- `POST https://vissle.me/track1/activity`, par le pont `GM_xmlhttpRequest` du loader, avec `anonymous: true`.

### Ressources chargées par le loader et l'interface

Ce ne sont pas des appels du code applicatif mais des ressources que le navigateur charge par une balise. Elles ne transportent ni mot de passe ni jeton. En ajouter une demande la même validation qu'un nouvel appel.

- React et ReactDOM 18.3.1 depuis `cdnjs.cloudflare.com`, avec SRI (`skin-page.js`).
- Le script de démarrage de Torch, `https://vissle.me/client/start`, qui charge à son tour la page et le code de Torch.
- L'iframe `www.youtube-nocookie.com/embed/`, créée seulement au clic. La miniature `i.ytimg.com` s'affiche si `embedVideos` est actif et `proxyMedia` coupé.
- Les images de message (URL https, `chatango.com/pmmessageimg`) selon `embedImages` et `proxyMedia`.
- Les avatars `ust.chatango.com/profileimg/…/thumb.jpg` ou `thumb_m.jpg`, en `<img>`.
- La photo de profil complète `ust.chatango.com/profileimg/…/full.jpg`, en `<img>` `referrerPolicy="no-referrer"`, chargée seulement au clic sur l'avatar du mini profil.

Un appel exclu pour cette raison : le formulaire de style de Torch (`updatemsgstyles`) transmet le mot de passe. Le style de message perso n'est donc jamais enregistré sur le compte ([ADR-0006](adr/0006-local-message-style.md)).

## Messages privés

### Historique privé

- Base IndexedDB `<pseudo>_history`, version 1, magasin `messages` (keyPath `ts`), index `target_idx`, `target_read_idx` et `target_ts_idx`.
- Torch n'ouvre cette base que depuis son propre écran privé. Le pont l'ouvre avec le même schéma, puis l'assigne à `client.database.pm`.
- Enregistrement (Torch `saveMessage`, même format que le client officiel) : `{ target, ts, data, unread }`. `data` est la trame brute complète `msg:nom:…:ts:flags:corps`, balises comprises.
- Aucune suppression d'historique MP n'existe côté serveur. `client.private.clearHistory(target)` efface la copie locale par curseur sur `target_idx`. Torch la définit sans l'appeler. Le bouton « Delete » du client officiel fait l'équivalent.
- Fusion du style : le style le plus récent gagne. Chaque membre garde l'horodatage du message dont vient son style (`styleTs`), et une source ne fusionne le sien que si son message est plus récent (`mergeStyle` dans `app/root.js`). La règle vaut pour le direct (groupe et MP), l'historique de groupe (trames `i`, reçues du plus récent au plus ancien), et l'historique privé rejoué à chaque `OK`. Le style perso, lui, fusionne toujours à l'envoi (`setOwnStyle`) et prend pour horodatage le plus grand de `styleTs` et de l'heure locale, pour ne pas être rejeté quand l'horloge locale retarde sur celle du serveur. Limite acceptée : l'horodatage archivé par Torch est décalé de quelques secondes à quelques minutes, deux MP très rapprochés peuvent donc être mal ordonnés.

### MP reçus hors ligne

- Les trames `msgoff` ne sont livrées qu'une fois, juste après `OK` sur la connexion privée.
- Comme Torch, le pont ouvre donc la base d'historique avant la connexion privée, pour que ces messages y soient archivés.
- La fusion avec l'historique ne crée pas de doublon. Torch archive un horodatage différent de celui affiché : un message déjà affiché (même auteur, même contenu, à deux minutes près) couvre une seule entrée de l'historique, comparée à un instantané des messages affichés (`pmReady` dans `app/root.js`).
- Une seule notification groupée les annonce : « N messages received while you were away. »

### Style d'un MP

- Le corps a la forme `<n{couleur nom}/><m v="1"><g x{taille}s{couleur}="{police}">…</g></m>`. Le format de groupe est différent : `<f x{taille}{couleur}="{police}">`. Sources : chadango `PrivateFontStyleRe`, Torch `renderMessage`, client officiel.
- La police doit être lue sur la balise `<g x` ou `<f x`. Torch a une regex gourmande qui lit par erreur `h="93"` d'une balise `<i>`.
- Taille de police d'un membre : Torch l'applique avec 11 = 100 %, bornée entre 82 et 200 % (`fontScale`). Torch Skin reprend la même échelle (`fontPercent`), et une balise sans taille vaut 100 %.
- Torch lit le style d'envoi dans son formulaire `msgstyles` (gras, italique, souligné, taille, couleurs, police). Torch Skin y écrit le style perso juste avant chaque envoi.

### Présence des amis

Sur la connexion privée. Les horodatages sont en secondes. `None` ou 0 veut dire inconnu.

- `wl` : quadruplets `nom:horodatage:état:minutes`, état `on`, `off` ou `app`. En `on`, des minutes non nulles veulent dire inactif. En `off`, l'horodatage est la dernière connexion.
- `wladd:nom:état:valeur` : minutes d'inactivité en `on`, horodatage en `off` ou `app`. `wladd:nom:invalid` pour un nom inconnu.
- `wlonline:nom`, `wlapp:nom` (connecté depuis l'application mobile), `wloffline:nom:horodatage` (source ch.py).
- `status:nom:horodatage:état`, état `online`, `app` ou `offline` (sources ch.py, chatango-lib). Cette trame ne dit pas si le compte est inactif : un état idle déjà connu est gardé. Torch ne s'en sert que pour son écran de MP.
- `presence` (réponse à `getpresence:a;b`) : triplets nom, minutes, état (`online`, `app` ou `offline`). En `online` ou `app`, les minutes sont de l'inactivité. En `offline`, elles donnent une dernière connexion approchée.
- Le pont en tire `lastOn` (millisecondes, 0 si inconnu). Un passage hors ligne sans horodatage prend l'heure courante (`app/root.js`). Les lignes Chats et Friends affichent cette date en haut à droite pour un ami hors ligne (« 3 h ago »).
- Le pont en tire aussi `idleSince` (millisecondes) à partir des minutes d'inactivité. `idleupdate` ne donne pas de durée : l'inactivité part de sa réception. L'état idle n'est affiché qu'après 3 minutes (`IDLE_DELAY`, `app/root.js`), avant quoi le membre reste online. Un ami idle affiche sa durée d'inactivité en haut à droite (« Idle 12 min »).

## Médias

- Balise `<i s="…" [w h]/>`, en groupe comme en MP.
- Seuls préfixes connus (client officiel) : `vid://yt:{id de 11 caractères}`, `img://cam:{id}` et `img://lib:{id}`. Les deux derniers donnent `https://chatango.com/pmmessageimg?i={id}` (Torch). Le reste, ce sont des URL https.
- Torch charge l'oEmbed YouTube automatiquement. Torch Skin ne l'appelle jamais, et l'iframe `youtube-nocookie.com` n'est créée qu'au clic.

## Profils

### Fichiers publics ust.chatango.com

- Dossier d'un membre : `https://ust.chatango.com/profileimg/{1re lettre}/{2e lettre, ou 1re si le nom n'en a qu'une}/{nom}/`. Pour les noms qui commencent par `_` ou `-`, le chemin devient `profileimg/sp/sp{nom}/`.
- Avatars : `thumb.jpg` (petit) ou `thumb_m.jpg` dans ce dossier. Photo complète : `full.jpg`, même chemin (`inject.js:226`).
- Mini profil : `mod1.xml`, balises `b` (date de naissance), `s`, `l`, `body` (encodé URL) et `d` (fin du Premium).
- Profil complet : `mod2.xml`, balise `body`.

### Fond Premium

- Fichier `custom_profile.css`, dans le même dossier mais sans le préfixe `sp/sp` (Torch `chatango.subdomain.custom_profile`).
- Torch ne le lit que si le Premium est actif (`d` × 1000 > maintenant). Le pont fait de même.
- Sans fichier, Chatango renvoie une petite image JPEG. Le pont exige `r.ok` et un `content-type` `text/css`. Compte de référence : `sith`, Premium sans `custom_profile.css`.
- Format relevé sur le compte de référence `goddess`, une règle par sélecteur, espaces et `!important` variables :
  `body { background-color; background-image: url(…); background-repeat; color }`, `.profile_text { color }`, `a, a:visited, a:active { color; text-decoration }`, `a:hover { … }`.
- Le CSS n'est jamais injecté ([ADR-0004](adr/0004-member-html-never-injected.md)). `parseMiniCss` en tire `{bg, text, link, image, repeat}` : couleurs converties en hex (hex, nom CSS, `rgb()`), texte de `body` ou à défaut de `.profile_text`, image en `https` seulement (`http` réécrit), répétition limitée à `repeat`, `repeat-x`, `repeat-y` ou `no-repeat`. Le résultat va dans `u.miniStyle`, mis en cache avec le profil.

### Son propre profil

- À la connexion, Torch remplit des champs cachés `[data-text-field="age|gender|location|about|full"]` et `[data-setting="show_profile"] input`.
- Enregistrement : `client.post(chatango.path('updateprofile'), form, {})` avec `auth=token`, `arch=h5`, `src=group`, `action=update`, `age`, `gender`, `location`, `line`, `full_profile`, `dir`. Le profil complet est toujours renvoyé intact.

## Meet people

- POST sur `chatango.path('search')` avec `credentials: 'include'`.
- Champs : `ami`, `ama`, `imc` (0 tous, 1 photos, 2 personnages), `s` (B, M ou F), `ss`, `o` (1 = en ligne seulement), `h5=1`, `f` et `t` (plage d'index de début et de fin, chadango `people_query.go`).
- Réponse : `h=nom;…:nom;…`.
- Pagination : la page suivante part de `meet.next`, soit `f` de la page précédente plus le nombre de noms reçus. Le nombre de résultats affichés ne convient pas, car il écarte les doublons. Une page de moins de 40 noms termine la liste.
- Les résultats contiennent le compte connecté. Torch Skin le garde et le marque « You ».
- Le pont envoie ensuite `getpresence:a;b` sur la connexion privée (voir Présence des amis).

## Création de groupe

`client.post(chatango.path('script/creategrouploginjs','st'), form, { cookie: true })` avec `authType=cookie`, `uns=0`, `u`, `n`, `d`, `owner` et `discovery`. La réponse attendue est `groupcreated`.

## Activité du profil (vissle)

- Transport : `POST https://vissle.me/track1/activity`, corps `JSON.stringify({action:'activity', profile, page, order, get})` en `text/plain`. Pas d'authentification (source `vissle.me/js/track.js`).
- vissle n'envoie aucun en-tête CORS : la page ne peut pas lire la réponse avec `fetch`. D'où le pont `GM_xmlhttpRequest` dans le bac à sable du userscript ([ADR-0003](adr/0003-two-context-loader.md)).
- Le tracker s'installe dans Torch par « Add profile tracker ». Le panneau « track » de Torch l'affiche déjà.
- Réponse : `{get:[{user, name?, action, time, msg?}]}`, ou `{error}` dans une réponse 200.
- Pagination : 16 éléments par réponse, dont 15 affichés. Page suivante : `page` = `time` du dernier élément affiché.
- `get` : `all|log|like|dislike|msg|refer`. `order` : `desc|asc`.
- Pas de temps réel : le socket.io de vissle refuse l'origine st.chatango.com.

## Trames utilisées et leur source

### Groupe, source Torch

- `delmsg:{id}`
- `delallmsg:{unid}:{ip}:{name}` (nom vide pour un invité)
- `block:{unid}:{ip}:{name}`
- `removeblock:{unid}:{ip}`
- `blocklist:block:0:next:500:anons:1`
- `updateannouncement:{0|1}:{secondes}:{style}{texte}`
- `getannouncement`
- `get_more:20:{client.groups[g].load}`

### Groupe, source chadango ou chatango-lib

- `updategroupflags:{ajouts}:{retraits}`
- `setbannedwords:{partiel}:{entier}` (encodés URL)
- `getbannedwords`
- `getratelimit`, `setratelimit:{s}`
  - `setratelimit:0` coupe le mode lent. Dans chadango, l'action de modération `chrl` (rate limit changé) de valeur 0 prend le gabarit `flood_cont` (« flood controlled », sans mode lent), toute autre valeur `slow_mode` : [models/modaction.go](https://github.com/n0h4rt/chadango/blob/d53b02a4d1e2cc7667f61b1693c8a42a55694d1b/models/modaction.go#L251-L257).
  - Le rôle du drapeau de groupe `RATELIMITREGIMEON` à côté de `setratelimit` n'est pas établi.
- `addmod:{nom}:{droits}` (ajout et mise à jour)
- `removemod:{nom}`
- `unbanall`
- `clearall`
- `getmodactions:prev:0:50` (offset 0 confirmé par un script Pastebin, source moins fiable)

### Messages privés

- `idle:0` ou `idle:1`
- `wladd:{n}`, `wldelete:{n}`
- `block:{n}:{n}:S`, `unblock:{n}`
- `wl`, `getblock`
- `getpresence:a;b`

### Enregistrement des réglages de groupe

- L'écran de réglages (`settings/live-group-view.js`) n'envoie que les écarts entre le brouillon et la version serveur sur laquelle il a été construit. Les changements faits entre-temps par un autre modérateur sont préservés.
- Il attend ensuite la confirmation de Chatango (« Waiting for Chatango to confirm your changes. »). Sans confirmation complète, il le dit et affiche les réglages actuels du groupe.

### Drapeaux

Les bits de drapeaux de groupe, de droits de modérateur et de canaux sont dans `src/bridge/live-model.js` (`GROUP_FLAG`, `PERM_FLAG`, `CHANNEL_FLAG`). Ils ont été relevés dans `chatango.flags` de Torch.

## Réglages de démarrage de Torch

- `client.settings` est chargé depuis `localStorage["settings"]` (JSON, origine st.chatango.com), avec repli sur les valeurs par défaut (`inject.js:9807`). Torch le persiste en réécrivant tout l'objet : `localStorage.setItem("settings", JSON.stringify(client.settings))` (`inject.js:9845`).
- Groupes rejoints au démarrage : `client.settings.privacy.groups.connect_own`, `connect_recent` et `connect_favorite` (booléens), lus par `logGroups` à la connexion (`inject.js:1189`). Avec `connect_favorite`, `logGroups` rejoint aussi chaque groupe de `client.settings.privacy.groups.favorite[]` (`inject.js:1193` et `inject.js:1200`).
- Favoris : l'étoile de Torch lit cette liste (`inject.js:10142`), retire un groupe par `filter` ou l'ajoute par `push`, puis réécrit `localStorage["settings"]` (`inject.js:10169` à `inject.js:10175`). En live, l'état favori d'un groupe de Torch Skin vient de cette liste (`favoriteGroups`) et l'étoile l'écrit de la même façon (`setFavorite`). Quitter un groupe le retire des favoris. Les favoris que Torch Skin gardait sous `torch-skin:<pseudo>` (`fav`) sont versés une fois dans la liste de Torch à la connexion, puis retirés du stockage local. Le prototype garde ses favoris locaux.
- Sourdine : pour un groupe de `client.settings.notifications.muted.groups`, `renderMention` tait les mentions : titre « Mentioned in #g », son de mention, notification bureau et pastilles (`inject.js:7757`). Les messages sans mention n'en dépendent pas. La cloche de Torch lit cette liste (`inject.js:10141`), retire un groupe par `filter` ou l'ajoute par `push`, puis réécrit `localStorage["settings"]` (`inject.js:10156` à `inject.js:10162`). Torch relit la liste à chaque mention : l'effet est immédiat. En live, l'état coupé d'un groupe de Torch Skin vient de cette liste (`mutedGroups`) et « Mute group » l'écrit de la même façon (`setMuted`). Torch Skin ne notifie pas non plus les mentions d'un groupe coupé, et ses compteurs ne changent pas. Les sourdines que Torch Skin gardait sous `torch-skin:<pseudo>` (`muted`) sont versées une fois dans la liste de Torch à la connexion, puis retirées du stockage local. Le prototype garde sa sourdine locale.
- MP au démarrage : `client.settings.privacy.private_messages.connect_start`, lu à la connexion (`inject.js:1366`). Torch Skin ne le reprend pas : le pont ouvre toujours la connexion privée lui-même, 2,5 s après la connexion, et `app/root.js` la rouvre si elle tombe. Un interrupteur serait sans effet.
- Le pont lit les trois valeurs de groupes (`startupSettings`), écrit l'une d'elles en place dans `client.settings` (`setStartupSetting`), puis réécrit `localStorage["settings"]` comme Torch. Hors de ces trois valeurs, il n'écrit que les listes `favorite[]` et `notifications.muted.groups[]`. L'effet des trois valeurs vaut au prochain chargement.
- « Qui peut m'écrire » (`client.settings.safety.users.allow_*`, `inject.js:9648`) est déclaré dans les défauts et l'écran de Torch mais lu nulle part : il est sans effet dans Torch et Torch Skin ne le reprend pas.

## Ce qui reste dans Torch

- Les autres réglages propres à Torch restent dans Torch, dont « qui peut m'écrire », sans effet dans Torch, et `connect_start`, sans effet puisque Torch Skin ouvre toujours les MP lui-même.
- Les sons sont joués par Torch avec ses réglages. Ceux de Torch Skin restent coupés en live pour éviter le double signal.
