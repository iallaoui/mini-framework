// A tiny virtual DOM with recursive, keyed diffing.
const previousTrees = new WeakMap();

export function h(tag, attrs = {}, ...children) {
    // Normalize nested children and discard empty conditional children.
    return {
        tag,
        attrs: attrs || {},
        children: children.flat().filter((child) => ( child !== false ))
    }
}

function isText(vnode) {
    return typeof vnode === 'string' || typeof vnode === 'number';
}

// Convert a virtual node tree into real DOM nodes on the initial render.
function createDom(vnode) {
    if (isText(vnode)) {
        return document.createTextNode(vnode);
    }

    const element = document.createElement(vnode.tag);
    updateAttrs(element, {}, vnode.attrs);
    for (const child of vnode.children) element.append(createDom(child));
    return element;
}

// Handle special virtual-DOM attributes before falling back to DOM properties.
function setAttr(element, name, value) {
    if (name === 'key') return;

    if (name.startsWith('on')) {
        const type = name.slice(2).toLowerCase();
        if (!element.eventHandlers) {
            element.eventHandlers = {};
        }

        element.eventHandlers[type] = value;
        return;
    }

    if (name === 'className') {
        element.className = value || '';
        return;
    }

    if (value === false) {
        element.removeAttribute(name);
        element[name] = false;
        return;
    }

    if (name in element) {
        element[name] = value;
    } else {
        element.setAttribute(name, value === true ? '' : String(value));
    }
}

function updateAttrs(element, oldAttrs, newAttrs) {
    // Update only attributes whose values changed between renders.
    for (const name of Object.keys(newAttrs)) {
        if (oldAttrs[name] !== newAttrs[name]) {
            setAttr(element, name, newAttrs[name]);
        }
    }
}

function keyOf(vnode) {
    if (isText(vnode)) return null;
    return vnode.attrs.key ?? null;
}

function sameKind(left, right) {
    if (isText(left) && isText(right)) return true;
    if (isText(left) || isText(right)) return false;
    return left.tag === right.tag;
}

function patchChildren(element, oldChildren, newChildren) {
    // Match keyed children by key and unkeyed children by their position/type.
    const oldEntries = oldChildren.map((vnode, index) => ({
        vnode,
        node: element.childNodes[index],
        used: false
    }));

    for (let index = 0; index < newChildren.length; index += 1) {
        const newChild = newChildren[index];
        const key = keyOf(newChild);
        let entry = null;

        if (key !== null) {
            entry = oldEntries.find((item) => !item.used && keyOf(item.vnode) === key);
        } else {
            entry = oldEntries.find((item) => (
                !item.used && keyOf(item.vnode) === null && sameKind(item.vnode, newChild)
            ));
        }

        const currentNode = element.childNodes[index] || null;
        if (!entry) {
            element.insertBefore(createDom(newChild), currentNode);
            continue;
        }

        entry.used = true;
        if (entry.node !== currentNode) element.insertBefore(entry.node, currentNode);
        patch(element, entry.node, entry.vnode, newChild);
    }

    for (const entry of oldEntries) {
        if (!entry.used && entry.node.parentNode === element) entry.node.remove();
    }
}

function patch(parent, node, oldVNode, newVNode) {
    // Replace incompatible nodes; otherwise update their contents in place.
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

export function render(vnode, container) {
    // Reuse the previous tree so subsequent renders can be diffed efficiently.
    const previousTree = previousTrees.get(container);
    if (!previousTree || !container.firstChild) {
        container.replaceChildren(createDom(vnode));
    } else {
        patch(container, container.firstChild, previousTree, vnode);
    }
    previousTrees.set(container, vnode);
}
