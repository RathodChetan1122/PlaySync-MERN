import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function ChatWindow({ roomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    api.get(`/rooms/${roomId}/messages`).then((res) => setMessages(res.data.messages));
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { roomId });
    socket.on('receive_message', (message) => setMessages((prev) => [...prev, message]));
    socket.on('user_typing', ({ username }) => setTyping(`${username} is typing...`));
    socket.on('user_stop_typing', () => setTyping(''));

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = (e) => {
    setInput(e.target.value);
    socket?.emit('typing_start', { roomId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing_stop', { roomId }), 1000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket?.emit('send_message', { roomId, content: input });
    setInput('');
    socket?.emit('typing_stop', { roomId });
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.map((msg) => (
          <div key={msg._id} style={{ ...styles.row, justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start' }}>
            <div style={{ ...styles.bubble, background: msg.sender._id === user._id ? '#6366f1' : '#45475a' }}>
              <small style={styles.sender}>{msg.sender.username}</small>
              <p style={styles.content}>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {typing && <p style={styles.typing}>{typing}</p>}
      <form onSubmit={sendMessage} style={styles.inputRow}>
        <input value={input} onChange={handleInput} placeholder="Type a message..." style={styles.input} />
        <button type="submit" style={styles.button}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex' },
  bubble: { maxWidth: '70%', padding: '10px 14px', borderRadius: '12px' },
  sender: { color: 'rgba(255,255,255,0.6)', fontSize: '11px' },
  content: { color: '#fff', margin: '4px 0 0', fontSize: '14px' },
  typing: { padding: '4px 16px', color: '#a6adc8', fontSize: '12px', fontStyle: 'italic' },
  inputRow: { display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid #45475a' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #45475a', background: '#1e1e2e', color: '#cdd6f4', fontSize: '14px' },
  button: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
};