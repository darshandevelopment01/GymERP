import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { planAPI, planCategoryAPI } from '../../services/mastersApi';


const PlanMaster = () => {
  const [activeSubTab, setActiveSubTab] = useState('categories');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCategories = async () => {
    try {
      const response = await planCategoryAPI.getAll();
      let cats = response.data || [];

      // Unwrap if the backend returned { data: [...], count: ... }
      if (cats && typeof cats === 'object' && cats.data && Array.isArray(cats.data)) {
        cats = cats.data;
      }
      if (!Array.isArray(cats)) cats = [];

      setCategoryOptions([
        { value: '', label: 'Select Category' },
        ...cats.map(cat => ({
          value: cat._id,
          label: cat.categoryName,
        })),
      ]);
    } catch (error) {
      console.error('Error fetching plan categories:', error);
      setCategoryOptions([{ value: '', label: 'Select Category' }]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refresh category options when switching back to plans tab
  useEffect(() => {
    if (activeSubTab === 'plans') {
      fetchCategories();
      setRefreshKey(prev => prev + 1);
    }
  }, [activeSubTab]);

  // ── Plan columns & fields ──
  const planColumns = [
    {
      label: 'Category',
      field: 'category',
      render: (item) => item.category?.categoryName || '-',
    },
    { label: 'Plan Name', field: 'planName', icon: '📋' },
    { label: 'Duration', field: 'duration' },
    { label: 'Price', field: 'price', render: (item) => `₹${item.price}` },
  ];

  const planFormFields = [
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: categoryOptions,
    },
    {
      name: 'planName',
      label: 'Plan Name',
      type: 'text',
      required: true,
      placeholder: 'Enter plan name (e.g., Basic Monthly)',
    },
    {
      name: 'duration',
      label: 'Duration',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Duration' },
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Two Monthly', label: 'Two Monthly' },
        { value: 'Quarterly', label: 'Quarterly' },
        { value: 'Four Monthly', label: 'Four Monthly' },
        { value: 'Six Monthly', label: 'Six Monthly' },
        { value: 'Yearly', label: 'Yearly' },
      ],
    },
    {
      name: 'price',
      label: 'Price (₹)',
      type: 'number',
      required: true,
      placeholder: 'Enter price',
    },
  ];

  // ── Plan Category columns & fields ──
  const categoryColumns = [
    { label: 'Category Name', field: 'categoryName', icon: '🏷️' },
  ];

  const categoryFormFields = [
    {
      name: 'categoryName',
      label: 'Category Name',
      type: 'text',
      required: true,
      placeholder: 'Enter category name (e.g., Gym, Yoga)',
    },
  ];

  return (
    <div>
      {/* Sub-tab Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
        marginTop: '1.25rem',
        marginBottom: '0.25rem',
      }}>
        <button
          onClick={() => setActiveSubTab('categories')}
          style={{
            padding: '0.7rem 2rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            background: activeSubTab === 'categories'
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : '#f1f5f9',
            color: activeSubTab === 'categories' ? 'white' : '#64748b',
            boxShadow: activeSubTab === 'categories' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          🏷️ Plan Category
        </button>
        <button
          onClick={() => setActiveSubTab('plans')}
          style={{
            padding: '0.7rem 2rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            background: activeSubTab === 'plans'
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : '#f1f5f9',
            color: activeSubTab === 'plans' ? 'white' : '#64748b',
            boxShadow: activeSubTab === 'plans' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          📋 Membership Plan
        </button>
      </div>

      {/* Render the active sub-tab */}
      {activeSubTab === 'plans' ? (
        <GenericMaster
          key="membership-plan-master"
          title="Membership Plan"
          apiService={planAPI}
          columns={planColumns}
          formFields={planFormFields}
          searchPlaceholder="Search plans..."
          icon="📋"
          refreshKey={refreshKey}
        />
      ) : (
        <GenericMaster
          key="plan-category-master"
          title="Plan Category Master"
          apiService={planCategoryAPI}
          columns={categoryColumns}
          formFields={categoryFormFields}
          searchPlaceholder="Search categories..."
          icon="🏷️"
        />
      )}
    </div>
  );
};


export default PlanMaster;
