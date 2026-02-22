import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  memberId: string;
  name: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  branch: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  membershipStartDate: Date;
  membershipEndDate: Date;
  // Pricing breakdown
  taxSlab?: mongoose.Types.ObjectId;
  planAmount: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  paymentReceived: number;
  paymentRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  profilePhoto?: string;
  enquiryId?: mongoose.Types.ObjectId;
  convertedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    memberId: {
      type: String,
      unique: true,
      required: false
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    address: {
      type: String,
      required: false,
      default: ''
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    membershipStartDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    membershipEndDate: {
      type: Date,
      required: false
    },
    // Pricing breakdown
    taxSlab: {
      type: Schema.Types.ObjectId,
      ref: 'TaxSlab',
      required: false
    },
    planAmount: {
      type: Number,
      required: false,
      default: 0
    },
    discountPercentage: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      required: false,
      default: 0
    },
    taxPercentage: {
      type: Number,
      required: false,
      default: 0
    },
    taxAmount: {
      type: Number,
      required: false,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: false,
      default: 0
    },
    paymentReceived: {
      type: Number,
      required: true,
      default: 0
    },
    paymentRemaining: {
      type: Number,
      required: false,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },
    profilePhoto: {
      type: String,
      default: null
    },
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: false
    },
    convertedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

MemberSchema.pre('save', async function () {
  if (!this.memberId) {
    try {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

      const lastMember = await mongoose.model<IMember>('Member')
        .findOne({
          memberId: new RegExp(`^MEM-${dateStr}-\\d{4}$`)
        })
        .sort({ memberId: -1 })
        .select('memberId')
        .lean();

      let sequence = 1;

      if (lastMember?.memberId) {
        const parts = lastMember.memberId.split('-');
        if (parts.length === 3 && parts[2]) {
          const lastSequence = parseInt(parts[2], 10);
          if (!isNaN(lastSequence) && lastSequence > 0) {
            sequence = lastSequence + 1;
          }
        }
      }

      this.memberId = `MEM-${dateStr}-${String(sequence).padStart(4, '0')}`;
      console.log('✅ Generated memberId:', this.memberId);

    } catch (error) {
      console.error('❌ Error generating memberId:', error);
      this.memberId = `MEM-${Date.now()}`;
    }
  }
});

export default mongoose.model<IMember>('Member', MemberSchema);
