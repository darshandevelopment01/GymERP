import React, { useEffect } from 'react';
import enquiryApi from '../services/enquiryApi';
import memberApi from '../services/memberApi';
import followupApi from '../services/followupApi';
import planApi from '../services/planApi';
import { planCategoryAPI, employeeAPI } from '../services/mastersApi';

// Pre-fetches heavily used master data in the background and caches it
// in sessionStorage exactly as GenericMaster expects.
// This ensures tabs load in < 1 second on first click.
const DataPrefetcher = () => {
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Run silently in background, ignore failures
        const prefetch = async () => {
            try {
                // Enquiries
                enquiryApi.getAll().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_Enquiry_Master', JSON.stringify(data));
                }).catch(() => { });

                // Members (title="Member Management")
                memberApi.getAll().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_Member_Management', JSON.stringify(data));
                }).catch(() => { });

                // Follow-ups (title="Follow-ups Management")
                followupApi.getAll().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_Follow-ups_Management', JSON.stringify(data));
                }).catch(() => { });

                // Users (Employees) (title="User Master")
                employeeAPI.getAll().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_User_Master', JSON.stringify(data));
                }).catch(() => { });

                // Plan Categories (title="Plan Category Master")
                planCategoryAPI.getAll().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_Plan_Category_Master', JSON.stringify(data));
                }).catch(() => { });

                // Plans (title="Membership Plan")
                planApi.getAllPlans().then(res => {
                    const data = res.data || res;
                    localStorage.setItem('cache_Membership_Plan', JSON.stringify(data));
                }).catch(() => { });

            } catch (error) {
                // Silently fail, it's just an optimization
            }
        };

        // Run immediately without blocking paint
        prefetch();
    }, []);

    return null;
};

export default DataPrefetcher;
