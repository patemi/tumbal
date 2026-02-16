import Link from 'next/link';
import {
    FiMapPin, FiPhone, FiMail, FiInstagram, FiTwitter, FiFacebook, FiYoutube
} from 'react-icons/fi';

const footerLinks = {
    shop: [
        { label: 'Semua Produk', href: '/products' },
        { label: 'Kategori', href: '/products' },
        { label: 'Flash Sale', href: '/products?sort=price&order=asc' },
        { label: 'Best Seller', href: '/products?sort=sold_count&order=desc' },
        { label: 'Produk Baru', href: '/products?sort=created_at&order=desc' },
    ],
    support: [
        { label: 'Pusat Bantuan', href: '#' },
        { label: 'Cara Belanja', href: '#' },
        { label: 'Pengiriman', href: '#' },
        { label: 'Pengembalian', href: '#' },
        { label: 'FAQ', href: '#' },
    ],
    company: [
        { label: 'Tentang Kami', href: '#' },
        { label: 'Karir', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Kebijakan Privasi', href: '#' },
        { label: 'Syarat & Ketentuan', href: '#' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-gray-950 text-gray-300">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-black text-lg">U</span>
                            </div>
                            <span className="text-xl font-black text-white">UhuyShop</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
                            Platform e-commerce terpercaya dengan produk berkualitas dan harga terbaik.
                            Belanja mudah, aman, dan nyaman hanya di UhuyShop.
                        </p>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <FiMapPin size={16} className="text-violet-400 flex-shrink-0" />
                                <span>Jakarta, Indonesia</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <FiPhone size={16} className="text-violet-400 flex-shrink-0" />
                                <span>+62 812 3456 7890</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <FiMail size={16} className="text-violet-400 flex-shrink-0" />
                                <span>hello@uhuyshop.id</span>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Belanja</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.shop.map(link => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Bantuan</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.support.map(link => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Perusahaan</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.company.map(link => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} UhuyShop. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3">
                        {[
                            { icon: FiInstagram, href: '#', label: 'Instagram' },
                            { icon: FiTwitter, href: '#', label: 'Twitter' },
                            { icon: FiFacebook, href: '#', label: 'Facebook' },
                            { icon: FiYoutube, href: '#', label: 'YouTube' },
                        ].map(social => (
                            <a
                                key={social.label}
                                href={social.href}
                                aria-label={social.label}
                                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-violet-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                            >
                                <social.icon size={16} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
