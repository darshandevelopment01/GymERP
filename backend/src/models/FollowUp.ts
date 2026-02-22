// backend/src/models/FollowUp.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowUp extends Document {
  member?: mongoose.Types.ObjectId;
  enquiry?: mongoose.Types.ObjectId;
  note: string;
  followUpDate?: Date;
  followUpTime?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: false
    },
    enquiry: {
      type: Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: false
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    followUpDate: {
      type: Date,
      required: false
    },
    followUpTime: {
      type: String,
      required: false
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'expired'],
      default: 'pending'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  {
    timestamps: true
  }
);

// ✅ REMOVED the pre-save validation - it was causing issues

export default mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
