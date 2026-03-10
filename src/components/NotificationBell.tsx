"use client";

import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell() {
  const { notifications, unread, markAllRead } = useNotifications();

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }} title="Notificações">
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#e00', color: '#fff', borderRadius: '50%', fontSize: 12, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>{unread}</span>
        )}
      </button>
      {/* Lista de notificações */}
      {notifications.length > 0 && (
        <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 8px #0002', minWidth: 220, zIndex: 100 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 8 }}>
            {notifications.slice(-5).reverse().map(n => (
              <li key={n.id} style={{ padding: 8, borderBottom: '1px solid #eee', color: n.read ? '#888' : '#222' }}>{n.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
