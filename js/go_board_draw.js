const chart = d3.select("#go_board_div")
    .append('svg')
    .attr('id', 'go_board_svg')
    .attr("height", "100%")
    .attr("width", "100%")
    .style('margin', 'auto')
    .style('display', 'block');

const parent_node = chart.node().parentNode;

const w = parseInt(parent_node.style.width);
const h = parseInt(parent_node.style.height);

const boardSize = 19;
const horizontal_gap = w / (boardSize + 1);
const vertical_gap = h / (boardSize + 1);
const margin = {
    top: vertical_gap,
    right: horizontal_gap,
    bottom: vertical_gap,
    left: horizontal_gap
};

let socket;
if (typeof io !== 'undefined'){
    socket = io();
}

// Client game state variables
let myColor = null;
let gameId = null;
let currentTurn = null;

// Initialize UI elements (assuming they exist in index.html)
const statusDisplay = document.getElementById('status_message');
const playerInfoDisplay = document.getElementById('player_info_display');
const turnDisplay = document.getElementById('turn_display');

function updateStatusDisplay(message) {
    if (statusDisplay) statusDisplay.textContent = message;
    console.log('Status:', message);
}
function updatePlayerInfoDisplay(message) {
    if (playerInfoDisplay) playerInfoDisplay.textContent = message;
    console.log('Player Info:', message);
}
function updateTurnDisplay(message) {
    if (turnDisplay) turnDisplay.textContent = message;
    console.log('Turn Info:', message);
}


for (let i = 0; i < boardSize; i++) {
    chart.append('line')
        .attr('x1', margin.left + i * horizontal_gap)
        .attr('y1', margin.top)
        .attr('x2', margin.left + i * horizontal_gap)
        .attr('y2', h - margin.bottom)
        .style("stroke", "rgb(0,0,0)")
        .style("stroke-width", w / 250);

    chart.append('line')
        .attr('x1', margin.left)
        .attr('y1', margin.top + i * vertical_gap)
        .attr('x2', w - margin.right)
        .attr('y2', margin.top + i * vertical_gap)
        .style("stroke", "rgb(0,0,0)")
        .style("stroke-width", w / 250);
}

const star_positions = [{x: 3, y: 3}, {x: 3, y: 15}, {x: 15, y: 3},
                       {x: 15, y: 15}, { x: 9, y: 9}, { x: 9, y: 15},
                       {x: 15,y: 9}, { x: 3, y: 9}, { x: 9, y: 3}];

for (let i = 0; i < star_positions.length; i++) {
    chart.append('circle')
        .attr('cx', margin.left + star_positions[i].x * horizontal_gap)
        .attr('cy', margin.top + star_positions[i].y * vertical_gap)
        .attr('r', w / 250)
        .attr('stroke', 'black')
        .attr('stroke-width', w / 250)
        .attr('fill', 'black');
}

for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
        chart.append('circle')
            .attr('cx', margin.left + i * horizontal_gap)
            .attr('cy', margin.right + j * vertical_gap)
            .attr('r', vertical_gap / 2.1)
            .attr('id', 'z_' + (i + 1).toString() + '_' + (j + 1).toString())
            .attr('opacity', 0)
            .attr('onmouseover', 'show_z(this.id)')
            .attr('onmouseleave', 'dont_show_z(this.id)')
            .attr('onclick', 'click_on_pos(this.id)');
    }
}

function show_z(id) {
    const element_style = document.getElementById(id).style;

    if (myColor && myColor === currentTurn) { // Check if it's my turn and myColor is set
        if (myColor === 'black') {
            element_style.fill = 'black'; // Preview with actual stone color
            element_style.stroke = 'black';
        } else if (myColor === 'white') {
            element_style.fill = 'white';
            element_style.stroke = 'black'; // Stroke for white stone often black
        } else { // Should not happen if myColor is 'black' or 'white'
            element_style.fill = 'gray';
            element_style.stroke = 'gray';
        }
    } else { // Not my turn, or game not started fully for this client
        element_style.fill = 'gray'; // Or some other neutral indication
        element_style.stroke = 'gray';
    }
    element_style.opacity = 0.3;
    element_style.strokeWidth = w / 250; // Make sure this is preserved
}

function dont_show_z(id) {
    document.getElementById(id).style.opacity = 0;
}

const go_board = new GoBoard(boardSize); // Client-side board representation for drawing

// Color mapping from server string to client GoBoard integer constants
const SERVER_COLOR_TO_CLIENT_GOBOARD_COLOR = {
    'black': go_board.BLACK, // Should be 1
    'white': go_board.WHITE  // Should be 2
};

function click_on_pos(id) {
    if (!myColor || !gameId) {
        alert("Not in a game yet.");
        console.log("Click ignored: Not in a game.");
        return;
    }
    if (myColor !== currentTurn) {
        alert("Not your turn!");
        console.log("Click ignored: Not player's turn.");
        return;
    }

    const positions = id.split('_');
    const pos1 = parseInt(positions[1]);
    const pos2 = parseInt(positions[2]);

    // Emit move to server
    if (socket) {
        socket.emit('place stone', { x: pos1, y: pos2 });
        console.log(`Emitted 'place stone': { x: ${pos1}, y: ${pos2} }`);
    } else {
        console.error("Socket not connected, cannot emit 'place stone'.");
    }
    // Board will update upon receiving 'place stone' event from server
}

