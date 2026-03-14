import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar status stats')
      .sort({ 'stats.wins': -1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

export const sendFriendRequest = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) throw new ApiError(404, 'User not found');

    if (targetUser.friendRequests.includes(req.user._id)) {
      throw new ApiError(400, 'Friend request already sent');
    }

    if (targetUser.friends.includes(req.user._id)) {
      throw new ApiError(400, 'Already friends');
    }

    await User.findByIdAndUpdate(req.params.id, {
      $push: { friendRequests: req.user._id },
    });

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (req, res, next) => {
  try {
    const requester = await User.findById(req.params.id);
    if (!requester) throw new ApiError(404, 'User not found');

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friendRequests: req.params.id },
      $push: { friends: req.params.id },
    });

    await User.findByIdAndUpdate(req.params.id, {
      $push: { friends: req.user._id },
    });

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('username avatar stats')
      .sort({ 'stats.wins': -1 })
      .limit(20);
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};