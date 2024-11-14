import {eventsManager} from "./event_manager.js";
import {mapManager} from "./map_manager.js";
import {spriteManager} from "./sprite_manager.js";
import {Player, Bonus, Golem, Bat} from "./entities.js";
import {levelManager} from "./level_manager.js";

let canvas;
let ctx;

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canvasid");
    ctx = canvas.getContext("2d");
    // Здесь можно добавлять код, который использует canvas и ctx
});

export var gameManager = {
    factory: {},
    entities: [],
    fireNum: 0,
    player: null,
    laterKill: [],

    initPlayer: function (obj) {
        this.player = obj;
    },

    kill: function (obj) {
        this.laterKill.push(obj);
    },

    update: function () {
        if (this.player === null) {
            return;
        }
        this.player.move_x = 0;
        this.player.move_y = 0;
        if (eventsManager.action['up']) {
            this.player.move_y = -1;
        }
        if (eventsManager.action['down']) {
            this.player.move_y = 1;
        }
        if (eventsManager.action['left']) {
            this.player.move_x = -1;
        }
        if (eventsManager.action['right']) {
            this.player.move_x = 1;
        }
        if (eventsManager.action['hit']) {
            this.player.fire();
        }
        this.entities.forEach(function (e) {
            try {
                e.update();
            } catch (ex) {
            }
        });

        for (let i = 0; i < this.laterKill.length; i++) {
            let idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1) {
                this.entities.splice(idx, 1);
            }
        }

        if (this.laterKill.length > 0) {
            this.laterKill.length = 0;
        }
        mapManager.centerAt(this.player);
        mapManager.draw(ctx);
        this.draw(ctx);
    },

    draw: function (ctx) {
        for (let e = 0; e < this.entities.length; e++) {
            this.entities[e].draw(ctx);
        }
    },

    loadAll: function (map, atlas, sprite) {
        this.factory = {};
        this.entities = [];
        this.fireNum = 0;
        this.player = null;
        this.laterKill = [];
        // Сначала заполняем фабрику
        this.factory['Player'] = Player;
        this.factory['Bonus'] = Bonus;
        this.factory['Golem'] = Golem;
        this.factory['Bat'] = Bat;

        // Загружаем карту и атлас спрайтов
        mapManager.loadMap(map, () => {
            // После загрузки карты вызываем parseEntities
            mapManager.parseEntities();
            mapManager.draw(ctx);
        });
        spriteManager.loadAtlas(atlas, sprite);
        eventsManager.setup(canvas);
    },

    play: function () {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100);
    },






// Функция для завершения игры
    endGame(success) {
                // Остановка функции обновления
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        levelManager.endLevel(success);
    }

}