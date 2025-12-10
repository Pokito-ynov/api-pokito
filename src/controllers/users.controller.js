import * as usersService from '../services/users.service.js';

export const register = async (req, res) => {
  const { email, password, pseudo } = req.body;

  if (!email || !password || !pseudo) {
    return res.status(400).json({ error: 'Email, password and pseudo are required' });
  }

  const { data, error } = await usersService.register({ email, password, pseudo });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await usersService.login({ email, password });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await usersService.getById(id);

  if (error) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(data);
};

export const update = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await usersService.update(id, updateData);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json(data);
};

