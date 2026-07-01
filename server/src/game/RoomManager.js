const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(hostId, hostName, hostSocket) {
        const roomCode = this.generateRoomCode();
        const room = new Room(roomCode, hostId);
        this.rooms.set(roomCode, room);
        
        room.addPlayer(hostId, hostName, hostSocket);
        
        hostSocket.send(JSON.stringify({
            type: 'room:created',
            payload: { roomCode }
        }));
        
        return room;
    }

    joinRoom(roomCode, playerId, playerName, playerSocket) {
        const room = this.rooms.get(roomCode);
        
        if (!room) {
            playerSocket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' }
            }));
            return null;
        }

        room.addPlayer(playerId, playerName, playerSocket);
        return room;
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(code));
        return code;
    }
}

// Singleton instance
module.exports = new RoomManager();
