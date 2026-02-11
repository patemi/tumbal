const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/categories
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json({ categories: data });
    } catch (error) {
        next(error);
    }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('slug', req.params.slug)
            .eq('is_active', true)
            .single();

        if (error) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
        res.json({ category: data });
    } catch (error) {
        next(error);
    }
});

// POST /api/categories (admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { name, slug, description, image_url, parent_id, sort_order } = req.body;
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert({ name, slug, description, image_url, parent_id, sort_order })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Kategori berhasil dibuat', category: data });
    } catch (error) {
        next(error);
    }
});

// PUT /api/categories/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const updates = req.body;
        delete updates.id;

        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Kategori berhasil diperbarui', category: data });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('categories')
            .update({ is_active: false })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
