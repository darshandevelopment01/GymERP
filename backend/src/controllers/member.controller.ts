import { Request, Response } from 'express';
import Member from '../models/Member';

// Create new member
export const createMember = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating member with data:', req.body);
    
    // Generate member ID
    const count = await Member.countDocuments();
    const memberId = 'MEM' + String(count + 1).padStart(4, '0');
    
    // Calculate membership end date based on plan duration
    const startDate = new Date(req.body.membershipStartDate);
    const endDate = new Date(startDate);
    
    // You can adjust this based on your plan duration logic
    endDate.setFullYear(endDate.getFullYear() + 1); // Default 1 year
    
    const member = new Member({
      ...req.body,
      memberId: memberId,
      membershipEndDate: endDate
    });
    
    await member.save();
    
    const populatedMember = await Member.findById(member._id)
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price');
    
    res.status(201).json({ 
      success: true, 
      data: populatedMember,
      message: 'Member created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating member:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create member'
    });
  }
};

// Get all members
export const getAllMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await Member.find()
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// Get member by ID
export const getMemberById = async (req: Request, res: Response): Promise<void> => {
    try {
      const member = await Member.findById(req.params.id)
        .populate('branch', 'name city')
        .populate('plan', 'planName duration price');
      
      if (!member) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }
      
      res.json({ success: true, data: member });
    } catch (error) {
      console.error('Error fetching member:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch member' });
    }
  };
  
  // Update member
  export const updateMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const member = await Member.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('branch', 'name city')
        .populate('plan', 'planName duration price');
      
      if (!member) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }
      
      res.json({ success: true, data: member });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ success: false, message: 'Failed to update member' });
    }
  };
  
  // Delete member
  export const deleteMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const member = await Member.findByIdAndDelete(req.params.id);
      
      if (!member) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }
      
      res.json({ success: true, message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ success: false, message: 'Failed to delete member' });
    }
  };
  
