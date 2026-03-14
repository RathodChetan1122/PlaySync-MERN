import React, { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';

export default function ChatPanel({ messages, socket, roomCode, user }) {
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat:typing', ({ username, isTyping }) => {
      setTyping(prev => isTyping
        ? [...new Set([...prev, username])]
        : prev.filter(u => u !== username)
      );
    });
    return () => socket.off('chat:typing');
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('chat:send', { roomCode, content: input });
    setInput('');
    socket.emit('chat:typing', { roomCode, isTyping: false });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket?.emit('chat:typing', { roomCode, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('chat:typing', { roomCode, isTyping: false });
    }, 2000);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>💬 Chat</span>
        <span className="chat-count">{messages.length} messages</span>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.type === 'system' ? 'system' : msg.senderName === user?.username ? 'own' : 'other'}`}>
            {msg.type === 'system' ? (
              <span className="system-msg">{msg.content}</span>
            ) : (
              <>
                <div className="msg-header">
                  <span className="msg-sender">{msg.senderName}</span>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="msg-content">{msg.content}</div>
              </>
            )}
          </div>
        ))}
        {typing.length > 0 && (
          <div className="typing-indicator">
            <span>{typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing</span>
            <span className="typing-dots"><span/><span/><span/></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          className="input chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          maxLength={500}
        />
        <button type="submit" className="btn btn-primary btn-sm chat-send-btn" disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
