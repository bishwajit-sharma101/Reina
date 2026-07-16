const http = require("http");
const app = require("./app");
const initSocket = require("./socket/socket");

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapper
const server = http.createServer(app);

// Initialize socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
