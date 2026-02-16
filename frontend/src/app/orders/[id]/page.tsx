'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiX } from 'react-icons/fi';
import { ordersAPI } from '@/lib/api';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
    id: string;
    product_name: string;
    product_image: string | null;
    variant_name: string | null;
    price: number;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    payment_method: string;
    subtotal: number;
    shipping_cost: number;
    discount: number;
    tax: number;
    total: number;
    shipping_address: {
        recipient_name: string;
        phone: string;
        street: string;
        city: string;
        province: string;
        postal_code: string;
    };
    tracking_number: string | null;
    notes: string | null;
    created_at: string;
    items: OrderItem[];
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await ordersAPI.getById(params.id as string);
                setOrder(data.order);
            } catch {
                toast.error('Pesanan tidak ditemukan');
                router.push('/orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [params.id, router]);

    const handleCancel = async () => {
        if (!order || !confirm('Yakin ingin membatalkan pesanan?')) return;
        try {
            await ordersAPI.cancel(order.id);
            toast.success('Pesanan berhasil dibatalkan');
            setOrder({ ...order, status: 'cancelled' });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal membatalkan');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 mb-6 transition-colors">
                    <FiArrowLeft size={16} /> Kembali ke Pesanan
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-xl font-black text-gray-900">{order.order_number}</h1>
                                <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
                            </div>
                            <span className={`px-3 py-1.5 text-sm font-semibold rounded-xl ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                            </span>
                        </div>

                        {order.tracking_number && (
                            <div className="bg-blue-50 rounded-xl p-3 text-sm">
                                <span className="font-semibold text-blue-700">📦 Resi:</span>{' '}
                                <span className="text-blue-600 font-mono">{order.tracking_number}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiPackage className="text-violet-600" /> Produk
                        </h3>
                        <div className="space-y-4">
                            {order.items?.map(item => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-gray-900">{item.product_name}</p>
                                        {item.variant_name && <p className="text-xs text-gray-500">Varian: {item.variant_name}</p>}
                                        <p className="text-sm text-gray-500 mt-1">{item.quantity}x {formatPrice(item.price)}</p>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900">{formatPrice(item.subtotal)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FiMapPin className="text-violet-600" /> Alamat Pengiriman
                        </h3>
                        <p className="text-sm font-semibold text-gray-700">{order.shipping_address.recipient_name}</p>
                        <p className="text-sm text-gray-500">{order.shipping_address.phone}</p>
                        <p className="text-sm text-gray-500">{order.shipping_address.street}</p>
                        <p className="text-sm text-gray-500">{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiCreditCard className="text-violet-600" /> Ringkasan Pembayaran
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Ongkir</span><span className={order.shipping_cost === 0 ? 'text-green-600' : ''}>{order.shipping_cost === 0 ? 'GRATIS' : formatPrice(order.shipping_cost)}</span></div>
                            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatPrice(order.discount)}</span></div>}
                            <div className="flex justify-between"><span className="text-gray-500">PPN (11%)</span><span>{formatPrice(order.tax)}</span></div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-black text-violet-600">{formatPrice(order.total)}</span></div>
                        </div>

                        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <span className="text-sm text-gray-600">Status Pembayaran</span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusColor(order.payment_status)}`}>
                                {getStatusLabel(order.payment_status)}
                            </span>
                        </div>
                    </div>

                    {/* Cancel */}
                    {['pending', 'confirmed'].includes(order.status) && (
                        <button onClick={handleCancel} className="w-full py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                            <FiX size={18} /> Batalkan Pesanan
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
