import { Request, Response } from 'express';
import Enquiry from '../models/Enquiry';

// Get all enquiries
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const enquiries = await Enquiry.find()
      .populate('branch', 'branchName city')
      .populate('plan', 'planName duration price')
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

// Create new enquiry
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const enquiry = new Enquiry(req.body);
    await enquiry.save();
    
    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('branch', 'branchName city')
      .populate('plan', 'planName duration price');
    
    res.status(201).json({ success: true, data: populatedEnquiry });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to create enquiry' });
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
      .populate('plan', 'planName duration price');
    
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
