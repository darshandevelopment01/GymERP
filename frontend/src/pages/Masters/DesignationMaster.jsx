import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { designationAPI } from '../../services/mastersApi';

const DesignationMaster = () => {
  const columns = [
    {
      label: 'Designation Name',
      field: 'designationName',
    },
    {
      label: 'Max Discount',
      field: 'maxDiscountPercentage',
      render: (item) => `${item.maxDiscountPercentage}%`
    },
  ];

  const formFields = [
    {
      name: 'designationName',
      label: 'Designation Name',
      type: 'text',
      required: true,
      placeholder: 'Enter designation (e.g., Manager, Trainer)',
    },
    {
      name: 'maxDiscountPercentage',
      label: 'Max Discount Percentage',
      type: 'number',
      required: true,
      placeholder: 'Enter max discount % (0-100)',
      min: 0,
      max: 100,
    },
  ];

  return (
    <GenericMaster
      title="Designation Master"
      apiService={designationAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search designations..."
      icon="👔"
    />
  );
};

export default DesignationMaster;
