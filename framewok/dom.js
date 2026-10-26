import { Events } from "./event.js";

const eventManager = new Events();

export function h(type, props = {}, ...children) {
    return {
        type,
        props: props ?? {},
        children: children.flat(Infinity).filter(child => (
            child !== null && child !== undefined && child !== false
        ))
    };
}

function isElement(vnode) {
    return vnode !== null && typeof vnode === "object" && Boolean(vnode.type);
}

function isText(vnode) {
    return typeof vnode === "string" || typeof vnode === "number";
}
