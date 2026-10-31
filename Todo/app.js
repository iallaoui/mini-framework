import { h, render } from '../framewok/dom.js';
import { Events } from '../framewok/event.js';
import { createStore } from '../framewok/state.js';
import Router from '../framewok/router.js';

const root = document.querySelector('#root');
let savedTodos = [];
try {
    const saved = JSON.parse(localStorage.getItem('todos') || '[]');
    if (Array.isArray(saved)) savedTodos = saved;
} catch {
    localStorage.removeItem('todos');
}
const store = createStore({ todos: savedTodos, filter: 'all', editingId: null });
let nextId = savedTodos.reduce((largest, todo) => Math.max(largest, todo.id), 0) + 1;

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

function TodoItem(todo, editingId) {
    const editing = editingId === todo.id;
    const classes = [todo.completed && 'completed', editing && 'editing'].filter(Boolean).join(' ');
    return h('li', { key: todo.id, className: classes, 'data-id': todo.id },
        h('div', { className: 'view' },
            h('input', {
                className: 'toggle', type: 'checkbox', checked: todo.completed,
                onChange: () => updateTodos((todos) => todos.map((item) => (
                    item.id === todo.id ? { ...item, completed: !item.completed } : item
                )))
            }),
            h('label', {
                onDblclick: () => {
                    store.setState({ editingId: todo.id });
                    requestAnimationFrame(() => {
                        const input = document.querySelector('.editing .edit');
                        input?.focus();
                        input?.setSelectionRange(input.value.length, input.value.length);
                    });
                }
            }, todo.title),
            h('button', {
                className: 'destroy', 'aria-label': `Delete ${todo.title}`,
                onClick: () => updateTodos((todos) => todos.filter((item) => item.id !== todo.id))
            })
        ),
        h('input', {
            className: 'edit', value: todo.title,
            onBlur: (event) => {
                if (store.getState().editingId === todo.id) commitEdit(todo.id, event.target.value);
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
    const activeCount = state.todos.filter((todo) => !todo.completed).length;
    const visible = state.todos.filter((todo) => (
        state.filter === 'active' ? !todo.completed :
        state.filter === 'completed' ? todo.completed : true
    ));

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
                        id: nextId++, title, completed: false
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
                    id: 'toggle-all', className: 'toggle-all', type: 'checkbox',
                    checked: activeCount === 0,
                    onChange: (event) => updateTodos((todos) => todos.map((todo) => ({
                        ...todo,
                        completed: event.target.checked
                    })))
                }),
                h('label', { htmlFor: 'toggle-all' }, 'Mark all as complete')
            ),
            h('ul', { className: 'todo-list' }, visible.map((todo) => TodoItem(todo, state.editingId)))
        ),
        state.todos.length > 0 && h('footer', { className: 'footer' },
            h('span', { className: 'todo-count' },
                h('strong', {}, activeCount), ` ${activeCount === 1 ? 'item' : 'items'} left`
            ),
            h('ul', { className: 'filters' },
                [['All', '/', 'all'], ['Active', '/active', 'active'], ['Completed', '/completed', 'completed']]
                    .map(([label, route, filter]) => h('li', { key: filter },
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

store.subscribe((state) => {
    localStorage.setItem('todos', JSON.stringify(state.todos));
    render(App(state), root);
});

new Events(root).init(['click', 'change', 'submit', 'dblclick', 'keydown', 'blur']);

new Router({
    '/': () => store.setState({ filter: 'all' }),
    '/active': () => store.setState({ filter: 'active' }),
    '/completed': () => store.setState({ filter: 'completed' })
}).start();
