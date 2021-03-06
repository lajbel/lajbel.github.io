import { merge } from "../core/utils.ts";
const defaults = {
    name: "paginate",
    options: {
        size: 10,
        url: ()=>""
    }
};
/** Register the plugin to enable the `paginate` helper */ export default function(userOptions) {
    const options = merge(defaults, userOptions);
    return (site)=>{
        if (!userOptions?.options?.url) {
            const ext = site.options.prettyUrls ? "/index.html" : ".html";
            options.options.url = (page)=>`./page-${page}${ext}`
            ;
        }
        // Register the helper
        site.data(options.name, createPaginator(options.options));
    };
};
/** Create a paginator function */ export function createPaginator(defaults) {
    return function* paginate(results, userOptions = {
    }) {
        const options = merge(defaults, userOptions);
        const totalResults = results.length;
        const totalPages = Math.ceil(results.length / options.size);
        let page = 1;
        let data = createPageData(page);
        for (const result of results){
            data.results.push(result);
            if (data.results.length >= options.size) {
                yield data;
                data = createPageData(++page);
            }
        }
        if (data.results.length) {
            yield data;
        }
        function createPageData(page) {
            return {
                url: options.url(page),
                results: [],
                pagination: {
                    page,
                    totalPages,
                    totalResults,
                    previous: page > 1 ? options.url(page - 1) : null,
                    next: totalPages > page ? options.url(page + 1) : null
                }
            };
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvcGx1Z2lucy9wYWdpbmF0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTaXRlIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMudHNcIjtcblxuLyoqIFRoZSBvcHRpb25zIGZvciB0aGUgcGFnaW5hdGUgaGVscGVyICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRlT3B0aW9ucyB7XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHBlciBwYWdlICovXG4gIHNpemU6IG51bWJlcjtcblxuICAvKiogVGhlIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIHRoZSB1cmwgb2YgdGhlIHBhZ2VzICovXG4gIHVybDogKHBhZ2U6IG51bWJlcikgPT4gc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBQYWdpbmF0b3IgPSAoXG4gIHJlc3VsdHM6IHVua25vd25bXSxcbiAgdXNlck9wdGlvbnM/OiBQYXJ0aWFsPFBhZ2luYXRlT3B0aW9ucz4sXG4pID0+IEdlbmVyYXRvcjxQYWdpbmF0ZVJlc3VsdCwgdm9pZCwgdW5rbm93bj47XG5cbi8qKiBUaGUgcGFnaW5hdGUgcmVzdWx0ICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRlUmVzdWx0IHtcbiAgLyoqIFRoZSBwYWdlIHVybCAqL1xuICB1cmw6IHN0cmluZztcblxuICAvKiogVGhlIHBhZ2UgZWxlbWVudHMgKi9cbiAgcmVzdWx0czogdW5rbm93bltdO1xuXG4gIC8qKiBUaGUgcGFnaW5hdGlvbiBpbmZvICovXG4gIHBhZ2luYXRpb246IHtcbiAgICAvKiogVGhlIGN1cnJlbnQgcGFnZSBudW1iZXIgKi9cbiAgICBwYWdlOiBudW1iZXI7XG5cbiAgICAvKiogVGhlIHRvdGFsIG51bWJlciBvZiBwYWdlcyAqL1xuICAgIHRvdGFsUGFnZXM6IG51bWJlcjtcblxuICAgIC8qKiBUaGUgdG90YWwgbnVtYmVyIG9mIGVsZW1lbnRzICovXG4gICAgdG90YWxSZXN1bHRzOiBudW1iZXI7XG5cbiAgICAvKiogVGhlIHVybCBvZiB0aGUgcHJldmlvdXMgcGFnZSAqL1xuICAgIHByZXZpb3VzOiBzdHJpbmcgfCBudWxsO1xuXG4gICAgLyoqIFRoZSB1cmwgb2YgdGhlIG5leHQgcGFnZSAqL1xuICAgIG5leHQ6IHN0cmluZyB8IG51bGw7XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgaGVscGVyIG5hbWUgKi9cbiAgbmFtZTogc3RyaW5nO1xuXG4gIC8qKiBUaGUgZGVmYXVsdCBwYWdpbmF0aW9uIG9wdGlvbnMgKi9cbiAgb3B0aW9uczogUGFnaW5hdGVPcHRpb25zO1xufVxuXG5jb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgbmFtZTogXCJwYWdpbmF0ZVwiLFxuICBvcHRpb25zOiB7XG4gICAgc2l6ZTogMTAsXG4gICAgdXJsOiAoKSA9PiBcIlwiLFxuICB9LFxufTtcblxuLyoqIFJlZ2lzdGVyIHRoZSBwbHVnaW4gdG8gZW5hYmxlIHRoZSBgcGFnaW5hdGVgIGhlbHBlciAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHVzZXJPcHRpb25zPzogUGFydGlhbDxPcHRpb25zPikge1xuICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcblxuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICBpZiAoIXVzZXJPcHRpb25zPy5vcHRpb25zPy51cmwpIHtcbiAgICAgIGNvbnN0IGV4dCA9IHNpdGUub3B0aW9ucy5wcmV0dHlVcmxzID8gXCIvaW5kZXguaHRtbFwiIDogXCIuaHRtbFwiO1xuICAgICAgb3B0aW9ucy5vcHRpb25zLnVybCA9IChwYWdlOiBudW1iZXIpID0+IGAuL3BhZ2UtJHtwYWdlfSR7ZXh0fWA7XG4gICAgfVxuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIGhlbHBlclxuICAgIHNpdGUuZGF0YShvcHRpb25zLm5hbWUsIGNyZWF0ZVBhZ2luYXRvcihvcHRpb25zLm9wdGlvbnMpKTtcbiAgfTtcbn1cblxuLyoqIENyZWF0ZSBhIHBhZ2luYXRvciBmdW5jdGlvbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhZ2luYXRvcihkZWZhdWx0czogUGFnaW5hdGVPcHRpb25zKTogUGFnaW5hdG9yIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKiBwYWdpbmF0ZShcbiAgICByZXN1bHRzOiB1bmtub3duW10sXG4gICAgdXNlck9wdGlvbnM6IFBhcnRpYWw8UGFnaW5hdGVPcHRpb25zPiA9IHt9LFxuICApIHtcbiAgICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcbiAgICBjb25zdCB0b3RhbFJlc3VsdHMgPSByZXN1bHRzLmxlbmd0aDtcbiAgICBjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5jZWlsKHJlc3VsdHMubGVuZ3RoIC8gb3B0aW9ucy5zaXplKTtcblxuICAgIGxldCBwYWdlID0gMTtcbiAgICBsZXQgZGF0YSA9IGNyZWF0ZVBhZ2VEYXRhKHBhZ2UpO1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgZGF0YS5yZXN1bHRzLnB1c2gocmVzdWx0KTtcblxuICAgICAgaWYgKGRhdGEucmVzdWx0cy5sZW5ndGggPj0gb3B0aW9ucy5zaXplKSB7XG4gICAgICAgIHlpZWxkIGRhdGE7XG5cbiAgICAgICAgZGF0YSA9IGNyZWF0ZVBhZ2VEYXRhKCsrcGFnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgIHlpZWxkIGRhdGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlUGFnZURhdGEocGFnZTogbnVtYmVyKTogUGFnaW5hdGVSZXN1bHQge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybChwYWdlKSxcbiAgICAgICAgcmVzdWx0czogW10sXG4gICAgICAgIHBhZ2luYXRpb246IHtcbiAgICAgICAgICBwYWdlLFxuICAgICAgICAgIHRvdGFsUGFnZXMsXG4gICAgICAgICAgdG90YWxSZXN1bHRzLFxuICAgICAgICAgIHByZXZpb3VzOiBwYWdlID4gMSA/IG9wdGlvbnMudXJsKHBhZ2UgLSAxKSA6IG51bGwsXG4gICAgICAgICAgbmV4dDogdG90YWxQYWdlcyA+IHBhZ2UgPyBvcHRpb25zLnVybChwYWdlICsgMSkgOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsTUFBTSxHQUFHLEtBQUssUUFBUSxDQUFrQjtBQW1EeEMsS0FBSyxDQUFDLFFBQVEsR0FBWSxDQUFDO0lBQ3pCLElBQUksRUFBRSxDQUFVO0lBQ2hCLE9BQU8sRUFBRSxDQUFDO1FBQ1IsSUFBSSxFQUFFLEVBQUU7UUFDUixHQUFHLE1BQVEsQ0FBRTtJQUNmLENBQUM7QUFDSCxDQUFDO0FBRUQsRUFBMEQsQUFBMUQsc0RBQTBELEFBQTFELEVBQTBELENBQzFELE1BQU0sU0FBUyxRQUFRLENBQUUsV0FBOEIsRUFBRSxDQUFDO0lBQ3hELEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxXQUFXO0lBRTNDLE1BQU0sRUFBRSxJQUFVLEdBQUssQ0FBQztRQUN0QixFQUFFLEdBQUcsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUMvQixLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLENBQWEsZUFBRyxDQUFPO1lBQzdELE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLElBQVksSUFBTSxPQUFPLEVBQUUsSUFBSSxHQUFHLEdBQUc7O1FBQzlELENBQUM7UUFFRCxFQUFzQixBQUF0QixvQkFBc0I7UUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTztJQUN6RCxDQUFDO0FBQ0gsQ0FBQztBQUVELEVBQWtDLEFBQWxDLDhCQUFrQyxBQUFsQyxFQUFrQyxDQUNsQyxNQUFNLFVBQVUsZUFBZSxDQUFDLFFBQXlCLEVBQWEsQ0FBQztJQUNyRSxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FDdkIsT0FBa0IsRUFDbEIsV0FBcUMsR0FBRyxDQUFDO0lBQUEsQ0FBQyxFQUMxQyxDQUFDO1FBQ0QsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLFdBQVc7UUFDM0MsS0FBSyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsTUFBTTtRQUNuQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSTtRQUUxRCxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUM7UUFDWixHQUFHLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJO1FBRTlCLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU07WUFFeEIsRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztzQkFDbEMsSUFBSTtnQkFFVixJQUFJLEdBQUcsY0FBYyxHQUFHLElBQUk7WUFDOUIsQ0FBQztRQUNILENBQUM7UUFFRCxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztrQkFDbEIsSUFBSTtRQUNaLENBQUM7aUJBRVEsY0FBYyxDQUFDLElBQVksRUFBa0IsQ0FBQztZQUNyRCxNQUFNLENBQUMsQ0FBQztnQkFDTixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJO2dCQUNyQixPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNYLFVBQVUsRUFBRSxDQUFDO29CQUNYLElBQUk7b0JBQ0osVUFBVTtvQkFDVixZQUFZO29CQUNaLFFBQVEsRUFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJO29CQUNqRCxJQUFJLEVBQUUsVUFBVSxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksSUFBSTtnQkFDeEQsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMifQ==