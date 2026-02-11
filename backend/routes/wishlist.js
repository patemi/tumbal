const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/wishlist
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select(`
        *,
        product:products(
          id, name, slug, price, compare_price, stock, rating_avg, rating_count,
          images:product_images(id, url, alt_text, is_primary)
        )
      `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ items: data || [] });
    } catch (error) {
        next(error);
    }
});

// POST /api/wishlist
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Product ID wajib diisi' });

        // Check if already in wishlist
        const { data: existing } = await supabaseAdmin
            .from('wishlists')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            // Remove from wishlist (toggle)
            await supabaseAdmin
                .from('wishlists')
                .delete()
                .eq('id', existing.id);
            return res.json({ message: 'Dihapus dari wishlist', wishlisted: false });
        }

        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .insert({ user_id: req.user.id, product_id })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Ditambahkan ke wishlist', wishlisted: true, item: data });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/wishlist/:id
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('wishlists')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Dihapus dari wishlist' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
