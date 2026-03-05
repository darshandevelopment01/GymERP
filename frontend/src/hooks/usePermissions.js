// src/hooks/usePermissions.js
// Reads the logged-in user from localStorage and exposes permission helpers.
// Admins always get full access. Employees get access based on their panelAccess settings.

export function usePermissions() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Treat stored 'Admin' or legacy 'admin' as admin
    const isAdmin = user.userType === 'Admin' || user.userType === 'admin';

    // panelAccess comes from the permissions object stored in localStorage after login
    const panelAccess = (user.permissions && user.permissions.panelAccess) || {};

    /**
     * Returns true if the current user can access the given panel permission key.
     * Admins always return true. Non-admins check their panelAccess object.
     * 
     * Special key 'masters' is admin-only and always returns false for non-admins.
     */
    const can = (key) => {
        if (key === 'masters') return isAdmin; // Masters is ALWAYS admin-only
        return isAdmin || !!panelAccess[key];
    };

    return {
        isAdmin,
        can,
        panelAccess,
        user,
    };
}
