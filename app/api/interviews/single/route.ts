import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single interview
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
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const interview = await Interview.findById(id).populate('candidateId', 'name email');

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

// PATCH - Complete interview with feedback
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const { status, feedback, recommendation } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const interview = await Interview.findById(id);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const candidate = await Candidate.findById(interview.candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Determine round
    let round = interview.round;
    if (!round) {
      round = interview.type || 'Screening';
      interview.round = round;
      await interview.save();
    }

    // Validate recommendation is valid for the round
    const validRecommendations: Record<string, string[]> = {
      'Screening': ['Pass', 'Fail'],
      'Technical': ['Hire', 'Maybe', 'Reject'],
      'Final': ['Hire', 'Maybe', 'Reject'],
    };

    // Normalize recommendation (capitalize first letter)
    const normalizedRecommendation = recommendation.charAt(0).toUpperCase() + recommendation.slice(1).toLowerCase();
    
    // Check if valid for this round
    if (!validRecommendations[round]?.includes(normalizedRecommendation)) {
      return NextResponse.json(
        { 
          error: `Invalid recommendation "${normalizedRecommendation}" for ${round} round. Allowed: ${validRecommendations[round]?.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update interview
    interview.status = 'Completed';
    interview.feedback = feedback;
    interview.recommendation = normalizedRecommendation;
    interview.isCompleted = true;
    interview.updatedAt = new Date();
    await interview.save();

    // Handle based on interview round
    // 🔥 SCREENING ROUND: Pass or Fail
    if (round === 'Screening') {
      if (normalizedRecommendation === 'Pass') {
        // ✅ Screening passed - move to Technical
        candidate.status = 'Interview Scheduled';
        candidate.interviewRound = 'Technical';
        candidate.screeningPassed = true;
        candidate.interviewCount = (candidate.interviewCount || 0) + 1;
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `✅ Screening interview PASSED for ${candidate.name}. Ready for Technical round.`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Screening',
            nextRound: 'Technical',
          },
        });

        return NextResponse.json({
          message: 'Screening interview completed. Candidate passed!',
          candidate,
          interview,
          nextAction: 'Schedule Technical Interview',
          nextRound: 'Technical',
        }, { status: 200 });

      } else if (normalizedRecommendation === 'Fail') {
        // ❌ Screening failed - reject
        candidate.status = 'Rejected';
        candidate.interviewRound = 'Completed';
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'REJECTED',
          description: `❌ Candidate rejected after Screening interview`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Screening',
          },
        });

        return NextResponse.json({
          message: 'Screening interview completed. Candidate rejected.',
          candidate,
          interview,
          nextAction: 'None - Candidate Rejected',
        }, { status: 200 });
      }
    }

    // 🔥 TECHNICAL ROUND: Hire, Maybe, or Reject
    if (round === 'Technical') {
      if (normalizedRecommendation === 'Hire') {
        // ✅ Technical passed - ready for offer
        candidate.status = 'Offer Sent';
        candidate.interviewRound = 'Completed';
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `✅ Technical interview PASSED for ${candidate.name}. Ready for offer.`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Technical',
          },
        });

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'NOTE_ADDED',
          description: `🎯 Candidate cleared all interviews. Ready for offer letter.`,
          metadata: { recommendation: normalizedRecommendation },
        });

        return NextResponse.json({
          message: 'Technical interview completed. Candidate ready for offer!',
          candidate,
          interview,
          nextAction: 'Mark as Hired',
          nextRound: 'Offer Sent',
        }, { status: 200 });

      } else if (normalizedRecommendation === 'Maybe') {
        // 🤔 Technical maybe - move to Final
        candidate.status = 'Interview Scheduled';
        candidate.interviewRound = 'Final';
        candidate.interviewCount = (candidate.interviewCount || 0) + 1;
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `🤔 Technical interview completed. Moving to Final round for ${candidate.name}`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Technical',
            nextRound: 'Final',
          },
        });

        return NextResponse.json({
          message: 'Technical interview completed. Candidate moved to Final round.',
          candidate,
          interview,
          nextAction: 'Schedule Final Interview',
          nextRound: 'Final',
        }, { status: 200 });

      } else if (normalizedRecommendation === 'Reject') {
        // ❌ Technical failed - reject
        candidate.status = 'Rejected';
        candidate.interviewRound = 'Completed';
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'REJECTED',
          description: `❌ Candidate rejected after Technical interview`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Technical',
          },
        });

        return NextResponse.json({
          message: 'Technical interview completed. Candidate rejected.',
          candidate,
          interview,
          nextAction: 'None - Candidate Rejected',
        }, { status: 200 });
      }
    }

    // 🔥 FINAL ROUND: Hire, Maybe, or Reject
    if (round === 'Final') {
      if (normalizedRecommendation === 'Hire') {
        // ✅ Final passed - ready for offer
        candidate.status = 'Offer Sent';
        candidate.interviewRound = 'Completed';
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `🎉 Final interview PASSED for ${candidate.name}!`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Final',
          },
        });

        return NextResponse.json({
          message: 'Final interview completed. Candidate ready for offer!',
          candidate,
          interview,
          nextAction: 'Mark as Hired',
          nextRound: 'Offer Sent',
        }, { status: 200 });

      } else if (normalizedRecommendation === 'Maybe') {
        // 🤔 Final maybe - on hold
        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'INTERVIEW_COMPLETED',
          description: `🤔 Final interview completed. Candidate on hold.`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Final',
          },
        });

        return NextResponse.json({
          message: 'Final interview completed. Candidate on hold.',
          candidate,
          interview,
          nextAction: 'Wait for HR decision',
        }, { status: 200 });

      } else if (normalizedRecommendation === 'Reject') {
        // ❌ Final failed - reject
        candidate.status = 'Rejected';
        candidate.interviewRound = 'Completed';
        await candidate.save();

        await TimelineEvent.create({
          candidateId: candidate._id,
          type: 'REJECTED',
          description: `❌ Candidate rejected after Final interview`,
          metadata: {
            interviewId: interview._id,
            feedback,
            recommendation: normalizedRecommendation,
            round: 'Final',
          },
        });

        return NextResponse.json({
          message: 'Final interview completed. Candidate rejected.',
          candidate,
          interview,
          nextAction: 'None - Candidate Rejected',
        }, { status: 200 });
      }
    }

    return NextResponse.json({
      message: 'Interview updated successfully',
      interview,
      candidate,
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview: ' + (error as Error).message },
      { status: 500 }
    );
  }
}