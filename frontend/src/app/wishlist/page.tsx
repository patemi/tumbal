'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { wishlistAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

interface WishlistItem {
    id: string;
    product: {
        id: string; name: string; slug: string; price: number;
        compare_price: number | null; rating_avg: number; rating_count: number;
        sold_count: number; stock: number;
        images: Array<{ id: string; url: string; alt_text: string; is_primary: boolean }>;
    };
}

export default function WishlistPage() {
    const { isAuthenticated } = useAuthStore();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { setLoading(false); return; }
        wishlistAPI.get().then(r => setItems(r.data.items || [])).catch(() => { }).finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <FiHeart size={48} className="text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-3">Silakan Login</h2>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">Masuk</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-gray-900 mb-8">
                    Wishlist Saya
                </motion.h1>
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl border animate-pulse"><div className="aspect-square bg-gray-100" /><div className="p-4 space-y-3"><div className="h-4 bg-gray-100 rounded-full" /></div></div>)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <FiHeart size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Wishlist Kosong</h3>
                        <Link href="/products" className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl">Jelajahi Produk</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {items.map((item, i) => (
                            <div key={item.id} className="relative">
                                <ProductCard product={item.product} index={i} />
                                <button onClick={() => { wishlistAPI.remove(item.id); setItems(p => p.filter(x => x.id !== item.id)); }}
                                    className="absolute top-3 right-3 z-10 w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600">
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
