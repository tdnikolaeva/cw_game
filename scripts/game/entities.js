import {physicManager} from "./physic_manager.js";
import {spriteManager} from "./sprite_manager.js";
import {FSM} from './fsm.js';
import {soundManager} from "./sound_manager.js";

let canvas;
let ctx;

document.addEventListener('DOMContentLoaded', function () {
    canvas = document.getElementById("canvasid");
    ctx = canvas.getContext("2d");
    // Здесь можно добавлять код, который использует canvas и ctx
});

class Entity {
    constructor() {
        this.pos_x = 0;
        this.pos_y = 0;
        this.size_x = 0;
        this.size_y = 0;
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 0;
        this.name = '';
        this.health = 1;
        this.count = {
            'idle': 0,
            'run': 0,
            'die': 0,
            'hurt': 0
        };
        this.spritesAmount = {
            'idle': 1,
            'run': 1,
            'die': 1,
            'hurt': 1
        };
        this.state = 'idle';
    }

    getNameWithoutDigits() {
        return this.name.replace(/\d+$/, '');
    }

    draw(ctx) {
        let spriteName = '';
        let flipHorizontal = false;

        if (this.health <= 0) {
            this.state = 'die';
        }

        switch (this.state) {
            case 'move-left':
                // Вычисляем индекс спрайта на основе счетчика
                spriteName = `${this.getNameWithoutDigits()}-run${(this.count.run % this.spritesAmount.run + 1)}`;
                this.count.run = (this.count.run + 1) % this.spritesAmount.run;
                break;
            case 'move-right':
                // Вычисляем индекс спрайта на основе счетчика
                spriteName = `${this.getNameWithoutDigits()}-run${(this.count.run % this.spritesAmount.run + 1)}`;
                this.count.run = (this.count.run + 1) % this.spritesAmount.run;
                flipHorizontal = true;
                break;
            case 'die':
                spriteName = `${this.getNameWithoutDigits()}-die${this.spritesAmount.die}`;
                if (this.count.die !== this.spritesAmount.die - 1) {
                    this.count.die = (this.count.die + 1) % this.spritesAmount.die;
                }
                break;
            default:
                spriteName = `${this.getNameWithoutDigits()}-idle1`;
                break;
        }

        // Рисуем выбранный спрайт
        spriteManager.drawSprite(ctx, spriteName, this.pos_x, this.pos_y, flipHorizontal);
    }

    update() {
    }

    onTouchEntity(obj) {
    }


    kill() {
        this.health -= 1;
        if (this.health <= 0) {
            this.state = 'die';
            this.health = 0;
            this.speed = 0;
            this.draw(ctx);
        } else {
            this.state = 'hurt';
            this.draw(ctx);
        }
    }
}

export class Player extends Entity {
    constructor() {
        super();
        this.health = 5;
        this.score = 0;
        this.speed = 8;
        this.name = 'player';
        this.spritesAmount = {
            'idle': 7,
            'run': 8,
            'die': 15,
            'hurt': 3
        };
        this.state = 'idle'; // Начальное состояние
    }

    drawInfo() {
        // Находим элементы для отображения информации
        const livesElement = document.getElementById('lives');
        const scoreElement = document.getElementById('score');

        // Обновляем текст в элементах
        if (livesElement) {
            livesElement.textContent = `Жизни: ${this.health}`;
        }
        if (scoreElement) {
            scoreElement.textContent = `Очки: ${this.score}`;
        }
    }

    kill() {
        super.kill();
        soundManager.play('data/sounds/hurt.mp3', {looping: false, volume: soundManager.volume});
        this.drawInfo();
    }

    fire() {
        // console.log(`${this.name} fire`);
        this.state = 'hit';
        this.draw(ctx);
        soundManager.play('data/sounds/hit.mp3', {looping: false, volume: soundManager.volume});
    }

    update() {
        const newState = physicManager.update(this);
        if (newState !== this.state && this.state !== 'die' && newState !== 'end') {
            this.state = newState;
            if (this.state !== 'idle') {
                this.count.idle = 0;
            }
            if (this.state !== 'hurt') {
                this.count.hurt = 0;
            }
            if (this.state !== 'die') {
                this.count.die = 0;
            }
            if (this.state !== 'run') {
                this.count.run = 0;
            }
        }
        this.draw(ctx);
        this.drawInfo();
    }

    onTouchEntity(obj) {
        if (obj.name.match(/bat\d/) || obj.name.match(/golem\d/)) {
            if (this.state === 'hit') {
                let old = obj.health;
                obj.kill();
                if (old !== 0 && obj.health === 0) {
                    this.score += 20;
                }
            }
        }
        if (obj.name.match(/coin\d/) && obj.health > 0) {
            this.score += 10;
            obj.kill();
            soundManager.play('data/sounds/bonus.mp3', {looping: false, volume: soundManager.volume});
        }
        this.drawInfo();
    }

}

export class Bonus extends Entity {
    constructor() {
        super();
        this.name = 'coin';
    }

    draw(ctx) {
        if (this.state !== 'die') {
            spriteManager.drawSprite(ctx, this.getNameWithoutDigits(), this.pos_x, this.pos_y, true);
        }
    }

