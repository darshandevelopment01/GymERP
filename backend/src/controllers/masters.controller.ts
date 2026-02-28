import { Request, Response } from 'express';
import PaymentType from '../models/PaymentType';
import Plan from '../models/Plan';
import PlanCategory from '../models/PlanCategory';
import TaxSlab from '../models/TaxSlab';
import Shift from '../models/Shift';
import Designation from '../models/Designation';
import Branch from '../models/Branch';
import Employee from '../models/Employee';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/mailer';
import User from '../models/User';

// Generic CRUD helper functions
const generateId = async (Model: any, idField: string): Promise<string> => {
  const lastItem = await Model.findOne().sort({ [idField]: -1 });

  let prefix = '';
  if (idField === 'branchId') prefix = 'B';
  else if (idField === 'paymentTypeId') prefix = 'PT';
  else if (idField === 'planId') prefix = 'P';
  else if (idField === 'taxSlabId') prefix = 'T';
  else if (idField === 'shiftId') prefix = 'S';
  else if (idField === 'designationId') prefix = 'D';
  else if (idField === 'planCategoryId') prefix = 'PC';
  else if (idField === 'employeeCode') prefix = 'EMP';

  let lastNumber = 0;
  if (lastItem && lastItem[idField]) {
    const matches = lastItem[idField].match(/\d+/);
    lastNumber = matches ? parseInt(matches[0]) : 0;
  }

  return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
};


const createMaster = async (Model: any, idField: string, data: any, res: Response) => {
  try {
    data[idField] = await generateId(Model, idField);
    const item = new Model(data);
    await item.save();
    res.status(201).json({ message: 'Created successfully', data: item });
  } catch (error: any) {
    console.error(`Create error:`, error);
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
};


const getAllMaster = async (Model: any, res: Response, populateFields?: string) => {
  try {
    let query = Model.find({ status: 'active' });
    if (populateFields) {
      query = query.populate(populateFields);
    }
    const items = await query.sort({ createdAt: -1 });
    res.json({ data: items, count: items.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
};


const getMasterById = async (Model: any, id: string, res: Response, populateFields?: string) => {
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
};


const updateMaster = async (Model: any, id: string, data: any, res: Response, populateFields?: string) => {
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
};


const deleteMaster = async (Model: any, id: string, res: Response) => {
  try {
    const item = await Model.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};


// ✅ PAYMENT TYPE CONTROLLERS - WITH DUPLICATE VALIDATION
export const createPaymentType = async (req: Request, res: Response) => {
  try {
    const { paymentType } = req.body;

    // ✅ Check if payment type already exists (case-insensitive)
    const existingPaymentType = await PaymentType.findOne({
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
    req.body.paymentTypeId = await generateId(PaymentType, 'paymentTypeId');
    const item = new PaymentType(req.body);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Payment type created successfully',
      data: item
    });
  } catch (error: any) {
    console.error('Create payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment type',
      error: error.message
    });
  }
};


export const getAllPaymentTypes = (req: Request, res: Response) =>
  getAllMaster(PaymentType, res);


export const getPaymentTypeById = (req: Request, res: Response) =>
  getMasterById(PaymentType, String(req.params.id), res);


export const updatePaymentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentType } = req.body;

    // ✅ Check if another payment type with same name exists (excluding current)
    const existingPaymentType = await PaymentType.findOne({
      paymentType: { $regex: `^${paymentType.trim()}$`, $options: 'i' },
      status: 'active'
    });


    if (existingPaymentType) {
      return res.status(400).json({
        success: false,
        message: `Payment type "${paymentType}" already exists!`
      });
    }

    const item = await PaymentType.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (error: any) {
    console.error('Update payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment type',
      error: error.message
    });
  }
};


export const deletePaymentType = (req: Request, res: Response) =>
  deleteMaster(PaymentType, String(req.params.id), res);


// Plan Category Controllers
export const createPlanCategory = (req: Request, res: Response) =>
  createMaster(PlanCategory, 'planCategoryId', req.body, res);


export const getAllPlanCategories = (req: Request, res: Response) =>
  getAllMaster(PlanCategory, res);


export const getPlanCategoryById = (req: Request, res: Response) =>
  getMasterById(PlanCategory, String(req.params.id), res);


export const updatePlanCategory = (req: Request, res: Response) =>
  updateMaster(PlanCategory, String(req.params.id), req.body, res);


export const deletePlanCategory = (req: Request, res: Response) =>
  deleteMaster(PlanCategory, String(req.params.id), res);


// Plan Controllers
export const createPlan = (req: Request, res: Response) =>
  createMaster(Plan, 'planId', req.body, res);


export const getAllPlans = (req: Request, res: Response) =>
  getAllMaster(Plan, res, 'category');


export const getPlanById = (req: Request, res: Response) =>
  getMasterById(Plan, String(req.params.id), res, 'category');


export const updatePlan = (req: Request, res: Response) =>
  updateMaster(Plan, String(req.params.id), req.body, res, 'category');


export const deletePlan = (req: Request, res: Response) =>
  deleteMaster(Plan, String(req.params.id), res);


// Tax Slab Controllers
export const createTaxSlab = (req: Request, res: Response) =>
  createMaster(TaxSlab, 'taxSlabId', req.body, res);


export const getAllTaxSlabs = (req: Request, res: Response) =>
  getAllMaster(TaxSlab, res);


export const getTaxSlabById = (req: Request, res: Response) =>
  getMasterById(TaxSlab, String(req.params.id), res);


export const updateTaxSlab = (req: Request, res: Response) =>
  updateMaster(TaxSlab, String(req.params.id), req.body, res);


export const deleteTaxSlab = (req: Request, res: Response) =>
  deleteMaster(TaxSlab, String(req.params.id), res);


// Shift Controllers
export const createShift = (req: Request, res: Response) =>
  createMaster(Shift, 'shiftId', req.body, res);


export const getAllShifts = (req: Request, res: Response) =>
  getAllMaster(Shift, res);


export const getShiftById = (req: Request, res: Response) =>
  getMasterById(Shift, String(req.params.id), res);


export const updateShift = (req: Request, res: Response) =>
  updateMaster(Shift, String(req.params.id), req.body, res);


export const deleteShift = (req: Request, res: Response) =>
  deleteMaster(Shift, String(req.params.id), res);


// Designation Controllers
export const createDesignation = (req: Request, res: Response) =>
  createMaster(Designation, 'designationId', req.body, res);


export const getAllDesignations = (req: Request, res: Response) =>
  getAllMaster(Designation, res);


export const getDesignationById = (req: Request, res: Response) =>
  getMasterById(Designation, String(req.params.id), res);


export const updateDesignation = (req: Request, res: Response) =>
  updateMaster(Designation, String(req.params.id), req.body, res);


export const deleteDesignation = (req: Request, res: Response) =>
  deleteMaster(Designation, String(req.params.id), res);


// Branch Controllers - UPDATED WITH LOCATION HANDLING
export const createBranch = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, ...otherData } = req.body;

    // Generate branch ID
    otherData.branchId = await generateId(Branch, 'branchId');

    // Convert latitude/longitude to GeoJSON format if provided
    if (latitude && longitude) {
      otherData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON: [lng, lat]
      };
    }

    const branch = new Branch(otherData);
    await branch.save();

    res.status(201).json({ message: 'Branch created successfully', data: branch });
  } catch (error: any) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Error creating branch', error: error.message });
  }
};


