const Graph = function() {
    this.graph = {};
}

Graph.prototype.adj = function* (u) {
    if ((typeof this.graph[u]) === 'undefined') {
        return;
    }
    for (const v in this.graph[u]) {
        if (this.graph[u].hasOwnProperty(v)) {
            yield parseInt(v);
        }
    }
}

Graph.prototype.has = function(u, v) {
    if ((typeof this.graph[u]) !== 'undefined') {
        return (typeof this.graph[u][v]) !== 'undefined';
    } else {
        return false;
    }
}

Graph.prototype.addEdge = function(u, v) {
    this.setOneWay(u, v);
    this.setOneWay(v, u);
}

Graph.prototype.drop = function(u) {
    for (const v of this.adj(u)) {
        delete this.graph[u][v];
        delete this.graph[v][u];
    }
    return true;
}

Graph.prototype.hasNeighbors = function(u) {
    for (const v of this.adj(u)) { // eslint-disable-line no-unused-vars
        return true;
    }
    return false;
}

Graph.prototype.setOneWay = function(u, v) {
    this.graph[u] = this.graph[u] || {};
    this.graph[u][v] = true;
}

Graph.prototype.bfsQueue = function*(node) {
    const searchQueue = [];
    const marked = {};
    searchQueue.push(node);
    marked[node] = true;
    while (searchQueue.length !== 0) {
        const v = searchQueue.shift();
        for (const w of this.adj(v)) {
            if (!(w in marked)) {
                marked[w] = true;
                searchQueue.push(w);
            }
        }
        yield v;
    }
}

function GoBoard(boardSize) {
    this.boardSize = boardSize;
    this.board = new Array(boardSize + 2);
    for (let i = 0; i < this.boardSize + 2; i++) {
        this.board[i] = new Int8Array(boardSize + 2);
    }

    this.connectedGraph = new Graph();
    this.ko = -1; // hash value of place can't play, -1 if no such position
    this.liberty = {};
    this.NO_STONE = 0;
    this.BLACK = 1;
    this.WHITE = 2;
    this.BORDER_LINE = 3;
    this.CURRENT_MOVE = 1; // This seems like a constant, but its usage isn't immediately clear if it changes.
    this.moveCount = 0;
    this.changesHistory = [];
    this.koHistory = [];
    this.colorHistory = [];

    for (let i = 0; i < this.boardSize + 2; i++) {
        this.board[i][0] = this.BORDER_LINE;
        this.board[i][boardSize + 1] = this.BORDER_LINE;
        this.board[boardSize + 1][i] = this.BORDER_LINE;
        this.board[0][i] = this.BORDER_LINE;
    }
}

GoBoard.prototype.neighborsOf = function(pos) {
    return [
        [pos[0] - 1, pos[1]],
        [pos[0] + 1, pos[1]],
        [pos[0], pos[1] - 1],
        [pos[0], pos[1] + 1]
    ];
}

GoBoard.prototype.hashOf = function(pos) {
    return (pos[0] << 5) + pos[1];
}

GoBoard.prototype.posOf = function(posHash) {
    return [posHash >> 5, 0x00001F & posHash];
}

GoBoard.prototype.colorOf = function(pos) {
    return this.board[pos[0]][pos[1]];
}

GoBoard.prototype.isStone = function(pos) {
    return (this.colorOf(pos) === this.BLACK || this.colorOf(pos) === this.WHITE);
}

GoBoard.prototype.boardChange = function(){
    return this.changesHistory[this.moveCount-1];
}

GoBoard.prototype.latestKo = function(){
    return this.koHistory[this.moveCount-1];
}

GoBoard.prototype.latestColor = function(){
    return this.colorHistory[this.moveCount-1];
}

GoBoard.prototype.latestColorReverse = function(){
    // BLACK (1) -> WHITE (2)
    // WHITE (2) -> BLACK (1)
    // (1 * 2) % 3 = 2
    // (2 * 2) % 3 = 1
    return (this.colorHistory[this.moveCount-1] * 2) % 3;
}

