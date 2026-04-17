// backend/src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import Member from '../models/Member';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Helper to normalize date to midnight UTC
const normalizeDate = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { type, month, year } = req.query;
    if (!type || !month || !year) {
      return res.status(400).json({ message: 'Type, month, and year are required' });
    }

    const startOfMonth = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endOfMonth = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

    const attendance = await Attendance.find({
      personType: type as 'member' | 'employee',
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('personId', 'name profilePhoto memberId employeeCode')
      .populate('markedBy', 'name');

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { personId, personType, date, status, note } = req.body;
    const markedBy = (req as any).user?.id;

    if (!personId || !personType || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendanceDate = date ? normalizeDate(new Date(date)) : normalizeDate(new Date());

    const result = await Attendance.findOneAndUpdate(
      { personId, personType, date: attendanceDate },
      {
        personId,
        personType,
        date: attendanceDate,
        status,
        note,
        markedBy,
        method: 'manual',
        checkInTime: status === 'present' ? new Date() : undefined,
      },
      { upsert: true, new: true }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { personId, personType, startDate, endDate, reason } = req.body;
    const appliedBy = (req as any).user?.id;

    if (!personId || !personType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const leave = new Leave({
      personId,
      personType,
      startDate: normalizeDate(new Date(startDate)),
      endDate: normalizeDate(new Date(endDate)),
      reason,
      appliedBy,
      status: 'pending',
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaves = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const filter: any = {};
    if (type) filter.personType = type;

    const leaves = await Leave.find(filter)
      .populate('personId', 'name memberId employeeCode')
      .populate('appliedBy', 'name')
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const handledBy = (req as any).user?.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    leave.handledBy = handledBy;
    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }
    await leave.save();

    // If approved, create/update attendance records for the range
    if (status === 'approved') {
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      while (current <= end) {
        await Attendance.findOneAndUpdate(
          {
            personId: leave.personId,
            personType: leave.personType,
            date: new Date(current),
          },
          {
            status: 'leave',
            method: 'manual',
            note: `Leave Approved: ${leave.reason}`,
            markedBy: handledBy,
          },
          { upsert: true }
        );
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    res.json(leave);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const leaves = await Leave.find({ personId: userId })
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGymQr = async (req: Request, res: Response) => {
  try {
    const gymToken = jwt.sign(
      { type: 'gym-attendance-qr', gym: 'muscletime' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1y' }
    );
    res.json({ token: gymToken });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const qrCheckin = async (req: Request, res: Response) => {
  try {
    const { gymQrToken } = req.body;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role; // Should handle members vs employees in mobile app

    if (!gymQrToken) {
      return res.status(400).json({ message: 'Gym QR token is required' });
    }

    // Verify gym token
    try {
      jwt.verify(gymQrToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(401).json({ message: 'Invalid Gym QR' });
    }

    // Determine if it's a member or employee from the User token
    // In this system, 'member' check-in is the main use case for QR.
    // Let's check based on the role or try finding in collections.
    
    let personType: 'member' | 'employee' = 'member';
    let person = await Member.findById(userId);
    if (!person) {
      person = await Employee.findById(userId);
      personType = 'employee';
    }

    if (!person) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = normalizeDate(new Date());

    // Check if already marked
    const existing = await Attendance.findOne({ personId: userId, personType, date: today });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    const attendance = new Attendance({
      personId: userId,
      personType,
      date: today,
      status: 'present',
      method: 'qr',
      checkInTime: new Date(),
    });

    await attendance.save();
    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { type, month, year } = req.query;
    const startOfMonth = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endOfMonth = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

    const stats = await Attendance.aggregate([
      {
        $match: {
          personType: type as any,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format stats for frontend
    const result = {
      present: stats.find((s) => s._id === 'present')?.count || 0,
      absent: stats.find((s) => s._id === 'absent')?.count || 0,
      leave: stats.find((s) => s._id === 'leave')?.count || 0,
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
