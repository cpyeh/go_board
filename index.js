const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { GoBoard } = require('./js/go_board_rule.js');

// Color mapping constants
const SERVER_PLAYER_COLOR_TO_GOBOARD_COLOR = { 'black': 1, 'white': 2 }; // Assuming GoBoard.BLACK is 1, GoBoard.WHITE is 2
// const GOBOARD_COLOR_TO_SERVER_PLAYER_COLOR = { 1: 'black', 2: 'white' }; // Might be useful later

let waitingPlayer = null;
const gameRooms = {};

app.use(express.static('js'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit('status', 'Waiting for an opponent...');
    console.log(`User ${socket.id} is waiting for an opponent.`);
  } else {
    const gameId = waitingPlayer.id + '#' + socket.id;
    const player1 = { id: waitingPlayer.id, color: 'black', socket: waitingPlayer };
    const player2 = { id: socket.id, color: 'white', socket: socket };

    const gameRoom = {
      id: gameId,
      players: [player1, player2],
      turn: 'black', // Black always starts
      goBoard: new GoBoard(19), // boardSize = 19
    };
    gameRooms[gameId] = gameRoom;

    waitingPlayer.join(gameId);
    socket.join(gameId);

    waitingPlayer.gameId = gameId;
    socket.gameId = gameId;

    io.to(gameId).emit('game start', {
      gameId: gameId,
      players: [{id: player1.id, color: player1.color}, {id: player2.id, color: player2.color}],
      turn: 'black'
    });

    player1.socket.emit('player info', { color: player1.color, gameId: gameId });
    player2.socket.emit('player info', { color: player2.color, gameId: gameId });

    console.log(`Game ${gameId} started between ${player1.id} (black) and ${player2.id} (white)`);
    waitingPlayer = null;
  }

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
      console.log(`User ${socket.id} removed from waiting.`);
    } else if (socket.gameId) {
      const gameId = socket.gameId;
      const gameRoom = gameRooms[gameId];
      if (gameRoom) {
        // Notify the other player
        socket.to(gameId).emit('opponent disconnected', 'Your opponent has disconnected.');
        // Clean up
        delete gameRooms[gameId];
        console.log(`Game ${gameId} ended due to disconnect. Room deleted.`);

        // Attempt to remove players from Socket.IO room if they are still connected
        // This might not be strictly necessary if the room itself is being deleted
        // but can help with cleanup of socket properties.
        gameRoom.players.forEach(player => {
          if (player.socket && player.socket.connected) {
            player.socket.leave(gameId);
            delete player.socket.gameId;
          }
        });
      }
    }
  });

  socket.on('place stone', (msg) => {
    const gameId = socket.gameId;
    if (gameId && gameRooms[gameId]) {
      const gameRoom = gameRooms[gameId];
      const player = gameRoom.players.find(p => p.id === socket.id);

      if (!player) {
        socket.emit('error message', 'Error: Player not found in game.');
        console.log(`Error: Player ${socket.id} not found in game ${gameId} for 'place stone'.`);
        return;
      }

      if (player.color !== gameRoom.turn) {
        socket.emit('error message', 'Not your turn!');
        return;
      }

      const goBoardInstance = gameRoom.goBoard;
      const playerMakingMoveColorString = player.color; // 'black' or 'white'
      const goBoardStoneColor = SERVER_PLAYER_COLOR_TO_GOBOARD_COLOR[playerMakingMoveColorString];

      // msg from client is { x: pos1, y: pos2 } (1-indexed)
      try {
        // GoBoard.move expects 1-indexed positions.
        const changes = goBoardInstance.move(msg.x, msg.y, goBoardStoneColor);
        // `changes` from goBoardInstance.move is { add: [hash...], remove: [hash...] }
        // Note: The client currently expects playerColor (string) and turn (string)
        // The `changes` object from go_board_rule.js is not directly sent yet, but could be in future.

        // If move is successful, update turn
        gameRoom.turn = (gameRoom.turn === 'black' ? 'white' : 'black');

        // Broadcast to client. Client expects:
        // x, y: coordinates of the placed stone
        // playerColor: color string ('black' or 'white') of the player who made the move
        // turn: color string ('black' or 'white') of the next player's turn
        io.to(gameId).emit('place stone', {
            x: msg.x,
            y: msg.y,
            playerColor: playerMakingMoveColorString, // Original player's color string
            turn: gameRoom.turn                 // New turn string
        });
        console.log(`Game ${gameId}: Move by ${playerMakingMoveColorString} at (${msg.x},${msg.y}) successful. Next turn: ${gameRoom.turn}. Changes: ${JSON.stringify(changes)}`);

      } catch (error) {
        // goBoardInstance.move throws an error for invalid moves (e.g., Ko, occupied, suicide)
        console.error(`Game ${gameId}: Invalid move by ${playerMakingMoveColorString} at (${msg.x},${msg.y}). Error: ${error.message}`);
        socket.emit('error message', `Invalid move: ${error.message}`);
        // Do not change turn or emit 'place stone' to room if move is invalid
      }

    } else {
      socket.emit('error message', 'You are not currently in a game or the game does not exist.');
      console.log(`Invalid 'place stone' from ${socket.id} - not in a game or game ${gameId} not found.`);
    }
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});