import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { shiftAPI } from '../../services/mastersApi';

const ShiftMaster = () => {
  const columns = [
    {
      label: 'Shift Name',
      field: 'shiftName',
      icon: '🕐'
    },
    {
      label: 'Time',
      field: 'time',
      render: (item) => `${item.startTime} - ${item.endTime}`
    },
    {
      label: 'Half Day',
      field: 'halfDayHours',
      render: (item) => `${item.halfDayHours} hrs`
    },
    {
      label: 'Full Day',
      field: 'fullDayHours',
      render: (item) => `${item.fullDayHours} hrs`
    },
  ];

  const formFields = [
    {
      name: 'shiftName',
      label: 'Shift Name',
      type: 'text',
      required: true,
      placeholder: 'Enter shift name (e.g., Morning Shift)',
    },
    {
      name: 'startTime',
      label: 'Start Time',
      type: 'time',
      required: true,
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'time',
      required: true,
    },
    {
      name: 'halfDayHours',
      label: 'Half Day Hours',
      type: 'number',
      required: true,
      placeholder: 'Enter half day hours (e.g., 4)',
    },
    {
      name: 'fullDayHours',
      label: 'Full Day Hours',
      type: 'number',
      required: true,
      placeholder: 'Enter full day hours (e.g., 8)',
    },
  ];

  return (
    <GenericMaster
      title="Shift Master"
      apiService={shiftAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search shifts..."
      icon="🕐"
    />
  );
};

export default ShiftMaster;
