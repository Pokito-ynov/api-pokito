import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

const USER_PUBLIC_SELECT = 'id, email, pseudo, avatar, skin_cartes, active_avatar_id, active_card_skin_id, created_at';

const getUserRecord = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  return { data, error };
};

const ensureWallet = async (userId) => {
  const { data: user, error: userError } = await getUserRecord(userId);
  if (userError || !user) {
    return { data: null, error: { message: 'User not found' } };
  }

  const { data: wallet, error: walletError } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletError) {
    return { data: null, error: walletError };
  }

  if (wallet) {
    return { data: wallet, error: null };
  }

  return supabase
    .from('user_wallets')
    .insert({ user_id: userId })
    .select('*')
    .single();
};

const getOwnedCosmetic = async (userId, cosmeticId) => {
  return supabase
    .from('user_inventory')
    .select('id, cosmetic_id, cosmetic:cosmetic_catalog(id, type, name, slug)')
    .eq('user_id', userId)
    .eq('cosmetic_id', cosmeticId)
    .maybeSingle();
};

export const register = async ({ email, password, pseudo, phone, birthdate }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password: hashedPassword, pseudo, phone, birthdate })
    .select(USER_PUBLIC_SELECT)
    .single();
  return { data, error };
};

export const oauthRegister = async ({ email, pseudo, avatar }) => {
  if (!email) {
    return { data: null, error: { message: 'Email is required' } };
  }

  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select(USER_PUBLIC_SELECT)
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    return { data: null, error: lookupError };
  }

  if (existing) {
    return { data: existing, error: null };
  }

  const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
  const basePseudo = (pseudo || email.split('@')[0] || 'Joueur').slice(0, 15);

  const tryInsert = (candidatePseudo) => supabase
    .from('users')
    .insert({
      email,
      password: randomPassword,
      pseudo: candidatePseudo,
      avatar: avatar || null
    })
    .select(USER_PUBLIC_SELECT)
    .single();

  let attempt = await tryInsert(basePseudo);

  if (attempt.error && /pseudo/i.test(attempt.error.message || '')) {
    const fallback = `${basePseudo.slice(0, 10)}_${Math.floor(Math.random() * 9999)}`;
    attempt = await tryInsert(fallback);
  }

  return attempt;
};

export const login = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { data: null, error: { message: 'Invalid credentials' } };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { data: null, error: { message: 'Invalid credentials' } };
  }

  const { password: _, ...userWithoutPassword } = user;
  return { data: userWithoutPassword, error: null };
};

export const getById = async (id) => {
  return supabase
    .from('users')
    .select(USER_PUBLIC_SELECT)
    .eq('id', id)
    .single();
};

export const update = async (id, data) => {
  // Whitelist allowed fields to prevent overwriting id, email, etc.
  const ALLOWED_FIELDS = ['pseudo', 'avatar', 'skin_cartes', 'password'];
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: { message: 'No valid fields to update' } };
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  return supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select(USER_PUBLIC_SELECT)
    .single();
};

export const getWallet = async (id) => {
  return ensureWallet(id);
};

