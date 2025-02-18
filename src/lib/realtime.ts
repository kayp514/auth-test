type NotificationData = {
    clientId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    target?: string;
    data?: Record<string, any>;
  };
  
  export const NotificationService = {
    send: async (notification: NotificationData) => {
      try {
        const response = await fetch('/api/real', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
      }
    }
  };