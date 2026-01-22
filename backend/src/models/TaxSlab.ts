import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxSlab extends Document {
  taxSlabId: string;
  taxPercentage: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const TaxSlabSchema = new Schema({
  taxSlabId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  taxPercentage: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

export default mongoose.model<ITaxSlab>('TaxSlab', TaxSlabSchema);
