import { useEffect, useRef, useState } from 'react';
import { GameState, Customer, BarObject } from '../types/game';
import { drawGame } from '../utils/renderer';
import { updateGameState, tryDeliverOrder } from '../utils/gameLogic';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CUSTOMER_SIZE = 25; // Match the size from renderer.ts

const initialBarObjects: BarObject[] = [
  { 
    type: 'counter',
    position: { x: 300, y: 400 },
    width: 200,
    height: 40,
    description: 'A wooden bar counter where customers place their orders'
  },
  { 
    type: 'beer-tap',
    position: { x: 350, y: 380 },
    width: 30,
    height: 40,
    description: 'A shiny chrome beer tap with multiple handles for different beers'
  },
  { 
    type: 'kitchen',
    position: { x: 400, y: 360 },
    width: 80,
    height: 60,
    description: 'A busy kitchen area with a grill and food preparation station'
  },
  { 
    type: 'serving-area',
    position: { x: 450, y: 380 },
    width: 40,
    height: 40,
    description: 'A serving counter where completed orders are placed'
  },
];

const BEERS = ['Lager', 'IPA', 'Stout', 'Pale Ale', 'Wheat Beer'];
const FOODS = ['Burger', 'Wings', 'Nachos', 'Fries', 'Pizza'];

const initialGameState: GameState = {
  customers: [],
  orders: [],
  playerPosition: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  score: 0,
  money: 100,
  gameTime: Date.now(),
  lastSpawnTime: Date.now(),
  playerInventory: {
    type: 'none',
    name: '',
  },
};

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isGameRunning, setIsGameRunning] = useState(true);

  const restartGame = () => {
    const currentTime = Date.now();
    setGameState({
      ...initialGameState,
      gameTime: currentTime,
      lastSpawnTime: currentTime,
    });
    setIsGameRunning(true);
  };

  const skipTime = () => {
    const currentTime = Date.now();
    setGameState(prevState => ({
      ...prevState,
      gameTime: currentTime,
      lastSpawnTime: 0, // Force spawn on next update
    }));
  };

  const isClickInObject = (x: number, y: number, obj: BarObject) => {
    return x >= obj.position.x &&
           x <= obj.position.x + obj.width &&
           y >= obj.position.y &&
           y <= obj.position.y + obj.height;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for clicks on customers first
    const clickedCustomer = gameState.customers.find(customer => {
      const dx = customer.position.x - x;
      const dy = customer.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < CUSTOMER_SIZE;
    });

    if (clickedCustomer) {
      setGameState(prevState => {
        // First try to deliver the order
        const afterDelivery = tryDeliverOrder(prevState, clickedCustomer.id);
        // Then always clear inventory regardless of delivery success
        return {
          ...afterDelivery,
          playerInventory: {
            type: 'none',
            name: '',
          }
        };
      });
      return;
    }

    // Check for clicks on bar objects
    initialBarObjects.forEach(obj => {
      if (isClickInObject(x, y, obj)) {
        switch (obj.type) {
          case 'beer-tap':
            // Always pick up a new beer, regardless of current inventory
            const randomBeer = BEERS[Math.floor(Math.random() * BEERS.length)];
            setGameState(prevState => ({
              ...prevState,
              playerInventory: {
                type: 'beer',
                name: randomBeer,
              },
            }));
            break;
          case 'kitchen':
            // Always pick up new food, regardless of current inventory
            const randomFood = FOODS[Math.floor(Math.random() * FOODS.length)];
            setGameState(prevState => ({
              ...prevState,
              playerInventory: {
                type: 'food',
                name: randomFood,
              },
            }));
            break;
          case 'serving-area':
            // Clear inventory when placing on serving area
            setGameState(prevState => ({
              ...prevState,
              playerInventory: {
                type: 'none',
                name: '',
              },
            }));
            break;
        }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrameId: number;

    const gameLoop = () => {
      if (!isGameRunning) return;

      const currentTime = Date.now();
      setGameState(prevState => updateGameState(prevState, currentTime));
      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawGame(context, gameState, initialBarObjects);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, isGameRunning]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isGameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setGameState(prevState => ({
      ...prevState,
      playerPosition: { x, y },
    }));
  };

  return (
    <div className="game-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ border: '1px solid black' }}
      />
      <div className="game-legend">
        <h3>Legend:</h3>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#C0C0C0' }}></div>
          <span>Beer Tap - Click to get beer</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FFD700' }}></div>
          <span>Kitchen - Click to prepare food</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#8B4513' }}></div>
          <span>Counter - Where customers wait</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#DEB887' }}></div>
          <span>Serving Area - Place completed orders</span>
        </div>
      </div>
      <div className="game-controls">
        <button className="restart-button" onClick={restartGame}>
          Restart Game
        </button>
        <button className="skip-button" onClick={skipTime}>
          Skip to Next Customer
        </button>
      </div>
    </div>
  );
}; 