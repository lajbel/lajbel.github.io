export function realpath(path, options, callback) {
    if (typeof options === "function") {
        callback = options;
    }
    if (!callback) {
        throw new Error("No callback function supplied");
    }
    Deno.realPath(path).then((path)=>callback(null, path)
    , (err)=>callback(err)
    );
}
export function realpathSync(path) {
    return Deno.realPathSync(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19yZWFscGF0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJ0eXBlIE9wdGlvbnMgPSB7IGVuY29kaW5nOiBzdHJpbmcgfTtcbnR5cGUgQ2FsbGJhY2sgPSAoZXJyOiBFcnJvciB8IG51bGwsIHBhdGg/OiBzdHJpbmcpID0+IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFscGF0aChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRpb25zPzogT3B0aW9ucyB8IENhbGxiYWNrLFxuICBjYWxsYmFjaz86IENhbGxiYWNrLFxuKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICB9XG4gIGlmICghY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjYWxsYmFjayBmdW5jdGlvbiBzdXBwbGllZFwiKTtcbiAgfVxuICBEZW5vLnJlYWxQYXRoKHBhdGgpLnRoZW4oXG4gICAgKHBhdGgpID0+IGNhbGxiYWNrIShudWxsLCBwYXRoKSxcbiAgICAoZXJyKSA9PiBjYWxsYmFjayEoZXJyKSxcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWxwYXRoU3luYyhwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gRGVuby5yZWFsUGF0aFN5bmMocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsTUFBTSxVQUFVLFFBQVEsQ0FDdEIsSUFBWSxFQUNaLE9BQTRCLEVBQzVCLFFBQW1CLEVBQ25CLENBQUM7SUFDRCxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFVLFdBQUUsQ0FBQztRQUNsQyxRQUFRLEdBQUcsT0FBTztJQUNwQixDQUFDO0lBQ0QsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDO1FBQ2QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBK0I7SUFDakQsQ0FBQztJQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFDckIsSUFBSSxHQUFLLFFBQVEsQ0FBRSxJQUFJLEVBQUUsSUFBSTtPQUM3QixHQUFHLEdBQUssUUFBUSxDQUFFLEdBQUc7O0FBRTFCLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQVksRUFBVSxDQUFDO0lBQ2xELE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUk7QUFDL0IsQ0FBQyJ9