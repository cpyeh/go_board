<<<<<<< HEAD
var Queue = function() {
    this.first = null;
    this.size = 0;
    this.last = null;
};

var Node = function(value, next) {
    this.value = value;
    this.next = next;
}

Queue.prototype.enqueue = function(value) {
    var node = new Node(value, null);
    if (!this.first) {
        this.first = node;
        this.last = this.first;
    } else {
        this.last.next = node;
        this.last = node;
    }
    this.size += 1;
    return node;
};

Queue.prototype.dequeue = function() {
    var temp = this.first;
    this.first = this.first.next;
    this.size -= 1;
    return temp;
};

Queue.prototype.isEmpty = function() {
    return this.size == 0;
}

||||||| merged common ancestors
var Queue = function() {
    this.first = null;
    this.size = 0;
    this.last = null;
};

var Node = function(value, next) {
    this.value = value;
    this.next = next;
}

Queue.prototype.enqueue = function(value) {
    var node = new Node(value, null);
    if (!this.first) {
        this.first = node;
        this.last = this.first;
    } else {
        this.last.next = node;
        this.last = node;
    }
    this.size += 1;
    return node;
};

Queue.prototype.dequeue = function() {
    var temp = this.first;
    this.first = this.first.next;
    this.size -= 1;
    return temp;
};

Queue.prototype.isEmpty = function() {
    return this.size == 0;
}


=======
>>>>>>> master
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
<<<<<<< HEAD
    set(this, u, v);
    set(this, v, u);
||||||| merged common ancestors
    // set/unset edges and increment/decrement degrees
    set(this, u, v);
    set(this, v, u);
=======
    this.setOneWay(u, v);
    this.setOneWay(v, u);
>>>>>>> master
}

