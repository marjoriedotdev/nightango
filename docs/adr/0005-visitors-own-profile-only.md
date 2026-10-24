---
status: accepted
date: 2026-10
---

# Visiteurs : seulement son propre profil

## Contexte

Le tracker vissle (`track1/activity`) n'a pas d'authentification : il répond pour n'importe quel profil. Torch propose déjà la fonction de façon native pour le compte connecté : l'utilisateur installe le tracker par « Add profile tracker », et le panneau « track » de Torch l'affiche. Consulter l'activité du profil d'un autre membre serait de la surveillance de tiers.

## Décision

La section Visitors n'affiche que l'activité du profil de l'utilisateur connecté, comme Torch. Le pont du loader ignore tout `profile` envoyé par la page et lit `client.user.name` dans la session Torch. Aucune consultation de l'activité d'un autre profil n'est ajoutée.

## Conséquences

- Même un code page compromis ne peut pas interroger un autre profil par le pont.
- La section reste vide tant que l'utilisateur n'a pas installé le tracker.
