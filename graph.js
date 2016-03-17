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

module.exports = Graph;