---
status: accepted
date: 2026-10
---

# Style de message perso local seulement

## Contexte

L'utilisateur choisit police, taille, couleurs du texte et du nom, gras, italique et souligné pour ses messages. Chatango enregistre ce style sur le compte par le formulaire de style de Torch (`updatemsgstyles`), qui transmet le mot de passe.

## Décision

Le style perso reste local au navigateur, dans `torch-skin:<pseudo>` (champ `style`). Il est écrit dans les champs de style de Torch (formulaire `msgstyles`) juste avant chaque envoi, et n'est jamais enregistré chez Chatango. « Use account style » rétablit le style du compte. Motif : [ADR-0001](0001-password-never-read.md).

## Conséquences

- Le style perso ne suit pas l'utilisateur sur un autre navigateur ou un autre client.
- Revenir sur cette décision demande une voie d'enregistrement qui ne transporte pas le mot de passe, vérifiée dans une source de référence.
