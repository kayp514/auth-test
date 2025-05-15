import { NextResponse } from 'next/server';
import { auth } from '@/app/providers/server/auth'

const AUTH_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL


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