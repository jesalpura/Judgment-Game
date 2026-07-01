const { WebSocketServer } = require('ws');
const roomManager = require('../game/RoomManager');
const { generateId } = require('../utils/idGenerator');

function setupWebSocketServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        const playerId = generateId();
        let currentRoom = null;

        console.log(`Player connected: ${playerId}`);
        
        // Send identity to client
        ws.send(JSON.stringify({ type: 'identity', payload: { playerId } }));

        ws.on('message', (messageAsString) => {
            try {
                const message = JSON.parse(messageAsString);
                handleEvent(ws, playerId, message, (room) => { currentRoom = room; });
            } catch (err) {
                console.error('Error parsing message', err);
            }
        });

        ws.on('close', () => {
            console.log(`Player disconnected: ${playerId}`);
            if (currentRoom) {
                currentRoom.removePlayer(playerId);
            }
        });
    });
}

function handleEvent(ws, playerId, message, setCurrentRoom) {
    const { type, payload } = message;

    switch (type) {
        case 'room:create': {
            const { hostName } = payload;
            const room = roomManager.createRoom(playerId, hostName, ws);
            setCurrentRoom(room);
            break;
        }
        case 'room:join': {
            const { roomCode, playerName } = payload;
            const room = roomManager.joinRoom(roomCode, playerId, playerName, ws);
            if (room) {
                setCurrentRoom(room);
            }
            break;
        }
        case 'game:start': {
            const { roomCode } = payload;
            const room = roomManager.getRoom(roomCode);
            if (room && room.hostId === playerId) {
                room.startGame();
            }
            break;
        }
        case 'bid:submit': {
            const { roomCode, bidAmount } = payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
                room.submitBid(playerId, bidAmount);
            }
            break;
        }
        case 'card:play': {
            const { roomCode, card } = payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
                room.playCard(playerId, card);
            }
            break;
        }
        default:
            console.log('Unknown message type', type);
    }
}

module.exports = setupWebSocketServer;
