import { Router } from 'express';
import * as gamesController from '../controllers/games.controller.js';

const router = Router();

router.get('/:id', gamesController.getById);
router.post('/:id/bet', gamesController.bet);

export default router;

