import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.routes.js';
import tablesRoutes from './routes/tables.routes.js';
import gamesRoutes from './routes/games.routes.js';

// Récupérer le chemin du dossier courant pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du dossier 'public' (situé à la racine du projet)
app.use(express.static(path.join(__dirname, '../public')));

// Routes API
app.use('/users', usersRoutes);
app.use('/tables', tablesRoutes);
app.use('/games', gamesRoutes);

// Route par défaut (Health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pokito Backend is running' });
});

export default app;
