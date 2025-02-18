import { NextResponse } from 'next/server';
import { auth } from '@/app/providers/server/auth'


const API_URL = process.env.WEBSOCKET_API_URL || 'http://34.95.17.173';

export async function GET(request: Request) {
    try {
      const clientId = "e7b1c1f0-4c3e-4c1b-8c3e-1c3e4c1b8c3";
      
      const response = await fetch(`${API_URL}/ws-api/notifications`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch notifications',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }

  export async function POST(request: Request) {
    try {
      const body = await request.json();
      const clientId = "e7b1c1f0-4c3e-4c1b-8c3e-1c3e4c1b8c3";
      
      const response = await fetch(`${API_URL}/ws-api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          clientId,
          action: 'create'
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create notification',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }