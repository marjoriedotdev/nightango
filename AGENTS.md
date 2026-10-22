# Torch Skin

Userscript Tampermonkey pour https://st.chatango.com/ : il démarre Torch (client Chatango tiers de vissle.me), laisse l'utilisateur se connecter sur l'écran de Torch, puis affiche une interface refaite (React 18 dans un Shadow DOM) branchée sur le client Torch vivant.
Le même code sert aussi un prototype hébergé à données simulées.
La version installée chez l'utilisateur est en usage réel : chaque livraison touche son compte Chatango.

## Règles non négociables

Les règles 1, 2, 4 et 6 ont leur ADR sous `docs/adr/`, lié en fin de règle. Les règles 3 et 5 n'en ont pas. Lis l'ADR avant toute modification qui s'en approche.

1. **Mot de passe hors de portée.** Notre code ne lit, ne stocke, ne journalise ni ne transmet jamais le mot de passe. La connexion se fait sur l'écran de Torch. N'appelle aucune fonction de Torch qui ajoute le mot de passe à une requête (dans `client.post`, aucune option `credential`). Les appels HTTP que notre code fait vers Chatango et vissle sont listés dans `docs/torch-protocol.md#appels-http-autorisés`, et cette liste est fermée. Les ressources chargées par le loader et l'interface (React, polices, script de Torch, médias, avatars) sont listées à part dans la même section. [ADR-0001](docs/adr/0001-password-never-read.md)
2. **Trame sourcée ou rien.** Chaque trame Chatango envoyée vient du code de Torch ou d'une bibliothèque de référence (chadango, chatango-lib, ch.py). Sans source, la fonction reste marquée « not wired » et l'interface le dit. [ADR-0002](docs/adr/0002-no-invented-frames.md)
3. **Aucun faux succès en live.** Une action qui n'est pas réellement envoyée est masquée ou affichée comme indisponible.
4. **HTML des membres reconstruit, jamais injecté.** Mini profil : `RichText` (liste blanche reconstruite en éléments React). Profil complet : `iframe` `sandbox` sans `allow-scripts` ni `allow-same-origin`, CSP en `<meta>` (`fullProfileDoc`). CSS de mini : parsé, jamais injecté. [ADR-0004](docs/adr/0004-member-html-never-injected.md)
5. **Dépendances figées.** Toute nouvelle dépendance attend la validation explicite de l'utilisateur. React 18.3.1 se charge depuis cdnjs avec SRI (empreintes vérifiées contre npm). Dépendances de développement validées : jsdom, react, react-dom (tests), esbuild (minification).
6. **Visiteurs : son propre profil seulement.** Le pont du loader ignore tout `profile` envoyé par la page et lit `client.user.name`. Aucune consultation de l'activité d'un autre profil. [ADR-0005](docs/adr/0005-visitors-own-profile-only.md)

Décisions qui en découlent et qu'il ne faut pas « corriger » :
- le style de message perso reste local au navigateur ([ADR-0006](docs/adr/0006-local-message-style.md)) ;
- les comptes liés (`/api/v1/who`) ne sont pas implémentés ([ADR-0007](docs/adr/0007-no-linked-accounts.md)) ;
- le loader tourne en deux contextes, bac à sable et page ([ADR-0003](docs/adr/0003-two-context-loader.md)).

## Préférences du projet

