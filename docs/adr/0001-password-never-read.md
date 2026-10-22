---
status: accepted
date: 2026-10
---

# Le mot de passe n'est jamais lu ni transmis

## Contexte

Torch Skin s'exécute dans la page de Torch, qui connaît le mot de passe Chatango de l'utilisateur. Plusieurs fonctions de Torch l'ajoutent d'elles-mêmes aux requêtes : l'option `credential` de `client.post`, et le formulaire de style `updatemsgstyles`. Un userscript qui touche au mot de passe devient un vecteur de vol d'identifiants, et l'utilisateur ne pourrait plus l'auditer en confiance.

## Décision

Notre code ne lit, ne stocke, ne journalise ni ne transmet jamais le mot de passe. La connexion se fait sur l'écran de Torch. Aucun appel à une fonction de Torch qui ajoute le mot de passe à une requête. Les seuls appels HTTP autorisés sont ceux de `docs/torch-protocol.md#appels-http-autorisés` :

- `client.post(url, form, {})` ou `client.post(url, form, { cookie: true })`, jamais `credential` ;
- les GET publics `mod1.xml`, `mod2.xml`, `custom_profile.css` ;
- `chatango.com/search` avec `credentials: 'include'`, comme Torch ;
- `POST https://vissle.me/track1/activity` par `GM_xmlhttpRequest`, `anonymous: true`.

## Conséquences

- Toute fonction Chatango qui exige le mot de passe est hors de portée. Le style de message perso n'est donc pas enregistré sur le compte ([ADR-0006](0006-local-message-style.md)).
- Ajouter un endpoint à la liste demande de vérifier dans le code de Torch qu'il ne transporte pas le mot de passe.
