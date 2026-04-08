import * as catalogService from '../services/catalog.service.js';

export const getCosmetics = async (req, res) => {
  const { type, includeUnavailable } = req.query;

  const { data, error } = await catalogService.getCosmetics({
    type,
    availableOnly: includeUnavailable !== 'true'
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const getArenas = async (req, res) => {
  const { includeUnavailable } = req.query;

  const { data, error } = await catalogService.getArenas({
    availableOnly: includeUnavailable !== 'true'
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
};