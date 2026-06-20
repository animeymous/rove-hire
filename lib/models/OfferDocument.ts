import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOfferDocument extends Document {
  candidateId: mongoose.Types.ObjectId;
  roleTitle: string;
  salary: {
    amount: number;
    currency: string;
  };
  startDate: Date;
  reportingManager: string;
  location: string;
  offerLetterUrl: string;
  ndaUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const OfferDocumentSchema = new Schema<IOfferDocument>({
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Please provide candidate'],
    unique: true,
  },
  roleTitle: {
    type: String,
    required: [true, 'Please provide role title'],
    trim: true,
  },
  salary: {
    amount: {
      type: Number,
      required: [true, 'Please provide salary amount'],
    },
    currency: {
      type: String,
      required: [true, 'Please provide currency'],
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    },
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date'],
  },
  reportingManager: {
    type: String,
    required: [true, 'Please provide reporting manager name'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please provide location'],
    trim: true,
  },
  offerLetterUrl: {
    type: String,
    required: [true, 'Please provide offer letter URL'],
  },
  ndaUrl: {
    type: String,
    required: [true, 'Please provide NDA URL'],
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

OfferDocumentSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

OfferDocumentSchema.index({ candidateId: 1 });

export default (mongoose.models.OfferDocument as Model<IOfferDocument>) || 
  mongoose.model<IOfferDocument>('OfferDocument', OfferDocumentSchema);