import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';

const router = Router();

router.post('/register', usersController.register);
router.post('/oauth/discord', usersController.oauthRegister);
router.post('/login', usersController.login);
router.get('/:id/wallet', usersController.getWallet);
router.get('/:id/inventory', usersController.getInventory);
router.get('/:id/history', usersController.getHistory);
router.post('/:id/inventory/purchase', usersController.purchaseCosmetic);
router.put('/:id/loadout', usersController.updateLoadout);
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);

export default router;

