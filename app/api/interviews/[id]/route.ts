import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single interview
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
    const interview = await Interview.findById(params.id).populate('candidateId', 'name email');

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ interview }, { status: 200 });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}

// PATCH - Update interview (complete with feedback)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, feedback, recommendation } = await request.json();

    await connectToDatabase();

    const interview = await Interview.findById(params.id);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Update interview
    if (status) interview.status = status;
    if (feedback) interview.feedback = feedback;
    if (recommendation) interview.recommendation = recommendation;
    interview.updatedAt = new Date();
    await interview.save();

    // If interview is completed, create timeline event
    if (status === 'Completed') {
      const candidate = await Candidate.findById(interview.candidateId);
      if (candidate) {
        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `Interview completed for ${candidate.name}`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Interview updated successfully',
      interview,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}

// DELETE - Delete interview
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const interview = await Interview.findByIdAndDelete(params.id);

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Interview deleted successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting interview:', error);
    return NextResponse.json(
      { error: 'Failed to delete interview' },
      { status: 500 }
    );
  }
}