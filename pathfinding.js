
Hooks.once("init", async function() {
	console.log("Pathfinding Module Loaded")

	game.Pathfinding = Pathfinding;

	// game.pathfinding = function(debug=false){
	// 	const graph = walkablePathfindingGraph();
	// 	console.log(graph)
	// 	drawWalkablePathfindingGraph(graph, debug);
	// }

	// game.getPathfindingGraph = function(){
	// 	return walkablePathfindingGraph();
	// }

	// game.clearPathfinding = function(){
	// 	return clearDrawPathfinding();
	// }

	// game.generateNodeMap = function(){
	// 	return generateSceneNodeMapGrid();
	// }

	// game.findPathGameNodeMap = function(targetGridPosistion, startGridPosistion){
	// 	return findPathGameNodeMap(targetGridPosistion, startGridPosistion);
	// }

	// game.drawPathGameNodeMap = function(path, debug=false){
	// 	drawPathGrid(path,debug);
	// }

	// game.drawGridNumbers = function(){
	// 	gridCordToCanvasCord();
	// }
	






// game.clearPathfinding();
// game.generateNodeMap();


// const tokenPos = canvas.grid.grid.getGridPositionFromPixels(
// 	x:canvas.tokens.controlled[0].x,
// 	y:canvas.tokens.controlled[0].y
// 	);

// const mousePos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage); 

// // const path = game.findPathGameNodeMap({x:8,y:11},{x:12,y:12});
// const path = game.findPathGameNodeMap(tokenPos,mousePos);
// game.drawPathGameNodeMap(path, true);

// console.log(path)
});


// pathfinding();

export class Pathfinding{

	static clearDrawPathfinding(){
		if(canvas.drawPathfinding){
			for(let i = canvas.drawPathfinding.length; i > 0; i--){	
				canvas.drawPathfinding[i-1].destroy();
				canvas.drawPathfinding.pop();
			}
		}

		if(canvas.drawPathfindingDebug){
			for(let i = canvas.drawPathfindingDebug.length; i > 0; i--){	
				canvas.drawPathfindingDebug[i-1].destroy();
				canvas.drawPathfindingDebug.pop();
			}
		}
	}

	static getSelectedToken(){
		return actor = canvas.tokens.controlled[0];
	}

	static getGridCellSize(){
		return canvas.scene.grid.size;
	}

	static getSceneGridDistance(){
		return canvas.scene.grid.distance;
	}

