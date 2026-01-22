import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  halfDayHours: number;
  fullDayHours: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema({
  shiftId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  shiftName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  halfDayHours: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  fullDayHours: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

export default mongoose.model<IShift>('Shift', ShiftSchema);
