---
status: accepted
date: 2026-10
---

# Non-lus des MP lus dans l'historique privé

## Contexte

Deux compteurs de non-lus coexistaient pour une conversation : le drapeau `unread` de chaque entrée de la base d'historique de Torch, et `unread` dans l'état de `Root`. Le second montait de 1 à chaque MP reçu, revenait à 0 à la lecture et se recalait à chaque `OK` sur les entrées que ne couvrait aucun message affiché. Sept endroits de `app/root.js` l'écrivaient, et le correctif `1d1022d` (non-lus gardés au rechargement) a dû toucher huit fichiers pour garder les deux d'accord.

## Décision

Décision du propriétaire du 2026-10-24 (revue d'architecture, candidat 01) : la base d'historique de Torch est la seule source des non-lus. Le compte d'une conversation est le nombre de ses entrées non lues, sans les modifications de MP, que Torch archive à part. L'état n'en garde qu'une copie pour le rendu, que seul `app/pm.js` écrit, toujours en la relisant dans l'archive après une écriture, jamais par incrément. Le prototype, et le live dans un navigateur sans base, utilisent une archive en mémoire de même interface.

## Conséquences

- Un badge apparaît quelques millisecondes après l'archivage du MP par Torch, et disparaît de même après la lecture.
- Sans base (navigation privée, quota), les non-lus ne survivent pas au rechargement, comme l'historique lui-même. Un bandeau le dit en tête de Chats.
- Réintroduire un compteur incrémenté dans l'état, ou en garder un ailleurs, rouvre cette décision.
