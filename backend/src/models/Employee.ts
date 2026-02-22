// backend/src/models/Employee.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  password: string; // For login
  dateOfBirth?: Date;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;

  // Job details
  designation: mongoose.Types.ObjectId; // Ref to Designation Master
  position?: string; // Keep for backward compatibility
  salary?: number;
  joinDate: Date;
  shift: mongoose.Types.ObjectId; // Ref to Shift Master

  // Branch assignment (can work at multiple branches)
  branches: mongoose.Types.ObjectId[]; // Multiple branches
  branchId?: mongoose.Types.ObjectId; // Keep for backward compatibility

  // User type and permissions
  userType: 'Admin' | 'User';
  permissions?: {
    panelAccess?: {
      viewMastersTab?: boolean;
      viewEnquiryTab?: boolean;
      createEnquiry?: boolean;
      convertToMember?: boolean;
      noDiscountLimit?: boolean;
      viewOnlySelfCreatedEnquiry?: boolean;
      viewMembersTab?: boolean;
      renewMember?: boolean;
      activeMember?: boolean;
      viewOnlySelfCreatedMembers?: boolean;
      viewAttendanceTab?: boolean;
      viewEmployeeAttendance?: boolean;
      viewMemberAttendance?: boolean;
    };
    appAccess?: {
      viewEnquiryTab?: boolean;
      createEnquiry?: boolean;
      convertToMember?: boolean;
      noDiscountLimit?: boolean;
      viewOnlySelfCreatedEnquiry?: boolean;
      markEnquiryAsLost?: boolean;
      viewFollowUpTab?: boolean;
      addFollowUps?: boolean;
      viewOnlySelfCreatedFollowUps?: boolean;
      viewMembersTab?: boolean;
      renewMember?: boolean;
      activeMember?: boolean;
      viewOnlySelfCreatedMembers?: boolean;
      createRemoveOffers?: boolean;
    };
  };

  // Profile
  profilePhoto?: string;

  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: true,
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
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },

    // Branch assignment
    branches: [{
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    }],
    branchId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
