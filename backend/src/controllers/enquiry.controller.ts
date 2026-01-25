import { Request, Response } from 'express';
import Enquiry from '../models/Enquiry';
import Plan from '../models/Plan';
import Branch from '../models/Branch';
import mongoose from 'mongoose';


// ✅ GET ALL ENQUIRIES
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const enquiries = await Enquiry.find()
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Fetched ${enquiries.length} enquiries`);
    
    res.json({ success: true, data: enquiries });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
  }
};


// ✅ GET SINGLE ENQUIRY
export const getEnquiryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price');
    
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }
    
    res.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry' });
  }
};


// ✅ CREATE NEW ENQUIRY - FIXED WITH TRIMMING AND VALIDATION
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE ENQUIRY STARTED ===');
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ STEP 1: Trim all string fields to remove whitespace
    const trimmedData: any = { ...req.body };
    Object.keys(trimmedData).forEach(key => {
      if (typeof trimmedData[key] === 'string') {
        trimmedData[key] = trimmedData[key].trim();
        console.log(`✂️ Trimmed ${key}: "${req.body[key]}" -> "${trimmedData[key]}"`);
      }
    });
    
    console.log('✂️ Trimmed data:', JSON.stringify(trimmedData, null, 2));
    
    // ✅ STEP 2: Clean the data - remove empty optional fields
    const cleanedData: any = { ...trimmedData };
    
    const optionalFields = ['plan', 'dateOfBirth', 'followUpDate', 'notes', 'status', 'profilePhoto'];
    optionalFields.forEach(field => {
      if (
        cleanedData[field] === '' || 
        cleanedData[field] === null || 
        cleanedData[field] === undefined ||
        cleanedData[field] === 'select'
      ) {
        delete cleanedData[field];
        console.log(`🧹 Removed empty field: ${field}`);
      }
    });
    
    console.log('🧹 Cleaned data:', JSON.stringify(cleanedData, null, 2));
    
    // ✅ STEP 3: Validate required fields
    const requiredFields = ['branch', 'name', 'mobileNumber', 'email', 'gender', 'source'];
    const missingFields = requiredFields.filter(field => !cleanedData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
      return;
    }
    
    // ✅ STEP 4: Validate branch ObjectId and existence
    if (!mongoose.Types.ObjectId.isValid(cleanedData.branch)) {
      console.error('❌ Invalid branch ObjectId format:', cleanedData.branch);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid branch ID format' 
      });
      return;
    }
    
    const branchExists = await Branch.findById(cleanedData.branch);
    if (!branchExists) {
      console.error('❌ Branch not found:', cleanedData.branch);
      res.status(400).json({ 
        success: false, 
        message: 'Branch not found' 
      });
      return;
    }
    console.log('✅ Branch validated:', branchExists.name);
    
    // ✅ STEP 5: Validate plan if provided
    if (cleanedData.plan) {
      if (!mongoose.Types.ObjectId.isValid(cleanedData.plan)) {
        console.error('❌ Invalid plan ObjectId format:', cleanedData.plan);
        res.status(400).json({ 
          success: false, 
          message: 'Invalid plan ID format' 
        });
        return;
      }
      
      const planExists = await Plan.findById(cleanedData.plan);
      if (!planExists) {
        console.error('❌ Plan not found:', cleanedData.plan);
        res.status(400).json({ 
          success: false, 
          message: 'Plan not found' 
        });
        return;
      }
      console.log('✅ Plan validated:', planExists.planName);
    } else {
      console.log('⚠️ No plan provided (optional)');
    }
    
    // ✅ STEP 6: Validate mobile number format
    if (!/^[0-9]{10}$/.test(cleanedData.mobileNumber)) {
      console.error('❌ Invalid mobile number format:', cleanedData.mobileNumber);
      res.status(400).json({ 
        success: false, 
        message: 'Mobile number must be exactly 10 digits' 
      });
      return;
    }
    console.log('✅ Mobile number validated');
    
    // ✅ STEP 7: Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
      console.error('❌ Invalid email format:', cleanedData.email);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
      return;
    }
    console.log('✅ Email validated');
    
    // ✅ STEP 8: Validate gender
    if (!['Male', 'Female', 'Other'].includes(cleanedData.gender)) {
      console.error('❌ Invalid gender value:', cleanedData.gender);
      res.status(400).json({ 
        success: false, 
        message: 'Gender must be Male, Female, or Other' 
      });
      return;
    }
    console.log('✅ Gender validated');
    
    // ✅ STEP 9: Validate source
    const validSources = ['Walk-in', 'Social Media', 'Referral', 'Website', 'Phone Call'];
    if (!validSources.includes(cleanedData.source)) {
      console.error('❌ Invalid source value:', cleanedData.source);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid enquiry source' 
      });
      return;
    }
    console.log('✅ Source validated');
    
    console.log('✅ All validations passed');
    console.log('📝 Final data to save:', JSON.stringify(cleanedData, null, 2));
    
    // ✅ STEP 10: Create and save enquiry
    const enquiry = new Enquiry(cleanedData);
    await enquiry.save();
    console.log('✅ Enquiry saved to database with ID:', enquiry._id);
    console.log('✅ Generated enquiryId:', enquiry.enquiryId);
    
    // ✅ STEP 11: Fetch with populated fields
    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price');
    
    console.log('✅ Enquiry populated successfully');
    
    res.status(201).json({ 
      success: true, 
      data: populatedEnquiry,
      message: 'Enquiry created successfully' 
    });
    
  } catch (error: any) {
    console.error('=== CREATE ENQUIRY ERROR ===');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false, 
        message: `Validation failed: ${messages.join(', ')}` 
      });
      return;
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      res.status(400).json({ 
        success: false, 
        message: `${field || 'Field'} already exists` 
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create enquiry',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// ✅ UPDATE ENQUIRY - FIXED WITH TRIMMING
export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== UPDATE ENQUIRY STARTED ===');
    console.log('Enquiry ID:', req.params.id);
    console.log('📥 Raw update data:', JSON.stringify(req.body, null, 2));
    
    // ✅ Trim all string fields
    const trimmedData: any = { ...req.body };
    Object.keys(trimmedData).forEach(key => {
      if (typeof trimmedData[key] === 'string') {
        trimmedData[key] = trimmedData[key].trim();
      }
    });
    
    // ✅ Clean the data
    const cleanedData: any = { ...trimmedData };
    
    const optionalFields = ['plan', 'dateOfBirth', 'followUpDate', 'notes', 'profilePhoto'];
    optionalFields.forEach(field => {
      if (
        cleanedData[field] === '' || 
        cleanedData[field] === null || 
        cleanedData[field] === undefined
      ) {
        delete cleanedData[field];
        console.log(`🧹 Removed empty field: ${field}`);
      }
    });
    
    // ✅ Validate plan if provided
    if (cleanedData.plan) {
      if (!mongoose.Types.ObjectId.isValid(cleanedData.plan)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid plan ID format' 
        });
        return;
      }
      
      const planExists = await Plan.findById(cleanedData.plan);
      if (!planExists) {
        console.error('❌ Plan not found:', cleanedData.plan);
        res.status(400).json({ 
          success: false, 
          message: 'Plan not found' 
        });
        return;
      }
      console.log('✅ Plan validated:', planExists.planName);
    }
    
    // ✅ Validate branch if provided
    if (cleanedData.branch) {
      if (!mongoose.Types.ObjectId.isValid(cleanedData.branch)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid branch ID format' 
        });
        return;
      }
      
      const branchExists = await Branch.findById(cleanedData.branch);
      if (!branchExists) {
        res.status(400).json({ 
          success: false, 
          message: 'Branch not found' 
        });
        return;
      }
      console.log('✅ Branch validated');
    }
    
    console.log('🧹 Final update data:', JSON.stringify(cleanedData, null, 2));
    
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      cleanedData,
      { new: true, runValidators: true }
    )
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price');
    
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }
    
    console.log('✅ Enquiry updated successfully');
    
    res.json({ 
      success: true, 
      data: enquiry,
      message: 'Enquiry updated successfully'
    });
    
  } catch (error: any) {
    console.error('=== UPDATE ENQUIRY ERROR ===');
    console.error('❌ Error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false, 
        message: `Validation failed: ${messages.join(', ')}` 
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update enquiry' 
    });
  }
};


// ✅ DELETE ENQUIRY
export const deleteEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }
    
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete enquiry' });
  }
};


// ✅ GET ENQUIRY STATISTICS
export const getEnquiryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    
    const thisMonth = await Enquiry.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    console.log('📊 Stats:', { total: totalEnquiries, pending, thisMonth });
    
    res.json({
      success: true,
      data: {
        total: totalEnquiries,
        pending: pending,
        thisMonth: thisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
