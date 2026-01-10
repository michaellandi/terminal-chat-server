const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store messages in memory (resets on server restart)
const rooms = {};

// Serve static files
app.use(express.static('public'));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        
        // Send existing messages to new user
        if (rooms[roomId]) {
            socket.emit('load-messages', rooms[roomId]);
        }
        
        console.log(`User ${socket.id} joined room ${roomId}`);
    });
    
    socket.on('send-message', (data) => {
        const { roomId, user, text, type } = data;
        
        // Store message
        if (!rooms[roomId]) rooms[roomId] = [];
        
        const message = {
            user,
            text,
            type: type || 'user',
            time: Date.now()
        };
        
        rooms[roomId].push(message);
        
        // Keep only last 100 messages per room
        if (rooms[roomId].length > 100) {
            rooms[roomId] = rooms[roomId].slice(-100);
        }
        
        // Broadcast to all users in room
        io.to(roomId).emit('new-message', message);
        
        console.log(`Message in room ${roomId}: ${user}: ${text}`);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
