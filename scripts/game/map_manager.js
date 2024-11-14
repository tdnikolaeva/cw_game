import {gameManager} from "./game_manager.js";

let canvas;
let ctx;

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canvasid");
    ctx = canvas.getContext("2d");
    // Здесь можно добавлять код, который использует canvas и ctx
});

export var mapManager = {
    mapData: null,
    tileLayers: [],
    xCount: 80,
    yCount: 80,
    tSize: {x: 16, y: 16},
    mapSize: {x: 1280, y: 1280},
    tilesets: [],
    loaded: {count: 0, total: 0}, // Консолидированное состояние загрузки
    view: {x: 0, y: 0, w: 800, h: 512},

    loadMap(path, callback) {
        let req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                this.parseMap(req.responseText);
                if (callback) callback(); // Вызов колбека после загрузки
            }
        }
        req.open("GET", path, true);
        req.send();
    },

    parseMap(tilesJSON) {
        this.mapData = JSON.parse(tilesJSON);
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;

        for (let tilesetData of this.mapData.tilesets) {
            let img = new Image();
            img.onload = () => {
                this.loaded.count++;
                if (this.loaded.count === this.loaded.total) {
                    // Все изображения загружены
                    this.draw(ctx);
                }
            };
            img.src = tilesetData.image;

            // Сохранение информации о тайлсете
            let ts = {
                firstgrid: tilesetData.firstgid,
                image: img,
                name: tilesetData.name,
                xCount: Math.floor(tilesetData.imagewidth / this.tSize.x),
                yCount: Math.floor(tilesetData.imageheight / this.tSize.y),
            };
            this.tilesets.push(ts);
        }

        // Установка общего количества загружаемых изображений
        this.loaded.total = this.mapData.tilesets.length;

        // Парсинг слоев
        for (let layer of this.mapData.layers) {
            if (layer.type === "tilelayer") {
                this.tileLayers.push(layer);
            }
        }

        // Проверка, загружен ли JSON
        if (this.loaded.count === this.loaded.total) {
            this.draw(ctx);
        }
    },

    draw(ctx) {
        if (this.loaded.count < this.loaded.total) {
            setTimeout(() => {
                this.draw(ctx);
            }, 100);
            return; // Выход ранним способом, если не готово
        }

        for (let layer of this.tileLayers) {
            for (let i = 0; i < layer.data.length; i++) {
                if (layer.data[i] !== 0) {
                    let tileIndex = layer.data[i];
                    let tile = this.getTile(tileIndex);
                    let pX = (i % this.xCount) * this.tSize.x;
                    let pY = Math.floor(i / this.xCount) * this.tSize.y;

                    if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
                        continue;
                    }

                    pX -= this.view.x;
                    pY -= this.view.y;
                    ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);
                }
            }
        }
    },

    getTile(tileIndex) {
        let tileset = this.getTileset(tileIndex);

        // Вычисление позиции тайла в тайлсете
        let id = tileIndex - tileset.firstgrid;
        let x = id % tileset.xCount;
        let y = Math.floor(id / tileset.xCount);

        return {
            img: tileset.image,
            px: x * this.tSize.x,
            py: y * this.tSize.y
        };
    },

    getTileset(tileIndex) {
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (this.tilesets[i].firstgrid <= tileIndex) {
                return this.tilesets[i];
            }
        }
        return null;
    },

    isVisible(x, y, width, height) {
        return !(x + width <= this.view.x ||
            y + height <= this.view.y ||
            x >= this.view.x + this.view.w ||
            y >= this.view.y + this.view.h);
    },

    parseEntities() {
        if (this.loaded.count < this.loaded.total) {
            setTimeout(() => {
                this.parseEntities();
            }, 100);
            return; // Выход ранним способом, если не готово
        }
        for (let layer of this.mapData.layers) {
            if (layer.type === "objectgroup") {
                for (let e of layer.objects) {
                    try {
                        let obj = new gameManager.factory[e.type]();
                        obj.name = e.name;
                        obj.pos_x = e.x;
                        obj.pos_y = e.y;
                        obj.size_x = e.width;
                        obj.size_y = e.height;
                        gameManager.entities.push(obj);
                        if (obj.name === 'player') {
                            gameManager.initPlayer(obj);
                        }
                    } catch (ex) {
                        console.log("Ошибка при создании объекта: [" + e.gid + "] " + e.type + ", " + ex);
                        console.log(e);
                    }
                }
            }
        }
        for (let e of gameManager.entities) {
            e.player = gameManager.player;
        }
    },

    getTilesetIdx(x, y) {
        let idx = Math.floor(y / this.tSize.y) * this.xCount + Math.floor(x / this.tSize.x);

        // Проверяем все слои тайлов
        for (let i = this.tileLayers.length - 1; i >= 0; i--) { // Начинаем с верхнего слоя
            const layer = this.tileLayers[i];

            if (layer && idx < layer.data.length) {
                const tileValue = layer.data[idx];
                if (tileValue !== 0) { // Если значение не равно 0, возвращаем его
                    return tileValue;
                }
            }
        }

        return null; // Возвращаем null, если ни одно значение не найдено
    },

    centerAt: function (obj) {
        // Получаем размеры окна просмотра
        const halfWidth = mapManager.view.w / 2;
        const halfHeight = mapManager.view.h / 2;

        // Вычисляем новые координаты для центра
        let newX = obj.pos_x - halfWidth + (obj.size_x / 2);
        let newY = obj.pos_y - halfHeight + (obj.size_y / 2);

        // Проверяем границы карты и корректируем новые координаты
        newX = Math.max(0, Math.min(newX, mapManager.mapSize.x - mapManager.view.w));
        newY = Math.max(0, Math.min(newY, mapManager.mapSize.y - mapManager.view.h));

        // Обновляем координаты вида
        mapManager.view.x = newX;
        mapManager.view.y = newY;
    }
}