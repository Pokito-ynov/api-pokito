import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller.js';

const router = Router();

router.get('/cosmetics', catalogController.getCosmetics);
router.get('/arenas', catalogController.getArenas);

export default router;