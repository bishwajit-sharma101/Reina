const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const debug = require('debug')('app:auth:model');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        unique:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        minlength: 6,
        select: false 
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true 
    },
    avatar: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        maxlength: 160,
        default: ""
    },
    interests: [{
        type: String
    }],
    role: {
        type: String,
        enum: ['user', 'primeUser', 'admin'],
        default: 'user',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    contacts: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastMessageAt: { type: Date, default: Date.now }
    }],
    preferredLanguage: {
        type: String,
        default: 'en',
        required: true,
        trim: true
    },
    // NEW: Quota Tracking
    neuralQuota: {
        type: Number,
        default: 50,
        min: 0
    },
    // NEW: Blocking System
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    // NEW: Last Seen Timestamp
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// PASSWORD HASHING MIDDLEWARE
userSchema.pre("save", async function(next) {
    if (!this.password || !this.isModified("password")) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        debug(`Password for user ${this.email} successfully hashed.`);
        next();
    } catch (error) {
        debug(`Error hashing password: ${error.message}`);
        next(error);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.index({ name: "text", email: "text" });

const User = mongoose.model("User", userSchema);
module.exports = User;