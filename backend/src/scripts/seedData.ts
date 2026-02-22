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
      branchId: 'BR-001',
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
      branchId: 'BR-002',
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

    console.log('🎉 Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
