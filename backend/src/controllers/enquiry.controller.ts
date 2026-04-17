import { Request, Response } from 'express';
import Enquiry from '../models/Enquiry';
import Plan from '../models/Plan';
import Branch from '../models/Branch';
import ActivityLog from '../models/ActivityLog';
import Employee from '../models/Employee';
import mongoose from 'mongoose';


// ✅ GET ALL ENQUIRIES
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    // Support selfOnly filter for viewOnlySelfCreated permission
    const filter: any = {};
    if (req.query.selfOnly === 'true' && req.user?.id) {
      filter.createdBy = req.user.id;
    }

    // ✅ MIGRATION: Handle legacy statuses (confirmed/rejected -> pending)
    await Enquiry.updateMany({
      status: { $in: ['confirmed', 'rejected'] }
    }, { status: 'pending' });

    // ✅ AUTO-EXPIRE: Mark pending enquiries as lost if follow-up date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const autoLostResult = await Enquiry.updateMany({
      status: 'pending',
      followUpDate: { $lt: today, $ne: null }
    }, { status: 'lost' });

    if (autoLostResult.modifiedCount > 0) {
      console.log(`📉 Auto-marked ${autoLostResult.modifiedCount} enquiries as LOST`);
    }

    const enquiries = await Enquiry.find(filter)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price')
      .populate('createdBy', 'name')
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
      .populate('plan', 'planName duration price')
      .populate('createdBy', 'name');

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


