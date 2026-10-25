---
status: accepted
date: 2026-10
---

# Le mot de passe n'est jamais lu ni transmis

## Contexte

Torch Skin s'exécute dans la page de Torch, qui connaît le mot de passe Chatango de l'utilisateur. Plusieurs fonctions de Torch l'ajoutent d'elles-mêmes aux requêtes : l'option `credential` de `client.post`, et le formulaire de style `updatemsgstyles`. Un userscript qui touche au mot de passe devient un vecteur de vol d'identifiants, et l'utilisateur ne pourrait plus l'auditer en confiance.

## Décision

Notre code ne lit, ne stocke, ne journalise ni ne transmet jamais le mot de passe. La connexion se fait sur l'écran de Torch. Aucun appel à une fonction de Torch qui ajoute le mot de passe à une requête. Les seuls appels HTTP autorisés sont ceux de `docs/betterchatango-protocol.md#appels-http-autorisés` :

- `client.post(url, form, {})` vers `chatango.com` seulement, car Torch ajoute sans option le jeton `s` vers tout hôte de sa liste, ou `client.post(url, form, { cookie: true })`, jamais `credential` ;
- `client.post('https://vissle.me/chatango/upload', form, { key: true })`, cette URL seulement et jamais avec `progress` : Torch y ajoute la clé de session vissle, jamais le mot de passe ;
- `GET https://api.vissle.me/v1/pmr/{nom}` par `fetch`, sans cookie ni credential, pour le compte connecté (`client.user.name`) et seulement si `check_pmr` est actif ;
- `GET https://vissle.me/api/v1/who/{nom}` par `fetch`, sans cookie ni credential, `{nom}` validé par `ACCOUNT_NAME`, un appel par clic sur « Who is this » : comptes liés, source `inject.js:7452-7477` ([ADR-0010](0010-linked-accounts-on-request.md)) ;
- les GET publics `mod1.xml`, `mod2.xml`, `custom_profile.css`, `msgbg.xml` (fond de message, dont l'image `msgbg.jpg` est une ressource chargée en `<img>` `no-referrer`) ;
- `chatango.com/search` avec `credentials: 'include'`, comme Torch ;
- `POST https://vissle.me/track1/activity` par `GM_xmlhttpRequest`, `anonymous: true`.

## Conséquences

- Toute fonction Chatango qui exige le mot de passe est hors de portée. Le style de message perso n'est donc pas enregistré sur le compte ([ADR-0006](0006-local-message-style.md)).
- Ajouter un endpoint à la liste demande de vérifier dans le code de Torch qu'il ne transporte pas le mot de passe.
- Décision du propriétaire du 2026-10-23 (#96) : l'envoi de fichiers par vissle (`{ key: true }`) et la restriction des MP de son propre compte (`v1/pmr`) entrent dans la liste, `client.post` sans option ne vise que `chatango.com`, et `check_block` (`v1/profile/{nom}?get=status`) reste exclu ([note hors périmètre](../../.out-of-scope/blocked-by-member.md)).
