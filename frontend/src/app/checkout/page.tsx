'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMapPin, FiCreditCard, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { ordersAPI } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, profile } = useAuthStore();
    const { summary, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [address, setAddress] = useState({
        recipient_name: profile?.full_name || '',
        phone: profile?.phone || '',
        street: '',
        city: '',
        province: '',
        postal_code: '',
    });

    const [paymentMethod, setPaymentMethod] = useState('transfer');
    const [notes, setNotes] = useState('');

    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    if (summary.item_count === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Keranjang Kosong</h2>
                    <p className="text-gray-500 mb-6">Tambahkan produk ke keranjang terlebih dahulu</p>
                    <Link href="/products" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">
                        Mulai Belanja
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!address.street || !address.city || !address.province || !address.phone || !address.recipient_name) {
            toast.error('Lengkapi alamat pengiriman');
            setStep(1);
            return;
        }

        setLoading(true);
        try {
            const { data } = await ordersAPI.create({
                shipping_address: address,
                payment_method: paymentMethod,
                notes,
            });

            clearCart();
            toast.success('Pesanan berhasil dibuat! 🎉');
            router.push(`/orders/${data.order.id}`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal membuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    const paymentMethods = [
        { id: 'transfer', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI' },
        { id: 'ewallet', label: 'E-Wallet', desc: 'GoPay, OVO, DANA, ShopeePay' },
        { id: 'cod', label: 'COD', desc: 'Bayar di tempat' },
    ];

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 mb-6 transition-colors">
                    <FiArrowLeft size={16} /> Kembali ke Keranjang
                </Link>

                <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

                {/* Steps */}
                <div className="flex items-center gap-4 mb-10">
                    {[
                        { num: 1, label: 'Alamat', icon: FiMapPin },
                        { num: 2, label: 'Pembayaran', icon: FiCreditCard },
                        { num: 3, label: 'Konfirmasi', icon: FiCheck },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-2 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.num ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step > s.num ? <FiCheck size={18} /> : s.num}
                            </div>
                            <span className={`hidden sm:block text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-violet-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Address */}
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FiMapPin className="text-violet-600" /> Alamat Pengiriman
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Penerima</label>
                                <input type="text" value={address.recipient_name} onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">No. Telepon</label>
                                <input type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Lengkap</label>
                                <textarea value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Kota</label>
                                <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Provinsi</label>
                                <input type="text" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Kode Pos</label>
                                <input type="text" value={address.postal_code} onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        </div>
                        <button onClick={() => setStep(2)} className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                            Lanjut ke Pembayaran
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FiCreditCard className="text-violet-600" /> Metode Pembayaran
                        </h2>
                        <div className="space-y-3">
                            {paymentMethods.map(pm => (
                                <button
                                    key={pm.id}
                                    onClick={() => setPaymentMethod(pm.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === pm.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === pm.id ? 'border-violet-500' : 'border-gray-300'
                                        }`}>
                                        {paymentMethod === pm.id && <div className="w-3 h-3 bg-violet-500 rounded-full" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 text-sm">{pm.label}</p>
                                        <p className="text-xs text-gray-500">{pm.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan (opsional)</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan untuk penjual..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setStep(1)} className="px-6 py-4 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                                Kembali
                            </button>
                            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                                Konfirmasi Pesanan
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FiCheck className="text-violet-600" /> Konfirmasi Pesanan
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">📍 Alamat Pengiriman</h4>
                                <p className="text-sm text-gray-600">{address.recipient_name} · {address.phone}</p>
                                <p className="text-sm text-gray-500">{address.street}, {address.city}, {address.province} {address.postal_code}</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">💳 Pembayaran</h4>
                                <p className="text-sm text-gray-600">{paymentMethods.find(p => p.id === paymentMethod)?.label}</p>
                            </div>

                            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Ringkasan</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal ({summary.item_count} item)</span>
                                        <span className="font-semibold">{formatPrice(summary.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Ongkir</span>
                                        <span className={`font-semibold ${summary.shipping === 0 ? 'text-green-600' : ''}`}>
                                            {summary.shipping === 0 ? 'GRATIS' : formatPrice(summary.shipping)}
                                        </span>
                                    </div>
                                    <hr className="border-violet-200" />
                                    <div className="flex justify-between text-base">
                                        <span className="font-bold">Total</span>
                                        <span className="font-black text-violet-600">{formatPrice(summary.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)} className="px-6 py-4 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                                Kembali
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Buat Pesanan'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
