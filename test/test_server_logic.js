const chai = require('chai');
const expect = chai.expect;
// const { GoBoard } = require('../js/go_board_rule.js'); // Assuming it's accessible

// Mocks
let mockSockets = {}; // Stores all created mock sockets, keyed by id
let serverState; // Holds gameRooms and waitingPlayer for each test run

// Mock io object for emulating io.to(room).emit()
const mockIo = {
    emittedToRoom: [],
    to: function(room) {
        const self = this;
        return {
            emit: function(event, ...args) {
                self.emittedToRoom.push({ room, event, args });
                // Simulate emitting to all sockets in the room that are part of mockSockets
                for (const socketId in mockSockets) {
                    if (mockSockets[socketId].rooms.has(room)) {
                        // Avoid re-emitting to the same socket if the broadcast logic is complex
                        // This mock assumes direct emission to all in room.
                        mockSockets[socketId].emittedMessages.push({ event, args });
                    }
                }
            }
        };
    }
};

function createMockSocket(id) {
    const socket = {
        id: id,
        rooms: new Set(), // To simulate Socket.IO rooms
        gameId: null,
        emittedMessages: [],
        joinedRooms: [],
        leftRooms: [], // Not used in these specific tests but good for future

        // Mock for socket.emit()
        emit: function(event, ...args) {
            this.emittedMessages.push({ event, args });
        },
        // Mock for socket.join()
        join: function(room) {
            this.joinedRooms.push(room);
            this.rooms.add(room); // Add to the Set of rooms
        },
        // Mock for socket.leave()
        leave: function(room) { // Not used in current tests, but good for completeness
            this.leftRooms.push(room);
            this.rooms.delete(room);
        },
        // Mock for socket.on() - not strictly needed for these tests as we call handlers directly
        on: function(event, handler) {
            // Store handler if needed, or execute directly for some test patterns
        },
        // Mock for socket.to(room).emit() - for peer-to-peer messages within a room
        to: function(room) {
            const self = this; // The current socket
            return {
                emit: function(event, ...args) {
                    // Simulate emitting to other sockets in the room
                    for (const socketId in mockSockets) {
                        // Important: Emit only to OTHER sockets in the room
                        if (socketId !== self.id && mockSockets[socketId].rooms.has(room)) {
                            mockSockets[socketId].emittedMessages.push({ event, args });
                        }
                    }
                }
            };
        }
    };
    mockSockets[id] = socket; // Register socket in our global mock list
    return socket;
}

// This is a simplified replication of the connection logic from index.js
// In a real scenario, index.js would be refactored to export this handler.
const connectionHandlerInternal = (socket) => {
    // console.log(`Test: Simulating connection for ${socket.id}`);
    if (!serverState.waitingPlayer) {
        serverState.waitingPlayer = socket;
        socket.emit('status', 'Waiting for an opponent...');
    } else {
        const player1Socket = serverState.waitingPlayer;
        const player2Socket = socket;
        const gameId = player1Socket.id + '#' + player2Socket.id;

        player1Socket.gameId = gameId; // Assign gameId to each socket
        player2Socket.gameId = gameId;

        player1Socket.join(gameId); // Make sockets join the room
        player2Socket.join(gameId);

        const gameRoom = {
            id: gameId,
            players: [
                { id: player1Socket.id, color: 'black', socket: player1Socket },
                { id: player2Socket.id, color: 'white', socket: player2Socket }
            ],
            turn: 'black',
            // goBoard: new GoBoard(19) // Would need GoBoard class here
        };
        serverState.gameRooms[gameId] = gameRoom;

        // Emit 'game start' to the room through the mockIo object
        mockIo.to(gameId).emit('game start', {
            gameId: gameId,
            players: [
                { id: player1Socket.id, color: 'black' },
                { id: player2Socket.id, color: 'white' }
            ],
            turn: 'black'
        });

        player1Socket.emit('player info', { color: 'black', gameId: gameId });
        player2Socket.emit('player info', { color: 'white', gameId: gameId });

        serverState.waitingPlayer = null; // Reset waiting player
    }
};


