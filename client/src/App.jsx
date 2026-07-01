import { useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import './styles/globals.css'

function App() {
  const { gameState, playerId, hand, setHand, trumpSuit, sendEvent } = useWebSocket('ws://localhost:4000');
  
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [bidInput, setBidInput] = useState(0);

  const handleCreateRoom = () => {
      sendEvent('room:create', { hostName: playerName || 'Player1' });
  };

  const handleJoinRoom = () => {
      sendEvent('room:join', { roomCode: roomCodeInput.toUpperCase(), playerName: playerName || 'Player2' });
  };
  
  const getSuitSymbol = (suit) => {
      switch(suit) {
          case 'S': return '♠';
          case 'H': return '♥';
          case 'D': return '♦';
          case 'C': return '♣';
          default: return suit;
      }
  };

  const handleStartGame = () => {
      if (gameState && gameState.code) {
          sendEvent('game:start', { roomCode: gameState.code });
      }
  };

  const handleSubmitBid = () => {
      if (gameState && gameState.code) {
          sendEvent('bid:submit', { roomCode: gameState.code, bidAmount: parseInt(bidInput, 10) });
      }
  };

  const handlePlayCard = (card) => {
      if (gameState && gameState.status === 'playing' && gameState.players[gameState.turnIndex].id === playerId) {
          sendEvent('card:play', { roomCode: gameState.code, card });
          // Optimistically remove from hand
          setHand(prev => prev.filter(c => !(c.suit === card.suit && c.rank === card.rank)));
      }
  };

  if (!gameState) {
      return (
          <div className="container center-screen glass-panel">
              <h1 className="title">Judgment</h1>
              
              <div className="input-group">
                  <label>Your Name</label>
                  <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name" />
              </div>
              
              <div className="action-row">
                  <button className="btn-primary" onClick={handleCreateRoom}>Create Room</button>
              </div>
              
              <div className="divider">OR</div>
              
              <div className="input-group">
                  <input type="text" value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value)} placeholder="Room Code" maxLength={4} />
                  <button className="btn-secondary" onClick={handleJoinRoom}>Join Room</button>
              </div>
          </div>
      )
  }

  return (
    <div className="container">
      <header className="game-header">
        <h2>Room: {gameState.code}</h2>
        <div className="status-badge">Status: {gameState.status}</div>
      </header>

      <div className="main-content">
          <div className="players-panel glass-panel">
              <h3>Players</h3>
              <ul>
                  {gameState.players.map((p, index) => (
                      <li key={p.id} className={p.id === playerId ? 'me' : ''}>
                          {p.name} {p.id === gameState.hostId ? '(Host)' : ''} 
                          {gameState.status === 'bidding' && gameState.turnIndex === index ? ' 👈 (Bidding)' : ''}
                          {gameState.status === 'playing' && gameState.turnIndex === index ? ' 👈 (Playing)' : ''}
                          <br/>
                          {gameState.bids && gameState.bids[p.id] !== undefined ? <span style={{fontSize:'0.85em', color: '#94a3b8'}}>Bid: {gameState.bids[p.id]}</span> : ''}
                          {gameState.tricksWon && gameState.tricksWon[p.id] !== undefined ? <span style={{fontSize:'0.85em', color: '#10b981', marginLeft: '10px'}}>Tricks: {gameState.tricksWon[p.id]}</span> : ''}
                      </li>
                  ))}
              </ul>
              
              {gameState.status === 'lobby' && gameState.hostId === playerId && (
                  <button className="btn-primary start-btn" onClick={handleStartGame}>Start Game</button>
              )}
          </div>
          
          <div className="game-board">
              {gameState.status === 'bidding' || gameState.status === 'playing' ? (
                  <div className="play-area glass-panel">
                      <h3>{gameState.status === 'bidding' ? 'Bidding Phase' : 'Trick Play Phase'}</h3>
                      {trumpSuit && <div className="status-badge" style={{marginBottom:'1rem', background:'#a855f7'}}>Trump: {trumpSuit}</div>}
                      
                      {gameState.status === 'bidding' && (
                          <div className="bidding-controls">
                              {gameState.players[gameState.turnIndex]?.id === playerId ? (
                                  <div>
                                      <p>Your turn to bid!</p>
                                      <input type="number" min="0" max={hand.length} value={bidInput} onChange={e => setBidInput(e.target.value)} />
                                      <button className="btn-primary" onClick={handleSubmitBid} style={{marginTop: '10px'}}>Submit Bid</button>
                                  </div>
                              ) : (
                                  <p>Waiting for {gameState.players[gameState.turnIndex]?.name} to bid...</p>
                              )}
                          </div>
                      )}

                      {gameState.status === 'playing' && (
                          <div className="trick-area">
                              <p>Current Trick:</p>
                              <div className="cards-container" style={{justifyContent: 'center', minHeight: '150px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px'}}>
                                  {gameState.currentTrick && gameState.currentTrick.map((play, idx) => {
                                      const isRed = play.card.suit === 'H' || play.card.suit === 'D';
                                      const symbol = getSuitSymbol(play.card.suit);
                                      return (
                                          <div key={idx} className="card" style={{transform: 'scale(0.9)'}}>
                                              <div className={`card-top-left ${isRed ? 'red' : 'black'}`}>
                                                  <span>{play.card.rank}</span>
                                                  <span>{symbol}</span>
                                              </div>
                                              <div className={`card-center ${isRed ? 'red' : 'black'}`}>
                                                  {symbol}
                                              </div>
                                              <div className={`card-bottom-right ${isRed ? 'red' : 'black'}`}>
                                                  <span>{play.card.rank}</span>
                                                  <span>{symbol}</span>
                                              </div>
                                              <div style={{fontSize: '0.6em', color: 'gray', position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>
                                                  {gameState.players.find(p => p.id === play.playerId)?.name}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                              <p style={{marginTop: '1rem', textAlign: 'center'}}>
                                  {gameState.players[gameState.turnIndex]?.id === playerId ? "Your turn to play!" : `Waiting for ${gameState.players[gameState.turnIndex]?.name}...`}
                              </p>
                          </div>
                      )}

                      <p style={{marginTop: '2rem'}}>Your Hand:</p>
                      <div className="cards-container">
                          {hand.map((card, idx) => {
                              const isMyTurn = gameState.status === 'playing' && gameState.players[gameState.turnIndex]?.id === playerId;
                              const isRed = card.suit === 'H' || card.suit === 'D';
                              const symbol = getSuitSymbol(card.suit);
                              return (
                                  <div key={idx} className="card" 
                                       onClick={() => handlePlayCard(card)}
                                       style={{ cursor: isMyTurn ? 'pointer' : 'default', opacity: isMyTurn ? 1 : 0.8 }}>
                                      <div className={`card-top-left ${isRed ? 'red' : 'black'}`}>
                                          <span>{card.rank}</span>
                                          <span>{symbol}</span>
                                      </div>
                                      <div className={`card-center ${isRed ? 'red' : 'black'}`}>
                                          {symbol}
                                      </div>
                                      <div className={`card-bottom-right ${isRed ? 'red' : 'black'}`}>
                                          <span>{card.rank}</span>
                                          <span>{symbol}</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ) : (
                  <div className="waiting-area glass-panel">
                      Waiting for host to start the game...
                  </div>
              )}
          </div>
      </div>
    </div>
  )
}

export default App
