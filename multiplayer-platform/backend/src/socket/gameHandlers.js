import Game from '../models/Game.js';
import User from '../models/User.js';
import { TicTacToe } from '../games/TicTacToe.js';
import { Connect4 } from '../games/Connect4.js';
import { Chess } from '../games/Chess.js';

const activeGames = new Map();
const rematchRequests = new Map();

const createEngine = (type) => {
  if (type === 'tictactoe') return new TicTacToe();
  if (type === 'connect4') return new Connect4();
  if (type === 'chess') return new Chess();
};

const gameHandlers = (io, socket) => {
  socket.on('create_game', async ({ roomId, gameType }) => {
    try {
      const game = await Game.create({
        room: roomId,
        type: gameType,
        players: [socket.user._id],
        status: 'waiting',
      });

      const engine = createEngine(gameType);
      activeGames.set(game._id.toString(), { engine, game });

      socket.join(`game:${game._id}`);
      socket.emit('game_created', { gameId: game._id, state: engine.getState() });
    } catch (err) {
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('join_game', async ({ gameId }) => {
    try {
      const gameData = activeGames.get(gameId);
      if (!gameData) return socket.emit('error', { message: 'Game not found' });

      const game = await Game.findByIdAndUpdate(
        gameId,
        { $push: { players: socket.user._id }, status: 'active' },
        { new: true }
      ).populate('players', 'username');

      socket.join(`game:${gameId}`);
      io.to(`game:${gameId}`).emit('game_started', {
        gameId,
        gameType: game.type,
        players: game.players,
        state: gameData.engine.getState(),
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('make_move', async ({ gameId, move }) => {
    try {
      const gameData = activeGames.get(gameId);
      if (!gameData) return socket.emit('error', { message: 'Game not found' });

      const game = await Game.findById(gameId);
      const playerIndex = game.players.findIndex(
        (p) => p.toString() === socket.user._id.toString()
      );

      let result;
      if (game.type === 'chess') {
        result = gameData.engine.makeMove(move.from, move.to, playerIndex);
      } else if (game.type === 'connect4') {
        result = gameData.engine.makeMove(move.col, playerIndex);
      } else {
        result = gameData.engine.makeMove(move.index, playerIndex);
      }

      if (!result.valid) return socket.emit('invalid_move', { reason: result.reason });

      await Game.findByIdAndUpdate(gameId, {
        $push: { moves: { player: socket.user._id, move } },
        boardState: result.board || result,
      });

      io.to(`game:${gameId}`).emit('move_made', { move, state: result });

      if (result.winner || result.isDraw) {
        let winnerId = null;
        let winnerUsername = null;

        if (result.winner) {
          const winnerIdx = result.winner === 'X' || result.winner === 'R' ? 0 : 1;
          const loserIdx = winnerIdx === 0 ? 1 : 0;
          winnerId = game.players[winnerIdx];
          const loserId = game.players[loserIdx];

          const winnerUser = await User.findById(winnerId);
          winnerUsername = winnerUser?.username || null;

          await User.findByIdAndUpdate(winnerId, { $inc: { 'stats.wins': 1 } });
          await User.findByIdAndUpdate(loserId, { $inc: { 'stats.losses': 1 } });
        } else {
          await User.updateMany(
            { _id: { $in: game.players } },
            { $inc: { 'stats.draws': 1 } }
          );
        }

        await Game.findByIdAndUpdate(gameId, {
          status: 'finished',
          winner: winnerId,
          isDraw: result.isDraw,
        });

        io.to(`game:${gameId}`).emit('game_over', {
          winner: result.winner,
          winnerUsername,
          isDraw: result.isDraw,
        });

        activeGames.delete(gameId);
      }
    } catch (err) {
      socket.emit('error', { message: 'Move failed' });
    }
  });

  socket.on('resign_game', async ({ gameId }) => {
    try {
      const game = await Game.findById(gameId).populate('players', 'username');
      if (!game) return socket.emit('error', { message: 'Game not found' });

      const winnerId = game.players.find(
        (p) => p._id.toString() !== socket.user._id.toString()
      );

      await Game.findByIdAndUpdate(gameId, {
        status: 'finished',
        winner: winnerId?._id,
      });

      await User.findByIdAndUpdate(winnerId?._id, { $inc: { 'stats.wins': 1 } });
      await User.findByIdAndUpdate(socket.user._id, { $inc: { 'stats.losses': 1 } });

      io.to(`game:${gameId}`).emit('game_over', {
        winner: null,
        resigned: socket.user.username,
        winnerUsername: winnerId?.username,
      });

      activeGames.delete(gameId);
    } catch (err) {
      socket.emit('error', { message: 'Resign failed' });
    }
  });

  // --- Rematch flow ---

  socket.on('request_rematch', ({ gameId }) => {
    rematchRequests.set(gameId, {
      requesterId: socket.user._id.toString(),
      requesterUsername: socket.user.username,
    });
    socket.to(`game:${gameId}`).emit('rematch_requested', {
      from: socket.user.username,
    });
  });

  socket.on('accept_rematch', async ({ gameId, roomId, gameType }) => {
    try {
      const request = rematchRequests.get(gameId);
      if (!request) return socket.emit('error', { message: 'No rematch request found' });
      rematchRequests.delete(gameId);

      // Create a new game
      const oldGame = await Game.findById(gameId).populate('players', 'username');
      if (!oldGame) return socket.emit('error', { message: 'Original game not found' });

      const type = gameType || oldGame.type;
      const newGame = await Game.create({
        room: roomId || oldGame.room,
        type,
        players: oldGame.players.map((p) => p._id),
        status: 'active',
      });

      const engine = createEngine(type);
      activeGames.set(newGame._id.toString(), { engine, game: newGame });

      // Make sure both players are in the new game room
      const socketsInRoom = await io.in(`game:${gameId}`).fetchSockets();
      for (const s of socketsInRoom) {
        s.join(`game:${newGame._id}`);
      }

      io.to(`game:${newGame._id}`).emit('rematch_started', {
        gameId: newGame._id,
        gameType: type,
        players: oldGame.players,
        state: engine.getState(),
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to start rematch' });
    }
  });

  socket.on('decline_rematch', ({ gameId }) => {
    rematchRequests.delete(gameId);
    socket.to(`game:${gameId}`).emit('rematch_declined');
  });
};

export default gameHandlers;