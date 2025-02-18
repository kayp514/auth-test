'use client';

import { useState } from 'react';

export default function TestConnection() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      setError('');
      
      // Test server status
      const response = await fetch('/api/real/test');
      const data = await response.json();
      setStatus(JSON.stringify(data, null, 2));

      // Test event emission
      const emitResponse = await fetch('/api/real/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'test_event',
          data: { message: 'Test message' }
        }),
      });
      
      const emitData = await emitResponse.json();
      setStatus(prev => `${prev}\n\nEmit Result: ${JSON.stringify(emitData, null, 2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('');
    }
  };

  return (
    <div>
      <button onClick={testConnection}>Test Server Connection</button>
      {status && <pre>Status: {status}</pre>}
      {error && <pre style={{color: 'red'}}>Error: {error}</pre>}
    </div>
  );
}