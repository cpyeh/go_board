//undirected
var Queue = require('./queue.js');

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

module.exports = BFSQueue;

