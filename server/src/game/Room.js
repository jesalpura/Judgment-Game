const Deck = require('./Deck');

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = []; // Array of { id, name, socket }
        this.status = 'lobby'; // lobby, bidding, playing, ended
        this.currentRound = null;
        this.bids = {}; // playerId -> bid amount
        this.turnIndex = 0; // index of player in this.players
        this.currentTrick = []; // [{ playerId, card }]
        this.tricksWon = {}; // playerId -> count
        this.trumpSuit = 'S'; // Just default to Spades for prototype
        this.leaderIndex = 0;
    }

    addPlayer(playerId, name, socket) {
        const existing = this.players.find(p => p.id === playerId);
        if (!existing) {
            this.players.push({ id: playerId, name, socket, hand: [] });
        } else {
            existing.socket = socket;
        }
        this.broadcastState();
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.broadcastState();
    }

    startGame() {
        if (this.players.length < 2) {
            return;
        }
        this.status = 'bidding';
        this.bids = {};
        this.tricksWon = {};
        this.currentTrick = [];
        this.turnIndex = 0;
        this.leaderIndex = 0;
        
        const suits = ['S', 'H', 'D', 'C'];
        this.trumpSuit = suits[Math.floor(Math.random() * suits.length)];
        
        const deck = new Deck();
        const cardsPerPlayer = 5;

        this.players.forEach(p => {
            p.hand = deck.draw(cardsPerPlayer);
            this.tricksWon[p.id] = 0;
            p.socket.send(JSON.stringify({
                type: 'round:dealt',
                payload: { hand: p.hand, trumpSuit: this.trumpSuit }
            }));
        });

        this.broadcastState();
    }

    submitBid(playerId, bidAmount) {
        if (this.status !== 'bidding') return;
        
        const currentPlayer = this.players[this.turnIndex];
        if (currentPlayer.id !== playerId) return;

        this.bids[playerId] = bidAmount;
        this.turnIndex++;

        if (this.turnIndex >= this.players.length) {
            this.status = 'playing';
            this.turnIndex = this.leaderIndex;
        }

        this.broadcastState();
    }

    playCard(playerId, cardToPlay) {
        if (this.status !== 'playing') return;

        const currentPlayer = this.players[this.turnIndex];
        if (currentPlayer.id !== playerId) return;

        // Check if they actually have the card (simple equality check)
        const hasCard = currentPlayer.hand.some(c => c.suit === cardToPlay.suit && c.rank === cardToPlay.rank);
        if (!hasCard) return;

        // Remove card from hand
        currentPlayer.hand = currentPlayer.hand.filter(c => !(c.suit === cardToPlay.suit && c.rank === cardToPlay.rank));

        // Add to trick
        this.currentTrick.push({ playerId, card: cardToPlay });

        // Advance turn
        this.turnIndex = (this.turnIndex + 1) % this.players.length;

        // Resolve trick if everyone played
        if (this.currentTrick.length === this.players.length) {
            this.resolveTrick();
        } else {
            this.broadcastState();
        }
    }

    resolveTrick() {
        // Very basic resolution (ignore trump/suit rules for simplicity of prototype, just random winner or first player)
        // Wait, let's just say the highest rank of the led suit wins. If trump is played, highest trump wins.
        const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        
        const ledSuit = this.currentTrick[0].card.suit;
        let winnerIndex = 0;
        let highestValue = rankValues[this.currentTrick[0].card.rank];
        let hasTrump = this.currentTrick[0].card.suit === this.trumpSuit;

        for (let i = 1; i < this.currentTrick.length; i++) {
            const play = this.currentTrick[i];
            const isTrump = play.card.suit === this.trumpSuit;
            const val = rankValues[play.card.rank];

            if (isTrump && !hasTrump) {
                hasTrump = true;
                highestValue = val;
                winnerIndex = i;
            } else if (isTrump && hasTrump) {
                if (val > highestValue) {
                    highestValue = val;
                    winnerIndex = i;
                }
            } else if (!hasTrump && play.card.suit === ledSuit) {
                if (val > highestValue) {
                    highestValue = val;
                    winnerIndex = i;
                }
            }
        }

        const winningPlay = this.currentTrick[winnerIndex];
        this.tricksWon[winningPlay.playerId]++;
        
        // Winner leads next trick
        this.leaderIndex = this.players.findIndex(p => p.id === winningPlay.playerId);
        this.turnIndex = this.leaderIndex;

        // Broadcast the trick result briefly before clearing
        this.broadcastState();

        setTimeout(() => {
            this.currentTrick = [];
            
            // Check if round ended (hands empty)
            if (this.players[0].hand.length === 0) {
                this.status = 'ended';
            }
            this.broadcastState();
        }, 2000);
    }

    getSafeState() {
        return {
            code: this.code,
            hostId: this.hostId,
            status: this.status,
            turnIndex: this.turnIndex,
            bids: this.bids,
            currentTrick: this.currentTrick,
            tricksWon: this.tricksWon,
            trumpSuit: this.trumpSuit,
            players: this.players.map(p => ({ id: p.id, name: p.name }))
        };
    }

    broadcastState() {
        const stateMsg = JSON.stringify({
            type: 'room:state',
            payload: this.getSafeState()
        });

        this.players.forEach(p => {
            if (p.socket.readyState === 1) { // OPEN
                p.socket.send(stateMsg);
            }
        });
    }
}

module.exports = Room;
