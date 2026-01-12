const dotenv = require("dotenv");
dotenv.config();

const app = require("./src/app");
const { connectToDB } = require("./src/config/db");
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');  // ✅ ADD THIS

connectToDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ ADD SOCKET AUTHENTICATION MIDDLEWARE
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id, 'UserId:', socket.userId);

    // ✅ AUTO-JOIN user's personal room (for push subscription events)
    socket.join(socket.userId);
    console.log(`User ${socket.id} auto-joined room: ${socket.userId}`);

    socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`User ${socket.id} joined user room:${userId}`);
    });

    socket.on('join-group', (groupId) => {
        socket.join(`group:${groupId}`);
        console.log(`User ${socket.id} joined group:${groupId}`);
    });

    socket.on('leave-group', (groupId) => {
        socket.leave(`group:${groupId}`);
        console.log(`User ${socket.id} left group:${groupId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
