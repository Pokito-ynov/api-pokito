import * as gameStore from '../stores/gameStore.js';
import * as guestStore from '../stores/guestStore.js';
import { supabase } from '../config/supabase.js';
import { STARTING_CHIPS } from '../stores/gameStore.js';
import { adjustWalletBalance } from './users.service.js';

export const create = async (tableId) => {
  const players = guestStore.getGuestsByTable(tableId);

  if (!players || players.length < 2) {
    return { error: { message: "Il faut au moins 2 joueurs pour commencer." } };
  }

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id, arena_id')
    .eq('id', tableId)
    .single();

  if (tableError) {
    return { error: tableError };
  }

  const game = gameStore.createGame(tableId, players, { arenaId: table.arena_id || null });

  const { error } = await supabase
    .from('tables')
    .update({ etat: 'en_cours' })
    .eq('id', tableId);

  if (error) {
    gameStore.removeGame(tableId);
    return { error };
  }

  return { data: game };
};

export const getByTableId = async (tableId) => {
  const game = gameStore.getGame(tableId);
  if (!game) {
    return { error: { message: "Aucune partie active sur cette table." } };
  }
  return { data: game };
};

// Alias used by the REST controller
export const getById = getByTableId;

const buildPlayerResultRows = (game, gameResultId) => {
  const winnerSocketIds = new Set(game.winners.map((winner) => winner.socketId));

  return game.players.map((player) => ({
    game_result_id: gameResultId,
    user_id: player.userId,
    position: winnerSocketIds.has(player.socketId) ? 1 : null,
    chips_change: player.chips - STARTING_CHIPS,
    hand_strength: player.handScore?.text || null,
    folded: player.isFolded
  }));
};

const persistFinishedGame = async (game) => {
  if (!game) {
    return { data: null, error: null };
  }

  const winnerWithUser = game.winners.find((winner) => winner.userId);

  const { data: gameResult, error: resultError } = await supabase
    .from('game_results')
    .insert({
      table_id: game.tableId,
      arena_id: game.arenaId,
      started_at: game.startedAt,
      ended_at: game.endedAt || new Date().toISOString(),
      pot_total: game.pot,
      players_count: game.players.length,
      winner_user_id: winnerWithUser?.userId || null
    })
    .select('*')
    .single();

  if (resultError) {
    return { data: null, error: resultError };
  }

  const playerRows = buildPlayerResultRows(game, gameResult.id);
  if (playerRows.length > 0) {
    const { error: playerRowsError } = await supabase
      .from('game_result_players')
      .insert(playerRows);

    if (playerRowsError) {
      return { data: null, error: playerRowsError };
    }
  }

  for (const player of game.players) {
    if (!player.userId) continue;

    const chipsDelta = player.chips - STARTING_CHIPS;
    if (chipsDelta === 0) continue;

    const { error: walletError } = await adjustWalletBalance(player.userId, chipsDelta);
    if (walletError) {
      return { data: null, error: walletError };
    }
  }

  return { data: gameResult, error: null };
};

export const endGame = async (tableId) => {
  const game = gameStore.getGame(tableId);

  const { data: persistedResult, error: persistError } = await persistFinishedGame(game);
  if (persistError) {
    return { data: null, error: persistError };
  }

  gameStore.removeGame(tableId);

  const { error } = await supabase
    .from('tables')
    .update({ etat: 'en_attente' })
    .eq('id', tableId)
    .select()
    .single();

  return { data: { message: "Partie terminée", result: persistedResult }, error };
};
