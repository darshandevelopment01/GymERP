import React, { useState } from 'react';
import './MastersLayout.css';
import PaymentTypeMaster from './PaymentTypeMaster';
import PlanMaster from './PlanMaster';
import TaxSlabMaster from './TaxSlabMaster';
import ShiftMaster from './ShiftMaster';
import DesignationMaster from './DesignationMaster';
import BranchMaster from './BranchMaster';
import UserMaster from './UserMaster';

const MastersLayout = () => {
  const [activeTab, setActiveTab] = useState('user');

  const tabs = [
    { id: 'user', label: 'User Master', component: UserMaster },
    { id: 'branch', label: 'Branch Master', component: BranchMaster },
    { id: 'designation', label: 'Designation Master', component: DesignationMaster },
    { id: 'shift', label: 'Shift Master', component: ShiftMaster },
    { id: 'taxslab', label: 'Tax Slab Master', component: TaxSlabMaster },
    { id: 'plan', label: 'Plan Master', component: PlanMaster },
    { id: 'payment', label: 'Payment Type Master', component: PaymentTypeMaster },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="masters-layout">
      <div className="masters-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="masters-content">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default MastersLayout;
