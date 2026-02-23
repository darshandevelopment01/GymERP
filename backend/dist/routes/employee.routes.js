"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/employee.routes.ts
const express_1 = require("express");
const Employee_1 = __importDefault(require("../models/Employee"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const employees = await Employee_1.default.find().populate('branchId', 'name');
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const employeeData = { ...req.body };
        // Auto-generate employeeCode if missing
        if (!employeeData.employeeCode) {
            const count = await Employee_1.default.countDocuments();
            employeeData.employeeCode = `EMP-${Date.now().toString().slice(-6)}-${count + 1}`;
        }
        // Hash a default password if missing to fulfill the required schema
        if (!employeeData.password) {
            const bcrypt = require('bcryptjs');
            employeeData.password = await bcrypt.hash('123456', 10);
        }
        else {
            const bcrypt = require('bcryptjs');
            employeeData.password = await bcrypt.hash(employeeData.password, 10);
        }
        // Sanitize Empty Strings to prevent Mongoose CastError on ObjectIds
        ['designation', 'shift', 'branchId'].forEach(key => {
            if (employeeData[key] === '') {
                delete employeeData[key];
            }
        });
        const employee = new Employee_1.default(employeeData);
        await employee.save();
        res.status(201).json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
});
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const updateData = { ...req.body };
        // Only hash password if it was explicitly updated in an admin screen
        if (updateData.password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        // Sanitize Empty Strings to prevent Mongoose CastError on ObjectIds
        ['designation', 'shift', 'branchId'].forEach(key => {
            if (updateData[key] === '') {
                delete updateData[key];
            }
        });
        const employee = await Employee_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
});
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const employee = await Employee_1.default.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
});
exports.default = router;
