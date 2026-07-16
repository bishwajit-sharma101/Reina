const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./modules/user-management/models/user.model');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'tester@astrix.com' });
        if (!user) {
            console.error("User not found! Run seeder first.");
            process.exit(1);
        }
        
        const secret = (process.env.JWT_SECRET || "").trim();
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
        
        console.log("USER_ID:", user._id.toString());
        console.log("TOKEN:", token);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
