---
status: accepted
date: 2026-10
---

# Journal de diagnostic local, sans contenu

## Contexte

Le propriétaire perd souvent la connexion à des groupes ou aux MP sur mobile, sans accès aux outils de développement. Il demande, le 2026-10-24, de journaliser tout ce qui peut l'être et de lire le journal dans l'interface.

Le réglage « Debug mode » de BetterChatango n'a aucun effet : `mode_debug` n'est lu nulle part (`reference/torch/inject.js:9635`). La console de BetterChatango, elle, écrit sans condition le texte des MP reçus (`inject.js:4055`), des trames brutes et des réglages du compte. Elle ne donne ni le code de fermeture d'un socket ni le moment où le navigateur a suspendu la page. Enfin, la trame d'authentification de groupe porte le mot de passe en clair (`bauth`, `inject.js:5618`).

## Décision

Torch Skin tient son propre journal, posé par le code page avant le démarrage de BetterChatango (`src/loader/skin-journal.js`) et exposé à l'application par `window.__TORCH_JOURNAL__`. Il est montré dans Settings, Diagnostics, qui permet de le copier, le télécharger ou l'effacer.

Il enregistre :

- les sockets créés dans la page (constructeur `WebSocket` enveloppé) : cible, serveur, ouverture, erreur, nom des trames de session et de refus reçues (`OK`, `inited`, `kickingoff`, `DENIED`...), fermeture avec code, durée de vie, nombre de trames reçues, délai depuis la dernière, visibilité de la page et état du réseau ;
- la vie de la page : visibilité, `pagehide`, `pageshow`, `freeze`, `resume`, réseau, minuteurs suspendus ;
- les erreurs non rattrapées ;
- dans la console : les lignes `[torch-skin]`, les lignes de connexion de BetterChatango (liste fermée) et les objets `Error` ;
- côté pont : tentatives de connexion et leur issue, changements d'état observés, avertissements de BetterChatango affichés.

Il n'enregistre jamais :

- ce qui part par un socket : `send` n'est pas observé, l'authentification porte le mot de passe ([ADR-0001](0001-password-never-read.md)) ;
- les arguments d'une trame reçue, donc ni texte de message ni nom de correspondant ;
- le reste de la console de BetterChatango ;
- la réponse de `/api/v1/who` ([ADR-0010](0010-linked-accounts-on-request.md)).

Le journal garde les 1 000 derniers événements dans `localStorage` (`torch-skin:journal`), pour survivre au rechargement qui suit souvent une coupure sur mobile. Il ne quitte jamais le navigateur : aucun envoi, l'utilisateur le copie lui-même.

## Conséquences

- Les lignes de la console attribuent leur origine à l'enveloppe du journal dans les outils de développement. La pile d'appels reste exacte.
- Observer les envois, garder les arguments d'une trame ou élargir la capture de la console rouvre cette décision avec le propriétaire.
- Une nouvelle ligne de connexion de BetterChatango entre dans la liste fermée avec sa référence `inject.js`.
