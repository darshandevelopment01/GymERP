// src/services/fetchWithAuth.js
// A global fetch wrapper that:
// 1. Attaches the Authorization header automatically
// 2. Only sets Content-Type for POST/PUT/PATCH - avoids CORS preflight on GET/DELETE
// 3. Detects 401 Unauthorized (expired token) and logs the user out + redirects to /login

function handleUnauthorized() {
    localStorage.removeItem('token');
    // Use replace so browser Back button doesn't loop back
    window.location.replace('/login');
}

/**
 * Makes an authenticated fetch request.
 * @param {string} url - Full URL to fetch
 * @param {RequestInit & { signal?: AbortSignal }} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const method = (options.method || 'GET').toUpperCase();

    // Only set Content-Type for requests with a body.
    // Adding Content-Type on GET requests triggers a CORS preflight (OPTIONS)
    // which can fail if the backend doesn't explicitly allow it.
    const headers = { ...(options.headers || {}) };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Session expired. Please log in again.');
    }

    return response;
}

export default fetchWithAuth;
