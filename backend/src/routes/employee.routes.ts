// backend/src/routes/employee.routes.ts
import { Router, Request, Response } from 'express';
import Employee from '../models/Employee';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().populate('branchId', 'name');
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

    // Hash a default password if missing to fulfill the required schema
    if (!employeeData.password) {
      const bcrypt = require('bcryptjs');
      employeeData.password = await bcrypt.hash('123456', 10);
    } else {
      const bcrypt = require('bcryptjs');
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
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

    // Only hash password if it was explicitly updated in an admin screen
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

export default router;
