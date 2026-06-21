import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  skills: string[];
  status: 'Open' | 'On Hold' | 'Closed';
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
    enum: ['Open', 'On Hold', 'Closed'],
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

JobSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

JobSchema.virtual('candidateCount', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'jobId',
  count: true,
});

JobSchema.set('toJSON', { virtuals: true });
JobSchema.set('toObject', { virtuals: true });

export default (mongoose.models.Job as Model<IJob>) || mongoose.model<IJob>('Job', JobSchema);