export const adjustWalletBalance = async (userId, deltaChips) => {
  const { data: wallet, error: walletError } = await ensureWallet(userId);
  if (walletError) {
    return { data: null, error: walletError };
  }

  const nextBalance = wallet.balance_chips + deltaChips;

  const { data, error } = await supabase
    .from('user_wallets')
    .update({
      balance_chips: nextBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select('*')
    .single();

  return { data, error };
};

export const getInventory = async (id, { type } = {}) => {
  const { data: user, error: userError } = await getUserRecord(id);
  if (userError || !user) {
    return { data: null, error: { message: 'User not found' } };
  }

  const { data, error } = await supabase
    .from('user_inventory')
    .select(`
      id,
      acquired_at,
      source,
      cosmetic:cosmetic_catalog(
        id,
        type,
        name,
        slug,
        asset_url,
        rarity,
        price_chips,
        is_available
      )
    `)
    .eq('user_id', id)
    .order('acquired_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const filtered = type
    ? data.filter((item) => item.cosmetic?.type === type)
    : data;

  return { data: filtered, error: null };
};

export const purchaseCosmetic = async (userId, cosmeticId) => {
  const { data: wallet, error: walletError } = await ensureWallet(userId);
  if (walletError) {
    return { data: null, error: walletError };
  }

  const { data: cosmetic, error: cosmeticError } = await supabase
    .from('cosmetic_catalog')
    .select('id, type, name, slug, asset_url, rarity, price_chips, is_available')
    .eq('id', cosmeticId)
    .maybeSingle();

  if (cosmeticError) {
    return { data: null, error: cosmeticError };
  }

  if (!cosmetic) {
    return { data: null, error: { message: 'Cosmetic not found' } };
  }

  if (!cosmetic.is_available) {
    return { data: null, error: { message: 'Cosmetic unavailable' } };
  }

  const { data: existingOwnership, error: ownershipError } = await getOwnedCosmetic(userId, cosmeticId);
  if (ownershipError) {
    return { data: null, error: ownershipError };
  }

  if (existingOwnership) {
    return { data: null, error: { message: 'Cosmetic already owned' } };
  }

  if (wallet.balance_chips < cosmetic.price_chips) {
    return { data: null, error: { message: 'Insufficient chips' } };
  }

  const { data: updatedWallet, error: walletUpdateError } = await supabase
    .from('user_wallets')
    .update({
      balance_chips: wallet.balance_chips - cosmetic.price_chips,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id)
    .select('*')
    .single();

  if (walletUpdateError) {
    return { data: null, error: walletUpdateError };
  }

  const { data: inventoryItem, error: inventoryError } = await supabase
    .from('user_inventory')
    .insert({
      user_id: userId,
      cosmetic_id: cosmeticId,
      source: 'shop'
    })
    .select('id, acquired_at, source, cosmetic:cosmetic_catalog(id, type, name, slug, asset_url, rarity, price_chips, is_available)')
    .single();

  if (inventoryError) {
    return { data: null, error: inventoryError };
  }

  return {
    data: {
      wallet: updatedWallet,
      item: inventoryItem
    },
    error: null
  };
};

export const updateLoadout = async (userId, loadout) => {
  const { data: user, error: userError } = await getUserRecord(userId);
  if (userError || !user) {
    return { data: null, error: { message: 'User not found' } };
  }

  const hasAvatarField = Object.prototype.hasOwnProperty.call(loadout, 'avatarId');
  const hasCardSkinField = Object.prototype.hasOwnProperty.call(loadout, 'cardSkinId');

  if (!hasAvatarField && !hasCardSkinField) {
    return { data: null, error: { message: 'No loadout field provided' } };
  }

  const updateData = {};

  if (hasAvatarField) {
    if (loadout.avatarId === null) {
      updateData.active_avatar_id = null;
    } else {
      const { data: ownedAvatar, error: avatarError } = await getOwnedCosmetic(userId, loadout.avatarId);
      if (avatarError) {
        return { data: null, error: avatarError };
      }
      if (!ownedAvatar) {
        return { data: null, error: { message: 'Avatar not owned by user' } };
      }
      if (ownedAvatar.cosmetic?.type !== 'avatar') {
        return { data: null, error: { message: 'Selected cosmetic is not an avatar' } };
      }
      updateData.active_avatar_id = loadout.avatarId;
    }
  }

  if (hasCardSkinField) {
    if (loadout.cardSkinId === null) {
      updateData.active_card_skin_id = null;
    } else {
      const { data: ownedCardSkin, error: skinError } = await getOwnedCosmetic(userId, loadout.cardSkinId);
      if (skinError) {
        return { data: null, error: skinError };
      }
      if (!ownedCardSkin) {
        return { data: null, error: { message: 'Card skin not owned by user' } };
      }
      if (ownedCardSkin.cosmetic?.type !== 'card_skin') {
        return { data: null, error: { message: 'Selected cosmetic is not a card skin' } };
      }
      updateData.active_card_skin_id = loadout.cardSkinId;
    }
  }

  return supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, active_avatar_id, active_card_skin_id')
    .single();
};

export const getHistory = async (userId, { limit = 20 } = {}) => {
  const { data: user, error: userError } = await getUserRecord(userId);
  if (userError || !user) {
    return { data: null, error: { message: 'User not found' } };
  }

  return supabase
    .from('game_result_players')
    .select(`
      id,
      position,
      chips_change,
      hand_strength,
      folded,
      created_at,
      result:game_results(
        id,
        table_id,
        arena_id,
        started_at,
        ended_at,
        pot_total,
        players_count,
        winner_user_id,
        arena:arenas(id, name, slug, theme_color)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
};

