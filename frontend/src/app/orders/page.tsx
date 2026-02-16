'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { ordersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

interface OrderItem {
    id: string;
    product_name: string;
    product_image: string | null;
    price: number;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    items: OrderItem[];
}

export default function OrdersPage() {
    const { isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchOrders();
    }, [isAuthenticated, activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {};
            if (activeTab) params.status = activeTab;
            const { data } = await ordersAPI.getAll(params);
            setOrders(data.orders || []);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-xl font-bold mb-3">Silakan Login</h2>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">
                        Masuk
                    </Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { value: '', label: 'Semua' },
        { value: 'pending', label: 'Menunggu' },
        { value: 'processing', label: 'Diproses' },
        { value: 'shipped', label: 'Dikirim' },
        { value: 'delivered', label: 'Selesai' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-gray-900 mb-8">
                    Pesanan Saya
                </motion.h1>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.value
                                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                                <div className="h-5 bg-gray-100 rounded-full w-1/4 mb-4" />
                                <div className="h-4 bg-gray-100 rounded-full w-1/2 mb-2" />
                                <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <FiPackage size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Belum Ada Pesanan</h3>
                        <p className="text-gray-500 mb-6">Yuk mulai belanja!</p>
                        <Link href="/products" className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/orders/${order.id}`} className="block bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 p-6 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                        <FiChevronRight className="text-gray-400" size={18} />
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                        <FiCalendar size={14} />
                                        {formatDate(order.created_at)}
                                    </div>

                                    {order.items && order.items.length > 0 && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            {order.items[0].product_name}
                                            {order.items.length > 1 && ` dan ${order.items.length - 1} produk lainnya`}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <span className="text-sm text-gray-500">Total</span>
                                        <span className="text-lg font-bold text-violet-600">{formatPrice(order.total)}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
