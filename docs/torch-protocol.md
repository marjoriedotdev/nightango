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

`client.systemMessage(...)` et `client.setNotice(...)` sont interceptés par le pont, puis affichés dans le fil ou en notification.

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
- Les polices Geist et Geist Mono depuis Google Fonts (`fonts.googleapis.com`, `skin-page.js`).
- Le script de démarrage de Torch, `https://vissle.me/client/start`, qui charge à son tour la page et le code de Torch.
- L'iframe `www.youtube-nocookie.com/embed/`, créée seulement au clic. La miniature `i.ytimg.com` s'affiche si `embedVideos` est actif et `proxyMedia` coupé.
- Les images de message (URL https, `chatango.com/pmmessageimg`) selon `embedImages` et `proxyMedia`.
- Les avatars `ust.chatango.com/profileimg/…/thumb.jpg` ou `thumb_m.jpg`, en `<img>`.

Un appel exclu pour cette raison : le formulaire de style de Torch (`updatemsgstyles`) transmet le mot de passe. Le style de message perso n'est donc jamais enregistré sur le compte ([ADR-0006](adr/0006-local-message-style.md)).

## Messages privés

### Historique privé

- Base IndexedDB `<pseudo>_history`, version 1, magasin `messages` (keyPath `ts`), index `target_idx`, `target_read_idx` et `target_ts_idx`.
- Torch n'ouvre cette base que depuis son propre écran privé. Le pont l'ouvre avec le même schéma, puis l'assigne à `client.database.pm`.
- Enregistrement (Torch `saveMessage`, même format que le client officiel) : `{ target, ts, data, unread }`. `data` est la trame brute complète `msg:nom:…:ts:flags:corps`, balises comprises.
- Aucune suppression d'historique MP n'existe côté serveur. `client.private.clearHistory(target)` efface la copie locale par curseur sur `target_idx`. Torch la définit sans l'appeler. Le bouton « Delete » du client officiel fait l'équivalent.

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
- Le pont en tire `lastOn` (millisecondes, 0 si inconnu). Un passage hors ligne sans horodatage prend l'heure courante (`app/root.js`). Un ami hors ligne affiche « Last online » avec cette date.

## Médias

- Balise `<i s="…" [w h]/>`, en groupe comme en MP.
- Seuls préfixes connus (client officiel) : `vid://yt:{id de 11 caractères}`, `img://cam:{id}` et `img://lib:{id}`. Les deux derniers donnent `https://chatango.com/pmmessageimg?i={id}` (Torch). Le reste, ce sont des URL https.
- Torch charge l'oEmbed YouTube automatiquement. Torch Skin ne l'appelle jamais, et l'iframe `youtube-nocookie.com` n'est créée qu'au clic.

## Profils

### Fichiers publics ust.chatango.com

- Dossier d'un membre : `https://ust.chatango.com/profileimg/{1re lettre}/{2e lettre, ou 1re si le nom n'en a qu'une}/{nom}/`. Pour les noms qui commencent par `_` ou `-`, le chemin devient `profileimg/sp/sp{nom}/`.
- Avatars : `thumb.jpg` (petit) ou `thumb_m.jpg` dans ce dossier.
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
- `getratelimit`, `setratelimit:{s}` (`setratelimit:0` comme valeur « off » n'est pas confirmé)
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
- Groupes rejoints au démarrage : `client.settings.privacy.groups.connect_own`, `connect_recent` et `connect_favorite` (booléens), lus par `logGroups` à la connexion (`inject.js:1189`). La liste `favorite[]` n'est pas gérée par Torch Skin.
- MP au démarrage : `client.settings.privacy.private_messages.connect_start`, lu à la connexion (`inject.js:1366`).
- Le pont lit ces quatre valeurs (`startupSettings`), écrit l'une d'elles en place dans `client.settings` (`setStartupSetting`), puis réécrit `localStorage["settings"]` comme Torch. Il n'écrit aucune autre clé. L'effet vaut au prochain chargement.
- « Qui peut m'écrire » (`client.settings.safety.users.allow_*`, `inject.js:9648`) est déclaré dans les défauts et l'écran de Torch mais lu nulle part : il est sans effet dans Torch et Torch Skin ne le reprend pas.

## Ce qui reste dans Torch

- Les autres réglages propres à Torch restent dans Torch, dont « qui peut m'écrire », sans effet dans Torch.
- Les sons sont joués par Torch avec ses réglages. Ceux de Torch Skin restent coupés en live pour éviter le double signal.
