export default class GraphNode{
    constructor(x, y){
        this.gridPosistion = {
            x,
            y
        }

        this.neighbours = [];
    }

    getCanvasPosistion(){
        return game.Pathfinding.gridPointToCanvasPoint({x:this.gridPosistion.x, y:this.gridPosistion.y});
    }
}