describe('Go Game Server Logic - Connection Handling', () => {
    beforeEach(() => {
        // Reset state before each test
        serverState = { gameRooms: {}, waitingPlayer: null };
        mockSockets = {}; // Clear previously created mock sockets
        mockIo.emittedToRoom = []; // Clear io room emissions
    });

    it('should allow a single player to connect and wait', () => {
        const socket1 = createMockSocket('socket1_id');
        connectionHandlerInternal(socket1);

        expect(serverState.waitingPlayer).to.equal(socket1);
        expect(socket1.emittedMessages).to.deep.include({
            event: 'status', args: ['Waiting for an opponent...']
        });
        // Ensure no game room was created yet
        expect(Object.keys(serverState.gameRooms).length).to.equal(0);
    });

    it('should start a game when a second player connects', () => {
        const socket1 = createMockSocket('socket1_id');
        const socket2 = createMockSocket('socket2_id');

        connectionHandlerInternal(socket1); // First player connects
        connectionHandlerInternal(socket2); // Second player connects

        expect(serverState.waitingPlayer).to.be.null; // waitingPlayer should be cleared

        const expectedGameId = 'socket1_id#socket2_id';
        expect(serverState.gameRooms[expectedGameId]).to.exist;
        expect(serverState.gameRooms[expectedGameId].players.length).to.equal(2);
        expect(serverState.gameRooms[expectedGameId].players.find(p => p.id === 'socket1_id').color).to.equal('black');
        expect(serverState.gameRooms[expectedGameId].players.find(p => p.id === 'socket2_id').color).to.equal('white');
        expect(serverState.gameRooms[expectedGameId].turn).to.equal('black');

        // Check if sockets joined the room
        expect(socket1.joinedRooms).to.include(expectedGameId);
        expect(socket2.joinedRooms).to.include(expectedGameId);
        expect(socket1.gameId).to.equal(expectedGameId);
        expect(socket2.gameId).to.equal(expectedGameId);

        // Check 'game start' emitted to the room (via mockIo)
        const gameStartMessage = mockIo.emittedToRoom.find(m => m.event === 'game start' && m.room === expectedGameId);
        expect(gameStartMessage).to.not.be.undefined;
        expect(gameStartMessage.args[0].gameId).to.equal(expectedGameId);
        expect(gameStartMessage.args[0].turn).to.equal('black');

        // Check 'player info' emitted to each player
        const s1PlayerInfo = socket1.emittedMessages.find(m => m.event === 'player info');
        expect(s1PlayerInfo).to.not.be.undefined;
        expect(s1PlayerInfo.args[0].color).to.equal('black');
        expect(s1PlayerInfo.args[0].gameId).to.equal(expectedGameId);

        const s2PlayerInfo = socket2.emittedMessages.find(m => m.event === 'player info');
        expect(s2PlayerInfo).to.not.be.undefined;
        expect(s2PlayerInfo.args[0].color).to.equal('white');
        expect(s2PlayerInfo.args[0].gameId).to.equal(expectedGameId);

        // Check that 'status' was emitted to socket1 initially, but not to socket2
        expect(socket1.emittedMessages.some(m => m.event === 'status')).to.be.true;
        expect(socket2.emittedMessages.some(m => m.event === 'status')).to.be.false;
    });

    // Future tests could include:
    // - Test for 'place stone' logic (valid, invalid turn, invalid move by GoBoard rules)
    // - Test for 'disconnect' logic (waiting player, player in active game)
});

// TODO: Need to handle GoBoard dependency if tests for 'place stone' are added.
// One way is to mock GoBoard, another is to ensure js/go_board_rule.js can be required.
// For now, the connection logic itself doesn't directly call GoBoard methods in the simplified test handler.

console.log("Test file created. Note: These tests use a simplified, replicated connection handler.");
console.log("For full testing of index.js, refactoring index.js for better testability (e.g., exporting handlers) is recommended.");

// Example of how GoBoard might be handled if needed for other tests:
/*
let GoBoard;
try {
    GoBoard = require('../js/go_board_rule.js').GoBoard;
} catch (e) {
    console.warn("Could not load GoBoard. Tests involving game logic will be affected.");
    // Mock GoBoard if not available
    GoBoard = class MockGoBoard {
        constructor(size) { this.size = size; }
        move() { console.warn("MockGoBoard.move called"); return {add:[], remove:[]}; }
    };
}
*/
// The serverState.gameRooms[gameId].goBoard = new GoBoard(19) line would then work.
// For the current tests, this is not strictly necessary as we don't interact with goBoard instance yet.
