import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    performedByName: string;
    targetType: 'Enquiry' | 'FollowUp' | 'Member';
    targetId: mongoose.Types.ObjectId;
    targetName: string;
    details: string;
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
    action: {
        type: String,
        required: true,
        enum: ['enquiry_created', 'enquiry_updated', 'followup_created', 'followup_updated', 'member_converted', 'member_updated']
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByName: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Enquiry', 'FollowUp', 'Member']
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    targetName: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ action: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
