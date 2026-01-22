import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { designationAPI } from '../../services/mastersApi';

const DesignationMaster = () => {
  const columns = [
    { label: 'ID', field: 'designationId' },
    { 
      label: 'Designation Name', 
      field: 'designationName',
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
