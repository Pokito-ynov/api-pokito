const games = new Map();

/**
 * Crée une nouvelle partie en mémoire
 * @param {string} tableId 
 * @param {Array} players - Liste des joueurs { socketId, pseudo, ... }
 */
export const createGame = (tableId, players) => {
  // Mélanger les joueurs pour l'ordre aléatoire
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  const game = {
    id: tableId, // On utilise l'ID de la table comme ID de jeu pour simplifier
    tableId,
    players: shuffledPlayers.map(p => ({
      socketId: p.socketId,
      pseudo: p.pseudo,
      avatar: p.avatar,
      diceCount: 1, // Poker Mexicain classique = 1 dé, ou plus selon variante
      dice: [],     // Valeurs actuelles des dés
      isEliminated: false
    })),
    currentPlayerIndex: 0,
    currentBet: null, // { quantity: 1, value: 2 } (ex: "un 2")
    previousPlayerIndex: null,
    state: 'playing', // 'playing', 'showdown', 'finished'
    round: 1,
    history: []
  };

  // Initialiser le premier lancer de dés pour tout le monde
  game.players.forEach(p => {
    p.dice = Array(p.diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
  });

  games.set(tableId, game);
  return game;
};

export const getGame = (tableId) => games.get(tableId);

export const removeGame = (tableId) => games.delete(tableId);

/**
 * Vérifie si c'est au tour du joueur
 */
export const isPlayerTurn = (tableId, socketId) => {
  const game = games.get(tableId);
  if (!game) return false;
  const player = game.players[game.currentPlayerIndex];
  return player && player.socketId === socketId;
};

/**
 * Applique un pari (Bet)
 */
export const placeBet = (tableId, socketId, quantity, value) => {
  const game = games.get(tableId);
  if (!game) throw new Error("Partie non trouvée");
  
  if (!isPlayerTurn(tableId, socketId)) {
    throw new Error("Ce n'est pas votre tour");
  }

  // Validation basique (doit être supérieur au pari précédent)
  if (game.currentBet) {
    // Règle simplifiée : on doit augmenter la quantité OU la valeur
    // (A remplacer par la vraie règle du Poker Mexicain : palifico, etc.)
    if (quantity < game.currentBet.quantity && value <= game.currentBet.value) {
      throw new Error("Pari invalide : il faut surenchérir");
    }
  }

  game.currentBet = { quantity, value };
  game.history.push({ 
    action: 'bet', 
    pseudo: game.players[game.currentPlayerIndex].pseudo, 
    quantity, 
    value 
  });

  game.previousPlayerIndex = game.currentPlayerIndex;
  
  // Passer au joueur suivant (non éliminé)
  advanceTurn(game);
  
  return game;
};

/**
 * Passe au joueur suivant
 */
const advanceTurn = (game) => {
  let nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  // Boucle pour sauter les joueurs éliminés
  while (game.players[nextIndex].isEliminated) {
    nextIndex = (nextIndex + 1) % game.players.length;
  }
  game.currentPlayerIndex = nextIndex;
};

