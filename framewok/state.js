// staaate managment recivity system 


export function createStore(initialState, notifyCallback) {
    return new Proxy(initialState, {
        set(target, key, value) {
            target[key] = value;
            if (typeof notifyCallback === 'function') notifyCallback();
            return true;
        }
    });
}