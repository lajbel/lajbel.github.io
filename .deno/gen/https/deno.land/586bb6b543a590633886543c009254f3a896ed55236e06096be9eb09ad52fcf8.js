import { CTOR_KEY } from "../constructor-lock.ts";
import { fragmentNodesFromString } from "../deserialize.ts";
import { Node, NodeType } from "./node.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
export class DOMTokenList extends Set {
    #onChange;
    constructor(onChange){
        super();
        this.#onChange = onChange;
    }
    add(token) {
        if (token === "" || /[\t\n\f\r ]/.test(token)) {
            throw new Error(`DOMTokenList.add: Invalid class token "${token}"`);
        }
        super.add(token);
        this.#onChange([
            ...this
        ].join(" "));
        return this;
    }
    clear() {
        super.clear();
        this.#onChange("");
    }
    remove(...tokens) {
        for (const token of tokens){
            super.delete(token);
        }
        this.#onChange([
            ...this
        ].join(" "));
        return this;
    }
    delete(token) {
        const deleted = super.delete(token);
        if (deleted) {
            this.#onChange([
                ...this
            ].join(" "));
        }
        return deleted;
    }
    contains(token) {
        return this.has(token);
    }
    _update(value) {
        // Using super.clear() and super.add() rather than the overriden methods so
        // onChange doesn't fire while updating.
        super.clear();
        if (value !== null) {
            for (const token of value.split(/[\t\n\f\r ]+/g)){
                // The only empty strings resulting from splitting should correspond to
                // whitespace at either end of `value`.
                if (token === "") continue;
                super.add(token);
            }
        }
    }
}
export class Attr {
    #namedNodeMap = null;
    #name = "";
    constructor(map, name, key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor");
        }
        this.#name = name;
        this.#namedNodeMap = map;
    }
    get name() {
        return this.#name;
    }
    get value() {
        return this.#namedNodeMap[this.#name];
    }
}
export class NamedNodeMap {
    #attrObjCache = {
    };
    newAttr(attribute) {
        return new Attr(this, attribute, CTOR_KEY);
    }
    getNamedItem(attribute) {
        return this.#attrObjCache[attribute] ?? (this.#attrObjCache[attribute] = this.newAttr(attribute));
    }
    setNamedItem(...args) {
    // TODO
    }
}
export class Element extends Node {
    tagName;
    #classList = new DOMTokenList((className)=>{
        if (this.hasAttribute("class") || className !== "") {
            this.attributes["class"] = className;
        }
    });
    attributes = new NamedNodeMap();
    #currentId = "";
    constructor(tagName, parentNode, attributes, key){
        super(tagName, NodeType.ELEMENT_NODE, parentNode, key);
        this.tagName = tagName;
        for (const attr of attributes){
            this.attributes[attr[0]] = attr[1];
            switch(attr[0]){
                case "class":
                    this.#classList._update(attr[1]);
                    break;
                case "id":
                    this.#currentId = attr[1];
                    break;
            }
        }
        this.tagName = this.nodeName = tagName.toUpperCase();
    }
    _shallowClone() {
        const attributes = [];
        for (const attribute of this.getAttributeNames()){
            attributes.push([
                attribute,
                this.attributes[attribute]
            ]);
        }
        return new Element(this.nodeName, null, attributes, CTOR_KEY);
    }
    get childElementCount() {
        let count = 0;
        for (const { nodeType  } of this.childNodes){
            if (nodeType === NodeType.ELEMENT_NODE) {
                count++;
            }
        }
        return count;
    }
    get className() {
        return this.getAttribute("class") ?? "";
    }
    get classList() {
        return this.#classList;
    }
    set className(className) {
        this.setAttribute("class", className);
        this.#classList._update(className);
    }
    get outerHTML() {
        const tagName = this.tagName.toLowerCase();
        const attributes = this.attributes;
        let out = "<" + tagName;
        for (const attribute of this.getAttributeNames()){
            out += ` ${attribute.toLowerCase()}`;
            // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
            if (attributes[attribute] != null) {
                out += `="${attributes[attribute].replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/"/g, "&quot;")}"`;
            }
        }
        // Special handling for void elements
        switch(tagName){
            case "area":
            case "base":
            case "br":
            case "col":
            case "embed":
            case "hr":
            case "img":
            case "input":
            case "link":
            case "meta":
            case "param":
            case "source":
            case "track":
            case "wbr":
                out += ">";
                break;
            default:
                out += ">" + this.innerHTML + `</${tagName}>`;
                break;
        }
        return out;
    }
    set outerHTML(html) {
    // TODO: Someday...
    }
    get innerHTML() {
        let out = "";
        for (const child of this.childNodes){
            switch(child.nodeType){
                case NodeType.ELEMENT_NODE:
                    out += child.outerHTML;
                    break;
                case NodeType.COMMENT_NODE:
                    out += `<!--${child.data}-->`;
                    break;
                case NodeType.TEXT_NODE:
                    // Special handling for rawtext-like elements.
                    switch(this.tagName.toLowerCase()){
                        case "style":
                        case "script":
                        case "xmp":
                        case "iframe":
                        case "noembed":
                        case "noframes":
                        case "plaintext":
                            out += child.data;
                            break;
                        default:
                            // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
                            out += child.data.replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            break;
                    }
                    break;
            }
        }
        return out;
    }
    set innerHTML(html) {
        // Remove all children
        for (const child of this.childNodes){
            child.parentNode = child.parentElement = null;
        }
        const mutator = this._getChildNodesMutator();
        mutator.splice(0, this.childNodes.length);
        if (html.length) {
            const parsed = fragmentNodesFromString(html);
            mutator.push(...parsed.childNodes[0].childNodes);
            for (const child of this.childNodes){
                child._setParent(null);
                child._setOwnerDocument(this.ownerDocument);
            }
        }
    }
    get innerText() {
        return this.textContent;
    }
    set innerText(text) {
        this.textContent = text;
    }
    get id() {
        return this.#currentId || "";
    }
    set id(id) {
        this.setAttribute(id, this.#currentId = id);
    }
    getAttributeNames() {
        return Object.getOwnPropertyNames(this.attributes);
    }
    getAttribute(name) {
        return this.attributes[name?.toLowerCase()] ?? null;
    }
    setAttribute(rawName, value) {
        const name = rawName?.toLowerCase();
        const strValue = String(value);
        this.attributes[name] = strValue;
        if (name === "id") {
            this.#currentId = strValue;
        } else if (name === "class") {
            this.#classList._update(strValue);
        }
    }
    removeAttribute(rawName) {
        const name = rawName?.toLowerCase();
        delete this.attributes[name];
        if (name === "class") {
            this.#classList._update(null);
        }
    }
    hasAttribute(name) {
        return this.attributes.hasOwnProperty(name?.toLowerCase());
    }
    hasAttributeNS(_namespace, name) {
        // TODO: Use namespace
        return this.attributes.hasOwnProperty(name?.toLowerCase());
    }
    get firstElementChild() {
        for (const node of this.childNodes){
            if (node.nodeType === Node.ELEMENT_NODE) {
                return node;
            }
        }
        return null;
    }
    get lastElementChild() {
        const { childNodes  } = this;
        for(let i = childNodes.length - 1; i >= 0; i--){
            const node = childNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                return node;
            }
        }
        return null;
    }
    get nextElementSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const index = parent._getChildNodesMutator().indexOf(this);
        const childNodes = parent.childNodes;
        let next = null;
        for(let i = index + 1; i < childNodes.length; i++){
            const sibling = childNodes[i];
            if (sibling.nodeType === NodeType.ELEMENT_NODE) {
                next = sibling;
                break;
            }
        }
        return next;
    }
    get previousElementSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const index = parent._getChildNodesMutator().indexOf(this);
        const childNodes = parent.childNodes;
        let prev = null;
        for(let i = index - 1; i >= 0; i--){
            const sibling = childNodes[i];
            if (sibling.nodeType === NodeType.ELEMENT_NODE) {
                prev = sibling;
                break;
            }
        }
        return prev;
    }
    querySelector(selectors) {
        if (!this.ownerDocument) {
            throw new Error("Element must have an owner document");
        }
        return this.ownerDocument._nwapi.first(selectors, this);
    }
    querySelectorAll(selectors) {
        if (!this.ownerDocument) {
            throw new Error("Element must have an owner document");
        }
        const nodeList = new NodeList();
        const mutator = nodeList[nodeListMutatorSym]();
        mutator.push(...this.ownerDocument._nwapi.select(selectors, this));
        return nodeList;
    }
    matches(selectorString) {
        return this.ownerDocument._nwapi.match(selectorString, this);
    }
    // TODO: DRY!!!
    getElementById(id) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                if (child.id === id) {
                    return child;
                }
                const search = child.getElementById(id);
                if (search) {
                    return search;
                }
            }
        }
        return null;
    }
    getElementsByTagName(tagName) {
        return this._getElementsByTagName(tagName.toUpperCase(), []);
    }
    _getElementsByTagNameWildcard(search) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                search.push(child);
                child._getElementsByTagNameWildcard(search);
            }
        }
        return search;
    }
    _getElementsByTagName(tagName, search) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                if (child.tagName === tagName) {
                    search.push(child);
                }
                child._getElementsByTagName(tagName, search);
            }
        }
        return search;
    }
    getElementsByClassName(className) {
        return this._getElementsByClassName(className, []);
    }
    getElementsByTagNameNS(_namespace, localName) {
        // TODO: Use namespace
        return this.getElementsByTagName(localName);
    }
    _getElementsByClassName(className, search) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                if (child.classList.contains(className)) {
                    search.push(child);
                }
                child._getElementsByClassName(className, search);
            }
        }
        return search;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS4xNy1hbHBoYS9zcmMvZG9tL2VsZW1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgZnJhZ21lbnROb2Rlc0Zyb21TdHJpbmcgfSBmcm9tIFwiLi4vZGVzZXJpYWxpemUudHNcIjtcbmltcG9ydCB7IE5vZGUsIE5vZGVUeXBlLCBUZXh0LCBDb21tZW50IH0gZnJvbSBcIi4vbm9kZS50c1wiO1xuaW1wb3J0IHsgTm9kZUxpc3QsIG5vZGVMaXN0TXV0YXRvclN5bSB9IGZyb20gXCIuL25vZGUtbGlzdC50c1wiO1xuXG5leHBvcnQgY2xhc3MgRE9NVG9rZW5MaXN0IGV4dGVuZHMgU2V0PHN0cmluZz4ge1xuICAjb25DaGFuZ2U6IChjbGFzc05hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihvbkNoYW5nZTogKGNsYXNzTmFtZTogc3RyaW5nKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNvbkNoYW5nZSA9IG9uQ2hhbmdlO1xuICB9XG5cbiAgYWRkKHRva2VuOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBpZiAodG9rZW4gPT09IFwiXCIgfHwgL1tcXHRcXG5cXGZcXHIgXS8udGVzdCh0b2tlbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRE9NVG9rZW5MaXN0LmFkZDogSW52YWxpZCBjbGFzcyB0b2tlbiBcIiR7dG9rZW59XCJgKTtcbiAgICB9XG4gICAgc3VwZXIuYWRkKHRva2VuKTtcbiAgICB0aGlzLiNvbkNoYW5nZShbLi4udGhpc10uam9pbihcIiBcIikpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgc3VwZXIuY2xlYXIoKTtcbiAgICB0aGlzLiNvbkNoYW5nZShcIlwiKTtcbiAgfVxuXG4gIHJlbW92ZSguLi50b2tlbnM6IHN0cmluZ1tdKTogdGhpcyB7XG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgIHN1cGVyLmRlbGV0ZSh0b2tlbilcbiAgICB9XG4gICAgdGhpcy4jb25DaGFuZ2UoWy4uLnRoaXNdLmpvaW4oXCIgXCIpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRlbGV0ZSh0b2tlbjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZGVsZXRlZCA9IHN1cGVyLmRlbGV0ZSh0b2tlbik7XG4gICAgaWYgKGRlbGV0ZWQpIHtcbiAgICAgIHRoaXMuI29uQ2hhbmdlKFsuLi50aGlzXS5qb2luKFwiIFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBkZWxldGVkO1xuICB9XG5cbiAgY29udGFpbnModG9rZW46IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcyh0b2tlbik7XG4gIH1cblxuICBfdXBkYXRlKHZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgLy8gVXNpbmcgc3VwZXIuY2xlYXIoKSBhbmQgc3VwZXIuYWRkKCkgcmF0aGVyIHRoYW4gdGhlIG92ZXJyaWRlbiBtZXRob2RzIHNvXG4gICAgLy8gb25DaGFuZ2UgZG9lc24ndCBmaXJlIHdoaWxlIHVwZGF0aW5nLlxuICAgIHN1cGVyLmNsZWFyKCk7XG4gICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHZhbHVlLnNwbGl0KC9bXFx0XFxuXFxmXFxyIF0rL2cpKSB7XG4gICAgICAgIC8vIFRoZSBvbmx5IGVtcHR5IHN0cmluZ3MgcmVzdWx0aW5nIGZyb20gc3BsaXR0aW5nIHNob3VsZCBjb3JyZXNwb25kIHRvXG4gICAgICAgIC8vIHdoaXRlc3BhY2UgYXQgZWl0aGVyIGVuZCBvZiBgdmFsdWVgLlxuICAgICAgICBpZiAodG9rZW4gPT09IFwiXCIpIGNvbnRpbnVlO1xuICAgICAgICBzdXBlci5hZGQodG9rZW4pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXR0ciB7XG4gICNuYW1lZE5vZGVNYXA6IE5hbWVkTm9kZU1hcCB8IG51bGwgPSBudWxsO1xuICAjbmFtZTogc3RyaW5nID0gXCJcIjtcblxuICBjb25zdHJ1Y3RvcihtYXA6IE5hbWVkTm9kZU1hcCwgbmFtZTogc3RyaW5nLCBrZXk6IHR5cGVvZiBDVE9SX0tFWSkge1xuICAgIGlmIChrZXkgIT09IENUT1JfS0VZKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3RvclwiKTtcbiAgICB9XG5cbiAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICB0aGlzLiNuYW1lZE5vZGVNYXAgPSBtYXA7XG4gIH1cblxuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jbmFtZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gKDx7W2F0dHJpYnV0ZTogc3RyaW5nXTogc3RyaW5nfT4gPHVua25vd24+IHRoaXMuI25hbWVkTm9kZU1hcClbdGhpcy4jbmFtZV07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5hbWVkTm9kZU1hcCB7XG4gICNhdHRyT2JqQ2FjaGU6IHtcbiAgICBbYXR0cmlidXRlOiBzdHJpbmddOiBBdHRyO1xuICB9ID0ge307XG5cbiAgcHJpdmF0ZSBuZXdBdHRyKGF0dHJpYnV0ZTogc3RyaW5nKTogQXR0ciB7XG4gICAgcmV0dXJuIG5ldyBBdHRyKHRoaXMsIGF0dHJpYnV0ZSwgQ1RPUl9LRVkpO1xuICB9XG5cbiAgZ2V0TmFtZWRJdGVtKGF0dHJpYnV0ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuI2F0dHJPYmpDYWNoZVthdHRyaWJ1dGVdID8/ICh0aGlzLiNhdHRyT2JqQ2FjaGVbYXR0cmlidXRlXSA9IHRoaXMubmV3QXR0cihhdHRyaWJ1dGUpKTtcbiAgfVxuXG4gIHNldE5hbWVkSXRlbSguLi5hcmdzOiBhbnkpIHtcbiAgICAvLyBUT0RPXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVsZW1lbnQgZXh0ZW5kcyBOb2RlIHtcbiAgI2NsYXNzTGlzdCA9IG5ldyBET01Ub2tlbkxpc3QoKGNsYXNzTmFtZSkgPT4ge1xuICAgIGlmICh0aGlzLmhhc0F0dHJpYnV0ZShcImNsYXNzXCIpIHx8IGNsYXNzTmFtZSAhPT0gXCJcIikge1xuICAgICAgdGhpcy5hdHRyaWJ1dGVzW1wiY2xhc3NcIl0gPSBjbGFzc05hbWU7XG4gICAgfVxuICB9KTtcbiAgcHVibGljIGF0dHJpYnV0ZXM6IE5hbWVkTm9kZU1hcCAmIHtbYXR0cmlidXRlOiBzdHJpbmddOiBzdHJpbmd9ID0gPGFueT4gbmV3IE5hbWVkTm9kZU1hcCgpO1xuXG4gICNjdXJyZW50SWQgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyB0YWdOYW1lOiBzdHJpbmcsXG4gICAgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwsXG4gICAgYXR0cmlidXRlczogW3N0cmluZywgc3RyaW5nXVtdLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICApIHtcbiAgICBzdXBlcihcbiAgICAgIHRhZ05hbWUsXG4gICAgICBOb2RlVHlwZS5FTEVNRU5UX05PREUsXG4gICAgICBwYXJlbnROb2RlLFxuICAgICAga2V5LFxuICAgICk7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHIgb2YgYXR0cmlidXRlcykge1xuICAgICAgdGhpcy5hdHRyaWJ1dGVzW2F0dHJbMF1dID0gYXR0clsxXTtcblxuICAgICAgc3dpdGNoIChhdHRyWzBdKSB7XG4gICAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICAgIHRoaXMuI2NsYXNzTGlzdC5fdXBkYXRlKGF0dHJbMV0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaWRcIjpcbiAgICAgICAgICB0aGlzLiNjdXJyZW50SWQgPSBhdHRyWzFdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGFnTmFtZSA9IHRoaXMubm9kZU5hbWUgPSB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG4gIH1cblxuICBfc2hhbGxvd0Nsb25lKCk6IE5vZGUge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIHRoaXMuZ2V0QXR0cmlidXRlTmFtZXMoKSkge1xuICAgICAgYXR0cmlidXRlcy5wdXNoKFthdHRyaWJ1dGUsIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50KHRoaXMubm9kZU5hbWUsIG51bGwsIGF0dHJpYnV0ZXMsIENUT1JfS0VZKTtcbiAgfVxuXG4gIGdldCBjaGlsZEVsZW1lbnRDb3VudCgpOiBudW1iZXIge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgZm9yIChjb25zdCB7IG5vZGVUeXBlIH0gb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAobm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICBnZXQgY2xhc3NOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgPz8gXCJcIjtcbiAgfVxuXG4gIGdldCBjbGFzc0xpc3QoKTogRE9NVG9rZW5MaXN0IHtcbiAgICByZXR1cm4gdGhpcy4jY2xhc3NMaXN0O1xuICB9XG5cbiAgc2V0IGNsYXNzTmFtZShjbGFzc05hbWU6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3NOYW1lKTtcbiAgICB0aGlzLiNjbGFzc0xpc3QuX3VwZGF0ZShjbGFzc05hbWUpO1xuICB9XG5cbiAgZ2V0IG91dGVySFRNTCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRhZ05hbWUgPSB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzO1xuICAgIGxldCBvdXQgPSBcIjxcIiArIHRhZ05hbWU7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiB0aGlzLmdldEF0dHJpYnV0ZU5hbWVzKCkpIHtcbiAgICAgIG91dCArPSBgICR7IGF0dHJpYnV0ZS50b0xvd2VyQ2FzZSgpIH1gO1xuXG4gICAgICAvLyBlc2NhcGluZzogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvcGFyc2luZy5odG1sI2VzY2FwaW5nU3RyaW5nXG4gICAgICBpZiAoYXR0cmlidXRlc1thdHRyaWJ1dGVdICE9IG51bGwpIHtcbiAgICAgICAgb3V0ICs9IGA9XCIke1xuICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlXVxuICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHhBMC9nLCBcIiZuYnNwO1wiKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIilcbiAgICAgICAgfVwiYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciB2b2lkIGVsZW1lbnRzXG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICBjYXNlIFwiYXJlYVwiOlxuICAgICAgY2FzZSBcImJhc2VcIjpcbiAgICAgIGNhc2UgXCJiclwiOlxuICAgICAgY2FzZSBcImNvbFwiOlxuICAgICAgY2FzZSBcImVtYmVkXCI6XG4gICAgICBjYXNlIFwiaHJcIjpcbiAgICAgIGNhc2UgXCJpbWdcIjpcbiAgICAgIGNhc2UgXCJpbnB1dFwiOlxuICAgICAgY2FzZSBcImxpbmtcIjpcbiAgICAgIGNhc2UgXCJtZXRhXCI6XG4gICAgICBjYXNlIFwicGFyYW1cIjpcbiAgICAgIGNhc2UgXCJzb3VyY2VcIjpcbiAgICAgIGNhc2UgXCJ0cmFja1wiOlxuICAgICAgY2FzZSBcIndiclwiOlxuICAgICAgICBvdXQgKz0gXCI+XCI7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBvdXQgKz0gXCI+XCIgKyB0aGlzLmlubmVySFRNTCArIGA8LyR7IHRhZ05hbWUgfT5gO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgc2V0IG91dGVySFRNTChodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBUT0RPOiBTb21lZGF5Li4uXG4gIH1cblxuICBnZXQgaW5uZXJIVE1MKCk6IHN0cmluZyB7XG4gICAgbGV0IG91dCA9IFwiXCI7XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgc3dpdGNoIChjaGlsZC5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGVUeXBlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgICBvdXQgKz0gKGNoaWxkIGFzIEVsZW1lbnQpLm91dGVySFRNTDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE5vZGVUeXBlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgICBvdXQgKz0gYDwhLS0keyAoY2hpbGQgYXMgQ29tbWVudCkuZGF0YSB9LS0+YDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIE5vZGVUeXBlLlRFWFRfTk9ERTpcbiAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciByYXd0ZXh0LWxpa2UgZWxlbWVudHMuXG4gICAgICAgICAgc3dpdGNoICh0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgY2FzZSBcInN0eWxlXCI6XG4gICAgICAgICAgICBjYXNlIFwic2NyaXB0XCI6XG4gICAgICAgICAgICBjYXNlIFwieG1wXCI6XG4gICAgICAgICAgICBjYXNlIFwiaWZyYW1lXCI6XG4gICAgICAgICAgICBjYXNlIFwibm9lbWJlZFwiOlxuICAgICAgICAgICAgY2FzZSBcIm5vZnJhbWVzXCI6XG4gICAgICAgICAgICBjYXNlIFwicGxhaW50ZXh0XCI6XG4gICAgICAgICAgICAgIG91dCArPSAoY2hpbGQgYXMgVGV4dCkuZGF0YTtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIC8vIGVzY2FwaW5nOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9wYXJzaW5nLmh0bWwjZXNjYXBpbmdTdHJpbmdcbiAgICAgICAgICAgICAgb3V0ICs9IChjaGlsZCBhcyBUZXh0KS5kYXRhXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHhBMC9nLCBcIiZuYnNwO1wiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHNldCBpbm5lckhUTUwoaHRtbDogc3RyaW5nKSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBjaGlsZC5wYXJlbnROb2RlID0gY2hpbGQucGFyZW50RWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgbXV0YXRvci5zcGxpY2UoMCwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aCk7XG5cbiAgICBpZiAoaHRtbC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IGZyYWdtZW50Tm9kZXNGcm9tU3RyaW5nKGh0bWwpO1xuICAgICAgbXV0YXRvci5wdXNoKC4uLnBhcnNlZC5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMpO1xuXG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgICBjaGlsZC5fc2V0UGFyZW50KG51bGwpO1xuICAgICAgICBjaGlsZC5fc2V0T3duZXJEb2N1bWVudCh0aGlzLm93bmVyRG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBpbm5lclRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50ZXh0Q29udGVudDtcbiAgfVxuXG4gIHNldCBpbm5lclRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy50ZXh0Q29udGVudCA9IHRleHQ7XG4gIH1cblxuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jY3VycmVudElkIHx8IFwiXCI7XG4gIH1cblxuICBzZXQgaWQoaWQ6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKGlkLCB0aGlzLiNjdXJyZW50SWQgPSBpZCk7XG4gIH1cblxuICBnZXRBdHRyaWJ1dGVOYW1lcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuYXR0cmlidXRlcyk7XG4gIH1cblxuICBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlc1tuYW1lPy50b0xvd2VyQ2FzZSgpXSA/PyBudWxsO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlKHJhd05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGNvbnN0IG5hbWUgPSByYXdOYW1lPy50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHN0clZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXNbbmFtZV0gPSBzdHJWYWx1ZTtcblxuICAgIGlmIChuYW1lID09PSBcImlkXCIpIHtcbiAgICAgIHRoaXMuI2N1cnJlbnRJZCA9IHN0clZhbHVlO1xuICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICB0aGlzLiNjbGFzc0xpc3QuX3VwZGF0ZShzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQXR0cmlidXRlKHJhd05hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IG5hbWUgPSByYXdOYW1lPy50b0xvd2VyQ2FzZSgpO1xuICAgIGRlbGV0ZSB0aGlzLmF0dHJpYnV0ZXNbbmFtZV07XG4gICAgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xuICAgICAgdGhpcy4jY2xhc3NMaXN0Ll91cGRhdGUobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgaGFzQXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkobmFtZT8udG9Mb3dlckNhc2UoKSk7XG4gIH1cblxuICBoYXNBdHRyaWJ1dGVOUyhfbmFtZXNwYWNlOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIFRPRE86IFVzZSBuYW1lc3BhY2VcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KG5hbWU/LnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgZ2V0IGZpcnN0RWxlbWVudENoaWxkKCk6IEVsZW1lbnQgfCBudWxsIHtcblx0XHRmb3IgKGNvbnN0IG5vZGUgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG5cdFx0XHRpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcblx0XHRcdFx0cmV0dXJuIDxFbGVtZW50PiBub2RlOyBcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG4gIH1cblxuXHRnZXQgbGFzdEVsZW1lbnRDaGlsZCgpOiBFbGVtZW50IHwgbnVsbCB7XG5cdFx0Y29uc3QgeyBjaGlsZE5vZGVzIH0gPSB0aGlzO1xuXHRcdGZvciAobGV0IGkgPSBjaGlsZE5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRjb25zdCBub2RlID0gY2hpbGROb2Rlc1tpXTtcblx0XHRcdGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuXHRcdFx0XHRyZXR1cm4gPEVsZW1lbnQ+IG5vZGU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuICB9XG4gIFxuICBnZXQgbmV4dEVsZW1lbnRTaWJsaW5nKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG5cbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuaW5kZXhPZih0aGlzKTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gcGFyZW50LmNoaWxkTm9kZXM7XG4gICAgbGV0IG5leHQ6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IGkgPSBpbmRleCArIDE7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaWJsaW5nID0gY2hpbGROb2Rlc1tpXTtcblxuICAgICAgaWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBuZXh0ID0gPEVsZW1lbnQ+IHNpYmxpbmc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgZ2V0IHByZXZpb3VzRWxlbWVudFNpYmxpbmcoKTogRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcblxuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRleCA9IHBhcmVudC5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKS5pbmRleE9mKHRoaXMpO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBwYXJlbnQuY2hpbGROb2RlcztcbiAgICBsZXQgcHJldjogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHNpYmxpbmcgPSBjaGlsZE5vZGVzW2ldO1xuXG4gICAgICBpZiAoc2libGluZy5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHByZXYgPSA8RWxlbWVudD4gc2libGluZztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXY7XG4gIH1cblxuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yczogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICAgIGlmICghdGhpcy5vd25lckRvY3VtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtZW50IG11c3QgaGF2ZSBhbiBvd25lciBkb2N1bWVudFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuZmlyc3Qoc2VsZWN0b3JzLCB0aGlzKTtcbiAgfVxuXG4gIHF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzOiBzdHJpbmcpOiBOb2RlTGlzdCB7XG4gICAgaWYgKCF0aGlzLm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVsZW1lbnQgbXVzdCBoYXZlIGFuIG93bmVyIGRvY3VtZW50XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgY29uc3QgbXV0YXRvciA9IG5vZGVMaXN0W25vZGVMaXN0TXV0YXRvclN5bV0oKTtcbiAgICBtdXRhdG9yLnB1c2goLi4udGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuc2VsZWN0KHNlbGVjdG9ycywgdGhpcykpXG5cbiAgICByZXR1cm4gbm9kZUxpc3Q7XG4gIH1cblxuICBtYXRjaGVzKHNlbGVjdG9yU3RyaW5nOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkubWF0Y2goc2VsZWN0b3JTdHJpbmcsIHRoaXMpXG4gIH1cblxuICAvLyBUT0RPOiBEUlkhISFcbiAgZ2V0RWxlbWVudEJ5SWQoaWQ6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgaWYgKCg8RWxlbWVudD4gY2hpbGQpLmlkID09PSBpZCkge1xuICAgICAgICAgIHJldHVybiA8RWxlbWVudD4gY2hpbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWFyY2ggPSAoPEVsZW1lbnQ+IGNoaWxkKS5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmIChzZWFyY2gpIHtcbiAgICAgICAgICByZXR1cm4gc2VhcmNoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lOiBzdHJpbmcpOiBFbGVtZW50W10ge1xuICAgIHJldHVybiA8RWxlbWVudFtdPiB0aGlzLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLnRvVXBwZXJDYXNlKCksIFtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEVsZW1lbnRzQnlUYWdOYW1lV2lsZGNhcmQoc2VhcmNoOiBOb2RlW10pOiBOb2RlW10ge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBzZWFyY2gucHVzaChjaGlsZCk7XG4gICAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZVdpbGRjYXJkKHNlYXJjaCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlYXJjaDtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZywgc2VhcmNoOiBOb2RlW10pOiBOb2RlW10ge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkudGFnTmFtZSA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLCBzZWFyY2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2g7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKTogRWxlbWVudFtdIHtcbiAgICByZXR1cm4gPEVsZW1lbnRbXT4gdGhpcy5fZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShjbGFzc05hbWUsIFtdKTtcbiAgfVxuXG4gIGdldEVsZW1lbnRzQnlUYWdOYW1lTlMoX25hbWVzcGFjZTogc3RyaW5nLCBsb2NhbE5hbWU6IHN0cmluZyk6IEVsZW1lbnRbXSB7XG4gICAgLy8gVE9ETzogVXNlIG5hbWVzcGFjZVxuICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGxvY2FsTmFtZSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nLCBzZWFyY2g6IE5vZGVbXSk6IE5vZGVbXSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGlmICgoPEVsZW1lbnQ+IGNoaWxkKS5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSkge1xuICAgICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZSwgc2VhcmNoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VhcmNoO1xuICB9XG59XG5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsUUFBUSxRQUFRLENBQXdCO0FBQ2pELE1BQU0sR0FBRyx1QkFBdUIsUUFBUSxDQUFtQjtBQUMzRCxNQUFNLEdBQUcsSUFBSSxFQUFFLFFBQVEsUUFBdUIsQ0FBVztBQUN6RCxNQUFNLEdBQUcsUUFBUSxFQUFFLGtCQUFrQixRQUFRLENBQWdCO0FBRTdELE1BQU0sT0FBTyxZQUFZLFNBQVMsR0FBRztJQUNuQyxDQUFDLFFBQVE7Z0JBRUcsUUFBcUMsQ0FBRSxDQUFDO1FBQ2xELEtBQUs7UUFDTCxJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUTtJQUMzQixDQUFDO0lBRUQsR0FBRyxDQUFDLEtBQWEsRUFBUSxDQUFDO1FBQ3hCLEVBQUUsRUFBRSxLQUFLLEtBQUssQ0FBRSxtQkFBa0IsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQzlDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHVDQUF1QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUs7UUFDZixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztlQUFHLElBQUk7UUFBQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUc7UUFDakMsTUFBTSxDQUFDLElBQUk7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