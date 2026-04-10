const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This tells the server to serve your game from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Basic Matchmaking
    if (waitingPlayer && waitingPlayer.id !== socket.id) {
        const roomName = `room-${waitingPlayer.id}-${socket.id}`;
        socket.join(roomName);
        waitingPlayer.join(roomName);

        io.to(roomName).emit('startGame', { 
            room: roomName, 
            p1: waitingPlayer.id, 
            p2: socket.id 
        });
        waitingPlayer = null; 
    } else {
        waitingPlayer = socket;
        socket.emit('status', 'Waiting for an opponent...');
    }

    // Sync player movements
    socket.on('move', (data) => {
        socket.to(data.room).emit('opponentMove', data);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) waitingPlayer = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Game running on port ${PORT}`));
