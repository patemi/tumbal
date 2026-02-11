const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi' });
        }

        const { data, error } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: full_name || email },
            },
        });

        if (error) throw error;

        res.status(201).json({
            message: 'Registrasi berhasil',
            user: data.user,
            session: data.session,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi' });
        }

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Get profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({
            message: 'Login berhasil',
            user: data.user,
            profile,
            session: data.session,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.auth.admin.signOut(req.user.id);
        if (error) throw error;
        res.json({ message: 'Logout berhasil' });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    res.json({
        user: req.user,
        profile: req.user.profile,
    });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const { full_name, phone, avatar_url } = req.body;
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Profil berhasil diperbarui', profile: data });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token tidak ditemukan' });
        }

        const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
        if (error) throw error;

        res.json({ session: data.session });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
