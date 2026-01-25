import { Request, Response } from 'express';
import Enquiry from '../models/Enquiry';

// Get all enquiries
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ Only fetch enquiries that are NOT converted
    const enquiries = await Enquiry.find({ status: { $ne: 'converted' } })
      .populate('branch', 'branchName city')
      .populate({
        path: 'plan',
        select: 'planName duration price',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });
    
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
      .populate('branch', 'branchName city state')
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

// Create new enquiry - UPDATED WITH ID GENERATION
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE ENQUIRY STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ Generate enquiry ID manually
    const count = await Enquiry.countDocuments();
    const enquiryId = 'ENQ' + String(count + 1).padStart(4, '0');
    
    console.log('Generated enquiryId:', enquiryId);
    
    // ✅ Create enquiry with generated ID
    const enquiry = new Enquiry({
      ...req.body,
      enquiryId: enquiryId
    });
    
    console.log('Enquiry object created with ID');
    
    await enquiry.save();
    console.log('Enquiry saved successfully');
    
    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'branchName city');
    
    console.log('Enquiry populated:', populatedEnquiry);
    
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
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('branch', 'branchName city')
      .populate({
        path: 'plan',
        select: 'planName duration price',
        options: { strictPopulate: false }
      });
    
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }
    
    res.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to update enquiry' });
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

// Get enquiry statistics
export const getEnquiryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const confirmed = await Enquiry.countDocuments({ status: 'confirmed' });
    const thisMonth = await Enquiry.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    res.json({
      success: true,
      data: {
        total: totalEnquiries,
        confirmed: confirmed,
        thisMonth: thisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
