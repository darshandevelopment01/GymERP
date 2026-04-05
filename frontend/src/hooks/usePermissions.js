// src/hooks/usePermissions.js
// Reads the logged-in user from localStorage and exposes permission helpers.
// Admins always get full access. Employees get access based on their panelAccess settings.
import { useState, useEffect } from 'react';

function getPermissionsFromStorage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Treat stored 'Admin' or legacy 'admin' / 'gym_owner' as admin
    const isAdmin =
        user.userType === 'Admin' ||
        user.userType === 'admin' ||
        user.userType === 'gym_owner';

    // panelAccess comes from the permissions object stored in localStorage after login
    const panelAccess = (user.permissions && user.permissions.panelAccess) || {};

    return { isAdmin, panelAccess, user };
}

/**
 * Returns true if the current user can access the given panel permission key.
 * Admins always return true. Non-admins check their panelAccess object.
 *
 * Special key 'masters' is admin-only and always returns false for non-admins.
 *
 * Reactive: listens to localStorage changes so permissions update after
 * the App-level /auth/me sync completes without requiring a page reload.
 */
export function usePermissions() {
    const [state, setState] = useState(getPermissionsFromStorage);

    useEffect(() => {
        // Re-read permissions whenever localStorage is updated by the sync in App.jsx
        const handleStorageChange = () => {
            setState(getPermissionsFromStorage());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('permissions-synced', handleStorageChange);

        // Also poll once 1.5s after mount — App's fetch may have completed by then
        const timer = setTimeout(() => {
            setState(getPermissionsFromStorage());
        }, 1500);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('permissions-synced', handleStorageChange);
            clearTimeout(timer);
        };
    }, []);

    const { isAdmin, panelAccess, user } = state;

    const can = (key) => {
        if (key === 'masters') return isAdmin; // Masters is ALWAYS admin-only

        // If checking for a main tab view, automatically grant it if ANY sub-permission under that tab is checked.
        // This prevents the tab from being hidden or throwing Access Denied if an admin grants "Create" but forgot to grant "View".
        if (!isAdmin) {
            if (key === 'viewEnquiryTab') {
                return !!panelAccess.viewEnquiryTab || !!panelAccess.createEnquiry || !!panelAccess.convertToMember || !!panelAccess.viewOnlySelfCreatedEnquiry || !!panelAccess.noDiscountLimit;
            }
            if (key === 'viewFollowUpTab') {
                return (
                    !!panelAccess.viewEnquiryFollowUp ||
                    !!panelAccess.viewMemberFollowUp ||
                    !!panelAccess.createEnquiryFollowUp ||
                    !!panelAccess.createMemberFollowUp ||
                    !!panelAccess.editEnquiryFollowUp ||
                    !!panelAccess.editMemberFollowUp ||
                    !!panelAccess.viewOnlySelfCreatedEnquiryFollowUps ||
                    !!panelAccess.viewOnlySelfCreatedMemberFollowUps
                );
            }
            if (key === 'viewMembersTab') {
                return !!panelAccess.viewMembersTab || !!panelAccess.renewMember || !!panelAccess.activeMember || !!panelAccess.viewOnlySelfCreatedMembers;
            }
            if (key === 'viewAttendanceTab') {
                return !!panelAccess.viewAttendanceTab || !!panelAccess.viewEmployeeAttendance || !!panelAccess.viewMemberAttendance;
            }
            if (key === 'viewPlanMaster') {
                return (
                    !!panelAccess.viewPlanMaster ||
                    !!panelAccess.viewPlanCategory ||
                    !!panelAccess.viewMembershipPlan ||
                    !!panelAccess.createPlanCategory ||
                    !!panelAccess.editPlanCategory ||
                    !!panelAccess.deletePlanCategory ||
                    !!panelAccess.createMembershipPlan ||
                    !!panelAccess.editMembershipPlan ||
                    !!panelAccess.deleteMembershipPlan ||
                    !!panelAccess.viewDietPlan ||
                    !!panelAccess.createDietPlan ||
                    !!panelAccess.editDietPlan ||
                    !!panelAccess.deleteDietPlan ||
                    !!panelAccess.viewWorkoutPlan ||
                    !!panelAccess.createWorkoutPlan ||
                    !!panelAccess.editWorkoutPlan ||
                    !!panelAccess.deleteWorkoutPlan
                );
            }
        }

        return isAdmin || !!panelAccess[key];
    };

    return { isAdmin, can, panelAccess, user };
}
