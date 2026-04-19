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

  const calculateHoursDifference = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diffInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffInMinutes < 0) {
      diffInMinutes += 24 * 60; // Handle overnight shifts
    }
    return Number((diffInMinutes / 60).toFixed(2));
  };

  const handleTimeChange = (value, formData, setFormData, fieldName) => {
    const newData = { ...formData, [fieldName]: value };
    if (newData.startTime && newData.endTime) {
      const fullDay = calculateHoursDifference(newData.startTime, newData.endTime);
      newData.fullDayHours = fullDay;
      newData.halfDayHours = Number((fullDay / 2).toFixed(2));
    }
    setFormData(newData);
  };

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
      onChange: (value, formData, setFormData) => handleTimeChange(value, formData, setFormData, 'startTime')
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'time',
      required: true,
      onChange: (value, formData, setFormData) => handleTimeChange(value, formData, setFormData, 'endTime')
    },
    {
      name: 'halfDayHours',
      label: 'Half Day Hours',
      type: 'number',
      required: true,
      placeholder: 'Enter half day hours (e.g., 4)',
      onChange: (value, formData, setFormData) => {
        let numVal = Number(value);
        const fullDay = formData.fullDayHours || 0;
        if (numVal > fullDay) {
          numVal = fullDay; // Cap to full day hours
        }
        setFormData({ ...formData, halfDayHours: value === '' ? '' : numVal });
      }
    },
    {
      name: 'fullDayHours',
      label: 'Full Day Hours',
      type: 'number',
      required: true,
      placeholder: 'Enter full day hours (e.g., 8)',
      onChange: (value, formData, setFormData) => {
        const numVal = Number(value);
        let halfDay = formData.halfDayHours || 0;
        if (halfDay > numVal) {
          halfDay = numVal; // Lower half-day to match the new lowered full-day
        }
        setFormData({ ...formData, fullDayHours: value === '' ? '' : numVal, halfDayHours: halfDay });
      }
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
