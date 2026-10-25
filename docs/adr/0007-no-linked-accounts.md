---
status: superseded by ADR-0010
date: 2026-10
---

Remplacée le 2026-10-23 par [ADR-0010](0010-linked-accounts-on-request.md) : les comptes liés sont proposés comme dans BetterChatango, montrés à l'utilisateur seul.

# Comptes liés non implémentés

## Contexte

Un endpoint `/api/v1/who` renvoie les comptes liés à un membre, c'est-à-dire ses comptes secondaires déduits de son adresse IP. La fonction aurait pu s'afficher sur la fiche profil.

Source : `reference/torch/inject.js:7452-7477`, action « who » du menu des messages (`inject.js:8132-8138`), aussi proposée par le bouton « More » d'une fiche membre (`inject.js:782`). BetterChatango appelle ``fetch(`${torch.domain}/api/v1/who/${data.username}`)``, avec `torch.domain` = `https://vissle.me` (`inject.js:2911`). La réponse regroupe les comptes par niveau de rapprochement : `definite`, `linked`, `strong`, `medium` et `weak`. BetterChatango affiche le total puis chaque niveau non vide dans un `systemMessage`. Le code client ne dit pas comment vissle calcule ces niveaux : le rapprochement par adresse IP, dont le niveau `linked`, n'est pas vérifiable dans `inject.js`.

## Décision

Les comptes liés ne sont pas implémentés. Décision prise par l'assistant. Motif : la fonction expose les comptes secondaires d'autres personnes, déduits de leur IP, sans leur consentement.

## Conséquences

- Aucun appel à `/api/v1/who`, et l'endpoint reste hors de la liste des appels autorisés ([ADR-0001](0001-password-never-read.md)).
- Une demande future dans ce sens rouvre cette décision explicitement, avec l'utilisateur.
