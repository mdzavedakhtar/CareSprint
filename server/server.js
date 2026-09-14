require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDatabase = require("./src/config/database");
const { initializeSockets } = require("./src/sockets");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

initializeSockets(io);

const startServer = async () => {
  try {
    await connectDatabase();

    server.listen(PORT, () => {
      console.log(`CareSprint API & Socket.IO server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();