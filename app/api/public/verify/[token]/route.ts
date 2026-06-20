import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';

// Using NextRequest to properly handle params
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Get token from params
    const token = params.token;

    console.log('🔍 Verifying token from params:', token);

    // Also try getting from URL as fallback
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const tokenFromUrl = pathParts[pathParts.length - 1];
    console.log('🔍 Token from URL:', tokenFromUrl);

    const finalToken = token || tokenFromUrl;

    if (!finalToken) {
      console.log('❌ No token provided');
      return NextResponse.json(
        { error: 'Invalid link - no token provided' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    console.log('✅ Database connected');

    // Find candidate with this token
    const candidate = await Candidate.findOne({
      magicLinkToken: finalToken,
    }).populate('jobId', 'title');

    console.log('📝 Found candidate:', candidate ? candidate.name : 'None');

    if (!candidate) {
      return NextResponse.json(
        { error: 'Invalid or expired link - candidate not found' },
        { status: 404 }
      );
    }

    // Check if link has been used
    if (candidate.isMagicLinkUsed) {
      return NextResponse.json(
        { error: 'This link has already been used.' },
        { status: 410 }
      );
    }

    // Check if link is expired
    if (candidate.magicLinkExpiresAt && candidate.magicLinkExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Return candidate info
    return NextResponse.json({
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        jobId: candidate.jobId,
        status: candidate.status,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error verifying link:', error);
    return NextResponse.json(
      { error: 'Failed to verify link' },
      { status: 500 }
    );
  }
}