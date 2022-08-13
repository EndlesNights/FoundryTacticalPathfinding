
Hooks.once("init", async function() {
	console.log("Pathfinding Loaded")

	game.pathfinding = function(debug=false){
		const graph = walkablePathfindingGraph();
		console.log(graph)
		drawWalkablePathfindingGraph(graph, debug);
	}

	game.getPathfindingGraph = function(){
		return walkablePathfindingGraph();
	}

	game.clearPathfinding = function(){
		return clearDrawPathfinding();
	}

	game.generateNodeMap = function(){
		return generateSceneNodeMapGrid();
	}

	game.findPathGameNodeMap = function(targetGridPosistion, startGridPosistion){
		return findPathGameNodeMap(targetGridPosistion, startGridPosistion);
	}

	// canvas.pathContainer = new PIXI.Container();


	// canvas.environment.children[0].children.push(pathContainer)
	// canvas.environment.children[0].children
});


// pathfinding();

function clearDrawPathfinding(){
	if(!canvas.drawPathfinding) return;

	for(let i = canvas.drawPathfinding.length; i > 0; i--){	
		canvas.drawPathfinding[i-1].destroy();
		canvas.drawPathfinding.pop();
	}

	for(let i = canvas.drawPathfindingDebug.length; i > 0; i--){	
		canvas.drawPathfindingDebug[i-1].destroy();
		canvas.drawPathfindingDebug.pop();
	}

}

function getSelectedToken(){
	return actor = canvas.tokens.controlled[0];
}

function getGridCellSize(){
	return canvas.scene.grid.size;
}

function getSceneGridDistance(){
	return canvas.scene.grid.distance;
}

function gridCornerToCenter(point={}, token={}){
	if(Object.keys(point).length){
		return{
			x: point.x + getGridCellSize() / 2,
			y: point.y + getGridCellSize() / 2
		}
	}

	if(Object.keys(token).length){
		return{
			x: token.x + token.w / 2,
			y: token.y + token.h / 2
		}
	}
}

function worldPosToGridPos(worldPos){
	return {
		x: Math.floor(worldPos.x / getGridCellSize()),
		y: Math.floor(worldPos.y / getGridCellSize())
	}
}

// to the corner of the grid
function gridPosToWorldPos(gridPoint){
	return{
		x: gridPoint.x * getGridCellSize(),
		y: gridPoint.y * getGridCellSize()
	}
}

function gridPosToWorldPosCenter(gridPoint){
	return gridPosToWorldPos(gridPoint);
}

function pointToString(point){
	return `${point.x},${point.y}`;
}

function getDiagonalMovementType(){
	const gameSystemId = game.system.id;
	switch(gameSystemId){
		case "dnd5e":
			return game.settings.get(gameSystemId, "diagonalMovement");
		case "dnd4e":
			return game.settings.get(gameSystemId, "diagonalMovement");
	}
	return game.settings.get(gameSystemId, "diagonalMovement");
}

function getDiagonalMovementCostMultiplier(){
	const diagonalMovementType = getDiagonalMovementType();
	if(diagonalMovementType == "555"){
		return 1;
	}
	else if(diagonalMovementType == "5105"){
		return 1.5;
	}
	else if(diagonalMovementType == "EUCL"){
		return Math.sqrt(2);
	} else {
		return 1;
	}
}

function walkablePathfindingGraph(){
	if(canvas.grid.type == 1){
		return generateWalkablePathfindingGraphGrid();
	} else {
		return generateWalkablePathfindingGraphGrid();
	}
}

