import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentRole?: string;
  noticePeriod?: string;
  salaryExpectation?: string;
  linkedinUrl?: string;
  status: 'Applied' | 'Form Submitted' | 'Interview Scheduled' | 'Ready to Offer' | 'Offer Sent' | 'Hired' | 'Rejected';
  resumeUrl?: string;
  jobId: mongoose.Types.ObjectId;
  magicLinkToken?: string;
  magicLinkExpiresAt?: Date;
  isMagicLinkUsed: boolean;
  interviewRound?: 'Screening' | 'Technical' | 'Final' | 'Completed';
  interviewCount?: number;
  screeningPassed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  name: {
    type: String,
    required: [true, 'Please provide candidate name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  currentRole: {
    type: String,
    trim: true,
  },
  noticePeriod: {
    type: String,
    trim: true,
  },
  salaryExpectation: {
    type: String,
    trim: true,
  },
  linkedinUrl: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Applied', 'Form Submitted', 'Interview Scheduled', 'Ready to Offer', 'Offer Sent', 'Hired', 'Rejected'],
    default: 'Applied',
  },
  resumeUrl: {
    type: String,
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Please associate a job'],
  },
  magicLinkToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  magicLinkExpiresAt: {
    type: Date,
  },
  isMagicLinkUsed: {
    type: Boolean,
    default: false,
  },
  interviewRound: {
    type: String,
    enum: ['Screening', 'Technical', 'Final', 'Completed'],
    default: 'Screening',
  },
  interviewCount: {
    type: Number,
    default: 0,
  },
  screeningPassed: {
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

CandidateSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

CandidateSchema.index({ email: 1 });
CandidateSchema.index({ jobId: 1 });
CandidateSchema.index({ status: 1 });
CandidateSchema.index({ magicLinkToken: 1 });

export default (mongoose.models.Candidate as Model<ICandidate>) || 
  mongoose.model<ICandidate>('Candidate', CandidateSchema);