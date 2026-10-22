---
status: accepted
date: 2026-10
---

# Tests : seulement le comportement complexe

## Contexte

La règle précédente demandait un cas de test pour chaque correctif. L'utilisateur a choisi de limiter les tests au comportement complexe. Un test qui fige un détail d'interface coûte en maintenance sans protéger de comportement réel.

## Décision

Un test ne s'écrit que pour un comportement complexe : format exact d'une trame, pagination, présence, fusion de l'historique, démarrage du loader, assainissement du contenu des membres. Chaque nouveau test est vu en échec avant le code qu'il protège. Pas de test par correctif par défaut.

## Conséquences

- Remplace la règle « un cas de test pour chaque correctif » de l'ancien document de passation.
- Un correctif simple se vérifie par les suites existantes et par l'utilisateur dans Tampermonkey.
