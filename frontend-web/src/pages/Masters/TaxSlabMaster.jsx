import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { taxSlabAPI } from '../../services/mastersApi';

const TaxSlabMaster = () => {
  const columns = [
    { label: 'ID', field: 'taxSlabId' },
    { 
      label: 'Tax Slab (%)', 
      field: 'taxPercentage',
      icon: '📊',
      render: (item) => `${item.taxPercentage}%`
    },
  ];

  const formFields = [
    {
      name: 'taxPercentage',
      label: 'Tax Percentage',
      type: 'number',
      required: true,
      placeholder: 'Enter tax percentage (e.g., 5, 12, 18)',
    },
  ];

  return (
    <GenericMaster
      title="Tax Slab Master"
      apiService={taxSlabAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search tax slabs..."
      icon="📊"
    />
  );
};

export default TaxSlabMaster;