function generateSceneNodeMapGrid(){

	// const distance = getTokenMoveDistance(token);
	const gridCellSize = canvas.grid.size;
	const canvasWidth = parseInt(canvas.grid.width/gridCellSize);
	const canvasHeight = parseInt(canvas.grid.height/gridCellSize);
	
	// const nodeMap = new Array(canvasWidth).fill(new Array(canvasHeight));
	const nodeMap = [...Array(canvasWidth)].map(e => Array(canvasHeight));;

	for(let width = 0; width < canvasWidth; width++){
		for(let height = 0; height < canvasHeight; height++){
			nodeMap[width][height] = {
				gridPosistion: {x:width, y:height},
				neighbours: new Array(8),
				gCost: Infinity,
				hCost: 0,
				fCost: Infinity
			};

		}
	}

	for(let width = 0; width < canvasWidth; width++){
		for(let height = 0; height < canvasHeight; height++){
			let i = 0;
			for(let x = -1; x <= 1; x++){
				for(let y = -1; y <= 1; y++){
					if(x == 0 && y == 0){
						continue; //This is self
					}

					if(x + width < 0 || x + width >= canvasWidth || y + height < 0 || y + height >= canvasHeight){
						//This is out of bounds
						nodeMap[width][height].neighbours[i] = null;
					} else {
						// nodeMap[width][height].neighbours[i] = nodeMap[x + width][y + height];
						nodeMap[width][height].neighbours[i] = {
							node: nodeMap[x + width][y + height],
							distance: costToEnterGrid(nodeMap[x + width][y + height], nodeMap[width][height] )
						};
					}
					i++;
				}
			}
		}	
	}
	
	console.log("Node Map generated at game.nodeMap")
	game.nodeMap = nodeMap;
	return nodeMap;
}

function costToEnterGrid(targetGrid, startGrid=false){

	if(startGrid){
		let rayTest = new Ray(gridPointToCanvasPoint(startGrid.gridPosistion), gridPointToCanvasPoint(targetGrid.gridPosistion));
		if (CONFIG.Canvas.losBackend.testCollision(rayTest.A,rayTest.B, {mode:"any",type:'move'})){
			return Infinity;
		} else {
			if(targetGrid.gridPosistion.x != startGrid.gridPosistion.x && targetGrid.gridPosistion.y != startGrid.gridPosistion.y){
				return getSceneGridDistance() * getDiagonalMovementCostMultiplier();
			} else {
				return getSceneGridDistance();
			}
		}
	}

	return getSceneGridDistance();
}

// a* pathfinding
function findPathGameNodeMap(targetGridPosistion, startGridPosistion){
	if(!game.nodeMap){
		ui.notifications.warn("No Node Map. Please generate one first to game.nodeMap, pass a valid map to the findPath function.");
		return null;
	}

	const nodeMap = game.nodeMap;
	const openList = [];
	const closeList = [];

	const startNode = game.nodeMap[startGridPosistion.x][startGridPosistion.y];
	const endNode = game.nodeMap[targetGridPosistion.x][targetGridPosistion.y];
	openList.push(startNode);

	const gridCellSize = canvas.grid.size;
	const canvasWidth = parseInt(canvas.grid.width/gridCellSize);
	const canvasHeight = parseInt(canvas.grid.height/gridCellSize);
	//clear all pathing cost data
	for(let width = 0; width < canvasWidth; width++){
		for(let height = 0; height < canvasHeight; height++){
			nodeMap[width][height].gCost = Infinity;
			nodeMap[width][height].hCost = 0;
			nodeMap[width][height].fCost = Infinity;
			nodeMap[width][height].cameFromNode = null;
		}
	}

	startNode.gCost = 0;
	startNode.hCost = 50; // just a random number at the start
	startNode.fCost = startNode.gCost + startNode.hCost;


	while(openList.length){
		const currentNode = getLowestFCostNode(openList, closeList);
		// if(equateNodes(currentNode, endNode)){
		if(currentNode == endNode){
			return traceBackPath(endNode);
		}

		console.log(currentNode)
		for(const neighbour of currentNode.neighbours){
			if(!neighbour) continue; //don't search through empty nodes

			// if(checkNodeInArray(neighbourNode, closeList)){
			if(closeList.includes(neighbour.node)){
				continue; // This node has already been searched before
			}

			//TODO Add checks here to see if this node can be walked on, if there are other tokens or tiles on it that may prevent movement

			let potentialGCost = currentNode.gCost + calculateDistance(currentNode, endNode);
			console.log(potentialGCost)
			console.log(neighbour.node)
			if(potentialGCost < neighbour.node.gCost){
				neighbour.node.cameFromNode = currentNode;
				neighbour.node.gCost = potentialGCost;
				neighbour.node.hCost = calculateDistance(neighbour.node, endNode);
				neighbour.node.fCost = neighbour.node.gCost + neighbour.node.hCost;

				//TODO, test this out. Might have to manualy check? Cant rember if this works in JS with objects
				if(!openList.includes(neighbour.node)){
					openList.push(neighbour.node);
				}
			}
		}
	}

	//No Valid Path to target from start
	console.log(`No Path found from: ${startGridPosistion.x},${startGridPosistion.y} to ${targetGridPosistion.x},${targetGridPosistion.y}`)
	return null;
}

