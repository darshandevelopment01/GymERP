import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutPlan extends Document {
  workoutPlanId: string;
  planName: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  daysPerWeek: number;
  duration: string;
  exercises: {
    exercise: string;
    sets: number;
    reps: string;
  }[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutPlanSchema = new Schema({
  workoutPlanId: {
    type: String,
    required: true,
    unique: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  daysPerWeek: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  exercises: [
    {
      exercise: { type: String, required: true },
      sets: { type: Number, required: true },
      reps: { type: String, required: true }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);
