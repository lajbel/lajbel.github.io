export { nodesFromString } from "./deserialize.ts";
export * from "./dom/node.ts";
export * from "./dom/element.ts";
export * from "./dom/document.ts";
export * from "./dom/dom-parser.ts";
// Re-export private constructors without constructor signature
import { Node as ConstructibleNode, CharacterData as ConstructibleCharacterData } from "./dom/node.ts";
import { HTMLDocument as ConstructibleHTMLDocument } from "./dom/document.ts";
import { Element as ConstructibleElement, Attr as ConstructibleAttr } from "./dom/element.ts";
export const Node = ConstructibleNode;
export const HTMLDocument = ConstructibleHTMLDocument;
export const CharacterData = ConstructibleCharacterData;
export const Element = ConstructibleElement;
export const Attr = ConstructibleAttr;
export { NodeListPublic as NodeList } from "./dom/node-list.ts";
export { HTMLCollectionPublic as HTMLCollection } from "./dom/html-collection.ts";
import { NodeList } from "./dom/node-list.ts";
import { HTMLCollection } from "./dom/html-collection.ts";
// Prevent childNodes and HTMLCollections from being seen as an arrays
const oldHasInstance = Array[Symbol.hasInstance];
Object.defineProperty(Array, Symbol.hasInstance, {
    value (value) {
        switch(value?.constructor){
            case HTMLCollection:
            case NodeList:
                return false;
            default:
                return oldHasInstance.call(this, value);
        }
    }
});
const oldIsArray = Array.isArray;
Object.defineProperty(Array, "isArray", {
    value: (value)=>{
        switch(value?.constructor){
            case HTMLCollection:
            case NodeList:
                return false;
            default:
                return oldIsArray.call(Array, value);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS4xNy1hbHBoYS9zcmMvYXBpLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IG5vZGVzRnJvbVN0cmluZyB9IGZyb20gXCIuL2Rlc2VyaWFsaXplLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kb20vbm9kZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZG9tL2VsZW1lbnQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2RvbS9kb2N1bWVudC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZG9tL2RvbS1wYXJzZXIudHNcIjtcblxuLy8gUmUtZXhwb3J0IHByaXZhdGUgY29uc3RydWN0b3JzIHdpdGhvdXQgY29uc3RydWN0b3Igc2lnbmF0dXJlXG5pbXBvcnQge1xuICBOb2RlIGFzIENvbnN0cnVjdGlibGVOb2RlLFxuICBDaGFyYWN0ZXJEYXRhIGFzIENvbnN0cnVjdGlibGVDaGFyYWN0ZXJEYXRhXG59IGZyb20gXCIuL2RvbS9ub2RlLnRzXCJcblxuaW1wb3J0IHtcbiAgSFRNTERvY3VtZW50IGFzIENvbnN0cnVjdGlibGVIVE1MRG9jdW1lbnQsXG59IGZyb20gXCIuL2RvbS9kb2N1bWVudC50c1wiXG5cbmltcG9ydCB7XG4gIEVsZW1lbnQgYXMgQ29uc3RydWN0aWJsZUVsZW1lbnQsXG4gIEF0dHIgYXMgQ29uc3RydWN0aWJsZUF0dHJcbn0gZnJvbSBcIi4vZG9tL2VsZW1lbnQudHNcIlxuXG5leHBvcnQgY29uc3QgTm9kZTogUGljazxcbiAgdHlwZW9mIENvbnN0cnVjdGlibGVOb2RlLFxuICBrZXlvZiB0eXBlb2YgQ29uc3RydWN0aWJsZU5vZGVcbj4gJiBGdW5jdGlvbiA9IENvbnN0cnVjdGlibGVOb2RlO1xuZXhwb3J0IHR5cGUgTm9kZSA9IENvbnN0cnVjdGlibGVOb2RlO1xuXG5leHBvcnQgY29uc3QgSFRNTERvY3VtZW50OiBQaWNrPFxuICB0eXBlb2YgQ29uc3RydWN0aWJsZUhUTUxEb2N1bWVudCxcbiAga2V5b2YgdHlwZW9mIENvbnN0cnVjdGlibGVIVE1MRG9jdW1lbnRcbj4gJiBGdW5jdGlvbiA9IENvbnN0cnVjdGlibGVIVE1MRG9jdW1lbnQ7XG5leHBvcnQgdHlwZSBIVE1MRG9jdW1lbnQgPSBDb25zdHJ1Y3RpYmxlSFRNTERvY3VtZW50O1xuXG5leHBvcnQgY29uc3QgQ2hhcmFjdGVyRGF0YTogUGljazxcbiAgdHlwZW9mIENvbnN0cnVjdGlibGVDaGFyYWN0ZXJEYXRhLFxuICBrZXlvZiB0eXBlb2YgQ29uc3RydWN0aWJsZUNoYXJhY3RlckRhdGFcbj4gJiBGdW5jdGlvbiA9IENvbnN0cnVjdGlibGVDaGFyYWN0ZXJEYXRhO1xuZXhwb3J0IHR5cGUgQ2hhcmFjdGVyRGF0YSA9IENvbnN0cnVjdGlibGVDaGFyYWN0ZXJEYXRhO1xuXG5leHBvcnQgY29uc3QgRWxlbWVudDogUGljazxcbiAgdHlwZW9mIENvbnN0cnVjdGlibGVFbGVtZW50LCBrZXlvZiB0eXBlb2YgQ29uc3RydWN0aWJsZUVsZW1lbnRcbj4gJiBGdW5jdGlvbiA9IENvbnN0cnVjdGlibGVFbGVtZW50O1xuZXhwb3J0IHR5cGUgRWxlbWVudCA9IENvbnN0cnVjdGlibGVFbGVtZW50O1xuXG5leHBvcnQgY29uc3QgQXR0cjogUGljazxcbiAgdHlwZW9mIENvbnN0cnVjdGlibGVBdHRyLCBrZXlvZiB0eXBlb2YgQ29uc3RydWN0aWJsZUF0dHJcbj4gJiBGdW5jdGlvbiA9IENvbnN0cnVjdGlibGVBdHRyO1xuZXhwb3J0IHR5cGUgQXR0ciA9IENvbnN0cnVjdGlibGVBdHRyO1xuXG5leHBvcnQgeyBOb2RlTGlzdFB1YmxpYyBhcyBOb2RlTGlzdCB9IGZyb20gXCIuL2RvbS9ub2RlLWxpc3QudHNcIjtcbmV4cG9ydCB7IEhUTUxDb2xsZWN0aW9uUHVibGljIGFzIEhUTUxDb2xsZWN0aW9uIH0gZnJvbSBcIi4vZG9tL2h0bWwtY29sbGVjdGlvbi50c1wiO1xuXG5pbXBvcnQgeyBOb2RlTGlzdCB9IGZyb20gXCIuL2RvbS9ub2RlLWxpc3QudHNcIjtcbmltcG9ydCB7IEhUTUxDb2xsZWN0aW9uIH0gZnJvbSBcIi4vZG9tL2h0bWwtY29sbGVjdGlvbi50c1wiO1xuXG4vLyBQcmV2ZW50IGNoaWxkTm9kZXMgYW5kIEhUTUxDb2xsZWN0aW9ucyBmcm9tIGJlaW5nIHNlZW4gYXMgYW4gYXJyYXlzXG5jb25zdCBvbGRIYXNJbnN0YW5jZSA9IEFycmF5W1N5bWJvbC5oYXNJbnN0YW5jZV07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQXJyYXksIFN5bWJvbC5oYXNJbnN0YW5jZSwge1xuICB2YWx1ZSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgc3dpdGNoICh2YWx1ZT8uY29uc3RydWN0b3IpIHtcbiAgICAgIGNhc2UgSFRNTENvbGxlY3Rpb246XG4gICAgICBjYXNlIE5vZGVMaXN0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gb2xkSGFzSW5zdGFuY2UuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgfVxuICB9LFxufSk7XG5cbmNvbnN0IG9sZElzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEFycmF5LCBcImlzQXJyYXlcIiwge1xuICB2YWx1ZTogKHZhbHVlOiBhbnkpOiBib29sZWFuID0+IHtcbiAgICBzd2l0Y2ggKHZhbHVlPy5jb25zdHJ1Y3Rvcikge1xuICAgICAgY2FzZSBIVE1MQ29sbGVjdGlvbjpcbiAgICAgIGNhc2UgTm9kZUxpc3Q6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBvbGRJc0FycmF5LmNhbGwoQXJyYXksIHZhbHVlKTtcbiAgICB9XG4gIH0sXG59KTtcblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxlQUFlLFFBQVEsQ0FBa0I7Y0FDcEMsQ0FBZTtjQUNmLENBQWtCO2NBQ2xCLENBQW1CO2NBQ25CLENBQXFCO0FBRW5DLEVBQStELEFBQS9ELDZEQUErRDtBQUMvRCxNQUFNLEdBQ0osSUFBSSxJQUFJLGlCQUFpQixFQUN6QixhQUFhLElBQUksMEJBQTBCLFFBQ3RDLENBQWU7QUFFdEIsTUFBTSxHQUNKLFlBQVksSUFBSSx5QkFBeUIsUUFDcEMsQ0FBbUI7QUFFMUIsTUFBTSxHQUNKLE9BQU8sSUFBSSxvQkFBb0IsRUFDL0IsSUFBSSxJQUFJLGlCQUFpQixRQUNwQixDQUFrQjtBQUV6QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FHRixpQkFBaUI7QUFHaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBR1YseUJBQXlCO0FBR3hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUdYLDBCQUEwQjtBQUd6QyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FFTCxvQkFBb0I7QUFHbkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBRUYsaUJBQWlCO0FBR2hDLE1BQU0sR0FBRyxjQUFjLElBQUksUUFBUSxRQUFRLENBQW9CO0FBQy9ELE1BQU0sR0FBRyxvQkFBb0IsSUFBSSxjQUFjLFFBQVEsQ0FBMEI7QUFFakYsTUFBTSxHQUFHLFFBQVEsUUFBUSxDQUFvQjtBQUM3QyxNQUFNLEdBQUcsY0FBYyxRQUFRLENBQTBCO0FBRXpELEVBQXNFLEFBQXRFLG9FQUFzRTtBQUN0RSxLQUFLLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVztBQUMvQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDaEQsS0FBSyxFQUFDLEtBQVUsRUFBVyxDQUFDO1FBQzFCLE1BQU0sQ0FBRSxLQUFLLEVBQUUsV0FBVztZQUN4QixJQUFJLENBQUMsY0FBYztZQUNuQixJQUFJLENBQUMsUUFBUTtnQkFDWCxNQUFNLENBQUMsS0FBSzs7Z0JBRVosTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUs7O0lBRTVDLENBQUM7QUFDSCxDQUFDO0FBRUQsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTztBQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFTLFVBQUUsQ0FBQztJQUN2QyxLQUFLLEdBQUcsS0FBVSxHQUFjLENBQUM7UUFDL0IsTUFBTSxDQUFFLEtBQUssRUFBRSxXQUFXO1lBQ3hCLElBQUksQ0FBQyxjQUFjO1lBQ25CLElBQUksQ0FBQyxRQUFRO2dCQUNYLE1BQU0sQ0FBQyxLQUFLOztnQkFFWixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSzs7SUFFekMsQ0FBQztBQUNILENBQUMifQ==