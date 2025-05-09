import { GameState, Customer, Order, OrderItem } from '../types/game';

const CUSTOMER_SIZE = 25; // Size of customer avatar
const CUSTOMER_SPACING = CUSTOMER_SIZE * 2; // Minimum space between customers
const CUSTOMER_SPAWN_AREA = {
  start: 100,  // Left boundary for spawning
  end: 700     // Right boundary for spawning
};

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

const DOOR_POSITION = { x: 50, y: 150 }; // Position of the bar door
const ANGRY_MOVEMENT_SPEED = 100; // Pixels per second
const ANGRY_MOVEMENT_RANGE = 20; // How far up/down they move

const ANGRY_MESSAGES = [
  "Taps is a FLOP!",
  "Worst. Bar. Ever!",
  "My gran pours better!",
  "Taps? More like NAPS!",
  "Service slower than dial-up!",
  "I've had warmer ice cream!",
  "Even root beer has more spirit!",
  "Taps runs on empty!",
  "This bar is all foam!",
  "Less Taps, more YAPS!",
  "My plant waters faster!",
  "I've seen better Taps in a sink!",
  "This bar needs training wheels!",
  "Did the beer expire in 1922?",
  "I'd rather drink from a puddle!"
];

// Bar area boundaries for angry customers
const BAR_AREA = {
  left: 600,    // Moved to right side
  right: 750,   // Right edge near canvas boundary
  y: 200       // Base Y position for angry customers (lower than regular customers)
};

const MESSAGE_CHANGE_INTERVAL = {
  min: 20000,  // Minimum time between message changes (20 seconds)
  max: 40000   // Maximum time between message changes (40 seconds)
};

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

    // Check if all items are completed
    const allCompleted = customer.order.items.every(item => item.completed);
    if (allCompleted) {
      // Convert remaining happiness into cash
      const happinessBonus = Math.floor(customer.mood);
      const baseReward = 20;
      const totalReward = baseReward + happinessBonus;

      // Update money and score
      newState.money += totalReward;
      newState.score += totalReward;

      // Mark customer as served and stop mood decay
      customer.state = 'served';
      customer.orderInProgress = true;

      console.log(`Order completed! Reward: ${totalReward} (Base: ${baseReward}, Bonus: ${happinessBonus})`);
    } else {
      // Stop mood decay while waiting for remaining items
      customer.orderInProgress = true;
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

function findAvailablePosition(customers: Customer[]): number | null {
  // Sort existing customers by x position
  const sortedCustomers = [...customers]
    .filter(c => c.state !== 'leaving')
    .sort((a, b) => a.position.x - b.position.x);

  if (sortedCustomers.length === 0) {
    // If no customers, return center position
    return (CUSTOMER_SPAWN_AREA.start + CUSTOMER_SPAWN_AREA.end) / 2;
  }

  // Check space at the start
  if (sortedCustomers[0].position.x - CUSTOMER_SPAWN_AREA.start >= CUSTOMER_SPACING) {
    return CUSTOMER_SPAWN_AREA.start + CUSTOMER_SPACING/2;
  }

  // Check spaces between customers
  for (let i = 0; i < sortedCustomers.length - 1; i++) {
    const gap = sortedCustomers[i + 1].position.x - sortedCustomers[i].position.x;
    if (gap >= CUSTOMER_SPACING * 1.5) {
      return sortedCustomers[i].position.x + gap/2;
    }
  }

  // Check space at the end
  const lastCustomer = sortedCustomers[sortedCustomers.length - 1];
  if (CUSTOMER_SPAWN_AREA.end - lastCustomer.position.x >= CUSTOMER_SPACING) {
    return lastCustomer.position.x + CUSTOMER_SPACING;
  }

  return null; // No available position found
}

function getRandomBarPosition() {
  return {
    x: Math.random() * (BAR_AREA.right - BAR_AREA.left) + BAR_AREA.left,
    y: BAR_AREA.y
  };
}

function getRandomAngryMessage(): string {
  return ANGRY_MESSAGES[Math.floor(Math.random() * ANGRY_MESSAGES.length)];
}

function getRandomMessageInterval(): number {
  return Math.random() * (MESSAGE_CHANGE_INTERVAL.max - MESSAGE_CHANGE_INTERVAL.min) + MESSAGE_CHANGE_INTERVAL.min;
}

function updateCustomer(customer: Customer, deltaTime: number): Customer {
  const updated = { ...customer };

  // Update position based on state
  switch (customer.state) {
    case 'entering':
      // Move down to their waiting position
      updated.position.y = Math.min(customer.position.y + 50 * deltaTime, 150);
      if (updated.position.y >= 150) {
        updated.state = 'waiting';
      }
      break;
    case 'served':
      // Move up and off screen
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

    // If mood hits zero and we don't have an angry position yet, assign one and a message
    if (updated.mood <= 0 && !updated.angryPosition) {
      updated.angryPosition = getRandomBarPosition();
      updated.angryMessage = getRandomAngryMessage();
      updated.lastMessageChange = Date.now();
    }

    // If already angry, check if it's time to change the message
    if (updated.mood <= 0 && updated.lastMessageChange) {
      const timeSinceLastChange = Date.now() - updated.lastMessageChange;
      const currentInterval = getRandomMessageInterval();
      
      if (timeSinceLastChange >= currentInterval) {
        // Time to change the message
        let newMessage = getRandomAngryMessage();
        // Make sure it's different from the current message
        while (newMessage === updated.angryMessage) {
          newMessage = getRandomAngryMessage();
        }
        updated.angryMessage = newMessage;
        updated.lastMessageChange = Date.now();
      }
    }

    // If we have an angry position, move towards it and do angry movement
    if (updated.angryPosition) {
      // Move towards angry position if not close enough
      if (Math.abs(updated.position.x - updated.angryPosition.x) > 5) {
        const moveDirection = updated.position.x > updated.angryPosition.x ? -1 : 1;
        updated.position.x += moveDirection * 100 * deltaTime;
        // Clamp to target position
        if (moveDirection === -1 && updated.position.x < updated.angryPosition.x) {
          updated.position.x = updated.angryPosition.x;
        } else if (moveDirection === 1 && updated.position.x > updated.angryPosition.x) {
          updated.position.x = updated.angryPosition.x;
        }
      } else {
        // At angry position, do up/down movement
        const time = Date.now() / 1000; // Convert to seconds for smoother movement
        updated.position.x = updated.angryPosition.x;
        updated.position.y = updated.angryPosition.y + Math.sin(time * ANGRY_MOVEMENT_SPEED / 50) * ANGRY_MOVEMENT_RANGE;
      }
    }
  }

  return updated;
}

function spawnCustomer(state: GameState) {
  if (state.customers.length >= 5) return; // Max 5 customers at a time

  // Find an available position for the new customer
  const xPosition = findAvailablePosition(state.customers);
  if (xPosition === null) return; // No space available

  const isAngry = Math.random() < ANGRY_CUSTOMER_CHANCE;
  const initialMood = isAngry
    ? Math.random() * 30 + 20 // 20-50 for angry customers
    : Math.random() * (INITIAL_MOOD_RANGE.max - INITIAL_MOOD_RANGE.min) + INITIAL_MOOD_RANGE.min;

  // Generate order first so we can calculate waiting time
  const order = generateRandomOrder();
  const maxWaitingTime = calculateMaxWaitingTime(order);

  const customer: Customer = {
    id: Date.now().toString(),
    position: { x: xPosition, y: -50 }, // Start above screen
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