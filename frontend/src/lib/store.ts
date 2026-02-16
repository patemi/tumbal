import { create } from 'zustand';

// ============ Auth Store ============
interface User {
    id: string;
    email: string;
}

interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
}

interface AuthState {
    user: User | null;
    profile: Profile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User, profile: Profile) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    updateProfile: (profile: Partial<Profile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    setAuth: (user, profile) =>
        set({ user, profile, isAuthenticated: true, isLoading: false }),
    clearAuth: () =>
        set({ user: null, profile: null, isAuthenticated: false, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    updateProfile: (updates) =>
        set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
}));

// ============ Cart Store ============
interface CartItem {
    id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    price: number;
    item_total: number;
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        compare_price: number | null;
        stock: number;
        images: Array<{ id: string; url: string; is_primary: boolean }>;
    };
    variant: { id: string; name: string; price: number; stock: number } | null;
}

interface CartSummary {
    subtotal: number;
    shipping: number;
    total: number;
    item_count: number;
}

interface CartState {
    items: CartItem[];
    summary: CartSummary;
    isOpen: boolean;
    setCart: (items: CartItem[], summary: CartSummary) => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
    items: [],
    summary: { subtotal: 0, shipping: 0, total: 0, item_count: 0 },
    isOpen: false,
    setCart: (items, summary) => set({ items, summary }),
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    openCart: () => set({ isOpen: true }),
    closeCart: () => set({ isOpen: false }),
    clearCart: () =>
        set({
            items: [],
            summary: { subtotal: 0, shipping: 0, total: 0, item_count: 0 },
        }),
}));

// ============ UI Store ============
interface UIState {
    isMobileMenuOpen: boolean;
    searchQuery: string;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    searchQuery: '',
    toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
