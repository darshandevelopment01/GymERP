import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  memberId: string;
  name: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  branch: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  membershipStartDate: Date;
  membershipEndDate: Date;
  paymentReceived: number;
  paymentRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  enquiryId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    memberId: {
      type: String,
      unique: true,
      required: false
    },
    name: {
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
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    address: {
      type: String,
      required: false,
      default: ''
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    membershipStartDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    membershipEndDate: {
      type: Date,
      required: false
    },
    paymentReceived: {
      type: Number,
      required: true,
      default: 0
    },
    paymentRemaining: {
      type: Number,
      required: false,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IMember>('Member', MemberSchema);
