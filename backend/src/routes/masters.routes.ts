import { Router } from 'express';
import * as mastersController from '../controllers/masters.controller';

const router = Router();

// Payment Type Routes
router.post('/payment-types', mastersController.createPaymentType);
router.get('/payment-types', mastersController.getAllPaymentTypes);
router.get('/payment-types/:id', mastersController.getPaymentTypeById);
router.put('/payment-types/:id', mastersController.updatePaymentType);
router.delete('/payment-types/:id', mastersController.deletePaymentType);

// Plan Category Routes
router.post('/plan-categories', mastersController.createPlanCategory);
router.get('/plan-categories', mastersController.getAllPlanCategories);
router.get('/plan-categories/:id', mastersController.getPlanCategoryById);
router.put('/plan-categories/:id', mastersController.updatePlanCategory);
router.delete('/plan-categories/:id', mastersController.deletePlanCategory);

// Plan Routes
router.post('/plans', mastersController.createPlan);
router.get('/plans', mastersController.getAllPlans);
router.get('/plans/:id', mastersController.getPlanById);
router.put('/plans/:id', mastersController.updatePlan);
router.delete('/plans/:id', mastersController.deletePlan);

// Tax Slab Routes
router.post('/tax-slabs', mastersController.createTaxSlab);
router.get('/tax-slabs', mastersController.getAllTaxSlabs);
router.get('/tax-slabs/:id', mastersController.getTaxSlabById);
router.put('/tax-slabs/:id', mastersController.updateTaxSlab);
router.delete('/tax-slabs/:id', mastersController.deleteTaxSlab);

// Shift Routes
router.post('/shifts', mastersController.createShift);
router.get('/shifts', mastersController.getAllShifts);
router.get('/shifts/:id', mastersController.getShiftById);
router.put('/shifts/:id', mastersController.updateShift);
router.delete('/shifts/:id', mastersController.deleteShift);

// Designation Routes
router.post('/designations', mastersController.createDesignation);
router.get('/designations', mastersController.getAllDesignations);
router.get('/designations/:id', mastersController.getDesignationById);
router.put('/designations/:id', mastersController.updateDesignation);
router.delete('/designations/:id', mastersController.deleteDesignation);

// Branch Routes
router.post('/branches', mastersController.createBranch);
router.get('/branches', mastersController.getAllBranches);
router.get('/branches/:id', mastersController.getBranchById);
router.put('/branches/:id', mastersController.updateBranch);
router.delete('/branches/:id', mastersController.deleteBranch);

// Employee Routes
router.get('/employees/search', mastersController.searchEmployees); // Must be before /:id
router.post('/employees', mastersController.createEmployee);
router.get('/employees', mastersController.getAllEmployees);
router.get('/employees/:id', mastersController.getEmployeeById);
router.put('/employees/:id', mastersController.updateEmployee);
router.delete('/employees/:id', mastersController.deleteEmployee);

export default router;
