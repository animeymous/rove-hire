import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get all candidates to see what's available
    const candidates = await Candidate.find({})
      .select('_id name email status')
      .limit(5);

    return NextResponse.json({
      message: 'Debug: Candidates found',
      count: candidates.length,
      candidates: candidates.map(c => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        status: c.status
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
}