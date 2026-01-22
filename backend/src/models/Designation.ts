import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
  designationId: string;
  designationName: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema({
  designationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  designationName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

export default mongoose.model<IDesignation>('Designation', DesignationSchema);
