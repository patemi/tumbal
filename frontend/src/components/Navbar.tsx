'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiShoppingCart, FiHeart, FiUser, FiMenu, FiX,
    FiChevronDown, FiLogOut, FiPackage, FiSettings
} from 'react-icons/fi';
import { useAuthStore, useCartStore, useUIStore } from '@/lib/store';
import { categoriesAPI } from '@/lib/api';

export default function Navbar() {
    const router = useRouter();
    const { isAuthenticated, profile, clearAuth } = useAuthStore();
    const { summary } = useCartStore();
    const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        categoriesAPI.getAll().then(res => setCategories(res.data.categories || [])).catch(() => { });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCategoryDropdown(false);
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setShowUserDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            closeMobileMenu();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        clearAuth();
        setShowUserDropdown(false);
        router.push('/');
    };

    return (
        <>
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs py-1.5 text-center font-medium tracking-wide">
                🎉 Free Ongkir untuk pembelian di atas Rp 100.000! Gunakan kode <span className="font-bold">UHUY10</span> untuk diskon 10%
            </div>

            {/* Navbar */}
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5'
                    : 'bg-white'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group" onClick={closeMobileMenu}>
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300 group-hover:scale-105">
                                <span className="text-white font-black text-lg">U</span>
                            </div>
                            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                                UhuyShop
                            </span>
                        </Link>

                        {/* Search Bar - Desktop */}
                        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
                            <div className="relative w-full group">
                                <input
                                    type="text"
                                    placeholder="Cari produk impianmu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all duration-300 group-hover:border-violet-300"
                                />
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-violet-500 transition-colors" size={18} />
                            </div>
                        </form>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Categories Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-all duration-200"
                                >
                                    Kategori
                                    <FiChevronDown className={`transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} size={14} />
                                </button>
                                <AnimatePresence>
                                    {showCategoryDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 py-2 overflow-hidden"
                                        >
                                            {categories.map(cat => (
                                                <Link
                                                    key={cat.id}
                                                    href={`/products?category=${cat.slug}`}
                                                    onClick={() => setShowCategoryDropdown(false)}
                                                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Wishlist */}
                            {isAuthenticated && (
                                <Link href="/wishlist" className="relative p-2.5 text-gray-600 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-all duration-200">
                                    <FiHeart size={20} />
                                </Link>
                            )}

                            {/* Cart */}
                            <Link href="/cart" className="relative p-2.5 text-gray-600 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-all duration-200">
                                <FiShoppingCart size={20} />
                                {summary.item_count > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        {summary.item_count > 99 ? '99+' : summary.item_count}
                                    </motion.span>
                                )}
                            </Link>

                            {/* User */}
                            {isAuthenticated ? (
                                <div className="relative" ref={userDropdownRef}>
                                    <button
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-violet-50 transition-all duration-200"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                                            {profile?.full_name || 'User'}
                                        </span>
                                        <FiChevronDown size={14} className={`text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {showUserDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 py-2 overflow-hidden"
                                            >
                                                <Link href="/profile" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                                                    <FiUser size={16} /> Profil Saya
                                                </Link>
                                                <Link href="/orders" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                                                    <FiPackage size={16} /> Pesanan Saya
                                                </Link>
                                                {profile?.role === 'admin' && (
                                                    <Link href="/admin" onClick={() => setShowUserDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                                                        <FiSettings size={16} /> Admin Panel
                                                    </Link>
                                                )}
                                                <hr className="my-1 border-gray-100" />
                                                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                                                    <FiLogOut size={16} /> Logout
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login" className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-all">
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300">
                                        Daftar
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile: Cart + Hamburger */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <Link href="/cart" className="relative p-2 text-gray-600">
                                <FiShoppingCart size={22} />
                                {summary.item_count > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {summary.item_count}
                                    </span>
                                )}
                            </Link>
                            <button onClick={toggleMobileMenu} className="p-2 text-gray-600">
                                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-3">
                                {/* Search */}
                                <form onSubmit={handleSearch}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Cari produk..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </form>

                                {/* Links */}
                                <div className="space-y-1">
                                    <Link href="/products" onClick={closeMobileMenu} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors">
                                        Semua Produk
                                    </Link>
                                    {categories.map(cat => (
                                        <Link key={cat.id} href={`/products?category=${cat.slug}`} onClick={closeMobileMenu} className="block px-4 py-3 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors">
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>

                                <hr className="border-gray-100" />

                                {isAuthenticated ? (
                                    <div className="space-y-1">
                                        <Link href="/profile" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 rounded-xl">
                                            <FiUser size={18} /> Profil Saya
                                        </Link>
                                        <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 rounded-xl">
                                            <FiPackage size={18} /> Pesanan Saya
                                        </Link>
                                        <Link href="/wishlist" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 rounded-xl">
                                            <FiHeart size={18} /> Wishlist
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full">
                                            <FiLogOut size={18} /> Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Link href="/login" onClick={closeMobileMenu} className="flex-1 text-center py-3 text-sm font-medium text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50">
                                            Masuk
                                        </Link>
                                        <Link href="/register" onClick={closeMobileMenu} className="flex-1 text-center py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl">
                                            Daftar
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