	static gridCornerToCenter(point={}, token={}){
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

	static worldPosToGridPos(worldPos){
		return {
			x: Math.ceil(worldPos.x / getGridCellSize()),
			y: Math.ceil(worldPos.y / getGridCellSize())
		}
	}

	// to the corner of the grid
	static gridPosToWorldPos(gridPoint){
		return{
			x: gridPoint.x * getGridCellSize(),
			y: gridPoint.y * getGridCellSize()
		}
	}

	static gridPosToWorldPosCenter(gridPoint){
		return gridPosToWorldPos(gridPoint);
	}

	static pointToString(point){
		return `${point.x},${point.y}`;
	}

	static getDiagonalMovementType(){
		const gameSystemId = game.system.id;
		switch(gameSystemId){
			case "dnd5e":
				return game.settings.get(gameSystemId, "diagonalMovement");
			case "dnd4e":
				return game.settings.get(gameSystemId, "diagonalMovement");
		}
		return game.settings.get(gameSystemId, "diagonalMovement");
	}

	static getDiagonalMovementCostMultiplier(){
		const diagonalMovementType = this.getDiagonalMovementType();
		if(diagonalMovementType == "555"){
			return 1;
		}
		else if(diagonalMovementType == "5105"){
			return 1.5;
		}
		else if(diagonalMovementType == "EUCL"){
			return Math.round(Math.sqrt(2)*1000)/1000;
			// return Math.round(Math.sqrt(2)*1000)/1000;
		} else {
			return 1;
		}
	}

	static walkablePathfindingGraph(){
		if(canvas.grid.type == 1){
			return this.generateWalkablePathfindingGraphGrid();
		} else {
			return this.generateWalkablePathfindingGraphGrid();
		}
	}

	static generateSceneNodeMapGrid(){

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
					gCost: 0, 	// distance from starting node
					hCost: 0, 	// distance from target node
					fCost: 0 	//gCost + hCost
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
							const distance = this.costToEnterGrid(nodeMap[x + width][y + height], nodeMap[width][height]);
							if(distance == Infinity){
								nodeMap[width][height].neighbours[i] = null;
							} else {
								nodeMap[width][height].neighbours[i] = {
									node: nodeMap[x + width][y + height],
									distance: this.costToEnterGrid(nodeMap[x + width][y + height], nodeMap[width][height] )
								};
							}

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

	static costToEnterGrid(targetGrid, startGrid=false){

		if(startGrid){
			let rayTest = new Ray(this.gridPointToCanvasPoint(startGrid.gridPosistion), this.gridPointToCanvasPoint(targetGrid.gridPosistion));
			if (CONFIG.Canvas.losBackend.testCollision(rayTest.A,rayTest.B, {mode:"any",type:'move'})){
				return Infinity;
			} else {
				if(targetGrid.gridPosistion.x != startGrid.gridPosistion.x && targetGrid.gridPosistion.y != startGrid.gridPosistion.y){
					return Math.round(this.getSceneGridDistance() * this.getDiagonalMovementCostMultiplier()*1000)/1000;
				} else {
					return this.getSceneGridDistance();
				}
			}
		}

		return this.getSceneGridDistance();
	}

	// a* pathfinding
	static findPathGameNodeMap(targetGridPosistion, startGridPosistion){
		if(!game.nodeMap){
			ui.notifications.warn("No Node Map. Please generate one first to game.nodeMap, pass a valid map to the findPath static.");
			return null;
		}

		const nodeMap = game.nodeMap;
		const openList = [];
		const closeList = [];

		// SquareGrid#getGridPositionFromPixels swaps around the X,Y to Y,X for big brain logic
		const startNode = Array.isArray(startGridPosistion) ? game.nodeMap[startGridPosistion[1]][startGridPosistion[0]] : game.nodeMap[startGridPosistion.x][startGridPosistion.y];
		const endNode = Array.isArray(targetGridPosistion) ? game.nodeMap[targetGridPosistion[1]][targetGridPosistion[0]] : game.nodeMap[targetGridPosistion.x][targetGridPosistion.y];
		openList.push(startNode);

		this.resetNodeMapPathingValues(nodeMap);

		startNode.gCost = 0;
		startNode.hCost = this.calculateDistance(startNode, endNode); // just a random number at the start
		startNode.fCost = startNode.gCost + startNode.hCost;


		while(openList.length > 0){
			const currentNode = this.getLowestFCostNode(openList, closeList);
			if(currentNode == endNode){
				return this.traceBackPath(endNode);
			}

			for(const neighbour of currentNode.neighbours){
				if(!neighbour) continue; //don't search through empty nodes

				if(closeList.includes(neighbour.node)){
					continue; // This node has already been searched before
				}

				//TODO Add checks here to see if this node can be walked on, if there are other tokens or tiles on it that may prevent movement

				let potentialGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbour.node);
				// let potentialGCost = currentNode.gCost + this.costToEnterGrid(currentNode, neighbour.node);

				if(potentialGCost < neighbour.node.gCost){
					neighbour.node.parent = currentNode;
					neighbour.node.gCost = potentialGCost;
					neighbour.node.hCost = this.calculateDistance(neighbour.node, endNode);
					// neighbour.node.hCost = this.costToEnterGrid(neighbour.node, endNode)
					neighbour.node.fCost = neighbour.node.gCost + neighbour.node.hCost;

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

	static resetNodeMapPathingValues(nodeMap){
		const gridCellSize = canvas.grid.size;
		const canvasWidth = parseInt(canvas.grid.width/gridCellSize);
		const canvasHeight = parseInt(canvas.grid.height/gridCellSize);

		//clear all pathing cost data
		for(let width = 0; width < canvasWidth; width++){
			for(let height = 0; height < canvasHeight; height++){
				nodeMap[width][height].gCost = Infinity;
				nodeMap[width][height].hCost = 0;
				nodeMap[width][height].fCost = Infinity;
				nodeMap[width][height].parent = null;
			}
		}
	}

	static calculateDistance(nodeA, nodeB){


		if(nodeA.neighbours){
			for(const neighbour of nodeA.neighbours){
				if(!neighbour) continue;
				if(neighbour.node === nodeB){
					return neighbour.distance;
				}
			}
		}
		
		const ray = new Ray(this.gridPointToCanvasPoint(nodeA.gridPosistion), this.gridPointToCanvasPoint(nodeB.gridPosistion));
		const segments = [{ray}];
		const distance = canvas.grid.grid.measureDistances(segments, {gridSpaces:true});

		return distance[0]
		// //TODO, add checks here for tile terrian costs for the tile that you enter.
	}

	static getLowestFCostNode(openList, closeList){
		let lowestNode = openList[0];
		let indexOfLowest = 0;
		let index = 0;

		for(const node of openList){
			if(node.fCost <= lowestNode.fCost && node.hCost < lowestNode.hCost){
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

	static traceBackPath(endNode){
		let pathNodeArray = [];
		pathNodeArray.push(endNode);

		let currentNode = endNode;

		while(currentNode.parent){
			pathNodeArray.push(currentNode.parent);
			currentNode = currentNode.parent;
		}

		return pathNodeArray.reverse();
	}

	static equateNodes(nodeA, nodeB){
		return (nodeA.gridPosistion.x === nodeB.gridPosistion.x && nodeA.gridPosistion.y === nodeB.gridPosistion.y)
	}

	static generateWalkablePathfindingGraphGrid(){
		this.clearDrawPathfinding();

		const token = canvas.tokens.controlled[0];
		if(!token){
			ui.notifications.warn("No token Selected");
			return;
		}
		const distance = this.getTokenMoveDistance(token);
		const gridCellSize = canvas.grid.size;
		const rootNode = `${((token.x + token.hitArea.width/2) - Math.floor(gridCellSize/2)) / gridCellSize},${((token.y + token.hitArea.height/2) - Math.floor(gridCellSize/2)) / gridCellSize}`;
		
		//initialise array of arrays with values set as Infinity
		const cost = new Array(parseInt(canvas.grid.width/gridCellSize)).fill(Infinity).map(() => new Array(parseInt(canvas.grid.height/gridCellSize)).fill(Infinity));
		cost[((token.x + token.hitArea.width/2) - Math.floor(gridCellSize/2)) / gridCellSize][((token.y + token.hitArea.height/2) - Math.floor(gridCellSize/2)) / gridCellSize] = 0;
		
		let toCheck = new Set([rootNode]);
		let toCheckHolder = new Set();

		let canEnter = new Set();
		let canEnterRunning = new Set();

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
						let rayTest = new Ray(this.gridPointToCanvasPoint({x:nodeX, y:nodeY}), this.gridPointToCanvasPoint({x:neighbourX, y:neighbourY}));
						

						if (CONFIG.Canvas.losBackend.testCollision(rayTest.A,rayTest.B, {mode:"any",type:'move'})){
							continue;
						}

						// if(canvas.walls.checkCollision(rayTest, {origin: rayTest.A}).length){
						// 	continue;
						// }

						if(Math.abs(x) == Math.abs(y) && this.getDiagonalMovementType() != "555"){ // check for diagnals
							const constToEnter = this.getSceneGridDistance() * this.getDiagonalMovementCostMultiplier();
					
							if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5 && distance >= constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5){
								cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
								toCheckHolder.add(`${neighbourX},${neighbourY}`);
								canEnter.add(`${neighbourX}, ${neighbourY}`);

								if(canEnterRunning.has(`${neighbourX}, ${neighbourY}`)){
									canEnterRunning.delete(`${neighbourX}, ${neighbourY}`);
								}
							}
							else if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5 && distance*2 >= constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5){
								cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
								toCheckHolder.add(`${neighbourX},${neighbourY}`);

								if(!canEnter.has(`${neighbourX}, ${neighbourY}`)){
									canEnterRunning.add(`${neighbourX}, ${neighbourY}`);
								}
							}

						} else {
							const constToEnter = this.getSceneGridDistance();
							if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5 && distance >= constToEnter + cost[nodeX][nodeY]- this.getSceneGridDistance() * 0.5){
								cost[neighbourX][neighbourY] = cost[nodeX][nodeY] + constToEnter;
								toCheckHolder.add(`${neighbourX},${neighbourY}`);
								canEnter.add(`${neighbourX}, ${neighbourY}`);

								if(canEnterRunning.has(`${neighbourX}, ${neighbourY}`)){
									canEnterRunning.delete(`${neighbourX}, ${neighbourY}`);
								}
							}
							else if(cost[neighbourX][neighbourY] > constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5 && distance*2 >= constToEnter + cost[nodeX][nodeY] - this.getSceneGridDistance() * 0.5){
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

	static drawWalkablePathfindingGraph(graph, debug=false){
		if(!graph) return;

		if(graph.canEnter){
			for(let node of graph.canEnter){
				let nodeX = parseInt(node.split(',')[0]);
				let nodeY = parseInt(node.split(',')[1]);
				this.drawGridSquare(this.gridPointToCanvasPoint({
					x:nodeX,
					y:nodeY
				}),"0x0335fc");
		
				if(debug){
					this.debugDrawText(this.gridPointToCanvasPoint({
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
				this.drawGridSquare(this.gridPointToCanvasPoint({
					x:nodeX,
					y:nodeY
				}),"0xfcdf03");

				if(debug){
					this.debugDrawText(this.gridPointToCanvasPoint({
						x:nodeX,
						y:nodeY
					}), graph.cost[nodeX][nodeY]);
				}
			}
		}
	}

	static drawGridSquare(vector, color="0x00FF00"){
		
		if(!canvas.drawPathfinding){
			canvas.drawPathfinding = [];
		}
		
		const gridCellSize = canvas.grid.size;
		const index = canvas.drawPathfinding.length;
		const shrink = 5;
		
		canvas.drawPathfinding[index] = new PIXI.Graphics();
		canvas.drawPathfinding[index].beginFill(color);
		canvas.drawPathfinding[index].alpha = 0.5;
		canvas.drawPathfinding[index].drawRect(
			vector.x - this.getGridCellSize()/2 + shrink,
			vector.y - this.getGridCellSize()/2 + shrink,
			gridCellSize - shrink * 2,
			gridCellSize - shrink * 2
		);
		
		canvas.drawPathfinding[index].flags = {pathfinding:{}}
		canvas.environment.children[0].addChild(canvas.drawPathfinding[index]);
	}

	static debugDrawText(vector, text){

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

	static getTokenMoveDistance(token){
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

	static gridPointToCanvasPoint(point){
		const gridCellSize = canvas.grid.size;
		return{x: (point.x * gridCellSize + Math.floor(gridCellSize/2)), y: (point.y * gridCellSize + Math.floor(gridCellSize/2))}
	}

	static drawGridCordToCanvasCord(){

		const gridCellSize = canvas.grid.size;
		const canvasWidth = parseInt(canvas.grid.width/gridCellSize);
		const canvasHeight = parseInt(canvas.grid.height/gridCellSize);
		
		for(let width = 0; width < canvasWidth; width++){
			for(let height = 0; height < canvasHeight; height++){
				this.debugDrawText(this.gridPointToCanvasPoint({
					x:width,
					y:height
				}), `${width}, ${height}`);
			}
		}
	}

	static drawGridNumbers(){

	}

	static drawPathGrid(path, debug=false){
		for(const node of path){
			this.drawGridSquare(this.gridPointToCanvasPoint({
				x:node.gridPosistion.x,
				y:node.gridPosistion.y
			}),"0xfcdf03");

			if(debug){
				this.debugDrawText(this.gridPointToCanvasPoint({
					x:node.gridPosistion.x,
					y:node.gridPosistion.y
				}), "");
			}
		}
	}

	static pathToMeasure(path){
		const token = canvas.tokens.controlled[0];
		if(!token){
			ui.notifications.warn("No token Selected");
			return;
		}
		const ruler = canvas.controls.ruler;
		
		ruler.clear();
		ruler._state = Ruler.STATES.STARTING;


		for(const segment of path){
			ruler._addWaypoint(this.gridPointToCanvasPoint(segment.gridPosistion));
		}		
		ruler.measure(canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage));
	}
}
