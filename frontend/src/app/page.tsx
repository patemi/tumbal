'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones,
  FiZap, FiStar, FiTrendingUp
} from 'react-icons/fi';
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
  description: string;
  image_url: string | null;
}

const categoryIcons: Record<string, string> = {
  'elektronik': '📱',
  'fashion-pria': '👔',
  'fashion-wanita': '👗',
  'rumah-tangga': '🏠',
  'olahraga': '⚽',
  'makanan-minuman': '☕',
  'kesehatan': '💊',
  'buku-alat-tulis': '📚',
};

const features = [
  { icon: FiTruck, title: 'Free Ongkir', desc: 'Belanja min. Rp 100K', color: 'from-blue-500 to-cyan-400' },
  { icon: FiShield, title: '100% Original', desc: 'Garansi produk asli', color: 'from-emerald-500 to-teal-400' },
  { icon: FiRefreshCw, title: 'Easy Return', desc: 'Pengembalian 7 hari', color: 'from-amber-500 to-orange-400' },
  { icon: FiHeadphones, title: 'CS 24/7', desc: 'Siap membantu kamu', color: 'from-violet-500 to-purple-400' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, bestRes, catRes] = await Promise.allSettled([
          productsAPI.getFeatured(),
          productsAPI.getBestsellers(),
          categoriesAPI.getAll(),
        ]);

        if (featuredRes.status === 'fulfilled') setFeaturedProducts(featuredRes.value.data.products || []);
        if (bestRes.status === 'fulfilled') setBestSellers(bestRes.value.data.products || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-violet-200 border border-white/10 mb-6">
                <FiZap className="text-yellow-400" />
                Flash Sale Februari — Diskon hingga 70%!
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-6"
            >
              Belanja Lebih{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Smart
              </span>
              <br />
              di UhuyShop
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-violet-200/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Temukan ribuan produk berkualitas dengan harga terbaik. Gratis ongkir,
              pembayaran aman, dan pengiriman cepat ke seluruh Indonesia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-900 font-bold rounded-2xl shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Mulai Belanja
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products?featured=true"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Lihat Promo
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center gap-8 sm:gap-16 mt-16"
            >
              {[
                { value: '10K+', label: 'Produk' },
                { value: '50K+', label: 'Customer' },
                { value: '4.9', label: 'Rating', icon: <FiStar size={14} className="text-yellow-400 inline ml-1" /> },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {stat.value}
                    {stat.icon}
                  </div>
                  <div className="text-sm text-violet-300/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path d="M0 50L48 45.7C96 41.3 192 32.7 288 30.2C384 27.7 480 31.3 576 38.5C672 45.7 768 56.3 864 58.8C960 61.3 1056 55.7 1152 50C1248 44.3 1344 38.7 1392 35.8L1440 33V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-6 -mt-2 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                  <feature.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black text-gray-900 mb-3">Kategori Populer</h2>
            <p className="text-gray-500">Temukan produk favoritmu berdasarkan kategori</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-violet-200 shadow-sm hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {categoryIcons[cat.slug] || '📦'}
                  </div>
                  <span className="font-semibold text-sm text-gray-700 group-hover:text-violet-600 transition-colors text-center">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiZap className="text-violet-600" />
                <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Pilihan Terbaik</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">Produk Unggulan</h2>
            </div>
            <Link
              href="/products?featured=true"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-all"
            >
              Lihat Semua <FiArrowRight size={14} />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-4 bg-gray-100 rounded-full w-full" />
                    <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                    <div className="h-5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link href="/products?featured=true" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50">
              Lihat Semua <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PROMO BANNER ============ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 lg:p-10 text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">Promo Spesial</span>
                <h3 className="text-2xl lg:text-3xl font-black mb-3">Flash Sale<br />Februari 2026</h3>
                <p className="text-violet-200 text-sm mb-6">Diskon hingga 70% untuk produk elektronik pilihan</p>
                <Link href="/products?category=elektronik" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors">
                  Shop Now <FiArrowRight />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-3xl p-8 lg:p-10 text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">Kode Voucher</span>
                <h3 className="text-2xl lg:text-3xl font-black mb-3">Diskon 10%<br />Belanja Pertama</h3>
                <p className="text-pink-200 text-sm mb-6">Gunakan kode UHUY10 saat checkout</p>
                <div className="flex items-center gap-3">
                  <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 font-mono font-bold text-lg tracking-widest">
                    UHUY10
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ BEST SELLERS ============ */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-fuchsia-600" />
                <span className="text-sm font-semibold text-fuchsia-600 uppercase tracking-wider">Paling Laris</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">Best Seller</h2>
            </div>
            <Link
              href="/products?sort=sold_count&order=desc"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-fuchsia-600 border border-fuchsia-200 rounded-xl hover:bg-fuchsia-50 transition-all"
            >
              Lihat Semua <FiArrowRight size={14} />
            </Link>
          </motion.div>

          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {bestSellers.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-20 bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Siap Mulai Belanja?
            </h2>
            <p className="text-violet-200/80 text-lg mb-8 max-w-xl mx-auto">
              Daftar sekarang dan dapatkan voucher diskon 10% untuk pembelian pertamamu!
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
            >
              Daftar Gratis Sekarang
              <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
