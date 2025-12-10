import { supabase } from '../config/supabase.js';

const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const create = async ({ type = 'publique', joueursMax = 8 }) => {
  const code = generateCode();
  return supabase
    .from('tables')
    .insert({ code, type, joueurs_max: joueursMax })
    .select()
    .single();
};

export const getAll = async () => {
  return supabase
    .from('tables')
    .select('*')
    .eq('type', 'publique')
    .eq('etat', 'en_attente');
};

export const getById = async (id) => {
  return supabase
    .from('tables')
    .select('*')
    .eq('id', id)
    .single();
};

export const getByCode = async (code) => {
  return supabase
    .from('tables')
    .select('*')
    .eq('code', code)
    .single();
};

export const addPlayer = async (tableId, userId) => {
  return supabase
    .from('table_players')
    .insert({ table_id: tableId, user_id: userId })
    .select()
    .single();
};

export const removePlayer = async (tableId, userId) => {
  return supabase
    .from('table_players')
    .delete()
    .eq('table_id', tableId)
    .eq('user_id', visitorId);
};

export const getPlayers = async (tableId) => {
  return supabase
    .from('table_players')
    .select('*, users(id, pseudo, avatar)')
    .eq('table_id', tableId);
};

export const updateState = async (id, etat) => {
  return supabase
    .from('tables')
    .update({ etat })
    .eq('id', id)
    .select()
    .single();
};

