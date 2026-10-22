---
status: accepted
date: 2026-10
---

# Le HTML des membres n'est jamais injecté

## Contexte

Les profils Chatango contiennent du HTML et du CSS écrits par leurs membres (`mod1.xml`, `mod2.xml`, `custom_profile.css`). L'application tourne dans la page de Torch, à côté de la session Chatango : un HTML injecté pourrait exécuter du script, lire la page ou exfiltrer des données. Un CSS injecté pourrait déformer l'interface ou charger des ressources qui trahissent l'utilisateur.

## Décision

- Mini profil : `RichText` (`src/core/rich-text.js`) reconstruit une liste blanche de balises en éléments React.
- Profil complet : `fullProfileDoc` le rend dans une `iframe` `sandbox` sans `allow-scripts` ni `allow-same-origin`, avec une politique CSP en `<meta>`.
- Fond Premium : `custom_profile.css` est parsé par `parseMiniCss`, qui n'en garde que des couleurs en hex et une image `https`. Le CSS lui-même n'est jamais injecté.

## Conséquences

- Les profils complets ne sont pas reproduits à l'identique (couleurs propres au profil complet absentes).
- L'image de fond Premium est une `<img>` en `referrerPolicy="no-referrer"`. `background-repeat` n'est pas reproduit, car un fond CSS enverrait le referrer.
- Une balise ou une propriété nouvelle s'ajoute à la liste blanche, jamais par un passage en HTML brut.
