const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Supabase errors
    if (err.code && err.message) {
        return res.status(400).json({
            error: err.message,
            code: err.code,
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validasi gagal',
            details: err.details,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token tidak valid' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token sudah expired' });
    }

    // Default server error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Terjadi kesalahan internal server'
            : err.message || 'Internal Server Error',
    });
};

const notFound = (req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} tidak ditemukan` });
};

module.exports = { errorHandler, notFound };
