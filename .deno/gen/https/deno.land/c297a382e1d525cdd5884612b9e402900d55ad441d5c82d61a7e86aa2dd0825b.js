import { autoprefixer, postcss, postcssImport, postcssNesting } from "../deps/postcss.ts";
import { merge } from "../core/utils.ts";
import { SitePage } from "../core/filesystem.ts";
// Default options
const defaults = {
    extensions: [
        ".css"
    ],
    sourceMap: false,
    includes: [],
    plugins: [
        postcssNesting(),
        autoprefixer(), 
    ],
    keepDefaultPlugins: false
};
/** A plugin to load all CSS files and process them using PostCSS */ export default function(userOptions) {
    return (site)=>{
        const options = merge({
            ...defaults,
            includes: site.options.includes
        }, userOptions);
        if (options.keepDefaultPlugins && userOptions?.plugins?.length) {
            options.plugins = defaults.plugins.concat(userOptions.plugins);
        }
        const plugins = [
            ...options.plugins
        ];
        if (options.includes) {
            plugins.unshift(postcssImport({
                path: Array.isArray(options.includes) ? options.includes.map((path)=>site.src(path)
                ) : site.src(options.includes)
            }));
        }
        // @ts-ignore: Argument of type 'unknown[]' is not assignable to parameter of type 'AcceptedPlugin[]'.
        const runner = postcss(plugins);
        site.loadAssets(options.extensions);
        site.process(options.extensions, postCss);
        site.filter("postcss", filter, true);
        async function postCss(file) {
            const from = site.src(file.src.path + file.src.ext);
            const to = site.dest(file.dest.path + file.dest.ext);
            const map = options.sourceMap ? {
                inline: false
            } : undefined;
            // Process the code with PostCSS
            const result = await runner.process(file.content, {
                from,
                to,
                map
            });
            file.content = result.css;
            if (result.map) {
                const mapFile = new SitePage();
                mapFile.dest = {
                    path: file.dest.path,
                    ext: ".css.map"
                };
                mapFile.content = result.map.toString();
                site.pages.push(mapFile);
            }
        }
        async function filter(code) {
            const result = await runner.process(code, {
                from: undefined
            });
            return result.css;
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvcGx1Z2lucy9wb3N0Y3NzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGF1dG9wcmVmaXhlcixcbiAgcG9zdGNzcyxcbiAgcG9zdGNzc0ltcG9ydCxcbiAgcG9zdGNzc05lc3RpbmcsXG59IGZyb20gXCIuLi9kZXBzL3Bvc3Rjc3MudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMudHNcIjtcbmltcG9ydCB7IEhlbHBlciwgUGFnZSwgU2l0ZSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5pbXBvcnQgeyBTaXRlUGFnZSB9IGZyb20gXCIuLi9jb3JlL2ZpbGVzeXN0ZW0udHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBsaXN0IG9mIGV4dGVuc2lvbnMgdGhpcyBwbHVnaW4gYXBwbGllcyB0byAqL1xuICBleHRlbnNpb25zOiBzdHJpbmdbXTtcblxuICAvKiogU2V0IGB0cnVlYCB0byBnZW5lcmF0ZSBzb3VyY2UgbWFwIGZpbGVzICovXG4gIHNvdXJjZU1hcDogYm9vbGVhbjtcblxuICAvKiogQ3VzdG9tIGluY2x1ZGVzIHBhdGggZm9yIGBwb3N0Y3NzLWltcG9ydGAgKi9cbiAgaW5jbHVkZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgZmFsc2U7XG5cbiAgLyoqIFBsdWdpbnMgdG8gdXNlIGJ5IHBvc3Rjc3MgKi9cbiAgcGx1Z2luczogdW5rbm93bltdO1xuXG4gIC8qKiBTZXQgYHRydWVgIGFwcGVuZCB5b3VyIHBsdWdpbnMgdG8gdGhlIGRlZmF1bHRzICovXG4gIGtlZXBEZWZhdWx0UGx1Z2luczogYm9vbGVhbjtcbn1cblxuLy8gRGVmYXVsdCBvcHRpb25zXG5jb25zdCBkZWZhdWx0czogT3B0aW9ucyA9IHtcbiAgZXh0ZW5zaW9uczogW1wiLmNzc1wiXSxcbiAgc291cmNlTWFwOiBmYWxzZSxcbiAgaW5jbHVkZXM6IFtdLFxuICBwbHVnaW5zOiBbXG4gICAgcG9zdGNzc05lc3RpbmcoKSxcbiAgICBhdXRvcHJlZml4ZXIoKSxcbiAgXSxcbiAga2VlcERlZmF1bHRQbHVnaW5zOiBmYWxzZSxcbn07XG5cbi8qKiBBIHBsdWdpbiB0byBsb2FkIGFsbCBDU1MgZmlsZXMgYW5kIHByb2Nlc3MgdGhlbSB1c2luZyBQb3N0Q1NTICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAodXNlck9wdGlvbnM/OiBQYXJ0aWFsPE9wdGlvbnM+KSB7XG4gIHJldHVybiAoc2l0ZTogU2l0ZSkgPT4ge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZShcbiAgICAgIHsgLi4uZGVmYXVsdHMsIGluY2x1ZGVzOiBzaXRlLm9wdGlvbnMuaW5jbHVkZXMgfSxcbiAgICAgIHVzZXJPcHRpb25zLFxuICAgICk7XG5cbiAgICBpZiAob3B0aW9ucy5rZWVwRGVmYXVsdFBsdWdpbnMgJiYgdXNlck9wdGlvbnM/LnBsdWdpbnM/Lmxlbmd0aCkge1xuICAgICAgb3B0aW9ucy5wbHVnaW5zID0gZGVmYXVsdHMucGx1Z2lucy5jb25jYXQodXNlck9wdGlvbnMucGx1Z2lucyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGx1Z2lucyA9IFsuLi5vcHRpb25zLnBsdWdpbnNdO1xuXG4gICAgaWYgKG9wdGlvbnMuaW5jbHVkZXMpIHtcbiAgICAgIHBsdWdpbnMudW5zaGlmdChwb3N0Y3NzSW1wb3J0KHtcbiAgICAgICAgcGF0aDogQXJyYXkuaXNBcnJheShvcHRpb25zLmluY2x1ZGVzKVxuICAgICAgICAgID8gb3B0aW9ucy5pbmNsdWRlcy5tYXAoKHBhdGgpID0+IHNpdGUuc3JjKHBhdGgpKVxuICAgICAgICAgIDogc2l0ZS5zcmMob3B0aW9ucy5pbmNsdWRlcyksXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZTogQXJndW1lbnQgb2YgdHlwZSAndW5rbm93bltdJyBpcyBub3QgYXNzaWduYWJsZSB0byBwYXJhbWV0ZXIgb2YgdHlwZSAnQWNjZXB0ZWRQbHVnaW5bXScuXG4gICAgY29uc3QgcnVubmVyID0gcG9zdGNzcyhwbHVnaW5zKTtcblxuICAgIHNpdGUubG9hZEFzc2V0cyhvcHRpb25zLmV4dGVuc2lvbnMpO1xuICAgIHNpdGUucHJvY2VzcyhvcHRpb25zLmV4dGVuc2lvbnMsIHBvc3RDc3MpO1xuICAgIHNpdGUuZmlsdGVyKFwicG9zdGNzc1wiLCBmaWx0ZXIgYXMgSGVscGVyLCB0cnVlKTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHBvc3RDc3MoZmlsZTogUGFnZSkge1xuICAgICAgY29uc3QgZnJvbSA9IHNpdGUuc3JjKGZpbGUuc3JjLnBhdGggKyBmaWxlLnNyYy5leHQpO1xuICAgICAgY29uc3QgdG8gPSBzaXRlLmRlc3QoZmlsZS5kZXN0LnBhdGggKyBmaWxlLmRlc3QuZXh0KTtcbiAgICAgIGNvbnN0IG1hcCA9IG9wdGlvbnMuc291cmNlTWFwID8geyBpbmxpbmU6IGZhbHNlIH0gOiB1bmRlZmluZWQ7XG5cbiAgICAgIC8vIFByb2Nlc3MgdGhlIGNvZGUgd2l0aCBQb3N0Q1NTXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5uZXIucHJvY2VzcyhmaWxlLmNvbnRlbnQhLCB7IGZyb20sIHRvLCBtYXAgfSk7XG5cbiAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5jc3M7XG5cbiAgICAgIGlmIChyZXN1bHQubWFwKSB7XG4gICAgICAgIGNvbnN0IG1hcEZpbGUgPSBuZXcgU2l0ZVBhZ2UoKTtcbiAgICAgICAgbWFwRmlsZS5kZXN0ID0ge1xuICAgICAgICAgIHBhdGg6IGZpbGUuZGVzdC5wYXRoLFxuICAgICAgICAgIGV4dDogXCIuY3NzLm1hcFwiLFxuICAgICAgICB9O1xuICAgICAgICBtYXBGaWxlLmNvbnRlbnQgPSByZXN1bHQubWFwLnRvU3RyaW5nKCk7XG4gICAgICAgIHNpdGUucGFnZXMucHVzaChtYXBGaWxlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBmaWx0ZXIoY29kZTogc3RyaW5nKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5uZXIucHJvY2Vzcyhjb2RlLCB7IGZyb206IHVuZGVmaW5lZCB9KTtcbiAgICAgIHJldHVybiByZXN1bHQuY3NzO1xuICAgIH1cbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQ0osWUFBWSxFQUNaLE9BQU8sRUFDUCxhQUFhLEVBQ2IsY0FBYyxRQUNULENBQW9CO0FBQzNCLE1BQU0sR0FBRyxLQUFLLFFBQVEsQ0FBa0I7QUFFeEMsTUFBTSxHQUFHLFFBQVEsUUFBUSxDQUF1QjtBQW1CaEQsRUFBa0IsQUFBbEIsZ0JBQWtCO0FBQ2xCLEtBQUssQ0FBQyxRQUFRLEdBQVksQ0FBQztJQUN6QixVQUFVLEVBQUUsQ0FBQztRQUFBLENBQU07SUFBQSxDQUFDO0lBQ3BCLFNBQVMsRUFBRSxLQUFLO0lBQ2hCLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDWixPQUFPLEVBQUUsQ0FBQztRQUNSLGNBQWM7UUFDZCxZQUFZO0lBQ2QsQ0FBQztJQUNELGtCQUFrQixFQUFFLEtBQUs7QUFDM0IsQ0FBQztBQUVELEVBQW9FLEFBQXBFLGdFQUFvRSxBQUFwRSxFQUFvRSxDQUNwRSxNQUFNLFNBQVMsUUFBUSxDQUFFLFdBQThCLEVBQUUsQ0FBQztJQUN4RCxNQUFNLEVBQUUsSUFBVSxHQUFLLENBQUM7UUFDdEIsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQ25CLENBQUM7ZUFBSSxRQUFRO1lBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtRQUFDLENBQUMsRUFDaEQsV0FBVztRQUdiLEVBQUUsRUFBRSxPQUFPLENBQUMsa0JBQWtCLElBQUksV0FBVyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUMvRCxPQUFPLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPO1FBQy9ELENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxH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