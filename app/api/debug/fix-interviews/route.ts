import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';

export async function GET() {
  try {
    await connectToDatabase();

    // Find all interviews without a round field
    const interviews = await Interview.find({ round: { $exists: false } });
    
    let updated = 0;
    for (const interview of interviews) {
      // Set round based on type
      interview.round = interview.type || 'Screening';
      await interview.save();
      updated++;
    }

    return NextResponse.json({
      message: `Fixed ${updated} interviews`,
      updated,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fix interviews' },
      { status: 500 }
    );
  }
}