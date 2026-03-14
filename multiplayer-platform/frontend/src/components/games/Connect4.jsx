import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const ROWS = 6;
const COLS = 7;

const createEmptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

export default function Connect4({ gameId: initialGameId, players: initialPlayers, roomId }) {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentTurn, setCurrentTurn] = useState(0);
    const [gameOver, setGameOver] = useState(null);
    const [gameId, setGameId] = useState(initialGameId);
    const [players, setPlayers] = useState(initialPlayers);
    const [rematchState, setRematchState] = useState(null);
    const [rematchFrom, setRematchFrom] = useState('');
    const [hoverCol, setHoverCol] = useState(-1);

    const myIndex = players.findIndex((p) => p._id === user._id);

    useEffect(() => {
        if (!socket) return;

        const onMoveMade = ({ state }) => {
            setBoard(state.board);
            setCurrentTurn(state.nextTurn);
        };

        const onGameOver = ({ winner, isDraw, resigned, winnerUsername }) => {
            if (resigned) {
                setGameOver(`${resigned} resigned — ${winnerUsername || 'Opponent'} wins! 🏆`);
            } else if (isDraw) {
                setGameOver("It's a Draw! 🤝");
            } else {
                const colorName = winner === 'R' ? '🔴 Red' : '🟡 Yellow';
                setGameOver(`${colorName} wins! 🎉`);
            }
            setRematchState(null);
        };

        const onRematchRequested = ({ from }) => {
            setRematchState('received');
            setRematchFrom(from);
        };

        const onRematchStarted = ({ gameId: newGameId, players: newPlayers, state }) => {
            setGameId(newGameId);
            setPlayers(newPlayers);
            setBoard(state.board);
            setCurrentTurn(state.currentTurn);
            setGameOver(null);
            setRematchState(null);
            setRematchFrom('');
        };

        const onRematchDeclined = () => {
            setRematchState(null);
        };

        const onInvalidMove = ({ reason }) => {
            console.warn('Invalid move:', reason);
        };

        socket.on('move_made', onMoveMade);
        socket.on('game_over', onGameOver);
        socket.on('rematch_requested', onRematchRequested);
        socket.on('rematch_started', onRematchStarted);
        socket.on('rematch_declined', onRematchDeclined);
        socket.on('invalid_move', onInvalidMove);

        return () => {
            socket.off('move_made', onMoveMade);
            socket.off('game_over', onGameOver);
            socket.off('rematch_requested', onRematchRequested);
            socket.off('rematch_started', onRematchStarted);
            socket.off('rematch_declined', onRematchDeclined);
            socket.off('invalid_move', onInvalidMove);
        };
    }, [socket]);

    const handleColumnClick = (col) => {
        if (gameOver || currentTurn !== myIndex) return;
        // Check if column is full
        if (board[0][col] !== null) return;
        socket?.emit('make_move', { gameId, move: { col } });
    };

    const handleResign = () => {
        if (gameOver) return;
        socket?.emit('resign_game', { gameId });
    };

    const handleRequestRematch = () => {
        setRematchState('requested');
        socket?.emit('request_rematch', { gameId });
    };

    const handleAcceptRematch = () => {
        socket?.emit('accept_rematch', { gameId, roomId, gameType: 'connect4' });
    };

    const handleDeclineRematch = () => {
        socket?.emit('decline_rematch', { gameId });
        setRematchState(null);
    };

    const isMyTurn = currentTurn === myIndex;
    const myColor = myIndex === 0 ? 'R' : 'Y';

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3 style={styles.status}>
                    {gameOver ? gameOver : isMyTurn ? '✅ Your Turn' : "⏳ Opponent's Turn"}
                </h3>

                {/* Column drop buttons */}
                <div style={styles.dropRow}>
                    {Array(COLS).fill(null).map((_, col) => (
                        <button
                            key={col}
                            onClick={() => handleColumnClick(col)}
                            onMouseEnter={() => setHoverCol(col)}
                            onMouseLeave={() => setHoverCol(-1)}
                            style={{
                                ...styles.dropBtn,
                                opacity: isMyTurn && !gameOver && board[0][col] === null ? 1 : 0.3,
                                cursor: isMyTurn && !gameOver && board[0][col] === null ? 'pointer' : 'default',
                            }}
                        >
                            <span style={{
                                fontSize: '20px',
                                color: myColor === 'R' ? '#f38ba8' : '#f9e2af',
                                transition: 'transform 0.2s',
                                transform: hoverCol === col && isMyTurn && !gameOver ? 'scale(1.3)' : 'scale(1)',
                                display: 'inline-block',
                            }}>▼</span>
                        </button>
                    ))}
                </div>

                {/* Board */}
                <div style={styles.board}>
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <div key={`${r}-${c}`} style={styles.cell}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: cell === 'R' ? '#f38ba8' : cell === 'Y' ? '#f9e2af' : '#1e1e2e',
                                    transition: 'background 0.2s, transform 0.2s',
                                    transform: cell ? 'scale(1)' : 'scale(0.6)',
                                    boxShadow: cell === 'R'
                                        ? '0 0 10px rgba(243, 139, 168, 0.4)'
                                        : cell === 'Y'
                                            ? '0 0 10px rgba(249, 226, 175, 0.4)'
                                            : 'none',
                                }} />
                            </div>
                        ))
                    )}
                </div>

                {/* Player info */}
                <div style={styles.players}>
                    {players.map((p, i) => (
                        <div key={p._id} style={{
                            ...styles.playerTag,
                            background: currentTurn === i && !gameOver ? '#45475a' : 'transparent',
                        }}>
                            <span style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: i === 0 ? '#f38ba8' : '#f9e2af', display: 'inline-block',
                            }} />
                            <span style={styles.playerName}>{p.username}</span>
                            {currentTurn === i && !gameOver && <span style={styles.turnDot} />}
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div style={styles.actions}>
                    {!gameOver && (
                        <button onClick={handleResign} style={styles.resignBtn}>
                            🏳️ Resign
                        </button>
                    )}

                    {gameOver && !rematchState && (
                        <button onClick={handleRequestRematch} style={styles.rematchBtn}>
                            🔄 Play Again
                        </button>
                    )}

                    {rematchState === 'requested' && (
                        <div style={styles.rematchNotice}>
                            <span>⏳</span> Waiting for opponent to accept...
                        </div>
                    )}

                    {rematchState === 'received' && (
                        <div style={styles.rematchPrompt}>
                            <p style={styles.rematchText}>{rematchFrom} wants a rematch!</p>
                            <div style={styles.rematchBtnRow}>
                                <button onClick={handleAcceptRematch} style={styles.acceptBtn}>
                                    ✅ Accept
                                </button>
                                <button onClick={handleDeclineRematch} style={styles.declineBtn}>
                                    ❌ Decline
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', padding: '24px' },
    card: { background: '#2e2e3e', borderRadius: '16px', padding: '32px', textAlign: 'center' },
    status: { color: '#cdd6f4', marginBottom: '20px', fontSize: '18px' },
    dropRow: {
        display: 'grid', gridTemplateColumns: `repeat(${COLS}, 56px)`, gap: '4px',
        margin: '0 auto 4px', width: 'fit-content',
    },
    dropBtn: {
        width: '56px', height: '32px', background: 'transparent', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.2s',
    },
    board: {
        display: 'grid', gridTemplateColumns: `repeat(${COLS}, 56px)`, gap: '4px',
        margin: '0 auto 24px', width: 'fit-content',
        background: '#313244', borderRadius: '12px', padding: '8px',
    },
    cell: {
        width: '56px', height: '56px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
    },
    players: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' },
    playerTag: {
        display: 'flex', alignItems: 'center', gap: '8px',
        color: '#cdd6f4', fontSize: '14px', fontWeight: 600,
        padding: '6px 14px', borderRadius: '8px', transition: 'background 0.2s',
    },
    playerName: { color: '#cdd6f4' },
    turnDot: { width: '8px', height: '8px', background: '#a6e3a1', borderRadius: '50%' },
    actions: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    resignBtn: {
        padding: '10px 24px', background: 'transparent', border: '1px solid #f38ba8',
        color: '#f38ba8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
    rematchBtn: {
        padding: '12px 32px', background: '#a6e3a1', color: '#1e1e2e',
        border: 'none', borderRadius: '10px', cursor: 'pointer',
        fontWeight: 700, fontSize: '16px',
    },
    rematchNotice: {
        color: '#a6adc8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    rematchPrompt: {
        background: '#1e1e2e', borderRadius: '12px', padding: '16px 24px',
        border: '1px solid #6366f1',
    },
    rematchText: { color: '#cdd6f4', fontSize: '15px', margin: '0 0 12px', fontWeight: 600 },
    rematchBtnRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
    acceptBtn: {
        padding: '8px 20px', background: '#a6e3a1', color: '#1e1e2e',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
    },
    declineBtn: {
        padding: '8px 20px', background: 'transparent', border: '1px solid #f38ba8',
        color: '#f38ba8', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
    },
};
