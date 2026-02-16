'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { cartAPI, couponsAPI } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { formatPrice, PRODUCT_PLACEHOLDER } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { items, summary, setCart } = useCartStore();
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        fetchCart();
    }, [isAuthenticated]);

    const fetchCart = async () => {
        try {
            const { data } = await cartAPI.get();
            setCart(data.items, data.summary);
        } catch {
            toast.error('Gagal memuat keranjang');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id: string, newQty: number) => {
        if (newQty < 1) return;
        setUpdatingId(id);
        try {
            await cartAPI.update(id, newQty);
            await fetchCart();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal memperbarui');
        } finally {
            setUpdatingId(null);
        }
    };

    const removeItem = async (id: string) => {
        try {
            await cartAPI.remove(id);
            await fetchCart();
            toast.success('Item dihapus dari keranjang');
        } catch {
            toast.error('Gagal menghapus item');
        }
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        try {
            const { data } = await couponsAPI.validate(couponCode, summary.subtotal);
            setDiscount(data.discount);
            setAppliedCoupon(couponCode.toUpperCase());
            toast.success(`Kupon "${couponCode.toUpperCase()}" berhasil diterapkan!`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Kupon tidak valid');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Silakan Login</h2>
                    <p className="text-gray-500 mb-6">Login untuk melihat keranjang belanja kamu</p>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Keranjang Kosong</h2>
                    <p className="text-gray-500 mb-6">Yuk mulai belanja dan temukan produk favoritmu!</p>
                    <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">
                        <FiShoppingBag size={18} /> Mulai Belanja
                    </Link>
                </motion.div>
            </div>
        );
    }

    const finalTotal = summary.total - discount;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-gray-900 mb-8"
                >
                    Keranjang Belanja
                    <span className="text-lg font-normal text-gray-500 ml-3">({summary.item_count} item)</span>
                </motion.h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {items.map((item) => {
                                const primaryImage = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0];
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 flex gap-4"
                                    >
                                        {/* Image */}
                                        <Link href={`/products/${item.product?.slug}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                            <Image
                                                src={primaryImage?.url || PRODUCT_PLACEHOLDER}
                                                alt={item.product?.name || 'Product'}
                                                fill
                                                className="object-cover"
                                                sizes="120px"
                                            />
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/products/${item.product?.slug}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-violet-600 transition-colors line-clamp-2">
                                                {item.product?.name}
                                            </Link>
                                            {item.variant && (
                                                <p className="text-xs text-gray-500 mt-1">Varian: {item.variant.name}</p>
                                            )}
                                            <p className="text-lg font-bold text-violet-600 mt-2">{formatPrice(item.price)}</p>

                                            <div className="flex items-center justify-between mt-3">
                                                {/* Quantity */}
                                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={updatingId === item.id || item.quantity <= 1}
                                                        className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <FiMinus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold">
                                                        {updatingId === item.id ? '...' : item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={updatingId === item.id}
                                                        className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <FiPlus size={14} />
                                                    </button>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Ringkasan Belanja</h3>

                            {/* Coupon */}
                            <div className="mb-6">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Kode kupon"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>
                                    <button
                                        onClick={applyCoupon}
                                        className="px-4 py-2.5 bg-violet-100 text-violet-600 font-semibold text-sm rounded-xl hover:bg-violet-200 transition-colors"
                                    >
                                        Pakai
                                    </button>
                                </div>
                                {appliedCoupon && (
                                    <p className="text-xs text-green-600 mt-2 font-semibold">✓ Kupon {appliedCoupon} diterapkan</p>
                                )}
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-semibold">{formatPrice(summary.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ongkir</span>
                                    <span className={`font-semibold ${summary.shipping === 0 ? 'text-green-600' : ''}`}>
                                        {summary.shipping === 0 ? 'GRATIS' : formatPrice(summary.shipping)}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Diskon</span>
                                        <span className="font-semibold">-{formatPrice(discount)}</span>
                                    </div>
                                )}
                                <hr className="border-gray-100" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-black text-violet-600">{formatPrice(finalTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Checkout <FiArrowRight size={18} />
                            </button>

                            <Link href="/products" className="block text-center mt-4 text-sm text-violet-600 font-semibold hover:text-violet-700">
                                Lanjut Belanja
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
