'use client';

import { useEffect } from 'react';
import { useAuthStore, useCartStore } from '@/lib/store';
import { authAPI, cartAPI } from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setAuth, clearAuth, setLoading } = useAuthStore();
    const { setCart } = useCartStore();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await authAPI.getMe();
                setAuth(data.user, data.profile);

                // Load cart
                try {
                    const cartRes = await cartAPI.get();
                    setCart(cartRes.data.items, cartRes.data.summary);
                } catch {
                    // Cart may fail if not authenticated properly
                }
            } catch {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                clearAuth();
            }
        };

        initAuth();
    }, [setAuth, clearAuth, setLoading, setCart]);

    return <>{children}</>;
}
