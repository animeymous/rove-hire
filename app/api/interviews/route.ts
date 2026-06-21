import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to determine allowed interview rounds
function getAllowedRounds(candidate: any): string[] {
  // If no interviews completed yet
  if (!candidate.interviewCount || candidate.interviewCount === 0) {
    return ['Screening'];
  }
  
  // If screening was passed
  if (candidate.screeningPassed) {
    // Check current round to determine next allowed
    if (candidate.interviewRound === 'Screening' || candidate.interviewRound === 'Technical') {
      return ['Technical'];
    }
    if (candidate.interviewRound === 'Final') {
      return ['Final'];
    }
  }
  
  // If screening not passed
  if (!candidate.screeningPassed) {
    return ['Screening'];
  }
  
  return ['Screening'];
}

// GET - Get all interviews with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const filter = searchParams.get('filter') || 'all';
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build filter query
    let query: any = {};
    if (filter === 'upcoming') {
      query.status = 'Scheduled';
    } else if (filter === 'completed') {
      query.status = 'Completed';
    }
    // For 'all', no filter is applied

    console.log('🔍 Interview query:', query);

    const total = await Interview.countDocuments(query);
    console.log('📊 Total interviews:', total);

    const interviews = await Interview.find(query)
      .populate('candidateId', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    console.log('📝 Interviews found:', interviews.length);

    return NextResponse.json({
      interviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews: ' + (error as Error).message },
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

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // VALIDATION: Only allow interview if candidate has submitted form
    if (candidate.status === 'Applied') {
      return NextResponse.json(
        { error: 'Candidate must complete the application form before scheduling an interview' },
        { status: 400 }
      );
    }

    // VALIDATION: Don't schedule if already hired or rejected
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

    // Determine allowed rounds based on candidate's progress
    const allowedRounds = getAllowedRounds(candidate);
    if (!allowedRounds.includes(type)) {
      return NextResponse.json(
        { 
          error: `Cannot schedule ${type} interview. Allowed rounds: ${allowedRounds.join(', ')}`,
          currentStatus: candidate.status,
          currentRound: candidate.interviewRound,
          screeningPassed: candidate.screeningPassed,
        },
        { status: 400 }
      );
    }

    // Check if there's already a scheduled interview of this type
    const existingInterview = await Interview.findOne({
      candidateId,
      round: type,
      status: 'Scheduled',
    });

    if (existingInterview) {
      return NextResponse.json(
        { error: `${type} interview already scheduled for this candidate` },
        { status: 400 }
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
      round: type,
      status: 'Scheduled',
    });

    // Update candidate status
    candidate.status = 'Interview Scheduled';
    candidate.interviewRound = type;
    candidate.interviewCount = (candidate.interviewCount || 0) + 1;
    candidate.updatedAt = new Date();
    await candidate.save();

    // Create timeline event
    await TimelineEvent.create({
      candidateId: candidate._id,
      type: 'INTERVIEW_SCHEDULED',
      description: `${type} interview scheduled for ${candidate.name} with ${interviewerName}`,
      metadata: {
        interviewId: interview._id,
        date,
        time,
        type,
        interviewerName,
        round: type,
      },
    });

    return NextResponse.json(
      { 
        message: `${type} interview scheduled successfully`,
        interview,
        candidate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview: ' + (error as Error).message },
      { status: 500 }
    );
  }
}