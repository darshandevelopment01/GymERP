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
// backend/src/models/Employee.ts
const mongoose_1 = __importStar(require("mongoose"));
const EmployeeSchema = new mongoose_1.Schema({
    employeeCode: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    address: {
        type: String,
    },
    // Job details
    designation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Designation',
        // required: true,
    },
    position: {
        type: String, // Keep for backward compatibility
    },
    salary: {
        type: Number,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    shift: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Shift',
        // required: true,
    },
    // Branch assignment
    branches: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Branch',
        }],
    branchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    // Profile photo
    profilePhoto: {
        type: String,
    },
    // User type
    userType: {
        type: String,
        enum: ['Admin', 'User'],
        default: 'User',
    },
    // Permissions (only relevant for 'User' type; Admin gets all access)
    permissions: {
        panelAccess: {
            viewMastersTab: { type: Boolean, default: false },
            viewEnquiryTab: { type: Boolean, default: false },
            createEnquiry: { type: Boolean, default: false },
            convertToMember: { type: Boolean, default: false },
            noDiscountLimit: { type: Boolean, default: false },
            viewOnlySelfCreatedEnquiry: { type: Boolean, default: false },
            viewMembersTab: { type: Boolean, default: false },
            renewMember: { type: Boolean, default: false },
            activeMember: { type: Boolean, default: false },
            viewOnlySelfCreatedMembers: { type: Boolean, default: false },
            viewAttendanceTab: { type: Boolean, default: false },
            viewEmployeeAttendance: { type: Boolean, default: false },
            viewMemberAttendance: { type: Boolean, default: false },
        },
        appAccess: {
            viewEnquiryTab: { type: Boolean, default: false },
            createEnquiry: { type: Boolean, default: false },
            convertToMember: { type: Boolean, default: false },
            noDiscountLimit: { type: Boolean, default: false },
            viewOnlySelfCreatedEnquiry: { type: Boolean, default: false },
            markEnquiryAsLost: { type: Boolean, default: false },
            viewFollowUpTab: { type: Boolean, default: false },
            addFollowUps: { type: Boolean, default: false },
            viewOnlySelfCreatedFollowUps: { type: Boolean, default: false },
            viewMembersTab: { type: Boolean, default: false },
            renewMember: { type: Boolean, default: false },
            activeMember: { type: Boolean, default: false },
            viewOnlySelfCreatedMembers: { type: Boolean, default: false },
            createRemoveOffers: { type: Boolean, default: false },
        },
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    resetPasswordOtp: String,
    resetOtpExpires: Date,
}, {
    timestamps: true,
});
// Compare password method
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
};
exports.default = mongoose_1.default.model('Employee', EmployeeSchema);
