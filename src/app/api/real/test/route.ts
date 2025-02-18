import { NextResponse } from 'next/server';

const API_URL = process.env.WEBSOCKET_API_URL || 'http://34.95.17.173';

export async function GET() {
    try {
      console.log('Testing connection to:', API_URL);
      
      const response = await fetch(`${API_URL}/ws-api/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Connection test failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  export async function POST(request: Request) {
    try {
      const body = await request.json();
      
      const response = await fetch(`${API_URL}/ws-api/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error emitting event:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }