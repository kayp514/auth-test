'use client';

import { useEffect, useCallback, useState } from 'react';

type Notification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
};

interface NotificationDisplayProps {
  appType: string;  // e.g., 'admin', 'user', etc.

  
}

export function NotificationDisplay({ appType }: NotificationDisplayProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      
      const response = await fetch('/api/real/with-room');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const { data } = await response.json();
      setNotifications(prev => 
        reset ? data.notifications : [...prev, ...data.notifications]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  }, [appType]);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);



  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Notifications for {appType}</h2>
      <button onClick={() => fetchNotifications(true)}>Refresh</button>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} className={`notification-${notification.type}`}>
            <strong>{notification.type}</strong>: {notification.message}
            <br />
            <small>{new Date(notification.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}