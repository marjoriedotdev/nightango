# Fond Premium répété dans le mini profil

Dans le mini profil (fiche About), l'image de fond Premium s'affiche en bandeau de 120 px (`object-fit: cover`) au-dessus du texte, qui reste sur la couleur de fond unie. Sa répétition (`background-repeat` de `custom_profile.css`) n'est pas reproduite, et l'image n'est pas placée derrière le texte. Les cartes Meet n'affichent que la couleur.

## Pourquoi c'est hors périmètre

Le CSS du membre n'est jamais injecté ([ADR-0004](../docs/adr/0004-member-html-never-injected.md)), et l'image doit partir sans referrer. Dans le Shadow DOM de l'application, un fond CSS (`background-image`) suit la politique referrer de la page st.chatango.com, que Nightango ne contrôle pas : poser une `<meta name="referrer">` sur la page changerait le referrer de toutes les requêtes de Torch et de Chatango.

Les techniques qui respecteraient la contrainte coûtent plus qu'elles ne rapportent pour une fiche de quelques lignes :

- une grille de `<img referrerPolicy="no-referrer">` en tuiles, dimensionnée sur `naturalWidth` / `naturalHeight`, derrière un voile de la couleur de fond pour garder le contraste ;
- un `<canvas>` avec `createPattern`, à redimensionner et à adapter au DPR.

Le fond complet, répétition comprise, est reproduit là où il a sa place : le profil complet, dans l'iframe isolée qui porte sa propre politique `no-referrer` (#7).

## Ce qui rouvrirait la question

Un moyen natif d'appliquer `no-referrer` à un fond CSS dans un shadow root, sans toucher à la page.

## Prior requests

- #8 : « feat(profile): répétition du fond Premium sans referrer »
