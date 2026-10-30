# mini-framework

`mini-framework` is a small browser framework built with plain JavaScript. It provides declarative DOM creation, delegated events, observable state, and hash routing. The included TodoMVC app uses only these APIs.

## Run it

Serve the repository root because the project uses JavaScript modules:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/Todo/`.

Run the virtual-DOM diffing tests with:

```sh
node --test tests/dom.test.mjs
```

## DOM abstraction

`h(tag, attributes, ...children)` creates a plain virtual-node object. `render` mounts the first tree, then compares later trees with the previous one. It patches only changed text, attributes, event handlers, and children while preserving unchanged DOM nodes.

### Create an element and add attributes

```js
import { h, render } from './framewok/dom.js';

const title = h('h1', { id: 'welcome', className: 'title' }, 'Hello');
render(title, document.querySelector('#root'));
```

The first argument is the HTML tag, the second is an attributes/properties object, and the rest are children. DOM properties such as `checked`, `value`, and `className` are assigned directly; other values become HTML attributes.

### Nest elements

```js
const card = h('section', { className: 'card' },
    h('h2', {}, 'Tasks'),
    h('ul', {},
        h('li', {}, 'Learn the framework'),
        h('li', {}, 'Build an app')
    )
);
```

Children can be text, numbers, virtual nodes, or arrays of virtual nodes. Arrays are flattened, which makes `items.map(...)` convenient.

For dynamic lists, add a stable `key`. Keys let the diffing algorithm move or remove the correct DOM node instead of confusing one item with another:

```js
const list = h('ul', {}, items.map((item) =>
    h('li', { key: item.id }, item.name)
));
```

## Event handling

Events are declared with the framework's `on` helper. The app initializes one delegated event manager on its root; users do not attach a browser listener to each element.

```js
import { h } from './framewok/dom.js';
import { Events, on } from './framewok/event.js';

const root = document.querySelector('#root');
const button = h('button', {
    className: 'save',
    ...on('click', () => console.log('saved'))
}, 'Save');

const events = new Events(root);
events.init(['click']);
```

Delegation keeps setup small and continues to work while `render` patches, adds, moves, or removes children. Call `events.destroy()` when removing the whole application.

## State management

`createStore` keeps shared application state in one place. `setState` accepts an object or updater function, merges the result, then calls every subscriber. A subscriber normally renders the application, so user actions update state and the framework updates the page.

```js
import { h, render } from './framewok/dom.js';
import { createStore } from './framewok/state.js';

const root = document.querySelector('#root');
const store = createStore({ count: 0 });
store.subscribe((state) => render(h('p', {}, state.count), root));
store.setState((state) => ({ count: state.count + 1 }));
```

Updater functions are useful when the next value depends on the current one. Returning a new array or object keeps changes predictable.

## Routing

The router synchronizes URL hashes with application state. Links can use normal `href="#/active"` attributes, so back and forward navigation work.

```js
import Router from './framewok/router.js';

const router = new Router({
    '/': () => store.setState({ page: 'home' }),
    '/about': () => store.setState({ page: 'about' })
});
router.start();
router.navigate('/about');
```

Unknown routes use the `/` handler by default. `router.destroy()` removes its listener.

## Project structure

```text
framewok/       framework source
  dom.js        virtual nodes and rendering
  event.js      declarative delegated events
  state.js      observable shared state
  router.js     hash routing
Todo/           TodoMVC example
  index.html
  app.js
  app.css
```

The renderer keeps the previous virtual tree in a `WeakMap`. On each render it recursively compares the old and new trees. Different tags are replaced, changed text and attributes are updated in place, and keyed children are reused or moved. This preserves focus and input state while avoiding unnecessary DOM work. Event delegation means patched elements do not need separate browser listeners.
