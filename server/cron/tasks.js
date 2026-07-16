const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Message = require('../modules/chat/models/message.model');

// Execute every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log("🕒 [CRON] Starting daily system maintenance...");

    // 1. Data Backup (Mongodump)
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const dateStr = new Date().toISOString().split('T')[0];
    const backupPath = path.join(backupDir, `backup-${dateStr}`);
    
    // Safety check: ensure MONGO_URI is defined
    if (process.env.MONGO_URI) {
        // mongodump requires mongo-tools installed on the host. 
        // We will execute it gracefully to prevent crash if not installed.
        exec(`mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.warn("⚠️ [CRON] Mongodump failed (Requires mongo-tools installed on host).");
            } else {
                console.log(`✅ [CRON] Database backup created at ${backupPath}`);
            }
        });
    }

    // 2. Storage Sweeper (Cleanup Uploads)
    try {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) return;

        const files = fs.readdirSync(uploadDir);
        let deletedCount = 0;

        for (const file of files) {
            // Find if any message references this file
            const inUse = await Message.exists({ 'media.url': `/uploads/${file}` });
            
            if (!inUse) {
                // Not in use, optionally check file age to avoid deleting currently uploading files
                const filePath = path.join(uploadDir, file);
                const stats = fs.statSync(filePath);
                
                // If not in DB and older than 1 day (86400000 ms), delete it.
                if (Date.now() - stats.mtimeMs > 86400000) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
        }
        console.log(`✅ [CRON] Swept ${deletedCount} unused/dangling media files.`);
    } catch (err) {
        console.error("❌ [CRON] Storage sweeper error:", err.message);
    }
});

console.log("🚀 Background CRON daemons initialized.");
