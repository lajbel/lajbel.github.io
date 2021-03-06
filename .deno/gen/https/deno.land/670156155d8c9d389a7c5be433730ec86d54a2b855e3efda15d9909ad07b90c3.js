import { isPlainObject } from "../utils.ts";
/** Load and parse a JSON file */ export default async function(path) {
    const text = await Deno.readTextFile(path);
    const content = JSON.parse(text);
    if (!content) {
        return {
        };
    }
    if (isPlainObject(content)) {
        return content;
    }
    return {
        content
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY29yZS9sb2FkZXJzL2pzb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGF0YSB9IGZyb20gXCIuLi8uLi9jb3JlLnRzXCI7XG5pbXBvcnQgeyBpc1BsYWluT2JqZWN0IH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5cbi8qKiBMb2FkIGFuZCBwYXJzZSBhIEpTT04gZmlsZSAqL1xuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKHBhdGg6IHN0cmluZyk6IFByb21pc2U8RGF0YT4ge1xuICBjb25zdCB0ZXh0ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUocGF0aCk7XG4gIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKHRleHQpO1xuXG4gIGlmICghY29udGVudCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGlmIChpc1BsYWluT2JqZWN0KGNvbnRlbnQpKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQgYXMgRGF0YTtcbiAgfVxuXG4gIHJldHVybiB7IGNvbnRlbnQgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxNQUFNLEdBQUcsYUFBYSxRQUFRLENBQWE7QUFFM0MsRUFBaUMsQUFBakMsNkJBQWlDLEFBQWpDLEVBQWlDLENBQ2pDLE1BQU0sd0JBQXlCLElBQVksRUFBaUIsQ0FBQztJQUMzRCxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUk7SUFDekMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7SUFFL0IsRUFBRSxHQUFHLE9BQU8sRUFBRSxDQUFDO1FBQ2IsTUFBTSxDQUFDLENBQUM7UUFBQSxDQUFDO0lBQ1gsQ0FBQztJQUVELEVBQUUsRUFBRSxhQUFhLENBQUMsT0FBTyxHQUFHLENBQUM7UUFDM0IsTUFBTSxDQUFDLE9BQU87SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxDQUFDO1FBQUMsT0FBTztJQUFDLENBQUM7QUFDcEIsQ0FBQyJ9