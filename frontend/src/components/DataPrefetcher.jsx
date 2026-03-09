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
                    sessionStorage.setItem('cache_Enquiry_Master', JSON.stringify(data));
                }).catch(() => { });

                // Members
                memberApi.getAll().then(res => {
                    const data = res.data || res;
                    sessionStorage.setItem('cache_Member_Master', JSON.stringify(data));
                }).catch(() => { });

                // Follow-ups
                followupApi.getAll().then(res => {
                    const data = res.data || res;
                    sessionStorage.setItem('cache_Follow-up_Management', JSON.stringify(data));
                }).catch(() => { });

                // Users (Employees)
                employeeAPI.getAll().then(res => {
                    const data = res.data || res;
                    sessionStorage.setItem('cache_User_Master', JSON.stringify(data));
                }).catch(() => { });

                // Plan Categories
                planCategoryAPI.getAll().then(res => {
                    const data = res.data || res;
                    sessionStorage.setItem('cache_Plan_Category_Management', JSON.stringify(data));
                }).catch(() => { });

                // Plans
                planApi.getAllPlans().then(res => {
                    const data = res.data || res;
                    sessionStorage.setItem('cache_Membership_Plan', JSON.stringify(data));
                }).catch(() => { });

            } catch (error) {
                // Silently fail, it's just an optimization
            }
        };

        // Small delay so we don't block initial dashboard rendering
        const timer = setTimeout(prefetch, 2000);
        return () => clearTimeout(timer);
    }, []);

    return null;
};

export default DataPrefetcher;
