# API Pokito (Poker Mexicain)

Bienvenue sur l'API Backend de Pokito.
Ce projet gère la logique du **Five-Card Stud** (Poker Mexicain) via des WebSockets.

## 🚀 Démarrage Rapide

```bash
# Installer les dépendances
npm install

# Lancer en dev
npm run dev
```

## 📖 Documentation Frontend (Intégration)

### 1. Connexion

Namespace par défaut :
```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

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
