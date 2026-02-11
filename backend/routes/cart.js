const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/cart
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('cart_items')
            .select(`
        *,
        product:products(id, name, slug, price, compare_price, stock, is_active,
          images:product_images(id, url, alt_text, is_primary)
        ),
        variant:product_variants(id, name, price, stock)
      `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate totals
        let subtotal = 0;
        const items = (data || []).map(item => {
            const price = item.variant?.price || item.product?.price || 0;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            return { ...item, price, item_total: itemTotal };
        });

        res.json({
            items,
            summary: {
                subtotal,
                shipping: subtotal >= 100000 ? 0 : 15000,
                total: subtotal + (subtotal >= 100000 ? 0 : 15000),
                item_count: items.reduce((sum, item) => sum + item.quantity, 0),
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/cart
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { product_id, variant_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID wajib diisi' });
        }

        // Check product exists and has stock
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('id, stock, is_active')
            .eq('id', product_id)
            .single();

        if (!product || !product.is_active) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Stok tidak mencukupi' });
        }

        // Check if item already in cart
        const { data: existing } = await supabaseAdmin
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .eq('variant_id', variant_id || null)
            .single();

        let result;
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (newQty > product.stock) {
                return res.status(400).json({ error: 'Melebihi stok yang tersedia' });
            }

            const { data, error } = await supabaseAdmin
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabaseAdmin
                .from('cart_items')
                .insert({
                    user_id: req.user.id,
                    product_id,
                    variant_id: variant_id || null,
                    quantity,
                })
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        res.status(201).json({ message: 'Berhasil ditambahkan ke keranjang', item: result });
    } catch (error) {
        next(error);
    }
});

// PUT /api/cart/:id
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity minimal 1' });
        }

        // Get cart item with product stock
        const { data: cartItem } = await supabaseAdmin
            .from('cart_items')
            .select('*, product:products(stock)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (!cartItem) {
            return res.status(404).json({ error: 'Item tidak ditemukan' });
        }

        if (quantity > cartItem.product.stock) {
            return res.status(400).json({ error: 'Melebihi stok yang tersedia' });
        }

        const { data, error } = await supabaseAdmin
            .from('cart_items')
            .update({ quantity })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Keranjang berhasil diperbarui', item: data });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/cart/:id
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Item berhasil dihapus dari keranjang' });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/cart - Clear cart
router.delete('/', authenticate, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Keranjang berhasil dikosongkan' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
