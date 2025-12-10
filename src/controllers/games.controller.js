import * as gamesService from '../services/games.service.js';

export const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await gamesService.getById(id);

  if (error) {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json(data);
};

export const bet = async (req, res) => {
  const { id } = req.params;
  const { playerId, amount, type } = req.body;

  return res.status(501).json({ error: 'Not implemented yet' });
};

