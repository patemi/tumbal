const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// GET /api/banners
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json({ banners: data });
    } catch (error) {
        next(error);
    }
});

// GET /api/coupons/validate
router.post('/validate', async (req, res, next) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) return res.status(400).json({ error: 'Kode kupon wajib diisi' });

        const { data: coupon, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ error: 'Kupon tidak valid' });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Kupon sudah expired' });
        }

        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ error: 'Kupon sudah habis' });
        }

        if (coupon.min_purchase && subtotal < coupon.min_purchase) {
            return res.status(400).json({
                error: `Minimum belanja Rp ${coupon.min_purchase.toLocaleString()}`
            });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
        } else {
            discount = coupon.discount_value;
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
            },
            discount,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
