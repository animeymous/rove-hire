import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OfferDocument from '@/lib/models/OfferDocument';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const type = searchParams.get('type');

    console.log('📥 Download request:', { candidateId, type });

    if (!candidateId || !type) {
      return NextResponse.json(
        { error: 'Candidate ID and type are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const offerDoc = await OfferDocument.findOne({ candidateId });
    if (!offerDoc) {
      console.log('❌ No offer document found for candidate:', candidateId);
      return NextResponse.json(
        { error: 'Offer documents not found for this candidate' },
        { status: 404 }
      );
    }

    // Get the URL based on type
    let fileUrl: string | null = null;
    if (type === 'offer') {
      fileUrl = offerDoc.offerLetterUrl;
    } else if (type === 'nda') {
      fileUrl = offerDoc.ndaUrl;
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL not found' },
        { status: 404 }
      );
    }

    console.log('🔗 Redirecting to:', fileUrl);

    // 🔥 ALWAYS REDIRECT - works in both development and production
    return NextResponse.redirect(fileUrl);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}