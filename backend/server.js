const app=require("./src/app");
const {connectToDB}=require("./src/config/db");
const dotenv=require("dotenv");
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectToDB();

const PORT=process.env.PORT || 3000;

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join group rooms
    socket.on('join-group', (groupId) => {
        socket.join(`group:${groupId}`);
        console.log(`User ${socket.id} joined group:${groupId}`);
    });

    // Leave group room
    socket.on('leave-group', (groupId) => {
        socket.leave(`group:${groupId}`);
        console.log(`User ${socket.id} left group:${groupId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})