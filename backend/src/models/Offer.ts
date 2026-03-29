import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
    offerId: string;
    title: string;
    description?: string;
    imageUrl: string;
    discountType: 'percentage' | 'value';
    discountAmount: number;
    validFrom: Date;
    validTo: Date;
    planCategories: mongoose.Types.ObjectId[];
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const OfferSchema = new Schema({
    offerId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'value'],
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    planCategories: [{
        type: Schema.Types.ObjectId,
        ref: 'PlanCategory'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model<IOffer>('Offer', OfferSchema);
