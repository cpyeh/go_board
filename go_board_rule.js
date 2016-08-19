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

var Graph = function() {
    this.graph = {}; // {u: {v: true, ...}, ...}
}

Graph.prototype.adj = function(u) {
    if ((typeof this.graph[u]) == 'undefined') {
        return {};
    }
    return this.graph[u];
}

Graph.prototype.has = function(u, v) {
    if ((typeof this.graph[u]) != 'undefined') {
        return (typeof this.graph[u][v]) != 'undefined';
    } else {
        return false;
    }
}

Graph.prototype.addEdge = function(u, v) {
    set(this, u, v);
    set(this, v, u);
}

Graph.prototype.drop = function(v) {
    for (var u in this.adj(v)) {
        delete this.graph[v][u];
        delete this.graph[u][v];
    }
    return true;
}

Graph.prototype.toString = function() {
    var outString = '';
    for (var u in this.graph) {
        outString += u + ': (';
        for (var v in this.graph[u]) {
            outString += v + ', ';
        }
        outString += ')\n';
    }
    return outString;
}

function set(g, u, v) {
    g.graph[u] = g.graph[u] || {};
    g.graph[u][v] = true;
}

function BFSQueue(graph, rootNode) {
    var searchQueue = new Queue();
    var bfsQueue = new Queue();
    var marked = {};
    searchQueue.enqueue(rootNode);
    marked[rootNode] = true;
    while (!searchQueue.isEmpty()) {
        var v = searchQueue.dequeue().value;
        bfsQueue.enqueue(v);
        for (var w in graph.adj(v)) {
            if ((typeof marked[w]) == 'undefined') {
                marked[w] = true;
                searchQueue.enqueue(w);
            }
        }
    }
    return bfsQueue;
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
    }
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
        }
    }
}

GoBoard.prototype.setKo = function(pos, deadPositions) {
    var onlyGotOne = (deadPositions.length == 1);
    var neighborOfMove = this.connectedGraph.graph[this.hashOf(pos)];
    var onItsOwn = (((typeof neighborOfMove) == 'undefined') ||
        Object.keys(neighborOfMove).length === 0);
    if (onlyGotOne && onItsOwn) {
        this.ko = deadPositions[0];
    } else {
        this.ko = -1;
    }
}

GoBoard.prototype.updateGraph = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
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
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.BLACK || this.colorOf(neighbor) == this.WHITE) {
            this.liberty[this.hashOf(neighbor)] -= 1;
        }
    }
}

GoBoard.prototype.updateLibertyLocally = function(pos) {
    var neighbors = this.neighborsOf(pos);
    var localLiberty = 0;
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.NO_STONE) {
            localLiberty += 1;
        }
    }
    this.liberty[this.hashOf(pos)] = localLiberty;
};

GoBoard.prototype.isDead = function(pos) {
    if (this.colorOf(pos) != this.BLACK && this.colorOf(pos) != this.WHITE) {
        return false;
    }
    var connectedQueue = BFSQueue(this.connectedGraph, this.hashOf(pos));
    while (!connectedQueue.isEmpty()) {
        var node = connectedQueue.dequeue();
        if (this.liberty[node.value] != 0) {
            return false;
        }
    }
    return true;
}

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
};

GoBoard.prototype.resetLiberty = function(pos) {
    var neighbors = this.neighborsOf(pos);
    delete this.liberty[this.hashOf(pos)];
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) == this.BLACK || this.colorOf(neighbor) == this.WHITE) {
            this.liberty[this.hashOf(neighbor)] += 1;
        }
    }
};

GoBoard.prototype.resetGraph = function(pos) {
    this.connectedGraph.drop(this.hashOf(pos));
};

GoBoard.prototype.removeDead = function(pos, color) {
    var deadPositions = [];
    var neighbors = this.neighborsOf(pos);
    for (neighbor of neighbors) {
        if (this.colorOf(neighbor) != color &&
            this.isDead(neighbor)) {
            var deadBFSqueue = BFSQueue(this.connectedGraph, this.hashOf(neighbor));
            while (!deadBFSqueue.isEmpty()) {
                var node = deadBFSqueue.dequeue();
                this.remove(this.posOf(node.value));
                deadPositions.push(node.value);
            }
        }
    }
    return deadPositions;
};
