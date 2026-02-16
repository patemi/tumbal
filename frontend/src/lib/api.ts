import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });
                    localStorage.setItem('access_token', data.session.access_token);
                    localStorage.setItem('refresh_token', data.session.refresh_token);
                    error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
                    return api(error.config);
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// ============ API Functions ============

// Auth
export const authAPI = {
    register: (data: { email: string; password: string; full_name: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data: Record<string, string>) => api.put('/auth/profile', data),
};

// Products
export const productsAPI = {
    getAll: (params?: Record<string, string | number>) =>
        api.get('/products', { params }),
    getFeatured: () => api.get('/products/featured'),
    getBestsellers: () => api.get('/products/bestsellers'),
    getBySlug: (slug: string) => api.get(`/products/${slug}`),
    create: (data: Record<string, unknown>) => api.post('/products', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
};

// Categories
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getBySlug: (slug: string) => api.get(`/categories/${slug}`),
    create: (data: Record<string, string>) => api.post('/categories', data),
    update: (id: string, data: Record<string, string>) => api.put(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`),
};

// Cart
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (data: { product_id: string; variant_id?: string; quantity?: number }) =>
        api.post('/cart', data),
    update: (id: string, quantity: number) => api.put(`/cart/${id}`, { quantity }),
    remove: (id: string) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart'),
};

// Orders
export const ordersAPI = {
    getAll: (params?: Record<string, string | number>) =>
        api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    create: (data: Record<string, unknown>) => api.post('/orders', data),
    cancel: (id: string) => api.put(`/orders/${id}/cancel`),
    // Admin
    getAllAdmin: (params?: Record<string, string | number>) =>
        api.get('/orders/admin/all', { params }),
    updateStatus: (id: string, data: Record<string, string>) =>
        api.put(`/orders/admin/${id}/status`, data),
    getStats: () => api.get('/orders/admin/stats'),
};

// Wishlist
export const wishlistAPI = {
    get: () => api.get('/wishlist'),
    toggle: (product_id: string) => api.post('/wishlist', { product_id }),
    remove: (id: string) => api.delete(`/wishlist/${id}`),
};

// Reviews
export const reviewsAPI = {
    getByProduct: (productId: string, params?: Record<string, string | number>) =>
        api.get(`/reviews/${productId}`, { params }),
    create: (data: Record<string, unknown>) => api.post('/reviews', data),
    delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Banners
export const bannersAPI = {
    getAll: () => api.get('/banners'),
};

// Coupons
export const couponsAPI = {
    validate: (code: string, subtotal: number) =>
        api.post('/coupons/validate', { code, subtotal }),
};
