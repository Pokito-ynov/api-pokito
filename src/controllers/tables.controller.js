import * as tablesService from '../services/tables.service.js';

export const create = async (req, res) => {
  const { type, joueursMax } = req.body;

  const { data, error } = await tablesService.create({ type, joueursMax });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
};

export const getAll = async (req, res) => {
  const { data, error } = await tablesService.getAll();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
};

export const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await tablesService.getById(id);

  if (error) {
    return res.status(404).json({ error: 'Table not found' });
  }

  return res.status(200).json(data);
};

export const getByCode = async (req, res) => {
  const { code } = req.params;

  const { data, error } = await tablesService.getByCode(code);

  if (error) {
    return res.status(404).json({ error: 'Table not found' });
  }

  return res.status(200).json(data);
};

