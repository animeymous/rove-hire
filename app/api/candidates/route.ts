import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import Job from '@/lib/models/Job';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const [candidates, total] = await Promise.all([
      Candidate.find({})
        .populate('jobId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Candidate.countDocuments({}),
    ]);

    return NextResponse.json({
      candidates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    // ... error handling
  }
}
// POST - Create a new candidate
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, jobId, resumeUrl } = await request.json();

    // Validate
    if (!name || !email || !jobId) {
      return NextResponse.json(
        { error: 'Name, email, and job are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    if (job.status === 'Closed') {
      return NextResponse.json(
        { error: 'Cannot add candidates to closed job' },
        { status: 400 }
      );
    }

    // Check if candidate already exists for this job
    const existingCandidate = await Candidate.findOne({ email, jobId });
    if (existingCandidate) {
      return NextResponse.json(
        { error: 'Candidate already applied for this job' },
        { status: 400 }
      );
    }

    // Generate magic link token
    const magicLinkToken = uuidv4();
    const magicLinkExpiresAt = new Date();
    magicLinkExpiresAt.setDate(magicLinkExpiresAt.getDate() + 14); // 14 days expiry

    // Create candidate
    const candidate = await Candidate.create({
      name,
      email,
      jobId,
      resumeUrl,
      magicLinkToken,
      magicLinkExpiresAt,
      status: 'Applied',
    });

    // Create timeline event
    await TimelineEvent.create({
      candidateId: candidate._id,
      type: 'APPLIED',
      description: `Candidate applied for ${job.title}`,
      metadata: { jobTitle: job.title },
    });

    // Generate magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/apply/${magicLinkToken}`;

    return NextResponse.json(
      { 
        message: 'Candidate created successfully',
        candidate,
        magicLink,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}