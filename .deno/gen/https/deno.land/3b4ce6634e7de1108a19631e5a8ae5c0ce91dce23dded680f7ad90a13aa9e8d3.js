const hasPermissions = "permissions" in Deno;
let readRequested = false;
const netRequested = new Set();
async function requestRead(path) {
    if (readRequested || !hasPermissions) {
        return;
    }
    readRequested = true;
    await Deno.permissions.request({
        name: "read",
        path
    });
}
async function requestNet(host) {
    if (!hasPermissions || netRequested.has(host)) {
        return;
    }
    netRequested.add(host);
    await Deno.permissions.request({
        name: "net",
        host
    });
}
/** A Deno specific loader function that can be passed to the
 * `createModuleGraph` which will use `Deno.readTextFile` for local files, or
 * use `fetch()` for remote modules.
 *
 * @param specifier The string module specifier from the module graph.
 */ export async function load(specifier) {
    const url = new URL(specifier);
    try {
        switch(url.protocol){
            case "file:":
                {
                    await requestRead(url);
                    const content = await Deno.readTextFile(url);
                    return {
                        specifier,
                        content
                    };
                }
            case "http:":
            case "https:":
                {
                    await requestNet(url.host);
                    const response = await fetch(String(url), {
                        redirect: "follow"
                    });
                    if (response.status !== 200) {
                        // ensure the body is read as to not leak resources
                        await response.arrayBuffer();
                        return undefined;
                    }
                    const content = await response.text();
                    const headers = {
                    };
                    for (const [key, value] of response.headers){
                        headers[key.toLowerCase()] = value;
                    }
                    return {
                        specifier: response.url,
                        headers,
                        content
                    };
                }
            default:
                return undefined;
        }
    } catch  {
        return undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19ncmFwaEAwLjkuMS9saWIvbG9hZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB0eXBlIHsgTG9hZFJlc3BvbnNlIH0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuXG5jb25zdCBoYXNQZXJtaXNzaW9ucyA9IFwicGVybWlzc2lvbnNcIiBpbiBEZW5vO1xubGV0IHJlYWRSZXF1ZXN0ZWQgPSBmYWxzZTtcbmNvbnN0IG5ldFJlcXVlc3RlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0UmVhZChwYXRoOiBVUkwpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHJlYWRSZXF1ZXN0ZWQgfHwgIWhhc1Blcm1pc3Npb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJlYWRSZXF1ZXN0ZWQgPSB0cnVlO1xuICBhd2FpdCBEZW5vLnBlcm1pc3Npb25zLnJlcXVlc3QoeyBuYW1lOiBcInJlYWRcIiwgcGF0aCB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVxdWVzdE5ldChob3N0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFoYXNQZXJtaXNzaW9ucyB8fCBuZXRSZXF1ZXN0ZWQuaGFzKGhvc3QpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5ldFJlcXVlc3RlZC5hZGQoaG9zdCk7XG4gIGF3YWl0IERlbm8ucGVybWlzc2lvbnMucmVxdWVzdCh7IG5hbWU6IFwibmV0XCIsIGhvc3QgfSk7XG59XG5cbi8qKiBBIERlbm8gc3BlY2lmaWMgbG9hZGVyIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGVcbiAqIGBjcmVhdGVNb2R1bGVHcmFwaGAgd2hpY2ggd2lsbCB1c2UgYERlbm8ucmVhZFRleHRGaWxlYCBmb3IgbG9jYWwgZmlsZXMsIG9yXG4gKiB1c2UgYGZldGNoKClgIGZvciByZW1vdGUgbW9kdWxlcy5cbiAqXG4gKiBAcGFyYW0gc3BlY2lmaWVyIFRoZSBzdHJpbmcgbW9kdWxlIHNwZWNpZmllciBmcm9tIHRoZSBtb2R1bGUgZ3JhcGguXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkKFxuICBzcGVjaWZpZXI6IHN0cmluZyxcbik6IFByb21pc2U8TG9hZFJlc3BvbnNlIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoc3BlY2lmaWVyKTtcbiAgdHJ5IHtcbiAgICBzd2l0Y2ggKHVybC5wcm90b2NvbCkge1xuICAgICAgY2FzZSBcImZpbGU6XCI6IHtcbiAgICAgICAgYXdhaXQgcmVxdWVzdFJlYWQodXJsKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKHVybCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BlY2lmaWVyLFxuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjYXNlIFwiaHR0cDpcIjpcbiAgICAgIGNhc2UgXCJodHRwczpcIjoge1xuICAgICAgICBhd2FpdCByZXF1ZXN0TmV0KHVybC5ob3N0KTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChTdHJpbmcodXJsKSwgeyByZWRpcmVjdDogXCJmb2xsb3dcIiB9KTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgLy8gZW5zdXJlIHRoZSBib2R5IGlzIHJlYWQgYXMgdG8gbm90IGxlYWsgcmVzb3VyY2VzXG4gICAgICAgICAgYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnN0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgcmVzcG9uc2UuaGVhZGVycykge1xuICAgICAgICAgIGhlYWRlcnNba2V5LnRvTG93ZXJDYXNlKCldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGVjaWZpZXI6IHJlc3BvbnNlLnVybCxcbiAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBYSxnQkFBSSxJQUFJO0FBQzVDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsS0FBSztBQUN6QixLQUFLLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxHQUFHO2VBRWIsV0FBVyxDQUFDLElBQVMsRUFBaUIsQ0FBQztJQUNwRCxFQUFFLEVBQUUsYUFBYSxLQUFLLGNBQWMsRUFBRSxDQUFDO1FBQ3JDLE1BQU07SUFDUixDQUFDO0lBQ0QsYUFBYSxHQUFHLElBQUk7SUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFBQyxJQUFJLEVBQUUsQ0FBTTtRQUFFLElBQUk7SUFBQyxDQUFDO0FBQ3ZELENBQUM7ZUFFYyxVQUFVLENBQUMsSUFBWSxFQUFpQixDQUFDO0lBQ3RELEVBQUUsR0FBRyxjQUFjLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUM5QyxNQUFNO0lBQ1IsQ0FBQztJQUNELFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSTtJQUNyQixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUFDLElBQUksRUFBRSxDQUFLO1FBQUUsSUFBSTtJQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELEVBS0csQUFMSDs7Ozs7Q0FLRyxBQUxILEVBS0csQ0FDSCxNQUFNLGdCQUFnQixJQUFJLENBQ3hCLFNBQWlCLEVBQ2tCLENBQUM7SUFDcEMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVM7SUFDN0IsR0FBRyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUUsR0FBRyxDQUFDLFFBQVE7WUFDbEIsSUFBSSxDQUFDLENBQU87Z0JBQUUsQ0FBQztvQkFDYixLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUc7b0JBQ3JCLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRztvQkFDM0MsTUFBTSxDQUFDLENBQUM7d0JBQ04sU0FBUzt3QkFDVCxPQUFPO29CQUNULENBQUM7Z0JBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxDQUFPO1lBQ1osSUFBSSxDQUFDLENBQVE7Z0JBQUUsQ0FBQztvQkFDZCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJO29CQUN6QixLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO3dCQUFDLFFBQVEsRUFBRSxDQUFRO29CQUFDLENBQUM7b0JBQ2hFLEVBQUUsRUFBRSxRQUFRLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUM1QixFQUFtRCxBQUFuRCxpREFBbUQ7d0JBQ25ELEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVzt3QkFDMUIsTUFBTSxDQUFDLFNBQVM7b0JBQ2xCLENBQUM7b0JBQ0QsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7b0JBQ25DLEtBQUssQ0FBQyxPQUFPLEdBQTJCLENBQUM7b0JBQUEsQ0FBQztvQkFDMUMsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUUsQ0FBQzt3QkFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLE1BQU0sS0FBSztvQkFDcEMsQ0FBQztvQkFDRCxNQUFNLENBQUMsQ0FBQzt3QkFDTixTQUFTLEVBQUUsUUFBUSxDQUFDLEdBQUc7d0JBQ3ZCLE9BQU87d0JBQ1AsT0FBTztvQkFDVCxDQUFDO2dCQUNILENBQUM7O2dCQUVDLE1BQU0sQ0FBQyxTQUFTOztJQUV0QixDQUFDLENBQUMsS0FBSyxFQUFDLENBQUM7UUFDUCxNQUFNLENBQUMsU0FBUztJQUNsQixDQUFDO0FBQ0gsQ0FBQyJ9