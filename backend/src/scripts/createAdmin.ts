// @ts-nocheck
// backend/src/scripts/createAdmin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-erp');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const count = await Employee.countDocuments();
    const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

    const admin = new Employee({
      employeeCode,
      name: 'Admin User',
      email: 'admin@muscletime.com',
      phone: '0000000000',
      password: hashedPassword,
      gender: 'Male',
      userType: 'Admin',
      status: 'active',
    });

    await admin.save();
    console.log('✅ Admin user created!');
    console.log('Email: admin@muscletime.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
