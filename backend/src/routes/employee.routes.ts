import { Router, Request, Response } from 'express';
import Employee from '../models/Employee';
import { authMiddleware } from '../middleware/auth.middleware';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '../config/cloudflare';

const router = Router();

// Helper to delete from R2
const deleteFromR2 = async (key: string) => {
  if (!key) return;
  try {
    await r2Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    }));
    console.log(`✅ Deleted from R2: ${key}`);
  } catch (err) {
    console.error(`❌ Failed to delete from R2: ${key}`, err);
  }
};

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().select('-password').populate('branchId', 'name');
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employeeData = { ...req.body };

    // Auto-generate employeeCode if missing
    if (!employeeData.employeeCode) {
      const count = await Employee.countDocuments();
      employeeData.employeeCode = `EMP-${Date.now().toString().slice(-6)}-${count + 1}`;
    }

    // Hash a default password if missing
    if (!employeeData.password) {
      const bcrypt = require('bcryptjs');
      employeeData.password = await bcrypt.hash('123456', 10);
    } else {
      const bcrypt = require('bcryptjs');
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
    }

    // Sanitize Empty Strings for ObjectIds
    ['designation', 'branchId'].forEach(key => {
      if (employeeData[key] === '') delete employeeData[key];
    });

    // Handle shifts array - filter out empty strings
    if (Array.isArray(employeeData.shifts)) {
      employeeData.shifts = employeeData.shifts.filter((s: string) => s !== '');
    }

    const employee = new Employee(employeeData);
    await employee.save();
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    const oldEmployee = await Employee.findById(req.params.id);
    if (!oldEmployee) return res.status(404).json({ message: 'Employee not found' });

    // Only hash password if updated
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    // Sanitize
    ['designation', 'branchId'].forEach(key => {
      if (updateData[key] === '') delete updateData[key];
    });

    // Handle shifts array
    if (Array.isArray(updateData.shifts)) {
      updateData.shifts = updateData.shifts.filter((s: string) => s !== '');
    }

    // Auto-delete previous document if a NEW one is provided
    if (updateData.document?.fileKey && oldEmployee.document?.fileKey && 
        updateData.document.fileKey !== oldEmployee.document.fileKey) {
      await deleteFromR2(oldEmployee.document.fileKey);
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Cleanup document from R2
    if (employee.document?.fileKey) {
      await deleteFromR2(employee.document.fileKey);
    }

    // Cleanup profile photo from R2 if it exists (Optional but good practice)
    if (employee.profilePhoto && employee.profilePhoto.includes(R2_BUCKET_NAME)) {
        // We'd need to extract the key from the URL. 
        // For now focusing on the document as requested.
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

export default router;
