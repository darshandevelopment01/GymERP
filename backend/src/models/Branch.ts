import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  radiusInMeters: number; // For geofencing
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    branchId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    radiusInMeters: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

BranchSchema.index({ location: '2dsphere' });

export default mongoose.model<IBranch>('Branch', BranchSchema);
