module.exports = {
  apps: [{
    name: "astrix-backend",
    script: "./server.js",
    instances: "max", // Uses all CPU cores (Clustering)
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production",
      JWT_SECRET: process.env.JWT_SECRET, // Ensure these are loaded
      MONGO_URI: process.env.MONGO_URI
    },
    // Auto-restart if it crashes
    autorestart: true,
    watch: false,
    max_memory_restart: '1G' // Restart if it leaks memory
  }]
};