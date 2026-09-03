const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token || token === 'null' || token === 'undefined') {    
                throw new Error('Valid token missing');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                console.error(`[Auth] JWT Verify Failed on ${req.originalUrl}:`, err.message);
                return res.status(402).json({ message: 'JWT Verify Failed: ' + err.message });
            }

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                console.error(`[Auth] User not found for id ${decoded.id} on ${req.originalUrl}`);
                return res.status(403).json({ message: 'User no longer exists' });
            }

            next();
        } catch (error) {
            console.error("[Auth] DB Error:", error);
            res.status(500).json({ message: 'Internal Server Error during authentication' });
        }
    }

    if (!token) {
        console.error(`[Auth] No token provided on ${req.originalUrl}`);
        res.status(400).json({ message: 'Not authorized, no token' });
    }
};

const optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (token && token !== 'null' && token !== 'undefined') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            }
        } catch (error) {
            // Silently fail for optional protect
        }
    }
    next();
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin, optionalProtect };