function calculateDistance(nodeA, nodeB){
	const xDistance = Math.abs(nodeA.gridPosistion.x - nodeB.gridPosistion.x);
	const yDistance = Math.abs(nodeA.gridPosistion.y - nodeB.gridPosistion.y);
	const remaining = Math.abs(xDistance - yDistance);

	const moveBaseCost = getSceneGridDistance();
	// const moveDiagonalCostMultiplier = getDiagonalMovementCostMultiplier();
	const moveDiagonalCostMultiplier = getDiagonalMovementCostMultiplier()-1;

	//TODO, add checks here for tile terrian costs for the tile that you enter.
	

	return moveDiagonalCostMultiplier * moveBaseCost * Math.min(xDistance, yDistance) + moveBaseCost * remaining;

	// if(remaining == 1){ // true is not diagonal movement
	// 	return moveBaseCost;
	// } else if (remaining == 0){
	// 	return moveDiagonalCostMultiplier * moveBaseCost;
	// } else {
	// 	return moveDiagonalCostMultiplier * moveBaseCost * Math.min(xDistance, yDistance) + moveBaseCost * remaining;
	// }

	// return moveDiagonalCostMultiplier * Math.min(xDistance, yDistance) + moveBaseCost * remaining;
}

function getLowestFCostNode(openList, closeList){
	let lowestNode = openList[0];
	let indexOfLowest = 0;
	let index;
	for(const node of openList){
		if(node.fCost < lowestNode.fCost){
			lowestNode = node;
			indexOfLowest = index;
		}
		index ++;
	}

	//remove lowest from the openList Array
	openList.splice(indexOfLowest, 1);
	closeList.push(lowestNode);
	return lowestNode;
}

function traceBackPath(endNode){
	let pathNodeArray = [];
	pathNodeArray.push(endNode);

	let currentNode = endNode;

	while(currentNode.cameFromNode){
		pathNodeArray.push(currentNode.cameFromNode);
		currentNode = currentNode.cameFromNode;
	}

	return pathNodeArray.reverse();
}

function equateNodes(nodeA, nodeB){
	return (nodeA.gridPosistion.x === nodeB.gridPosistion.x && nodeA.gridPosistion.y === nodeB.gridPosistion.y)
}

