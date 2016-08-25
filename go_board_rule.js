var Graph = function() {
    this.graph = {};
}

Graph.prototype.adj = function* (u) {
    if ((typeof this.graph[u]) == 'undefined') {
        return;
    }
    for (let v in this.graph[u]) {
        if (this.graph[u].hasOwnProperty(v)) {
            yield parseInt(v);
        }
    }
}

Graph.prototype.has = function(u, v) {
    if ((typeof this.graph[u]) != 'undefined') {
        return (typeof this.graph[u][v]) != 'undefined';
    } else {
        return false;
    }
}

Graph.prototype.addEdge = function(u, v) {
    this.setOneWay(u, v);
    this.setOneWay(v, u);
}

Graph.prototype.drop = function(u) {
    for (let v of this.adj(u)) {
        delete this.graph[u][v];
        delete this.graph[v][u];
    }
    return true;
}

Graph.prototype.hasNeighbors = function(u) {
    for (let v of this.adj(u)) {
        return true;
    }
    return false;
}

Graph.prototype.setOneWay = function(u, v) {
    this.graph[u] = this.graph[u] || {};
    this.graph[u][v] = true;
}

Graph.prototype.bfsQueue = function*(node) {
    var searchQueue = [];
    var marked = {};
    searchQueue.push(node);
    marked[node] = true;
    while (searchQueue.length != 0) {
        var v = searchQueue.shift();
        for (let w of this.adj(v)) {
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
    for (var i = 0; i < this.boardSize + 2; i++) {
        this.board[i] = new Int8Array(boardSize + 2);
    }

    this.connectedGraph = new Graph();
    this.ko = -1; // hash value of place can't play, -1 if no such position
    this.liberty = {};
    this.NO_STONE = 0;
    this.BLACK = 1;
    this.WHITE = 2;
    this.BORDER_LINE = 3;
    this.CURRENT_MOVE = 1;
    this.moveCount = 0;
    this.changesHistory = [];
    this.koHistory = [];
    this.colorHistory = [];

    for (var i = 0; i < this.boardSize + 2; i++) {
        this.board[i][0] = this.BORDER_LINE;
        this.board[i][boardSize + 1] = this.BORDER_LINE;
        this.board[boardSize + 1][i] = this.BORDER_LINE;
        this.board[0][i] = this.BORDER_LINE;
    }

};

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
    return (this.colorOf(pos) == this.BLACK || this.colorOf(pos) == this.WHITE);
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
    return (this.colorHistory[this.moveCount-1] * 2) % 3;
}

GoBoard.prototype.undo = function(){
    if (this.moveCount==0){
        return {add:[], remove:[]};
    }
    var changes = this.boardChange();
    for (let i of changes.add) {
        this.remove(this.posOf(i));
    }
    for (let i of changes.remove) {
        this.placeStone(this.posOf(i), this.latestColorReverse());
    }
    this.moveCount--;
    return {add:changes.remove, remove:changes.add};
}

GoBoard.prototype.redo = function(){
    if (this.moveCount==this.changesHistory.length){
        return {add:[], remove:[]};
    }
    this.moveCount++;
    var changes = this.boardChange();
    for (let i of changes.add) {
        this.placeStone(this.posOf(i), this.latestColor());
    }
    for (let i of changes.remove) {
        this.remove(this.posOf(i));
    }
    return changes;
}

GoBoard.prototype.move = function(pos1, pos2, color) {
    try {
        this.preMove([pos1, pos2], color);
    } catch (err) {
        console.log(err);
        return { add: [], remove: [] };
    }
    this.postMove([pos1, pos2]);
    return this.boardChange();
}

GoBoard.prototype.preMove = function(pos, color) {
    this.beforePlaceStoneCheck(pos);
    this.placeStone(pos, color);
    this.afterPlaceStoneCheck(pos);
}

GoBoard.prototype.placeStone = function(pos, color){
    this.board[pos[0]][pos[1]] = color;
    this.updateGraph(pos);
    this.updateLiberty(pos);
}

GoBoard.prototype.beforePlaceStoneCheck = function(pos){
    if (this.hashOf(pos) == this.latestKo()) {
        throw 'It is a ko you shouldn\'t play';
    } else if (this.colorOf(pos) != this.NO_STONE) {
        throw 'There is already a stone at the position.';
    }
}

GoBoard.prototype.afterPlaceStoneCheck = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) != this.colorOf(pos) &&
            this.isDead(neighbor)) {
            return;
        }
    }
    if (this.isDead(pos)) {
        this.remove(pos);
        throw 'Invalid move...';
    }
    return;
};

GoBoard.prototype.postMove = function(pos){
    var deadPositions = this.removeDead(pos);

    this.koHistory = this.koHistory.slice(0, this.moveCount);
    this.setKo(pos, deadPositions);

    this.changesHistory = this.changesHistory.slice(0, this.moveCount);
    this.changesHistory.push({ add: [this.hashOf(pos)], remove: deadPositions});

    this.colorHistory = this.colorHistory.slice(0, this.moveCount);
    this.colorHistory.push(this.colorOf(pos));

    this.moveCount++;
}

GoBoard.prototype.setKo = function(pos, deadPositions) {
    var onlyGotOne = (deadPositions.length == 1);
    var onItsOwn = (!this.connectedGraph.hasNeighbors(pos));
    if (onlyGotOne && onItsOwn) {
        this.koHistory.push(deadPositions[0]);
    } else {
        this.koHistory.push(-1);
    }
}

GoBoard.prototype.updateGraph = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.colorOf(pos)) {
            this.connectedGraph.addEdge(this.hashOf(neighbor), this.hashOf(pos));
        }
    }
};

GoBoard.prototype.updateLiberty = function(pos) {
    this.updateLibertyNeighbor(pos);
    this.updateLibertyLocally(pos);
};

GoBoard.prototype.updateLibertyNeighbor = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            this.liberty[this.hashOf(neighbor)] -= 1;
        }
    }
}

GoBoard.prototype.updateLibertyLocally = function(pos) {
    var neighbors = this.neighborsOf(pos);
    var localLiberty = 0;
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.NO_STONE) {
            localLiberty += 1;
        }
    }
    this.liberty[this.hashOf(pos)] = localLiberty;
};

GoBoard.prototype.isDead = function(pos) {
    if (!this.isStone(pos)) {
        return false;
    }
    var connectedQueue = this.connectedGraph.bfsQueue(this.hashOf(pos));
    for (let v of connectedQueue) {
        if (this.liberty[v] != 0) {
            return false;
        }
    }
    return true;
}

GoBoard.prototype.remove = function(pos) {
    this.board[pos[0]][pos[1]] = this.NO_STONE;
    this.resetGraph(pos);
    this.resetLiberty(pos);
};

GoBoard.prototype.resetLiberty = function(pos) {
    var neighbors = this.neighborsOf(pos);
    delete this.liberty[this.hashOf(pos)];
    for (let neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            this.liberty[this.hashOf(neighbor)] += 1;
        }
    }
};

GoBoard.prototype.resetGraph = function(pos) {
    this.connectedGraph.drop(this.hashOf(pos));
};

GoBoard.prototype.removeDead = function(pos) {
    var deadPositions = [];
    var color = this.colorOf(pos);
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) != color &&
            this.isDead(neighbor)) {
            var deadBFSqueue = this.connectedGraph.bfsQueue(this.hashOf(neighbor));
            for (let v of deadBFSqueue) {
                this.remove(this.posOf(v));
                deadPositions.push(v);
            }
        }
    }
    return deadPositions;
};
