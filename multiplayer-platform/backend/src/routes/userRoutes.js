import express from 'express';
import {
  getAllUsers,
  getUserById,
  sendFriendRequest,
  acceptFriendRequest,
  getLeaderboard,
} from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getAllUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserById);
router.post('/:id/friend-request', sendFriendRequest);
router.post('/:id/accept-friend', acceptFriendRequest);

export default router;