- **Plan court** avant tout changement qui touche plus de 2 ou 3 fichiers.
- **pnpm** uniquement, version figée par `packageManager` dans `package.json`. pnpm 10 bloque les scripts d'installation : `pnpm.onlyBuiltDependencies` autorise celui d'esbuild, un `postinstall` qui vérifie (et télécharge s'il manque) le binaire natif d'esbuild pour la plateforme.
- **Livrable au nom fixe** : `dist/torch-skin.min.user.js`, d'une version à l'autre. L'utilisateur le colle dans Tampermonkey à la place du script existant.
- **Tests : seulement le comportement complexe.** Pas de test par correctif. [ADR-0009](docs/adr/0009-test-only-complex-behaviour.md)
- **Interface et logs en anglais**, ton du design system (`torchds/project/README.md`, section Content fundamentals).

Conventions de code détaillées : `docs/coding-conventions.md`. Lis-le avant d'écrire du code dans `src/` ou `tests/`.

## Commandes

```
pnpm install          # devDependencies : jsdom, react, react-dom, esbuild
pnpm build            # écrit dist/ et affiche la taille de chaque sortie
pnpm test             # build puis toutes les suites
pnpm test live_ui     # build puis les suites nommées seulement
pnpm build:ds         # régénère README.md et preview.html des composants du design system
```

Sorties de `pnpm build` (non versionnées) :
- `dist/torch-skin.min.user.js` : le livrable, minifié par esbuild ;
- `dist/torch-skin.user.js` : même assemblage, lisible, pour le débogage et l'audit ;
- `dist/torch-client.html` et `dist/app.js` : prototype hébergé.

Seule la suite `loader` exécute les userscripts, les deux. Les autres lisent `dist/torch-client.html`, `dist/app.js`, les sources de `src/bridge/` ou le bundle du design system (détail dans `docs/architecture.md`, section Tests).

Le lanceur `tests/run.mjs` juge chaque suite sur son code de sortie et sur sa sortie (lignes `FAIL`, `CRASH`, `ERRORS:` non vide) : certaines suites sortent en 0 malgré un échec. Lis la sortie, pas seulement le code retour.

## Livrer une version

1. Incrémente `@version` dans l'en-tête de `src/loader/skin-loader.js`. Le build l'injecte dans `APP_VERSION`.
2. Lance `pnpm test` : toutes les suites vertes, build compris.
3. Livre `dist/torch-skin.min.user.js`, le seul fichier que l'utilisateur installe, par l'un des deux chemins :
   - envoi direct du fichier à l'utilisateur ;
   - tag : `git tag vX.Y.Z` (même numéro que `@version`), puis `git push origin vX.Y.Z`. Le workflow `.github/workflows/release.yml` rejoue les tests, refuse un tag qui ne correspond pas à `@version`, puis crée la release GitHub avec les deux userscripts attachés.

La CI (`.github/workflows/ci.yml`) lance `pnpm test` sur chaque push et pull request vers `main`.

## Carte des docs

- `GLOSSARY.md` : vocabulaire du domaine (Torch, pont, trame, MP, mini profil, présence...). Lis-le avant de nommer un concept dans du code, une issue ou un test.
- `docs/architecture.md` : rôle de chaque dossier de `src/`, ordre de concaténation, contextes du loader, live / prototype, état React, Shadow DOM, design system, tests. Lis-le avant d'ajouter un fichier ou de toucher au build.
- `docs/torch-protocol.md` : fonctionnement de Torch et de Chatango vérifié dans leur code, trames avec leur source, formats de présence, endpoints autorisés, fichiers publics, vissle. Lis-le avant d'envoyer ou de lire une trame, d'appeler un endpoint ou de toucher au pont.
- `reference/torch/` : copie en lecture seule du code de Torch (licence MIT), téléchargée le 2026-10-19. Les références `inject.js:NNNN` des docs renvoient à cette copie. Ne la modifie jamais et ne la charge ni dans le build ni dans les tests (voir son `README.md`).
- `docs/coding-conventions.md` : style ES5, commentaires, textes, état, tests, design system, interdits.
- `docs/adr/` : décisions et leur motif.
- `README.md` : présentation pour un humain, installation dans Tampermonkey.

## Agent skills

### Issue tracker

Issues sur GitHub, dépôt privé `marjoriedotdev/nightango`, via le CLI `gh`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context : `GLOSSARY.md` et `docs/adr/` à la racine. See `docs/agents/domain.md`.
