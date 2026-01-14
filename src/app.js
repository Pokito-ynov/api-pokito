import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.routes.js';
import tablesRoutes from './routes/tables.routes.js';
import gamesRoutes from './routes/games.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/users', usersRoutes);
app.use('/tables', tablesRoutes);
app.use('/games', gamesRoutes);
app.get('/health', (res) => {
  res.json({ status: 'ok', message: 'Pokito Backend is running' });
});

export default app;