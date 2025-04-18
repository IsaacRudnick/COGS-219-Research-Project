# Three-Lane Runner Game

A simple browser-based runner game where you dodge trains and collect coins across three lanes.

## Setup and Running

1. Make sure you have Node.js installed on your system
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## How to Play

- Use the LEFT and RIGHT arrow keys to move between lanes
- Avoid the red trains
- Collect yellow coins to increase your score
- Try to get the highest score possible!
- When you crash into a train, your score will be saved to the server
- Click "Play Again" to start a new game

## Features

- Three-lane running gameplay
- Coin collection system
- Train obstacles with smart spawning (always ensuring a possible path)
- Score tracking
- Server-side score storage
- Simple and clean visual design