export const getAllBranches = (req: Request, res: Response) =>
  getAllMaster(Branch, res);


export const getBranchById = (req: Request, res: Response) =>
  getMasterById(Branch, String(req.params.id), res);


export const updateBranch = async (req: Request, res: Response) => {
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

    const branch = await Branch.findByIdAndUpdate(id, otherData, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ message: 'Branch updated successfully', data: branch });
  } catch (error: any) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Error updating branch', error: error.message });
  }
};


export const deleteBranch = (req: Request, res: Response) =>
  deleteMaster(Branch, String(req.params.id), res);


// Employee Controllers - UPDATED TO USE ADMIN'S EMPLOYEE CODE
export const createEmployee = async (req: Request, res: Response) => {
  try {
    // Auto-generate employeeCode if missing
    if (!req.body.employeeCode || req.body.employeeCode.trim() === '') {
      req.body.employeeCode = await generateId(Employee, 'employeeCode');
    }

    // Check if employee code already exists
    const existingEmployee = await Employee.findOne({
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
    req.body.password = await bcrypt.hash(rawPassword, 10);

    // Sanitize Empty Strings to prevent Mongoose CastError on ObjectIds
    ['designation', 'shift', 'branchId'].forEach(key => {
      if (req.body[key] === '') {
        delete req.body[key];
      }
    });


    if (req.body.branches && req.body.branches.length > 0) {
      req.body.branchId = req.body.branches[0];
    }


    const employee = new Employee(req.body);
    await employee.save();

    // ✅ Create a corresponding User document for login
    let userRecord = await User.findOne({ email: req.body.email });
    if (!userRecord) {
      userRecord = new User({
        employeeCode: req.body.employeeCode,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: rawPassword, // User schema pre-save hook will hash this
        userType: req.body.userType === 'Admin' ? 'gym_owner' : 'user', // Map semantic roles
        isActive: true,
        designation: req.body.designation ? String(req.body.designation) : undefined,
        gymBranchId: req.body.branches && req.body.branches.length > 0 ? req.body.branches[0] : undefined,
        shiftId: req.body.shift ? String(req.body.shift) : undefined,
      });
      await userRecord.save();
    } else {
      // If user exists but is assigned as employee, update their access level
      userRecord.userType = req.body.userType === 'Admin' ? 'gym_owner' : 'user';
      userRecord.password = rawPassword;
      await userRecord.save();
    }

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

    const emailSent = await sendEmail(
      req.body.email,
      'Your MuscleTime ERP Account Credentials',
      htmlMessage
    );

    const populatedEmployee = await Employee.findById(employee._id)
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
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};


export const getAllEmployees = (req: Request, res: Response) =>
  getAllMaster(Employee, res, 'designation branches branchId shift');


export const getEmployeeById = (req: Request, res: Response) =>
  getMasterById(Employee, String(req.params.id), res, 'designation branches branchId shift');


export const updateEmployee = async (req: Request, res: Response) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }


    if (req.body.branches && req.body.branches.length > 0) {
      req.body.branchId = req.body.branches[0];
    }


    await updateMaster(Employee, String(req.params.id), req.body, res, 'designation branches branchId shift');
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
};


export const deleteEmployee = (req: Request, res: Response) =>
  deleteMaster(Employee, String(req.params.id), res);


export const searchEmployees = async (req: Request, res: Response) => {
  try {
    const { query, branchId, designation, userType } = req.query;

    let filter: any = { status: 'active' };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { employeeCode: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ];
    }

    if (branchId) filter.branches = branchId;
    if (designation) filter.designation = designation;
    if (userType) filter.userType = userType;

    const employees = await Employee.find(filter)
      .populate('designation')
      .populate('branches')
      .populate('shift')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ data: employees, count: employees.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error searching employees', error: error.message });
  }
};
