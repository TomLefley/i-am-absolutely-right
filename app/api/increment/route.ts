import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get counter type
    const body = await request.json()
    const { type = 'right' } = body
    
    // Validate counter type
    if (!['right', 'issue'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid counter type. Must be "right" or "issue"' },
        { status: 400 }
      )
    }
    
    // Check if Redis is available
    if (!process.env.REDIS_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }
    
    // Check authentication
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.API_SECRET
    
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'API not configured' },
        { status: 500 }
      )
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Connect to Redis
    const redis = createClient({ url: process.env.REDIS_URL })
    await redis.connect()
    
    try {
      // Get current date for daily tracking
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      
      // Set Redis keys based on counter type
      const totalKey = type === 'right' ? 'counter:total' : 'issue-counter:total'
      const dailyKey = type === 'right' ? `daily:${today}` : `issue-daily:${today}`
      
      // Increment counters atomically
      const [newTotal, newDailyCount] = await Promise.all([
        redis.incr(totalKey),
        redis.incr(dailyKey)
      ])

      // Set TTL for daily counters (60 days)
      await redis.expire(dailyKey, 60 * 24 * 60 * 60)
      
      return NextResponse.json({
        success: true,
        type,
        total: newTotal,
        dailyCount: newDailyCount,
        date: today
      })
    } finally {
      await redis.disconnect()
    }
    
  } catch (error) {
    console.error('Error incrementing counter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}