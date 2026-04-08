import * as usersService from '../services/users.service.js';

export const register = async (req, res) => {
  const { email, password, pseudo, phone, birthdate } = req.body;

  if (!email || !password || !pseudo) {
    return res.status(400).json({ error: 'Email, password and pseudo are required' });
  }

  const { data, error } = await usersService.register({ email, password, pseudo, phone, birthdate });

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

export const getWallet = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await usersService.getWallet(id);

  if (error) {
    const status = error.message === 'User not found' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const getInventory = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  const { data, error } = await usersService.getInventory(id, { type });

  if (error) {
    const status = error.message === 'User not found' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const purchaseCosmetic = async (req, res) => {
  const { id } = req.params;
  const { cosmeticId } = req.body;

  if (!cosmeticId) {
    return res.status(400).json({ error: 'cosmeticId is required' });
  }

  const { data, error } = await usersService.purchaseCosmetic(id, cosmeticId);

  if (error) {
    const statusMap = {
      'User not found': 404,
      'Cosmetic not found': 404,
      'Cosmetic unavailable': 400,
      'Cosmetic already owned': 409,
      'Insufficient chips': 400
    };

    return res.status(statusMap[error.message] || 400).json({ error: error.message });
  }

  return res.status(201).json(data);
};

export const updateLoadout = async (req, res) => {
  const { id } = req.params;
  const loadout = req.body;

  const { data, error } = await usersService.updateLoadout(id, loadout);

  if (error) {
    const statusMap = {
      'User not found': 404,
      'No loadout field provided': 400,
      'Avatar not owned by user': 400,
      'Card skin not owned by user': 400,
      'Selected cosmetic is not an avatar': 400,
      'Selected cosmetic is not a card skin': 400
    };

    return res.status(statusMap[error.message] || 400).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const getHistory = async (req, res) => {
  const { id } = req.params;
  const limit = Number.parseInt(req.query.limit || '20', 10);

  const { data, error } = await usersService.getHistory(id, { limit });

  if (error) {
    const status = error.message === 'User not found' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

  return res.status(200).json(data);
};

