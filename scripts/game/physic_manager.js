import {mapManager} from "./map_manager.js";
import {gameManager} from "./game_manager.js";

export var physicManager = {
    update: function (obj) {
        if (obj.name === 'player' && obj.health === 0) {
            gameManager.endGame(false);
            return 'end'
        }



        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        newX = Math.max(newX, 0);
        newY = Math.max(newY, 0);
        newX = Math.min(newX, mapManager.mapSize.x-obj.size_x);
        newY = Math.min(newY, mapManager.mapSize.y-obj.size_y);


        let ts = mapManager.getTilesetIdx(newX + obj.size_x/2, newY + obj.size_y*0.9);
        let e = this.entityAtXY(obj, newX, newY);


        if (e != null && e !== obj) {
            obj.onTouchEntity(e);
        }
        if (obj.name === 'player' && ts === 1789) {
            gameManager.endGame(true);
            return 'end'
        }
        if (obj.move_x === 0 && obj.move_y === 0 ) {
            return 'idle';
        }

        if (ts === 468 && obj.name.match(/bat\d/)){
            obj.pos_x = newX;
            obj.pos_y = newY;
        }else if (ts !== 468 ) {
            obj.pos_x = newX;
            obj.pos_y = newY;
        } else {
            return 'idle';
        }



        if (obj.move_x + obj.move_y > 0){
            return 'move-right';
        }
        return 'move-left';
    },

    entityAtXY: function (obj, x, y) {
        for (let i = 0; i < gameManager.entities.length; i++) {
            let e = gameManager.entities[i];
            if (e.name !== obj.name) {
                if (x + obj.size_x < e.pos_x ||
                    y + obj.size_y < e.pos_y ||
                    x > e.pos_x + e.size_x ||
                    y > e.pos_y + e.size_y) {
                    continue;
                }
                if (e.health <= 0){
                    continue;
                }
                return e;
            }
        }
        return null;
    }
}