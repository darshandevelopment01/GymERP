import { Request, Response } from 'express';
import FollowUp from '../models/FollowUp.js';

export const getAllFollowUps = async (req: Request, res: Response): Promise<void> => {
  try {
    const followups = await FollowUp.find()
      .populate('member', 'name memberId email mobileNumber')
      .populate('enquiry', 'name enquiryId email mobileNumber')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: followups
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-ups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFollowUpById = async (req: Request, res: Response): Promise<void> => {
  try {
    const followup = await FollowUp.findById(req.params.id)
      .populate('member', 'name memberId email mobileNumber')
      .populate('enquiry', 'name enquiryId email mobileNumber')
      .populate('createdBy', 'name email');

    if (!followup) {
      res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
      return;
    }

    res.json({
      success: true,
      data: followup
    });
  } catch (error) {
    console.error('Error fetching follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-up',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const followup = await FollowUp.create(req.body);
    
    const populatedFollowUp = await FollowUp.findById(followup._id)
      .populate('member', 'name memberId email mobileNumber')
      .populate('enquiry', 'name enquiryId email mobileNumber')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedFollowUp,
      message: 'Follow-up created successfully'
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating follow-up',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const followup = await FollowUp.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('member', 'name memberId email mobileNumber')
      .populate('enquiry', 'name enquiryId email mobileNumber')
      .populate('createdBy', 'name email');

    if (!followup) {
      res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
      return;
    }

    res.json({
      success: true,
      data: followup,
      message: 'Follow-up updated successfully'
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating follow-up',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const followup = await FollowUp.findByIdAndDelete(req.params.id);

    if (!followup) {
      res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Follow-up deleted successfully',
      data: followup
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting follow-up',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get follow-ups by member
export const getFollowUpsByMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    
    const followups = await FollowUp.find({ member: memberId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: followups
    });
  } catch (error) {
    console.error('Error fetching member follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member follow-ups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get follow-ups by enquiry
export const getFollowUpsByEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enquiryId } = req.params;
    
    const followups = await FollowUp.find({ enquiry: enquiryId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: followups
    });
  } catch (error) {
    console.error('Error fetching enquiry follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enquiry follow-ups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get follow-up statistics
export const getFollowUpStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await FollowUp.countDocuments();
    const pending = await FollowUp.countDocuments({ status: 'pending' });
    const completed = await FollowUp.countDocuments({ status: 'completed' });
    const expired = await FollowUp.countDocuments({ status: 'expired' });

    // Get today's follow-ups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFollowUps = await FollowUp.countDocuments({
      followUpDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        completed,
        expired,
        todayFollowUps
      }
    });
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-up statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Auto-expire past follow-ups (can be called by a cron job)
export const autoExpireFollowUps = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await FollowUp.updateMany(
      {
        followUpDate: { $lt: today },
        status: 'pending'
      },
      {
        $set: { status: 'expired' }
      }
    );

    res.json({
      success: true,
      message: 'Follow-ups auto-expired successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error auto-expiring follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-expiring follow-ups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
