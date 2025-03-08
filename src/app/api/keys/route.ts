import { NextResponse } from 'next/server';
import { auth } from '@/app/providers/server/auth'

const AUTH_SERVER_URL = 'http://localhost:3001'

export async function POST(request: Request) {
  try {

    const session = await auth()
    
    if (!session?.user?.uid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Not authenticated' 
          } 
        }, 
        { status: 401 }
      )
    }

    const { sessionId, clientPublicKey } = await request.json();

    if (!sessionId || !clientPublicKey) {
      return NextResponse.json(
        { error: 'Missing sessionId or clientPublicKey' },
        { status: 400 }
      );
    }

    // Send keys to authentication server
    const response = await fetch(`${AUTH_SERVER_URL}/api/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, clientPublicKey }),
    });

    if (!response.ok) {
      throw new Error('Key exchange failed');
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Keys error:', error);
    return NextResponse.json(
      { error: 'Key exchange failed' },
      { status: 500 }
    );
  }
}