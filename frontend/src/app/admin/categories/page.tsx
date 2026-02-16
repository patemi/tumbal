'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import { categoriesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image_url: string | null;
    product_count?: number;
}

export default function AdminCategoriesPage() {
    const { isAuthenticated, profile } = useAuthStore();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '', image_url: '' });

    useEffect(() => {
        if (!isAuthenticated || profile?.role !== 'admin') return;
        fetchCategories();
    }, [isAuthenticated, profile]);

    const fetchCategories = async () => {
        try {
            const { data } = await categoriesAPI.getAll();
            setCategories(data.categories || []);
        } catch {
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await categoriesAPI.update(editingId, form);
                toast.success('Kategori diperbarui');
            } else {
                await categoriesAPI.create(form);
                toast.success('Kategori ditambahkan');
            }
            resetForm();
            fetchCategories();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return;
        try {
            await categoriesAPI.delete(id);
            toast.success('Kategori dihapus');
            fetchCategories();
        } catch {
            toast.error('Gagal menghapus');
        }
    };

    const editCategory = (cat: Category) => {
        setEditingId(cat.id);
        setForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '' });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ name: '', description: '', image_url: '' });
    };

    if (!isAuthenticated || profile?.role !== 'admin') {
        return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-500">Akses ditolak</p></div>;
    }

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Kelola Kategori</h1>
                        <p className="text-gray-500 mt-1">{categories.length} kategori</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-sm text-violet-600 font-semibold hover:text-violet-700">← Dashboard</Link>
                        <button onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm rounded-xl shadow-lg hover:scale-105 transition-all">
                            <FiPlus size={16} /> Tambah
                        </button>
                    </div>
                </motion.div>

                {/* Form */}
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Gambar</label>
                                <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={resetForm} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                                    {editingId ? 'Perbarui' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Categories List */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <FiFolder size={32} className="mx-auto mb-2" />
                            <p>Belum ada kategori</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {categories.map((cat, i) => (
                                <motion.div key={cat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">
                                            {cat.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{cat.name}</p>
                                            {cat.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{cat.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => editCategory(cat)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"><FiEdit2 size={15} /></button>
                                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
