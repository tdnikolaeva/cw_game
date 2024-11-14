// import {levelManager} from "../game/level_manager.js";


const username = localStorage.getItem('username');

if (!username) {
    // Если имени нет, переходим обратно на страницу аутентификации
    window.location.href = 'index.html';
}

// Генерация уровней
generateLevels(2); // Задайте количество уровней здесь

function generateLevels(count) {
    const container = document.getElementById('levelContainer');

    for (let i = 1; i <= count; i++) {
        const levelCard = document.createElement('div');
        levelCard.className = 'level-card'; // Новый класс для карточки уровня

        // Создаем элемент изображения и устанавливаем источник
        const levelImage = document.createElement('img');
        levelImage.src = `data/img/${i}.png`; // Динамически формируем путь к изображению
        levelImage.onerror = function() {
            levelImage.src = 'data/img/default.png'; // Замените на путь к запасному изображению
        };
        levelCard.appendChild(levelImage);

        const levelText = document.createElement('p');
        levelText.textContent = `Level ${i}`;

        const startButton = document.createElement('button');
        startButton.textContent = 'Начать';

        startButton.addEventListener('click', function() {
            window.location.href = `level.html?level=${i}`;
        });

        levelCard.appendChild(levelText);
        levelCard.appendChild(startButton);

        container.appendChild(levelCard);
    }
}