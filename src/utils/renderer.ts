import { GameState, BarObject, Customer } from '../types/game';

const PLAYER_SIZE = 30;
const CUSTOMER_SIZE = 25;

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
  "Less Taps, more YAPS!"
];

export function drawGame(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  barObjects: BarObject[]
) {
  // Draw background
  drawBackground(ctx);
  
  // Draw bar objects
  barObjects.forEach(obj => {
    drawBarObject(ctx, obj);
  });

  // Draw customers
  gameState.customers.forEach(customer => {
    drawCustomer(ctx, customer);
  });

  // Draw player (bartender)
  drawBartender(ctx, gameState);

  // Draw UI
  drawUI(ctx, gameState);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Draw floor pattern
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Add wood grain pattern
  ctx.strokeStyle = '#6B3410';
  for (let i = 0; i < ctx.canvas.width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, ctx.canvas.height);
    ctx.stroke();
  }
}

function drawBarObject(ctx: CanvasRenderingContext2D, obj: BarObject) {
  // Draw base object
  ctx.fillStyle = getBarObjectColor(obj.type);
  ctx.fillRect(obj.position.x, obj.position.y, obj.width, obj.height);

  // Add details based on type
  switch (obj.type) {
    case 'counter':
      // Draw counter surface shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(obj.position.x, obj.position.y, obj.width, 5);
      break;
    case 'beer-tap':
      // Draw tap handles
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#DDD';
        ctx.fillRect(obj.position.x + i * 10, obj.position.y - 10, 5, 10);
      }
      break;
    case 'kitchen':
      // Draw kitchen equipment
      ctx.fillStyle = '#999';
      ctx.fillRect(obj.position.x + 5, obj.position.y + 5, 20, 20); // Stove
      ctx.fillStyle = '#666';
      ctx.fillRect(obj.position.x + 35, obj.position.y + 5, 20, 20); // Prep area
      break;
  }
}

