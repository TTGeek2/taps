export interface Customer {
  id: string;
  position: { x: number; y: number };
  mood: number; // 0-100, where 100 is happiest
  initialMood: number;
  order?: Order;
  waitingTime: number;
  maxWaitingTime: number;
  state: 'entering' | 'waiting' | 'served' | 'leaving';
  appearance: {
    hairColor: string;
    shirtColor: string;
    hasBeard: boolean;
  };
  orderInProgress: boolean; // Flag to stop mood decay when order is being fulfilled
  angryPosition?: {
    x: number;
    y: number;
  };
  angryMessage?: string; // Store the customer's specific angry message
  lastMessageChange?: number; // Timestamp of last message change
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'completed';
  timeCreated: number;
}

export interface OrderItem {
  type: 'beer' | 'food';
  name: string;
  preparationTime: number;
  completed: boolean;
}

export interface GameState {
  customers: Customer[];
  orders: Order[];
  playerPosition: { x: number; y: number };
  score: number;
  money: number;
  gameTime: number;
  lastSpawnTime: number;
  playerInventory: {
    type: 'none' | 'beer' | 'food';
    name: string;
  };
}

export interface GameObject {
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface BarObject extends GameObject {
  type: 'counter' | 'table' | 'beer-tap' | 'kitchen' | 'serving-area';
  description: string;
} 