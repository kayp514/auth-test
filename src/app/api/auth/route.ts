import { NextResponse } from 'next/server';
import { auth } from '@/app/providers/server/auth'
import { generateKeyPair } from '@/app/providers/utils/encryption';

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
    
    const { clientId, apiKey } = await request.json();

    if (!clientId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing clientId or apiKey' },
        { status: 400 }
      );
    }

    // Call your authentication server
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, apiKey }),
    });

    if (!response.ok) {
      throw new Error('Authentication server error');
    }

    const { sessionId, serverPublicKey } = await response.json();

    return NextResponse.json({ sessionId, serverPublicKey });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}