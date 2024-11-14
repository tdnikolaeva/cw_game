import {mapManager} from "./map_manager.js";

export var spriteManager = {
    image: new Image(),
    sprites: [],
    loaded: false, // Объединяем информацию о загрузке

    loadAtlas(atlasJSON, atlasImg) {
        let req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                this.parseAtlas(req.responseText);
                this.checkIfLoaded(); // Проверяем загрузку после парсинга
            }
        };
        req.open("GET", atlasJSON, true);
        req.send();
        this.loadImg(atlasImg);
    },

    loadImg(imgName) {
        this.image.onload = () => {
            this.checkIfLoaded(); // Проверяем загрузку после загрузки изображения
        };
        this.image.src = imgName;
    },

    checkIfLoaded() {
        // Устанавливаем loaded в true, если изображение загружено и есть спрайты
        if (this.image.complete && this.sprites.length > 0) {
            this.loaded = true;
        }
    },

    parseAtlas(atlasJSON) {
        let atlas = JSON.parse(atlasJSON);
        for (let name in atlas.frames) {
            let frame = atlas.frames[name].frame;
            let spriteSourceSize = atlas.frames[name].spriteSourceSize || { x: 0, y: 0, w: frame.w, h: frame.h };

            this.sprites.push({
                name: name,
                x: frame.x,
                y: frame.y,
                w: frame.w,
                h: frame.h,
                trimmed: atlas.frames[name].trimmed || false,
                spriteSourceSize: spriteSourceSize // Добавляем информацию о размере источника спрайта
            });
        }
    },

    drawSprite(ctx, name, x, y, flipHorizontally = false) {
        if (!this.loaded) {
            setTimeout(() => {
                this.drawSprite(ctx, name, x, y, flipHorizontally);
            }, 100);
            return; // Не забывайте выходить из функции
        }

        let sprite = this.getSprite(name);

        // Корректируем координаты с учетом вида (если используется)
        x -= mapManager.view.x;
        y -= mapManager.view.y;

        ctx.save();

        if (flipHorizontally) {
            ctx.scale(-1, 1); // Отражаем по горизонтали
            x = -x - sprite.w; // Корректируем координату x для отраженного изображения
        }

        if (sprite) {
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h,
                x, y, sprite.w, sprite.h);
        }

        ctx.restore();
    },

    getSprite(name) {
        return this.sprites.find(s => s.name === name) || null;
    }
}