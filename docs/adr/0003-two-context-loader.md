---
status: accepted
date: 2026-10
---

# Loader en deux contextes : bac à sable et page

## Contexte

Tampermonkey exécute un userscript qui demande des `@grant` dans un bac à sable isolé : il ne voit ni les objets globaux de BetterChatango (`client`, `chatango`, `sidebar`, `torch`) ni le React chargé dans la page. Par ailleurs, `vissle.me/track1/activity` n'envoie aucun en-tête CORS : depuis la page st.chatango.com, `fetch` ne peut pas lire sa réponse.

## Décision

Le userscript se découpe en deux contextes :

- `skin-loader.js` reste dans le bac à sable. Il ne contient que la garde de page d'accueil et le pont vissle, qui appelle `GM_xmlhttpRequest` (`@connect vissle.me`, `anonymous: true`).
- Tout le reste (`skin-page.js`, le design system, l'application) est injecté dans la page par un `<script>` inline dont le `textContent` est un littéral de chaîne JSON. Il y voit BetterChatango directement.
- Les deux contextes communiquent par `CustomEvent` sur `document` (`torch-skin:vissle-request` et `torch-skin:vissle-response`).

## Conséquences

- Le code page n'a aucun privilège Tampermonkey. Le seul accès privilégié est l'appel vissle, et son profil est fixé par le loader ([ADR-0005](0005-visitors-own-profile-only.md)).
- Le code injecté ne doit jamais contenir `</script` : le build le vérifie.
- `unsafeWindow` ne sert qu'à lire le nom du compte connecté.
