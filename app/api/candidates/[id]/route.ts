import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single candidate
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 GET request received for ID:', params.id);
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    console.log('🔍 Looking for candidate with ID:', id);

    await connectToDatabase();
    console.log('✅ Database connected');

    // Try to find the candidate
    const candidate = await Candidate.findById(id).populate('jobId', 'title');
    console.log('📝 Found candidate:', candidate ? candidate.name : 'None');

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      candidate,
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}