// ✅ CHECK FOR DUPLICATE ENQUIRY (LIGHTWEIGHT)
export const checkDuplicate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branch, mobileNumber, email } = req.body;

    if (!branch) {
      res.status(400).json({ success: false, message: 'Branch is required' });
      return;
    }

    const query: any = { branch, status: { $ne: 'lost' } }; // Only check active/pending ones or converted
    const orConditions: any[] = [];

    if (mobileNumber && mobileNumber.length === 10) {
      orConditions.push({ mobileNumber });
    }

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      orConditions.push({ email });
    }

    if (orConditions.length === 0) {
      res.json({ success: true, exists: false });
      return;
    }

    query.$or = orConditions;

    const existing = await Enquiry.findOne(query)
      .select('enquiryId name status mobileNumber email')
      .lean();

    res.json({
      success: true,
      exists: !!existing,
      enquiry: existing ? {
        _id: existing._id,
        enquiryId: existing.enquiryId,
        name: existing.name,
        status: existing.status,
        mobileNumber: existing.mobileNumber,
        email: existing.email
      } : null
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    res.status(500).json({ success: false, message: 'Failed to check duplicate' });
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

    const optionalFields = ['plan', 'followUpDate', 'notes', 'status', 'profilePhoto'];
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
    const requiredFields = ['branch', 'name', 'mobileNumber', 'gender', 'source'];
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

    // ✅ STEP 7: Validate email format (if provided)
    if (cleanedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
      console.error('❌ Invalid email format:', cleanedData.email);
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }
    console.log('✅ Email validated (or skipped)');

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
    console.log('📝 Checking for duplicates in branch:', cleanedData.branch);

    // ✅ NEW STEP: CHECK FOR DUPLICATES WITHIN THE SAME BRANCH
    const existingEnquiry = await Enquiry.findOne({
      branch: cleanedData.branch,
      $or: [
        { mobileNumber: cleanedData.mobileNumber },
        { email: cleanedData.email }
      ]
    }).populate('branch', 'name').populate('plan', 'planName');

    if (existingEnquiry) {
      const matchedField = existingEnquiry.mobileNumber === cleanedData.mobileNumber ? 'mobile number' : 'email';
      console.warn(`⚠️ Duplicate enquiry found: ${matchedField} "${matchedField === 'mobile number' ? cleanedData.mobileNumber : cleanedData.email}" already exists in this branch.`);
      
      res.status(409).json({
        success: false,
        duplicate: true,
        message: `An entry with this ${matchedField} already exists in this branch.`,
        existingEnquiry: {
          _id: existingEnquiry._id,
          enquiryId: existingEnquiry.enquiryId,
          name: existingEnquiry.name,
          mobileNumber: existingEnquiry.mobileNumber,
          email: existingEnquiry.email,
          status: existingEnquiry.status,
          branch: existingEnquiry.branch,
          plan: existingEnquiry.plan
        }
      });
      return;
    }

    console.log('📝 Final data to save:', JSON.stringify(cleanedData, null, 2));

    // ✅ STEP 10: Create and save enquiry
    const enquiry = new Enquiry({
      ...cleanedData,
      createdBy: req.user?.id || null
    });
    await enquiry.save();
    console.log('✅ Enquiry saved to database with ID:', enquiry._id);
    console.log('✅ Generated enquiryId:', enquiry.enquiryId);

    // ✅ Create activity log
    try {
      const user = await Employee.findById(req.user?.id);
      await ActivityLog.create({
        action: 'enquiry_created',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Enquiry',
        targetId: enquiry._id,
        targetName: cleanedData.name,
        details: `Enquiry ${enquiry.enquiryId} created for ${cleanedData.name}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }
    console.log('✅ Generated enquiryId:', enquiry.enquiryId);

    // ✅ STEP 11: Fetch with populated fields
    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price')
      .populate('createdBy', 'name');

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

    const optionalFields = ['plan', 'followUpDate', 'notes', 'profilePhoto'];
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

    // ✅ Fetch old enquiry before update to track changes and check status
    const oldEnquiry = await Enquiry.findById(req.params.id).lean();

    if (!oldEnquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }

    // ✅ READ-ONLY GUARD: Prevent modification if enquiry is already lost or converted
    if (oldEnquiry.status === 'lost' || oldEnquiry.status === 'converted') {
      res.status(400).json({ 
        success: false, 
        message: `Cannot modify a ${oldEnquiry.status} enquiry. This record is now read-only.` 
      });
      return;
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      cleanedData,
      { new: true, runValidators: true }
    )
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price')
      .populate('createdBy', 'name');

    console.log('✅ Enquiry updated successfully');

    // ✅ Log enquiry update with field-level changes
    try {
      const user = await Employee.findById(req.user?.id);
      const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'enquiryId'];
      const changes: string[] = [];

      if (oldEnquiry) {
        Object.keys(cleanedData).forEach(key => {
          if (skipFields.includes(key)) return;
          const oldVal = oldEnquiry[key]?.toString?.() || '';
          const newVal = cleanedData[key]?.toString?.() || '';
          if (oldVal !== newVal) {
            changes.push(`${key}: "${oldVal || '-'}" → "${newVal || '-'}"`);
          }
        });
      }

      const changeStr = changes.length > 0 ? changes.join(', ') : 'No field changes detected';

      await ActivityLog.create({
        action: 'enquiry_updated',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Enquiry',
        targetId: enquiry._id,
        targetName: enquiry.name || 'Unknown',
        details: `Enquiry "${enquiry.name}" updated by ${user?.name || 'Unknown'} — ${changeStr}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

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


// ✅ REOPEN ENQUIRY
export const reopenEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`🔄 Reopening enquiry: ${id}`);

    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }

    if (enquiry.status !== 'lost') {
      res.status(400).json({ 
        success: false, 
        message: `Only lost enquiries can be reopened. Current status: ${enquiry.status}` 
      });
      return;
    }

    // Set back to pending
    enquiry.status = 'pending';
    // We don't clear followUpDate here because the user might want to keep the history 
    // but they will likely set a new one when they edit it after reopen.
    
    await enquiry.save();

    // Log the action
    try {
      const user = await Employee.findById(req.user?.id);
      await ActivityLog.create({
        action: 'enquiry_reopened',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Enquiry',
        targetId: enquiry._id,
        targetName: enquiry.name,
        details: `Enquiry ${enquiry.enquiryId} reopened by ${user?.name || 'Unknown'}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: populatedEnquiry,
      message: 'Enquiry reopened successfully. It is now active again.'
    });

  } catch (error: any) {
    console.error('Error reopening enquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to reopen enquiry' 
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
    const converted = await Enquiry.countDocuments({ status: 'converted' });
    const lost = await Enquiry.countDocuments({ status: 'lost' });

    const thisMonth = await Enquiry.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    console.log('📊 Stats:', { total: totalEnquiries, pending, converted, lost, thisMonth });

    res.json({
      success: true,
      data: {
        total: totalEnquiries,
        pending: pending,
        converted: converted,
        lost: lost,
        thisMonth: thisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