    onTouchEntity(obj) {
        if (this.state === 'die') {
            return;
        }
        if (obj.name.match(/player/)) {
            this.state = 'die';
            this.health = 0;
            obj.kill();
        }
    }
}

class Enemy extends Entity {
    constructor(obj) {
        super();
        this.player = obj;
        // Создаем экземпляр FSM
        this.fsm = new FSM('patrol');
        this.fsm.addState('patrol');
        this.fsm.addState('rest');

        // Определяем переходы
        this.fsm.addTransition('tired', 'patrol', 'rest', () => {
            // console.log(`${this.name} is resting.`);
            setTimeout(() => {
                this.fsm.update('ready');
            }, 3000); // Отдых
        });

        this.fsm.addTransition('ready', 'rest', 'patrol', () => {
            // console.log(`${this.name} is ready to patrol.`);
        });
    }


    onTouchEntity(obj) {
        if (obj.name.match(/player/)) {
            if (Math.random() < 0.4) {
                return;
            }
            obj.kill();
        }
    }
}

export class Bat extends Enemy {
    constructor() {
        super();
        this.fsm.addTransition('catching', 'patrol', 'catch', () => {
        });
        this.fsm.addTransition('losing', 'catch', 'rest', () => {
        });
        this.spritesAmount = {
            'idle': 9,
            'run': 8,
            'die': 4,
            'hurt': 5
        };
        this.speed = 7;
        this.health = 1;
    }

    update() {

        // Логика обновления врага
        if (this.fsm.current === 'patrol') {
            // Условие для перехода в состояние отдыха
            if (Math.random() < 0.05) { // 5% шанс стать уставшим
                this.fsm.update('tired');
            } else if (Math.sqrt(Math.pow(this.player.pos_x - this.pos_x, 2) + Math.pow(this.player.pos_y - this.pos_y, 2)) <= 80) {
                this.fsm.update('catching');
            }

            if (this.move_x === 0) {
                this.move_x = Math.random() < 0.5 ? -1 : 1; // Случайное направление по X
            } else {
                if (Math.random() < 0.1) {
                    this.move_x *= -1; // Меняем направление
                }
            }

            if (this.move_y === 0) {
                this.move_y = Math.random() < 0.5 ? -1 : 1; // Случайное направление по Y
            } else {
                // С вероятностью 15% меняем на противоположное значение
                if (Math.random() < 0.1) {
                    this.move_y *= -1; // Меняем направление
                }
            }
        } else if (this.fsm.current === 'rest') {
            this.move_x = 0;
            this.move_y = 0;
        } else if (this.fsm.current === 'catch') {
            if (Math.random() < 0.05) { // 5% шанс стать уставшим
                this.fsm.update('loosing');
            }
            // Если мы преследуем
            let dx = this.player.pos_x - this.pos_x; // Разность по x
            let dy = this.player.pos_y - this.pos_y; // Разность по y

            // Устанавливаем move_x и move_y как 1, 0 или -1
            this.move_x = Math.sign(dx); // Устанавливаем move_x в 1, 0 или -1
            this.move_y = Math.sign(dy); // Устанавливаем move_y в 1, 0 или -1
        }

        if (this.state !== 'die') {
            let newState = physicManager.update(this);
            if (newState !== this.state) {
                this.state = newState;
                if (this.state !== 'idle') {
                    this.count.idle = 0;
                }
                if (this.state !== 'hurt') {
                    this.count.hurt = 0;
                }
                if (this.state !== 'die') {
                    this.count.die = 0;
                }
                if (this.state !== 'run') {
                    this.count.run = 0;
                }
            }
        }
        this.draw(ctx);
    }
}

export class Golem extends Enemy {
    constructor() {
        super();
        this.spritesAmount = {
            'idle': 8,
            'run': 10,
            'die': 7,
            'hurt': 4
        };
        this.speed = 3;
        this.health = 2;
    }

    update() {

        // Логика обновления врага
        if (this.fsm.current === 'patrol') {
            // Условие для перехода в состояние отдыха
            if (Math.random() < 0.05) { // 5% шанс стать уставшим
                this.fsm.update('tired');
            }

            if (true) {

            } else if (this.move_x === 0) {
                this.move_x = Math.random() < 0.5 ? -1 : 1; // Случайное направление по X
            } else {
                if (Math.random() < 0.1) {
                    this.move_x *= -1; // Меняем направление
                }
            }

            if (this.move_y === 0) {
                this.move_y = Math.random() < 0.5 ? -1 : 1; // Случайное направление по Y
            } else {
                // С вероятностью 15% меняем на противоположное значение
                if (Math.random() < 0.1) {
                    this.move_y *= -1; // Меняем направление
                }
            }
        } else if (this.fsm.current === 'rest') {
            this.move_x = 0;
            this.move_y = 0;
        }
        if (this.state !== 'die') {
            let newState = physicManager.update(this);
            if (newState !== this.state) {
                this.state = newState;
                if (this.state !== 'idle') {
                    this.count.idle = 0;
                }
                if (this.state !== 'hurt') {
                    this.count.hurt = 0;
                }
                if (this.state !== 'die') {
                    this.count.die = 0;
                }
                if (this.state !== 'run') {
                    this.count.run = 0;
                }
            }
        }
        this.draw(ctx);
    }
}
