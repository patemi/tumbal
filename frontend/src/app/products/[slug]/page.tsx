'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiShoppingCart, FiHeart, FiMinus, FiPlus, FiStar, FiTruck,
    FiShield, FiRefreshCw, FiChevronRight, FiCheck
} from 'react-icons/fi';
import { productsAPI, cartAPI, wishlistAPI } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { formatPrice, getDiscountPercent, PRODUCT_PLACEHOLDER } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import toast from 'react-hot-toast';

interface ProductImage {
    id: string;
    url: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
}

interface Review {
    id: string;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    is_verified: boolean;
    user: { id: string; full_name: string; avatar_url: string | null };
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    short_description: string;
    price: number;
    compare_price: number | null;
    stock: number;
    brand: string;
    tags: string[];
    rating_avg: number;
    rating_count: number;
    sold_count: number;
    category: { id: string; name: string; slug: string };
    images: ProductImage[];
    variants: Array<{ id: string; name: string; price: number; stock: number; is_active: boolean }>;
}

interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    rating_avg: number;
    rating_count: number;
    sold_count: number;
    stock: number;
    images: ProductImage[];
}

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { isAuthenticated } = useAuthStore();
    const { setCart } = useCartStore();

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [related, setRelated] = useState<RelatedProduct[]>([]);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data } = await productsAPI.getBySlug(slug);
                setProduct(data.product);
                setReviews(data.reviews || []);
                setRelated(data.related || []);
                setIsWishlisted(data.isWishlisted);
            } catch {
                toast.error('Produk tidak ditemukan');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchProduct();
    }, [slug]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Silakan login terlebih dahulu');
            return;
        }

        if (!product) return;
        setAddingToCart(true);

        try {
            await cartAPI.add({
                product_id: product.id,
                variant_id: selectedVariant || undefined,
                quantity,
            });
            const cartRes = await cartAPI.get();
            setCart(cartRes.data.items, cartRes.data.summary);
            toast.success('Ditambahkan ke keranjang! 🛒');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            toast.error(err.response?.data?.error || 'Gagal menambahkan');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleWishlist = async () => {
        if (!isAuthenticated) {
            toast.error('Silakan login terlebih dahulu');
            return;
        }
        if (!product) return;

        try {
            const { data } = await wishlistAPI.toggle(product.id);
            setIsWishlisted(data.wishlisted);
            toast.success(data.message);
        } catch {
            toast.error('Gagal memperbarui wishlist');
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-100 rounded-full w-1/4 animate-pulse" />
                        <div className="h-8 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                        <div className="h-6 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h2>
                    <Link href="/products" className="text-violet-600 font-semibold hover:underline">
                        Kembali ke Produk
                    </Link>
                </div>
            </div>
        );
    }

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const currentImage = product.images?.[selectedImage] || primaryImage;
    const discount = product.compare_price ? getDiscountPercent(product.price, product.compare_price) : 0;
    const activeVariant = product.variants?.find(v => v.id === selectedVariant);
    const displayPrice = activeVariant?.price || product.price;
    const displayStock = activeVariant?.stock ?? product.stock;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-violet-600 transition-colors">Home</Link>
                    <FiChevronRight size={14} />
                    <Link href="/products" className="hover:text-violet-600 transition-colors">Produk</Link>
                    {product.category && (
                        <>
                            <FiChevronRight size={14} />
                            <Link href={`/products?category=${product.category.slug}`} className="hover:text-violet-600 transition-colors">
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <FiChevronRight size={14} />
                    <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* Images */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 mb-4">
                            <Image
                                src={currentImage?.url || PRODUCT_PLACEHOLDER}
                                alt={currentImage?.alt_text || product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            {discount > 0 && (
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold rounded-xl shadow-lg">
                                    -{discount}%
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {product.images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(i)}
                                        className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === selectedImage ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-gray-200 hover:border-violet-300'
                                            }`}
                                    >
                                        <Image src={img.url} alt={img.alt_text} fill className="object-cover" sizes="80px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        {/* Brand & Category */}
                        <div className="flex items-center gap-2 mb-3">
                            {product.brand && (
                                <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider bg-violet-50 px-2.5 py-1 rounded-lg">
                                    {product.brand}
                                </span>
                            )}
                            {product.category && (
                                <Link href={`/products?category=${product.category.slug}`} className="text-xs text-gray-500 hover:text-violet-600 transition-colors">
                                    {product.category.name}
                                </Link>
                            )}
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-3">
                            {product.name}
                        </h1>

                        {/* Rating & Stats */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1.5">
                                {[...Array(5)].map((_, i) => (
                                    <FiStar
                                        key={i}
                                        size={16}
                                        className={i < Math.round(product.rating_avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                                    />
                                ))}
                                <span className="text-sm font-semibold text-gray-700 ml-1">{product.rating_avg.toFixed(1)}</span>
                                <span className="text-sm text-gray-400">({product.rating_count} ulasan)</span>
                            </div>
                            <span className="text-sm text-gray-400">·</span>
                            <span className="text-sm text-gray-500">{product.sold_count} terjual</span>
                        </div>

                        {/* Price */}
                        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl p-5 mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-violet-600">{formatPrice(displayPrice)}</span>
                                {product.compare_price && product.compare_price > product.price && (
                                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                                )}
                            </div>
                            {discount > 0 && (
                                <span className="text-sm text-rose-500 font-semibold">Hemat {formatPrice((product.compare_price || 0) - product.price)}</span>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.short_description && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.short_description}</p>
                        )}

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Pilih Varian</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.filter(v => v.is_active).map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant.id === selectedVariant ? null : variant.id)}
                                            disabled={variant.stock === 0}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedVariant === variant.id
                                                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                                                    : variant.stock === 0
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                        : 'border-gray-200 text-gray-700 hover:border-violet-300'
                                                }`}
                                        >
                                            {variant.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Jumlah</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <FiMinus size={16} />
                                    </button>
                                    <span className="w-14 text-center font-semibold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                                        className="p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <FiPlus size={16} />
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500">
                                    Stok: <span className={displayStock > 5 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{displayStock}</span>
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-8">
                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart || displayStock === 0}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingToCart ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FiShoppingCart size={20} />
                                        {displayStock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleWishlist}
                                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${isWishlisted
                                        ? 'border-rose-300 bg-rose-50 text-rose-500'
                                        : 'border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-500'
                                    }`}
                            >
                                <FiHeart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: FiTruck, label: 'Free Ongkir', sub: 'Min. 100K' },
                                { icon: FiShield, label: 'Original', sub: 'Garansi' },
                                { icon: FiRefreshCw, label: 'Return', sub: '7 Hari' },
                            ].map(feat => (
                                <div key={feat.label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                                    <feat.icon size={18} className="text-violet-500" />
                                    <span className="text-xs font-semibold text-gray-700">{feat.label}</span>
                                    <span className="text-[10px] text-gray-400">{feat.sub}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Description & Reviews Tabs */}
                <div className="mt-16">
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Produk</h2>
                            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {product.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <div className="border-t border-gray-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Ulasan ({product.rating_count})
                            </h2>

                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map(review => (
                                        <div key={review.id} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {review.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm text-gray-900">{review.user?.full_name}</span>
                                                    {review.is_verified && (
                                                        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            <FiCheck size={10} /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FiStar key={i} size={12} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                                {review.title && <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>}
                                                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Belum ada ulasan untuk produk ini.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {related.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Produk Serupa</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {related.map((prod, i) => (
                                <ProductCard key={prod.id} product={prod} index={i} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
