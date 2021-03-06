export function unlink(path, callback) {
    if (!callback) throw new Error("No callback function supplied");
    Deno.remove(path).then((_)=>callback()
    , callback);
}
export function unlinkSync(path) {
    Deno.removeSync(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX3VubGluay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gdW5saW5rKHBhdGg6IHN0cmluZyB8IFVSTCwgY2FsbGJhY2s6IChlcnI/OiBFcnJvcikgPT4gdm9pZCkge1xuICBpZiAoIWNhbGxiYWNrKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBjYWxsYmFjayBmdW5jdGlvbiBzdXBwbGllZFwiKTtcbiAgRGVuby5yZW1vdmUocGF0aCkudGhlbigoXykgPT4gY2FsbGJhY2soKSwgY2FsbGJhY2spO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5saW5rU3luYyhwYXRoOiBzdHJpbmcgfCBVUkwpIHtcbiAgRGVuby5yZW1vdmVTeW5jKHBhdGgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sVUFBVSxNQUFNLENBQUMsSUFBa0IsRUFBRSxRQUErQixFQUFFLENBQUM7SUFDM0UsRUFBRSxHQUFHLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUErQjtJQUM5RCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFLLFFBQVE7TUFBSSxRQUFRO0FBQ3BELENBQUM7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLElBQWtCLEVBQUUsQ0FBQztJQUM5QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUk7QUFDdEIsQ0FBQyJ9