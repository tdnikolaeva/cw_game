document.getElementById('saveButton').addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();

    if (username === '') {
        alert('Имя не может быть пустым!');
    } else {
        // Сохраняем имя пользователя в localStorage
        localStorage.setItem('username', username);

        // Переход на страницу выбора уровней
        window.location.href = 'levels.html';
    }
});

