import mongoose, { Schema, Document } from 'mongoose';

export interface IDietPlan extends Document {
  dietPlanId: string;
  planName: string;
  subtitle: string;
  calories: number;
  duration: string;
  meals: {
    time: string;
    description: string;
  }[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const DietPlanSchema = new Schema({
  dietPlanId: {
    type: String,
    required: true,
    unique: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  meals: [
    {
      time: { type: String, required: true },
      description: { type: String, required: true }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);
