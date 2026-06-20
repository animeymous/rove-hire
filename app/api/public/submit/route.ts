import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import TimelineEvent from '@/lib/models/TimelineEvent';

export async function POST(request: Request) {
  try {
    const { token, phone, location, currentRole, noticePeriod, salaryExpectation, linkedinUrl } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find candidate with this token
    const candidate = await Candidate.findOne({
      magicLinkToken: token,
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      );
    }

    // Check if link is expired
    if (candidate.magicLinkExpiresAt && candidate.magicLinkExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Check if link has been used
    if (candidate.isMagicLinkUsed) {
      return NextResponse.json(
        { error: 'This link has already been used.' },
        { status: 410 }
      );
    }

    // Update candidate with form data
    candidate.phone = phone;
    candidate.location = location;
    candidate.currentRole = currentRole;
    candidate.noticePeriod = noticePeriod;
    candidate.salaryExpectation = salaryExpectation;
    candidate.linkedinUrl = linkedinUrl;
    candidate.status = 'Form Submitted';
    candidate.isMagicLinkUsed = true;
    candidate.magicLinkToken = undefined; // Remove token for security
    candidate.updatedAt = new Date();

    await candidate.save();

    // Create timeline event
    await TimelineEvent.create({
      candidateId: candidate._id,
      type: 'FORM_SUBMITTED',
      description: 'Candidate completed the application form',
      metadata: {
        phone,
        location,
        currentRole,
        noticePeriod,
        salaryExpectation,
        linkedinUrl,
      },
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}