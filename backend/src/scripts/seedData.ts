// @ts-nocheck
// backend/src/scripts/seedData.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member';
import Employee from '../models/Employee';
import Branch from '../models/Branch';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-erp');
    console.log('Connected to MongoDB');

    // Create branches
    const branch1 = await Branch.create({
      name: 'Main Branch',
      address: '123 Main Street',
      phone: '9876543210',
      email: 'main@muscletime.com',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411001',
      status: 'active'
    });

    const branch2 = await Branch.create({
      name: 'Downtown Branch',
      address: '456 Downtown Road',
      phone: '9876543211',
      email: 'downtown@muscletime.com',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411002',
      status: 'active'
    });

    console.log('✅ Branches created');

    // Create employees
    for (let i = 1; i <= 20; i++) {
      await Employee.create({
        name: `Employee ${i}`,
        email: `employee${i}@muscletime.com`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        dateOfBirth: new Date('1995-01-01'),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: `Address ${i}`,
        position: i % 3 === 0 ? 'Trainer' : 'Staff',
        salary: 25000 + (i * 1000),
        branchId: i % 2 === 0 ? branch1._id : branch2._id,
        status: 'active'
      });
    }
    console.log('✅ 20 Employees created');

    // Create members
    for (let i = 1; i <= 100; i++) {
      await Member.create({
        name: `Member ${i}`,
        email: `member${i}@gmail.com`,
        phone: `98765${i.toString().padStart(5, '0')}`,
        dateOfBirth: new Date('1990-01-01'),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: `Address ${i}`,
        membershipType: i % 3 === 0 ? 'Premium' : 'Basic',
        joinDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        branchId: i % 2 === 0 ? branch1._id : branch2._id,
        status: 'active'
      });
    }
    console.log('✅ 100 Members created');

    console.log('🎉 Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