if (socket) {
    socket.on('status', (message) => {
        updateStatusDisplay(message);
    });

    socket.on('player info', (data) => {
        myColor = data.color;
        gameId = data.gameId;
        updatePlayerInfoDisplay(`You are ${myColor}. Game ID: ${gameId}`);
        // If game already started, currentTurn might also be available
        if (data.turn) {
            currentTurn = data.turn;
            updateTurnDisplay(`Turn: ${currentTurn}. Your color: ${myColor}`);
        }
    });

    socket.on('game start', (data) => {
        gameId = data.gameId; // Should ideally already be set by 'player info'
        currentTurn = data.turn;
        // go_board.clear_board(); // Optional: clear board on new game start if needed
        // clearAllStonesFromDisplay(); // You'd need a function to remove all SVG stones
        updateStatusDisplay(`Game ${data.gameId} started. You are ${myColor}.`);
        updateTurnDisplay(`Turn: ${currentTurn}.`);
        console.log('Game start data:', data);
    });

    socket.on('place stone', (data) => {
        console.log("Received 'place stone' from server:", data);
        // data expected: { x, y, playerColor (string, who moved), turn (string, next turn) }

        const serverPlayerColorString = data.playerColor; // e.g., 'black' or 'white'
        const clientGoBoardColor = SERVER_COLOR_TO_CLIENT_GOBOARD_COLOR[serverPlayerColorString]; // e.g., 1 or 2

        if (typeof clientGoBoardColor === 'undefined') {
            console.error('Invalid playerColor received from server:', serverPlayerColorString);
            return;
        }

        // Update client-side GoBoard model using the integer color
        const changes = go_board.move(data.x, data.y, clientGoBoardColor);

        // Update the visual board using the integer color
        update_board_internal(changes, clientGoBoardColor);

        // Update whose turn it is next
        currentTurn = data.turn;
        updateTurnDisplay(`Turn: ${currentTurn}.`);
    });

    socket.on('opponent disconnected', (message) => {
        alert('Opponent disconnected: ' + message);
        updateStatusDisplay('Opponent disconnected. Waiting for a new game...');
        myColor = null;
        gameId = null;
        currentTurn = null;
        updatePlayerInfoDisplay('');
        updateTurnDisplay('');
        // go_board.clear_board(); // Optional: clear board
        // clearAllStonesFromDisplay();
    });

    socket.on('error message', (message) => {
        alert('Error: ' + message);
        console.error('Server error message:', message);
    });
} else {
    console.error("Socket.io client not loaded or connected.");
    updateStatusDisplay("Error: Could not connect to server.");
}

// document.onkeydown = undoOrRedo; // Undo/Redo disabled

// function undoOrRedo(e){
//     e = e || window.event;
//     // ... (entire function commented out or removed)
// }

function update_board_internal(changes, stoneColorToDraw) {
    if (!changes || (changes.add.length === 0 && changes.remove.length === 0)) {
        return;
    }
    for (let i = 0; i < changes.add.length; i++) {
        drawStone(changes.add[i], stoneColorToDraw);
    }
    for (let i = 0; i < changes.remove.length; i++) {
        eliminateStone(changes.remove[i]);
    }
    // current_color variable and its toggling is removed.
}

function drawStone(pos_value, stoneColor) { // Added stoneColor parameter
    const pos1 = pos_value >> 5;
    const pos2 = 0x00001F & pos_value;

    const stone = chart.append('circle', ':first-child')
        .attr('cx', margin.left + (pos1 - 1) * horizontal_gap)
        .attr('cy', margin.top + (pos2 - 1) * vertical_gap) // Corrected: margin.top, not margin.right
        .attr('r', vertical_gap / 2.3)
        .attr('id', 's_' + pos1 + '_' + pos2)
        .style('opacity', 1.0)
        .style('stroke', 'black')
        .style('stroke-width', w / 300);

    if (stoneColor === go_board.BLACK) {
        stone.style('fill', 'black');
    } else { // Assuming WHITE
        stone.style('fill', 'rgb(255,255,255)');
    }
}

function eliminateStone(pos_value) {
    const pos1 = pos_value >> 5;
    const pos2 = 0x00001F & pos_value;
    const element = document.getElementById('s_' + pos1 + '_' + pos2);
    if (element && element.parentNode) { // Check if element exists and has a parent
        element.parentNode.removeChild(element);
    }
}

// Function to clear all stones from SVG display (useful for new game)
// function clearAllStonesFromDisplay() {
//    chart.selectAll("circle[id^='s_']").remove();
// }

// Initial status
updateStatusDisplay("Connecting to server...");
if (!socket) {
    updateStatusDisplay("Failed to connect to server. Please refresh.");
}
