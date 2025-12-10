import * as gameStore from '../stores/gameStore.js';
import * as guestStore from '../stores/guestStore.js';
import { supabase } from '../config/supabase.js';

export const create = async (tableId) => {
  // 1. Récupérer les joueurs connectés à la table (depuis la mémoire)
  const players = guestStore.getGuestsByTable(tableId);
  
  if (!players || players.length < 2) {
    return { error: { message: "Il faut au moins 2 joueurs pour commencer." } };
  }

  // 2. Créer la partie en RAM (Game Engine)
  const game = gameStore.createGame(tableId, players);

  // 3. Mettre à jour l'état de la table en BDD (Optionnel, pour l'affichage dans le lobby)
  const { error } = await supabase
    .from('tables')
    .update({ etat: 'en_cours' })
    .eq('id', tableId);

  if (error) {
    // Si erreur BDD, on annule la création en mémoire
    gameStore.removeGame(tableId);
    return { error };
  }

  return { data: game };
};

export const getByTableId = async (tableId) => {
  // On récupère directement depuis la RAM
  const game = gameStore.getGame(tableId);
  if (!game) {
    return { error: { message: "Aucune partie active sur cette table." } };
  }
  return { data: game };
};

// Pas de "getById" car l'ID du jeu = ID de la table dans notre implémentation RAM
// Pas de "update" générique, on passe par des méthodes spécifiques du store si besoin

export const endGame = async (tableId) => {
  // 1. Supprimer la partie de la mémoire
  gameStore.removeGame(tableId);

  // 2. Remettre la table en attente en BDD
  const { error } = await supabase
    .from('tables')
    .update({ etat: 'en_attente' })
    .eq('id', tableId)
    .select()
    .single();

  return { data: { message: "Partie terminée" }, error };
};
