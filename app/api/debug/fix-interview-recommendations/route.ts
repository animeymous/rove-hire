import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();

    // Use native MongoDB driver to bypass Mongoose validation
    const db = mongoose.connection.db;
    const collection = db.collection('interviews');

    // Update all interviews with old recommendations
    const result1 = await collection.updateMany(
      { recommendation: 'Hire' },
      { $set: { recommendation: 'Ready to Offer' } }
    );

    const result2 = await collection.updateMany(
      { recommendation: 'No Hire' },
      { $set: { recommendation: 'Reject' } }
    );

    // Update interviews with null recommendation
    const result3 = await collection.updateMany(
      { 
        $or: [
          { recommendation: { $exists: false } },
          { recommendation: null }
        ]
      },
      [
        {
          $set: {
            recommendation: {
              $cond: {
                if: { $eq: ["$round", "Screening"] },
                then: "Pass",
                else: "Ready to Offer"
              }
            }
          }
        }
      ]
    );

    // Also ensure all interviews have a round field
    const result4 = await collection.updateMany(
      { round: { $exists: false } },
      [
        {
          $set: {
            round: {
              $ifNull: ["$type", "Screening"]
            }
          }
        }
      ]
    );

    return NextResponse.json({
      message: 'Fixed interview recommendations successfully',
      updatedHire: result1.modifiedCount,
      updatedNoHire: result2.modifiedCount,
      updatedNull: result3.modifiedCount,
      updatedRound: result4.modifiedCount,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fixing interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fix interviews: ' + (error as Error).message },
      { status: 500 }
    );
  }
}