import { h, render } from '../framewok/dom.js';
import { Events } from '../framewok/event.js';
import { createStore } from '../framewok/state.js';
import Router from '../framewok/router.js';

const root = document.querySelector('#root');

// Keep the complete todo list and the current UI state in one store.
const store = createStore({
    todos: [],
    filter: 'all',
    editingId: null
});

let nextId = 1;

// Apply a transformation to the todo list while preserving the rest of the state.
function updateTodos(transform) {
    store.setState(({ todos }) => ({ todos: transform(todos) }));
}

function commitEdit(id, value) {
    const title = value.trim();
    store.setState(({ todos }) => ({
        editingId: null,
        todos: title
            ? todos.map((todo) => todo.id === id ? { ...todo, title } : todo)
            : todos.filter((todo) => todo.id !== id)
    }));
}

// Render one todo item, including its view and inline editing controls.
function TodoItem(todo, editingId) {
    const editing = editingId === todo.id;
    const classes = [todo.completed && 'completed', editing && 'editing'].filter(Boolean).join(' ');

    return h('li', { key: todo.id, className: classes},
        h('div', { className: 'view' },
            h('input', {
                className: 'toggle',
                type: 'checkbox',
                checked: todo.completed,
                onChange: () => updateTodos((todos) => todos.map((item) => (
                    item.id === todo.id ? { ...item, completed: !item.completed } : item
                )))
            }),
            h('label', {
                onDblclick: () => {
                    // Focus the edit field after the state update has rendered it.
                    store.setState({ editingId: todo.id });
                    requestAnimationFrame(() => {
                        const input = document.querySelector('.editing .edit');
                        input?.focus();
                        input?.setSelectionRange(input.value.length, input.value.length);
                    });
                }
            }, todo.title),
            h('button', {
                className: 'destroy',
                'aria-label': `Delete ${todo.title}`,
                onClick: () => updateTodos((todos) => todos.filter((item) => item.id !== todo.id))
            })
        ),
        h('input', {
            className: 'edit',
            value: todo.title,
            onBlur: (event) => {
                if (store.getState().editingId === todo.id) {
                    commitEdit(todo.id, event.target.value);
                }
            },
            onKeydown: (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    commitEdit(todo.id, event.target.value);
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.target.value = todo.title;
                    store.setState({ editingId: null });
                }
            }
        })
    );
}

function App(state) {
    // Derive the count and list displayed by the active route filter.
    const activeCount = state.todos.filter((todo) => !todo.completed).length;

    const visible = state.todos.filter((todo) => (
        state.filter === 'active' ? !todo.completed :
        state.filter === 'completed' ? todo.completed : true
    ));
    const visibleIds = new Set(visible.map((todo) => todo.id));
    const allVisibleCompleted = visible.length > 0 && visible.every((todo) => todo.completed);

    return h('section', { className: 'todoapp' },
        h('header', { className: 'header' },
            h('h1', {}, 'todos'),
            h('form', {
                onSubmit: (event) => {
                    event.preventDefault();
                    const input = event.target.querySelector('.new-todo');
                    const title = input.value.trim();
                    if (!title) return;
                    input.value = '';
                    updateTodos((todos) => [...todos, {
                        id: nextId++,
                        title,
                        completed: false
                    }]);
                }
            },
                h('input', {
                    className: 'new-todo',
                    placeholder: 'What needs to be done?',
                    autofocus: true
                })
            )
        ),
        state.todos.length > 0 && h('main', { className: 'main' },
            h('div', { className: 'toggle-all-container' },
                h('input', {
                    id: 'toggle-all',
                    className: 'toggle-all',
                    type: 'checkbox',
                    checked: allVisibleCompleted,
                    disabled: visible.length === 0,
                    onChange: (event) => updateTodos((todos) => todos.map((todo) => (
                        visibleIds.has(todo.id)
                            ? { ...todo, completed: event.target.checked }
                            : todo
                    )))
                }),
                h('label', { htmlFor: 'toggle-all' }, 'Mark all as complete')
            ),
            h('ul', { className: 'todo-list' },
                visible.map((todo) => TodoItem(todo, state.editingId))
            )
        ),
        state.todos.length > 0 && h('footer', { className: 'footer' },
            h('span', { className: 'todo-count' },
                h('strong', {}, activeCount),
                ` ${activeCount === 1 ? 'item' : 'items'} left`
            ),
            h('ul', { className: 'filters' },
                [
                    ['All', '/', 'all'],
                    ['Active', '/active', 'active'],
                    ['Completed', '/completed', 'completed']
                ].map(([label, route, filter]) => h('li', { key: filter },
                    h('a', {
                        href: `#${route}`,
                        className: state.filter === filter ? 'selected' : ''
                    }, label)
                ))
            ),
            state.todos.some((todo) => todo.completed) && h('button', {
                className: 'clear-completed',
                onClick: () => updateTodos((todos) => todos.filter((todo) => !todo.completed))
            }, 'Clear completed')
        )
    );
}

// Re-render the application whenever the store changes.
store.subscribe((state) => {
    render(App(state), root);
});

// Register the DOM events used by the todo controls.
new Events(root).init(['click', 'change', 'submit', 'dblclick', 'keydown', 'blur']);

// Keep the selected filter in sync with the URL hash route.
new Router({
    '/': () => store.setState({ filter: 'all' }),
    '/active': () => store.setState({ filter: 'active' }),
    '/completed': () => store.setState({ filter: 'completed' })
}).start();
