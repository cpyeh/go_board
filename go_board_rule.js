var Queue = function() {
    this.first = null;
    this.size = 0;
    this.last = null;
};

var Node = function(value, next){
    this.value = value;
    this.next = next;
}

Queue.prototype.enqueue = function(value) {
    var node = new Node(value,null);
    if (!this.first){
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

Queue.prototype.isEmpty = function(){
    return this.size == 0;
}


var Graph = function() {
    this.graph = {}; // {u: {v: true, ...}, ...}
}

Graph.prototype.adj = function(u) {
    if ((typeof this.graph[u]) == 'undefined'){
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
    // set/unset edges and increment/decrement degrees
    set(this, u, v);
    set(this, v, u);
}

Graph.prototype.drop = function(v) {
    // remove adjacent edges
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
    // add to adjacency list
    g.graph[u] = g.graph[u] || {};
    g.graph[u][v] = true;
}

function BFSQueue(graph, rootNode){
    var searchQueue = new Queue();
    var bfsQueue = new Queue();
    var marked = {};
    searchQueue.enqueue(rootNode);
    marked[rootNode] = true;
    while (!searchQueue.isEmpty()){
            var v = searchQueue.dequeue().value;
            bfsQueue.enqueue(v);
            for (var w in graph.adj(v)){
                    if((typeof marked[w]) == 'undefined'){
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
    this.ko = -1; // hash value of place can't play
                 // -1 if no such position
    this.chi = {};
    this.NO_STONE = 0;
    this.BLACK = 1;
    this.WHITE = 2;
    this.BORDER_LINE = 3;
    this.CURRENT_MOVE = 1;

    for (var i = 0; i < this.boardSize + 2; i++){
        this.board[i][0] = this.BORDER_LINE;
        this.board[i][boardSize+1] = this.BORDER_LINE;
        this.board[boardSize+1][i] = this.BORDER_LINE;
        this.board[0][i] = this.BORDER_LINE;
    }

};

GoBoard.prototype.move = function(pos1, pos2, color) {

    if(!this.checkValid(pos1,pos2)){
        return {addStones:[], removeStones:[]};
    }
    // make the move and update status
    this.board[pos1][pos2] = color;
    this.updateGraph(pos1, pos2);
    this.updateChi(pos1, pos2);

    // check if the move is valid
    if (!this.checkValidWithNeighbor(pos1, pos2, color)){
            console.log('Invalid move...');
            this.remove(pos1, pos2);
            return {addStones:[], removeStones:[]};
    } else {
        var moveDeadResults = this.removeDead(pos1, pos2, color);
        var onlyGotOne = (moveDeadResults.countDead == 1);
        var neighborOfMove =  this.connectedGraph.graph[(pos1<<5)+pos2];
        var onItsOwn =  ( ((typeof neighborOfMove) == 'undefined') ||
            Object.keys(neighborOfMove).length === 0);
        if ( onlyGotOne && onItsOwn){
            this.ko = moveDeadResults.deadPositions[0];
        }
        else{
            this.ko = -1;
        }
        return {addStones:[ (pos1<<5) + pos2 ], removeStones:moveDeadResults.deadPositions}
    }
};

GoBoard.prototype.checkValid = function(pos1, pos2) {
    if (((pos1<<5) + pos2) == this.ko){
            console.log('It is a ko you shouldn\'t play');
            return false;
    }
    else if (this.board[pos1][pos2] != this.NO_STONE) {
        console.log('There is already a stone at the position.');
        return false;
    }else {
        return true;
    }
};

GoBoard.prototype.updateGraph = function(pos1, pos2){
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
    for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if (this.board[neighbor_pos1][neighbor_pos2] == this.board[pos1][pos2]){
                    this.connectedGraph.addEdge((neighbor_pos1<<5) + neighbor_pos2, (pos1<<5) + pos2)
            }
    }
};

GoBoard.prototype.updateChi = function(pos1, pos2){
    this.updateChiNeighbor(pos1, pos2);
    this.updateChiLocally(pos1, pos2);

};

GoBoard.prototype.updateChiNeighbor = function(pos1, pos2){
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
    for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if( this.board[neighbor_pos1][neighbor_pos2] == this.BLACK || this.board[neighbor_pos1][neighbor_pos2] == this.WHITE){
                    this.chi[(neighbor_pos1<<5) + neighbor_pos2] -= 1;
            }
     }
}

GoBoard.prototype.updateChiLocally = function(pos1, pos2){
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
    var localChi = 0;
    for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if (this.board[neighbor_pos1][neighbor_pos2] == this.NO_STONE){
                 localChi += 1;
            }
    }
    this.chi[(pos1<<5) + pos2] = localChi;
};

GoBoard.prototype.isDead = function(pos1,pos2){
    if(this.board[pos1][pos2]!=1 && this.board[pos1][pos2]!=2){
            return false;
    }
    var connectedQueue = BFSQueue(this.connectedGraph, (pos1<<5)+pos2);
    while(!connectedQueue.isEmpty()){
            var node = connectedQueue.dequeue();
            if (this.chi[node.value]!=0){
                    return false;
            }
    }
    return true;
}

GoBoard.prototype.checkValidWithNeighbor = function(pos1, pos2, color) {
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
    for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if (this.board[neighbor_pos1][neighbor_pos2] != color &&
                this.isDead(neighbor_pos1,neighbor_pos2)){
                    return true;
            }
     }
     if (this.isDead(pos1,pos2)) {
                return false;
    }
    return true;
};

GoBoard.prototype.remove = function(pos1, pos2) {
    this.resetChi(pos1, pos2);
    this.resetGraph(pos1, pos2);
    this.board[pos1][pos2] = 0;
};

GoBoard.prototype.resetChi = function(pos1, pos2) {
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
    delete this.chi[(pos1<<5)+pos2];
     for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if( this.board[neighbor_pos1][neighbor_pos2] == 1 || this.board[neighbor_pos1][neighbor_pos2] == 2){
                    this.chi[(neighbor_pos1<<5) + neighbor_pos2] += 1;
            }
     } 1
};
GoBoard.prototype.resetGraph = function(pos1, pos2) {
        this.connectedGraph.drop((pos1<<5)+pos2);
};

GoBoard.prototype.removeDead = function(pos1, pos2, color){
    var countDead = 0;
    var deadPositions = [];
    var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
     for (var i = 0; i < 4; i++){
            var neighbor_pos1 = neighbors[i][0];
            var neighbor_pos2 = neighbors[i][1];
            if (this.board[neighbor_pos1][neighbor_pos2] != color &&
                this.isDead(neighbor_pos1,neighbor_pos2)){
                    var deadBFSqueue = BFSQueue(this.connectedGraph, (neighbor_pos1<<5) + neighbor_pos2);
                    while(!deadBFSqueue.isEmpty()){
                            var node = deadBFSqueue.dequeue();
                            this.remove(node.value >> 5, 0x00001F & node.value);
                            countDead++;
                            deadPositions.push(node.value);
                    }
            }
     }
     return {countDead: countDead, deadPositions:deadPositions};
};
