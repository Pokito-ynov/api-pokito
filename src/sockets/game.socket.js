import * as gameStore from '../stores/gameStore.js';
import * as gamesService from '../services/games.service.js';

export const registerGameHandlers = (io, socket) => {

  const broadcastGameState = (tableId) => {
    const game = gameStore.getGame(tableId);
    if (!game) return;

    // Public State: Hide hole cards
    const publicState = {
      id: game.id,
      pot: game.pot,
      currentBet: game.currentBet,
      stage: game.stage,
      currentPlayer: game.players[game.currentPlayerIndex]?.pseudo,
      round: game.round,
      players: game.players.map(p => ({
        socketId: p.socketId,
        pseudo: p.pseudo,
        avatar: p.avatar,
        chips: p.chips,
        bet: p.bet,
        isFolded: p.isFolded,
        isAllIn: p.isAllIn,
        // Show only visible cards
        cards: p.cards.map(c => c.visible ? c : { visible: false, back: true })
      })),
      winners: game.winners.map(w => ({ pseudo: w.pseudo, score: w.handScore }))
    };

    io.to(tableId).emit('game:state', publicState);

    // Private State: Send hole cards to each player
    game.players.forEach(p => {
      io.to(p.socketId).emit('game:hand', { cards: p.cards });
    });
  };

  /**
   * Démarrer une nouvelle partie
   */
  socket.on('game:start', async ({ tableId }) => {
    try {
      console.log(`[Game] Start request for table ${tableId} by ${socket.id}`);

      // Use Service to Create Game (Handles DB state + Player gathering)
      const { data: game, error } = await gamesService.create(tableId);

      if (error) {
        socket.emit('game:error', { message: error.message });
        return;
      }

      // Start the Poker Logic (Deal cards, Ante, etc.)
      gameStore.startGame(tableId);

      broadcastGameState(tableId);

      io.to(tableId).emit('game:notification', { message: "The game has started!" });

    } catch (err) {
      console.error(err);
      socket.emit('game:error', { message: err.message });
    }
  });

  /**
   * Joueur effectue une action (Check, Call, Raise, Fold)
   */
  socket.on('game:action', async ({ tableId, action, amount }) => {
    try {
      // Validate inputs
      if (!['check', 'call', 'raise', 'fold'].includes(action)) {
        throw new Error("Invalid action");
      }

      const game = gameStore.handleAction(tableId, socket.id, action, amount);

      broadcastGameState(tableId);

      if (game.stage === 'finished') {
        io.to(tableId).emit('game:finished', { winners: game.winners });

        // Sync DB state (Set table back to 'en_attente' or similar? Or keep it running?)
        // Usually we keep 'en_cours' until empty, but let's follow logic.
        // await gamesService.endGame(tableId); 
        // NOTE: If we call endGame here, it removes the game from memory. 
        // We probably want to wait for "New Game" signal.
        // For MVP, leave it in memory so users see results.
      }

    } catch (err) {
      console.error(err);
      socket.emit('game:error', { message: err.message });
    }
  });
};
