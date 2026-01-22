import { Request, Response } from 'express';
import PaymentType from '../models/PaymentType';
import Plan from '../models/Plan';
import TaxSlab from '../models/TaxSlab';
import Shift from '../models/Shift';
import Designation from '../models/Designation';
import Branch from '../models/Branch';
import Employee from '../models/Employee';
import bcrypt from 'bcryptjs';

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
  else if (idField === 'employeeCode') prefix = 'EMP';
  
  // FIX: Handle undefined or null values
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

// Payment Type Controllers
export const createPaymentType = (req: Request, res: Response) => 
  createMaster(PaymentType, 'paymentTypeId', req.body, res);

export const getAllPaymentTypes = (req: Request, res: Response) => 
  getAllMaster(PaymentType, res);

export const getPaymentTypeById = (req: Request, res: Response) => 
  getMasterById(PaymentType, String(req.params.id), res);

export const updatePaymentType = (req: Request, res: Response) => 
  updateMaster(PaymentType, String(req.params.id), req.body, res);

export const deletePaymentType = (req: Request, res: Response) => 
  deleteMaster(PaymentType, String(req.params.id), res);

// Plan Controllers
export const createPlan = (req: Request, res: Response) => 
  createMaster(Plan, 'planId', req.body, res);

export const getAllPlans = (req: Request, res: Response) => 
  getAllMaster(Plan, res);

export const getPlanById = (req: Request, res: Response) => 
  getMasterById(Plan, String(req.params.id), res);

export const updatePlan = (req: Request, res: Response) => 
  updateMaster(Plan, String(req.params.id), req.body, res);

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

// Branch Controllers
export const createBranch = (req: Request, res: Response) => 
  createMaster(Branch, 'branchId', req.body, res);

export const getAllBranches = (req: Request, res: Response) => 
  getAllMaster(Branch, res);

export const getBranchById = (req: Request, res: Response) => 
  getMasterById(Branch, String(req.params.id), res);

export const updateBranch = (req: Request, res: Response) => 
  updateMaster(Branch, String(req.params.id), req.body, res);

export const deleteBranch = (req: Request, res: Response) => 
  deleteMaster(Branch, String(req.params.id), res);

// Employee Controllers
export const createEmployee = async (req: Request, res: Response) => {
  try {
    req.body.employeeCode = await generateId(Employee, 'employeeCode');
    
    const defaultPassword = req.body.password || req.body.employeeCode;
    req.body.password = await bcrypt.hash(defaultPassword, 10);

    if (req.body.branches && req.body.branches.length > 0) {
      req.body.branchId = req.body.branches[0];
    }

    const employee = new Employee(req.body);
    await employee.save();
    
    const populatedEmployee = await Employee.findById(employee._id)
      .populate('designation')
      .populate('branches')
      .populate('branchId')
      .populate('shift');
    
    res.status(201).json({ message: 'Employee created successfully', data: populatedEmployee });
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
