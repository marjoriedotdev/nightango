# Torch Skin

Torch Skin habille le client Chatango Torch d'une interface refaite, sans changer ce que Torch envoie à Chatango. Ce glossaire fixe le vocabulaire du code, des docs et des issues.

## Produits et acteurs

**Chatango**:
Service de discussion en ligne (groupes, messages privés, profils) sur lequel tout repose.

**Torch**:
Client web tiers pour Chatango, édité par vissle, qui tient la session et les connexions. Dans les textes d'interface, la charte du design system nomme aussi le produit « Torch ».
_Avoid_: Torch Client (sauf pour le client d'origine affiché sans habillage)

**vissle**:
Éditeur de Torch (vissle.me), qui héberge aussi le tracker de profil.

**Torch Skin**:
Ce projet : un userscript Tampermonkey qui démarre Torch puis affiche par-dessus une interface refaite, branchée sur Torch.
_Avoid_: thème, skin Torch

**Client officiel**:
Le client web de Chatango lui-même, utilisé comme source pour les formats et les textes.

**Bibliothèque de référence**:
Projet tiers maintenu qui implémente le protocole Chatango et sert de source pour une trame : chadango, chatango-lib ou ch.py.

## Architecture

**Pont**:
Couche qui traduit les trames et les objets de Torch en opérations pour l'interface, et les actions de l'interface en appels à Torch.
_Avoid_: adaptateur, wrapper

**Pont vissle**:
Relais du bac à sable qui interroge le tracker vissle pour le compte de la page.

**Trame**:
Message texte du protocole Chatango sur une connexion, aux champs séparés par `:`.
_Avoid_: commande, paquet, frame (en prose française)

**Table d'événements**:
Table de Torch qui associe un nom de trame entrante à son gestionnaire, une pour les groupes et une pour les messages privés.

**Connexion privée**:
Connexion de Chatango qui porte les MP, la liste d'amis et la présence, distincte des connexions de groupe.

**Live**:
Mode où l'interface est branchée sur le client Torch vivant et agit sur le vrai compte.

**Prototype**:
Mode hébergé où la même interface tourne sur des données simulées.
_Avoid_: démo, maquette

**Bac à sable**:
Contexte isolé où Tampermonkey exécute le userscript, avec ses privilèges mais sans accès à Torch.
_Avoid_: sandbox (en prose française)

**Page**:
Contexte de st.chatango.com où vivent Torch et l'interface, sans les privilèges du userscript.

**Loader**:
Partie du userscript qui tourne dans le bac à sable et injecte le code page.

**Code page**:
Partie du userscript injectée dans la page, qui démarre Torch et monte l'interface.

**Not wired**:
État d'une fonction de l'interface sans trame sourcée, affichée comme indisponible en live.

**Livrable**:
Le userscript minifié que l'utilisateur installe dans Tampermonkey, au nom fixe d'une version à l'autre.

**Design system**:
Jetons, composants et charte de Torch Skin (torchds), dont l'interface est construite.

## Groupes

**Groupe**:
Salon de discussion public de Chatango, identifié par son nom.
_Avoid_: salon, room, chat room

**Canal**:
Marquage d'un message de groupe : rouge, bleu, ou Staff (réservé aux modérateurs qui en ont le droit).

**Annonce**:
Message d'un groupe republié à intervalle régulier.

**Modérateur**:
Membre à qui le propriétaire d'un groupe a donné des droits de modération, choisis un par un.
_Avoid_: mod (en prose), staff

**Mode lent**:
Délai minimal imposé entre deux messages d'un même membre dans un groupe.
_Avoid_: rate limit (en prose)

**Mots bannis**:
Liste de mots, partiels ou entiers, refusés dans les messages d'un groupe.

**Bannissement**:
Blocage d'un membre ou d'un invité dans un groupe, à partir d'un de ses messages.
_Avoid_: ban, blocage (réservé aux MP)

## Messages privés

**MP**:
Conversation privée entre deux comptes Chatango.
_Avoid_: DM, PM, message direct (en prose française). L'interface dit « Chats ».

**msgoff**:
MP reçu pendant que le destinataire était hors ligne, livré une seule fois à sa reconnexion.

**Historique privé**:
Copie locale des MP que Torch garde dans le navigateur. Chatango n'en garde aucune.

**Conversation fermée**:
MP retiré de la liste avec son historique gardé, qui revient à un MP entrant ou à une réouverture.
_Avoid_: conversation masquée, archivée

**Conversation supprimée**:
MP fermé dont l'historique privé a aussi été effacé de ce navigateur.

**Ami**:
Compte que l'utilisateur suit dans sa liste d'amis pour voir sa présence.
_Avoid_: contact, watch list

**Blocage**:
Refus des MP d'un compte, côté messages privés.

## Présence

**Présence**:
État d'un compte : en ligne, inactif ou hors ligne. Une connexion depuis l'application mobile compte comme en ligne.
_Avoid_: statut (réservé au texte de statut)

**Inactif**:
Compte en ligne dont le dernier signe d'activité date de plusieurs minutes.
_Avoid_: away, absent

**Dernière connexion**:
Moment où un compte hors ligne a été vu en ligne pour la dernière fois, affiché « Last online ».
_Avoid_: last seen

## Profils

**Mini profil**:
Fiche publique courte d'un membre : âge, genre, lieu, bio et fin du Premium.
_Avoid_: carte, aperçu de profil

**Profil complet**:
Page libre d'un membre, écrite en HTML, affichée isolée.
_Avoid_: grand profil, page perso

**ASL**:
Âge, genre et lieu d'un membre, tels que le mini profil les donne et que Meet people les filtre.

**Premium**:
Abonnement payant de Chatango, actif jusqu'à une date de fin publiée dans le mini profil.

**Fond Premium**:
Couleurs et image de fond qu'un membre Premium attache à son mini profil.
_Avoid_: fond de mini, thème de profil

**Fond de message**:
Couleur et image de fond qu'un membre Premium attache à ses messages de groupe. Torch Skin affiche la couleur et l'image sous « Message backgrounds ».

**Tracker vissle**:
Service de vissle que l'utilisateur installe sur son profil pour journaliser l'activité qu'il reçoit.

**Visitors**:
Section qui affiche l'activité du profil de l'utilisateur connecté : visites, likes, dislikes, commentaires et parrainages.
_Avoid_: visites (pour la section entière), stats

**Meet people**:
Recherche de membres de Chatango filtrée par âge, genre, photo et présence.
_Avoid_: découverte (réservé à Discover, la liste de groupes à rejoindre)

**Comptes liés**:
Autres comptes que vissle rapproche d'un compte, rangés par niveau de rapprochement (Definite à Weak), selon une méthode que le code de Torch ne dit pas. Demandés au clic sur « Who is this », montrés à l'utilisateur seul, sans être gardés.
_Avoid_: alts, multicomptes, doubles comptes

## Style

**Style de message**:
Police, taille, couleurs du texte et du nom, gras, italique et souligné d'un message.

**Style du compte**:
Style de message enregistré chez Chatango pour le compte.

**Style perso**:
Style de message choisi dans Torch Skin, gardé dans ce navigateur seulement et appliqué à chaque envoi. Il peut aussi barrer le texte, en MP seulement.
_Avoid_: style local, thème de message

**Style coupé**:
Style de message et fond de message d'un membre que l'utilisateur a choisi de ne plus afficher, en groupe comme en MP. Gardé avec les données du compte dans ce navigateur.
_Avoid_: style masqué, style bloqué

## Session

**Session coupée**:
Perte de la session Torch qui bloque l'interface : connecté ailleurs, session expirée, hors ligne ou connexion perdue.
_Avoid_: déconnexion (ambigu avec la fermeture d'un seul groupe)
