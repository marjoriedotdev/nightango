# Torch Skin

Torch Skin est un userscript Tampermonkey pour https://st.chatango.com/. Il démarre [Torch](https://vissle.me), un client web tiers pour Chatango, puis affiche par-dessus une interface refaite : thème sombre et clair, groupes, messages privés, modération, profils, Meet people.

La connexion se fait sur l'écran de Torch. Torch Skin ne lit jamais le mot de passe et n'envoie à Chatango que des trames déjà utilisées par Torch ou par une bibliothèque de référence.

## Prérequis

- Node.js et pnpm
- Tampermonkey dans le navigateur

## Construire

```
pnpm install
pnpm build
```

Le build écrit dans `dist/` :

- `torch-skin.min.user.js` : le userscript à installer
- `torch-skin.user.js` : la même chose en version lisible, pour l'audit
- `torch-client.html` et `app.js` : le prototype à données simulées

## Installer dans Tampermonkey

1. Ouvre le tableau de bord de Tampermonkey et crée un nouveau script, ou ouvre le script Torch Skin existant.
2. Remplace tout son contenu par celui de `dist/torch-skin.min.user.js`, puis enregistre.
3. Ouvre https://st.chatango.com/ et connecte-toi sur l'écran de Torch. L'interface de Torch Skin s'affiche une fois la session ouverte.

## Tester

```
pnpm test             # build puis toutes les suites jsdom
pnpm test live_ui     # build puis une suite précise
```

## Documentation

- [AGENTS.md](AGENTS.md) : règles du projet, commandes, livraison d'une version
- [GLOSSARY.md](GLOSSARY.md) : vocabulaire du domaine
- [docs/architecture.md](docs/architecture.md) : organisation du code et du build
- [docs/torch-protocol.md](docs/torch-protocol.md) : fonctionnement de Torch et du protocole Chatango
- [docs/coding-conventions.md](docs/coding-conventions.md) : conventions de code et de tests
- [docs/adr/](docs/adr/) : décisions d'architecture
