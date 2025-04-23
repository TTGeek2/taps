import { GameCanvas } from './components/GameCanvas';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Bar Game</h1>
      <div className="game-container">
        <GameCanvas />
      </div>
      <div className="instructions">
        <h2>How to Play</h2>
        <ul>
          <li>Move the bartender with your mouse</li>
          <li>Click on customers to take their orders</li>
          <li>Click on the beer tap to pour drinks</li>
          <li>Click on the kitchen to prepare food</li>
          <li>Click on customers with their completed orders to serve them</li>
          <li>Keep customers happy by serving them quickly!</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
