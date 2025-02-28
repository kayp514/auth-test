{/*'use client';

import { useSocket, type Notification } from '@/app/providers/internal/SocketCtx';
import { NotificationSender } from '@/components/notifications';


export default function NotificationPage() {
  const { notifications, isConnected  } = useSocket();

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotificationSender className="md:sticky md:top-4" />
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Notifications {isConnected && `(${notifications?.length || 0})`}</h2>
          {Array.isArray(notifications) && notifications.length > 0 ? (
            notifications.map((notification: Notification) => (
            <div 
              key={notification.id}
              className={`p-4 rounded-lg ${
                notification.type === 'error' ? 'bg-red-100' :
                notification.type === 'warning' ? 'bg-yellow-100' :
                notification.type === 'success' ? 'bg-green-100' :
                'bg-blue-100'
              }`}
            >
              <div className="font-medium">{notification.message}</div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </div>
              {notification.data && (
                <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
                  {JSON.stringify(notification.data, null, 2)}
                </pre>
              )}
            </div>
          ))
          ) : (
            <p className="text-gray-500">No notifications yet</p>
          )}
        </div>
      </div>
    </div>
  );
}*/}