import * as gameStore from '../stores/gameStore.js';
import * as guestStore from '../stores/guestStore.js';
import { supabase } from '../config/supabase.js';

export const create = async (tableId) => {
  const players = guestStore.getGuestsByTable(tableId);

  if (!players || players.length < 2) {
    return { error: { message: "Il faut au moins 2 joueurs pour commencer." } };
  }

  const game = gameStore.createGame(tableId, players);

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

export const endGame = async (tableId) => {

  gameStore.removeGame(tableId);

  const { error } = await supabase
    .from('tables')
    .update({ etat: 'en_attente' })
    .eq('id', tableId)
    .select()
    .single();

  return { data: { message: "Partie terminée" }, error };
};
