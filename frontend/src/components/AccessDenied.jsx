// src/components/AccessDenied.jsx
import React from 'react';

/**
 * Shown when a non-admin user navigates to a page they don't have permission for.
 */
export default function AccessDenied({ pageName = 'this page' }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            textAlign: 'center',
            padding: '2rem',
            gap: '1rem',
        }}>
            <div style={{ fontSize: '4rem' }}>🔒</div>
            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a1a2e',
                margin: 0,
            }}>
                Access Denied
            </h2>
            <p style={{
                color: '#64748b',
                fontSize: '1rem',
                maxWidth: '360px',
                margin: 0,
                lineHeight: 1.6,
            }}>
                You don't have permission to access <strong>{pageName}</strong>.
                Please contact your administrator to request access.
            </p>
        </div>
    );
}
