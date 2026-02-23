// src/services/prefetcher.js
import branchApi from './branchApi';
import planApi from './planApi';
import memberApi from './memberApi';
import enquiryApi from './enquiryApi';
import followupApi from './followupApi';
import { taxSlabAPI, planCategoryAPI } from './mastersApi';

let hasPrefetched = false;

export const prefetchAllTabs = () => {
    // Only run this once per session
    if (hasPrefetched) return;

    // Check if user is logged in
    if (!localStorage.getItem('token')) return;

    hasPrefetched = true;

    // Use a 2-second delay so we don't hurt the initial Dashboard load speed
    setTimeout(async () => {
        try {
            // 1. Prefetch Global Masters (Branches, Plans, Tax Slabs, Plan Categories)
            try {
                if (!sessionStorage.getItem('cache_global_branches')) {
                    const r = await branchApi.getAll();
                    const d = Array.isArray(r) ? r : (r.data || []);
                    sessionStorage.setItem('cache_global_branches', JSON.stringify(d.filter(b => b.status === 'active')));
                }
            } catch (e) { }

            try {
                if (!sessionStorage.getItem('cache_global_plans')) {
                    const r = await planApi.getAll();
                    const d = r.data || [];
                    sessionStorage.setItem('cache_global_plans', JSON.stringify(d.filter(p => p.status === 'active')));
                }
            } catch (e) { }

            try {
                if (!sessionStorage.getItem('cache_global_taxSlabs')) {
                    const r = await taxSlabAPI.getAll();
                    const d = Array.isArray(r) ? r : (r.data || []);
                    sessionStorage.setItem('cache_global_taxSlabs', JSON.stringify(d.filter(s => s.status === 'active')));
                }
            } catch (e) { }

            try {
                if (!sessionStorage.getItem('cache_global_planCategories')) {
                    const r = await planCategoryAPI.getAll();
                    const d = Array.isArray(r) ? r : (r.data || []);
                    sessionStorage.setItem('cache_global_planCategories', JSON.stringify(d.filter(c => c.status === 'active')));
                }
            } catch (e) { }

            // 2. Prefetch Members & Member Stats
            try {
                if (!sessionStorage.getItem('cache_Members_Management')) {
                    const response = await memberApi.getAll();
                    const data = response.data || [];
                    sessionStorage.setItem('cache_Members_Management', JSON.stringify(data));

                    if (response.success && response.data) {
                        const newStats = {
                            total: data.length,
                            active: data.filter(m => m.status === 'active').length,
                            expired: data.filter(m => m.status === 'expired').length
                        };
                        sessionStorage.setItem('cache_member_stats', JSON.stringify(newStats));
                    }
                }
            } catch (e) { }

            // 3. Prefetch Enquiries & Enquiry Stats
            try {
                if (!sessionStorage.getItem('cache_Enquiry_Management')) {
                    const response = await enquiryApi.getAll();
                    const data = response.data || [];
                    sessionStorage.setItem('cache_Enquiry_Management', JSON.stringify(data));

                    const statsResponse = await enquiryApi.getStats();
                    if (statsResponse.success && statsResponse.data) {
                        sessionStorage.setItem('cache_enq_stats', JSON.stringify(statsResponse.data));
                    }
                }
            } catch (e) { }

            // 4. Prefetch Follow-ups
            try {
                if (!sessionStorage.getItem('cache_Follow-ups_Management')) {
                    const response = await followupApi.getAll();
                    if (response.success && response.data) {
                        const data = response.data;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const updatedData = data.map(followup => {
                            if (followup.followUpDate && followup.status === 'pending') {
                                const fd = new Date(followup.followUpDate);
                                fd.setHours(0, 0, 0, 0);
                                if (fd < today) return { ...followup, status: 'expired' };
                            }
                            return followup;
                        });

                        sessionStorage.setItem('cache_Follow-ups_Management', JSON.stringify(updatedData));

                        const newStats = {
                            total: updatedData.length,
                            pending: updatedData.filter(f => f.status === 'pending').length,
                            completed: updatedData.filter(f => f.status === 'completed').length,
                            expired: updatedData.filter(f => f.status === 'expired').length
                        };
                        sessionStorage.setItem('cache_followup_stats', JSON.stringify(newStats));
                    }
                }
            } catch (e) { }

        } catch (error) {
            console.log('Background prefetch completed with silent errors.');
        }
    }, 2000);
};
