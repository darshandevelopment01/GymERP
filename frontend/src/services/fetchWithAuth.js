// src/services/fetchWithAuth.js
// A global fetch wrapper that:
// 1. Attaches the Authorization header automatically
// 2. Detects 401 Unauthorized (expired token) and logs the user out + redirects to /login

const API_URL = import.meta.env.VITE_API_URL;

function handleUnauthorized() {
    localStorage.removeItem('token');
    // Use replace so browser Back button doesn't loop back
    window.location.replace('/login');
}

/**
 * Makes an authenticated fetch request.
 * @param {string} url - The URL to fetch (relative path will be prefixed with API_URL)
 * @param {RequestInit & { signal?: AbortSignal }} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        handleUnauthorized();
        // Throw to stop further processing in the caller
        throw new Error('Session expired. Please log in again.');
    }

    return response;
}

export default fetchWithAuth;
export { API_URL };
