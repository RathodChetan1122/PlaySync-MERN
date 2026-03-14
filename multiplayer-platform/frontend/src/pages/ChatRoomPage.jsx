import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ChatRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then((res) => setRoom(res.data.room))
      .catch(() => { toast.error('Room not found'); navigate('/'); });
  }, [id]);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>← Back</button>
          <h2 style={styles.roomName}>{room?.name || 'Loading...'}</h2>
          <span style={styles.members}>{room?.members?.length || 0} members</span>
          <button
            onClick={() => navigate(`/game/${id}`)}
            style={styles.gameBtn}
          >
            🎮 Start Game
          </button>
        </div>
        <div style={styles.chatArea}>
          {room && <ChatWindow roomId={id} />}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e2e' },
  container: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '900px', width: '100%', margin: '0 auto', padding: '16px', gap: '12px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', background: '#2e2e3e', padding: '12px 20px', borderRadius: '12px' },
  backBtn: { background: 'none', border: '1px solid #45475a', color: '#cdd6f4', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  roomName: { color: '#cdd6f4', margin: 0, flex: 1, fontSize: '18px' },
  members: { color: '#a6adc8', fontSize: '13px' },
  gameBtn: { padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 },
  chatArea: { flex: 1, background: '#2e2e3e', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};