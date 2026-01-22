const API_URL = 'http://localhost:3001/api/masters';

class MastersAPI {
  // Payment Types
  async createPaymentType(data) {
    const response = await fetch(`${API_URL}/payment-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create payment type');
    return response.json();
  }

  async getAllPaymentTypes() {
    const response = await fetch(`${API_URL}/payment-types`);
    if (!response.ok) throw new Error('Failed to fetch payment types');
    return response.json();
  }

  async updatePaymentType(id, data) {
    const response = await fetch(`${API_URL}/payment-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update payment type');
    return response.json();
  }

  async deletePaymentType(id) {
    const response = await fetch(`${API_URL}/payment-types/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete payment type');
    return response.json();
  }

  // Plans
  async createPlan(data) {
    const response = await fetch(`${API_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create plan');
    return response.json();
  }

  async getAllPlans() {
    const response = await fetch(`${API_URL}/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  }

  async updatePlan(id, data) {
    const response = await fetch(`${API_URL}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update plan');
    return response.json();
  }

  async deletePlan(id) {
    const response = await fetch(`${API_URL}/plans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete plan');
    return response.json();
  }

  // Tax Slabs
  async createTaxSlab(data) {
    const response = await fetch(`${API_URL}/tax-slabs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create tax slab');
    return response.json();
  }

  async getAllTaxSlabs() {
    const response = await fetch(`${API_URL}/tax-slabs`);
    if (!response.ok) throw new Error('Failed to fetch tax slabs');
    return response.json();
  }

  async updateTaxSlab(id, data) {
    const response = await fetch(`${API_URL}/tax-slabs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update tax slab');
    return response.json();
  }

  async deleteTaxSlab(id) {
    const response = await fetch(`${API_URL}/tax-slabs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete tax slab');
    return response.json();
  }

  // Shifts
  async createShift(data) {
    const response = await fetch(`${API_URL}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create shift');
    return response.json();
  }

  async getAllShifts() {
    const response = await fetch(`${API_URL}/shifts`);
    if (!response.ok) throw new Error('Failed to fetch shifts');
    return response.json();
  }

  async updateShift(id, data) {
    const response = await fetch(`${API_URL}/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update shift');
    return response.json();
  }

  async deleteShift(id) {
    const response = await fetch(`${API_URL}/shifts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete shift');
    return response.json();
  }

  // Designations
  async createDesignation(data) {
    const response = await fetch(`${API_URL}/designations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create designation');
    return response.json();
  }

  async getAllDesignations() {
    const response = await fetch(`${API_URL}/designations`);
    if (!response.ok) throw new Error('Failed to fetch designations');
    return response.json();
  }

  async updateDesignation(id, data) {
    const response = await fetch(`${API_URL}/designations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update designation');
    return response.json();
  }

  async deleteDesignation(id) {
    const response = await fetch(`${API_URL}/designations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete designation');
    return response.json();
  }

  // Branches
  async createBranch(data) {
    const response = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create branch');
    return response.json();
  }

  async getAllBranches() {
    const response = await fetch(`${API_URL}/branches`);
    if (!response.ok) throw new Error('Failed to fetch branches');
    return response.json();
  }

  async updateBranch(id, data) {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update branch');
    return response.json();
  }

  async deleteBranch(id) {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete branch');
    return response.json();
  }

  // Employees
  async createEmployee(data) {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
  }

  async getAllEmployees() {
    const response = await fetch(`${API_URL}/employees`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  }

  async updateEmployee(id, data) {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  }

  async deleteEmployee(id) {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  }

  async searchEmployees(query) {
    const params = new URLSearchParams(query);
    const response = await fetch(`${API_URL}/employees/search?${params}`);
    if (!response.ok) throw new Error('Failed to search employees');
    return response.json();
  }
}

const mastersAPI = new MastersAPI();

// ADD THESE EXPORTS AT THE END
export const paymentTypeAPI = {
  create: (data) => mastersAPI.createPaymentType(data),
  getAll: () => mastersAPI.getAllPaymentTypes(),
  update: (id, data) => mastersAPI.updatePaymentType(id, data),
  delete: (id) => mastersAPI.deletePaymentType(id),
};

export const planAPI = {
  create: (data) => mastersAPI.createPlan(data),
  getAll: () => mastersAPI.getAllPlans(),
  update: (id, data) => mastersAPI.updatePlan(id, data),
  delete: (id) => mastersAPI.deletePlan(id),
};

export const taxSlabAPI = {
  create: (data) => mastersAPI.createTaxSlab(data),
  getAll: () => mastersAPI.getAllTaxSlabs(),
  update: (id, data) => mastersAPI.updateTaxSlab(id, data),
  delete: (id) => mastersAPI.deleteTaxSlab(id),
};

export const shiftAPI = {
  create: (data) => mastersAPI.createShift(data),
  getAll: () => mastersAPI.getAllShifts(),
  update: (id, data) => mastersAPI.updateShift(id, data),
  delete: (id) => mastersAPI.deleteShift(id),
};

export const designationAPI = {
  create: (data) => mastersAPI.createDesignation(data),
  getAll: () => mastersAPI.getAllDesignations(),
  update: (id, data) => mastersAPI.updateDesignation(id, data),
  delete: (id) => mastersAPI.deleteDesignation(id),
};

export const branchAPI = {
  create: (data) => mastersAPI.createBranch(data),
  getAll: () => mastersAPI.getAllBranches(),
  update: (id, data) => mastersAPI.updateBranch(id, data),
  delete: (id) => mastersAPI.deleteBranch(id),
};

export const employeeAPI = {
  create: (data) => mastersAPI.createEmployee(data),
  getAll: () => mastersAPI.getAllEmployees(),
  update: (id, data) => mastersAPI.updateEmployee(id, data),
  delete: (id) => mastersAPI.deleteEmployee(id),
};

export default mastersAPI;
