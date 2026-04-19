import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PaymentType from '../models/PaymentType';
import Plan from '../models/Plan';
import PlanCategory from '../models/PlanCategory';
import TaxSlab from '../models/TaxSlab';
import Shift from '../models/Shift';
import Designation from '../models/Designation';
import Branch from '../models/Branch';
import Employee from '../models/Employee';
import Offer from '../models/Offer';
import DietPlan from '../models/DietPlan';
import WorkoutPlan from '../models/WorkoutPlan';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/mailer';
import ActivityLog from '../models/ActivityLog';
import { getUserBranchFilter } from '../middleware/auth.middleware';

// Helper to capitalize first letter of each name part
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Log generic master activity
const logActivity = async (req: Request, action: string, targetType: string, targetId: any, targetName: string, details: string) => {
  try {
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || 'System';

    if (!userId) {
       console.warn(`Activity log skipped: No user ID in request for action ${action}`);
       return;
    }

    await ActivityLog.create({
      action,
      performedBy: userId,
      performedByName: userName,
      targetType,
      targetId,
      targetName,
      details
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};

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
  else if (idField === 'offerId') prefix = 'OFF';
  else if (idField === 'dietPlanId') prefix = 'DP';
  else if (idField === 'workoutPlanId') prefix = 'WP';

  let lastNumber = 0;
  if (lastItem && lastItem[idField]) {
    const matches = lastItem[idField].match(/\d+/);
    lastNumber = matches ? parseInt(matches[0]) : 0;
  }

  return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
};


const createMaster = async (Model: any, idField: string, data: any, res: Response, req: Request, targetType: string, actionName: string) => {
  try {
    data[idField] = await generateId(Model, idField);
    const item = new Model(data);
    await item.save();
    
    // Log activity
    await logActivity(
      req, 
      actionName, 
      targetType, 
      item._id, 
      item.name || item[idField] || 'New Item', 
      `Created new ${targetType}: ${item.name || item[idField]}`
    );

    res.status(201).json({ message: 'Created successfully', data: item });
  } catch (error: any) {
    console.error(`Create error:`, error);
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
};


const getAllMaster = async (Model: any, res: Response, populateFields?: string, selectFields?: string) => {
  try {
    let query = Model.find({ status: 'active' });
    if (populateFields) {
      query = query.populate(populateFields);
    }
    if (selectFields) {
      query = query.select(selectFields);
    }
    const items = await query.sort({ createdAt: -1 });
    res.json({ data: items, count: items.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
};


const getMasterById = async (Model: any, id: string, res: Response, populateFields?: string, selectFields?: string) => {
  try {
    let query = Model.findById(id);
    if (populateFields) {
      query = query.populate(populateFields);
    }
    if (selectFields) {
      query = query.select(selectFields);
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


const updateMaster = async (Model: any, id: string, data: any, res: Response, req: Request, targetType: string, actionName: string, populateFields?: string, selectFields?: string) => {
  try {
    let query = Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (populateFields) {
      query = query.populate(populateFields);
    }
    if (selectFields) {
      query = query.select(selectFields);
    }
    const item = await query;
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Log activity
    await logActivity(
      req, 
      actionName, 
      targetType, 
      item._id, 
      item.name || item.paymentType || item.designationName || item.shiftName || item.planName || id, 
      `Updated ${targetType}: ${item.name || item.paymentType || item.designationName || item.shiftName || item.planName || id}`
    );

    res.json({ message: 'Updated successfully', data: item });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
};


const deleteMaster = async (Model: any, id: string, res: Response, req: Request, targetType: string, actionName: string) => {
  try {
    const item = await Model.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Log activity
    await logActivity(
      req, 
      actionName, 
      targetType, 
      item._id, 
      item.name || item.paymentType || item.designationName || item.shiftName || item.planName || id, 
      `Deleted ${targetType}: ${item.name || item.paymentType || item.designationName || item.shiftName || item.planName || id}`
    );

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
    const existingPaymentType = await (PaymentType as any).findOne({
      paymentType: { $regex: new RegExp(`^${paymentType.trim()}$`, 'i') },
      status: 'active',
      _id: { $ne: new mongoose.Types.ObjectId(id as string) }
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

    // Log activity
    await logActivity(
      req,
      'payment_type_updated',
      'PaymentType',
      item._id,
      item.paymentType,
      `Updated payment type: ${item.paymentType}`
    );

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
  deleteMaster(PaymentType, String(req.params.id), res, req, 'PaymentType', 'payment_type_deleted');


// Plan Category Controllers
export const createPlanCategory = (req: Request, res: Response) =>
  createMaster(PlanCategory, 'planCategoryId', req.body, res, req, 'PlanCategory', 'plan_category_created');


export const getAllPlanCategories = (req: Request, res: Response) =>
  getAllMaster(PlanCategory, res);


export const getPlanCategoryById = (req: Request, res: Response) =>
  getMasterById(PlanCategory, String(req.params.id), res);


export const updatePlanCategory = (req: Request, res: Response) =>
  updateMaster(PlanCategory, String(req.params.id), req.body, res, req, 'PlanCategory', 'plan_category_updated');


export const deletePlanCategory = (req: Request, res: Response) =>
  deleteMaster(PlanCategory, String(req.params.id), res, req, 'PlanCategory', 'plan_category_deleted');


// Offer Controllers
export const createOffer = (req: Request, res: Response) =>
  createMaster(Offer, 'offerId', req.body, res, req, 'Offer', 'offer_created');


export const getAllOffers = async (req: Request, res: Response) => {
  try {
    const { includeExpired } = req.query;
    let filter: any = { status: 'active' };

    // If not includeExpired, filter by validTo >= today
    if (includeExpired !== 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.validTo = { $gte: today };
    }

    const items = await Offer.find(filter)
      .populate('planCategories')
      .sort({ createdAt: -1 });

    res.json({ data: items, count: items.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching offers', error: error.message });
  }
};


export const getOfferById = (req: Request, res: Response) =>
  getMasterById(Offer, String(req.params.id), res, 'planCategories');


export const updateOffer = (req: Request, res: Response) =>
  updateMaster(Offer, String(req.params.id), req.body, res, req, 'Offer', 'offer_updated', 'planCategories');


export const deleteOffer = (req: Request, res: Response) =>
  deleteMaster(Offer, String(req.params.id), res, req, 'Offer', 'offer_deleted');


// Plan Controllers
export const createPlan = (req: Request, res: Response) =>
  createMaster(Plan, 'planId', req.body, res, req, 'Plan', 'plan_created');


export const getAllPlans = (req: Request, res: Response) =>
  getAllMaster(Plan, res, 'category');


export const getPlanById = (req: Request, res: Response) =>
  getMasterById(Plan, String(req.params.id), res, 'category');


export const updatePlan = (req: Request, res: Response) =>
  updateMaster(Plan, String(req.params.id), req.body, res, req, 'Plan', 'plan_updated', 'category');


export const deletePlan = (req: Request, res: Response) =>
  deleteMaster(Plan, String(req.params.id), res, req, 'Plan', 'plan_deleted');


// Tax Slab Controllers
export const createTaxSlab = (req: Request, res: Response) =>
  createMaster(TaxSlab, 'taxSlabId', req.body, res, req, 'TaxSlab', 'tax_slab_created');


export const getAllTaxSlabs = (req: Request, res: Response) =>
  getAllMaster(TaxSlab, res);


export const getTaxSlabById = (req: Request, res: Response) =>
  getMasterById(TaxSlab, String(req.params.id), res);


export const updateTaxSlab = (req: Request, res: Response) =>
  updateMaster(TaxSlab, String(req.params.id), req.body, res, req, 'TaxSlab', 'tax_slab_updated');


export const deleteTaxSlab = (req: Request, res: Response) =>
  deleteMaster(TaxSlab, String(req.params.id), res, req, 'TaxSlab', 'tax_slab_deleted');


// Shift Controllers
export const createShift = (req: Request, res: Response) =>
  createMaster(Shift, 'shiftId', req.body, res, req, 'Shift', 'shift_created');


export const getAllShifts = (req: Request, res: Response) =>
  getAllMaster(Shift, res);


export const getShiftById = (req: Request, res: Response) =>
  getMasterById(Shift, String(req.params.id), res);


export const updateShift = (req: Request, res: Response) =>
  updateMaster(Shift, String(req.params.id), req.body, res, req, 'Shift', 'shift_updated');


export const deleteShift = (req: Request, res: Response) =>
  deleteMaster(Shift, String(req.params.id), res, req, 'Shift', 'shift_deleted');


// Designation Controllers
export const createDesignation = (req: Request, res: Response) =>
  createMaster(Designation, 'designationId', req.body, res, req, 'Designation', 'designation_created');


export const getAllDesignations = (req: Request, res: Response) =>
  getAllMaster(Designation, res);


export const getDesignationById = (req: Request, res: Response) =>
  getMasterById(Designation, String(req.params.id), res);


export const updateDesignation = (req: Request, res: Response) =>
  updateMaster(Designation, String(req.params.id), req.body, res, req, 'Designation', 'designation_updated');


export const deleteDesignation = (req: Request, res: Response) =>
  deleteMaster(Designation, String(req.params.id), res, req, 'Designation', 'designation_deleted');


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

    // Log activity
    await logActivity(
      req,
      'branch_created',
      'Branch',
      branch._id,
      branch.name,
      `Created new branch: ${branch.name}`
    );

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

    // Log activity
    await logActivity(
      req,
      'branch_updated',
      'Branch',
      branch._id,
      branch.name,
      `Updated branch: ${branch.name}`
    );

    res.json({ message: 'Branch updated successfully', data: branch });
  } catch (error: any) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Error updating branch', error: error.message });
  }
};


export const deleteBranch = (req: Request, res: Response) =>
  deleteMaster(Branch, String(req.params.id), res, req, 'Branch', 'branch_deleted');


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

    // Check for duplicate email
    const existingByEmail = await Employee.findOne({
      email: req.body.email.toLowerCase(),
      status: 'active'
    });
    if (existingByEmail) {
      return res.status(400).json({
        success: false,
        message: `A user with email "${req.body.email}" already exists!`
      });
    }

    // Check for duplicate phone
    const existingByPhone = await Employee.findOne({
      phone: req.body.phone,
      status: 'active'
    });
    if (existingByPhone) {
      return res.status(400).json({
        success: false,
        message: `A user with phone number "${req.body.phone}" already exists!`
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

    // Log activity
    await logActivity(
      req,
      'user_created',
      'Employee',
      employee._id,
      employee.name,
      `Created new user: ${employee.name} (Code: ${employee.employeeCode})`
    );

    console.log(`\n================================`);
    console.log(`📧 DISPATCHING EMAIL TO USER`);
    console.log(`To: ${req.body.email}`);
    console.log(`================================\n`);

    const htmlMessage = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #6366f1;">Welcome to Muscle Time Fitness!</h2>
        <p>Hello <strong>${toTitleCase(req.body.name)}</strong>,</p>
        <p>An account has been successfully created for you. Here are your login credentials:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0;"><strong>System URL:</strong> <a href="https://muscletime.net">https://muscletime.net</a></p>
          <p style="margin: 0 0 10px 0;"><strong>Email ID:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${req.body.email}</span></p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${rawPassword}</span></p>
        </div>
        <p><em>Please log in and change your password immediately.</em></p>
        <p>Best regards,<br/>Team Muscle Time Fitness</p>
      </div>
    `;

    // 📧 Send email (awaiting to ensure Vercel doesn't kill it)
    const emailSent = await sendEmail(
      req.body.email,
      'Your Muscle Time Fitness Account Credentials',
      htmlMessage
    );

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('designation')
      .populate('branches')
      .populate('branchId')
      .populate('shift');

    const messageContent = emailSent
      ? `User created successfully!\n\nCredentials have been securely EMAILED to ${req.body.email}. Keep them safe.\n\nEmail ID: ${req.body.email}\nTemporary Password: ${rawPassword}`
      : `User created successfully!\n\nEmail ID: ${req.body.email}\nTemporary Password: ${rawPassword}\n\n(⚠️ Email failed to send, check logs)`;

    res.status(201).json({
      message: messageContent,
      data: populatedEmployee
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};


export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const branchFilter = await getUserBranchFilter(req);
    const filter: any = { status: 'active' };
    
    // Apply branch scoping for non-admin users
    // Check both 'branches' (array) and 'branchId' (legacy single field)
    if (branchFilter.branch && branchFilter.branch.$in) {
      filter.$or = [
        { branches: branchFilter.branch },
        { branchId: branchFilter.branch }
      ];
    }

    const items = await Employee.find(filter)
      .populate('designation branches branchId shift')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ data: items, count: items.length });
  } catch (error: any) {
    console.error('getAllEmployees error:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};


export const getEmployeeById = (req: Request, res: Response) =>
  getMasterById(Employee, String(req.params.id), res, 'designation branches branchId shift', '-password');


export const updateEmployee = async (req: Request, res: Response) => {
  try {
    if (req.body.password) {
      // If password is provided and not empty, hash it
      req.body.password = await bcrypt.hash(req.body.password, 10);
    } else {
      // If password is empty or missing, delete it from req.body
      delete req.body.password;
    }

    if (req.body.branches && req.body.branches.length > 0) {
      req.body.branchId = req.body.branches[0];
    }

    if (req.body.permissions) {
      console.log('🔐 Permissions payload detected:', JSON.stringify(req.body.permissions, null, 2));
    }

    await updateMaster(Employee, String(req.params.id), req.body, res, req, 'Employee', 'user_updated', 'designation branches branchId shift', '-password');
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
};


export const deleteEmployee = (req: Request, res: Response) =>
  deleteMaster(Employee, String(req.params.id), res, req, 'Employee', 'user_deleted');


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

    // ✅ Branch scoping
    const branchFilter = await getUserBranchFilter(req);
    if (branchFilter.branch && branchFilter.branch.$in) {
      // If we already have a branchFilter from middleware (non-admin), 
      // it should override the query param branchId for security, 
      // or we could intersect them. Here we prioritize the restricted filter.
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { branches: branchFilter.branch },
          { branchId: branchFilter.branch }
        ]
      });
    } else if (branchId) {
      // If admin provides a specific branchId to filter by
      filter.$or = filter.$or || [];
      filter.$or.push({ branches: branchId });
      filter.$or.push({ branchId: branchId });
    }

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
    console.error('searchEmployees error:', error);
    res.status(500).json({ message: 'Error searching employees', error: error.message });
  }
};


// Diet Plan Controllers
export const createDietPlan = (req: Request, res: Response) =>
  createMaster(DietPlan, 'dietPlanId', req.body, res, req, 'DietPlan', 'diet_plan_created');


export const getAllDietPlans = (req: Request, res: Response) =>
  getAllMaster(DietPlan, res);


export const getDietPlanById = (req: Request, res: Response) =>
  getMasterById(DietPlan, String(req.params.id), res);


export const updateDietPlan = (req: Request, res: Response) =>
  updateMaster(DietPlan, String(req.params.id), req.body, res, req, 'DietPlan', 'diet_plan_updated');


export const deleteDietPlan = (req: Request, res: Response) =>
  deleteMaster(DietPlan, String(req.params.id), res, req, 'DietPlan', 'diet_plan_deleted');


// Workout Plan Controllers
export const createWorkoutPlan = (req: Request, res: Response) =>
  createMaster(WorkoutPlan, 'workoutPlanId', req.body, res, req, 'WorkoutPlan', 'workout_plan_created');


export const getAllWorkoutPlans = (req: Request, res: Response) =>
  getAllMaster(WorkoutPlan, res);


export const getWorkoutPlanById = (req: Request, res: Response) =>
  getMasterById(WorkoutPlan, String(req.params.id), res);


export const updateWorkoutPlan = (req: Request, res: Response) =>
  updateMaster(WorkoutPlan, String(req.params.id), req.body, res, req, 'WorkoutPlan', 'workout_plan_updated');


export const deleteWorkoutPlan = (req: Request, res: Response) =>
  deleteMaster(WorkoutPlan, String(req.params.id), res, req, 'WorkoutPlan', 'workout_plan_deleted');
