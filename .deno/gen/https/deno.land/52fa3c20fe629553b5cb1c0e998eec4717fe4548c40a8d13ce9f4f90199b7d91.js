import { CTOR_KEY } from "../constructor-lock.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { HTMLCollection, HTMLCollectionMutatorSym } from "./html-collection.ts";
export class EventTarget {
    addEventListener() {
    // TODO
    }
    removeEventListener() {
    // TODO
    }
    dispatchEvent() {
    // TODO
    }
}
export var NodeType;
(function(NodeType) {
    NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
    NodeType[NodeType["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
    NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
    NodeType[NodeType["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
    NodeType[NodeType["ENTITY_REFERENCE_NODE"] = 5] = "ENTITY_REFERENCE_NODE";
    NodeType[NodeType["ENTITY_NODE"] = 6] = "ENTITY_NODE";
    NodeType[NodeType["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
    NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
    NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
    NodeType[NodeType["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
    NodeType[NodeType["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
    NodeType[NodeType["NOTATION_NODE"] = 12] = "NOTATION_NODE";
})(NodeType || (NodeType = {
}));
const nodesAndTextNodes = (nodes, parentNode)=>{
    return nodes.map((n)=>{
        let node = n;
        if (!(n instanceof Node)) {
            node = new Text("" + n);
        }
        node._setParent(parentNode, true);
        return node;
    });
};
export class Node extends EventTarget {
    nodeName;
    nodeType;
    nodeValue;
    childNodes;
    parentNode = null;
    parentElement;
    #childNodesMutator;
    #ownerDocument = null;
    _ancestors = new Set();
    // Instance constants defined after Node
    // class body below to avoid clutter
    static ELEMENT_NODE = NodeType.ELEMENT_NODE;
    static ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
    static TEXT_NODE = NodeType.TEXT_NODE;
    static CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
    static ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
    static ENTITY_NODE = NodeType.ENTITY_NODE;
    static PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
    static COMMENT_NODE = NodeType.COMMENT_NODE;
    static DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
    static DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
    static DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
    static NOTATION_NODE = NodeType.NOTATION_NODE;
    constructor(nodeName, nodeType, parentNode, key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor.");
        }
        super();
        this.nodeName = nodeName;
        this.nodeType = nodeType;
        this.nodeValue = null;
        this.childNodes = new NodeList();
        this.#childNodesMutator = this.childNodes[nodeListMutatorSym]();
        this.parentElement = parentNode;
        if (parentNode) {
            parentNode.appendChild(this);
        }
    }
    _getChildNodesMutator() {
        return this.#childNodesMutator;
    }
    _setParent(newParent, force = false) {
        const sameParent = this.parentNode === newParent;
        const shouldUpdateParentAndAncestors = !sameParent || force;
        if (shouldUpdateParentAndAncestors) {
            this.parentNode = newParent;
            if (newParent) {
                if (!sameParent) {
                    // If this a document node or another non-element node
                    // then parentElement should be set to null
                    if (newParent.nodeType === NodeType.ELEMENT_NODE) {
                        this.parentElement = newParent;
                    } else {
                        this.parentElement = null;
                    }
                    this._setOwnerDocument(newParent.#ownerDocument);
                }
                // Add parent chain to ancestors
                this._ancestors = new Set(newParent._ancestors);
                this._ancestors.add(newParent);
            } else {
                this.parentElement = null;
                this._ancestors.clear();
            }
            // Update ancestors for child nodes
            for (const child of this.childNodes){
                child._setParent(this, shouldUpdateParentAndAncestors);
            }
        }
    }
    _assertNotAncestor(child) {
        // Check this child isn't an ancestor
        if (child.contains(this)) {
            throw new DOMException("The new child is an ancestor of the parent");
        }
    }
    _setOwnerDocument(document) {
        if (this.#ownerDocument !== document) {
            this.#ownerDocument = document;
            for (const child of this.childNodes){
                child._setOwnerDocument(document);
            }
        }
    }
    contains(child) {
        return child._ancestors.has(this) || child === this;
    }
    get ownerDocument() {
        return this.#ownerDocument;
    }
    get textContent() {
        let out = "";
        for (const child of this.childNodes){
            switch(child.nodeType){
                case NodeType.TEXT_NODE:
                    out += child.nodeValue;
                    break;
                case NodeType.ELEMENT_NODE:
                    out += child.textContent;
                    break;
            }
        }
        return out;
    }
    set textContent(content) {
        for (const child of this.childNodes){
            child._setParent(null);
        }
        this._getChildNodesMutator().splice(0, this.childNodes.length);
        this.appendChild(new Text(content));
    }
    get firstChild() {
        return this.childNodes[0] || null;
    }
    get lastChild() {
        return this.childNodes[this.childNodes.length - 1] || null;
    }
    hasChildNodes() {
        return this.firstChild !== null;
    }
    cloneNode(deep = false) {
        const copy = this._shallowClone();
        copy._setOwnerDocument(this.ownerDocument);
        if (deep) {
            for (const child of this.childNodes){
                copy.appendChild(child.cloneNode(true));
            }
        }
        return copy;
    }
    _shallowClone() {
        throw new Error("Illegal invocation");
    }
    remove() {
        const parent = this.parentNode;
        if (parent) {
            const nodeList = parent._getChildNodesMutator();
            const idx = nodeList.indexOf(this);
            nodeList.splice(idx, 1);
            this._setParent(null);
        }
    }
    appendChild(child) {
        return child._appendTo(this);
    }
    _appendTo(parentNode) {
        parentNode._assertNotAncestor(this); // FIXME: Should this really be a method?
        const oldParentNode = this.parentNode;
        // Check if we already own this child
        if (oldParentNode === parentNode) {
            if (parentNode._getChildNodesMutator().indexOf(this) !== -1) {
                return this;
            }
        } else if (oldParentNode) {
            this.remove();
        }
        this._setParent(parentNode, true);
        parentNode._getChildNodesMutator().push(this);
        return this;
    }
    removeChild(child) {
        // Just copy Firefox's error messages
        if (child && typeof child === "object") {
            if (child.parentNode === this) {
                return child.remove();
            } else {
                throw new DOMException("Node.removeChild: The node to be removed is not a child of this node");
            }
        } else {
            throw new TypeError("Node.removeChild: Argument 1 is not an object.");
        }
    }
    replaceChild(newChild, oldChild) {
        if (oldChild.parentNode !== this) {
            throw new Error("Old child's parent is not the current node.");
        }
        oldChild.replaceWith(newChild);
        return oldChild;
    }
    insertBeforeAfter(nodes, side) {
        const parentNode = this.parentNode;
        const mutator = parentNode._getChildNodesMutator();
        const index = mutator.indexOf(this);
        nodes = nodesAndTextNodes(nodes, parentNode);
        mutator.splice(index + side, 0, ...nodes);
    }
    before(...nodes) {
        if (this.parentNode) {
            this.insertBeforeAfter(nodes, 0);
        }
    }
    after(...nodes) {
        if (this.parentNode) {
            this.insertBeforeAfter(nodes, 1);
        }
    }
    insertBefore(newNode, refNode) {
        this._assertNotAncestor(newNode);
        const mutator = this._getChildNodesMutator();
        if (refNode === null) {
            this.appendChild(newNode);
            return newNode;
        }
        const index = mutator.indexOf(refNode);
        if (index === -1) {
            throw new Error("DOMException: Child to insert before is not a child of this node");
        }
        const oldParentNode = newNode.parentNode;
        newNode._setParent(this, oldParentNode !== this);
        mutator.splice(index, 0, newNode);
        return newNode;
    }
    replaceWith(...nodes) {
        if (this.parentNode) {
            const parentNode = this.parentNode;
            const mutator = parentNode._getChildNodesMutator();
            const index = mutator.indexOf(this);
            nodes = nodesAndTextNodes(nodes, parentNode);
            mutator.splice(index, 1, ...nodes);
            this._setParent(null);
        }
    }
    get children() {
        const collection = new HTMLCollection();
        const mutator = collection[HTMLCollectionMutatorSym]();
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                mutator.push(child);
            }
        }
        return collection;
    }
    get nextSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const index = parent._getChildNodesMutator().indexOf(this);
        const next = parent.childNodes[index + 1] || null;
        return next;
    }
    get previousSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const index = parent._getChildNodesMutator().indexOf(this);
        const prev = parent.childNodes[index - 1] || null;
        return prev;
    }
    // Node.compareDocumentPosition()'s bitmask values
    static DOCUMENT_POSITION_DISCONNECTED = 1;
    static DOCUMENT_POSITION_PRECEDING = 2;
    static DOCUMENT_POSITION_FOLLOWING = 4;
    static DOCUMENT_POSITION_CONTAINS = 8;
    static DOCUMENT_POSITION_CONTAINED_BY = 16;
    static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
    /**
   * FIXME: Does not implement attribute node checks
   * ref: https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
   */ compareDocumentPosition(other) {
        if (other === this) {
            return 0;
        }
        // Note: major browser implementations differ in their rejection error of
        // non-Node or nullish values so we just copy the most relevant error message
        // from Firefox
        if (!(other instanceof Node)) {
            throw new TypeError("Node.compareDocumentPosition: Argument 1 does not implement interface Node.");
        }
        let node1Root = other;
        let node2Root = this;
        const node1Hierarchy = [
            node1Root
        ];
        const node2Hierarchy = [
            node2Root
        ];
        while(node1Root.parentNode ?? node2Root.parentNode){
            node1Root = node1Root.parentNode ? (node1Hierarchy.push(node1Root.parentNode), node1Root.parentNode) : node1Root;
            node2Root = node2Root.parentNode ? (node2Hierarchy.push(node2Root.parentNode), node2Root.parentNode) : node2Root;
        }
        // Check if they don't share the same root node
        if (node1Root !== node2Root) {
            return Node.DOCUMENT_POSITION_DISCONNECTED | Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC | Node.DOCUMENT_POSITION_PRECEDING;
        }
        const longerHierarchy = node1Hierarchy.length > node2Hierarchy.length ? node1Hierarchy : node2Hierarchy;
        const shorterHierarchy = longerHierarchy === node1Hierarchy ? node2Hierarchy : node1Hierarchy;
        // Check if either is a container of the other
        if (longerHierarchy[longerHierarchy.length - shorterHierarchy.length] === shorterHierarchy[0]) {
            return longerHierarchy === node1Hierarchy ? Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;
        }
        // Find their first common ancestor and see whether they
        // are preceding or following
        const longerStart = longerHierarchy.length - shorterHierarchy.length;
        for(let i = shorterHierarchy.length - 1; i >= 0; i--){
            const shorterHierarchyNode = shorterHierarchy[i];
            const longerHierarchyNode = longerHierarchy[longerStart + i];
            // We found the first common ancestor
            if (longerHierarchyNode !== shorterHierarchyNode) {
                const siblings = shorterHierarchyNode.parentNode._getChildNodesMutator();
                if (siblings.indexOf(shorterHierarchyNode) < siblings.indexOf(longerHierarchyNode)) {
                    // Shorter is before longer
                    if (shorterHierarchy === node1Hierarchy) {
                        // Other is before this
                        return Node.DOCUMENT_POSITION_PRECEDING;
                    } else {
                        // This is before other
                        return Node.DOCUMENT_POSITION_FOLLOWING;
                    }
                } else {
                    // Longer is before shorter
                    if (longerHierarchy === node1Hierarchy) {
                        // Other is before this
                        return Node.DOCUMENT_POSITION_PRECEDING;
                    } else {
                        // Other is after this
                        return Node.DOCUMENT_POSITION_FOLLOWING;
                    }
                }
            }
        }
        // FIXME: Should probably throw here because this
        // point should be unreachable code as per the
        // intended logic
        return Node.DOCUMENT_POSITION_FOLLOWING;
    }
}
Node.prototype.ELEMENT_NODE = NodeType.ELEMENT_NODE;
Node.prototype.ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
Node.prototype.TEXT_NODE = NodeType.TEXT_NODE;
Node.prototype.CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
Node.prototype.ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
Node.prototype.ENTITY_NODE = NodeType.ENTITY_NODE;
Node.prototype.PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
Node.prototype.COMMENT_NODE = NodeType.COMMENT_NODE;
Node.prototype.DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
Node.prototype.DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
Node.prototype.DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
Node.prototype.NOTATION_NODE = NodeType.NOTATION_NODE;
export class CharacterData extends Node {
    data;
    constructor(data, nodeName, nodeType, parentNode, key){
        super(nodeName, nodeType, parentNode, key);
        this.data = data;
        this.nodeValue = data;
    }
    get length() {
        return this.data.length;
    }
}
export class Text extends CharacterData {
    constructor(text = ""){
        super(text, "#text", NodeType.TEXT_NODE, null, CTOR_KEY);
        this.nodeValue = text;
    }
    _shallowClone() {
        return new Text(this.textContent);
    }
    get textContent() {
        return this.nodeValue;
    }
}
export class Comment extends CharacterData {
    constructor(text = ""){
        super(text, "#comment", NodeType.COMMENT_NODE, null, CTOR_KEY);
        this.nodeValue = text;
    }
    _shallowClone() {
        return new Comment(this.textContent);
    }
    get textContent() {
        return this.nodeValue;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS4xNy1hbHBoYS9zcmMvZG9tL25vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgTm9kZUxpc3QsIE5vZGVMaXN0TXV0YXRvciwgbm9kZUxpc3RNdXRhdG9yU3ltIH0gZnJvbSBcIi4vbm9kZS1saXN0LnRzXCI7XG5pbXBvcnQgeyBIVE1MQ29sbGVjdGlvbiwgSFRNTENvbGxlY3Rpb25NdXRhdG9yLCBIVE1MQ29sbGVjdGlvbk11dGF0b3JTeW0gfSBmcm9tIFwiLi9odG1sLWNvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgRWxlbWVudCB9IGZyb20gXCIuL2VsZW1lbnQudHNcIjtcbmltcG9ydCB0eXBlIHsgRG9jdW1lbnQgfSBmcm9tIFwiLi9kb2N1bWVudC50c1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRUYXJnZXQge1xuICBhZGRFdmVudExpc3RlbmVyKCkge1xuICAgIC8vIFRPRE9cbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIoKSB7XG4gICAgLy8gVE9ET1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudCgpIHtcbiAgICAvLyBUT0RPXG4gIH1cbn1cblxuZXhwb3J0IGVudW0gTm9kZVR5cGUge1xuICBFTEVNRU5UX05PREUgPSAxLFxuICBBVFRSSUJVVEVfTk9ERSA9IDIsXG4gIFRFWFRfTk9ERSA9IDMsXG4gIENEQVRBX1NFQ1RJT05fTk9ERSA9IDQsXG4gIEVOVElUWV9SRUZFUkVOQ0VfTk9ERSA9IDUsXG4gIEVOVElUWV9OT0RFID0gNixcbiAgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFID0gNyxcbiAgQ09NTUVOVF9OT0RFID0gOCxcbiAgRE9DVU1FTlRfTk9ERSA9IDksXG4gIERPQ1VNRU5UX1RZUEVfTk9ERSA9IDEwLFxuICBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gMTEsXG4gIE5PVEFUSU9OX05PREUgPSAxMixcbn1cblxuY29uc3Qgbm9kZXNBbmRUZXh0Tm9kZXMgPSAobm9kZXM6IChOb2RlIHwgYW55KVtdLCBwYXJlbnROb2RlOiBOb2RlKSA9PiB7XG4gIHJldHVybiBub2Rlcy5tYXAobiA9PiB7XG4gICAgbGV0IG5vZGUgPSBuO1xuXG4gICAgaWYgKCEobiBpbnN0YW5jZW9mIE5vZGUpKSB7XG4gICAgICBub2RlID0gbmV3IFRleHQoXCJcIiArIG4pO1xuICAgIH1cblxuICAgIG5vZGUuX3NldFBhcmVudChwYXJlbnROb2RlLCB0cnVlKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgRXZlbnRUYXJnZXQge1xuICBwdWJsaWMgbm9kZVZhbHVlOiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaWMgY2hpbGROb2RlczogTm9kZUxpc3Q7XG4gIHB1YmxpYyBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBwYXJlbnRFbGVtZW50OiBFbGVtZW50IHwgbnVsbDtcbiAgI2NoaWxkTm9kZXNNdXRhdG9yOiBOb2RlTGlzdE11dGF0b3I7XG4gICNvd25lckRvY3VtZW50OiBEb2N1bWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hbmNlc3RvcnMgPSBuZXcgU2V0PE5vZGU+KCk7XG5cbiAgLy8gSW5zdGFuY2UgY29uc3RhbnRzIGRlZmluZWQgYWZ0ZXIgTm9kZVxuICAvLyBjbGFzcyBib2R5IGJlbG93IHRvIGF2b2lkIGNsdXR0ZXJcbiAgc3RhdGljIEVMRU1FTlRfTk9ERSA9IE5vZGVUeXBlLkVMRU1FTlRfTk9ERTtcbiAgc3RhdGljIEFUVFJJQlVURV9OT0RFID0gTm9kZVR5cGUuQVRUUklCVVRFX05PREU7XG4gIHN0YXRpYyBURVhUX05PREUgPSBOb2RlVHlwZS5URVhUX05PREU7XG4gIHN0YXRpYyBDREFUQV9TRUNUSU9OX05PREUgPSBOb2RlVHlwZS5DREFUQV9TRUNUSU9OX05PREU7XG4gIHN0YXRpYyBFTlRJVFlfUkVGRVJFTkNFX05PREUgPSBOb2RlVHlwZS5FTlRJVFlfUkVGRVJFTkNFX05PREU7XG4gIHN0YXRpYyBFTlRJVFlfTk9ERSA9IE5vZGVUeXBlLkVOVElUWV9OT0RFO1xuICBzdGF0aWMgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFID0gTm9kZVR5cGUuUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFO1xuICBzdGF0aWMgQ09NTUVOVF9OT0RFID0gTm9kZVR5cGUuQ09NTUVOVF9OT0RFO1xuICBzdGF0aWMgRE9DVU1FTlRfTk9ERSA9IE5vZGVUeXBlLkRPQ1VNRU5UX05PREU7XG4gIHN0YXRpYyBET0NVTUVOVF9UWVBFX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9UWVBFX05PREU7XG4gIHN0YXRpYyBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gTm9kZVR5cGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERTtcbiAgc3RhdGljIE5PVEFUSU9OX05PREUgPSBOb2RlVHlwZS5OT1RBVElPTl9OT0RFO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBub2RlTmFtZTogc3RyaW5nLFxuICAgIHB1YmxpYyBub2RlVHlwZTogTm9kZVR5cGUsXG4gICAgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIGlmIChrZXkgIT09IENUT1JfS0VZKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3Rvci5cIik7XG4gICAgfVxuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLm5vZGVWYWx1ZSA9IG51bGw7XG4gICAgdGhpcy5jaGlsZE5vZGVzID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgdGhpcy4jY2hpbGROb2Rlc011dGF0b3IgPSB0aGlzLmNoaWxkTm9kZXNbbm9kZUxpc3RNdXRhdG9yU3ltXSgpO1xuICAgIHRoaXMucGFyZW50RWxlbWVudCA9IDxFbGVtZW50PiBwYXJlbnROb2RlO1xuXG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgIHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX2dldENoaWxkTm9kZXNNdXRhdG9yKCk6IE5vZGVMaXN0TXV0YXRvciB7XG4gICAgcmV0dXJuIHRoaXMuI2NoaWxkTm9kZXNNdXRhdG9yO1xuICB9XG5cbiAgX3NldFBhcmVudChuZXdQYXJlbnQ6IE5vZGUgfCBudWxsLCBmb3JjZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc2FtZVBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSA9PT0gbmV3UGFyZW50O1xuICAgIGNvbnN0IHNob3VsZFVwZGF0ZVBhcmVudEFuZEFuY2VzdG9ycyA9ICFzYW1lUGFyZW50IHx8IGZvcmNlO1xuXG4gICAgaWYgKHNob3VsZFVwZGF0ZVBhcmVudEFuZEFuY2VzdG9ycykge1xuICAgICAgdGhpcy5wYXJlbnROb2RlID0gbmV3UGFyZW50O1xuXG4gICAgICBpZiAobmV3UGFyZW50KSB7XG4gICAgICAgIGlmICghc2FtZVBhcmVudCkge1xuICAgICAgICAgIC8vIElmIHRoaXMgYSBkb2N1bWVudCBub2RlIG9yIGFub3RoZXIgbm9uLWVsZW1lbnQgbm9kZVxuICAgICAgICAgIC8vIHRoZW4gcGFyZW50RWxlbWVudCBzaG91bGQgYmUgc2V0IHRvIG51bGxcbiAgICAgICAgICBpZiAobmV3UGFyZW50Lm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50RWxlbWVudCA9IG5ld1BhcmVudCBhcyB1bmtub3duIGFzIEVsZW1lbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50RWxlbWVudCA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fc2V0T3duZXJEb2N1bWVudChuZXdQYXJlbnQuI293bmVyRG9jdW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHBhcmVudCBjaGFpbiB0byBhbmNlc3RvcnNcbiAgICAgICAgdGhpcy5fYW5jZXN0b3JzID0gbmV3IFNldChuZXdQYXJlbnQuX2FuY2VzdG9ycyk7XG4gICAgICAgIHRoaXMuX2FuY2VzdG9ycy5hZGQobmV3UGFyZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGFyZW50RWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2FuY2VzdG9ycy5jbGVhcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgYW5jZXN0b3JzIGZvciBjaGlsZCBub2Rlc1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgICAgY2hpbGQuX3NldFBhcmVudCh0aGlzLCBzaG91bGRVcGRhdGVQYXJlbnRBbmRBbmNlc3RvcnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9hc3NlcnROb3RBbmNlc3RvcihjaGlsZDogTm9kZSkge1xuICAgIC8vIENoZWNrIHRoaXMgY2hpbGQgaXNuJ3QgYW4gYW5jZXN0b3JcbiAgICBpZiAoY2hpbGQuY29udGFpbnModGhpcykpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJUaGUgbmV3IGNoaWxkIGlzIGFuIGFuY2VzdG9yIG9mIHRoZSBwYXJlbnRcIik7XG4gICAgfVxuICB9XG5cbiAgX3NldE93bmVyRG9jdW1lbnQoZG9jdW1lbnQ6IERvY3VtZW50IHwgbnVsbCkge1xuICAgIGlmICh0aGlzLiNvd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgdGhpcy4jb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgICBjaGlsZC5fc2V0T3duZXJEb2N1bWVudChkb2N1bWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29udGFpbnMoY2hpbGQ6IE5vZGUpIHtcbiAgICByZXR1cm4gY2hpbGQuX2FuY2VzdG9ycy5oYXModGhpcykgfHwgY2hpbGQgPT09IHRoaXM7XG4gIH1cblxuICBnZXQgb3duZXJEb2N1bWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3duZXJEb2N1bWVudDtcbiAgfVxuXG4gIGdldCB0ZXh0Q29udGVudCgpOiBzdHJpbmcge1xuICAgIGxldCBvdXQgPSBcIlwiO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIHN3aXRjaCAoY2hpbGQubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSBOb2RlVHlwZS5URVhUX05PREU6XG4gICAgICAgICAgb3V0ICs9IGNoaWxkLm5vZGVWYWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlVHlwZS5FTEVNRU5UX05PREU6XG4gICAgICAgICAgb3V0ICs9IGNoaWxkLnRleHRDb250ZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBzZXQgdGV4dENvbnRlbnQoY29udGVudDogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGNoaWxkLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKS5zcGxpY2UoMCwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aCk7XG4gICAgdGhpcy5hcHBlbmRDaGlsZChuZXcgVGV4dChjb250ZW50KSk7XG4gIH1cblxuICBnZXQgZmlyc3RDaGlsZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzWzBdIHx8IG51bGw7XG4gIH1cblxuICBnZXQgbGFzdENoaWxkKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXNbdGhpcy5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdIHx8IG51bGw7XG4gIH1cblxuICBoYXNDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzLmZpcnN0Q2hpbGQgIT09IG51bGw7XG4gIH1cblxuICBjbG9uZU5vZGUoZGVlcDogYm9vbGVhbiA9IGZhbHNlKTogdGhpcyB7XG4gICAgY29uc3QgY29weSA9IHRoaXMuX3NoYWxsb3dDbG9uZSgpO1xuXG4gICAgY29weS5fc2V0T3duZXJEb2N1bWVudCh0aGlzLm93bmVyRG9jdW1lbnQpO1xuXG4gICAgaWYgKGRlZXApIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICAgIGNvcHkuYXBwZW5kQ2hpbGQoY2hpbGQuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29weSBhcyB0aGlzO1xuICB9XG5cbiAgX3NoYWxsb3dDbG9uZSgpOiBOb2RlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGludm9jYXRpb25cIik7XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgY29uc3Qgbm9kZUxpc3QgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgICBjb25zdCBpZHggPSBub2RlTGlzdC5pbmRleE9mKHRoaXMpO1xuICAgICAgbm9kZUxpc3Quc3BsaWNlKGlkeCwgMSk7XG4gICAgICB0aGlzLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgYXBwZW5kQ2hpbGQoY2hpbGQ6IE5vZGUpOiBOb2RlIHtcbiAgICByZXR1cm4gY2hpbGQuX2FwcGVuZFRvKHRoaXMpO1xuICB9XG5cbiAgX2FwcGVuZFRvKHBhcmVudE5vZGU6IE5vZGUpIHtcbiAgICBwYXJlbnROb2RlLl9hc3NlcnROb3RBbmNlc3Rvcih0aGlzKTsgLy8gRklYTUU6IFNob3VsZCB0aGlzIHJlYWxseSBiZSBhIG1ldGhvZD9cbiAgICBjb25zdCBvbGRQYXJlbnROb2RlID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UgYWxyZWFkeSBvd24gdGhpcyBjaGlsZFxuICAgIGlmIChvbGRQYXJlbnROb2RlID09PSBwYXJlbnROb2RlKSB7XG4gICAgICBpZiAocGFyZW50Tm9kZS5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKS5pbmRleE9mKHRoaXMpICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9sZFBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0UGFyZW50KHBhcmVudE5vZGUsIHRydWUpO1xuICAgIHBhcmVudE5vZGUuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkucHVzaCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IE5vZGUpIHtcbiAgICAvLyBKdXN0IGNvcHkgRmlyZWZveCdzIGVycm9yIG1lc3NhZ2VzXG4gICAgaWYgKGNoaWxkICYmIHR5cGVvZiBjaGlsZCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKGNoaWxkLnBhcmVudE5vZGUgPT09IHRoaXMpIHtcbiAgICAgICAgcmV0dXJuIGNoaWxkLnJlbW92ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIk5vZGUucmVtb3ZlQ2hpbGQ6IFRoZSBub2RlIHRvIGJlIHJlbW92ZWQgaXMgbm90IGEgY2hpbGQgb2YgdGhpcyBub2RlXCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTm9kZS5yZW1vdmVDaGlsZDogQXJndW1lbnQgMSBpcyBub3QgYW4gb2JqZWN0LlwiKTtcbiAgICB9XG4gIH1cblxuICByZXBsYWNlQ2hpbGQobmV3Q2hpbGQ6IE5vZGUsIG9sZENoaWxkOiBOb2RlKTogTm9kZSB7XG4gICAgaWYgKG9sZENoaWxkLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9sZCBjaGlsZCdzIHBhcmVudCBpcyBub3QgdGhlIGN1cnJlbnQgbm9kZS5cIik7XG4gICAgfVxuXG4gICAgb2xkQ2hpbGQucmVwbGFjZVdpdGgobmV3Q2hpbGQpO1xuICAgIHJldHVybiBvbGRDaGlsZDtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0QmVmb3JlQWZ0ZXIobm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdLCBzaWRlOiBudW1iZXIpIHtcbiAgICBjb25zdCBwYXJlbnROb2RlID0gdGhpcy5wYXJlbnROb2RlITtcbiAgICBjb25zdCBtdXRhdG9yID0gcGFyZW50Tm9kZS5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcbiAgICBjb25zdCBpbmRleCA9IG11dGF0b3IuaW5kZXhPZih0aGlzKTtcbiAgICBub2RlcyA9IG5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCBwYXJlbnROb2RlKTtcblxuICAgIG11dGF0b3Iuc3BsaWNlKGluZGV4ICsgc2lkZSwgMCwgLi4uKDxOb2RlW10+IG5vZGVzKSk7XG4gIH1cblxuICBiZWZvcmUoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5pbnNlcnRCZWZvcmVBZnRlcihub2RlcywgMCk7XG4gICAgfVxuICB9XG5cbiAgYWZ0ZXIoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5pbnNlcnRCZWZvcmVBZnRlcihub2RlcywgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKG5ld05vZGU6IE5vZGUsIHJlZk5vZGU6IE5vZGUgfCBudWxsKTogTm9kZSB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90QW5jZXN0b3IobmV3Tm9kZSk7XG4gICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG5cbiAgICBpZiAocmVmTm9kZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5hcHBlbmRDaGlsZChuZXdOb2RlKTtcbiAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gbXV0YXRvci5pbmRleE9mKHJlZk5vZGUpO1xuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTUV4Y2VwdGlvbjogQ2hpbGQgdG8gaW5zZXJ0IGJlZm9yZSBpcyBub3QgYSBjaGlsZCBvZiB0aGlzIG5vZGVcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgb2xkUGFyZW50Tm9kZSA9IG5ld05vZGUucGFyZW50Tm9kZTtcbiAgICBuZXdOb2RlLl9zZXRQYXJlbnQodGhpcywgb2xkUGFyZW50Tm9kZSAhPT0gdGhpcyk7XG4gICAgbXV0YXRvci5zcGxpY2UoaW5kZXgsIDAsIG5ld05vZGUpO1xuXG4gICAgcmV0dXJuIG5ld05vZGU7XG4gIH1cblxuICByZXBsYWNlV2l0aCguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgY29uc3QgbXV0YXRvciA9IHBhcmVudE5vZGUuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgICBjb25zdCBpbmRleCA9IG11dGF0b3IuaW5kZXhPZih0aGlzKTtcbiAgICAgIG5vZGVzID0gbm9kZXNBbmRUZXh0Tm9kZXMobm9kZXMsIHBhcmVudE5vZGUpO1xuXG4gICAgICBtdXRhdG9yLnNwbGljZShpbmRleCwgMSwgLi4uKDxOb2RlW10+IG5vZGVzKSk7XG4gICAgICB0aGlzLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IEhUTUxDb2xsZWN0aW9uIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IEhUTUxDb2xsZWN0aW9uKCk7XG4gICAgY29uc3QgbXV0YXRvciA9IGNvbGxlY3Rpb25bSFRNTENvbGxlY3Rpb25NdXRhdG9yU3ltXSgpO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIG11dGF0b3IucHVzaCg8RWxlbWVudD4gY2hpbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgZ2V0IG5leHRTaWJsaW5nKCk6IE5vZGUgfCBudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XG5cbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuaW5kZXhPZih0aGlzKTtcbiAgICBjb25zdCBuZXh0OiBOb2RlIHwgbnVsbCA9IHBhcmVudC5jaGlsZE5vZGVzW2luZGV4ICsgMV0gfHwgbnVsbDtcblxuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgZ2V0IHByZXZpb3VzU2libGluZygpOiBOb2RlIHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gcGFyZW50Ll9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmluZGV4T2YodGhpcyk7XG4gICAgY29uc3QgcHJldjogTm9kZSB8IG51bGwgPSBwYXJlbnQuY2hpbGROb2Rlc1tpbmRleCAtIDFdIHx8IG51bGw7XG5cbiAgICByZXR1cm4gcHJldjtcbiAgfVxuXG4gIC8vIE5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24oKSdzIGJpdG1hc2sgdmFsdWVzXG4gIHB1YmxpYyBzdGF0aWMgRE9DVU1FTlRfUE9TSVRJT05fRElTQ09OTkVDVEVEID0gMSBhcyBjb25zdDtcbiAgcHVibGljIHN0YXRpYyBET0NVTUVOVF9QT1NJVElPTl9QUkVDRURJTkcgPSAyIGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0ZPTExPV0lORyA9IDQgYXMgY29uc3Q7XG4gIHB1YmxpYyBzdGF0aWMgRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTlMgPSA4IGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0NPTlRBSU5FRF9CWSA9IDE2IGFzIGNvbnN0O1xuICBwdWJsaWMgc3RhdGljIERPQ1VNRU5UX1BPU0lUSU9OX0lNUExFTUVOVEFUSU9OX1NQRUNJRklDID0gMzIgYXMgY29uc3Q7XG5cbiAgLyoqXG4gICAqIEZJWE1FOiBEb2VzIG5vdCBpbXBsZW1lbnQgYXR0cmlidXRlIG5vZGUgY2hlY2tzXG4gICAqIHJlZjogaHR0cHM6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNkb20tbm9kZS1jb21wYXJlZG9jdW1lbnRwb3NpdGlvblxuICAgKiBNRE46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2NvbXBhcmVEb2N1bWVudFBvc2l0aW9uXG4gICAqL1xuICBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbihvdGhlcjogTm9kZSkge1xuICAgIGlmIChvdGhlciA9PT0gdGhpcykge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgLy8gTm90ZTogbWFqb3IgYnJvd3NlciBpbXBsZW1lbnRhdGlvbnMgZGlmZmVyIGluIHRoZWlyIHJlamVjdGlvbiBlcnJvciBvZlxuICAgIC8vIG5vbi1Ob2RlIG9yIG51bGxpc2ggdmFsdWVzIHNvIHdlIGp1c3QgY29weSB0aGUgbW9zdCByZWxldmFudCBlcnJvciBtZXNzYWdlXG4gICAgLy8gZnJvbSBGaXJlZm94XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBOb2RlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb246IEFyZ3VtZW50IDEgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBOb2RlLlwiKTtcbiAgICB9XG5cbiAgICBsZXQgbm9kZTFSb290ID0gb3RoZXI7XG4gICAgbGV0IG5vZGUyUm9vdCA9IHRoaXMgYXMgTm9kZTtcbiAgICBjb25zdCBub2RlMUhpZXJhcmNoeSA9IFtub2RlMVJvb3RdO1xuICAgIGNvbnN0IG5vZGUySGllcmFyY2h5ID0gW25vZGUyUm9vdF07XG4gICAgd2hpbGUgKG5vZGUxUm9vdC5wYXJlbnROb2RlID8/IG5vZGUyUm9vdC5wYXJlbnROb2RlKSB7XG4gICAgICBub2RlMVJvb3QgPSBub2RlMVJvb3QucGFyZW50Tm9kZSA/IChub2RlMUhpZXJhcmNoeS5wdXNoKG5vZGUxUm9vdC5wYXJlbnROb2RlKSwgbm9kZTFSb290LnBhcmVudE5vZGUpIDogbm9kZTFSb290O1xuICAgICAgbm9kZTJSb290ID0gbm9kZTJSb290LnBhcmVudE5vZGUgPyAobm9kZTJIaWVyYXJjaHkucHVzaChub2RlMlJvb3QucGFyZW50Tm9kZSksIG5vZGUyUm9vdC5wYXJlbnROb2RlKSA6IG5vZGUyUm9vdDtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB0aGV5IGRvbid0IHNoYXJlIHRoZSBzYW1lIHJvb3Qgbm9kZVxuICAgIGlmIChub2RlMVJvb3QgIT09IG5vZGUyUm9vdCkge1xuICAgICAgcmV0dXJuIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRElTQ09OTkVDVEVEXG4gICAgICAgIHwgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9JTVBMRU1FTlRBVElPTl9TUEVDSUZJQ1xuICAgICAgICB8IE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgIH1cblxuICAgIGNvbnN0IGxvbmdlckhpZXJhcmNoeSA9IG5vZGUxSGllcmFyY2h5Lmxlbmd0aCA+IG5vZGUySGllcmFyY2h5Lmxlbmd0aFxuICAgICAgPyBub2RlMUhpZXJhcmNoeVxuICAgICAgOiBub2RlMkhpZXJhcmNoeTtcbiAgICBjb25zdCBzaG9ydGVySGllcmFyY2h5ID0gbG9uZ2VySGllcmFyY2h5ID09PSBub2RlMUhpZXJhcmNoeVxuICAgICAgPyBub2RlMkhpZXJhcmNoeVxuICAgICAgOiBub2RlMUhpZXJhcmNoeTtcblxuICAgIC8vIENoZWNrIGlmIGVpdGhlciBpcyBhIGNvbnRhaW5lciBvZiB0aGUgb3RoZXJcbiAgICBpZiAobG9uZ2VySGllcmFyY2h5W2xvbmdlckhpZXJhcmNoeS5sZW5ndGggLSBzaG9ydGVySGllcmFyY2h5Lmxlbmd0aF0gPT09IHNob3J0ZXJIaWVyYXJjaHlbMF0pIHtcbiAgICAgIHJldHVybiBsb25nZXJIaWVyYXJjaHkgPT09IG5vZGUxSGllcmFyY2h5XG4gICAgICAgIC8vIG90aGVyIGlzIGEgY2hpbGQgb2YgdGhpc1xuICAgICAgICA/IE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZIHwgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkdcbiAgICAgICAgLy8gdGhpcyBpcyBhIGNoaWxkIG9mIG90aGVyXG4gICAgICAgIDogTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9DT05UQUlOUyB8IE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlaXIgZmlyc3QgY29tbW9uIGFuY2VzdG9yIGFuZCBzZWUgd2hldGhlciB0aGV5XG4gICAgLy8gYXJlIHByZWNlZGluZyBvciBmb2xsb3dpbmdcbiAgICBjb25zdCBsb25nZXJTdGFydCA9IGxvbmdlckhpZXJhcmNoeS5sZW5ndGggLSBzaG9ydGVySGllcmFyY2h5Lmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gc2hvcnRlckhpZXJhcmNoeS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc2hvcnRlckhpZXJhcmNoeU5vZGUgPSBzaG9ydGVySGllcmFyY2h5W2ldO1xuICAgICAgY29uc3QgbG9uZ2VySGllcmFyY2h5Tm9kZSA9IGxvbmdlckhpZXJhcmNoeVtsb25nZXJTdGFydCArIGldO1xuXG4gICAgICAvLyBXZSBmb3VuZCB0aGUgZmlyc3QgY29tbW9uIGFuY2VzdG9yXG4gICAgICBpZiAobG9uZ2VySGllcmFyY2h5Tm9kZSAhPT0gc2hvcnRlckhpZXJhcmNoeU5vZGUpIHtcbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBzaG9ydGVySGllcmFyY2h5Tm9kZS5wYXJlbnROb2RlIS5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcblxuICAgICAgICBpZiAoc2libGluZ3MuaW5kZXhPZihzaG9ydGVySGllcmFyY2h5Tm9kZSkgPCBzaWJsaW5ncy5pbmRleE9mKGxvbmdlckhpZXJhcmNoeU5vZGUpKSB7XG4gICAgICAgICAgLy8gU2hvcnRlciBpcyBiZWZvcmUgbG9uZ2VyXG4gICAgICAgICAgaWYgKHNob3J0ZXJIaWVyYXJjaHkgPT09IG5vZGUxSGllcmFyY2h5KSB7XG4gICAgICAgICAgICAvLyBPdGhlciBpcyBiZWZvcmUgdGhpc1xuICAgICAgICAgICAgcmV0dXJuIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGJlZm9yZSBvdGhlclxuICAgICAgICAgICAgcmV0dXJuIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBMb25nZXIgaXMgYmVmb3JlIHNob3J0ZXJcbiAgICAgICAgICBpZiAobG9uZ2VySGllcmFyY2h5ID09PSBub2RlMUhpZXJhcmNoeSkge1xuICAgICAgICAgICAgLy8gT3RoZXIgaXMgYmVmb3JlIHRoaXNcbiAgICAgICAgICAgIHJldHVybiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX1BSRUNFRElORztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3RoZXIgaXMgYWZ0ZXIgdGhpc1xuICAgICAgICAgICAgcmV0dXJuIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZJWE1FOiBTaG91bGQgcHJvYmFibHkgdGhyb3cgaGVyZSBiZWNhdXNlIHRoaXNcbiAgICAvLyBwb2ludCBzaG91bGQgYmUgdW5yZWFjaGFibGUgY29kZSBhcyBwZXIgdGhlXG4gICAgLy8gaW50ZW5kZWQgbG9naWNcbiAgICByZXR1cm4gTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkc7XG4gIH1cbn1cblxuLy8gTm9kZSBpbnN0YW5jZSBgbm9kZVR5cGVgIGVudW0gY29uc3RhbnRzXG5leHBvcnQgaW50ZXJmYWNlIE5vZGUge1xuICBFTEVNRU5UX05PREU6IE5vZGVUeXBlO1xuICBBVFRSSUJVVEVfTk9ERTogTm9kZVR5cGU7XG4gIFRFWFRfTk9ERTogTm9kZVR5cGU7XG4gIENEQVRBX1NFQ1RJT05fTk9ERTogTm9kZVR5cGU7XG4gIEVOVElUWV9SRUZFUkVOQ0VfTk9ERTogTm9kZVR5cGU7XG4gIEVOVElUWV9OT0RFOiBOb2RlVHlwZTtcbiAgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFOiBOb2RlVHlwZTtcbiAgQ09NTUVOVF9OT0RFOiBOb2RlVHlwZTtcbiAgRE9DVU1FTlRfTk9ERTogTm9kZVR5cGU7XG4gIERPQ1VNRU5UX1RZUEVfTk9ERTogTm9kZVR5cGU7XG4gIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6IE5vZGVUeXBlO1xuICBOT1RBVElPTl9OT0RFOiBOb2RlVHlwZTtcbn1cblxuTm9kZS5wcm90b3R5cGUuRUxFTUVOVF9OT0RFID0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFO1xuTm9kZS5wcm90b3R5cGUuQVRUUklCVVRFX05PREUgPSBOb2RlVHlwZS5BVFRSSUJVVEVfTk9ERTtcbk5vZGUucHJvdG90eXBlLlRFWFRfTk9ERSA9IE5vZGVUeXBlLlRFWFRfTk9ERTtcbk5vZGUucHJvdG90eXBlLkNEQVRBX1NFQ1RJT05fTk9ERSA9IE5vZGVUeXBlLkNEQVRBX1NFQ1RJT05fTk9ERTtcbk5vZGUucHJvdG90eXBlLkVOVElUWV9SRUZFUkVOQ0VfTk9ERSA9IE5vZGVUeXBlLkVOVElUWV9SRUZFUkVOQ0VfTk9ERTtcbk5vZGUucHJvdG90eXBlLkVOVElUWV9OT0RFID0gTm9kZVR5cGUuRU5USVRZX05PREU7XG5Ob2RlLnByb3RvdHlwZS5QUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREUgPSBOb2RlVHlwZS5QUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREU7XG5Ob2RlLnByb3RvdHlwZS5DT01NRU5UX05PREUgPSBOb2RlVHlwZS5DT01NRU5UX05PREU7XG5Ob2RlLnByb3RvdHlwZS5ET0NVTUVOVF9OT0RFID0gTm9kZVR5cGUuRE9DVU1FTlRfTk9ERTtcbk5vZGUucHJvdG90eXBlLkRPQ1VNRU5UX1RZUEVfTk9ERSA9IE5vZGVUeXBlLkRPQ1VNRU5UX1RZUEVfTk9ERTtcbk5vZGUucHJvdG90eXBlLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFO1xuTm9kZS5wcm90b3R5cGUuTk9UQVRJT05fTk9ERSA9IE5vZGVUeXBlLk5PVEFUSU9OX05PREU7XG5cbmV4cG9ydCBjbGFzcyBDaGFyYWN0ZXJEYXRhIGV4dGVuZHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBkYXRhOiBzdHJpbmcsXG4gICAgbm9kZU5hbWU6IHN0cmluZyxcbiAgICBub2RlVHlwZTogTm9kZVR5cGUsXG4gICAgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgbm9kZU5hbWUsXG4gICAgICBub2RlVHlwZSxcbiAgICAgIHBhcmVudE5vZGUsXG4gICAgICBrZXksXG4gICAgKTtcblxuICAgIHRoaXMubm9kZVZhbHVlID0gZGF0YTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxlbmd0aDtcbiAgfVxuXG4gIC8vIFRPRE86IEltcGxlbWVudCBOb25Eb2N1bWVudFR5cGVDaGlsZE5vZGUubmV4dEVsZW1lbnRTaWJsaW5nLCBldGNcbiAgLy8gcmVmOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2hhcmFjdGVyRGF0YVxufVxuXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIENoYXJhY3RlckRhdGEge1xuICBjb25zdHJ1Y3RvcihcbiAgICB0ZXh0OiBzdHJpbmcgPSBcIlwiLFxuICApIHtcbiAgICBzdXBlcihcbiAgICAgIHRleHQsXG4gICAgICBcIiN0ZXh0XCIsXG4gICAgICBOb2RlVHlwZS5URVhUX05PREUsXG4gICAgICBudWxsLFxuICAgICAgQ1RPUl9LRVksXG4gICAgKTtcblxuICAgIHRoaXMubm9kZVZhbHVlID0gdGV4dDtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBUZXh0KHRoaXMudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgZ2V0IHRleHRDb250ZW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIDxzdHJpbmc+IHRoaXMubm9kZVZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21tZW50IGV4dGVuZHMgQ2hhcmFjdGVyRGF0YSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHRleHQ6IHN0cmluZyA9IFwiXCIsXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgdGV4dCxcbiAgICAgIFwiI2NvbW1lbnRcIixcbiAgICAgIE5vZGVUeXBlLkNPTU1FTlRfTk9ERSxcbiAgICAgIG51bGwsXG4gICAgICBDVE9SX0tFWSxcbiAgICApO1xuXG4gICAgdGhpcy5ub2RlVmFsdWUgPSB0ZXh0O1xuICB9XG5cbiAgX3NoYWxsb3dDbG9uZSgpOiBOb2RlIHtcbiAgICByZXR1cm4gbmV3IENvbW1lbnQodGhpcy50ZXh0Q29udGVudCk7XG4gIH1cblxuICBnZXQgdGV4dENvbnRlbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gPHN0cmluZz4gdGhpcy5ub2RlVmFsdWU7XG4gIH1cbn1cblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxRQUFRLFFBQVEsQ0FBd0I7QUFDakQsTUFBTSxHQUFHLFFBQVEsRUFBbUIsa0JBQWtCLFFBQVEsQ0FBZ0I7QUFDOUUsTUFBTSxHQUFHLGNBQWMsRUFBeUIsd0JBQXdCLFFBQVEsQ0FBc0I7QUFJdEcsTUFBTSxPQUFPLFdBQVc7SUFDdEIsZ0JBQWdCLEdBQUcsQ0FBQztJQUNsQixFQUFPLEFBQVAsS0FBTztJQUNULENBQUM7SUFFRCxtQkFBbUIsR0FBRyxDQUFDO0lBQ3JCLEVBQU8sQUFBUCxLQUFPO0lBQ1QsQ0FBQztJQUVELGFBQWEsR0FBRyxDQUFDO0lBQ2YsRUFBTyxBQUFQLEtBQU87SUFDVCxDQUFDOztBQUdJLE1BQU07VUFBRCxRQUFRO0lBQVIsUUFBUSxDQUFSLFFBQVEsQ0FDbEIsQ0FBWSxpQkFBRyxDQUFDLElBQWhCLENBQVk7SUFERixRQUFRLENBQVIsUUFBUSxDQUVsQixDQUFjLG1CQUFHLENBQUMsSUFBbEIsQ0FBYztJQUZKLFFBQVEsQ0FBUixRQUFRLENBR2xCLENBQVMsY0FBRyxDQUFDLElBQWIsQ0FBUztJQUhDLFFBQVEsQ0FBUixRQUFRLENBSWxCLENBQWtCLHVCQUFHLENBQUMsSUFBdEIsQ0FBa0I7SUFKUixRQUFRLENBQVIsUUFBUSxDQUtsQixDQUFxQiwwQkFBRyxDQUFDLElBQXpCLENBQXFCO0lBTFgsUUFBUSxDQUFSLFFBQVEsQ0FNbEIsQ0FBVyxnQkFBRyxDQUFDLElBQWYsQ0FBVztJQU5ELFFBQVEsQ0FBUixRQUFRLENBT2xCLENBQTJCLGdDQUFHLENBQUMsSUFBL0IsQ0FBMkI7SUFQakIsUUFBUSxDQUFSLFFBQVEsQ0FRbEIsQ0FBWSxpQkFBRyxDQUFDLElBQWhCLENBQVk7SUFSRixRQUFRLENBQVIsUUFBUSxDQVNsQixDQUFh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