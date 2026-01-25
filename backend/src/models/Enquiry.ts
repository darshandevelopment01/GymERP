import mongoose, { Schema, Document } from 'mongoose';

export interface IEnquiry extends Document {
  enquiryId: string;
  branch: mongoose.Types.ObjectId;
  name: string;
  mobileNumber: string;
  email: string;
  dateOfBirth?: Date;
  gender: 'Male' | 'Female' | 'Other';
  plan?: mongoose.Types.ObjectId;
  source: 'Walk-in' | 'Social Media' | 'Referral' | 'Website' | 'Phone Call';
  status: 'pending' | 'confirmed' | 'rejected' | 'converted';
  profilePhoto?: string;
  notes?: string;
  followUpDate?: Date;
  convertedToMember: boolean;
  convertedMemberId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>({
  enquiryId: {
    type: String,
    unique: true,
    required: false
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: false
  },
  source: {
    type: String,
    enum: ['Walk-in', 'Social Media', 'Referral', 'Website', 'Phone Call'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'converted'],
    default: 'pending'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  convertedToMember: {
    type: Boolean,
    default: false
  },
  convertedMemberId: {
    type: Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  }
}, {
  timestamps: true
});

// ✅ REMOVED PRE-SAVE HOOK - We'll generate ID in controller instead

export default mongoose.model<IEnquiry>('Enquiry', enquirySchema);
