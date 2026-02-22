// backend/src/routes/followup.routes.ts
import { Router, Request, Response } from 'express';
import FollowUp from '../models/FollowUp';
import ActivityLog from '../models/ActivityLog';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ✅ Auto-expire overdue follow-ups
const autoExpireFollowUps = async () => {
  try {
    const now = new Date();
    // Find all pending follow-ups where the follow-up date has passed
    const overdueFollowUps = await FollowUp.find({
      status: 'pending',
      followUpDate: { $exists: true, $ne: null }
    });

    const expiredIds: any[] = [];

    for (const fu of overdueFollowUps) {
      const fuDate = new Date(fu.followUpDate as Date);

      // If followUpTime exists, combine date + time for precise comparison
      if (fu.followUpTime) {
        const [hours, minutes] = fu.followUpTime.split(':').map(Number);
        fuDate.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        // If no time specified, expire at end of the follow-up day
        fuDate.setHours(23, 59, 59, 999);
      }

      if (fuDate < now) {
        expiredIds.push(fu._id);
      }
    }

    if (expiredIds.length > 0) {
      await FollowUp.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
      );
      console.log(`✅ Auto-expired ${expiredIds.length} overdue follow-up(s)`);
    }
  } catch (error) {
    console.error('Error auto-expiring follow-ups:', error);
  }
};

// Create follow-up
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { member, enquiry, note, followUpDate, followUpTime } = req.body;

    const followUp = new FollowUp({
      member,
      enquiry, // ✅ Now supports enquiry
      note,
      followUpDate,
      followUpTime,
      createdBy: req.user.id,
      status: 'pending'
    });

    await followUp.save();

    // ✅ Create activity log
    try {
      const user = await User.findById(req.user.id);
      const targetName = enquiry ? 'enquiry follow-up' : 'member follow-up';
      await ActivityLog.create({
        action: 'followup_created',
        performedBy: req.user.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'FollowUp',
        targetId: followUp._id,
        targetName: targetName,
        details: `Follow-up created${enquiry ? ' for enquiry' : member ? ' for member' : ''} by ${user?.name || 'Unknown'}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('member', 'name memberId mobileNumber')
      .populate('enquiry', 'name mobileNumber email') // ✅ Added enquiry population
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedFollowUp
    });
  } catch (error: any) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({ message: 'Error creating follow-up', error: error.message });
  }
});

// Get all follow-ups
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    await autoExpireFollowUps();
    const followUps = await FollowUp.find()
      .populate('member', 'name memberId mobileNumber')
      .populate('enquiry', 'name mobileNumber email') // ✅ Added enquiry population
      .populate('createdBy', 'name')
      .sort({ followUpDate: 1, createdAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ message: 'Error fetching follow-ups', error: error.message });
  }
});

// Get follow-ups by member
router.get('/member/:memberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    await autoExpireFollowUps();
    const followUps = await FollowUp.find({ member: req.params.memberId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error: any) {
    console.error('Error fetching member follow-ups:', error);
    res.status(500).json({ message: 'Error fetching follow-ups', error: error.message });
  }
});

// ✅ NEW: Get follow-ups by enquiry
router.get('/enquiry/:enquiryId', authMiddleware, async (req: Request, res: Response) => {
  try {
    await autoExpireFollowUps();
    const followUps = await FollowUp.find({ enquiry: req.params.enquiryId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: followUps
    });
  } catch (error: any) {
    console.error('Error fetching enquiry follow-ups:', error);
    res.status(500).json({ message: 'Error fetching enquiry follow-ups', error: error.message });
  }
});

// Update follow-up (full update via PUT)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { note, followUpDate, followUpTime, status } = req.body;

    // ✅ Fetch old followup before update
    const oldFollowUp: any = await FollowUp.findById(req.params.id).lean();

    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      { note, followUpDate, followUpTime, status },
      { new: true, runValidators: true }
    )
      .populate('member', 'name memberId mobileNumber')
      .populate('enquiry', 'name mobileNumber email');

    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // ✅ Log followup update with field-level changes
    try {
      const user = await User.findById(req.user.id);
      const updateFields = { note, followUpDate, followUpTime, status };
      const changes: string[] = [];

      if (oldFollowUp) {
        Object.keys(updateFields).forEach((key: string) => {
          if (updateFields[key] === undefined) return;
          const oldVal = oldFollowUp[key]?.toString?.() || '';
          const newVal = updateFields[key]?.toString?.() || '';
          if (oldVal !== newVal) {
            changes.push(`${key}: "${oldVal || '-'}" → "${newVal || '-'}"`);
          }
        });
      }

      const changeStr = changes.length > 0 ? changes.join(', ') : 'No field changes detected';

      await ActivityLog.create({
        action: 'followup_updated',
        performedBy: req.user.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'FollowUp',
        targetId: followUp._id,
        targetName: followUp.enquiry ? 'enquiry follow-up' : 'member follow-up',
        details: `Follow-up updated by ${user?.name || 'Unknown'} — ${changeStr}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    res.json({
      success: true,
      data: followUp
    });
  } catch (error: any) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ message: 'Error updating follow-up', error: error.message });
  }
});

// Update follow-up status
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    // ✅ Fetch old followup before update
    const oldFollowUp: any = await FollowUp.findById(req.params.id).lean();

    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('member', 'name memberId mobileNumber')
      .populate('enquiry', 'name mobileNumber email'); // ✅ Added enquiry population

    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // ✅ Log followup status update with change details
    try {
      const user = await User.findById(req.user.id);
      const oldStatus = oldFollowUp?.status || '-';

      await ActivityLog.create({
        action: 'followup_updated',
        performedBy: req.user.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'FollowUp',
        targetId: followUp._id,
        targetName: followUp.enquiry ? 'enquiry follow-up' : 'member follow-up',
        details: `Follow-up status changed by ${user?.name || 'Unknown'} — status: "${oldStatus}" → "${status}"`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    res.json({
      success: true,
      data: followUp
    });
  } catch (error: any) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ message: 'Error updating follow-up', error: error.message });
  }
});

// Delete follow-up
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);

    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    res.json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({ message: 'Error deleting follow-up', error: error.message });
  }
});

export default router;
