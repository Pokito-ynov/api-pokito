import { supabase } from '../config/supabase.js';

export const getCosmetics = async ({ type, availableOnly = true } = {}) => {
  let query = supabase
    .from('cosmetic_catalog')
    .select('id, type, name, slug, description, asset_url, rarity, price_chips, is_available, created_at')
    .order('type', { ascending: true })
    .order('price_chips', { ascending: true });

  if (availableOnly) {
    query = query.eq('is_available', true);
  }

  if (type) {
    query = query.eq('type', type);
  }

  return query;
};

export const getArenas = async ({ availableOnly = true } = {}) => {
  let query = supabase
    .from('arenas')
    .select('id, name, slug, description, background_asset_url, theme_color, is_available, created_at')
    .order('name', { ascending: true });

  if (availableOnly) {
    query = query.eq('is_available', true);
  }

  return query;
};