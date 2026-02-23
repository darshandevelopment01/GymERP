"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchEmployees = exports.deleteEmployee = exports.updateEmployee = exports.getEmployeeById = exports.getAllEmployees = exports.createEmployee = exports.deleteBranch = exports.updateBranch = exports.getBranchById = exports.getAllBranches = exports.createBranch = exports.deleteDesignation = exports.updateDesignation = exports.getDesignationById = exports.getAllDesignations = exports.createDesignation = exports.deleteShift = exports.updateShift = exports.getShiftById = exports.getAllShifts = exports.createShift = exports.deleteTaxSlab = exports.updateTaxSlab = exports.getTaxSlabById = exports.getAllTaxSlabs = exports.createTaxSlab = exports.deletePlan = exports.updatePlan = exports.getPlanById = exports.getAllPlans = exports.createPlan = exports.deletePlanCategory = exports.updatePlanCategory = exports.getPlanCategoryById = exports.getAllPlanCategories = exports.createPlanCategory = exports.deletePaymentType = exports.updatePaymentType = exports.getPaymentTypeById = exports.getAllPaymentTypes = exports.createPaymentType = void 0;
const PaymentType_1 = __importDefault(require("../models/PaymentType"));
const Plan_1 = __importDefault(require("../models/Plan"));
const PlanCategory_1 = __importDefault(require("../models/PlanCategory"));
const TaxSlab_1 = __importDefault(require("../models/TaxSlab"));
const Shift_1 = __importDefault(require("../models/Shift"));
const Designation_1 = __importDefault(require("../models/Designation"));
const Branch_1 = __importDefault(require("../models/Branch"));
const Employee_1 = __importDefault(require("../models/Employee"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mailer_1 = require("../utils/mailer");
// Generic CRUD helper functions
const generateId = async (Model, idField) => {
    const lastItem = await Model.findOne().sort({ [idField]: -1 });
    let prefix = '';
    if (idField === 'branchId')
        prefix = 'B';
    else if (idField === 'paymentTypeId')
        prefix = 'PT';
    else if (idField === 'planId')
        prefix = 'P';
    else if (idField === 'taxSlabId')
        prefix = 'T';
    else if (idField === 'shiftId')
        prefix = 'S';
    else if (idField === 'designationId')
        prefix = 'D';
    else if (idField === 'planCategoryId')
        prefix = 'PC';
    else if (idField === 'employeeCode')
        prefix = 'EMP';
    let lastNumber = 0;
    if (lastItem && lastItem[idField]) {
        const matches = lastItem[idField].match(/\d+/);
        lastNumber = matches ? parseInt(matches[0]) : 0;
    }
    return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
};
const createMaster = async (Model, idField, data, res) => {
    try {
        data[idField] = await generateId(Model, idField);
        const item = new Model(data);
        await item.save();
        res.status(201).json({ message: 'Created successfully', data: item });
    }
    catch (error) {
        console.error(`Create error:`, error);
        res.status(500).json({ message: 'Error creating item', error: error.message });
    }
};
const getAllMaster = async (Model, res, populateFields) => {
    try {
        let query = Model.find({ status: 'active' });
        if (populateFields) {
            query = query.populate(populateFields);
        }
        const items = await query.sort({ createdAt: -1 });
        res.json({ data: items, count: items.length });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching items', error: error.message });
    }
};
const getMasterById = async (Model, id, res, populateFields) => {
    try {
        let query = Model.findById(id);
        if (populateFields) {
            query = query.populate(populateFields);
        }
        const item = await query;
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ data: item });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching item', error: error.message });
    }
};
const updateMaster = async (Model, id, data, res, populateFields) => {
    try {
        let query = Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (populateFields) {
            query = query.populate(populateFields);
        }
        const item = await query;
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Updated successfully', data: item });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating item', error: error.message });
    }
};
const deleteMaster = async (Model, id, res) => {
    try {
        const item = await Model.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
};
// ✅ PAYMENT TYPE CONTROLLERS - WITH DUPLICATE VALIDATION
const createPaymentType = async (req, res) => {
    try {
        const { paymentType } = req.body;
        // ✅ Check if payment type already exists (case-insensitive)
        const existingPaymentType = await PaymentType_1.default.findOne({
            paymentType: { $regex: new RegExp(`^${paymentType.trim()}$`, 'i') },
            status: 'active'
        });
        if (existingPaymentType) {
            return res.status(400).json({
                success: false,
                message: `Payment type "${paymentType}" already exists!`
            });
        }
        // Generate ID and create
        req.body.paymentTypeId = await generateId(PaymentType_1.default, 'paymentTypeId');
        const item = new PaymentType_1.default(req.body);
        await item.save();
        res.status(201).json({
            success: true,
            message: 'Payment type created successfully',
            data: item
        });
    }
    catch (error) {
        console.error('Create payment type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment type',
            error: error.message
        });
    }
};
exports.createPaymentType = createPaymentType;
const getAllPaymentTypes = (req, res) => getAllMaster(PaymentType_1.default, res);
exports.getAllPaymentTypes = getAllPaymentTypes;
const getPaymentTypeById = (req, res) => getMasterById(PaymentType_1.default, String(req.params.id), res);
exports.getPaymentTypeById = getPaymentTypeById;
const updatePaymentType = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentType } = req.body;
        // ✅ Check if another payment type with same name exists (excluding current)
        const existingPaymentType = await PaymentType_1.default.findOne({
            paymentType: { $regex: `^${paymentType.trim()}$`, $options: 'i' },
            status: 'active'
        });
        if (existingPaymentType) {
            return res.status(400).json({
                success: false,
                message: `Payment type "${paymentType}" already exists!`
            });
        }
        const item = await PaymentType_1.default.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        res.json({
            success: true,
            message: 'Payment type updated successfully',
            data: item
        });
    }
    catch (error) {
        console.error('Update payment type error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment type',
            error: error.message
        });
    }
};
exports.updatePaymentType = updatePaymentType;
const deletePaymentType = (req, res) => deleteMaster(PaymentType_1.default, String(req.params.id), res);
exports.deletePaymentType = deletePaymentType;
// Plan Category Controllers
const createPlanCategory = (req, res) => createMaster(PlanCategory_1.default, 'planCategoryId', req.body, res);
exports.createPlanCategory = createPlanCategory;
const getAllPlanCategories = (req, res) => getAllMaster(PlanCategory_1.default, res);
exports.getAllPlanCategories = getAllPlanCategories;
const getPlanCategoryById = (req, res) => getMasterById(PlanCategory_1.default, String(req.params.id), res);
exports.getPlanCategoryById = getPlanCategoryById;
const updatePlanCategory = (req, res) => updateMaster(PlanCategory_1.default, String(req.params.id), req.body, res);
exports.updatePlanCategory = updatePlanCategory;
const deletePlanCategory = (req, res) => deleteMaster(PlanCategory_1.default, String(req.params.id), res);
exports.deletePlanCategory = deletePlanCategory;
// Plan Controllers
const createPlan = (req, res) => createMaster(Plan_1.default, 'planId', req.body, res);
exports.createPlan = createPlan;
const getAllPlans = (req, res) => getAllMaster(Plan_1.default, res, 'category');
exports.getAllPlans = getAllPlans;
const getPlanById = (req, res) => getMasterById(Plan_1.default, String(req.params.id), res, 'category');
exports.getPlanById = getPlanById;
const updatePlan = (req, res) => updateMaster(Plan_1.default, String(req.params.id), req.body, res, 'category');
exports.updatePlan = updatePlan;
const deletePlan = (req, res) => deleteMaster(Plan_1.default, String(req.params.id), res);
exports.deletePlan = deletePlan;
// Tax Slab Controllers
const createTaxSlab = (req, res) => createMaster(TaxSlab_1.default, 'taxSlabId', req.body, res);
exports.createTaxSlab = createTaxSlab;
const getAllTaxSlabs = (req, res) => getAllMaster(TaxSlab_1.default, res);
exports.getAllTaxSlabs = getAllTaxSlabs;
const getTaxSlabById = (req, res) => getMasterById(TaxSlab_1.default, String(req.params.id), res);
exports.getTaxSlabById = getTaxSlabById;
const updateTaxSlab = (req, res) => updateMaster(TaxSlab_1.default, String(req.params.id), req.body, res);
exports.updateTaxSlab = updateTaxSlab;
const deleteTaxSlab = (req, res) => deleteMaster(TaxSlab_1.default, String(req.params.id), res);
exports.deleteTaxSlab = deleteTaxSlab;
// Shift Controllers
const createShift = (req, res) => createMaster(Shift_1.default, 'shiftId', req.body, res);
exports.createShift = createShift;
const getAllShifts = (req, res) => getAllMaster(Shift_1.default, res);
exports.getAllShifts = getAllShifts;
const getShiftById = (req, res) => getMasterById(Shift_1.default, String(req.params.id), res);
exports.getShiftById = getShiftById;
const updateShift = (req, res) => updateMaster(Shift_1.default, String(req.params.id), req.body, res);
exports.updateShift = updateShift;
const deleteShift = (req, res) => deleteMaster(Shift_1.default, String(req.params.id), res);
exports.deleteShift = deleteShift;
// Designation Controllers
const createDesignation = (req, res) => createMaster(Designation_1.default, 'designationId', req.body, res);
exports.createDesignation = createDesignation;
const getAllDesignations = (req, res) => getAllMaster(Designation_1.default, res);
exports.getAllDesignations = getAllDesignations;
const getDesignationById = (req, res) => getMasterById(Designation_1.default, String(req.params.id), res);
exports.getDesignationById = getDesignationById;
const updateDesignation = (req, res) => updateMaster(Designation_1.default, String(req.params.id), req.body, res);
exports.updateDesignation = updateDesignation;
const deleteDesignation = (req, res) => deleteMaster(Designation_1.default, String(req.params.id), res);
exports.deleteDesignation = deleteDesignation;
// Branch Controllers - UPDATED WITH LOCATION HANDLING
const createBranch = async (req, res) => {
    try {
        const { latitude, longitude, ...otherData } = req.body;
        // Generate branch ID
        otherData.branchId = await generateId(Branch_1.default, 'branchId');
        // Convert latitude/longitude to GeoJSON format if provided
        if (latitude && longitude) {
            otherData.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON: [lng, lat]
            };
        }
        const branch = new Branch_1.default(otherData);
        await branch.save();
        res.status(201).json({ message: 'Branch created successfully', data: branch });
    }
    catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ message: 'Error creating branch', error: error.message });
    }
};
exports.createBranch = createBranch;
const getAllBranches = (req, res) => getAllMaster(Branch_1.default, res);
exports.getAllBranches = getAllBranches;
const getBranchById = (req, res) => getMasterById(Branch_1.default, String(req.params.id), res);
exports.getBranchById = getBranchById;
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, ...otherData } = req.body;
        // Convert latitude/longitude to GeoJSON format if provided
        if (latitude && longitude) {
            otherData.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            };
        }
        const branch = await Branch_1.default.findByIdAndUpdate(id, otherData, {
            new: true,
            runValidators: true,
        });
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        res.json({ message: 'Branch updated successfully', data: branch });
    }
    catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({ message: 'Error updating branch', error: error.message });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = (req, res) => deleteMaster(Branch_1.default, String(req.params.id), res);
