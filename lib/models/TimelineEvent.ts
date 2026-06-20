import mongoose, { Schema, Document, Model } from 'mongoose';

export type TimelineEventType = 
  | 'APPLIED'
  | 'FORM_SUBMITTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'OFFER_SENT'
  | 'HIRED'
  | 'REJECTED'
  | 'NOTE_ADDED';

export interface ITimelineEvent extends Document {
  candidateId: mongoose.Types.ObjectId;
  type: TimelineEventType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>({
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Please provide candidate'],
    index: true,
  },
  type: {
    type: String,
    enum: [
      'APPLIED',
      'FORM_SUBMITTED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'OFFER_SENT',
      'HIRED',
      'REJECTED',
      'NOTE_ADDED',
    ],
    required: [true, 'Please provide event type'],
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    trim: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
TimelineEventSchema.index({ candidateId: 1, createdAt: -1 });

export default (mongoose.models.TimelineEvent as Model<ITimelineEvent>) || 
  mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);