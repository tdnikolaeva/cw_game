export var eventsManager = {
    bind: [],
    action: [],
    setup: function(canvas) {
        this.bind[87] = 'up';    // W
        this.bind[65] = 'left';  // A
        this.bind[83] = 'down';  // S
        this.bind[68] = 'right'; // D
        this.bind[32] = 'hit'; // Space

        canvas.tabIndex = 0; // Делает элемент фокусируемым
        canvas.focus();

        canvas.addEventListener('keydown', (event) => this.onKeyDown(event));
        canvas.addEventListener('keyup', (event) => this.onKeyUp(event));

        canvas.addEventListener('mousedown', this.onMouseDown.bind(this)); // Привязываем контекст
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));     // Привязываем контекст
    },

    onMouseDown: function(event) { // Используем обычную функцию
        this.action['hit'] = true;
    },

    onMouseUp: function(event) { // Используем обычную функцию
        this.action['hit'] = false;
    },

    onKeyDown: function(event) {
        let action = this.bind[event.keyCode];
        if (action) {
            this.action[action] = true;
        }
    },

    onKeyUp: function(event) {
        let action = this.bind[event.keyCode];
        if (action) {
            this.action[action] = false;
        }
    }
}