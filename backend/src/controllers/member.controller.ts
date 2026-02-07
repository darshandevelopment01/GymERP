import { Request, Response } from 'express';
import Member from '../models/Member';
import Plan from '../models/Plan';
import Branch from '../models/Branch';
import mongoose from 'mongoose';

// Create new member
export const createMember = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE MEMBER STARTED ===');
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ Trim all string fields
    const trimmedData: any = { ...req.body };
    Object.keys(trimmedData).forEach(key => {
      if (typeof trimmedData[key] === 'string') {
        trimmedData[key] = trimmedData[key].trim();
      }
    });
    
    // ✅ Validate branch
    if (!mongoose.Types.ObjectId.isValid(trimmedData.branch)) {
      res.status(400).json({ success: false, message: 'Invalid branch ID format' });
      return;
    }
    
    const branchExists = await Branch.findById(trimmedData.branch);
    if (!branchExists) {
      res.status(400).json({ success: false, message: 'Branch not found' });
      return;
    }
    
    // ✅ Validate plan
    if (!mongoose.Types.ObjectId.isValid(trimmedData.plan)) {
      res.status(400).json({ success: false, message: 'Invalid plan ID format' });
      return;
    }
    
    const planExists = await Plan.findById(trimmedData.plan);
    if (!planExists) {
      res.status(400).json({ success: false, message: 'Plan not found' });
      return;
    }
    
    // ✅ Calculate membership end date based on plan duration
    const startDate = new Date(trimmedData.membershipStartDate || Date.now());
    const endDate = new Date(startDate);
    
    // Parse plan duration (e.g., "3 Months", "1 Year")
    const durationMatch = planExists.duration.match(/(\d+)\s*(Month|Year|Day)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      
      if (unit.includes('month')) {
        endDate.setMonth(endDate.getMonth() + value);
      } else if (unit.includes('year')) {
        endDate.setFullYear(endDate.getFullYear() + value);
      } else if (unit.includes('day')) {
        endDate.setDate(endDate.getDate() + value);
      }
    } else {
      // Default to 1 year if parsing fails
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // ✅ Calculate payment remaining
    const paymentRemaining = Math.max(0, planExists.price - (trimmedData.paymentReceived || 0));
    
    const memberData = {
      ...trimmedData,
      membershipEndDate: endDate,
      paymentRemaining: paymentRemaining
    };
    
    console.log('📝 Final member data:', JSON.stringify(memberData, null, 2));
    
    const member = new Member(memberData);
    await member.save();
    
    const populatedMember = await Member.findById(member._id)
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price');
    
    console.log('✅ Member created:', populatedMember?.memberId);
    
    res.status(201).json({ 
      success: true, 
      data: populatedMember,
      message: 'Member created successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error creating member:', error);
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

// Rest of your controller functions remain the same...
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
