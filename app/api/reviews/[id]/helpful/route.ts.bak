import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'

// POST /api/reviews/[id]/helpful - Mark review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { helpful } = body // true for helpful, false for not helpful

    const review = await Review.findById(params.id)

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.status !== 'approved') {
      return NextResponse.json({ error: 'Review not approved' }, { status: 400 })
    }

    // Update vote counts
    review.totalVotes += 1
    if (helpful) {
      review.helpfulVotes += 1
    }

    await review.save()

    return NextResponse.json({
      message: 'Vote recorded successfully',
      helpfulVotes: review.helpfulVotes,
      totalVotes: review.totalVotes
    })
  } catch (error: any) {
    console.error('Error recording vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}