function generateWalkablePathfindingGraphGrid(){
	clearDrawPathfinding();

	const token = canvas.tokens.controlled[0];
	if(!token){
		ui.notifications.warn("No token Selected");
		return;
	}
	const distance = getTokenMoveDistance(token);
	const gridCellSize = canvas.grid.size;
	const rootNode = `${((token.x + token.hitArea.width/2) - Math.floor(gridCellSize/2)) / gridCellSize},${((token.y + token.hitArea.height/2) - Math.floor(gridCellSize/2)) / gridCellSize}`;
	
	//initialise array of arrays with values set as Infinity
	const cost = new Array(parseInt(canvas.grid.width/gridCellSize)).fill(Infinity).map(() => new Array(parseInt(canvas.grid.height/gridCellSize)).fill(Infinity));
	cost[((token.x + token.hitArea.width/2) - Math.floor(gridCellSize/2)) / gridCellSize][((token.y + token.hitArea.height/2) - Math.floor(gridCellSize/2)) / gridCellSize] = 0;
	
	let toCheck = new Set([rootNode]);
	let toCheckHolder = new Set();

	let canEnter = new Set();
	let canEnterRunning = new Set();
	console.log(cost)

	while(toCheck.size){
		for(let node of toCheck){
			let nodeX = parseInt(node.split(',')[0]);
			let nodeY = parseInt(node.split(',')[1]);

			for(let x = -1; x<2; x++){
				for(let y = -1; y<2; y++){
					if(x==0 && y==0){
						continue;
					}
					let neighbourX = nodeX + x;
					let neighbourY = nodeY + y;
					let rayTest = new Ray(gridPointToCanvasPoint({x:nodeX, y:nodeY}), gridPointToCanvasPoint({x:neighbourX, y:neighbourY}));
					

					if (CONFIG.Canvas.losBackend.testCollision(rayTest.A,rayTest.B, {mode:"any",type:'move'})){
						continue;
					}

					// if(canvas.walls.checkCollision(rayTest, {origin: rayTest.A}).length){
					// 	continue;
					// }

					if(Math.abs(x) == Math.abs(y) && getDiagonalMovementType() != "555"){ // check for diagnals
						const constToEnter = getSceneGridDistance() * getDiagonalMovementCostMultiplier();
				
						if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5 && distance >= constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5){
							cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
							toCheckHolder.add(`${neighbourX},${neighbourY}`);
							canEnter.add(`${neighbourX}, ${neighbourY}`);

							if(canEnterRunning.has(`${neighbourX}, ${neighbourY}`)){
								canEnterRunning.delete(`${neighbourX}, ${neighbourY}`);
							}
						}
						else if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5 && distance*2 >= constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5){
							cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
							toCheckHolder.add(`${neighbourX},${neighbourY}`);

							if(!canEnter.has(`${neighbourX}, ${neighbourY}`)){
								canEnterRunning.add(`${neighbourX}, ${neighbourY}`);
							}
						}

					} else {
						const constToEnter = getSceneGridDistance();
						if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5 && distance >= constToEnter + cost[nodeX][nodeY]- getSceneGridDistance() * 0.5){
							cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
							toCheckHolder.add(`${neighbourX},${neighbourY}`);
							canEnter.add(`${neighbourX}, ${neighbourY}`);

							if(canEnterRunning.has(`${neighbourX}, ${neighbourY}`)){
								canEnterRunning.delete(`${neighbourX}, ${neighbourY}`);
							}
						}
						else if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5 && distance*2 >= constToEnter + cost[nodeX][nodeY] - getSceneGridDistance() * 0.5){
							cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
							toCheckHolder.add(`${neighbourX},${neighbourY}`);
							canEnterRunning.add(`${neighbourX}, ${neighbourY}`);
							
							if(!canEnter.has(`${neighbourX}, ${neighbourY}`)){
								canEnterRunning.add(`${neighbourX}, ${neighbourY}`);
							}
						}
					}
				}
			}
		}
	
		toCheck = toCheckHolder;
		toCheckHolder = new Set();
	}

	console.log(canEnter)
	console.log(canEnterRunning)

	return {canEnter, canEnterRunning, cost};
}

