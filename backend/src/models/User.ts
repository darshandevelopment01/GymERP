import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'gym_owner' | 'user';
  assignedRoles?: string[];
  designation?: string;
  profilePhoto?: string;
  gender?: string;
  gymBranchId?: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  isActive: boolean;
  resetPasswordOtp?: string;
  resetOtpExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  employeeCode: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['gym_owner', 'user'],
    default: 'user'
  },
  assignedRoles: [{
    type: String
  }],
  designation: String,
  profilePhoto: String,
  gender: String,
  gymBranchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  shiftId: {
    type: Schema.Types.ObjectId,
    ref: 'Shift'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordOtp: String,
  resetOtpExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Auto-generate employee code
UserSchema.pre('save', async function () {
  if (!this.employeeCode && this.userType === 'user') {
    const count = await mongoose.model('User').countDocuments({ userType: 'user' });
    this.employeeCode = `EMP${String(count + 1).padStart(4, '0')}`;
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
