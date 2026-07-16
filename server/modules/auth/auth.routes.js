const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser,googleAuth } = require('./auth.controller');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
/**
 * @desc Authentication Routes for User Registration and Login
 * @route /api/v1/auth
 */

// POST /api/v1/auth/register
router.post('/register',authLimiter, registerUser);

// POST /api/v1/auth/login
router.post('/login',authLimiter, loginUser);

// GET /api/v1/auth/logout
router.get('/logout', logoutUser);

router.post('/google', googleAuth);

module.exports = router;