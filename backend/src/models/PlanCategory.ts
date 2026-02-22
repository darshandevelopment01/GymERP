import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanCategory extends Document {
    planCategoryId: string;
    categoryName: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const PlanCategorySchema = new Schema({
    planCategoryId: {
        type: String,
        required: true,
        unique: true
    },
    categoryName: {
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

export default mongoose.model<IPlanCategory>('PlanCategory', PlanCategorySchema);
