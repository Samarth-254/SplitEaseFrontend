// Load environment variables FIRST before any other imports
const dotenv=require("dotenv");
dotenv.config();

const app=require("./src/app");
const {connectToDB}=require("./src/config/db");
const http = require('http');
const { Server } = require('socket.io');
connectToDB();

const PORT=process.env.PORT || 3000;

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

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-group', (groupId) => {
        socket.join(`group:${groupId}`);
        console.log(`User ${socket.id} joined group:${groupId}`);
    });

    socket.on('leave-group', (groupId) => {
        socket.leave(`group:${groupId}`);
        console.log(`User ${socket.id} left group:${groupId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.set('io', io);

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})