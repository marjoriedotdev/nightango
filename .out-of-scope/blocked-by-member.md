# Savoir si un membre nous a bloqués

Nightango ne cherche pas à savoir si un correspondant a bloqué l'utilisateur. La conversation privée affiche la présence que Chatango renvoie, sans autre déduction.

## Pourquoi c'est hors périmètre

BetterChatango le devine avec son réglage `check_block` (coupé par défaut, `inject.js:9691`). Quand un correspondant de sa liste récente répond `offline` à `connect:{nom}`, il appelle `GET https://api.vissle.me/v1/profile/{nom}?get=status&verify=false` et compare l'horodatage de statut que vissle connaît pour ce membre à celui de sa liste. S'ils diffèrent, il marque le membre comme nous bloquant (`inject.js:4142-4157`).

C'est une lecture de l'état d'un autre profil, chez un tiers, à l'insu du membre visé. Le propriétaire l'a exclue le 2026-10-23 : elle va contre l'esprit d'[ADR-0005](../docs/adr/0005-visitors-own-profile-only.md), qui limite toute consultation d'activité au profil de l'utilisateur connecté. L'appel reste donc hors de la liste fermée des appels HTTP autorisés ([ADR-0001](../docs/adr/0001-password-never-read.md)).

En live, l'appel ne part pas non plus de BetterChatango : le pont n'appelle pas le gestionnaire `connect` de BetterChatango, qui le contient (voir `docs/betterchatango-protocol.md`, Présence des amis).

## Ce qui rouvrirait la question

Un moyen de savoir si l'on est bloqué qui ne lise que l'état de son propre compte, par exemple une trame Chatango de refus trouvée dans le code de BetterChatango ou d'une bibliothèque de référence (chadango, chatango-lib, ch.py), ou une décision du propriétaire qui revienne sur ADR-0005.

## Sources consultées (2026-10-23)

- `reference/torch/inject.js` (copie du 2026-10-19) : gestionnaire `connect` de la table `private` (`inject.js:4120-4166`, appel `inject.js:4142-4157`), défaut du réglage `check_block` (`inject.js:9691`).

## Prior requests

- #96 : « chore(protocol): arbitrer les appels de BetterChatango hors de la liste fermée »
