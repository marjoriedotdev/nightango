# Passation : Torch Skin

Ce document accompagne l'archive `torch-skin-src.zip`. Il donne à une nouvelle session tout le contexte pour reprendre le projet sans rien redécouvrir. Lis-le en entier avant de toucher au code.

## 1. Le projet en deux phrases

**Torch** (vissle.me) est un client web tiers pour Chatango, fonctionnel mais à l'interface datée.

**Torch Skin** est un userscript Tampermonkey qui, sur https://st.chatango.com/ :
1. démarre Torch, comme le favori officiel ;
2. laisse l'utilisateur se connecter sur l'écran de Torch ;
3. affiche ensuite une interface refaite (React 18, dans un Shadow DOM) branchée sur le client Torch vivant.

Version actuelle : **0.6.0**, en usage réel. L'utilisateur l'a installée dans Tampermonkey.

## 2. Règles non négociables

1. **Le mot de passe n'est jamais lu, stocké, journalisé ni transmis par notre code.**
   - La connexion se fait sur l'écran de Torch.
   - On n'appelle aucune fonction de Torch qui ajoute le mot de passe à une requête. Dans `client.post`, cela exclut toute option `credential`.
   - Les seuls appels HTTP autorisés sont les suivants :
     - `client.post(url, form, {})` ou `client.post(url, form, { cookie: true })` ;
     - les GET publics (`mod1.xml`, `mod2.xml`) ;
     - la recherche `chatango.com/search` avec `credentials: 'include'`, comme le fait Torch ;
     - `POST https://vissle.me/track1/activity`, via le pont `GM_xmlhttpRequest` du loader, avec `anonymous: true`.
2. **Pas de trame Chatango inventée.** Chaque trame envoyée vient du code de Torch lui-même ou d'une bibliothèque de référence maintenue :
   - chadango (Go) : https://github.com/n0h4rt/chadango
   - chatango-lib (Python) : https://github.com/neokuze/chatango-lib
   - ch.py, plus ancienne : https://github.com/asl97/ch.py

   S'il n'y a pas de source, la fonction reste marquée « not wired » et l'interface le dit honnêtement.
3. **Aucun faux succès en mode live.** Une action qui n'est pas réellement envoyée doit être masquée, ou indiquer clairement qu'elle n'est pas disponible.
4. **Le HTML écrit par les membres (profils) n'est jamais injecté.**
   - Mini profil : reconstruction en éléments React d'une liste blanche de balises (`RichText`, dans `core.js`).
   - Profil complet : `iframe` `sandbox` sans `allow-scripts` ni `allow-same-origin`, avec une politique CSP en `<meta>` (`fullProfileDoc`).
5. **Pas de nouvelle dépendance sans validation explicite de l'utilisateur.** React 18.3.1 se charge depuis cdnjs avec SRI (empreintes vérifiées contre npm).
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

Tout est en JavaScript ES5 avec des appels `h = React.createElement`, sans JSX ni bundler. Les fichiers sont concaténés par le build.

| Fichier | Rôle |
|---|---|
| `proto/core.js` | Utilitaires, couleurs et contraste, données d'exemple, contexte React, `MenuButton`, `Dialog`, `Toasts`, `Portal` (calque `#layer`), `RichText`, `fullProfileDoc`, `APP_VERSION` |
| `proto/live.js` | **Le pont vers Torch** (`liveBridge`) : lecture des trames, envoi des trames, crochets sur les avertissements, surveillance des connexions, profils, recherche, historique privé, création de groupe, profil |
| `proto/views.js` | Écrans principaux : barre latérale, groupe, ligne de message, membres, fiche profil, profil complet, messages privés (Chats, Friends, Meet people), Discover, palette Ctrl K |
| `proto/settings.js` | Réglages utilisateur et réglages de groupe du prototype |
| `proto/live-ui.js` | Variantes live : réglages de groupe, rôles, bannis, journal, profil, confidentialité, compte, Premium |
| `proto/main.js` | Composant racine, état, actions, `handleLiveOp` (traduit les événements du pont en état), persistance locale |
| `proto/app.css` | Styles de l'application |
| `proto/skin-loader.js` | Userscript, côté bac à sable Tampermonkey : garde page d'accueil, injection du code page par `<script>` inline, pont vissle (`GM_xmlhttpRequest`) |
| `proto/skin-page.js` | Code page : anti double démarrage, démarre Torch, charge React (SRI), attend Torch, monte le Shadow DOM |
| `scripts/build_proto.py` | Produit `torch-prototype/torch-client.html` (prototype hébergé) et `torch-prototype/torch-skin.user.js` |
| `torchds/project/` | Design system : tokens, `components/bundle.js` (namespace `window.Torch`), CSS, types |
| `torch/project/` | Canevas de maquettes (11 écrans) |
| `tools/` | Tests jsdom |

**Mode live et mode prototype.** `LIVE = !!window.__TORCH_LIVE__`. Le même code sert le prototype hébergé (données simulées) et le userscript. Les écarts sont gardés par `if (LIVE)`. En live, les actions de `main.js` sont surchargées par celles du bloc « Mode live ».

## 5. Build et tests

```
python3 scripts/build_proto.py .
cd tools && pnpm install        # jsdom, react et react-dom 18.3.1
node smoke.js ..                # prototype hébergé
node live_ui.js ..              # mode live avec faux client Torch (98 étapes)
node loader.js ..               # userscript : démarrage de Torch, pages ignorées, double démarrage
node live_login.js ..           # détection de connexion
node avatar.js ..               # avatars
```

