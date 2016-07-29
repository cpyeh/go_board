var chart = d3.select("#go_board_div")
    .append('svg')
    .attr('id','go_board_svg')
    .attr("height", "100%")
    .attr("width", "100%")
    .style('margin', 'auto')
    .style('display', 'block');

var parent_node = chart.node().parentNode;

var w = parseInt(parent_node.style.width);
var h = parseInt(parent_node.style.height);

var boardSize = 19;
var horizontal_gap = w / (boardSize+1);
var vertical_gap = h / (boardSize+1);
var margin = {
    top: vertical_gap,
    right: horizontal_gap,
    bottom: vertical_gap,
    left: horizontal_gap
};


for (i = 0; i < boardSize; i++){
    chart.append('line')
    .attr('x1', margin.left + i * horizontal_gap)
    .attr('y1', margin.top)
    .attr('x2', margin.left + i * horizontal_gap)
    .attr('y2', h - margin.bottom)
    .style("stroke","rgb(0,0,0)" )
    .style("stroke-width",w/250 );

    chart.append('line')
    .attr('x1', margin.left)
    .attr('y1', margin.top + i * vertical_gap)
    .attr('x2', w - margin.right)
    .attr('y2', margin.top + i * vertical_gap)
    .style("stroke","rgb(0,0,0)" )
    .style("stroke-width",w/250 );

}

var star_positons = [{x:3,y:3}, {x:3,y:15}, {x:15,y:3}, {x:15, y:15}];

for (i = 0 ; i < star_positons.length ; i++){
    chart.append('circle')
        .attr('cx', margin.left + star_positons[i].x * horizontal_gap)
        .attr('cy', margin.top + star_positons[i].y * vertical_gap)
        .attr('r', w/250)
        .attr('stroke', 'black')
        .attr('stroke-width', w/250)
        .attr('fill', 'black');
}



//click square
for (var i=0 ; i < boardSize ; i++){
    for(var j=0 ; j < boardSize ; j++){
        // i+1, j+1 because the pos has to be in [1,boardSize]
        chart.append('circle')
        .attr('cx', margin.left + i * horizontal_gap)
        .attr('cy', margin.right + j * vertical_gap)
        .attr('r', vertical_gap/2.1)
        .attr('id', 'z_' + (i+1).toString() + '_' + (j+1).toString())
        .attr('opacity',0)
        .attr('onmouseover', 'show_z(this.id)')
        .attr('onmouseleave', 'dont_show_z(this.id)')
        .attr('onclick', 'click_on_pos(this.id)');

    }
}

function show_z(id){
    var element_style = document.getElementById(id).style;
    element_style.opacity = 0.3;
    if (current_color == go_board.BLACK){
        element_style.fill = 'blue';
        element_style.stroke = 'blue';
        element_style.strokeWidth = w/250;
    }
    else {
        element_style.fill = 'white';
        element_style.stroke = 'blue';
        element_style.strokeWidth = w/250;
    }
};

function dont_show_z(id){
  document.getElementById(id).style.opacity = 0;
};

var go_board = new GoBoard(boardSize);
var current_color = go_board.BLACK;

function click_on_pos(id){
    var positions = id.split('_');
    var pos1 = parseInt(positions[1]);
    var pos2 = parseInt(positions[2]);
    var changes = go_board.move(pos1, pos2, current_color);
    update_board(changes);
    if (changes.addStones.length == 1){
        current_color = (current_color==go_board.BLACK ? go_board.WHITE : go_board.BLACK);
    }
}

function update_board(changes){
    for (var i = 0; i < changes.addStones.length; i++){
        draw_stone(changes.addStones[i])
    }
    for (var i = 0; i < changes.removeStones.length; i++){
        eliminate_stone(changes.removeStones[i])
    }
}


function draw_stone(pos_value){
    var pos1 = pos_value>>5;
    var pos2 = 0x00001F & pos_value;

    var stone = chart.insert('circle',':first-child')
        .attr('cx', margin.left + (pos1-1) * horizontal_gap)
        .attr('cy', margin.right + (pos2-1) * vertical_gap)
        .attr('r', vertical_gap/2.3)
        .attr('id', 's_' + pos1 + '_' + pos2)
        .style('opacity', 1)
        .style('stroke', 'black')
        .style('stroke-width', w/250);

    if (current_color == go_board.BLACK){
        stone.style('fill', 'black');
    }else{
        stone.style('fill', 'white');
    }
}

function eliminate_stone(pos_value){
    var pos1 = pos_value>>5;
    var pos2 = 0x00001F & pos_value;
    var element = document.getElementById('s_' + pos1 + '_' + pos2);
    document.getElementById('go_board_svg').removeChild(element);
}
