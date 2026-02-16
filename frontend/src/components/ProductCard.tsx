'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { formatPrice, getDiscountPercent, PRODUCT_PLACEHOLDER } from '@/lib/utils';
import { cartAPI, wishlistAPI } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProductImage {
    id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
}

interface ProductCardProps {
    product: {
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
        images?: ProductImage[];
    };
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const { isAuthenticated } = useAuthStore();
    const { setCart } = useCartStore();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isAddingCart, setIsAddingCart] = useState(false);

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const imageUrl = primaryImage?.url || PRODUCT_PLACEHOLDER;
    const discount = product.compare_price ? getDiscountPercent(product.price, product.compare_price) : 0;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Silakan login terlebih dahulu');
            return;
        }

        setIsAddingCart(true);
        try {
            await cartAPI.add({ product_id: product.id, quantity: 1 });
            const { data } = await cartAPI.get();
            setCart(data.items, data.summary);
            toast.success('Ditambahkan ke keranjang! 🛒');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal menambahkan');
        } finally {
            setIsAddingCart(false);
        }
    };

    const handleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Silakan login terlebih dahulu');
            return;
        }

        try {
            const { data } = await wishlistAPI.toggle(product.id);
            setIsWishlisted(data.wishlisted);
            toast.success(data.message);
        } catch {
            toast.error('Gagal memperbarui wishlist');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <Link href={`/products/${product.slug}`} className="group block">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-violet-200 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />

                        {/* Discount Badge */}
                        {discount > 0 && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                -{discount}%
                            </div>
                        )}

                        {/* Out of Stock */}
                        {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-lg">Habis</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <button
                                onClick={handleWishlist}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 ${isWishlisted
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/90 text-gray-600 hover:bg-rose-500 hover:text-white'
                                    }`}
                            >
                                <FiHeart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingCart || product.stock === 0}
                                className="w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center text-gray-600 hover:bg-violet-600 hover:text-white shadow-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
                            >
                                <FiShoppingCart size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                        {product.brand && (
                            <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-1">
                                {product.brand}
                            </span>
                        )}
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors leading-snug">
                            {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="flex items-center gap-0.5">
                                <FiStar size={12} className="text-amber-400 fill-amber-400" />
                                <span className="text-xs font-semibold text-gray-700">{product.rating_avg.toFixed(1)}</span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                                ({product.rating_count}) · {product.sold_count > 0 ? `${product.sold_count} terjual` : 'Baru'}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mt-auto">
                            <div className="flex items-baseline gap-2">
                                <span className="text-base font-bold text-gray-900">
                                    {formatPrice(product.price)}
                                </span>
                                {product.compare_price && product.compare_price > product.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                        {formatPrice(product.compare_price)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
