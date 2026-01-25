import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { employeeAPI, designationAPI, shiftAPI, branchAPI } from '../../services/mastersApi';

const UserMaster = () => {
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [designationsRes, shiftsRes, branchesRes] = await Promise.all([
        designationAPI.getAll(),
        shiftAPI.getAll(),
        branchAPI.getAll()
      ]);

      setDesignations(designationsRes.data || []);
      setShifts(shiftsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { label: 'Employee', field: 'name' },
    { label: 'Code', field: 'employeeCode' },
    { label: 'Contact', field: 'phone' },
    { 
      label: 'Type', 
      field: 'userType',
      render: (item) => (
        <span style={{ 
          background: item.userType === 'Admin' ? '#e3f2fd' : '#f3e5f5',
          color: item.userType === 'Admin' ? '#1976d2' : '#7b1fa2',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem'
        }}>
          {item.userType}
        </span>
      )
    },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Name of Employee',
      type: 'text',
      required: true,
      placeholder: 'Enter full name',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: 'Enter phone number',
    },
    {
      name: 'email',
      label: 'Email ID',
      type: 'email',
      required: true,
      placeholder: 'Enter email',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Gender' }, // ✅ Added placeholder
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      name: 'joinDate',
      label: 'Date of Joining',
      type: 'date',
      required: false,
      placeholder: 'dd-mm-yyyy',
    },
    {
      name: 'employeeCode',
      label: 'Employee Code',
      type: 'text',
      required: true,
      disabled: false,
      placeholder: 'Enter employee code (e.g., EMP001)',
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Select Designation' }, // ✅ Single placeholder
        ...designations.map(d => ({ 
          value: d._id, 
          label: d.designationName
        }))
      ],
      displayValue: (item) => {
        if (!item.designation) return '-';
        return typeof item.designation === 'object' 
          ? item.designation.designationName 
          : designations.find(d => d._id === item.designation)?.designationName || item.designation;
      }
    },
    {
      name: 'shift',
      label: 'Shift Timing',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Select Shift Timing' }, // ✅ Single placeholder
        ...shifts.map(s => ({ 
          value: s._id, 
          label: `${s.shiftName} (${s.startTime} - ${s.endTime})`
        }))
      ],
      displayValue: (item) => {
        if (!item.shift) return '-';
        if (typeof item.shift === 'object') {
          return `${item.shift.shiftName} (${item.shift.startTime} - ${item.shift.endTime})`;
        }
        const shift = shifts.find(s => s._id === item.shift);
        return shift ? `${shift.shiftName} (${shift.startTime} - ${shift.endTime})` : item.shift;
      }
    },
    {
      name: 'userType',
      label: 'User Type',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select User Type' }, // ✅ Added placeholder
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
      ],
    },
    {
      name: 'branchId',
      label: 'Branch',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Branch' }, // ✅ Single placeholder
        ...branches.map(b => ({ 
          value: b._id, 
          label: b.name 
        }))
      ],
      displayValue: (item) => {
        if (!item.branchId) return '-';
        if (typeof item.branchId === 'object') {
          return item.branchId.name;
        }
        return branches.find(b => b._id === item.branchId)?.name || item.branchId;
      }
    },
  ];

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <GenericMaster
      title="User Master"
      apiService={employeeAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search users..."
      icon="👤"
    />
  );
};

export default UserMaster;