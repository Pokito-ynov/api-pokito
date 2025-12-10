import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

export const register = async ({ email, password, pseudo }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return supabase
    .from('users')
    .insert({ email, password: hashedPassword, pseudo })
    .select()
    .single();
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
  const updateData = { ...data };
  
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

