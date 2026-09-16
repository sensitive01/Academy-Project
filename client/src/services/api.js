import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const pendingMutations = new Set();

const createRequestKey = (method, url, payload) => {
    // FormData cannot be stringified easily, so we skip locking for it.
    if (payload instanceof FormData) return null;
    try {
        return `${method}:${url}:${JSON.stringify(payload || {})}`;
    } catch {
        return null;
    }
};

const withAntiSpam = (method, hasDataArgs) => {
    const original = api[method];
    api[method] = async function (...args) {
        const url = args[0];
        const payload = hasDataArgs ? args[1] : (args[1]?.data);
        const key = createRequestKey(method, url, payload);
        
        if (key && pendingMutations.has(key)) {
            console.warn(`[Anti-Spam] Suppressed duplicate ${method.toUpperCase()} request to ${url}`);
            // Return a never-resolving promise to silently stall the duplicate request.
            // The first request will resolve and update the UI/loading state correctly.
            return new Promise(() => {}); 
        }
        
        if (key) pendingMutations.add(key);
        try {
            return await original.apply(this, args);
        } finally {
            // Remove the lock immediately when the request finishes
            // This prevents blocking legitimate sequential requests (e.g. in a loop)
            if (key) pendingMutations.delete(key);
        }
    };
};

withAntiSpam('post', true);
withAntiSpam('put', true);
withAntiSpam('patch', true);
withAntiSpam('delete', false);

export default api;
