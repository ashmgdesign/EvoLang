const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve the static files from the public folder
app.use(express.static(path.join(__dirname, './public')));

// Listen for incoming connections from clients
io.on('connection', (socket) => {
    console.log('A user has connected');

    // Listen for incoming chat messages from clients
    socket.on('chat message', (msg) => {
        console.log(`Message: ${msg}`);
        io.emit('chat message', msg); // Broadcast the message to all connected clients
    });

    // Listen for disconnections from clients
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });
});

app.get('/', (req, res) => {
    res.render("index.html")
})

// Start the server
server.listen(3000, () => {
    console.log('Server started on port 3000');
});
