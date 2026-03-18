import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

export const register = async ({ email, password, pseudo, phone, birthdate }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password: hashedPassword, pseudo, phone, birthdate })
    .select('id, email, pseudo, avatar, skin_cartes, created_at')
    .single();
  return { data, error };
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
    .select('id, email, pseudo, avatar, skin_cartes, created_at')
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
    .select('id, email, pseudo, avatar, skin_cartes, created_at')
    .single();
};

