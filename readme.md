# API Pokito (Poker Mexicain)

Bienvenue sur l'API Backend de Pokito.
Ce projet gere la logique du **Poker Mexicain** via des WebSockets.

## Architecture

- l'etat live des parties reste en memoire via `Socket.IO`, `guestStore` et `gameStore`
- la base Supabase ne stocke que le lobby, les comptes, l'economie, les cosmetiques, les arenes et l'historique final des parties
- les cartes, les tours, les mises intermediaires et les mains privees ne sont pas persistes en base

## Regles du jeu

Le paquet utilise par l'application est un paquet reduit :
- cartes retirees : `8`, `9`, `10`
- carte ajoutee : `1 Joker`

Hierarchie des mains, de la plus forte a la plus faible :
1. `Cinquan` : 4 cartes de meme valeur + le Joker
2. `Quinte Flush Royale` : `7`, `J`, `Q`, `K`, `A` de la meme couleur
3. `Quinte Flush` : 5 cartes consecutives de la meme couleur
4. `Carre`
5. `Couleur`
6. `Full`
7. `Quinte`
8. `Brelan`
9. `Double Paire`
10. `Paire`
11. `Carte Haute`

Pour les suites, le `7` remplace le `10`. La quinte la plus haute est donc `7-J-Q-K-A`.

## 🚀 Démarrage Rapide

```bash
# Configurer l'environnement
cp .env.example .env

# Installer les dépendances
npm install

# Lancer en dev
npm run dev
```

## 🐳 Lancer avec Docker

```bash
# Construire l'image
docker build -t api-pokito .

# Creer le fichier d'environnement si besoin
cp .env.example .env

# Lancer le conteneur avec les variables Supabase (port 5015)
docker run --name api-pokito --env-file .env -p 5015:5015 api-pokito
```

L'API sera disponible sur `http://localhost:5015`

Notes Docker :
- le fichier `.env` n'est pas copie dans l'image Docker volontairement
- sans `SUPABASE_URL` et `SUPABASE_ANON_KEY`, l'application ne peut pas demarrer
- si vous ne voulez pas utiliser `--env-file`, vous pouvez aussi passer `-e SUPABASE_URL=... -e SUPABASE_ANON_KEY=...`

## Base de donnees

Le schema de persistance de la couche economie et cosmetiques est fourni dans [database/phase1_persistence.sql](c:/Users/nadji/Documents/Master%202/Ydays/Pokito/api-pokito/database/phase1_persistence.sql).

Tables principales ajoutees :
- `cosmetic_catalog`
- `arenas`
- `user_wallets`
- `user_inventory`
- `game_results`
- `game_result_players`

Colonnes etendues :
- `users.active_avatar_id`
- `users.active_card_skin_id`
- `tables.arena_id`

## API REST

Catalogue :
- `GET /catalog/cosmetics`
- `GET /catalog/arenas`

Utilisateurs :
- `POST /users/register`
- `POST /users/login`
- `GET /users/:id`
- `PUT /users/:id`
- `GET /users/:id/wallet`
- `GET /users/:id/inventory`
- `POST /users/:id/inventory/purchase`
- `PUT /users/:id/loadout`
- `GET /users/:id/history`

Tables :
- `POST /tables` avec `arenaId` optionnel
- `GET /tables`
- `GET /tables/:id`
- `GET /tables/code/:code`

Notes :
- le wallet est mis a jour a la fin des parties pour les joueurs rattaches a un `userId`
- les invites peuvent continuer a jouer sans compte, mais leur progression n'est pas historisee dans le wallet

## 📖 Documentation Frontend (Intégration)

Voir aussi [frontend_documentation.md](c:/Users/nadji/Documents/Master%202/Ydays/Pokito/api-pokito/frontend_documentation.md) pour les evenements Socket.IO et les nouveaux flux REST.

### 1. Connexion

Namespace par défaut :
```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost:5015");

// Rejoindre une table (requis avant de jouer)
socket.emit("table:join", { code: "ABCD12" });
```

### 2. Flux de Jeu (Game Loop)

Le jeu fonctionne par événements. L'événement principal est `game:state`.

#### ➡️ Émettre une Action
```javascript
// Démarrer la partie
socket.emit("game:start", { tableId: "..." });

// Jouer (quand c'est à votre tour)
socket.emit("game:action", {
  tableId: "...",
  action: "call", // ou "check", "raise", "fold"
  amount: 100     // Requis pour raise (montant TOTAL)
});
```

#### ⬅️ Recevoir l'État (`game:state`)
Envoyé à tout le monde après chaque changement.

```json
{
  "pot": 250,
  "currentBet": 50,
  "currentPlayer": "PseudoDuJoueurActif",
  "stage": "street3", // street1 (2 cartes), street2 (3e), ...
  "players": [
    {
      "pseudo": "Joueur1",
      "chips": 500,
      "bet": 50,
      "isFolded": false,
      "cards": [
        { "visible": false, "back": true }, // Carte cachée
        { "suit": "hearts", "rank": "K", "visible": true }
      ]
    }
  ]
}
```

#### ⬅️ Vos Cartes (`game:hand`)
Envoyé uniquement à vous pour révéler votre carte cachée.

```json
{
  "cards": [
    { "suit": "spades", "rank": "A", "visible": false }, // ICI vous la voyez !
    { "suit": "hearts", "rank": "K", "visible": true }
  ]
}
```

## 🛠️ Structure du Projet

*   `src/server.js` : Point d'entrée.
*   `src/sockets/` : Gestionnaires d'événements (Game, Table).
*   `src/stores/` : État en mémoire (GameStore).
*   `src/utils/poker.js` : Logique méta du poker (Deck, Mains).
