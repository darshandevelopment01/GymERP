// backend/src/models/Attendance.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  personId: mongoose.Types.ObjectId;
  personType: 'member' | 'employee';
  date: Date; // Stores only the date (midnight UTC)
  status: 'present' | 'absent' | 'leave';
  checkInTime?: Date;
  method: 'manual' | 'qr';
  markedBy?: mongoose.Types.ObjectId; // Ref to Employee (admin/staff)
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    method: {
      type: String,
      enum: ['manual', 'qr'],
      default: 'manual',
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to ensure only one record per person per day
AttendanceSchema.index({ personId: 1, personType: 1, date: 1 }, { unique: true });

// Virtual for refPath
AttendanceSchema.virtual('personTypeModel').get(function () {
  return this.personType === 'member' ? 'Member' : 'Employee';
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