GoBoard.prototype.undo = function(){
    if (this.moveCount === 0){
        return {add:[], remove:[]};
    }
    const changes = this.boardChange();
    for (const i of changes.add) {
        this.remove(this.posOf(i));
    }
    for (const i of changes.remove) {
        this.placeStone(this.posOf(i), this.latestColorReverse());
    }
    this.moveCount--;
    return {add:changes.remove, remove:changes.add};
}

GoBoard.prototype.redo = function(){
    if (this.moveCount === this.changesHistory.length){
        return {add:[], remove:[]};
    }
    this.moveCount++;
    const changes = this.boardChange();
    for (const i of changes.add) {
        this.placeStone(this.posOf(i), this.latestColor());
    }
    for (const i of changes.remove) {
        this.remove(this.posOf(i));
    }
    return changes;
}

GoBoard.prototype.move = function(pos1, pos2, color) {
    try {
        this.preMove([pos1, pos2], color);
    } catch (err) {
        // console.log(err); // Error is re-thrown by preMove/afterPlaceStoneCheck
        // The original code returned an empty changes object,
        // but it's better to let the error propagate to the caller (server's 'place stone' handler)
        throw err;
    }
    this.postMove([pos1, pos2]);
    return this.boardChange();
}

GoBoard.prototype.preMove = function(pos, color) {
    this.beforePlaceStoneCheck(pos);
    this.placeStone(pos, color);
    this.afterPlaceStoneCheck(pos); // This can throw an error if move is suicide
}

GoBoard.prototype.placeStone = function(pos, color){
    this.board[pos[0]][pos[1]] = color;
    this.updateGraph(pos);
    this.updateLiberty(pos);
}

GoBoard.prototype.beforePlaceStoneCheck = function(pos){
    if (this.hashOf(pos) === this.latestKo()) {
        throw new Error('It is a ko you shouldn\'t play');
    } else if (this.colorOf(pos) !== this.NO_STONE) {
        throw new Error('There is already a stone at the position.');
    }
}

GoBoard.prototype.afterPlaceStoneCheck = function(pos) {
    const neighbors = this.neighborsOf(pos);
    for (const neighbor of neighbors) {
        if (this.colorOf(neighbor) !== this.colorOf(pos) && // opponent stone
            this.colorOf(neighbor) !== this.NO_STONE && // not empty
            this.isDead(neighbor)) {
            return; // Move is valid because it captures opponent stones
        }
    }
    if (this.isDead(pos)) {
        // Before throwing error, revert the stone placement to keep board state consistent
        this.remove(pos);
        throw new Error('Invalid move: Suicide is not allowed.');
    }
    // return; // Not necessary
};

GoBoard.prototype.postMove = function(pos){
    const deadPositions = this.removeDead(pos);

    this.koHistory = this.koHistory.slice(0, this.moveCount);
    this.setKo(pos, deadPositions);

    this.changesHistory = this.changesHistory.slice(0, this.moveCount);
    // The `add` array in changes should only contain the newly placed stone if it wasn't a suicide that got reverted.
    // However, the current structure adds it in placeStone and only reverts if suicide.
    // For the server, the key thing is what was captured (deadPositions) and where the new stone ended up.
    this.changesHistory.push({ add: [this.hashOf(pos)], remove: deadPositions});

    this.colorHistory = this.colorHistory.slice(0, this.moveCount);
    this.colorHistory.push(this.colorOf(pos));

    this.moveCount++;
}

GoBoard.prototype.setKo = function(pos, deadPositions) {
    const onlyGotOne = (deadPositions.length === 1);
    let onItsOwn = true;
    const neighbors = this.neighborsOf(pos);
    for (const neighbor of neighbors) {
        if (this.colorOf(neighbor) === this.colorOf(pos)) {
            onItsOwn = false;
            break;
        }
    }
    if (onlyGotOne && onItsOwn) {
        // Check if the single captured stone is surrounded by the current player's stones
        // This is a simplified Ko check, a full Ko check would look at the entire board state.
        // For now, this matches the original logic's apparent intent.
        const capturedStonePos = this.posOf(deadPositions[0]);
        let surroundedByCurrentPlayer = true;
        for(const captNeighbor of this.neighborsOf(capturedStonePos)){
            if(this.colorOf(captNeighbor) !== this.colorOf(pos) && this.colorOf(captNeighbor) !== this.BORDER_LINE){
                surroundedByCurrentPlayer = false;
                break;
            }
        }
        if(surroundedByCurrentPlayer){
             this.koHistory.push(deadPositions[0]);
        } else {
            this.koHistory.push(-1);
        }
    } else {
        this.koHistory.push(-1);
    }
}

