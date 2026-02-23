// src/services/fetchWithAuth.js
// A global fetch wrapper that:
// 1. Attaches the Authorization header automatically
// 2. Only sets Content-Type for POST/PUT/PATCH - avoids CORS preflight on GET/DELETE
// 3. Detects 401 Unauthorized (expired token) and logs the user out + redirects to /login
// 4. Deduplicates identical concurrent GET requests to prevent network spam during cold-starts

function handleUnauthorized() {
    localStorage.removeItem('token');
    window.location.replace('/login');
}

const pendingRequests = new Map();

/**
 * Makes an authenticated fetch request.
 * @param {string} url - Full URL to fetch
 * @param {RequestInit & { signal?: AbortSignal }} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithAuth(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    const cacheKey = isGet ? url : null;

    // 1. If an identical GET request is currently flying, just wait for its result!
    if (cacheKey && pendingRequests.has(cacheKey)) {
        const cachedRes = await pendingRequests.get(cacheKey);
        // Return a fresh Response object reading from the shared memory buffer
        return new Response(cachedRes.buffer.slice(0), {
            status: cachedRes.status,
            statusText: cachedRes.statusText,
            headers: cachedRes.headers
        });
    }

    const headers = { ...(options.headers || {}) };
    const token = localStorage.getItem('token');

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // 2. Initiate the actual network request wrapped in a Promise
    const fetchPromise = (async () => {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Session expired. Please log in again.');
        }

        // Buffer the network stream into memory so multiple callers can safely parse it
        const buffer = await response.arrayBuffer();

        // We must artificially reconstruct headers because Response.headers is an iterator
        const headerObj = {};
        response.headers.forEach((val, key) => { headerObj[key] = val; });

        return {
            buffer,
            status: response.status,
            statusText: response.statusText,
            headers: headerObj
        };
    })();

    // 3. Track the promise so others can attach to it
    if (cacheKey) {
        pendingRequests.set(cacheKey, fetchPromise);
        // 4. Clean up once the packet arrives so future requests actually fetch fresh data
        fetchPromise.finally(() => {
            if (pendingRequests.get(cacheKey) === fetchPromise) {
                pendingRequests.delete(cacheKey);
            }
        });
    }

    const cachedRes = await fetchPromise;
    return new Response(cachedRes.buffer.slice(0), {
        status: cachedRes.status,
        statusText: cachedRes.statusText,
        headers: cachedRes.headers
    });
}

export default fetchWithAuth;
