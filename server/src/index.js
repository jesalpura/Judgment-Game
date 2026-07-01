const http = require('http');
const express = require('express');
const setupWebSocketServer = require('./ws/socketServer');

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Attach WebSocket server
setupWebSocketServer(server);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
