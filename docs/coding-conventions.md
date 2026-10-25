# Conventions de code

## JavaScript

- Identifiants de code en anglais (variables, fonctions, fichiers, clés d'état). Seuls les commentaires sont en français.
- Tout le code de `src/` est en ES5 : `var`, fonctions, pas de flèches ni de classes.
- Les éléments se créent par `h = React.createElement`. Pas de JSX, pas de bundler.
- Les composants du design system s'appellent par `T.<Composant>` (namespace `window.Torch`).
- Un nouveau fichier s'ajoute à `APP_SOURCES` dans `scripts/build.mjs`, à sa place dans l'ordre de concaténation (voir `docs/architecture.md`).
- Le code propre au live se garde par `if (LIVE)`. Le prototype et le live partagent tout le reste.
- Les scripts Node (`scripts/`, `tests/run.mjs`) sont en JavaScript moderne (modules ES).

## Partage

- Zéro duplication dès le deuxième usage : une constante, un helper ou un petit composant que le changement copierait d'un fichier à l'autre se partage tout de suite, dans `src/core/` ou dans le fichier du domaine concerné.
- Une duplication déjà présente, repérée au passage, se signale en suivi au lieu d'être corrigée dans le même changement.

## Commentaires

- Un commentaire n'existe que pour un piège qui ferait « corriger » le code par erreur. Exemple : `// Masquage en style inline : la feuille de BetterChatango peut annuler l'attribut hidden.`
- Commentaires en français. Un `//` tient sur une ligne.
- Les fonctions des scripts Node ont un JSDoc multiligne : résumé `Permet de <verbe> <objet>.` et un `@param` par paramètre.
- Sections en bandeaux `// -- Nom ----` jusqu'à la colonne 80.
- Pas d'em-dash ni de point-virgule dans le texte des commentaires.

## Textes

- Textes d'interface et logs en anglais.
- Les logs de la console commencent par `[torch-skin]`.
- Le ton suit la charte du design system (`torchds/project/README.md`, section Content fundamentals) : sentence case, boutons qui commencent par un verbe, erreurs qui disent quoi faire.
- Une action non disponible en live le dit clairement ou disparaît. Jamais de faux succès.

## État

- L'état de `Root` reste sérialisable en JSON : `update` le clone par `JSON.parse(JSON.stringify(...))`. Pas de fonction, de `Date`, de `Map` ni de nœud DOM dans l'état.
- Les données propres au compte vont dans `torch-skin:<pseudo>`, les préférences dans `torch-prototype-prefs`.

## Guards

- Pas de guard spéculatif. Le chemin natif s'écrit d'abord, un guard ne s'ajoute qu'après un problème observé.
- Les états d'interface (chargement, vide, erreur) font partie de la spec et ne sont pas des guards.

## Tests

- Les suites sont des scripts jsdom dans `tests/`, lancés par `pnpm test`.
- Politique : seulement le comportement complexe ([ADR-0009](adr/0009-test-only-complex-behaviour.md)). Exemples : format exact des trames, pagination, présence, fusion de l'historique, démarrage du loader.
- Chaque nouveau test est vu en échec avant le correctif ou la fonctionnalité qu'il protège.
- `live_ui` échoue sur tout warning React non filtré. Seuls `act(`, `ReactDOM.render`, `useLayoutEffect` et les logs `[torch-skin]` sont tolérés.
- Une suite signale un échec par une ligne `FAIL`, `CRASH` ou `ERRORS:` non vide, même quand elle sort en 0.

## Design system

- `torchds/project/components/bundle.js` et `bundle.css` sont maintenus à la main.
- La doc des composants (`README.md`, `preview.html`) se régénère par `pnpm build:ds`. Ne l'édite pas à la main.
- Un écran se construit avec les jetons et les composants `Torch`, jamais avec des valeurs codées en dur.

## Commits

- Conventional Commits, sujet seul sur une ligne : `type(scope): sujet`, sans body.
- Un commit par changement logique.

## Ce qu'il ne faut jamais faire

- Lire, stocker, journaliser ou transmettre le mot de passe, ou appeler une fonction de BetterChatango qui l'ajoute à une requête ([ADR-0001](adr/0001-password-never-read.md)).
- Envoyer une trame Chatango sans source dans BetterChatango ou dans une bibliothèque de référence ([ADR-0002](adr/0002-no-invented-frames.md)).
- Faire, depuis le code applicatif, un appel HTTP vers Chatango ou vissle hors de la liste fermée de `docs/betterchatango-protocol.md` (section Appels HTTP autorisés).
- Ajouter une ressource chargée par le loader ou l'interface (script, feuille, police, iframe) hors de la liste de la même section sans validation de l'utilisateur.
- Injecter du HTML ou du CSS écrit par un membre ([ADR-0004](adr/0004-member-html-never-injected.md)).
- Consulter l'activité d'un autre profil que celui de l'utilisateur connecté ([ADR-0005](adr/0005-visitors-own-profile-only.md)).
- Ajouter une dépendance sans validation explicite de l'utilisateur.
- Charger un média ou l'oEmbed YouTube avant le clic quand les réglages de médias le demandent.
