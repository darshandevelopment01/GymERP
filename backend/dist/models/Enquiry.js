"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const enquirySchema = new mongoose_1.Schema({
    enquiryId: {
        type: String,
        unique: true,
        required: false
    },
    branch: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (v) {
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
            validator: function (v) {
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});
// ✅ Pre-save middleware to auto-generate enquiryId (FIXED - removed next callback)
enquirySchema.pre('save', async function () {
    // Only generate ID if it doesn't exist (for new documents)
    if (!this.enquiryId) {
        try {
            // Generate enquiry ID: ENQ-YYYYMMDD-XXXX
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            // Find the last enquiry created today with proper format validation
            const lastEnquiry = await mongoose_1.default.model('Enquiry')
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
        }
        catch (error) {
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
exports.default = mongoose_1.default.model('Enquiry', enquirySchema);
