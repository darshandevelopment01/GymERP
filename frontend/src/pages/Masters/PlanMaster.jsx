import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { planAPI } from '../../services/mastersApi';


const PlanMaster = () => {
  const columns = [
    { label: 'ID', field: 'planId' },
    { 
      label: 'Plan Name', 
      field: 'planName',
      icon: '📋'
    },
    { label: 'Duration', field: 'duration' },
    { 
      label: 'Price', 
      field: 'price',
      render: (item) => `₹${item.price}`
    },
  ];


  const formFields = [
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
        { value: '', label: 'Select Duration' }, // ✅ Added default option
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Two Monthly', label: 'Two Monthly' }, // ✅ ADDED
        { value: 'Quarterly', label: 'Quarterly' },
        { value: 'Four Monthly', label: 'Four Monthly' }, // ✅ ADDED
        { value: 'Six Monthly', label: 'Six Monthly' }, // ✅ ADDED
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


  return (
    <GenericMaster
      title="Plan Master"
      apiService={planAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search plans..."
      icon="📋"
    />
  );
};


export default PlanMaster;