<<<<<<< HEAD
Graph.prototype.drop = function(v) {
    for (var u in this.adj(v)) {
        delete this.graph[v][u];
||||||| merged common ancestors
Graph.prototype.drop = function(v) {
    // remove adjacent edges
    for (var u in this.adj(v)) {
        delete this.graph[v][u];
=======
Graph.prototype.drop = function(u) {
    for (let v of this.adj(u)) {
>>>>>>> master
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

<<<<<<< HEAD
function set(g, u, v) {
    g.graph[u] = g.graph[u] || {};
    g.graph[u][v] = true;
||||||| merged common ancestors
function set(g, u, v) {
    // add to adjacency list
    g.graph[u] = g.graph[u] || {};
    g.graph[u][v] = true;
=======
Graph.prototype.setOneWay = function(u, v) {
    this.graph[u] = this.graph[u] || {};
    this.graph[u][v] = true;
>>>>>>> master
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

<<<<<<< HEAD
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
||||||| merged common ancestors
GoBoard.prototype.move = function(pos1, pos2, color) {
=======
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
>>>>>>> master

<<<<<<< HEAD
GoBoard.prototype.colorOf = function(pos) {
    return this.board[pos[0]][pos[1]];
}

GoBoard.prototype.move = function(pos1, pos2, color) {
    var pos = [pos1, pos2];
    var changes = {
        add: [],
        remove: []
    };
    try {
        this.preMove(pos, color);
    } catch (err) {
        console.log(err);
        return changes;
||||||| merged common ancestors
    if (!this.checkValid(pos1, pos2)) {
        return {
            addStones: [],
            removeStones: []
        };
=======
GoBoard.prototype.beforePlaceStoneCheck = function(pos){
    if (this.hashOf(pos) == this.latestKo()) {
        throw 'It is a ko you shouldn\'t play';
    } else if (this.colorOf(pos) != this.NO_STONE) {
        throw 'There is already a stone at the position.';
>>>>>>> master
    }
<<<<<<< HEAD
    var deadPositions = this.removeDead(pos, color);
    this.setKo(pos, deadPositions);
    changes.add = [this.hashOf(pos)];
    changes.remove = deadPositions;
    return changes;
};

GoBoard.prototype.preMove = function(pos, color) {
    if (this.hashOf(pos) == this.ko) {
        throw 'It is a ko you shouldn\'t play';
    } else if (this.colorOf(pos) != this.NO_STONE) {
        throw 'There is already a stone at the position.';
    } else {
        this.board[pos[0]][pos[1]] = color;
        this.updateGraph(pos);
        this.updateLiberty(pos);
        if (!this.isValidMove(pos)) {
            this.remove(pos);
            throw 'Invalid move...';
||||||| merged common ancestors
    // make the move and update status
    this.board[pos1][pos2] = color;
    this.updateGraph(pos1, pos2);
    this.updateChi(pos1, pos2);

    // check if the move is valid
    if (!this.checkValidWithNeighbor(pos1, pos2, color)) {
        console.log('Invalid move...');
        this.remove(pos1, pos2);
        return {
            addStones: [],
            removeStones: []
        };
    } else {
        var moveDeadResults = this.removeDead(pos1, pos2, color);
        var onlyGotOne = (moveDeadResults.countDead == 1);
        var neighborOfMove = this.connectedGraph.graph[(pos1 << 5) + pos2];
        var onItsOwn = (((typeof neighborOfMove) == 'undefined') ||
            Object.keys(neighborOfMove).length === 0);
        if (onlyGotOne && onItsOwn) {
            this.ko = moveDeadResults.deadPositions[0];
        } else {
            this.ko = -1;
        }
        return {
            addStones: [(pos1 << 5) + pos2],
            removeStones: moveDeadResults.deadPositions
=======
}

GoBoard.prototype.afterPlaceStoneCheck = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) != this.colorOf(pos) &&
            this.isDead(neighbor)) {
            return;
>>>>>>> master
        }
    }
<<<<<<< HEAD
}
||||||| merged common ancestors
};
=======
    if (this.isDead(pos)) {
        this.remove(pos);
        throw 'Invalid move...';
    }
    return;
};
>>>>>>> master

<<<<<<< HEAD
GoBoard.prototype.setKo = function(pos, deadPositions) {
    var onlyGotOne = (deadPositions.length == 1);
    var neighborOfMove = this.connectedGraph.graph[this.hashOf(pos)];
    var onItsOwn = (((typeof neighborOfMove) == 'undefined') ||
        Object.keys(neighborOfMove).length === 0);
    if (onlyGotOne && onItsOwn) {
        this.ko = deadPositions[0];
||||||| merged common ancestors
GoBoard.prototype.checkValid = function(pos1, pos2) {
    if (((pos1 << 5) + pos2) == this.ko) {
        console.log('It is a ko you shouldn\'t play');
        return false;
    } else if (this.board[pos1][pos2] != this.NO_STONE) {
        console.log('There is already a stone at the position.');
        return false;
=======
GoBoard.prototype.postMove = function(pos){
    var deadPositions = this.removeDead(pos);
    this.setKo(pos, deadPositions);
    this.changesHistory = this.changesHistory.slice(0, this.moveCount);
    this.changesHistory.push({ add: [this.hashOf(pos)], remove: deadPositions});
    this.colorHistory.push(this.colorOf(pos));
    this.moveCount++;
}

GoBoard.prototype.setKo = function(pos, deadPositions) {
    var onlyGotOne = (deadPositions.length == 1);
    var onItsOwn = (!this.connectedGraph.hasNeighbors(pos));
    if (onlyGotOne && onItsOwn) {
        this.koHistory.push(deadPositions[0]);
>>>>>>> master
    } else {
<<<<<<< HEAD
        this.ko = -1;
||||||| merged common ancestors
        return true;
=======
        this.koHistory.push(-1);
>>>>>>> master
    }
}

<<<<<<< HEAD
GoBoard.prototype.updateGraph = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.colorOf(pos)) {
            this.connectedGraph.addEdge(this.hashOf(neighbor), this.hashOf(pos));
||||||| merged common ancestors
GoBoard.prototype.updateGraph = function(pos1, pos2) {
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] == this.board[pos1][pos2]) {
            this.connectedGraph.addEdge((neighbor_pos1 << 5) + neighbor_pos2, (pos1 << 5) + pos2)
=======
GoBoard.prototype.updateGraph = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.colorOf(pos)) {
            this.connectedGraph.addEdge(this.hashOf(neighbor), this.hashOf(pos));
>>>>>>> master
        }
    }
};

GoBoard.prototype.updateLiberty = function(pos) {
    this.updateLibertyNeighbor(pos);
    this.updateLibertyLocally(pos);
};

<<<<<<< HEAD
GoBoard.prototype.updateLibertyNeighbor = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.BLACK || this.colorOf(neighbor) == this.WHITE) {
            this.liberty[this.hashOf(neighbor)] -= 1;
||||||| merged common ancestors
GoBoard.prototype.updateChiNeighbor = function(pos1, pos2) {
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] == this.BLACK || this.board[neighbor_pos1][neighbor_pos2] == this.WHITE) {
            this.chi[(neighbor_pos1 << 5) + neighbor_pos2] -= 1;
=======
GoBoard.prototype.updateLibertyNeighbor = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            this.liberty[this.hashOf(neighbor)] -= 1;
>>>>>>> master
        }
    }
}

<<<<<<< HEAD
GoBoard.prototype.updateLibertyLocally = function(pos) {
    var neighbors = this.neighborsOf(pos);
    var localLiberty = 0;
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.NO_STONE) {
            localLiberty += 1;
||||||| merged common ancestors
GoBoard.prototype.updateChiLocally = function(pos1, pos2) {
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    var localChi = 0;
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] == this.NO_STONE) {
            localChi += 1;
=======
GoBoard.prototype.updateLibertyLocally = function(pos) {
    var neighbors = this.neighborsOf(pos);
    var localLiberty = 0;
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.NO_STONE) {
            localLiberty += 1;
>>>>>>> master
        }
    }
    this.liberty[this.hashOf(pos)] = localLiberty;
};

<<<<<<< HEAD
GoBoard.prototype.isDead = function(pos) {
    if (this.colorOf(pos) != this.BLACK && this.colorOf(pos) != this.WHITE) {
||||||| merged common ancestors
GoBoard.prototype.isDead = function(pos1, pos2) {
    if (this.board[pos1][pos2] != 1 && this.board[pos1][pos2] != 2) {
=======
GoBoard.prototype.isDead = function(pos) {
    if (!this.isStone(pos)) {
>>>>>>> master
        return false;
    }
<<<<<<< HEAD
    var connectedQueue = BFSQueue(this.connectedGraph, this.hashOf(pos));
    while (!connectedQueue.isEmpty()) {
        var node = connectedQueue.dequeue();
        if (this.liberty[node.value] != 0) {
||||||| merged common ancestors
    var connectedQueue = BFSQueue(this.connectedGraph, (pos1 << 5) + pos2);
    while (!connectedQueue.isEmpty()) {
        var node = connectedQueue.dequeue();
        if (this.chi[node.value] != 0) {
=======
    var connectedQueue = this.connectedGraph.bfsQueue(this.hashOf(pos));
    for (let v of connectedQueue) {
        if (this.liberty[v] != 0) {
>>>>>>> master
            return false;
        }
    }
    return true;
}

<<<<<<< HEAD
GoBoard.prototype.isValidMove = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) != this.colorOf(pos) &&
            this.isDead(neighbor)) {
            return true;
        }
    }
    if (this.isDead(pos)) {
        return false;
    }
    return true;
};

GoBoard.prototype.remove = function(pos) {
    this.resetLiberty(pos);
    this.resetGraph(pos);
    this.board[pos[0]][pos[1]] = this.NO_STONE;
||||||| merged common ancestors
GoBoard.prototype.checkValidWithNeighbor = function(pos1, pos2, color) {
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] != color &&
            this.isDead(neighbor_pos1, neighbor_pos2)) {
            return true;
        }
    }
    if (this.isDead(pos1, pos2)) {
        return false;
    }
    return true;
};

GoBoard.prototype.remove = function(pos1, pos2) {
    this.resetChi(pos1, pos2);
    this.resetGraph(pos1, pos2);
    this.board[pos1][pos2] = 0;
=======
GoBoard.prototype.remove = function(pos) {
    this.board[pos[0]][pos[1]] = this.NO_STONE;
    this.resetGraph(pos);
    this.resetLiberty(pos);
>>>>>>> master
};

<<<<<<< HEAD
GoBoard.prototype.resetLiberty = function(pos) {
    var neighbors = this.neighborsOf(pos);
    delete this.liberty[this.hashOf(pos)];
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.BLACK || this.colorOf(neighbor) == this.WHITE) {
            this.liberty[this.hashOf(neighbor)] += 1;
||||||| merged common ancestors
GoBoard.prototype.resetChi = function(pos1, pos2) {
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    delete this.chi[(pos1 << 5) + pos2];
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] == 1 || this.board[neighbor_pos1][neighbor_pos2] == 2) {
            this.chi[(neighbor_pos1 << 5) + neighbor_pos2] += 1;
=======
GoBoard.prototype.resetLiberty = function(pos) {
    var neighbors = this.neighborsOf(pos);
    delete this.liberty[this.hashOf(pos)];
    for (let neighbor of neighbors) {
        if (this.isStone(neighbor)) {
            this.liberty[this.hashOf(neighbor)] += 1;
>>>>>>> master
        }
    }
};

GoBoard.prototype.resetGraph = function(pos) {
    this.connectedGraph.drop(this.hashOf(pos));
};

<<<<<<< HEAD
GoBoard.prototype.removeDead = function(pos, color) {
||||||| merged common ancestors
GoBoard.prototype.removeDead = function(pos1, pos2, color) {
    var countDead = 0;
=======
GoBoard.prototype.removeDead = function(pos) {
>>>>>>> master
    var deadPositions = [];
<<<<<<< HEAD
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) != color &&
            this.isDead(neighbor)) {
            var deadBFSqueue = BFSQueue(this.connectedGraph, this.hashOf(neighbor));
            while (!deadBFSqueue.isEmpty()) {
                var node = deadBFSqueue.dequeue();
                this.remove(this.posOf(node.value));
                deadPositions.push(node.value);
||||||| merged common ancestors
    var neighbors = [
        [pos1 - 1, pos2],
        [pos1 + 1, pos2],
        [pos1, pos2 - 1],
        [pos1, pos2 + 1]
    ];
    for (var i = 0; i < 4; i++) {
        var neighbor_pos1 = neighbors[i][0];
        var neighbor_pos2 = neighbors[i][1];
        if (this.board[neighbor_pos1][neighbor_pos2] != color &&
            this.isDead(neighbor_pos1, neighbor_pos2)) {
            var deadBFSqueue = BFSQueue(this.connectedGraph, (neighbor_pos1 << 5) + neighbor_pos2);
            while (!deadBFSqueue.isEmpty()) {
                var node = deadBFSqueue.dequeue();
                this.remove(node.value >> 5, 0x00001F & node.value);
                countDead++;
                deadPositions.push(node.value);
=======
    var color = this.colorOf(pos);
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
        if (this.colorOf(neighbor) != color &&
            this.isDead(neighbor)) {
            var deadBFSqueue = this.connectedGraph.bfsQueue(this.hashOf(neighbor));
            for (let v of deadBFSqueue) {
                this.remove(this.posOf(v));
                deadPositions.push(v);
>>>>>>> master
            }
        }
    }
    return deadPositions;
};
