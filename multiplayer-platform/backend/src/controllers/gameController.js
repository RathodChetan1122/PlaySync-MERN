import Game from '../models/Game.js';
import ApiError from '../utils/ApiError.js';

export const getGameHistory = async (req, res, next) => {
  try {
    const games = await Game.find({
      players: req.user._id,
      status: 'finished',
    })
      .populate('players', 'username avatar')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, games });
  } catch (error) {
    next(error);
  }
};

export const getGameById = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('players', 'username avatar')
      .populate('winner', 'username');

    if (!game) throw new ApiError(404, 'Game not found');

    res.json({ success: true, game });
  } catch (error) {
    next(error);
  }
};