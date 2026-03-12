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
const MemberSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    plan: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enquiry',
        required: false
    },
    convertedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    }
}, {
    timestamps: true
});
MemberSchema.pre('save', async function () {
    if (!this.memberId) {
        try {
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const lastMember = await mongoose_1.default.model('Member')
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
        }
        catch (error) {
            console.error('❌ Error generating memberId:', error);
            this.memberId = `MEM-${Date.now()}`;
        }
    }
});
exports.default = mongoose_1.default.model('Member', MemberSchema);
