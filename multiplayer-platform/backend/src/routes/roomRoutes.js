import express from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  getRoomMessages,
} from '../controllers/roomController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getRooms);
router.post('/', createRoom);
router.get('/:id', getRoomById);
router.post('/:id/join', joinRoom);
router.get('/:id/messages', getRoomMessages);

export default router;