exports.deleteBranch = deleteBranch;
// Employee Controllers - UPDATED TO USE ADMIN'S EMPLOYEE CODE
const createEmployee = async (req, res) => {
    try {
        // Auto-generate employeeCode if missing
        if (!req.body.employeeCode || req.body.employeeCode.trim() === '') {
            req.body.employeeCode = await generateId(Employee_1.default, 'employeeCode');
        }
        // Check if employee code already exists
        const existingEmployee = await Employee_1.default.findOne({
            employeeCode: req.body.employeeCode,
            status: 'active'
        });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee code already exists'
            });
        }
        // Auto-generate password if missing, otherwise hash the given one
        const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random number
        const rawPassword = req.body.password || generatedPassword;
        req.body.password = await bcryptjs_1.default.hash(rawPassword, 10);
        // Sanitize Empty Strings to prevent Mongoose CastError on ObjectIds
        ['designation', 'shift', 'branchId'].forEach(key => {
            if (req.body[key] === '') {
                delete req.body[key];
            }
        });
        if (req.body.branches && req.body.branches.length > 0) {
            req.body.branchId = req.body.branches[0];
        }
        const employee = new Employee_1.default(req.body);
        await employee.save();
        console.log(`\n================================`);
        console.log(`📧 DISPATCHING EMAIL TO USER`);
        console.log(`To: ${req.body.email}`);
        console.log(`================================\n`);
        const htmlMessage = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #6366f1;">Welcome to MuscleTime ERP!</h2>
        <p>Hello <strong>${req.body.name}</strong>,</p>
        <p>An account has been successfully created for you. Here are your login credentials:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0;"><strong>System URL:</strong> <a href="https://muscletime.net">https://muscletime.net</a></p>
          <p style="margin: 0 0 10px 0;"><strong>Employee Code / ID:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${req.body.employeeCode}</span></p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${rawPassword}</span></p>
        </div>
        <p><em>Please log in and change your password immediately.</em></p>
        <p>Best regards,<br/>MuscleTime Admin</p>
      </div>
    `;
        const emailSent = await (0, mailer_1.sendEmail)(req.body.email, 'Your MuscleTime ERP Account Credentials', htmlMessage);
        const populatedEmployee = await Employee_1.default.findById(employee._id)
            .populate('designation')
            .populate('branches')
            .populate('branchId')
            .populate('shift');
        const uiMessage = emailSent
            ? `User created successfully!\n\nCredentials have been securely EMAILED to ${req.body.email}. Keep them safe.\n\nEmployee Code: ${req.body.employeeCode}\nTemporary Password: ${rawPassword}`
            : `User created successfully!\n\nEmployee Code: ${req.body.employeeCode}\nTemporary Password: ${rawPassword}\n\n(⚠️ No SMTP configured in .env - Live email skipped)`;
        res.status(201).json({
            message: uiMessage,
            data: populatedEmployee
        });
    }
    catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};
exports.createEmployee = createEmployee;
const getAllEmployees = (req, res) => getAllMaster(Employee_1.default, res, 'designation branches branchId shift');
exports.getAllEmployees = getAllEmployees;
const getEmployeeById = (req, res) => getMasterById(Employee_1.default, String(req.params.id), res, 'designation branches branchId shift');
exports.getEmployeeById = getEmployeeById;
const updateEmployee = async (req, res) => {
    try {
        if (req.body.password) {
            req.body.password = await bcryptjs_1.default.hash(req.body.password, 10);
        }
        if (req.body.branches && req.body.branches.length > 0) {
            req.body.branchId = req.body.branches[0];
        }
        await updateMaster(Employee_1.default, String(req.params.id), req.body, res, 'designation branches branchId shift');
    }
    catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = (req, res) => deleteMaster(Employee_1.default, String(req.params.id), res);
exports.deleteEmployee = deleteEmployee;
const searchEmployees = async (req, res) => {
    try {
        const { query, branchId, designation, userType } = req.query;
        let filter = { status: 'active' };
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { employeeCode: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ];
        }
        if (branchId)
            filter.branches = branchId;
        if (designation)
            filter.designation = designation;
        if (userType)
            filter.userType = userType;
        const employees = await Employee_1.default.find(filter)
            .populate('designation')
            .populate('branches')
            .populate('shift')
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({ data: employees, count: employees.length });
    }
    catch (error) {
        res.status(500).json({ message: 'Error searching employees', error: error.message });
    }
};
exports.searchEmployees = searchEmployees;
