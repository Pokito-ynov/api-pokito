import { createDeck, shuffle, evaluateHand } from '../utils/poker.js';

const games = new Map();

export const createGame = (tableId, players) => {
  const deck = shuffle(createDeck());

  const game = {
    id: tableId,
    tableId,
    players: players.map(p => ({
      socketId: p.socketId,
      pseudo: p.pseudo,
      avatar: p.avatar,
      chips: 1000, // Starting stack
      cards: [],
      bet: 0,
      isFolded: false,
      isAllIn: false,
      handScore: null
    })),
    deck,
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    dealerIndex: 0, // In Stud, this might just track "button" but turn order is by board
    minBet: 10,
    round: 0, // 0=Ante, 1=Street1(2cards), 2=Street2...
    stage: 'ante', // ante, betting, showdown, finished
    winners: []
  };

  games.set(tableId, game);
  return game;
};

export const getGame = (tableId) => games.get(tableId);

export const startGame = (tableId) => {
  const game = games.get(tableId);
  if (!game) throw new Error("Game not found");

  // Collect Ante
  const ante = 5;
  game.players.forEach(p => {
    if (p.chips >= ante) {
      p.chips -= ante;
      game.pot += ante;
    }
  });

  game.stage = 'street1';
  game.deck = shuffle(createDeck()); // Reshuffle for new hand
  game.players.forEach(p => {
    p.cards = [];
    p.bet = 0;
    p.isFolded = false;
  });

  // Deal 2 cards: 1 hidden, 1 visible
  dealCards(game, 1, false); // Hole card
  dealCards(game, 1, true);  // Door card

  game.currentBet = game.minBet; // Force a bet to start? Or leave at 0 for check? Let's say 0.
  game.currentBet = 0;

  // Determine who starts (High Card)
  game.currentPlayerIndex = getBestVisibleHandIndex(game);
};

const dealCards = (game, count, visible) => {
  game.players.forEach(p => {
    if (!p.isFolded) {
      for (let i = 0; i < count; i++) {
        const card = game.deck.pop();
        card.visible = visible;
        p.cards.push(card);
      }
    }
  });
};

const getBestVisibleHandIndex = (game) => {
  // Simplified: Find highest visible card rank
  // In real Stud: Best poker hand of visible cards
  let bestIndex = 0;
  let bestScore = -1;

  game.players.forEach((p, idx) => {
    if (p.isFolded) return;
    const visibleCards = p.cards.filter(c => c.visible);
    const result = evaluateHand(visibleCards);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestIndex = idx;
    }
  });
  return bestIndex;
};

export const handleAction = (tableId, socketId, action, amount) => {
  const game = games.get(tableId);
  if (!game) throw new Error("Game not found");

  const player = game.players[game.currentPlayerIndex];
  if (player.socketId !== socketId) throw new Error("Not your turn");

  switch (action) {
    case 'fold':
      player.isFolded = true;
      break;
    case 'call':
      const callAmount = game.currentBet - player.bet;
      if (player.chips < callAmount) throw new Error("Not enough chips");
      player.chips -= callAmount;
      player.bet += callAmount;
      game.pot += callAmount;
      break;
    case 'check':
      if (game.currentBet > player.bet) throw new Error("Cannot check, must call");
      break;
    case 'raise':
      if (amount < game.currentBet) throw new Error("Raise too small");
      const diff = amount - player.bet;
      if (player.chips < diff) throw new Error("Not enough chips");
      player.chips -= diff;
      player.bet += diff;
      game.pot += diff;
      game.currentBet = amount;
      break;
  }

  // Next player
  // Check if round is over (everyone called/checked)
  if (isRoundComplete(game)) {
    nextStreet(game);
  } else {
    advanceTurn(game);
  }

  return game;
};

const advanceTurn = (game) => {
  let loops = 0;
  do {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    loops++;
  } while (game.players[game.currentPlayerIndex].isFolded && loops < game.players.length);
};

const isRoundComplete = (game) => {
  const activePlayers = game.players.filter(p => !p.isFolded);
  if (activePlayers.length < 2) return true; // Everyone folded but one

  // If everyone matches the current bet (or is all in) AND everyone has had a chance
  // Simplifying for MVP: If all active bets == currentBet? 
  // Need to track "last aggressor" to know when action closes.
  // For now: Just check if bets equal.
  return activePlayers.every(p => p.bet === game.currentBet);
};

const nextStreet = (game) => {
  // Reset bets for new round
  game.players.forEach(p => p.bet = 0);
  game.currentBet = 0;

  if (game.players.filter(p => !p.isFolded).length === 1) {
    // Winner by fold
    endGame(game);
    return;
  }

  const cardsCount = game.players.find(p => !p.isFolded).cards.length;

  if (cardsCount < 5) {
    // Deal next card (Street 3, 4, 5)
    dealCards(game, 1, true);
    // Determine who starts (Best visible hand)
    game.currentPlayerIndex = getBestVisibleHandIndex(game);
  } else {
    // After 5th card round: Showdown
    endGame(game);
  }
};

const endGame = (game) => {
  game.stage = 'finished';
  const activePlayers = game.players.filter(p => !p.isFolded);

  // Evaluate hands
  let bestScore = -1;
  let winners = [];

  activePlayers.forEach(p => {
    const result = evaluateHand(p.cards);
    p.handScore = result;
    if (result.score > bestScore) {
      bestScore = result.score;
      winners = [p];
    } else if (result.score === bestScore) {
      winners.push(p);
    }
  });

  game.winners = winners;
  // Distribute Pot
  const splitPot = Math.floor(game.pot / winners.length);
  winners.forEach(w => w.chips += splitPot);

  // Reset pot for display/next
  // game.pot = 0; // Keep it to show user
};
