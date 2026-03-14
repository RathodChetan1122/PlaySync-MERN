import Room from '../models/Room.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';

export const createRoom = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    const room = await Room.create({
      name,
      type: type || 'public',
      admin: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ type: 'public' })
      .populate('members', 'username avatar status')
      .populate('admin', 'username');
    res.json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username avatar status')
      .populate('admin', 'username');
    if (!room) throw new ApiError(404, 'Room not found');
    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) throw new ApiError(404, 'Room not found');

    if (!room.members.includes(req.user._id)) {
      await Room.findByIdAndUpdate(req.params.id, {
        $push: { members: req.user._id },
      });
    }

    res.json({ success: true, message: 'Joined room' });
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(50);
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};