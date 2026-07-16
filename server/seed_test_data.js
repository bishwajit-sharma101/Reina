const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./modules/user-management/models/user.model');
const Post = require('./modules/posts/models/post.model');
const Message = require('./modules/chat/models/message.model');
const dotenv = require('dotenv');
dotenv.config();

async function seed() {
  try {
    console.log("🌱 Connecting to MongoDB for seeding...");
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Create a Test User
    let testUser = await User.findOne({ email: 'tester@astrix.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Stress Tester',
        email: 'tester@astrix.com',
        password: 'password123',
        role: 'user'
      });
    }
    const userId = testUser._id;

    // 2. Seed Posts (1000)
    console.log("📝 Seeding 1,000 posts...");
    const posts = [];
    for (let i = 0; i < 1000; i++) {
        posts.push({
            author: userId,
            content: { original: faker.lorem.paragraph(), translations: {} },
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 10),
            createdAt: faker.date.recent()
        });
    }
    await Post.deleteMany({ author: userId });
    await Post.insertMany(posts);

    // 3. Seed Messages (1000)
    console.log("💬 Seeding 1,000 messages...");
    const messages = [];
    for (let i = 0; i < 1000; i++) {
        messages.push({
            from: userId,
            to: userId, // chatting with self for simplicity
            content: { original: faker.lorem.sentence() },
            createdAt: faker.date.recent()
        });
    }
    await Message.deleteMany({ from: userId });
    await Message.insertMany(messages);

    console.log("✅ Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
