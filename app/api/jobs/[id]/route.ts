import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Job from '@/lib/models/Job';
import Candidate from '@/lib/models/Candidate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get single job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get candidate count
    const candidateCount = await Candidate.countDocuments({ jobId: id });

    return NextResponse.json({
      job,
      candidateCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Update job status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    job.status = status;
    job.updatedAt = new Date();
    await job.save();

    return NextResponse.json({
      message: `Job status updated to ${status}`,
      job,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete job and associated candidates
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if there are candidates associated
    const candidateCount = await Candidate.countDocuments({ jobId: id });
    if (candidateCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete job with ${candidateCount} associated candidates. Please reassign or delete candidates first.`,
          candidateCount,
        },
        { status: 400 }
      );
    }

    await job.deleteOne();

    return NextResponse.json({
      message: 'Job deleted successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job: ' + (error as Error).message },
      { status: 500 }
    );
  }
}