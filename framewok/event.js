export class Events {
    constructor(rootElement = document.body) {
        this.root = rootElement;
    }

    init(eventTypes = ['click', 'input', 'change', 'submit']) {
     for (const type of eventTypes) {
    const useCapture = (type === 'blur' || type === 'focus');
    
    this.root.addEventListener(type, (event) => {
        let current = event.target;
        while (current && current !== this.root.parentElement) { 
            if (current._handlers && current._handlers[event.type]) {
                current._handlers[event.type](event);
                break;  
            }
            current = current.parentElement;
        }
    }, useCapture); 
}
    }
    on(element, eventType, handler) {
        if (!element._handlers) element._handlers = {};
        element._handlers[eventType] = handler;
    }
    off(element, eventType) {
        if (element._handlers) {
            delete element._handlers[eventType];
        }
    }


 
}