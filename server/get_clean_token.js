const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./modules/user-management/models/user.model');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'tester@astrix.com' });
        const secret = (process.env.JWT_SECRET || "").trim();
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
        process.stdout.write(token); // Print ONLY the token
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
run();
