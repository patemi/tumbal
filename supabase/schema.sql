-- ============================================
-- UhuyShop E-Commerce Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. ADDRESSES
-- ============================================
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Rumah',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  compare_price DECIMAL(12,2) CHECK (compare_price >= 0),
  cost_price DECIMAL(12,2) CHECK (cost_price >= 0),
  sku TEXT UNIQUE,
  barcode TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  weight DECIMAL(8,2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCT IMAGES
-- ============================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. PRODUCT VARIANTS
-- ============================================
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. CART ITEMS
-- ============================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- ============================================
-- 8. WISHLISTS
-- ============================================
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 9. ORDERS
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'paid', 'refunded', 'failed'
  )),
  payment_method TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. ORDER ITEMS
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  variant_name TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. REVIEWS
-- ============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, order_id)
);

-- ============================================
-- 12. COUPONS
-- ============================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL CHECK (discount_value > 0),
  min_purchase DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. BANNERS
-- ============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_sold_count ON public.products(sold_count DESC);
CREATE INDEX idx_products_rating ON public.products(rating_avg DESC);
CREATE INDEX idx_products_search ON public.products USING gin(to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Categories (public read)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products (public read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Only admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are viewable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Only admins can manage product images" ON public.product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Product Variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Only admins can manage variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cart Items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Coupons (public read active only)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active coupons are viewable" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage coupons" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active banners are viewable" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage banners" ON public.banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'UHS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Update product rating on review changes
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  target_product_id = COALESCE(NEW.product_id, OLD.product_id);
  
  UPDATE public.products
  SET 
    rating_avg = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM public.reviews WHERE product_id = target_product_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = target_product_id)
  WHERE id = target_product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ============================================
-- SEED DATA
-- ============================================

-- Categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Elektronik', 'elektronik', 'Gadget, perangkat elektronik, dan aksesoris', 1),
  ('Fashion Pria', 'fashion-pria', 'Pakaian, sepatu, dan aksesoris pria', 2),
  ('Fashion Wanita', 'fashion-wanita', 'Pakaian, sepatu, dan aksesoris wanita', 3),
  ('Rumah Tangga', 'rumah-tangga', 'Peralatan dan dekorasi rumah', 4),
  ('Olahraga', 'olahraga', 'Peralatan dan pakaian olahraga', 5),
  ('Makanan & Minuman', 'makanan-minuman', 'Snack, minuman, dan bahan makanan', 6),
  ('Kesehatan', 'kesehatan', 'Produk kesehatan dan perawatan tubuh', 7),
  ('Buku & Alat Tulis', 'buku-alat-tulis', 'Buku, alat tulis, dan perlengkapan kantor', 8);

-- Sample Products
INSERT INTO public.products (name, slug, description, short_description, price, compare_price, stock, category_id, brand, tags, is_featured, is_active) VALUES
  ('Wireless Earbuds Pro X1', 'wireless-earbuds-pro-x1', 'Earbuds nirkabel dengan Active Noise Cancellation, battery life hingga 32 jam, driver 12mm custom, IPX5 water resistant. Dilengkapi dengan transparency mode dan touch control.', 'Earbuds ANC premium dengan battery 32 jam', 899000, 1299000, 150, (SELECT id FROM categories WHERE slug = 'elektronik'), 'AudioTech', ARRAY['wireless', 'earbuds', 'anc', 'bluetooth'], true, true),
  ('Smart Watch Ultra Series', 'smart-watch-ultra-series', 'Smartwatch premium dengan layar AMOLED 1.9 inch, GPS built-in, heart rate monitor, SpO2 sensor, 100+ sport modes, water resistant 5ATM. Support Android & iOS.', 'Smartwatch AMOLED GPS dengan 100+ sport modes', 1499000, 2199000, 75, (SELECT id FROM categories WHERE slug = 'elektronik'), 'TechFit', ARRAY['smartwatch', 'fitness', 'gps'], true, true),
  ('Mechanical Keyboard RGB', 'mechanical-keyboard-rgb', 'Keyboard mekanikal full-size dengan switches Cherry MX Blue, per-key RGB backlight, hot-swappable, PBT keycaps, USB-C detachable cable. Build quality premium aluminium frame.', 'Keyboard mekanikal Cherry MX dengan RGB', 1299000, 1599000, 50, (SELECT id FROM categories WHERE slug = 'elektronik'), 'KeyMaster', ARRAY['keyboard', 'mechanical', 'rgb', 'gaming'], false, true),
  ('Kaos Polo Premium Cotton', 'kaos-polo-premium-cotton', 'Kaos polo berbahan cotton combed 30s premium, double knit collar, kancing coconut shell, jahitan rantai. Available dalam berbagai warna. Sangat nyaman untuk daily wear dan semi-formal.', 'Polo shirt cotton combed 30s premium', 249000, 349000, 200, (SELECT id FROM categories WHERE slug = 'fashion-pria'), 'UhuyWear', ARRAY['polo', 'kaos', 'cotton', 'premium'], true, true),
  ('Sneakers Running Boost', 'sneakers-running-boost', 'Sepatu running dengan teknologi Boost midsole, upper mesh breathable, rubber outsole high-grip, heel counter stability. Ringan dan responsif untuk daily running dan casual wear.', 'Sepatu running Boost technology', 899000, 1299000, 100, (SELECT id FROM categories WHERE slug = 'fashion-pria'), 'StepUp', ARRAY['sneakers', 'running', 'boost', 'sepatu'], true, true),
  ('Dress Casual Floral', 'dress-casual-floral', 'Dress casual dengan motif floral elegan, bahan viscose premium yang jatuh sempurna, A-line silhouette yang flattering untuk semua body type. Cocok untuk hangout dan acara semi-formal.', 'Dress viscose floral elegan', 359000, 499000, 80, (SELECT id FROM categories WHERE slug = 'fashion-wanita'), 'LunaStyle', ARRAY['dress', 'floral', 'casual', 'wanita'], true, true),
  ('Tas Tote Bag Canvas', 'tas-tote-bag-canvas', 'Tote bag dari bahan canvas heavy duty 16oz, compartment laptop 15 inch, inner pocket organizer, reinforced stitching. Cocok untuk kuliah, kerja, dan daily use.', 'Tote bag canvas 16oz dengan laptop compartment', 189000, 259000, 120, (SELECT id FROM categories WHERE slug = 'fashion-wanita'), 'BagCraft', ARRAY['tas', 'tote', 'canvas', 'laptop'], false, true),
  ('Air Purifier HEPA Smart', 'air-purifier-hepa-smart', 'Air purifier dengan True HEPA H13 filter, coverage area 40m², sensor PM2.5/TVOC real-time, mode auto/sleep/turbo, WiFi smart control via app. Filter life 6-12 bulan.', 'Air purifier HEPA H13 smart WiFi', 1899000, 2499000, 30, (SELECT id FROM categories WHERE slug = 'rumah-tangga'), 'CleanAir', ARRAY['air purifier', 'hepa', 'smart home'], true, true),
  ('Yoga Mat Premium TPE', 'yoga-mat-premium-tpe', 'Yoga mat 6mm dari bahan TPE eco-friendly, dual-layer anti-slip, alignment line guide, ringan dan mudah digulung. Dilengkapi carrying strap. Ukuran 183x61cm.', 'Yoga mat TPE 6mm eco-friendly anti-slip', 299000, 399000, 90, (SELECT id FROM categories WHERE slug = 'olahraga'), 'FlexFit', ARRAY['yoga', 'mat', 'fitness', 'tpe'], false, true),
  ('Dumbbell Adjustable 24kg', 'dumbbell-adjustable-24kg', 'Dumbbell adjustable dari 2.5kg hingga 24kg dengan dial adjustment cepat, compact design menggantikan 15 pasang dumbbell. Coating anti-slip dan stand included.', 'Dumbbell adjustable 2.5-24kg dial system', 2499000, 3299000, 25, (SELECT id FROM categories WHERE slug = 'olahraga'), 'IronGrip', ARRAY['dumbbell', 'fitness', 'adjustable', 'gym'], false, true),
  ('Kopi Arabica Gayo 500g', 'kopi-arabica-gayo-500g', 'Biji kopi Arabica single origin dari dataran tinggi Gayo Aceh, medium roast, cupping score 85+. Notes: chocolate, citrus, floral. Freshly roasted dan vacuum packed.', 'Kopi Arabica Gayo medium roast 500g', 159000, 199000, 200, (SELECT id FROM categories WHERE slug = 'makanan-minuman'), 'NusantaraBean', ARRAY['kopi', 'arabica', 'gayo', 'coffee'], true, true),
  ('Vitamin C 1000mg Immune Boost', 'vitamin-c-1000mg-immune-boost', 'Suplemen Vitamin C 1000mg dengan Zinc dan Vitamin D3, formula time-release untuk penyerapan optimal. 60 tablet per botol, halal certified, BPOM approved.', 'Vitamin C 1000mg + Zinc + D3 (60 tablet)', 129000, 179000, 300, (SELECT id FROM categories WHERE slug = 'kesehatan'), 'VitaPlus', ARRAY['vitamin', 'suplemen', 'immune', 'kesehatan'], false, true);

-- Sample Banners
INSERT INTO public.banners (title, subtitle, image_url, sort_order, is_active) VALUES
  ('Flash Sale Februari!', 'Diskon hingga 70% untuk produk pilihan', '/banners/flash-sale.jpg', 1, true),
  ('Koleksi Fashion Terbaru', 'Trend fashion 2026 sudah hadir', '/banners/fashion-new.jpg', 2, true),
  ('Free Ongkir Se-Indonesia', 'Minimal belanja Rp 100.000', '/banners/free-shipping.jpg', 3, true);

-- Sample Coupon
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, is_active) VALUES
  ('UHUY10', 'Diskon 10% untuk pembelian pertama', 'percentage', 10, 100000, 50000, 1000, true),
  ('HEMAT50K', 'Potongan Rp 50.000', 'fixed', 50000, 200000, NULL, 500, true);
