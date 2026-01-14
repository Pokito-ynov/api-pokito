# Documentation Frontend - API Pokito (Poker Mexicain)

Ce document détaille le fonctionnement de l'API WebSocket pour le jeu de **Five-Card Stud** (Poker Mexicain).

## 1. Concepts du Jeu (Important pour l'UI)

Contrairement au Texas Hold'em :
*   Chaque joueur possède son **propre tableau de cartes** (pas de cartes communes au milieu).
*   Chaque joueur aura au final **1 carte cachée** et **4 cartes visibles**.
*   **Ordre de parole dynamique** : À chaque tour, c'est le joueur avec la meilleure combinaison de cartes **visibles** qui commence à parler.

## 2. Connexion au Socket

Le namespace par défaut est utilisé. Assurez-vous d'avoir rejoint la table via `table:join` avant d'écouter les événements de jeu.

```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

// Rejoindre la table d'abord
socket.emit("table:join", { code: "ABCD12" });
```

## 3. Événements Émis (Client -> Serveur)

### Lancer la partie
Démarrer la partie quand au moins 2 joueurs sont prêts.
```javascript
socket.emit("game:start", { 
  tableId: "uuid-de-la-table" 
});
```

### Jouer son tour
Action à envoyer quand c'est à votre tour (`currentPlayer === votrePseudo`).

```javascript
socket.emit("game:action", {
  tableId: "uuid-de-la-table",
  action: "call", // "check", "call", "raise", "fold"
  amount: 50      // Requis seulement pour "raise" (montant TOTAL de la mise)
});
```
*Note : Si le joueur veut relancer à 150 alors que la mise actuelle est 100, `amount` doit être 150.*

---

## 4. Événements Écoutés (Serveur -> Client)

### `game:state` (L'événement principal)
Cet événement est envoyé après chaque action. Il contient **tout l'état public** de la table.
Votre UI doit être une "vue" de cet état.

```json
{
  "id": "uuid-table",
  "pot": 250,              // Pot total au milieu
  "currentBet": 50,        // La mise à égaler pour suivre
  "stage": "street3",      // "ante", "street1", "street2", ..., "showdown"
  "round": 2,              // Numéro du tour
  "currentPlayer": "DarkSasuké", // Pseudo du joueur qui doit agir !
  "players": [
    {
      "pseudo": "DarkSasuké",
      "avatar": "avatar1.png",
      "chips": 850,        // Stack restant
      "bet": 50,           // Mise posée devant lui ce tour-ci
      "isFolded": false,   // S'il s'est couché (griser le joueur)
      "cards": [
        // Cartes VISIBLES uniquement (les cachées sont masquées ici)
        { "visible": false, "back": true }, // Carte cachée (dos)
        { "suit": "hearts", "rank": "K", "visible": true },
        { "suit": "spades", "rank": "10", "visible": true }
      ]
    },
    // ... autres joueurs
  ]
}
```

### `game:hand` (Vos cartes privées)
Cet événement est envoyé **uniquement à vous**. Il contient vos cartes, y compris celle qui est cachée aux autres.
**Fusionnez ces données avec `game:state` pour afficher vos propres cartes.**

```json
{
  "cards": [
    { "suit": "diamonds", "rank": "A", "visible": false }, // VOUS voyez cette carte
    { "suit": "hearts", "rank": "K", "visible": true },
    { "suit": "spades", "rank": "10", "visible": true }
  ]
}
```

### `game:notification`
Message informatif éphémère (ex: "La partie commence !", "Pierre a gagné le pot").
```json
{ "message": "C'est au tour de Paul" }
```

### `game:error`
Erreur suite à une action invalide (ex: "Pas assez de jetons").
```json
{ "message": "Action invalide : Vous devez miser au moins 50" }
```

### `game:finished`
Envoyé à la fin de la partie (Showdown ou tout le monde s'est couché).
```json
{
  "winners": [
    { "pseudo": "Gagnant", "score": { "text": "Full House" } }
  ]
}
```

## 5. Logique des États (`stage`)

1.  **`street1`** : Distribution initiale (1 cachée, 1 visible). Enchères.
2.  **`street2`** : 3ème carte visible distribuée. Enchères.
3.  **`street3`** : 4ème carte visible distribuée. Enchères.
4.  **`street4`** (River) : 5ème carte visible distribuée. Dernières enchères.
5.  **`finished`** : Fin de partie.

## 6. Actions UI Recommandées

*   **Bouton "Check"** : Actif seulement si `currentBet == votre_mise_actuelle`.
*   **Bouton "Call"** : Affiche le montant à ajouter (`currentBet - votre_mise`).
*   **Bouton "Raise"** : Doit proposer un slider ou un input. Minimum = `currentBet * 2` (règle classique) ou simplement > `currentBet`.
*   **Indicateur de tour** : Mettre en surbrillance l'avatar du joueur dont le `pseudo === game.currentPlayer`.