function drawWalkablePathfindingGraph(graph, debug=false){

	if(graph.canEnter){
		for(let node of graph.canEnter){
			let nodeX = parseInt(node.split(',')[0]);
			let nodeY = parseInt(node.split(',')[1]);
			drawGridSquare("0x0335fc",gridPointToCanvasPoint({
				x:nodeX,
				y:nodeY
			}));
	
			if(debug){
				debugDrawText(gridPointToCanvasPoint({
					x:nodeX,
					y:nodeY
				}), graph.cost[nodeX][nodeY]);
			}
		}
	}

	if(graph.canEnterRunning){
		for(let node of graph.canEnterRunning){
			let nodeX = parseInt(node.split(',')[0]);
			let nodeY = parseInt(node.split(',')[1]);
			drawGridSquare("0xfcdf03", gridPointToCanvasPoint({
				x:nodeX,
				y:nodeY
			}));

			if(debug){
				debugDrawText(gridPointToCanvasPoint({
					x:nodeX,
					y:nodeY
				}), graph.cost[nodeX][nodeY]);
			}
		}
	}
}

function drawGridSquare(color="0x00FF00", vector){
	
	if(!canvas.drawPathfinding){
		canvas.drawPathfinding = [];
	}
	
	const gridCellSize = canvas.grid.size;
	const index = canvas.drawPathfinding.length;
	const shrink = 5;
	
	canvas.drawPathfinding[index] = new PIXI.Graphics();
	canvas.drawPathfinding[index].beginFill(color);
	canvas.drawPathfinding[index].drawRect(
		vector.x - getGridCellSize()/2 + shrink,
		vector.y - getGridCellSize()/2 + shrink,
		gridCellSize - shrink * 2,
		gridCellSize - shrink * 2
	);
	canvas.drawPathfinding[index].flags = {pathfinding:{}}

	canvas.environment.children[0].addChild(canvas.drawPathfinding[index]);

	// canvas.environment.children[0].alpha = 0.5;
	// canvas.environment.children[0].children[2].addChild(canvas.drawPathfinding[index]);
}

function debugDrawText(vector, text){

	if(!canvas.drawPathfindingDebug){
		canvas.drawPathfindingDebug = [];
	}
	const color = "0x000000"; 
	const index = canvas.drawPathfindingDebug.length;
	// Options for our "advanced" text
	const textOptions = {
		font: "bold 64px Roboto", // Set  style, size and font
		fill: '#3498db', // Set fill color to blue
		align: 'center', // Center align the text, since it's multiline
		stroke: '#34495e', // Set stroke color to a dark blue gray color
		strokeThickness: 20, // Set stroke thickness to 20
		lineJoin: 'round' // Set the lineJoin to round
	}

	canvas.drawPathfindingDebug[index] = new PIXI.Text(text, textOptions);
	canvas.drawPathfindingDebug[index].anchor.x = 0.5;
    canvas.drawPathfindingDebug[index].anchor.y = 0.5;
	canvas.drawPathfindingDebug[index].x = vector.x;
	canvas.drawPathfindingDebug[index].y = vector.y;
	canvas.drawPathfindingDebug[index].flags = {pathfinding:{}}

	canvas.environment.children[0].addChild(canvas.drawPathfindingDebug[index]);
}

function getTokenMoveDistance(token){
	const gameSystemId = game.system.id;
	if(parseFloat(game.version) < 10){
		switch(gameSystemId){
			case "dnd5e":
				return token.actor.data.data.attributes.movement.walk;
			case "dnd4e":
				return token.actor.data.data.movement.walk.value;
		}
	
		return token.actor.data.data.attributes.movement.walk;

	} else {
		switch(gameSystemId){
			case "dnd5e":
				return token.actor.system.attributes.movement.walk;
			case "dnd4e":
				return token.actor.system.movement.walk.value ;
		}
		return token.actor.system.attributes.movement.walk;
	}

}

function canvasPointToGridPoint(point){
	const gridSize = canvas.grid.size;
	return{x: (point.x - Math.floor(gridSize/2)) / gridSize, y:(point.y - Math.floor(gridSize/2)) / gridSize}
}

function gridPointToCanvasPoint(point){
	const gridCellSize = canvas.grid.size;
	return{x: (point.x * gridCellSize + Math.floor(gridCellSize/2)), y: (point.y * gridCellSize + Math.floor(gridCellSize/2))}
}

function gridCordToCanvasCord(){

}

