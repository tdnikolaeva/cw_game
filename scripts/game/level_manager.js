import {soundManager, soundFiles} from "./sound_manager.js";
import {gameManager} from "./game_manager.js";

let canvas;
let ctx;

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canvasid");
    ctx = canvas.getContext("2d");
    // Здесь можно добавлять код, который использует canvas и ctx
});

export var levelManager = {
    level: 1,
    levelsAmount: 2,
    username: '',


    startLevel: function (levelNum) {
        if(gameManager.updateInterval){
            clearInterval(gameManager.updateInterval);
        }
        this.level = levelNum;
        if (!soundManager.loaded){
            soundManager.init(); // Инициализация AudioContext
            soundManager.loadArray(soundFiles);
        }
        this.displayTopPlayers(this.level);
        gameManager.loadAll(`../data/levels_maps/${this.level}.json`, '../data/sprites/sprites.json', '../data/sprites/sprites.png');
        gameManager.play();
    },

    endLevel: function (success) {
        // Запланировать вызов drawEnd через
        setTimeout(() => {
            this.drawEnd(); // Вызов функции отрисовки экрана завершения игры
        }, 200);

        let username = localStorage.getItem('username');
        if (success) {
            this.updateTopPlayers(username, gameManager.player.score, this.level);
        } else {
            this.updateTopPlayers(username, 0, this.level);
        }
        this.displayTopPlayers(this.level);
        soundManager.play('../data/sounds/successfullgameend.mp3', {looping: false, volume: soundManager.volume});
    },

    getTopPlayers: function (levelNum) {

        // Получаем данные из локального хранилища
        const topPlayers = JSON.parse(localStorage.getItem('topPlayers')) || {};

        // Создаем массив для хранения игроков с их очками за указанный уровень
        const players = [];

        // Проходим по всем пользователям в topPlayers
        for (const player in topPlayers) {
            if (topPlayers[player][levelNum] !== undefined) {
                players.push({
                    name: player,
                    score: topPlayers[player][levelNum]
                });
            }
        }
        // Сортируем игроков по очкам в порядке убывания
        players.sort((a, b) => b.score - a.score);

        // Возвращаем топ-5 игроков
        return players.slice(0, 5);
    },

    displayTopPlayers: function (levelNum) {
        const highScoresList = document.getElementById('highScoresList');

        // Получаем топ игроков по уровню
        const topPlayers = this.getTopPlayers(levelNum);


        // Очищаем текущий список рекордов
        highScoresList.innerHTML = '';

        // Добавляем игроков в список
        topPlayers.forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = `${player.name} - ${player.score} очков`;
            highScoresList.appendChild(listItem);
        });
    },

    updateTopPlayers: function (name, score, levelNum) {
        // Получаем данные из локального хранилища
        const topPlayers = JSON.parse(localStorage.getItem('topPlayers')) || {};

        // Если пользователь уже существует в хранилище
        if (topPlayers[name]) {
            // Проверяем, если текущий счет лучше, чем сохраненный
            if (topPlayers[name][levelNum] === undefined || score > topPlayers[name][levelNum]) {
                topPlayers[name][levelNum] = score; // Обновляем счет за уровень
            }
        } else {
            // Если пользователя нет, создаем новый объект для него
            topPlayers[name] = {
                [levelNum]: score // Сохраняем счет за уровень
            };
        }

        // Сохраняем обновленные данные обратно в локальное хранилище
        localStorage.setItem('topPlayers', JSON.stringify(topPlayers));
    },

    drawEnd: function () {
        // Заливка фона серым полупрозрачным цветом
        ctx.fillStyle = "rgba(128, 128, 128, 0.7)"; // Серый полупрозрачный цвет
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Заливаем весь холст
        // Настройка текста
        ctx.fillStyle = "black"; // Цвет текста
        ctx.font = "30px Arial"; // Шрифт и размер
        ctx.textAlign = "center"; // Центрирование текста
        // Вывод "GAME OVER"
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2); // Надпись по центру
    },


}