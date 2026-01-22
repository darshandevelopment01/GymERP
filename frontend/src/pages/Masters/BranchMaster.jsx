import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { branchAPI } from '../../services/mastersApi';

const BranchMaster = () => {
  const columns = [
    { label: 'Branch ID', field: 'branchId' },
    { 
      label: 'Branch Name', 
      field: 'name',
      icon: '🏢'
    },
    { 
      label: 'Address', 
      field: 'address',
    },
    { 
      label: 'Mobile Number', 
      field: 'phone',
    },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Branch Name',
      type: 'text',
      required: true,
      placeholder: 'Enter branch name',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter full address',
    },
    {
      name: 'phone',
      label: 'Mobile Number',
      type: 'tel',
      required: true,
      placeholder: 'Enter mobile number',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      required: true,
      placeholder: 'Enter city',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      required: true,
      placeholder: 'Enter state',
    },
    {
      name: 'zipCode',
      label: 'Zip Code',
      type: 'text',
      required: true,
      placeholder: 'Enter zip code',
    },
    {
      name: 'radiusInMeters',
      label: 'Radius (Meters)',
      type: 'number',
      required: true,
      placeholder: 'Enter radius (e.g., 100)',
    },
  ];

  return (
    <GenericMaster
      title="Branch Master"
      apiService={branchAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search branches..."
      icon="🏢"
    />
  );
};

export default BranchMaster;
