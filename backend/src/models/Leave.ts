// backend/src/models/Leave.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  personId: mongoose.Types.ObjectId;
  personType: 'member' | 'employee';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedBy: mongoose.Types.ObjectId; // Ref to Employee who applied
  handledBy?: mongoose.Types.ObjectId; // Ref to Employee who approved/rejected
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'personTypeModel',
    },
    personType: {
      type: String,
      required: true,
      enum: ['member', 'employee'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for refPath
LeaveSchema.virtual('personTypeModel').get(function () {
  return this.personType === 'member' ? 'Member' : 'Employee';
});

export default mongoose.model<ILeave>('Leave', LeaveSchema);
