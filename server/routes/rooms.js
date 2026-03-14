const express = require('express');
const router = express.Router();
const { createRoom, getRooms, getRoomByCode, joinRoom, leaveRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRooms);
router.post('/', protect, createRoom);
router.get('/:code', protect, getRoomByCode);
router.post('/join', protect, joinRoom);
router.delete('/:id/leave', protect, leaveRoom);

module.exports = router;
