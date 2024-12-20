import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminTernSecureAuth } from '@/app/providers/utils/admin-init'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()
    
    // Verify the ID token
    const decodedToken = await adminTernSecureAuth.verifyIdToken(idToken)
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminTernSecureAuth.createSessionCookie(idToken, { expiresIn })
    
    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set('_session_cookie', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in localhost handler:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 401 }
    )
  }
}

