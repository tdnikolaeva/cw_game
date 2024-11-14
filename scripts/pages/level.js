import { levelManager } from "../game/level_manager.js";
import {soundFiles, soundManager} from "../game/sound_manager.js";

let canvas;
let ctx;

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canvasid");
    ctx = canvas.getContext("2d");
    if (!soundManager.loaded){
        console.log('start load')
        soundManager.init(); // Инициализация AudioContext
        soundManager.loadArray(soundFiles);
    }
});

// Функция для установки громкости
document.getElementById('volumeControl').addEventListener('input', function () {
    if (!soundManager.loaded) {
        console.log('listener init');
        soundManager.init(); // Инициализация AudioContext
        soundManager.loadArray(levelManager.soundFiles);
    }
    soundManager.setVolume(this.value); // Устанавливаем громкость при изменении ползунка
});

// Получаем строку запроса из URL
const queryString = window.location.search;

// Создаем объект URLSearchParams
const urlParams = new URLSearchParams(queryString);

// Извлекаем номер уровня и устанавливаем его в levelManager
let level = urlParams.get('level');

// Устанавливаем заголовок уровня
const levelTitle = document.getElementById('levelTitle');
levelTitle.textContent += level;

// Функция для отображения серого полупрозрачного фона на канвасе
function drawBackground() {
    ctx.fillStyle = "rgba(128, 128, 128, 0.7)"; // Серый полупрозрачный цвет
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Заливаем весь холст
}

// Вызываем функцию для отображения рекордов при загрузке страницы
levelManager.displayTopPlayers(level);

// Обработчик события для кнопки "Начать"
document.getElementById('startButton').addEventListener('click', function () {
    // drawBackground(); // Рисуем фон перед началом уровня
    levelManager.startLevel(level); // Запускаем уровень
});

// Обработчик события для кнопки "Следующий уровень"
document.getElementById('nextButton').addEventListener('click', function () {
    let nextLevel = parseInt(level) + 1; // Увеличиваем номер уровня на 1

    // Проверяем, не превышает ли следующий уровень максимальное количество уровней
    if (nextLevel > levelManager.levelsAmount) {
        nextLevel = 1; // Если превышает, возвращаем на первый уровень
    }

    // Перенаправляем на следующий уровень
    window.location.href = `level.html?level=${nextLevel}`;
});

// Ждем загрузки DOM перед запуском уровня
document.addEventListener('DOMContentLoaded', function () {
    levelManager.startLevel(level); // Запускаем уровень
});