import { Router } from 'express';
import * as tablesController from '../controllers/tables.controller.js';

const router = Router();

router.get('/', tablesController.getAll);
router.get('/:id', tablesController.getById);
router.get('/code/:code', tablesController.getByCode);
router.post('/', tablesController.create);

export default router;

