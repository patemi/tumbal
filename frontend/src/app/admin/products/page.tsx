'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { productsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatPrice, PRODUCT_PLACEHOLDER } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    sold_count: number;
    is_active: boolean;
    is_featured: boolean;
    images?: Array<{ url: string; is_primary: boolean }>;
    category?: { name: string };
}

export default function AdminProductsPage() {
    const { isAuthenticated, profile } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isAuthenticated || profile?.role !== 'admin') return;
        fetchProducts();
    }, [isAuthenticated, profile]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await productsAPI.getAll({ limit: 100 });
            setProducts(data.products || []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Yakin ingin menghapus produk ini?')) return;
        try {
            await productsAPI.delete(id);
            toast.success('Produk berhasil dihapus');
            fetchProducts();
        } catch {
            toast.error('Gagal menghapus produk');
        }
    };

    if (!isAuthenticated || profile?.role !== 'admin') {
        return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-500">Akses ditolak</p></div>;
    }

    const filtered = search
        ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        : products;

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Kelola Produk</h1>
                        <p className="text-gray-500 mt-1">{filtered.length} produk</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-sm text-violet-600 font-semibold hover:text-violet-700">← Dashboard</Link>
                    </div>
                </motion.div>

                {/* Search */}
                <div className="relative mb-6">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-96 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>

                {/* Products Grid */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-gray-400">
                            <p className="text-lg font-semibold">Tidak ada produk</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produk</th>
                                        <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Kategori</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Harga</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stok</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Terjual</th>
                                        <th className="text-center p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="text-right p-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(product => {
                                        const img = product.images?.find(i => i.is_primary) || product.images?.[0];
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <Image src={img?.url || PRODUCT_PLACEHOLDER} alt={product.name} fill className="object-cover" sizes="48px" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                                                            {product.is_featured && <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-semibold">Featured</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600">{product.category?.name || '-'}</td>
                                                <td className="p-4 text-right font-semibold">{formatPrice(product.price)}</td>
                                                <td className="p-4 text-right">
                                                    <span className={product.stock < 10 ? 'text-red-600 font-bold' : 'text-gray-600'}>{product.stock}</span>
                                                </td>
                                                <td className="p-4 text-right text-gray-600">{product.sold_count}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${product.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/products/${product.slug}`} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"><FiEye size={15} /></Link>
                                                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
