var Graph = function() {
    this.graph = {};
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
    this.setOneWay(u, v);
    this.setOneWay(v, u);
}

Graph.prototype.drop = function(v) {
    var adj_nodes = this.adj(v);
    for (let u in adj_nodes) {
        if (adj_nodes.hasOwnProperty(u)) {
            delete this.graph[v][u];
            delete this.graph[u][v];
        }
    }
    return true;
}

Graph.prototype.hasNeighbors = function(u) {
    return Object.keys(this.adj(u)).length > 0;
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
        var adj_nodes = this.adj(v);
        for (let w in adj_nodes) {
            if (adj_nodes.hasOwnProperty(w)) {
                if (!(w in marked)) {
                    marked[w] = true;
                    searchQueue.push(w);
                }
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

GoBoard.prototype.move = function(pos1, pos2, color) {
    var pos = [pos1, pos2];
    var changes = {
        add: [],
        remove: []
    };
    try {
        this.placeStone(pos, color);
    } catch (err) {
        console.log(err);
        return changes;
    }
    var deadPositions = this.removeDead(pos);
    this.setKo(pos, deadPositions);
    changes.add = [this.hashOf(pos)];
    changes.remove = deadPositions;
    return changes;
};

GoBoard.prototype.placeStone = function(pos, color) {
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
    var onItsOwn = (!this.connectedGraph.hasNeighbors(pos));
    if (onlyGotOne && onItsOwn) {
        this.ko = deadPositions[0];
    } else {
        this.ko = -1;
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

GoBoard.prototype.isValidMove = function(pos) {
    var neighbors = this.neighborsOf(pos);
    for (let neighbor of neighbors) {
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
