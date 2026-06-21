import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Job from '@/lib/models/Job';
import Candidate from '@/lib/models/Candidate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get all jobs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create a new job
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, skills, status } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const job = await Job.create({
      title,
      description,
      skills: skills || [],
      status: status || 'Open',
    });

    return NextResponse.json(
      { 
        message: 'Job created successfully',
        job 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job: ' + (error as Error).message },
      { status: 500 }
    );
  }
}