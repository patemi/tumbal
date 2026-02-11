const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = 'created_at' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabaseAdmin
            .from('reviews')
            .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `, { count: 'exact' })
            .eq('product_id', req.params.productId)
            .order(sort, { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;

        // Rating breakdown
        const { data: allReviews } = await supabaseAdmin
            .from('reviews')
            .select('rating')
            .eq('product_id', req.params.productId);

        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (allReviews || []).forEach(r => { breakdown[r.rating]++; });

        res.json({
            reviews: data,
            breakdown,
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

// POST /api/reviews
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { product_id, order_id, rating, title, comment } = req.body;

        if (!product_id || !rating) {
            return res.status(400).json({ error: 'Product ID dan rating wajib diisi' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating harus antara 1-5' });
        }

        // Check if user has purchased and order is delivered
        let is_verified = false;
        if (order_id) {
            const { data: order } = await supabaseAdmin
                .from('orders')
                .select('id, status')
                .eq('id', order_id)
                .eq('user_id', req.user.id)
                .eq('status', 'delivered')
                .single();
            is_verified = !!order;
        }

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                user_id: req.user.id,
                product_id,
                order_id,
                rating,
                title,
                comment,
                is_verified,
            })
            .select(`*, user:profiles(id, full_name, avatar_url)`)
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Review berhasil ditambahkan', review: data });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('reviews')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Review berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
