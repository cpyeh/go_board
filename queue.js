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

module.exports =  Queue;