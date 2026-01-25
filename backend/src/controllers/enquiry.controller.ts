import { Request, Response } from 'express';
import Enquiry from '../models/Enquiry';
import Plan from '../models/Plan';


// ✅ FIXED: Get all enquiries (include converted ones)
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ Fetch ALL enquiries including converted
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


// Get single enquiry
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


// Create new enquiry
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE ENQUIRY STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ Validate plan if provided
    if (req.body.plan) {
      const planExists = await Plan.findById(req.body.plan);
      if (!planExists) {
        console.error('❌ Plan not found:', req.body.plan);
        res.status(400).json({ 
          success: false, 
          message: 'Invalid plan ID provided' 
        });
        return;
      }
      console.log('✅ Plan validated:', planExists.planName);
    }
    
    // ✅ Generate enquiry ID manually
    const count = await Enquiry.countDocuments();
    const enquiryId = 'ENQ' + String(count + 1).padStart(4, '0');
    
    console.log('Generated enquiryId:', enquiryId);
    
    // ✅ Create enquiry data
    const enquiryData: any = {
      ...req.body,
      enquiryId: enquiryId
    };
    
    // Remove plan if it's empty string
    if (!enquiryData.plan || enquiryData.plan === '') {
      delete enquiryData.plan;
      console.log('⚠️ No plan provided, creating enquiry without plan');
    } else {
      console.log('📋 Creating enquiry with plan:', enquiryData.plan);
    }
    
    console.log('Final enquiry data:', JSON.stringify(enquiryData, null, 2));
    
    // ✅ Create and save enquiry
    const enquiry = new Enquiry(enquiryData);
    await enquiry.save();
    console.log('✅ Enquiry saved to database');
    
    // ✅ Fetch with populated fields
    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price');
    
    console.log('✅ Enquiry populated successfully');
    console.log('Branch:', populatedEnquiry?.branch);
    console.log('Plan:', populatedEnquiry?.plan);
    
    res.status(201).json({ 
      success: true, 
      data: populatedEnquiry,
      message: 'Enquiry created successfully' 
    });
  } catch (error: any) {
    console.error('=== CREATE ENQUIRY ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create enquiry',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};


// Update enquiry
export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== UPDATE ENQUIRY STARTED ===');
    console.log('Enquiry ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // ✅ Validate plan if provided
    if (req.body.plan && req.body.plan !== '') {
      const planExists = await Plan.findById(req.body.plan);
      if (!planExists) {
        console.error('❌ Plan not found:', req.body.plan);
        res.status(400).json({ 
          success: false, 
          message: 'Invalid plan ID provided' 
        });
        return;
      }
      console.log('✅ Plan validated:', planExists.planName);
    }
    
    // ✅ Clean up request body
    const updateData: any = { ...req.body };
    
    // If plan is empty string or undefined, set to null
    if (!updateData.plan || updateData.plan === '') {
      updateData.plan = null;
      console.log('⚠️ Setting plan to null');
    } else {
      console.log('📋 Updating with plan:', updateData.plan);
    }
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branch', 'name city state')
      .populate('plan', 'planName duration price');
    
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }
    
    console.log('✅ Enquiry updated successfully');
    console.log('Branch:', enquiry.branch);
    console.log('Plan:', enquiry.plan);
    
    res.json({ success: true, data: enquiry });
  } catch (error: any) {
    console.error('=== UPDATE ENQUIRY ERROR ===');
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update enquiry' 
    });
  }
};


// Delete enquiry
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


// ✅ FIXED: Get enquiry statistics
export const getEnquiryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ Count all enquiries
    const totalEnquiries = await Enquiry.countDocuments();
    
    // ✅ Count pending enquiries (not converted)
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    
    // ✅ Count this month's enquiries
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
        pending: pending, // ✅ Changed from 'confirmed' to 'pending'
        thisMonth: thisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
