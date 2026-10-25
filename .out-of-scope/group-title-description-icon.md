# Modifier le titre, la description ou l'icône d'un groupe

Nightango ne modifie ni le titre, ni la description, ni l'icône d'un groupe. Les réglages de groupe les affichent en lecture seule.

## Pourquoi c'est hors périmètre

Aucune voie d'écriture ne respecte à la fois [ADR-0001](../docs/adr/0001-password-never-read.md) (le mot de passe n'est jamais transmis) et [ADR-0002](../docs/adr/0002-no-invented-frames.md) (aucune trame inventée).

**Titre et description.** Aucune trame socket d'écriture n'existe dans BetterChatango, chadango, chatango-lib ni ch.py. Le côté lecture est connu (`updgroupinfo:{titre}:{desc}`, reçu par BetterChatango et chadango). Le serveur sait modifier un groupe (modaction `egrp`, « edited group », dans chadango), mais la seule écriture trouvée est un POST HTTP du fork megach (GPL, hors bibliothèques de référence) :

```
POST http://chatango.com/updategroupprofile
erase=0&l=1&d={desc}&n={titre}&u={groupe}&lo={login}&p={mot de passe}&origin=st.chatango.com
```

Il exige le mot de passe (`p`) : exclu par ADR-0001. BetterChatango ne l'appelle pas (son bouton Save de la section Information n'a pas de gestionnaire), et `client.post` de BetterChatango refuse cet endpoint (hors de sa liste blanche). Aucune variante au jeton ou au cookie n'a été trouvée.

**Icône.** Ce que BetterChatango appelle icône de groupe n'est pas une fonction Chatango : c'est une fonction vissle, réservée aux groupes enregistrés chez vissle, envoyée vers `vissle.me/chatango/updateavatar` et `updateprofile` avec la clé de session vissle (`{ key: true }`), et affichée seulement dans BetterChatango. L'endpoint ne figure pas dans la liste fermée des appels autorisés, où l'option `key` ne vaut que pour l'envoi de fichiers (`vissle.me/chatango/upload`, #96).

## Ce qui rouvrirait la question

Une trame ou un appel sans mot de passe, trouvé dans le code de BetterChatango ou d'une bibliothèque de référence (chadango, chatango-lib, ch.py).

## Sources consultées (2026-10-22)

- `reference/torch/inject.js` et `client.html` (copie du 2026-10-19).
- chadango @ d53b02a : `group.go` (`updgroupinfo`), `models/modaction.go` (`egrp`).
- chatango-lib @ 49a6dfa, ch.py @ b3c64da : rien.
- LinkkG/megach @ 6aace67 : `update_info` (`updategroupprofile`, avec mot de passe).
- `gh search code` et recherche web : `updategroupprofile`, `updgroupinfo`, `ownr_msg`.

## Prior requests

- #5 : « feat(group): modifier titre, description et icône du groupe »
