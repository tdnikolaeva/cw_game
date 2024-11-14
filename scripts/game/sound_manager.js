import { gameManager } from "./game_manager.js";
import { mapManager } from "./map_manager.js";

export const soundFiles = [
    '../data/sounds/bonus.mp3',
    '../data/sounds/hit.mp3',
    '../data/sounds/hurt.mp3',
    '../data/sounds/successfullgameend.mp3'
];


export var soundManager = {
    clips: {},
    context: null,
    gainNode: null,
    loaded: false,
    volume: 0,

    init: function () {
        // Инициализация AudioContext
        if (typeof AudioContext !== 'undefined') {
            this.context = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            this.context = new webkitAudioContext();
        } else {
            console.error("Web Audio API не поддерживается в этом браузере.");
            return;
        }

        // Создание GainNode
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    },

    load: function (path, callback) {
        if (this.clips[path]) {
            callback(this.clips[path]);
            return;
        }
        let clip = { path: path, buffer: null, loaded: false };
        let req = new XMLHttpRequest();
        req.open('GET', path, true);
        req.responseType = 'arraybuffer';
        req.onload = () => {
            this.context.decodeAudioData(req.response, (buffer) => {
                clip.buffer = buffer;
                clip.loaded = true;
                this.clips[path] = clip; // Сохраняем загруженный клип
                callback(clip);
            });
        };
        req.send();
    },

    loadArray: function (array) {
        let loadCount = 0; // Счетчик загруженных клипов
        for (let i = 0; i < array.length; i++) {
            this.load(array[i], () => {
                loadCount++;
                if (loadCount === array.length) {
                    this.loaded = true; // Устанавливаем loaded в true только после загрузки всех клипов
                    console.log("Все звуковые клипы загружены.");
                }
            });
        }
    },

    play: function (path, settings) {
        if (!this.loaded) {
            setTimeout(() => {
                this.play(path, settings);
            }, 1000);
            return;
        }

        let looping = settings?.looping || false;
        let volume = settings?.volume || 1;

        let sd = this.clips[path];
        if (!sd) return false;

        let sound = this.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(this.gainNode);
        sound.loop = looping;

        // Установка громкости
        this.gainNode.gain.value = volume;

        sound.start(0);

        return true;
    },

    setVolume: function(value) {
        this.gainNode.gain.value = value; // Устанавливаем громкость GainNode
        console.log("Громкость установлена на:", value);
        this.volume = value;
    },

    playWorldSound: function (path, x, y) {
        if (gameManager.player === null) return;

        let viewSize = Math.max(mapManager.view.w, mapManager.view.h) * 0.8;
        let dx = Math.abs(gameManager.player.pos_x - x);
        let dy = Math.abs(gameManager.player.pos_y - y);
        let distance = Math.sqrt(dx * dx + dy * dy);

        let norm = distance / viewSize;
        norm = Math.min(norm, 1); // Ограничиваем значение до 1
        let volume = 1.0 - norm;

        if (!volume) return;

        this.play(path, { looping: false, volume: volume });
    },

    toggleMute: function () {
        if (this.gainNode.gain.value > 0) {
            this.gainNode.gain.value = 0; // Устанавливаем громкость на 0
        } else {
            this.gainNode.gain.value = 1; // Восстанавливаем громкость
        }
    },

    stopAll: function () {
        this.gainNode.disconnect();
        this.gainNode = this.context.createGain(); // Создаем новый GainNode
        this.gainNode.connect(this.context.destination);
    }
};