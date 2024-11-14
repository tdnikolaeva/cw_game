
export class FSM {
    constructor(initialState) {
        this.current = initialState;
        this.states = new Set();
        this.transitions = [];
    }

    addState(state) {
        this.states.add(state);
    }

    addTransition(event, from, to, action) {
        this.transitions.push({ event, from, to, action });
    }

    update(event) {
        for (let t of this.transitions) {
            if (t.event === event && t.from === this.current) {
                this.current = t.to;
                if (t.action) t.action();
                return;
            }
        }
    }
}