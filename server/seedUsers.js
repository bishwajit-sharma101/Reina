const bcrypt = require('bcryptjs');
const connectDB = require('./config/db.config');
const { faker } = require('@faker-js/faker');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname,'..', '.env') });

// 1. IMPORT YOUR USER MODEL
// ⚠️ Adjust this path to match exactly where your user.model.js is!
const User = require('./modules/user-management/models/user.model'); 
// Example paths: './models/user.model' or './src/models/user.model'

const seedUsers = async () => {
    try {
        // 2. CONNECT TO DB
        await connectDB();
        console.log("✅ Connected to MongoDB...");

        // Optional: Clear existing users (Uncomment if you want a fresh start)
        // await User.deleteMany({});
        // console.log("🗑️ Cleared existing users...");

        const users = [];
        // Hash a default password for everyone (e.g., 'password123')
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        console.log("⏳ Generating 200 users...");

        for (let i = 0; i < 200; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const name = `${firstName} ${lastName}`;
            
            // Generate a realistic avatar using Dicebear
            const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`;

            users.push({
                name: name,
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                password: hashedPassword,
                avatar: avatar,
                about: faker.person.bio(), // Random bio
                lastSeen: faker.date.recent({ days: 7 }), // Random time in last 7 days
                isOnline: Math.random() < 0.2, // 20% chance to be "online"
            });
        }

        // 3. INSERT INTO DB
        await User.insertMany(users);
        console.log("🎉 Successfully added 200 users!");

        process.exit();
    } catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();