import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket(url) {
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [hand, setHand] = useState([]);
    const [trumpSuit, setTrumpSuit] = useState('');
    
    // We use a ref so we can use the latest value in the message handler without stale closures
    const stateRef = useRef(null);
    stateRef.current = { gameState, playerId };

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('Connected to server');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received:', message);

            if (message.type === 'identity') {
                setPlayerId(message.payload.playerId);
            } else if (message.type === 'room:created') {
                // Host receives code
            } else if (message.type === 'room:state') {
                setGameState(message.payload);
            } else if (message.type === 'round:dealt') {
                setHand(message.payload.hand);
                setTrumpSuit(message.payload.trumpSuit);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    const sendEvent = useCallback((type, payload) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type, payload }));
        }
    }, [socket]);

    return { gameState, playerId, hand, setHand, trumpSuit, sendEvent };
}
