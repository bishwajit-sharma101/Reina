const mongoose = require('mongoose');
const debug = require('debug')('app:db');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // ⚡ PERFORMANCE: Connection Pooling for 1000 users
            maxPoolSize: 100, 
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("mongodb connected with high-concurrency pool");
        debug(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        debug(`Error: ${error.message}`);
        console.log("error in db.config.js");
        process.exit(1); 
    }
};

module.exports = connectDB;