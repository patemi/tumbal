'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiChevronDown, FiEye } from 'react-icons/fi';
import { ordersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    user?: { full_name: string; email: string };
    items?: Array<{ product_name: string }>;
}

const statuses = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
    const { isAuthenticated, profile } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isAuthenticated || profile?.role !== 'admin') return;
        fetchOrders();
    }, [isAuthenticated, profile, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { limit: 50 };
            if (statusFilter) params.status = statusFilter;
            const { data } = await ordersAPI.getAllAdmin(params);
            setOrders(data.orders || []);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await ordersAPI.updateStatus(orderId, { status });
            toast.success('Status pesanan diperbarui');
            fetchOrders();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal mengupdate');
        }
    };

    if (!isAuthenticated || profile?.role !== 'admin') {
        return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-500">Akses ditolak</p></div>;
    }

    const filtered = search
        ? orders.filter(o => o.order_number.toLowerCase().includes(search.toLowerCase()) || o.user?.full_name?.toLowerCase().includes(search.toLowerCase()))
        : orders;

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Kelola Pesanan</h1>
                        <p className="text-gray-500 mt-1">{filtered.length} pesanan</p>
                    </div>
                    <Link href="/admin" className="text-sm text-violet-600 font-semibold hover:text-violet-700">← Dashboard</Link>
                </motion.div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari order number atau nama..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div className="relative">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer">
                            <option value="">Semua Status</option>
                            {statuses.filter(Boolean).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                            <p className="text-lg font-semibold">Tidak ada pesanan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order</th>
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pembayaran</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tanggal</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-900">{order.order_number}</td>
                                            <td className="p-4">
                                                <p className="font-medium text-gray-900">{order.user?.full_name || '-'}</p>
                                                <p className="text-xs text-gray-400">{order.user?.email || '-'}</p>
                                            </td>
                                            <td className="p-4">
                                                <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer ${getStatusColor(order.status)}`}>
                                                    {statuses.filter(Boolean).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${getStatusColor(order.payment_status)}`}>
                                                    {getStatusLabel(order.payment_status)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900">{formatPrice(order.total)}</td>
                                            <td className="p-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                                            <td className="p-4 text-right">
                                                <Link href={`/orders/${order.id}`} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg inline-block">
                                                    <FiEye size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
