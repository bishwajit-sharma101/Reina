const debug = require('debug')('app:error');

// 1. Not Found (404) Handler
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the main error handler
};

// 2. Global Error Handler
const errorHandler = (err, req, res, next) => {
    // Determine status code: prioritize err.status or err.statusCode, fallback to res.statusCode or 500
    let statusCode = err.status || err.statusCode || res.statusCode;
    if (statusCode === 200) statusCode = 500;
    
    res.status(statusCode);

    console.error(`GLOBAL ERROR HANDLER CAUGHT [${statusCode}]:`, err); // ADDED FOR VISIBILITY

    // Log the full error stack in development/debugging mode
    debug(`Processing Error: ${err.message} \n ${err.stack}`);

    res.json({
        message: err.message,
        // Only provide stack trace in development environment for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFoundHandler, errorHandler };