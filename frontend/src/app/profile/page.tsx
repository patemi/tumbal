'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
    const { isAuthenticated, profile, updateProfile } = useAuthStore();
    const [form, setForm] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
    });
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <FiUser size={48} className="text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-3">Silakan Login</h2>
                    <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">Masuk</Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.updateProfile(form);
            updateProfile(form);
            toast.success('Profil berhasil diperbarui! ✨');
        } catch {
            toast.error('Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-2xl mx-auto px-4">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-gray-900 mb-8">
                    Profil Saya
                </motion.h1>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-500/30">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                            <p className="text-sm text-gray-500">{profile?.email}</p>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-violet-50 text-violet-600 text-xs font-semibold rounded-lg capitalize">
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="email" value={profile?.email || ''} disabled
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">No. Telepon</label>
                            <div className="relative">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+62 812 xxxx xxxx"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave size={18} /> Simpan Perubahan</>}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
