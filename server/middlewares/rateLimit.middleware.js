const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});

// Stricter limit for Auth routes (Brute force protection)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 login attempts per hour per IP
  message: {
    success: false,
    message: "Too many login attempts, please try again in an hour."
  }
});

module.exports = { limiter, authLimiter };