'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiPackage, FiShoppingCart, FiUsers, FiDollarSign,
    FiTrendingUp, FiBox, FiSettings, FiEye, FiEdit, FiChevronRight
} from 'react-icons/fi';
import { ordersAPI, productsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';

interface Stats {
    total_orders: number;
    pending_orders: number;
    total_revenue: number;
    total_products: number;
    total_users: number;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    user?: { full_name: string; email: string };
}

export default function AdminDashboard() {
    const { isAuthenticated, profile } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || profile?.role !== 'admin') return;
        fetchData();
    }, [isAuthenticated, profile]);

    const fetchData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                ordersAPI.getStats(),
                ordersAPI.getAllAdmin({ limit: 5 }),
            ]);
            setStats(statsRes.data.stats);
            setRecentOrders(ordersRes.data.orders || []);
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            await ordersAPI.updateStatus(orderId, { status });
            fetchData();
        } catch { }
    };

    if (!isAuthenticated || profile?.role !== 'admin') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Akses Ditolak</h2>
                    <p className="text-gray-500 mb-6">Halaman ini hanya untuk admin</p>
                    <Link href="/" className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl">
                        Kembali
                    </Link>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Pendapatan', value: stats ? formatPrice(stats.total_revenue) : '-', icon: FiDollarSign, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
        { label: 'Total Pesanan', value: stats?.total_orders || 0, icon: FiShoppingCart, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
        { label: 'Pesanan Pending', value: stats?.pending_orders || 0, icon: FiPackage, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
        { label: 'Total Produk', value: stats?.total_products || 0, icon: FiBox, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
        { label: 'Total Pelanggan', value: stats?.total_users || 0, icon: FiUsers, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
    ];

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Selamat datang, {profile?.full_name}! 👋</p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg ${stat.shadow} transition-all duration-300`}
                        >
                            <div className={`w-11 h-11 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? '...' : stat.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">Pesanan Terbaru</h2>
                            <Link href="/admin/orders" className="text-sm text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700">
                                Lihat Semua <FiChevronRight size={14} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse flex gap-4">
                                        <div className="h-12 bg-gray-100 rounded-xl flex-1" />
                                    </div>
                                ))}
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <FiPackage size={32} className="mx-auto mb-2" />
                                <p className="text-sm">Belum ada pesanan</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">{order.user?.full_name || 'Customer'} · {formatDate(order.created_at)}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                                                {order.status === 'pending' && (
                                                    <div className="flex gap-1 mt-1">
                                                        <button onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                                            className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold hover:bg-green-200">
                                                            Confirm
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h2>
                        <div className="space-y-3">
                            {[
                                { icon: FiBox, label: 'Kelola Produk', href: '/admin/products', color: 'text-violet-600 bg-violet-50' },
                                { icon: FiShoppingCart, label: 'Kelola Pesanan', href: '/admin/orders', color: 'text-blue-600 bg-blue-50' },
                                { icon: FiUsers, label: 'Pelanggan', href: '/admin/users', color: 'text-emerald-600 bg-emerald-50' },
                                { icon: FiTrendingUp, label: 'Laporan', href: '/admin/reports', color: 'text-amber-600 bg-amber-50' },
                                { icon: FiSettings, label: 'Pengaturan', href: '/admin/settings', color: 'text-gray-600 bg-gray-100' },
                            ].map(action => (
                                <Link key={action.label} href={action.href}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                                        <action.icon size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-violet-600 transition-colors">{action.label}</span>
                                    <FiChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-violet-400" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
