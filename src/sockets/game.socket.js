import * as gamesService from '../services/games.service.js';
import * as gameStore from '../stores/gameStore.js';

export const registerGameHandlers = (io, socket) => {
  
  /**
   * Démarrer une nouvelle partie
   */
  socket.on('game:start', async ({ tableId }) => {
    console.log(`[Game] Start request for table ${tableId} by ${socket.id}`);
    
    const { data: game, error } = await gamesService.create(tableId);

    if (error) {
      socket.emit('game:error', { message: error.message });
      return;
    }

    // 1. Informer tout le monde que la partie commence (sans révéler les dés)
    io.to(tableId).emit('game:started', { 
      gameId: game.id,
      players: game.players.map(p => ({ 
        pseudo: p.pseudo, 
        avatar: p.avatar, 
        diceCount: p.dice.length 
      })),
      currentPlayer: game.players[game.currentPlayerIndex].pseudo
    });

    // 2. Envoyer ses propres dés à chaque joueur (CONFIDENTIEL)
    game.players.forEach(p => {
      io.to(p.socketId).emit('game:hand', { dice: p.dice });
    });
  });

  /**
   * Joueur place un pari (ex: "Trois 5")
   */
  socket.on('game:bet', ({ tableId, quantity, value }) => {
    try {
      // Met à jour l'état du jeu via le Store
      const game = gameStore.placeBet(tableId, socket.id, quantity, value);
      
      // Diffuser le pari à tout le monde
      io.to(tableId).emit('game:bet_placed', {
        pseudo: game.players[game.previousPlayerIndex].pseudo, // Celui qui vient de jouer
        quantity,
        value,
        nextPlayer: game.players[game.currentPlayerIndex].pseudo
      });

    } catch (err) {
      socket.emit('game:error', { message: err.message });
    }
  });

  /**
   * Révéler les dés (Showdown / Dudo)
   * Quand un joueur dit "Menteur !" ou "Dudo"
   */
  socket.on('game:dudo', ({ tableId }) => {
    // Logique à implémenter dans gameStore : vérifier qui perd un dé
    // Pour l'instant, on révèle juste tout
    const game = gameStore.getGame(tableId);
    if (!game) return;

    io.to(tableId).emit('game:showdown', {
      players: game.players // Révèle tous les dés
    });
    
    // TODO: Calculer le perdant et relancer un round ou finir la partie
  });
};
