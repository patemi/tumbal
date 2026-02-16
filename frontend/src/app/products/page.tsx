'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown, FiSearch } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import { productsAPI, categoriesAPI } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    rating_avg: number;
    rating_count: number;
    sold_count: number;
    stock: number;
    brand?: string;
    images?: Array<{ id: string; url: string; alt_text: string; is_primary: boolean }>;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

const sortOptions = [
    { value: 'created_at-desc', label: 'Terbaru' },
    { value: 'price-asc', label: 'Harga Terendah' },
    { value: 'price-desc', label: 'Harga Tertinggi' },
    { value: 'sold_count-desc', label: 'Terlaris' },
    { value: 'rating_avg-desc', label: 'Rating Tertinggi' },
];

function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sortParam = searchParams.get('sort') || 'created_at';
    const orderParam = searchParams.get('order') || 'desc';
    const featured = searchParams.get('featured') || '';

    useEffect(() => {
        categoriesAPI.getAll().then(res => setCategories(res.data.categories || [])).catch(() => { });
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page,
                    limit: 12,
                    sort: sortParam,
                    order: orderParam,
                };
                if (category) params.category = category;
                if (search) params.search = search;
                if (featured) params.featured = featured;

                const { data } = await productsAPI.getAll(params);
                setProducts(data.products || []);
                setTotalPages(data.pagination?.totalPages || 1);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [page, category, search, sortParam, orderParam, featured]);

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        params.delete('page');
        router.push(`/products?${params.toString()}`);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-black text-gray-900 mb-2">
                        {search ? `Hasil pencarian "${search}"` : category ? `Kategori: ${categories.find(c => c.slug === category)?.name || category}` : featured ? 'Produk Unggulan' : 'Semua Produk'}
                    </h1>
                    <p className="text-gray-500">
                        {!loading && `Menampilkan ${products.length} produk`}
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4">Kategori</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => updateParams({ category: '' })}
                                    className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!category ? 'bg-violet-50 text-violet-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Semua Kategori
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => updateParams({ category: cat.slug })}
                                        className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${category === cat.slug ? 'bg-violet-50 text-violet-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Search within */}
                            <div className="mt-6">
                                <h3 className="font-bold text-gray-900 mb-3">Cari</h3>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Nama produk..."
                                        defaultValue={search}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateParams({ search: (e.target as HTMLInputElement).value });
                                            }
                                        }}
                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Sort & Filter Bar */}
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <button
                                onClick={() => setShowFilters(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-violet-300 transition-colors"
                            >
                                <FiFilter size={16} /> Filter
                            </button>

                            <div className="relative ml-auto">
                                <select
                                    value={`${sortParam}-${orderParam}`}
                                    onChange={(e) => {
                                        const [sort, order] = e.target.value.split('-');
                                        updateParams({ sort, order });
                                    }}
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer hover:border-violet-300 transition-colors"
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(category || search || featured) && (
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                {category && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-semibold rounded-lg">
                                        {categories.find(c => c.slug === category)?.name}
                                        <button onClick={() => updateParams({ category: '' })}><FiX size={12} /></button>
                                    </span>
                                )}
                                {search && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-semibold rounded-lg">
                                        &quot;{search}&quot;
                                        <button onClick={() => updateParams({ search: '' })}><FiX size={12} /></button>
                                    </span>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                                        <div className="aspect-square bg-gray-100" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                                            <div className="h-4 bg-gray-100 rounded-full" />
                                            <div className="h-5 bg-gray-100 rounded-full w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h3>
                                <p className="text-gray-500 mb-6">Coba ubah filter atau kata kunci pencarian</p>
                                <button
                                    onClick={() => router.push('/products')}
                                    className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                    {products.map((product, i) => (
                                        <ProductCard key={product.id} product={product} index={i} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                            Math.max(0, page - 3),
                                            Math.min(totalPages, page + 2)
                                        ).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    const params = new URLSearchParams(searchParams.toString());
                                                    params.set('page', p.toString());
                                                    router.push(`/products?${params.toString()}`);
                                                }}
                                                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${p === page
                                                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {showFilters && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowFilters(false)} />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 p-6 overflow-y-auto lg:hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Filter</h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                                <FiX size={20} />
                            </button>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-3">Kategori</h4>
                        <div className="space-y-2 mb-6">
                            <button onClick={() => { updateParams({ category: '' }); setShowFilters(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-xl text-sm ${!category ? 'bg-violet-50 text-violet-600 font-semibold' : 'text-gray-600'}`}
                            >
                                Semua
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { updateParams({ category: cat.slug }); setShowFilters(false); }}
                                    className={`block w-full text-left px-3 py-2 rounded-xl text-sm ${category === cat.slug ? 'bg-violet-50 text-violet-600 font-semibold' : 'text-gray-600'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
