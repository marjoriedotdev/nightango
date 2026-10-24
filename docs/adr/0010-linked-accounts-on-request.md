---
status: accepted
date: 2026-10
---

# Comptes liés à la demande, montrés à l'utilisateur seul

Remplace [ADR-0007](0007-no-linked-accounts.md).

## Contexte

Torch propose « who » sur tout membre qui a un compte. L'entrée est dans le menu d'un message, pour les messages des comptes, les siens compris, jamais ceux d'un invité (`reference/torch/inject.js:8132-8138`), et dans le bouton « More » d'une fiche membre (`inject.js:782`).

Au clic (`inject.js:7452-7477`), Torch appelle ``fetch(`${torch.domain}/api/v1/who/${data.username}`)``, avec `torch.domain` = `https://vissle.me` (`inject.js:2911`). L'appel ne porte ni clé ni mot de passe, et `fetch` n'envoie pas de cookie vers une autre origine. La réponse JSON a un champ `target` et des listes de noms par niveau de rapprochement : `definite`, `linked`, `strong`, `medium` et `weak`. Torch affiche le total puis chaque niveau non vide dans un message système local, que l'utilisateur est seul à voir et qui n'est pas gardé.

[ADR-0007](0007-no-linked-accounts.md) avait écarté la fonction, par décision de l'assistant : elle expose les comptes secondaires d'autres personnes, déduits de leur adresse IP, sans leur consentement. Le code client ne dit pas comment vissle calcule les niveaux.

## Décision

Décision du propriétaire du 2026-10-23 (#120) : Torch Skin propose les comptes liés comme Torch, sur tout membre qui a un compte. Motif : le propriétaire veut retrouver cette fonction de Torch dans l'interface refaite.

En live, « Who is this » figure dans le menu « More actions » de tout message d'un compte, les siens compris, jamais d'un invité, et dans le menu « More profile actions » de la fiche membre. Le clic ouvre une fenêtre « Who is {nom} » qui affiche le total puis chaque niveau non vide avec ses noms, et dit que c'est l'estimation de vissle, qui peut se tromper. Le prototype n'affiche pas l'entrée.

Garde-fous :

- le résultat est montré à l'utilisateur seul, dans une fenêtre, jamais publié dans un groupe ni un MP ;
- il n'est jamais stocké (ni état persistant, ni `torch-skin:<pseudo>`, ni cache) ni journalisé (ni `console`, ni `warn`) : il vit dans la fenêtre, et la fermer l'oublie ;
- un appel par clic de l'utilisateur, jamais automatique ni en lot ;
- l'appel entre dans la liste fermée ([ADR-0001](0001-password-never-read.md), `docs/torch-protocol.md#appels-http-autorisés`) avec sa source : `GET https://vissle.me/api/v1/who/{nom}` par `fetch`, sans cookie ni credential, `{nom}` validé par `ACCOUNT_NAME` (`src/bridge/live-model.js`), source `inject.js:7452-7477` ;
- seules les chaînes des cinq niveaux sont lues, tout autre champ est ignoré, et les noms sont rendus en texte, jamais en HTML.

## Risques acceptés par le propriétaire

- Comptes secondaires déduits de l'adresse IP de tiers, sans leur consentement.
- Faux rapprochements : une adresse IP partagée (foyer, école, wifi public, opérateur mobile) relie des personnes sans rapport, et la méthode de vissle est invérifiable.
- Usage du résultat pour accuser ou harceler un membre dans un groupe.
- vissle reçoit le nom de chaque membre consulté, avec l'adresse IP de l'utilisateur.

## Articulation avec les autres décisions

- [ADR-0005](0005-visitors-own-profile-only.md) ne change pas. Elle porte sur l'activité d'un profil enregistrée par le tracker vissle, que Torch Skin ne lit toujours que pour le compte connecté. Les comptes liés sont une exception distincte, décidée par le propriétaire, qui ne lit aucune activité d'un autre profil et ne part que d'un clic sur un membre précis.
- `GET https://api.vissle.me/v1/profile/{nom}?get=status` (`check_block` de Torch) reste exclu par la décision du 2026-10-23 sur #96 ([note hors périmètre](../../.out-of-scope/blocked-by-member.md)). Cette lecture de l'état d'un autre profil partirait d'elle-même, à l'insu de l'utilisateur comme du membre, pour chaque correspondant hors ligne de sa liste. Les comptes liés ne partent que d'un clic explicite. Cette décision ne rouvre pas `check_block`.

## Conséquences

- [ADR-0007](0007-no-linked-accounts.md) passe au statut `superseded by ADR-0010`.
- `docs/torch-protocol.md` (Appels HTTP autorisés, Comptes liés) et [ADR-0001](0001-password-never-read.md) ajoutent l'appel à la liste fermée.
- Garder le résultat, le partager, l'enchaîner sur plusieurs membres ou le demander sans clic rouvre cette décision avec le propriétaire.
