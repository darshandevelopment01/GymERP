import fetchWithAuth from './fetchWithAuth';

const BASE = `${import.meta.env.VITE_API_URL}/masters`;

class MastersAPI {
  // Payment Types
  async createPaymentType(data) {
    const response = await fetchWithAuth(`${BASE}/payment-types`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create payment type');
    return response.json();
  }

  async getAllPaymentTypes(options = {}) {
    const response = await fetchWithAuth(`${BASE}/payment-types`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch payment types');
    return response.json();
  }

  async updatePaymentType(id, data) {
    const response = await fetchWithAuth(`${BASE}/payment-types/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update payment type');
    return response.json();
  }

  async deletePaymentType(id) {
    const response = await fetchWithAuth(`${BASE}/payment-types/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete payment type');
    return response.json();
  }

  // Plan Categories
  async createPlanCategory(data) {
    const response = await fetchWithAuth(`${BASE}/plan-categories`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create plan category');
    return response.json();
  }

  async getAllPlanCategories(options = {}) {
    const response = await fetchWithAuth(`${BASE}/plan-categories`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch plan categories');
    return response.json();
  }

  async updatePlanCategory(id, data) {
    const response = await fetchWithAuth(`${BASE}/plan-categories/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update plan category');
    return response.json();
  }

  async deletePlanCategory(id) {
    const response = await fetchWithAuth(`${BASE}/plan-categories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete plan category');
    return response.json();
  }

  // Plans
  async createPlan(data) {
    const response = await fetchWithAuth(`${BASE}/plans`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create plan');
    return response.json();
  }

  async getAllPlans(options = {}) {
    const response = await fetchWithAuth(`${BASE}/plans`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  }

  async updatePlan(id, data) {
    const response = await fetchWithAuth(`${BASE}/plans/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update plan');
    return response.json();
  }

  async deletePlan(id) {
    const response = await fetchWithAuth(`${BASE}/plans/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete plan');
    return response.json();
  }

  // Tax Slabs
  async createTaxSlab(data) {
    const response = await fetchWithAuth(`${BASE}/tax-slabs`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create tax slab');
    return response.json();
  }

  async getAllTaxSlabs(options = {}) {
    const response = await fetchWithAuth(`${BASE}/tax-slabs`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch tax slabs');
    return response.json();
  }

  async updateTaxSlab(id, data) {
    const response = await fetchWithAuth(`${BASE}/tax-slabs/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update tax slab');
    return response.json();
  }

  async deleteTaxSlab(id) {
    const response = await fetchWithAuth(`${BASE}/tax-slabs/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete tax slab');
    return response.json();
  }

  // Shifts
  async createShift(data) {
    const response = await fetchWithAuth(`${BASE}/shifts`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create shift');
    return response.json();
  }

  async getAllShifts(options = {}) {
    const response = await fetchWithAuth(`${BASE}/shifts`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch shifts');
    return response.json();
  }

  async updateShift(id, data) {
    const response = await fetchWithAuth(`${BASE}/shifts/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update shift');
    return response.json();
  }

  async deleteShift(id) {
    const response = await fetchWithAuth(`${BASE}/shifts/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete shift');
    return response.json();
  }

  // Designations
  async createDesignation(data) {
    const response = await fetchWithAuth(`${BASE}/designations`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create designation');
    return response.json();
  }

  async getAllDesignations(options = {}) {
    const response = await fetchWithAuth(`${BASE}/designations`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch designations');
    return response.json();
  }

  async updateDesignation(id, data) {
    const response = await fetchWithAuth(`${BASE}/designations/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update designation');
    return response.json();
  }

  async deleteDesignation(id) {
    const response = await fetchWithAuth(`${BASE}/designations/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete designation');
    return response.json();
  }

  // Branches
  async createBranch(data) {
    const response = await fetchWithAuth(`${BASE}/branches`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create branch');
    return response.json();
  }

  async getAllBranches(options = {}) {
    const response = await fetchWithAuth(`${BASE}/branches`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch branches');
    return response.json();
  }

  async updateBranch(id, data) {
    const response = await fetchWithAuth(`${BASE}/branches/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update branch');
    return response.json();
  }

  async deleteBranch(id) {
    const response = await fetchWithAuth(`${BASE}/branches/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete branch');
    return response.json();
  }

  // Employees
  async createEmployee(data) {
    const response = await fetchWithAuth(`${BASE}/employees`, {
      method: 'POST', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
  }

  async getAllEmployees(options = {}) {
    const response = await fetchWithAuth(`${BASE}/employees`, { signal: options.signal });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  }

  async updateEmployee(id, data) {
    const response = await fetchWithAuth(`${BASE}/employees/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  }

  async deleteEmployee(id) {
    const response = await fetchWithAuth(`${BASE}/employees/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  }

  async searchEmployees(query) {
    const params = new URLSearchParams(query);
    const response = await fetchWithAuth(`${BASE}/employees/search?${params}`);
    if (!response.ok) throw new Error('Failed to search employees');
    return response.json();
  }
}

const mastersAPI = new MastersAPI();

export const paymentTypeAPI = {
  create: (data) => mastersAPI.createPaymentType(data),
  getAll: (options) => mastersAPI.getAllPaymentTypes(options),
  update: (id, data) => mastersAPI.updatePaymentType(id, data),
  delete: (id) => mastersAPI.deletePaymentType(id),
};

export const planCategoryAPI = {
  create: (data) => mastersAPI.createPlanCategory(data),
  getAll: (options) => mastersAPI.getAllPlanCategories(options),
  update: (id, data) => mastersAPI.updatePlanCategory(id, data),
  delete: (id) => mastersAPI.deletePlanCategory(id),
};

export const planAPI = {
  create: (data) => mastersAPI.createPlan(data),
  getAll: (options) => mastersAPI.getAllPlans(options),
  update: (id, data) => mastersAPI.updatePlan(id, data),
  delete: (id) => mastersAPI.deletePlan(id),
};

export const taxSlabAPI = {
  create: (data) => mastersAPI.createTaxSlab(data),
  getAll: (options) => mastersAPI.getAllTaxSlabs(options),
  update: (id, data) => mastersAPI.updateTaxSlab(id, data),
  delete: (id) => mastersAPI.deleteTaxSlab(id),
};

export const shiftAPI = {
  create: (data) => mastersAPI.createShift(data),
  getAll: (options) => mastersAPI.getAllShifts(options),
  update: (id, data) => mastersAPI.updateShift(id, data),
  delete: (id) => mastersAPI.deleteShift(id),
};

export const designationAPI = {
  create: (data) => mastersAPI.createDesignation(data),
  getAll: (options) => mastersAPI.getAllDesignations(options),
  update: (id, data) => mastersAPI.updateDesignation(id, data),
  delete: (id) => mastersAPI.deleteDesignation(id),
};

export const branchAPI = {
  create: (data) => mastersAPI.createBranch(data),
  getAll: (options) => mastersAPI.getAllBranches(options),
  update: (id, data) => mastersAPI.updateBranch(id, data),
  delete: (id) => mastersAPI.deleteBranch(id),
};

export const employeeAPI = {
  create: (data) => mastersAPI.createEmployee(data),
  getAll: (options) => mastersAPI.getAllEmployees(options),
  update: (id, data) => mastersAPI.updateEmployee(id, data),
  delete: (id) => mastersAPI.deleteEmployee(id),
};

export default mastersAPI;
