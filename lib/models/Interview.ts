import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInterview extends Document {
  candidateId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  type: 'Screening' | 'Technical' | 'Final';
  interviewerName: string;
  notes?: string;
  round: 'Screening' | 'Technical' | 'Final';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  feedback?: string;
  recommendation?: 'Pass' | 'Fail' | 'Hire' | 'Maybe' | 'Reject';
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>({
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Please provide candidate'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide interview date'],
  },
  time: {
    type: String,
    required: [true, 'Please provide interview time'],
  },
  type: {
    type: String,
    enum: ['Screening', 'Technical', 'Final'],
    required: [true, 'Please provide interview type'],
  },
  interviewerName: {
    type: String,
    required: [true, 'Please provide interviewer name'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  round: {
    type: String,
    enum: ['Screening', 'Technical', 'Final'],
    required: [true, 'Please provide interview round'],
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  feedback: {
    type: String,
    trim: true,
  },
  recommendation: {
    type: String,
    enum: ['Pass', 'Fail', 'Hire', 'Maybe', 'Reject'],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

InterviewSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

InterviewSchema.index({ candidateId: 1 });
InterviewSchema.index({ date: 1 });
InterviewSchema.index({ status: 1 });

export default (mongoose.models.Interview as Model<IInterview>) || 
  mongoose.model<IInterview>('Interview', InterviewSchema);