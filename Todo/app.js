import { createStore } from '../src/framework/state.js';
import { Events } from '../src/framework/event.js';
import AppRout from '../src/framework/router.js';





const state = createStore({
    todos: [],
    draft: '',
    editingId: null,
    route: window.location.hash || '#/'
}, () => {
    render();
});
const events = new Events(rootElement);
events.init(['click', 'input', 'change', 'submit', 'dblclick', 'keydown', 'blur']);

new AppRout({
    routes: {
        '#/':          () => { state.route = '#/'; },
        '#/active':    () => { state.route = '#/active'; },
        '#/completed': () => { state.route = '#/completed'; }
    }
});

render();