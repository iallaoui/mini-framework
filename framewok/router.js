class AppRout {
    constructor(options = {}) {
        this.routes = options.routes || {};
        this.currentPath = null;

        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        this.handleRoute();
    }
        handleRoute() {
        const path = window.location.hash || '#/';
        this.currentPath = path;

        const action = this.routes[path];

        if (typeof action === 'function') {
            action();
        } else {
            console.warn(`No route found for: ${path}`);
        }
    }

  
}
export default AppRout;