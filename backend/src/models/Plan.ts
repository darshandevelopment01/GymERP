import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  planId: string;
  planName: string;
  category: mongoose.Types.ObjectId;
  duration: 'Monthly' | 'Quarterly' | 'Yearly';
  price: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema({
  planId: {
    type: String,
    required: true,
    unique: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'PlanCategory',
    required: true
  },
  duration: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  price: {
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

export default mongoose.model<IPlan>('Plan', PlanSchema);
