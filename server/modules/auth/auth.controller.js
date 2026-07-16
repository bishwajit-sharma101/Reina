// 1. Core Imports
const asyncHandler = require('express-async-handler');
const debug = require('debug')('app:auth:controller');
const UserDto = require('../../shared/dtos/UserDto');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// 2. Service Import (Business Logic)
const authService = require('./auth.service');

// --- CONTROLLER FUNCTIONS ---

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
    debug('Received registration request.');
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please include a name, email, and password.');
    }

    const { user, token } = await authService.register({ name, email, password });

    // COOKIE #1 — JWT Token (Hardened)
    res.cookie('token', token, {
        httpOnly: false, // ⚡ Allow frontend to read token for socket connection
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, 
        sameSite: "lax"
    });

    // COOKIE #2 — User Info (frontend expects this)
    res.cookie('user', JSON.stringify(new UserDto(user)), {
        httpOnly: false,   // must be readable by frontend
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(201).json({
        success: true,
        user: new UserDto(user),
        message: 'Registration successful. User authenticated.',
    });
});

/**
 * @desc Authenticate a user and get token
 * @route POST /api/v1/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
    console.log("Login attempt -> req.body:", req.body);
    debug('Received login request.');
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password.');
    }

    const { user, token } = await authService.login(email, password);

    // COOKIE #1 — JWT Token (Hardened)
    res.cookie('token', token, {
        httpOnly: false, // ⚡ Allow frontend to read token for socket connection
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, 
        sameSite: "lax"
    });

    // COOKIE #2 — User Info
    res.cookie('user', JSON.stringify(new UserDto(user)), {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  console.log("Login attempt -> req.body:", req.body);
    res.status(200).json({
        success: true,
        user: new UserDto(user),
        message: 'Login successful. User authenticated.',
    });
  

});

/**
 * @desc Log out user / Clear cookie
 * @route GET /api/v1/auth/logout
 */
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('user', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: false,
        secure: false,
    });

    res.status(200).json({ success: true, message: 'User successfully logged out.' });
});

const googleAuth = asyncHandler(async (req, res) => {
    const { token } = req.body; // Token received from frontend

    // 1. Verify token with Google
    // Note: If using access_token (default in your React code), we fetch user info
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) {
        res.status(400);
        throw new Error('Invalid Google Token');
    }

    // 2. Use service to login/register
    const { user, token: systemToken } = await authService.googleLogin(googleData);

    // 3. Set Cookies (Matching your existing login logic)
    res.cookie('token', systemToken, {
        httpOnly: false, // ⚡ Allow frontend to read token for socket connection
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "lax"
    });

    res.cookie('user', JSON.stringify(new UserDto(user)), {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(200).json({
        success: true,
        user: new UserDto(user),
        message: 'Google login successful',
    });
});


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    googleAuth,
};
