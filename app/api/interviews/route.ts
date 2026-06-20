import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get all interviews
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const interviews = await Interview.find({})
      .populate('candidateId', 'name email')
      .sort({ date: 1 });

    return NextResponse.json({ interviews }, { status: 200 });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new interview
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, date, time, type, interviewerName, notes } = await request.json();

    // Validate
    if (!candidateId || !date || !time || !type || !interviewerName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Create interview
    const interview = await Interview.create({
      candidateId,
      date: new Date(date),
      time,
      type,
      interviewerName,
      notes,
      status: 'Scheduled',
    });

    // Update candidate status
    candidate.status = 'Interview Scheduled';
    candidate.updatedAt = new Date();
    await candidate.save();

    // Create timeline event
    await TimelineEvent.create({
      candidateId: candidate._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `Interview scheduled for ${candidate.name} (${type}) with ${interviewerName}`,
      metadata: {
        interviewId: interview._id,
        date,
        time,
        type,
        interviewerName,
      },
    });

    return NextResponse.json(
      { 
        message: 'Interview scheduled successfully',
        interview,
        candidate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}