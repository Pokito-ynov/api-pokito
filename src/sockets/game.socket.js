import * as gameStore from '../stores/gameStore.js';
import * as gamesService from '../services/games.service.js';
import * as guestsService from '../services/guests.service.js';

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

      // Guard: socket must be at this table
      const playersAtTable = guestsService.getGuestsByTable(tableId);
      if (!playersAtTable.find(p => p.socketId === socket.id)) {
        socket.emit('game:error', { message: 'You are not at this table' });
        return;
      }

      // Use Service to Create Game (Handles DB state + Player gathering)
      const { data: game, error } = await gamesService.create(tableId);

      if (error) {
        socket.emit('game:error', { message: error.message });
        return;
      }

      // Start the Poker Logic (Deal cards, Ante, etc.)
      gameStore.startGame(tableId);

      broadcastGameState(tableId);

      const firstPlayer = gameStore.getGame(tableId)?.players[gameStore.getGame(tableId)?.currentPlayerIndex]?.pseudo;
      io.to(tableId).emit('game:notification', { message: "The game has started!" });
      if (firstPlayer) {
        io.to(tableId).emit('game:notification', { message: `It's ${firstPlayer}'s turn` });
      }

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
        const formattedWinners = game.winners.map(w => ({ pseudo: w.pseudo, score: w.handScore }));
        io.to(tableId).emit('game:finished', { winners: formattedWinners });
        io.to(tableId).emit('game:notification', { message: `${formattedWinners.map(w => w.pseudo).join(' & ')} win the pot!` });
      } else {
        const currentPlayer = game.players[game.currentPlayerIndex]?.pseudo;
        if (currentPlayer) {
          io.to(tableId).emit('game:notification', { message: `It's ${currentPlayer}'s turn` });
        }
      }

    } catch (err) {
      console.error(err);
      socket.emit('game:error', { message: err.message });
    }
  });
};
