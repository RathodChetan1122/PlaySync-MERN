const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

const generateCode = () => uuidv4().slice(0, 6).toUpperCase();

const createRoom = async (req, res) => {
  try {
    const { name, isPrivate, password, maxMembers } = req.body;
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await Room.findOne({ code });
    }

    const room = await Room.create({
      name,
      code,
      host: req.user._id,
      members: [req.user._id],
      isPrivate: isPrivate || false,
      password: password || '',
      maxMembers: maxMembers || 8,
    });

    await room.populate('host members', 'username avatar status');
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('host members', 'username avatar status')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('host members', 'username avatar status');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { code, password } = req.body;
    const room = await Room.findOne({ code: code.toUpperCase() })
      .populate('host members', 'username avatar status');

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.members.length >= room.maxMembers) return res.status(400).json({ message: 'Room is full' });
    if (room.isPrivate && room.password !== password) return res.status(403).json({ message: 'Wrong room password' });

    const alreadyMember = room.members.find(m => m._id.toString() === req.user._id.toString());
    if (!alreadyMember) {
      room.members.push(req.user._id);
      await room.save();
      await room.populate('host members', 'username avatar status');
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.members = room.members.filter(m => m.toString() !== req.user._id.toString());

    if (room.members.length === 0) {
      await Room.findByIdAndDelete(room._id);
      return res.json({ message: 'Room deleted' });
    }

    if (room.host.toString() === req.user._id.toString()) {
      room.host = room.members[0];
    }

    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getRooms, getRoomByCode, joinRoom, leaveRoom };
