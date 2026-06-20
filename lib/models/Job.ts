import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  skills: string[];
  status: 'Open' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
  candidateCount?: number;
}

const JobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Please provide a job title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a job description'],
  },
  skills: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
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

// Update timestamp on save
JobSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

// Virtual field for candidate count
JobSchema.virtual('candidateCount', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'jobId',
  count: true,
});

// Include virtuals in JSON output
JobSchema.set('toJSON', { virtuals: true });
JobSchema.set('toObject', { virtuals: true });

export default (mongoose.models.Job as Model<IJob>) || mongoose.model<IJob>('Job', JobSchema);