import mongoose, { Schema, Document } from 'mongoose';


export interface IEnquiry extends Document {
  enquiryId: string;
  branch: mongoose.Types.ObjectId;
  name: string;
  mobileNumber: string;
  email: string;
  dateOfBirth?: Date;
  gender: 'Male' | 'Female' | 'Other';
  plan?: mongoose.Types.ObjectId;
  source: 'Walk-in' | 'Social Media' | 'Referral' | 'Website' | 'Phone Call';
  status: 'pending' | 'confirmed' | 'rejected' | 'converted';
  profilePhoto?: string;
  notes?: string;
  followUpDate?: Date;
  convertedToMember: boolean;
  convertedMemberId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const enquirySchema = new Schema<IEnquiry>({
  enquiryId: {
    type: String,
    unique: true,
    required: false
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  dateOfBirth: {
    type: Date,
    required: false,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: false,
    default: null
  },
  source: {
    type: String,
    enum: ['Walk-in', 'Social Media', 'Referral', 'Website', 'Phone Call'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'converted'],
    default: 'pending',
    required: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  convertedToMember: {
    type: Boolean,
    default: false
  },
  convertedMemberId: {
    type: Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  }
}, {
  timestamps: true
});


// ✅ Pre-save middleware to auto-generate enquiryId (FIXED - removed next callback)
enquirySchema.pre('save', async function() {
  // Only generate ID if it doesn't exist (for new documents)
  if (!this.enquiryId) {
    try {
      // Generate enquiry ID: ENQ-YYYYMMDD-XXXX
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the last enquiry created today with proper format validation
      const lastEnquiry = await mongoose.model<IEnquiry>('Enquiry')
        .findOne({ 
          enquiryId: new RegExp(`^ENQ-${dateStr}-\\d{4}$`) 
        })
        .sort({ enquiryId: -1 })
        .select('enquiryId')
        .lean();
      
      let sequence = 1;
      
      // ✅ Proper null checks and validation
      if (lastEnquiry?.enquiryId) {
        const parts = lastEnquiry.enquiryId.split('-');
        
        // Validate parts array has correct structure [ENQ, YYYYMMDD, XXXX]
        if (parts.length === 3 && parts[2]) {
          const lastSequence = parseInt(parts[2], 10);
          
          // Validate parsed number is valid
          if (!isNaN(lastSequence) && lastSequence > 0) {
            sequence = lastSequence + 1;
          }
        }
      }
      
      // Generate the new enquiry ID
      this.enquiryId = `ENQ-${dateStr}-${String(sequence).padStart(4, '0')}`;
      
      console.log('✅ Generated enquiryId:', this.enquiryId);
      
    } catch (error) {
      console.error('❌ Error generating enquiryId:', error);
      // Fallback to timestamp-based ID
      this.enquiryId = `ENQ-${Date.now()}`;
    }
  }
});

enquirySchema.index({ branch: 1, status: 1 });
enquirySchema.index({ mobileNumber: 1 });
enquirySchema.index({ email: 1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ enquiryId: 1 });


export default mongoose.model<IEnquiry>('Enquiry', enquirySchema);
