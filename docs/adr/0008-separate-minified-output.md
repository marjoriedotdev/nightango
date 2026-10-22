---
status: accepted
date: 2026-10
---

# Sortie minifiée esbuild séparée, version lisible conservée

## Contexte

Le userscript embarque le design system, l'application et les feuilles de style. L'utilisateur installe une version minifiée depuis la 0.8.1. Une version minifiée seule rendrait le livrable impossible à relire, alors que ce qui tourne à côté de la session Chatango doit pouvoir être audité.

## Décision

Le build produit deux userscripts depuis la même fonction `userscript()` de `scripts/build.mjs` :

- `dist/torch-skin.min.user.js` : le livrable, au nom fixe d'une version à l'autre. esbuild (`transform`, cible ES5, `minify`) s'applique au code page, au code du loader et aux deux feuilles. L'en-tête `==UserScript==` est recopié tel quel, sans source map ;
- `dist/torch-skin.user.js` : version lisible, inchangée, pour le débogage et l'audit.

esbuild ne sert qu'à la minification : la concaténation reste celle de `build.mjs`, sans bundler.

## Conséquences

- La suite `loader` joue sur les deux userscripts. C'est la seule qui les exécute : les autres lisent `dist/torch-client.html`, `dist/app.js`, les sources de `src/bridge/` ou le bundle du design system.
- esbuild est une dépendance de développement validée. pnpm 10 bloque son script d'installation par défaut, d'où `pnpm.onlyBuiltDependencies` dans `package.json`. Ce `postinstall` vérifie que le binaire natif d'esbuild propre à la plateforme est présent et à la bonne version, et le télécharge s'il manque.