GoBoard.prototype.updateGraph = function(pos) {
    const neighbors = this.neighborsOf(pos);
    for (const neighbor of neighbors) {
        if (this.colorOf(neighbor) === this.colorOf(pos)) {
            this.connectedGraph.addEdge(this.hashOf(neighbor), this.hashOf(pos));
        }
    }
};

GoBoard.prototype.updateLiberty = function(pos) {
    this.updateLibertyNeighbor(pos);
    this.updateLibertyLocally(pos);
};

GoBoard.prototype.updateLibertyNeighbor = function(pos) {
    const neighbors = this.neighborsOf(pos);
    for (const neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            this.liberty[this.hashOf(neighbor)] -= 1;
        }
    }
}

GoBoard.prototype.updateLibertyLocally = function(pos) {
    const neighbors = this.neighborsOf(pos);
    let localLiberty = 0;
    for (const neighbor of neighbors) {
        if (this.colorOf(neighbor) === this.NO_STONE) {
            localLiberty += 1;
        }
    }
    this.liberty[this.hashOf(pos)] = localLiberty;
};

GoBoard.prototype.isDead = function(pos) {
    if (!this.isStone(pos)) {
        return false; // Not a stone, so not dead
    }
    // Check if any stone in the connected group has liberties
    const connectedQueue = this.connectedGraph.bfsQueue(this.hashOf(pos));
    for (const v of connectedQueue) { // v is a hash
        if (this.liberty[v] > 0) { // Access liberty using hash
            return false; // Found a stone in the group with liberties
        }
    }
    return true; // No stone in the group has liberties
}

GoBoard.prototype.remove = function(pos) {
    this.board[pos[0]][pos[1]] = this.NO_STONE;
    this.resetGraph(pos); // Detach from graph
    this.resetLiberty(pos); // Update liberties of neighbors
};

GoBoard.prototype.resetLiberty = function(pos) {
    const neighbors = this.neighborsOf(pos);
    delete this.liberty[this.hashOf(pos)]; // Stone is removed, so it has no liberties
    for (const neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            // Check if liberty for neighbor already exists, if not, re-calculate it.
            // This can happen if a stone is part of a group whose liberties were collectively 0.
            // For now, just increment. A more robust liberty calculation might be needed
            // if issues arise with complex captures.
            if (typeof this.liberty[this.hashOf(neighbor)] === 'number') {
                 this.liberty[this.hashOf(neighbor)] += 1;
            } else {
                // This case implies the neighbor's liberty count was missing, which shouldn't happen
                // for an existing stone. Re-evaluate its liberties from scratch.
                // For simplicity here, we'll stick to incrementing.
                // A full liberty recalculation for affected groups is safer but more complex.
                 this.updateLibertyLocally(neighbor); // this will set it based on current empty spots.
            }
        }
    }
};

GoBoard.prototype.resetGraph = function(pos) {
    this.connectedGraph.drop(this.hashOf(pos));
};

GoBoard.prototype.removeDead = function(pos) {
    const deadPositions = [];
    const color = this.colorOf(pos); // Color of the stone just played
    const neighbors = this.neighborsOf(pos);
    for (const neighbor of neighbors) {
        if (this.colorOf(neighbor) !== color && // Opponent's stone
            this.colorOf(neighbor) !== this.NO_STONE && // Not an empty spot
            this.isDead(neighbor)) {
            // This neighbor is part of a dead group
            const deadBFSqueue = this.connectedGraph.bfsQueue(this.hashOf(neighbor));
            for (const v of deadBFSqueue) { // v is a hash
                this.remove(this.posOf(v)); // Remove stone from board and update liberties/graph
                deadPositions.push(v);
            }
        }
    }
    return deadPositions;
};

module.exports = { GoBoard, Graph };
