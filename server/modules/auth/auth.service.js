// 1. Core Imports
const debug = require('debug')('app:auth:service');
const User = require('../user-management/models/user.model'); 
const jwt = require('jsonwebtoken'); // CHANGED: Import JWT

// CHANGED: Real Token Generation
const generateToken = (userId) => {
    debug(`Generating token for user ID: ${userId}`);
    const secret = (process.env.JWT_SECRET || "").trim();
    if (!secret) {
        console.error("❌ CRITICAL: JWT_SECRET not found in environment!");
        throw new Error('Internal server configuration error');
    }
    return jwt.sign({ id: userId }, secret, {
        expiresIn: '7d', 
    });
};

/**
 * IMPLEMENTED: Handles user registration logic.
 */
const register = async ({ name, email, password }) => {
    debug(`Attempting to register user: ${email}`);

    const userExists = await User.findOne({ email });

    if (userExists) {
        debug(`Registration failed: User with email ${email} already exists.`);
        const error = new Error('User already exists with this email address.');
        error.status = 400; 
        throw error;
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        debug(`User ${email} created successfully with ID: ${user._id}`);
        
        // 3. Generate token
        const token = generateToken(user._id);
        
        return { user, token };
    } else {
        debug('Registration failed: User creation failed.');
        const error = new Error('Invalid user data provided.');
        error.status = 500; 
        throw error;
    }
};

/**
 * Handles user login logic.
 */
const login = async (email, password) => {
    // 1. Find user by email AND explicitly select the hidden password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists and if password matches
    if (user && (await user.matchPassword(password))) {
        debug(`Login successful for user ${email}`);
        const token = generateToken(user._id);
        
        // Remove password from the user object before returning so it's not sent to frontend
        user.password = undefined; 
        
        return { user, token };
    } else {
        debug(`Login failed: Invalid credentials for ${email}`);
        const error = new Error('Invalid credentials.');
        error.status = 401; // Unauthorized
        throw error;
    }
};

const googleLogin = async (googleData) => {
    const { email, name, picture } = googleData;

    // 1. Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
        // 2. If not, create them (with a random password since they use Google)
        debug(`Creating new Google user: ${email}`);
        user = await User.create({
            name,
            email,
            password: Math.random().toString(36).slice(-16), // Dummy password
            avatar: picture,
            role: 'user'
        });
    }

    // 3. Generate your system token
    const token = generateToken(user._id);
    return { user, token };
};

module.exports = {
    register,
    login,
    googleLogin,
    generateToken,
};