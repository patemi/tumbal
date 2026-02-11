const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('orders')
            .select(`
        *,
        items:order_items(*)
      `, { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (status) query = query.eq('status', status);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({
            orders: data,
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

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        items:order_items(
          *,
          product:products(id, name, slug, images:product_images(url, is_primary))
        )
      `)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        }

        res.json({ order: data });
    } catch (error) {
        next(error);
    }
});

// POST /api/orders - Create order (checkout)
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { shipping_address, payment_method, notes, coupon_code } = req.body;

        if (!shipping_address) {
            return res.status(400).json({ error: 'Alamat pengiriman wajib diisi' });
        }

        // Get cart items
        const { data: cartItems, error: cartError } = await supabaseAdmin
            .from('cart_items')
            .select(`
        *,
        product:products(id, name, price, stock, is_active,
          images:product_images(url, is_primary)
        ),
        variant:product_variants(id, name, price, stock)
      `)
            .eq('user_id', req.user.id);

        if (cartError) throw cartError;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Keranjang kosong' });
        }

        // Validate stock and calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of cartItems) {
            if (!item.product.is_active) {
                return res.status(400).json({
                    error: `Produk "${item.product.name}" sudah tidak tersedia`
                });
            }

            const availableStock = item.variant?.stock ?? item.product.stock;
            if (item.quantity > availableStock) {
                return res.status(400).json({
                    error: `Stok "${item.product.name}" tidak mencukupi (tersedia: ${availableStock})`
                });
            }

            const price = item.variant?.price || item.product.price;
            const itemSubtotal = price * item.quantity;
            subtotal += itemSubtotal;

            const primaryImage = item.product.images?.find(img => img.is_primary);

            orderItems.push({
                product_id: item.product.id,
                variant_id: item.variant?.id || null,
                product_name: item.product.name,
                product_image: primaryImage?.url || null,
                variant_name: item.variant?.name || null,
                price,
                quantity: item.quantity,
                subtotal: itemSubtotal,
            });
        }

        // Calculate discount from coupon
        let discount = 0;
        if (coupon_code) {
            const { data: coupon } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', coupon_code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (coupon) {
                if (coupon.min_purchase && subtotal < coupon.min_purchase) {
                    return res.status(400).json({
                        error: `Minimum belanja Rp ${coupon.min_purchase.toLocaleString()} untuk kupon ini`
                    });
                }

                if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                    return res.status(400).json({ error: 'Kupon sudah habis' });
                }

                if (coupon.discount_type === 'percentage') {
                    discount = (subtotal * coupon.discount_value) / 100;
                    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
                } else {
                    discount = coupon.discount_value;
                }

                // Increment used count
                await supabaseAdmin
                    .from('coupons')
                    .update({ used_count: coupon.used_count + 1 })
                    .eq('id', coupon.id);
            }
        }

        const shipping_cost = subtotal >= 100000 ? 0 : 15000;
        const tax = Math.round((subtotal - discount) * 0.11); // PPN 11%
        const total = subtotal - discount + shipping_cost + tax;

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: req.user.id,
                status: 'pending',
                payment_status: 'unpaid',
                payment_method: payment_method || 'transfer',
                subtotal,
                shipping_cost,
                discount,
                tax,
                total,
                shipping_address,
                notes,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create order items
        const itemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: order.id,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(itemsWithOrderId);

        if (itemsError) throw itemsError;

        // Update product stock & sold count
        for (const item of cartItems) {
            const newStock = (item.variant?.stock ?? item.product.stock) - item.quantity;

            if (item.variant) {
                await supabaseAdmin
                    .from('product_variants')
                    .update({ stock: newStock })
                    .eq('id', item.variant.id);
            }

            await supabaseAdmin
                .from('products')
                .update({
                    stock: item.product.stock - item.quantity,
                    sold_count: item.product.sold_count + item.quantity
                })
                .eq('id', item.product.id);
        }

        // Clear cart
        await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', req.user.id);

        res.status(201).json({
            message: 'Pesanan berhasil dibuat',
            order: { ...order, items: orderItems }
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res, next) => {
    try {
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ error: 'Pesanan tidak dapat dibatalkan' });
        }

        // Restore stock
        const { data: items } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        for (const item of items) {
            await supabaseAdmin.rpc('increment_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
            }).catch(() => {
                // Fallback if RPC doesn't exist
                return supabaseAdmin
                    .from('products')
                    .update({ stock: supabaseAdmin.raw(`stock + ${item.quantity}`) })
                    .eq('id', item.product_id);
            });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Pesanan berhasil dibatalkan', order: data });
    } catch (error) {
        next(error);
    }
});

// ============ ADMIN ROUTES ============

// GET /api/orders/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('orders')
            .select(`
        *,
        user:profiles(id, full_name, email, avatar_url),
        items:order_items(*)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (status) query = query.eq('status', status);
        if (search) query = query.ilike('order_number', `%${search}%`);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({
            orders: data,
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

// PUT /api/orders/admin/:id/status
router.put('/admin/:id/status', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { status, tracking_number, payment_status } = req.body;
        const updates = {};

        if (status) {
            updates.status = status;
            if (status === 'shipped') updates.shipped_at = new Date().toISOString();
            if (status === 'delivered') updates.delivered_at = new Date().toISOString();
            if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
        }

        if (tracking_number) updates.tracking_number = tracking_number;
        if (payment_status) updates.payment_status = payment_status;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Status pesanan berhasil diperbarui', order: data });
    } catch (error) {
        next(error);
    }
});

// GET /api/orders/admin/stats
router.get('/admin/stats', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { data: totalOrders } = await supabaseAdmin
            .from('orders')
            .select('id', { count: 'exact', head: true });

        const { data: pendingOrders } = await supabaseAdmin
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { data: revenue } = await supabaseAdmin
            .from('orders')
            .select('total')
            .eq('payment_status', 'paid');

        const totalRevenue = (revenue || []).reduce((sum, o) => sum + parseFloat(o.total), 0);

        const { data: totalProducts } = await supabaseAdmin
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);

        const { data: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        res.json({
            stats: {
                total_orders: totalOrders?.length || 0,
                pending_orders: pendingOrders?.length || 0,
                total_revenue: totalRevenue,
                total_products: totalProducts?.length || 0,
                total_users: totalUsers?.length || 0,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
