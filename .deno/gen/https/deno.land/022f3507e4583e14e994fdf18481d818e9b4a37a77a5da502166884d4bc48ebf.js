export let parse = (_html)=>{
    console.error("Error: deno-dom: No parser registered");
    Deno.exit(1);
};
export let parseFrag = (_html)=>{
    console.error("Error: deno-dom: No parser registered");
    Deno.exit(1);
};
const originalParse = parse;
export function register(func, fragFunc) {
    if (parse !== originalParse) {
        return;
    }
    parse = func;
    parseFrag = fragFunc;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS4xNy1hbHBoYS9zcmMvcGFyc2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUGFyc2VyIGludGVyZmFjZVxuICovXG5leHBvcnQgdHlwZSBQYXJzZXIgPSAoaHRtbDogc3RyaW5nKSA9PiBzdHJpbmc7XG5leHBvcnQgbGV0IHBhcnNlOiBQYXJzZXIgPSAoX2h0bWwpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkVycm9yOiBkZW5vLWRvbTogTm8gcGFyc2VyIHJlZ2lzdGVyZWRcIik7XG4gIERlbm8uZXhpdCgxKTtcbn07XG5cbmV4cG9ydCBsZXQgcGFyc2VGcmFnOiBQYXJzZXIgPSAoX2h0bWwpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkVycm9yOiBkZW5vLWRvbTogTm8gcGFyc2VyIHJlZ2lzdGVyZWRcIik7XG4gIERlbm8uZXhpdCgxKTtcbn07XG5cbmNvbnN0IG9yaWdpbmFsUGFyc2UgPSBwYXJzZTtcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcihmdW5jOiBQYXJzZXIsIGZyYWdGdW5jOiBQYXJzZXIpIHtcbiAgaWYgKHBhcnNlICE9PSBvcmlnaW5hbFBhcnNlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcGFyc2UgPSBmdW5jO1xuICBwYXJzZUZyYWcgPSBmcmFnRnVuYztcbn1cblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFZLEtBQUssR0FBSyxDQUFDO0lBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBdUM7SUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFZLEtBQUssR0FBSyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBdUM7SUFDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2IsQ0FBQztBQUVELEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSztBQUMzQixNQUFNLFVBQVUsUUFBUSxDQUFDLElBQVksRUFBRSxRQUFnQixFQUFFLENBQUM7SUFDeEQsRUFBRSxFQUFFLEtBQUssS0FBSyxhQUFhLEVBQUUsQ0FBQztRQUM1QixNQUFNO0lBQ1IsQ0FBQztJQUVELEtBQUssR0FBRyxJQUFJO0lBQ1osU0FBUyxHQUFHLFFBQVE7QUFDdEIsQ0FBQyJ9