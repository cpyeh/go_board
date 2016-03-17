var Queue = require('./queue.js');
var Graph = require('./graph.js');
var BFSQueue = require('./bfsqueue.js');

function GoBoard(boardSize) {
  this.boardSize = boardSize;
  this.board = new Array(boardSize + 2);
  for (var i = 0; i < this.boardSize + 2; i++) {
    this.board[i] = new Int8Array(boardSize + 2);
  }
  this.connectedGraph = new Graph();
  this.ko = 0; // hash value of place can't play
               // 0 if no such position 
  this.chi = {};
  this.NO_STONE = 0;
  this.BLACK = 1;
  this.WHITE = 2;
  this.BORDER_LINE = 3;
  this.CURRENT_MOVE = 1;
};

//public:
//  move
//  print
//
//private:  
//  getNeighbor
//  removeDead 
//    bfs
//  isDead // if not remove any dead and is dead, then it is not allowed
//  


GoBoard.prototype.move = function(pos1, pos2, color) {
  if ((pos1*32+pos2) == this.ko){
      console.log('It is a ko you shouldn\'t play');
      return;
  }
  this.board[pos1][pos2] = color;
  this.updateGraph(pos1, pos2);
  this.updateChi(pos1, pos2); // going through all the neighbors
 
  // check if any of the neighbor is dead
  // if not and self is dead then it is invalid
  var valid = this.checkValid(pos1, pos2);
  if (!valid){
      console.log('Invalid move...');
      return;
  }
  this.removeDead(pos1,pos2);    
  this.print();
};


GoBoard.prototype.updateGraph = function(pos1, pos2){
  var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
  for (var i = 0; i < 4; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if (this.board[neighbor_pos1][neighbor_pos2] == this.board[pos1][pos2]){
          this.connectedGraph.addEdge(neighbor_pos1*32 + neighbor_pos2, pos1*32 + pos2)
      }
  }  
};

GoBoard.prototype.updateChi = function(pos1, pos2){
  var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
  this.updateChiLocally(pos1, pos2);
   for (var i = 0; i < 4; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if( this.board[neighbor_pos1][neighbor_pos2] == 1 || this.board[neighbor_pos1][neighbor_pos2] == 2){
          this.chi[neighbor_pos1*32 + neighbor_pos2] -= 1;
      }
   } 
};


GoBoard.prototype.updateChiLocally = function(pos1, pos2){
  var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
  var localChi = 0;
  for (var i = 0; i < 4; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if (this.board[neighbor_pos1][neighbor_pos2] == 0){
         localChi += 1;
      }
  }
  this.chi[pos1*32 + pos2] = localChi;
};
///////////////////////
GoBoard.prototype.isDead = function(pos1,pos2){
  if(this.board[pos1][pos2]!=1 && this.board[pos1][pos2]!=2){
      return false;
  }
  var connectedQueue = BFSQueue(this.connectedGraph, pos1*32+pos2);
  while(!connectedQueue.isEmpty()){
      var node = connectedQueue.dequeue();
      if (this.chi[node.value]!=0){
          return false;
      }
  }
  return true;
}


GoBoard.prototype.checkValid = function(pos1, pos2, hasRemovedDead) {
  var neighbors = [[pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
  for (var i = 0; i < 4; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if (this.isDead(neighbor_pos1,neighbor_pos2)){
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
  delete this.chi[pos1*32+pos2];
   for (var i = 0; i < 4; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if( this.board[neighbor_pos1][neighbor_pos2] == 1 || this.board[neighbor_pos1][neighbor_pos2] == 2){
          this.chi[neighbor_pos1*32 + neighbor_pos2] += 1;
      }
   } 1
};
GoBoard.prototype.resetGraph = function(pos1, pos2) {
    this.connectedGraph.drop(pos1*32+pos2);
};

GoBoard.prototype.removeDead = function(pos1,pos2){
  var neighbors = [[pos1,pos2], [pos1-1,pos2],[pos1+1,pos2],[pos1,pos2-1],[pos1,pos2+1]];
   for (var i = 0; i < 5; i++){
      var neighbor_pos1 = neighbors[i][0];
      var neighbor_pos2 = neighbors[i][1];
      if (this.isDead(neighbor_pos1,neighbor_pos2)){
          var deadBFSqueue = BFSQueue(this.connectedGraph, neighbor_pos1*32 + neighbor_pos2);
          while(!deadBFSqueue.isEmpty()){
              var node = deadBFSqueue.dequeue();
              this.remove(node.value>>5, node.value%32);
          }
      }
   }
};


GoBoard.prototype.print = function() {
  // just for debugging
  var firstLine = "╔";
  for (var i = 1; i <= this.boardSize; i++) {
    firstLine += " ═ ";
  }
  console.log(firstLine + "╗");
  for (var i = 1; i <= this.boardSize; i++) {
    var middleLine = "║";
    for (var j = 1; j <= this.boardSize; j++) {
      switch (this.board[i][j]) {
        case 0:
          middleLine += " ┼ ";
          break;
        case 1:
          middleLine += " o ";
          break;
        case 2:
          middleLine += " @ ";
      }
    }
    console.log(middleLine += "║");
  }
  var lastLine = "╚";
  for (var i = 1; i <= this.boardSize; i++) {
    lastLine += " ═ ";
  }
  console.log(lastLine += "╝");
};

module.exports = GoBoard;