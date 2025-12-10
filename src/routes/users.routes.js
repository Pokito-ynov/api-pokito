import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';

const router = Router();

router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);

export default router;