Tous ces tests doivent rester verts. `live_ui.js` simule un client Torch, enregistre chaque trame envoyée et vérifie leur format exact. Ajoute un cas de test pour chaque correctif.

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
  - Le pont envoie ensuite `getpresence:a;b` sur la connexion privée. Réponse `presence` : triplets nom, minutes d'inactivité, état.
- **Activité du profil (vissle).**
  - Transport : `POST https://vissle.me/track1/activity`, corps `JSON.stringify({action:'activity', profile, page, order, get})` en text/plain. Pas d'authentification (source : `vissle.me/js/track.js`).
  - Aucun en-tête CORS : la page ne peut pas lire la réponse avec `fetch`. D'où le pont `GM_xmlhttpRequest` dans le bac à sable du userscript, et l'application injectée dans la page par un `<script>` inline.
  - Réponse : `{get:[{user, name?, action, time, msg?}]}` ou `{error}` dans une réponse 200.
  - Pagination : 16 éléments par réponse, dont 15 affichés. Page suivante : `page` = `time` du dernier élément affiché.
  - `get` : `all|log|like|dislike|msg|refer`. `order` : `desc|asc`.
  - Pas de temps réel : le socket.io de vissle refuse l'origine st.chatango.com.
- **Mini profil.** `https://ust.chatango.com/profileimg/{a}/{b}/{nom}/mod1.xml`, avec les balises `b` (date de naissance), `s`, `l`, `body` (encodé URL) et `d` (fin du Premium). Profil complet : `mod2.xml`, balise `body`.
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

Les bits de drapeaux de groupe, de droits de modérateur et de canaux sont dans `live.js` (`GROUP_FLAG`, `PERM_FLAG`, `CHANNEL_FLAG`), relevés dans `chatango.flags` de Torch.

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
  - « Close » : croix sur la ligne ou menu. La conversation est retirée de la liste, l'historique est gardé. Elle reste fermée (champ `hidden` de `torch-skin:<pseudo>`) jusqu'à un MP entrant ou une réouverture manuelle ;
  - « Delete » : fermer, plus effacer la copie locale de Torch (`clearHistory`), avec confirmation.
- **Médias (groupes et MP) :** vidéos YouTube, images, photos MP. Ils suivent les réglages `embedImages`, `embedVideos` et `proxyMedia` (rien n'est chargé avant le clic). Les aperçus affichent « Video », « Image » ou « Photo ».
- **Meet people :** cartes de mini profil, fenêtre de filtres, étiquettes retirables, bouton Refresh.
- **Profils :** mini profil assaini, profil complet isolé, édition de son propre profil (âge, genre, lieu, bio, Meet people).
- **Création de groupe.**
- Favoris, sourdines, membres ignorés et conversations masquées conservés par compte dans `localStorage` (`torch-skin:<pseudo>`).
- Fenêtres, menus et notifications rendus dans un calque (`Portal`, `#layer`) pour ne pas déformer la mise en page.
- **Visitors :** activité de son propre profil (visites, likes, commentaires, parrainages) dans l'écran profil, avec filtres, pagination et Refresh.
- **Userscript :** deux contextes. L'application tourne dans la page, et seul le pont vissle tourne dans le bac à sable (`@grant GM_xmlhttpRequest`, `@connect vissle.me`). Démarrage automatique, page d'accueil seulement (`@noframes` et vérification `pathname === '/'`), pas de double démarrage, SRI sur React.

## 8. Ce qui reste ouvert

- **Taille de police des membres :** elle est lue, mais appliquée nulle part (ni en groupe ni en MP). Torch l'applique, avec 11 = 100 %, bornée entre 82 et 200 %.
- **Style écrasé par l'historique :** l'historique, de groupe comme de MP, fusionne de vieux styles dans l'utilisateur partagé, ce qui peut remplacer un style plus récent.
- **Médias :** `applyEdit` gère les embeds, mais un MP envoyé localement n'a pas d'embeds tant que l'historique n'est pas rechargé. Les annonces affichent leurs médias en texte.
- **Ton propre style :** il n'existe pas d'écran pour régler son propre style de message (police, taille, couleurs, gras, italique, souligné). Toute solution doit respecter la règle 1, donc aucun enregistrement qui ferait transiter le mot de passe.
- **Groupe :** titre, description et icône non modifiables. Aucune source fiable trouvée.
- **Profil :** photo de profil non modifiable, couleurs du profil complet non reproduites, fonds Premium des mini profils non reproduits.
- **Réglages de Torch :** les réglages propres à Torch (qui peut écrire, groupes rejoints au démarrage) restent dans Torch.
- **Sons :** ils sont joués par Torch, avec ses réglages. Les nôtres restent coupés en live pour éviter le double signal.
- **Polices de l'interface :** elles sont chargées depuis Google Fonts. L'utilisateur est sensible à la confidentialité, ce choix pourra être revu.
- **Mode lent :** `setratelimit:0` comme valeur « off » n'est pas confirmé.

## 9. Livrer une nouvelle version

1. Incrémenter `@version` dans `proto/skin-loader.js`. Le build l'injecte dans `APP_VERSION`.
2. `python3 scripts/build_proto.py .`, puis faire passer tous les tests.
3. Envoyer `torch-prototype/torch-skin.user.js` à l'utilisateur. Il remplace le contenu du script dans Tampermonkey.

## 10. Artefacts publiés (compte de l'utilisateur)

- Maquettes (Design) : https://claude.ai/artifact/JuDrFE7mapqwAzCDjcFeFQ
- Design system : https://claude.ai/artifact/ATzDF31PsVNFEYWmUWA3GW
- Prototype hébergé (données simulées) : https://claude.ai/artifact/D2Em5urvHC1FCpcmMmWHgH

Une nouvelle session peut les mettre à jour en passant leur adresse au publish, après les avoir relus.
