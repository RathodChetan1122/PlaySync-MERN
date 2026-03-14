import React from 'react';
import './MembersList.css';

export default function MembersList({ members, hostId, currentUserId }) {
  return (
    <div className="members-list card">
      <div className="members-header">👥 Members ({members.length})</div>
      <div className="members-items">
        {members.map(m => (
          <div key={m._id} className="member-item">
            <div className="member-avatar">
              {m.avatar ? <img src={m.avatar} alt="" /> : m.username?.[0]?.toUpperCase()}
            </div>
            <div className="member-info">
              <span className="member-name">
                {m.username}
                {m._id === currentUserId && <span className="you-tag"> (You)</span>}
              </span>
              <span className={`badge badge-${m.status || 'online'}`} style={{fontSize:10}}>
                {m._id === hostId ? '👑 Host' : m.status || 'online'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
