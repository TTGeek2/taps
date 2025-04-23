import { GameState, Customer, Order, OrderItem } from '../types/game';

const CUSTOMER_SPAWN_INTERVAL = 5000; // 5 seconds in milliseconds
const MOOD_DECAY_RATE = 2; // points per second (reduced from 5 to make it more forgiving)
const INITIAL_MOOD_RANGE = { min: 50, max: 100 };
const ANGRY_CUSTOMER_CHANCE = 0.2;

// Waiting time ranges in milliseconds
const WAITING_TIME_RANGE = {
  beer: {
    min: 3000000,  // 30 seconds
    max: 60000000   // 60 seconds
  },
  food: {
    min: 4500000,  // 45 seconds
    max: 9000000   // 90 seconds
  }
};

const HAIR_COLORS = ['#000000', '#8B4513', '#D4A017', '#800517', '#C0C0C0'];
const SHIRT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A017'];

export function updateGameState(prevState: GameState, currentTime: number): GameState {
  const newState = { ...prevState };
  
  // Update game time to match real time
  newState.gameTime = currentTime;

  // Check if it's time to spawn a new customer
  const timeSinceLastSpawn = currentTime - (prevState.lastSpawnTime || 0);
  if (timeSinceLastSpawn >= CUSTOMER_SPAWN_INTERVAL) {
    spawnCustomer(newState);
    newState.lastSpawnTime = currentTime;
  }

  // Update customers
  newState.customers = newState.customers.map(customer => 
    updateCustomer(customer, timeSinceLastSpawn / 1000)
  );

  // Remove served customers who have left
  newState.customers = newState.customers.filter(
    customer => customer.state !== 'leaving' || customer.position.y > 0
  );

  return newState;
}

export function tryDeliverOrder(state: GameState, customerId: string): GameState {
  const newState = { ...state };
  const customer = newState.customers.find(c => c.id === customerId);
  
  if (!customer || customer.state !== 'waiting' || !customer.order) {
    return newState;
  }

  // Check if the player's inventory matches any incomplete item in the customer's order
  const matchingItem = customer.order.items.find(
    item => !item.completed && 
    item.type === newState.playerInventory.type &&
    item.name === newState.playerInventory.name
  );

  if (matchingItem) {
    // Mark the item as completed
    matchingItem.completed = true;

    // Clear player's inventory
    newState.playerInventory = { type: 'none', name: '' };

    // Stop mood decay for this customer by setting a flag
    customer.orderInProgress = true;

    // Check if all items are completed
    const allCompleted = customer.order.items.every(item => item.completed);
    if (allCompleted) {
      // Convert remaining happiness into cash
      const happinessBonus = Math.floor(customer.mood);
      newState.money += happinessBonus;
      
      // Add base reward
      const baseReward = 20;
      newState.money += baseReward;
      
      // Update score
      newState.score += baseReward + happinessBonus;

      // Mark customer as served
      customer.state = 'served';
    }
  }

  return newState;
}

function generateCustomerAppearance() {
  return {
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
    hasBeard: Math.random() > 0.7,
  };
}

function calculateMaxWaitingTime(order: Order): number {
  // Calculate the maximum waiting time based on the order items
  let maxTime = 0;
  order.items.forEach(item => {
    const range = item.type === 'beer' ? WAITING_TIME_RANGE.beer : WAITING_TIME_RANGE.food;
    const itemWaitTime = Math.random() * (range.max - range.min) + range.min;
    maxTime = Math.max(maxTime, itemWaitTime);
  });
  return maxTime;
}

function updateCustomer(customer: Customer, deltaTime: number): Customer {
  const updated = { ...customer };

  // Update position based on state
  switch (customer.state) {
    case 'entering':
      updated.position.y = Math.min(customer.position.y + 50 * deltaTime, 150);
      if (updated.position.y >= 150) {
        updated.state = 'waiting';
      }
      break;
    case 'served':
      updated.position.y = Math.max(customer.position.y - 50 * deltaTime, -50);
      if (updated.position.y <= -50) {
        updated.state = 'leaving';
      }
      break;
  }

  // Update mood for waiting customers
  if (updated.state === 'waiting' && !updated.orderInProgress) {
    updated.waitingTime += deltaTime * 1000; // Convert to milliseconds
    
    // Calculate mood based on waiting time percentage
    const waitingTimePercentage = updated.waitingTime / updated.maxWaitingTime;
    if (waitingTimePercentage <= 1) {
      // Linear decay until max waiting time
      updated.mood = Math.max(
        0,
        customer.initialMood * (1 - waitingTimePercentage * MOOD_DECAY_RATE)
      );
    } else {
      // Faster decay after max waiting time
      const overtime = waitingTimePercentage - 1;
      updated.mood = Math.max(
        0,
        customer.initialMood * (1 - MOOD_DECAY_RATE) * Math.pow(0.9, overtime * 10)
      );
    }
  }

  return updated;
}

function spawnCustomer(state: GameState) {
  if (state.customers.length >= 5) return; // Max 5 customers at a time

  const isAngry = Math.random() < ANGRY_CUSTOMER_CHANCE;
  const initialMood = isAngry
    ? Math.random() * 30 + 20 // 20-50 for angry customers
    : Math.random() * (INITIAL_MOOD_RANGE.max - INITIAL_MOOD_RANGE.min) + INITIAL_MOOD_RANGE.min;

  // Generate order first so we can calculate waiting time
  const order = generateRandomOrder();
  const maxWaitingTime = calculateMaxWaitingTime(order);

  const customer: Customer = {
    id: Date.now().toString(),
    position: { x: Math.random() * 700 + 50, y: 50 }, // Random x position at top
    mood: initialMood,
    initialMood,
    waitingTime: 0,
    maxWaitingTime: maxWaitingTime,
    state: 'entering',
    appearance: generateCustomerAppearance(),
    order: order,
    orderInProgress: false,
  };
  
  state.customers.push(customer);
}

function generateRandomOrder(): Order {
  const items: OrderItem[] = [];
  const numItems = Math.floor(Math.random() * 2) + 1; // 1-2 items per order

  for (let i = 0; i < numItems; i++) {
    const type = Math.random() < 0.7 ? 'beer' : 'food';
    const range = type === 'beer' ? WAITING_TIME_RANGE.beer : WAITING_TIME_RANGE.food;
    
    items.push({
      type,
      name: type === 'beer' ? getRandomBeer() : getRandomFood(),
      preparationTime: (range.max - range.min) / 1000, // Convert to seconds for display
      completed: false,
    });
  }

  return {
    id: Date.now().toString(),
    items,
    status: 'pending',
    timeCreated: Date.now(),
  };
}

function getRandomBeer(): string {
  const beers = ['Lager', 'IPA', 'Stout', 'Pale Ale', 'Wheat Beer'];
  return beers[Math.floor(Math.random() * beers.length)];
}

function getRandomFood(): string {
  const foods = ['Burger', 'Wings', 'Nachos', 'Fries', 'Pizza'];
  return foods[Math.floor(Math.random() * foods.length)];
} 