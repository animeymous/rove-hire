import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const candidate = await Candidate.findById(params.id);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        magicLinkToken: candidate.magicLinkToken,
        magicLinkExpiresAt: candidate.magicLinkExpiresAt,
        isMagicLinkUsed: candidate.isMagicLinkUsed,
        status: candidate.status,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}