import { searchUsers } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Search query must be at least 2 characters'
      }
    })
  }

  try {
    const result = await searchUsers(query)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to search users'
        }
      },
      { status: 500 }
    )
  }
}