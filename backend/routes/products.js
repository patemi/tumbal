const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { optionalAuth, authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/products - List products with filtering, sorting, pagination
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            sort = 'created_at',
            order = 'desc',
            min_price,
            max_price,
            brand,
            featured,
            tags,
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, sort_order, is_primary)
      `, { count: 'exact' })
            .eq('is_active', true);

        // Filters
        if (category) {
            const { data: cat } = await supabaseAdmin
                .from('categories')
                .select('id')
                .eq('slug', category)
                .single();
            if (cat) query = query.eq('category_id', cat.id);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
        }

        if (min_price) query = query.gte('price', parseFloat(min_price));
        if (max_price) query = query.lte('price', parseFloat(max_price));
        if (brand) query = query.eq('brand', brand);
        if (featured === 'true') query = query.eq('is_featured', true);
        if (tags) query = query.contains('tags', [tags]);

        // Sorting
        const validSorts = ['price', 'created_at', 'sold_count', 'rating_avg', 'name'];
        const sortField = validSorts.includes(sort) ? sort : 'created_at';
        const ascending = order === 'asc';
        query = query.order(sortField, { ascending });

        // Pagination
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({
            products: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, sort_order, is_primary)
      `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;
        res.json({ products: data });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/bestsellers
router.get('/bestsellers', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, sort_order, is_primary)
      `)
            .eq('is_active', true)
            .order('sold_count', { ascending: false })
            .limit(8);

        if (error) throw error;
        res.json({ products: data });
    } catch (error) {
        next(error);
    }
});

// GET /api/products/:slug - Get product detail
router.get('/:slug', optionalAuth, async (req, res, next) => {
    try {
        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, sort_order, is_primary),
        variants:product_variants(id, name, sku, price, stock, attributes, is_active)
      `)
            .eq('slug', req.params.slug)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        // Get reviews
        const { data: reviews } = await supabaseAdmin
            .from('reviews')
            .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
            .eq('product_id', product.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Check wishlist status if authenticated
        let isWishlisted = false;
        if (req.user) {
            const { data: wishlist } = await supabaseAdmin
                .from('wishlists')
                .select('id')
                .eq('user_id', req.user.id)
                .eq('product_id', product.id)
                .single();
            isWishlisted = !!wishlist;
        }

        // Get related products
        const { data: related } = await supabaseAdmin
            .from('products')
            .select(`
        id, name, slug, price, compare_price, rating_avg, rating_count, sold_count,
        images:product_images(id, url, alt_text, is_primary)
      `)
            .eq('is_active', true)
            .eq('category_id', product.category_id)
            .neq('id', product.id)
            .limit(4);

        res.json({
            product,
            reviews: reviews || [],
            isWishlisted,
            related: related || [],
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/products - Create product (admin only)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const {
            name, slug, description, short_description, price, compare_price,
            cost_price, sku, stock, category_id, brand, tags, is_featured, images,
        } = req.body;

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert({
                name, slug, description, short_description, price, compare_price,
                cost_price, sku, stock, category_id, brand, tags, is_featured,
            })
            .select()
            .single();

        if (error) throw error;

        // Add images
        if (images && images.length > 0) {
            const imageRecords = images.map((img, index) => ({
                product_id: product.id,
                url: img.url,
                alt_text: img.alt_text || name,
                sort_order: index,
                is_primary: index === 0,
            }));

            await supabaseAdmin.from('product_images').insert(imageRecords);
        }

        res.status(201).json({ message: 'Produk berhasil dibuat', product });
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Produk berhasil diperbarui', product: data });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('products')
            .update({ is_active: false })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
