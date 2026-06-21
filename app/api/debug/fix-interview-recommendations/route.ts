import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Interview from '@/lib/models/Interview';

type Recommendation = 'Pass' | 'Fail' | 'Hire' | 'Maybe' | 'Reject';

export async function GET() {
  try {
    await connectToDatabase();

    // Find all interviews
    const interviews = await Interview.find({});
    
    let updated = 0;
    let skipped = 0;
    
    const validRecommendations: Recommendation[] = ['Pass', 'Fail', 'Hire', 'Maybe', 'Reject'];
    
    // Map for old values to new values
    const recommendationMap: Record<string, Recommendation> = {
      'Hire': 'Hire',
      'No Hire': 'Reject',
      'No hire': 'Reject',
      'no hire': 'Reject',
      'Maybe': 'Maybe',
      'maybe': 'Maybe',
      'Pass': 'Pass',
      'pass': 'Pass',
      'Fail': 'Fail',
      'fail': 'Fail',
      'Reject': 'Reject',
      'reject': 'Reject',
    };

    for (const interview of interviews) {
      let newRecommendation: Recommendation | undefined;
      
      if (interview.recommendation) {
        // Check if it's already a valid value
        if (validRecommendations.includes(interview.recommendation as Recommendation)) {
          newRecommendation = interview.recommendation as Recommendation;
        } else {
          // Try to map from old value
          const mapped = recommendationMap[interview.recommendation];
          if (mapped) {
            newRecommendation = mapped;
          }
        }
      }
      
      // If no recommendation or invalid, set default based on round
      if (!newRecommendation) {
        if (interview.round === 'Screening') {
          newRecommendation = 'Pass';
        } else {
          newRecommendation = 'Hire';
        }
      }
      
      // Ensure the value is valid
      if (newRecommendation && validRecommendations.includes(newRecommendation)) {
        if (interview.recommendation !== newRecommendation) {
          interview.recommendation = newRecommendation;
          await interview.save();
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return NextResponse.json({
      message: `Fixed interview recommendations`,
      updated,
      skipped,
      total: interviews.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fix interviews: ' + (error as Error).message },
      { status: 500 }
    );
  }
}