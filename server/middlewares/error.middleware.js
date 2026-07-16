const debug = require('debug')('app:error');

// 1. Not Found (404) Handler
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the main error handler
};

// 2. Global Error Handler
const errorHandler = (err, req, res, next) => {
    // Determine status code: 200/500/etc.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Log the full error stack in development/debugging mode
    debug(`Processing Error: ${err.message} \n ${err.stack}`);

    res.json({
        message: err.message,
        // Only provide stack trace in development environment for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFoundHandler, errorHandler };