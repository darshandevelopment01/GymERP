import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentType extends Document {
  paymentTypeId: string;
  paymentType: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTypeSchema = new Schema({
  paymentTypeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  paymentType: { 
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

export default mongoose.model<IPaymentType>('PaymentType', PaymentTypeSchema);
