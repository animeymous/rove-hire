import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import OfferDocument from '@/lib/models/OfferDocument';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single candidate
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const candidate = await Candidate.findById(id).populate('jobId', 'title');
    const timeline = await TimelineEvent.find({ candidateId: id }).sort({ createdAt: -1 });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Get offer documents if they exist
    const offerDoc = await OfferDocument.findOne({ candidateId: id });

    return NextResponse.json({
      candidate,
      timeline,
      offerDoc,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

// PATCH - Update candidate status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const { status, reason } = await request.json();

    console.log('📝 Updating candidate:', id, 'to status:', status);

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if trying to hire without offer
    if (status === 'Hired' && candidate.status !== 'Offer Sent') {
      return NextResponse.json(
        { error: 'Cannot hire candidate without sending an offer first' },
        { status: 400 }
      );
    }

    // Check if already hired or rejected
    if (candidate.status === 'Hired') {
      return NextResponse.json(
        { error: 'Candidate is already hired' },
        { status: 400 }
      );
    }

    if (candidate.status === 'Rejected') {
      return NextResponse.json(
        { error: 'Candidate is already rejected' },
        { status: 400 }
      );
    }

    // Update candidate status
    candidate.status = status;
    candidate.updatedAt = new Date();
    await candidate.save();

    // Create timeline event
    let description = '';
    let eventType = '';

    switch (status) {
      case 'Hired':
        description = `🎉 Candidate hired successfully!`;
        eventType = 'HIRED';
        break;
      case 'Rejected':
        description = `❌ Candidate rejected${reason ? `: ${reason}` : ''}`;
        eventType = 'REJECTED';
        break;
      default:
        description = `Status updated to ${status}`;
        eventType = 'APPLIED';
    }

    await TimelineEvent.create({
      candidateId: candidate._id,
      type: eventType,
      description,
      metadata: { reason },
    });

    return NextResponse.json({
      message: `Candidate ${status.toLowerCase()} successfully`,
      candidate,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}