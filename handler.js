// constantes
var DEFAULT_BOARD_SIZE = 8;

// inicializo tablero
var board = new Board(DEFAULT_BOARD_SIZE);
var rules = new Rules(board);

// Variable utilizada para facilitar la info del candy arrastrado
var dragDropInfo = null;

// Inicializacion de la pagina, cuando termina de cargar todo:
// limpia el tablero, resetea el puntaje y prepara un nuevo juego
$(document).ready(function() {
	board.clear();
	board.resetScore();
	rules.prepareNewGame();
});

// Agrega un candy al tablero
$(board).on('add', function(e, info) {
	var candy = info.candy;
	var img = document.createElement("img");
	
	$("#gameBoard").append(img);

	img.src = "graphics/" + candy.toString() + ".png";
	
	$(img).data("candy", candy);
	$(img).attr("id", "candy-id-" + candy.id);	
	$(img).attr("data-position", candy.col + "-" + candy.row);
	
	var candySize = 320/board.boardSize;	
	var top = candy.row * candySize;
	var left = candy.col * candySize;
	
	var startTop = 0 - ((board.boardSize - (top/candySize)) * candySize);
	
	$(img).css({"width" : candySize, 
				"height" : candySize, 
				"top" : startTop,
				"left" : left});
	
	$(img).animate({"top" : top}, function(){
		Crush();
	});
});

// Mueve un candy en el tablero
$(board).on('move', function(e, info) {
	var img = document.getElementById("candy-id-" + info.candy.id);
	
	$(img).attr("data-position", info.toCol + "-" + info.toRow);
	
	var candySize = 320/board.boardSize;
	
	var top = info.toRow * candySize;
	var left = info.toCol * candySize;
	
	$(img).animate({"top" : top,
					"left" : left}, function(){
		Crush();
	});
});

// Elimina un candy del tablero
$(board).on('remove', function(e, info) {
	var img = document.getElementById("candy-id-" + info.candy.id);
	$(img).animate({"opacity" : 0}, function(){
		img.parentNode.removeChild(img);
	});
});

// Actualiza puntaje
$(board).on('scoreUpdate', function(e, info) {
	var scoreLabel = document.getElementById("scoreLabel");
	
	$(scoreLabel).empty();
	$(scoreLabel).append(info.score + " points");
});

$(document).on("mousedown touchstart", "#canvas", function(evt){
	if ($("img").is(':animated') == false){
		var candySize = 320/board.boardSize;
		var xCoord, yCoord;
		
		if (evt.type == "mousedown"){
			xCoord = evt.offsetX;
			yCoord = evt.offsetY;
		}
		else {
			xCoord = parseInt(evt.touches[0].clientX) - ( parseInt(evt.target.offsetLeft) + parseInt(evt.target.offsetParent.offsetLeft) );
			yCoord = parseInt(evt.touches[0].clientY) - ( parseInt(evt.target.offsetTop) + parseInt(evt.target.offsetParent.offsetTop) );			
		}
		
		var col = Math.floor(xCoord/candySize);
		var row = Math.floor(yCoord/candySize);
		
		var img = document.querySelectorAll("[data-position='" + col + "-" + row + "']").item(0);
		
		if (img != null){
			$(img).css("z-index", 2);
			
			var top = parseInt($(img).css("top"));
			var left = parseInt($(img).css("left"));
			
			dragDropInfo = {candyImg : img, 
							initCol : col,
							initRow : row,
							initTop : top, 
							initLeft : left,
							initXCoord : xCoord, 
							initYCoord : yCoord};
		}
	}
});

$(document).on("mousemove touchmove", "#canvas", function(evt){
	if (dragDropInfo != null && $("img").is(':animated') == false){
		var xCoord, yCoord;
		
		if (evt.type == "mousemove"){
			xCoord = evt.offsetX;
			yCoord = evt.offsetY;
		}
		else {			
			xCoord = parseInt(evt.touches[0].clientX) - ( parseInt(evt.target.offsetLeft) + parseInt(evt.target.offsetParent.offsetLeft) );
			yCoord = parseInt(evt.touches[0].clientY) - ( parseInt(evt.target.offsetTop) + parseInt(evt.target.offsetParent.offsetTop) );
		}
		
		var top = dragDropInfo.initTop + yCoord - dragDropInfo.initYCoord;
		var left = dragDropInfo.initLeft + xCoord - dragDropInfo.initXCoord;
		
		$(dragDropInfo.candyImg).css({"top" : top,
									  "left" : left});
	}
});

$(document).on("mouseup touchend", function(evt){
	if (dragDropInfo != null){
		ClearCanvas();
		
		var candySize = 320/board.boardSize;
		var xCoord, yCoord;
		
		if (evt.type == "mouseup"){
			xCoord = evt.offsetX;
			yCoord = evt.offsetY;
		}
		else {
			xCoord = parseInt(evt.changedTouches[0].clientX) - ( parseInt(evt.target.offsetLeft) + parseInt(evt.target.offsetParent.offsetLeft) );
			yCoord = parseInt(evt.changedTouches[0].clientY) - ( parseInt(evt.target.offsetTop) + parseInt(evt.target.offsetParent.offsetTop) );			
		}
		
		var col = Math.floor(xCoord/candySize);
		var row = Math.floor(yCoord/candySize);
	
		var candy = $(dragDropInfo.candyImg).data("candy");
		
		//up
		if (dragDropInfo.initCol == col && dragDropInfo.initRow-1 == row){
			if (rules.isMoveTypeValid(candy, "up")){
				board.flipCandies(candy, board.getCandyInDirection(candy, "up"));
			}
		}
		//down
		else if (dragDropInfo.initCol == col && dragDropInfo.initRow+1 == row){
			if (rules.isMoveTypeValid(candy, "down")){
				board.flipCandies(candy, board.getCandyInDirection(candy, "down"));
			}
		}
		//left
		else if (dragDropInfo.initCol-1 == col && dragDropInfo.initRow == row){
			if (rules.isMoveTypeValid(candy, "left")){
				board.flipCandies(candy, board.getCandyInDirection(candy, "left"));
			}
		}
		//right
		else if (dragDropInfo.initCol+1 == col && dragDropInfo.initRow == row){
			if (rules.isMoveTypeValid(candy, "right")){
				board.flipCandies(candy, board.getCandyInDirection(candy, "right"));
			}
		}
		
		$(dragDropInfo.candyImg).css({"z-index": 1,
									  "top" : dragDropInfo.initTop,
									  "left" : dragDropInfo.initLeft});
		
		dragDropInfo = null;
	}
});

function ClearCanvas(){
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0,320,320);
}

function Crush(){	
	setTimeout(function(){
		rules.moveCandiesDown();
	}, 500);
	
	rules.removeCrushes(rules.getCandyCrushes());
}
