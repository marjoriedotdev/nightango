---
status: accepted
date: 2026-10
---

# Pas de trame Chatango inventée

## Contexte

Le protocole Chatango n'est pas documenté. Une trame devinée peut être ignorée sans erreur ou produire un effet différent de celui attendu sur un groupe réel. L'utilisateur se sert de Torch Skin sur son vrai compte, avec des droits de modération.

## Décision

Chaque trame envoyée vient du code de Torch lui-même ou d'une bibliothèque de référence maintenue :

- chadango (Go) : https://github.com/n0h4rt/chadango
- chatango-lib (Python) : https://github.com/neokuze/chatango-lib
- ch.py (plus ancienne) : https://github.com/asl97/ch.py

Sans source, la fonction reste marquée « not wired » et l'interface le dit honnêtement. Une action qui n'est pas réellement envoyée est masquée ou indiquée comme indisponible : jamais de faux succès en live.

## Conséquences

- Certaines fonctions restent indisponibles faute de source (titre, description et icône de groupe, photo de profil).
- Une source moins fiable (script Pastebin, par exemple) est signalée à côté de la trame dans `docs/torch-protocol.md`.
- `live_ui` vérifie le format exact de chaque trame envoyée.
