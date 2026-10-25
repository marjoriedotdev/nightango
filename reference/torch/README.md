# Copie de référence de Torch

Code du client Torch tel que servi par vissle.me, téléchargé le 2026-10-19. Licence MIT, copyright Vissle Drissle (voir `LICENSE`).

## Statut

Lecture seule :

- ne jamais modifier ces fichiers, même pour corriger une faute ou reformater
- ne jamais les charger dans le build (`scripts/build.mjs`) ni dans les tests (`tests/`)
- ne jamais les exécuter

Pour une version plus récente, remplacer les quatre fichiers ensemble, puis mettre à jour la date, les empreintes et les références `inject.js:NNNN` des docs.

## Usage

- Vérifier un comportement de Torch avant de s'appuyer dessus dans le pont.
- Servir de cible aux références `fichier:ligne` des docs (`docs/betterchatango-protocol.md`, `docs/adr/`). Exemple : `inject.js:7452` renvoie à la ligne 7452 de `inject.js` ici.

## Fichiers

- `start.js` : script du favori, `https://vissle.me/client/start`
- `client.html` : page du client, `https://vissle.me/client`
- `inject.js` : code du client, `https://vissle.me/client/inject`
- `client.css` : feuille du client, `https://vissle.me/css/client.css`
- `LICENSE` : texte exact de `https://github.com/Vissle-Drissle/Torch-Client/blob/main/LICENSE` (commit `fae3c7f547ce9819f105a2c4931f5dbdb7f802c0`)

Le footer de `client.html` cite la licence MIT (`opensource.org/licenses/MIT`) et renvoie au dépôt `https://github.com/Vissle-Drissle/Torch-Client`. Ce dépôt ne contient que le fichier `LICENSE` : le code n'est publié que sur vissle.me.

Les scripts du tracker de profil (`vissle.me/js/track.js` et les pages `/track`) ne sont pas copiés. Ils ne font pas partie du client Torch et aucune licence connue ne les couvre.

## Empreintes SHA-256

```
20767031c75c82acbd4916611bb65646667ab1352b210b4f29c76e485f86fb7c  start.js
61b63885afcb43bc8f7d45c65bf5b6a517cb737a8a36ee4fc79ce20aae458bf5  inject.js
4bf65a4b811f07ca3a6b1e86185984dee81749b0dc2a314868e760f7e33d5730  client.html
d7bce017a486ffb299f785698c755636338a429b1f3624ceeaa86741cbc18fd0  client.css
e2917d4f0934dbe6d6a94eef8e411a1fcd6796ef4ed73cabd95a92f13bec3bbf  LICENSE
```
