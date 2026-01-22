import React from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { paymentTypeAPI } from '../../services/mastersApi';

const PaymentTypeMaster = () => {
  const columns = [
    { label: 'ID', field: 'paymentTypeId' },
    { 
      label: 'Payment Type', 
      field: 'paymentType',
      icon: '💳'
    },
  ];

  const formFields = [
    {
      name: 'paymentType',
      label: 'Payment Type',
      type: 'text',
      required: true,
      placeholder: 'Enter payment type (e.g., Cash, UPI, Card)',
    },
  ];

  return (
    <GenericMaster
      title="Payment Type Master"
      apiService={paymentTypeAPI}
      columns={columns}
      formFields={formFields}
      searchPlaceholder="Search payment types..."
      icon="💳"
    />
  );
};

export default PaymentTypeMaster;
