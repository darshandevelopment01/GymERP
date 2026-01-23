import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { branchAPI } from '../../services/mastersApi';

const BranchMaster = () => {
  const columns = [
    { label: 'ID', field: 'branchId' },
    { 
      label: 'Branch Name', 
      field: 'name',
      icon: '🏢'
    },
    { label: 'City', field: 'city' },
    { label: 'Mobile', field: 'phone' },
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
      required: false,
      placeholder: 'Enter email address',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      required: false,
      placeholder: 'Enter city',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      required: false,
      placeholder: 'Enter state',
    },
    {
      name: 'zipCode',
      label: 'Zip Code',
      type: 'text',
      required: false,
      placeholder: 'Enter zip code',
    },
    {
      name: 'radiusInMeters',
      label: 'Radius (Meters)',
      type: 'number',
      required: true,
      placeholder: 'Enter radius (e.g., 100)',
    },
    // ✅ CHANGED: Display latitude from location.coordinates[1]
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      required: false,
      placeholder: 'Auto-filled or enter manually',
      step: 'any',
      displayValue: (item) => {
        if (item.location && item.location.coordinates && item.location.coordinates[1]) {
          return String(item.location.coordinates[1]);
        }
        return '-';
      }
    },
    // ✅ CHANGED: Display longitude from location.coordinates[0]
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      required: false,
      placeholder: 'Auto-filled or enter manually',
      step: 'any',
      displayValue: (item) => {
        if (item.location && item.location.coordinates && item.location.coordinates[0]) {
          return String(item.location.coordinates[0]);
        }
        return '-';
      }
    },
    {
      name: 'getLocation',
      label: 'Get Current Location',
      type: 'location-button',
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
