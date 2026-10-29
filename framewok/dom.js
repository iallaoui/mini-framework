import { Events } from "./event.js";

const eventManager = new Events();

// A tiny virtual DOM with recursive, keyed diffing.
const previousTrees = new WeakMap();

export function h(tag, attrs = {}, ...children) {
    return {
        tag,
        attrs: attrs || {},
        children: children.flat(Infinity).filter((child) => (
            child !== null && child !== undefined && child !== false
        ))
    };
}

function isText(vnode) {
    return typeof vnode === 'string' || typeof vnode === 'number';
}

function createDom(vnode) {
    if (isText(vnode)) {
        return document.createTextNode(String(vnode));
    }

    const element = document.createElement(vnode.tag);
    updateAttrs(element, {}, vnode.attrs);
    for (const child of vnode.children) element.append(createDom(child));
    return element;
}
function setAttr(element, name, oldValue, value) {
    if (name === 'key') return;

    if (name.startsWith('on')) {
        const type = name.slice(2).toLowerCase();
        element._handlers ||= {};
        if (typeof value === 'function') element._handlers[type] = value;
        else delete element._handlers[type];
        return;
    }

    if (name === 'style') {
        const oldStyle = oldValue && typeof oldValue === 'object' ? oldValue : {};
        const newStyle = value && typeof value === 'object' ? value : {};
        for (const property of Object.keys(oldStyle)) {
            if (!(property in newStyle)) element.style[property] = '';
        }
        Object.assign(element.style, newStyle);
        return;
    }

    if (name === 'className') {
        element.className = value || '';
        return;
    }

    if (value === false || value === null || value === undefined) {
        element.removeAttribute(name);
        if (name in element) {
            if (typeof element[name] === 'boolean') element[name] = false;
            else if (typeof element[name] === 'string') element[name] = '';
        }
        return;
    }

    if (name in element && name !== 'list' && name !== 'form') {
        element[name] = value;
    } else {
        element.setAttribute(name, value === true ? '' : String(value));
    }
}

function updateAttrs(element, oldAttrs, newAttrs) {
    const names = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);
    for (const name of names) {
        if (oldAttrs[name] !== newAttrs[name]) {
            setAttr(element, name, oldAttrs[name], newAttrs[name]);
        }
    }
}

function keyOf(vnode) {
    return isText(vnode) ? null : vnode?.attrs?.key ?? null;
}

function patch(parent, node, oldVNode, newVNode) {
    if (!sameKind(oldVNode, newVNode)) {
        parent.replaceChild(createDom(newVNode), node);
        return;
    }

    if (isText(newVNode)) {
        const value = String(newVNode);
        if (node.nodeValue !== value) node.nodeValue = value;
        return;
    }

    updateAttrs(node, oldVNode.attrs, newVNode.attrs);
    patchChildren(node, oldVNode.children, newVNode.children);
}
