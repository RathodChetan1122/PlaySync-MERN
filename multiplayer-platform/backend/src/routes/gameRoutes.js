import express from 'express';
import { getGameHistory, getGameById } from '../controllers/gameController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/history', getGameHistory);
router.get('/:id', getGameById);

export default router;