function drawCustomer(ctx: CanvasRenderingContext2D, customer: Customer) {
  // Draw angry message if mood is at minimum
  if (customer.mood <= 0 && customer.state === 'waiting' && customer.angryMessage) {
    // Draw speech bubble with angry message
    const messageY = 70; // Fixed Y position for message
    
    // Draw angry bubble (red tinted)
    ctx.fillStyle = '#FFE4E1'; // Misty rose color
    ctx.strokeStyle = '#FF4040'; // Coral red
    ctx.lineWidth = 2;
    
    // Measure text to make bubble the right size
    ctx.font = 'bold 12px Arial';
    const textWidth = ctx.measureText(customer.angryMessage).width;
    const bubbleWidth = textWidth + 20;
    const bubbleHeight = 25;
    
    // Draw bubble with fixed position but connected to moving customer
    ctx.beginPath();
    ctx.moveTo(customer.position.x - bubbleWidth/2, messageY);
    ctx.lineTo(customer.position.x + bubbleWidth/2, messageY);
    ctx.quadraticCurveTo(customer.position.x + bubbleWidth/2 + 10, messageY, 
                        customer.position.x + bubbleWidth/2 + 10, messageY + bubbleHeight/2);
    ctx.quadraticCurveTo(customer.position.x + bubbleWidth/2 + 10, messageY + bubbleHeight, 
                        customer.position.x + bubbleWidth/2, messageY + bubbleHeight);
    ctx.lineTo(customer.position.x + 10, messageY + bubbleHeight);
    
    // Draw connecting line that follows the customer
    ctx.lineTo(customer.position.x, customer.position.y - CUSTOMER_SIZE/2);
    
    ctx.lineTo(customer.position.x - 10, messageY + bubbleHeight);
    ctx.lineTo(customer.position.x - bubbleWidth/2, messageY + bubbleHeight);
    ctx.quadraticCurveTo(customer.position.x - bubbleWidth/2 - 10, messageY + bubbleHeight,
                        customer.position.x - bubbleWidth/2 - 10, messageY + bubbleHeight/2);
    ctx.quadraticCurveTo(customer.position.x - bubbleWidth/2 - 10, messageY,
                        customer.position.x - bubbleWidth/2, messageY);
    ctx.fill();
    ctx.stroke();

    // Draw text at fixed position
    ctx.fillStyle = '#FF0000'; // Red text
    ctx.textAlign = 'center';
    ctx.fillText(customer.angryMessage, customer.position.x, messageY + 16);
    ctx.textAlign = 'left'; // Reset alignment
  }

  // Draw order bubble if waiting and not at minimum mood
  if (customer.state === 'waiting' && customer.order && customer.mood > 0) {
    // Draw mood bar above everything
    const moodBarY = customer.position.y - 65;
    ctx.fillStyle = 'white';
    ctx.fillRect(
      customer.position.x - 15,
      moodBarY,
      30,
      5
    );
    ctx.fillStyle = getMoodColor(customer.mood);
    ctx.fillRect(
      customer.position.x - 15,
      moodBarY,
      (customer.mood / 100) * 30,
      5
    );

    // Add a thin line connecting mood bar to customer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(customer.position.x, moodBarY + 5);
    ctx.lineTo(customer.position.x, customer.position.y - CUSTOMER_SIZE/2);
    ctx.stroke();

    drawOrderBubble(ctx, customer);
  }

  // Draw body
  ctx.fillStyle = getMoodColor(customer.mood);
  ctx.beginPath();
  ctx.arc(
    customer.position.x,
    customer.position.y,
    CUSTOMER_SIZE / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw shirt
  ctx.fillStyle = customer.appearance.shirtColor;
  ctx.fillRect(
    customer.position.x - CUSTOMER_SIZE / 2,
    customer.position.y + 5,
    CUSTOMER_SIZE,
    CUSTOMER_SIZE / 2
  );

  // Draw face features
  if (customer.appearance.hasBeard) {
    ctx.fillStyle = customer.appearance.hairColor;
    ctx.fillRect(
      customer.position.x - 8,
      customer.position.y + 2,
      16,
      8
    );
  }

  // If mood is zero, draw angry eyebrows and steam
  if (customer.mood <= 0) {
    // Draw angry eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    // Left angry eyebrow
    ctx.beginPath();
    ctx.moveTo(customer.position.x - 8, customer.position.y - 5);
    ctx.lineTo(customer.position.x - 3, customer.position.y - 8);
    ctx.stroke();
    // Right angry eyebrow
    ctx.beginPath();
    ctx.moveTo(customer.position.x + 8, customer.position.y - 5);
    ctx.lineTo(customer.position.x + 3, customer.position.y - 8);
    ctx.stroke();

    // Draw steam coming from head (moves with time)
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const offset = i * (Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.moveTo(
        customer.position.x + Math.cos(time * 2 + offset) * 5,
        customer.position.y - CUSTOMER_SIZE/2 - 5
      );
      ctx.quadraticCurveTo(
        customer.position.x + Math.cos(time * 2 + offset) * 8,
        customer.position.y - CUSTOMER_SIZE/2 - 15,
        customer.position.x + Math.cos(time * 2 + offset) * 5,
        customer.position.y - CUSTOMER_SIZE/2 - 25
      );
      ctx.stroke();
    }
  }
}

function drawOrderBubble(ctx: CanvasRenderingContext2D, customer: Customer) {
  if (!customer.order) return;

  // Draw the bubble slightly lower than the mood bar
  const bubbleY = customer.position.y - 30;
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(
    customer.position.x + 30,
    bubbleY,
    35,
    25,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw waiting time indicator at the top of the bubble
  const waitingTimePercentage = customer.waitingTime / customer.maxWaitingTime;
  const timeBarWidth = 30;
  const timeBarHeight = 3;
  
  // Background bar
  ctx.fillStyle = '#ddd';
  ctx.fillRect(
    customer.position.x + 15,
    bubbleY - 20,  // Moved up
    timeBarWidth,
    timeBarHeight
  );
  
  // Progress bar
  const barColor = waitingTimePercentage > 1 ? '#ff0000' : '#4CAF50';
  ctx.fillStyle = barColor;
  ctx.fillRect(
    customer.position.x + 15,
    bubbleY - 20,  // Moved up
    Math.min(waitingTimePercentage, 1) * timeBarWidth,
    timeBarHeight
  );

  // Draw order items below the timer
  ctx.font = '10px Arial';
  ctx.fillStyle = 'black';
  customer.order.items.forEach((item, index) => {
    // Draw checkmark or X based on completion status
    const statusSymbol = item.completed ? '✓' : '○';
    const itemText = `${statusSymbol} ${item.name}`;
    ctx.fillText(
      itemText,
      customer.position.x + 5,
      bubbleY - 5 + (index * 12)  // Adjusted Y position to be below timer
    );
  });
}

function drawBartender(ctx: CanvasRenderingContext2D, gameState: GameState) {
  const position = gameState.playerPosition;
  
  // Draw body
  ctx.fillStyle = '#2E8B57';
  ctx.beginPath();
  ctx.arc(position.x, position.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw apron
  ctx.fillStyle = '#000';
  ctx.fillRect(
    position.x - PLAYER_SIZE / 3,
    position.y,
    PLAYER_SIZE * 2/3,
    PLAYER_SIZE / 2
  );

  // Draw bow tie
  ctx.fillStyle = '#F00';
  ctx.beginPath();
  ctx.arc(position.x, position.y - 5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw held item if any
  if (gameState.playerInventory.type !== 'none') {
    // Draw item to the right of player
    const itemX = position.x + PLAYER_SIZE;  // Moved further right
    const itemY = position.y;

    if (gameState.playerInventory.type === 'beer') {
      // Draw beer mug
      ctx.fillStyle = '#DEB887'; // Beer mug color
      ctx.fillRect(itemX - 5, itemY - 10, 10, 15); // Mug body
      ctx.fillStyle = '#FFD700'; // Beer color
      ctx.fillRect(itemX - 4, itemY - 9, 8, 13); // Beer liquid
      ctx.fillStyle = 'white';
      ctx.fillRect(itemX - 4, itemY - 9, 8, 3); // Foam
    } else if (gameState.playerInventory.type === 'food') {
      // Draw plate (larger)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(itemX, itemY, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw food (larger sizes)
      switch (gameState.playerInventory.name) {
        case 'Burger':
          // Draw burger layers
          ctx.fillStyle = '#8B4513'; // Bun
          ctx.fillRect(itemX - 10, itemY - 6, 20, 4);
          ctx.fillStyle = '#654321'; // Patty
          ctx.fillRect(itemX - 8, itemY - 3, 16, 3);
          ctx.fillStyle = '#8B4513'; // Bottom bun
          ctx.fillRect(itemX - 10, itemY, 20, 3);
          break;
        case 'Pizza':
          // Draw triangular pizza slice
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.moveTo(itemX, itemY - 8);
          ctx.lineTo(itemX + 10, itemY + 6);
          ctx.lineTo(itemX - 10, itemY + 6);
          ctx.closePath();
          ctx.fill();
          break;
        case 'Wings':
          // Draw chicken wing
          ctx.fillStyle = '#CD853F';
          ctx.beginPath();
          ctx.ellipse(itemX, itemY, 10, 6, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'Nachos':
          // Draw triangle chips
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(itemX + (i * 6) - 8, itemY);
            ctx.lineTo(itemX + (i * 6), itemY - 6);
            ctx.lineTo(itemX + (i * 6) + 8, itemY);
            ctx.closePath();
            ctx.fill();
          }
          break;
        case 'Fries':
          // Draw french fries
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(itemX - 6 + (i * 5), itemY - 8, 3, 14);
          }
          break;
      }
    }

    // Draw item name (larger and with background)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(itemX - 20, itemY - 25, 40, 15);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.playerInventory.name, itemX, itemY - 15);
    ctx.textAlign = 'left';  // Reset text alignment
  }
}

function drawUI(ctx: CanvasRenderingContext2D, gameState: GameState) {
  // Draw score and money
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Score: ${gameState.score}`, 10, 20);
  ctx.fillText(`Money: $${gameState.money}`, 10, 40);
  
  // Draw real time
  const date = new Date(gameState.gameTime);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  ctx.fillText(`Time: ${hours}:${minutes}:${seconds}`, 10, 60);

  // Draw debug information in lower left corner
  const debugY = ctx.canvas.height - 90; // Position from bottom
  ctx.fillStyle = '#333333';
  ctx.fillRect(10, debugY, 200, 60);
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText('Debug Info:', 15, debugY + 15);
  ctx.fillText(`Inventory: ${gameState.playerInventory.type}`, 15, debugY + 35);
  if (gameState.playerInventory.type !== 'none') {
    ctx.fillText(`Item: ${gameState.playerInventory.name}`, 15, debugY + 55);
  }
}

function getBarObjectColor(type: BarObject['type']): string {
  switch (type) {
    case 'counter':
      return '#8B4513';
    case 'beer-tap':
      return '#C0C0C0';
    case 'kitchen':
      return '#FFD700';
    case 'serving-area':
      return '#DEB887';
    case 'table':
      return '#A0522D';
  }
}

function getMoodColor(mood: number): string {
  if (mood > 75) return '#4CAF50'; // Happy - Green
  if (mood > 50) return '#FFC107'; // Content - Yellow
  if (mood > 25) return '#FF9800'; // Annoyed - Orange
  return '#F44336'; // Angry - Red
} 