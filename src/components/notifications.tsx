'use client';

import { useState } from 'react';
import { useSocket } from '@/app/providers/internal/SocketCtx';

interface NotificationSenderProps {
  className?: string;
}

export function NotificationSender({ className = '' }: NotificationSenderProps) {
  const { isConnected, connectionError, sendNotification, socketId } = useSocket();
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setStatus('Sending...');
      setError('');
      
      await sendNotification(type, message, {
        source: 'notification-sender',
        userAgent: navigator.userAgent
      });
      
      setStatus('Sent successfully!');
      setMessage('');
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      setStatus('');
    }
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span>{isConnected  ? `Connected (ID: ${socketId})`  : 'Disconnected'}</span>
        </div>
        {connectionError && (
          <div className="text-red-500 mt-2">
            Error: {connectionError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <button 
          type="submit"
          disabled={!isConnected || !message.trim()}
          className={`w-full p-2 rounded text-white
            ${isConnected || message.trim() 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Send Notification
        </button>
      </form>

      {status && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {status}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}