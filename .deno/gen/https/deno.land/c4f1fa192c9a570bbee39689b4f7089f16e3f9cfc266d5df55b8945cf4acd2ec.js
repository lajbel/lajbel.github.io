import { merge } from "../core/utils.ts";
import { toFileUrl } from "../deps/path.ts";
import { createGraph, load } from "../deps/graph.ts";
import { SitePage } from "../core/filesystem.ts";
// Default options
const defaults = {
    extensions: [
        ".ts",
        ".js"
    ],
    sourceMap: false,
    options: {
    }
};
/** A plugin to load all .js, .ts, .jsx, .tsx files and bundle them using Deno.emit() */ export default function(userOptions) {
    const options = merge(defaults, userOptions);
    return (site)=>{
        const sources = {
        };
        const { importMap  } = options.options;
        // Refresh updated files
        site.addEventListener("beforeUpdate", (event)=>{
            event.files?.forEach((file)=>{
                const specifier = toFileUrl(site.src(file)).href;
                delete sources[specifier];
            });
        });
        site.loadAssets(options.extensions);
        /**
     * For bundle, we need to load all the files sources
     * before emitting the bundle
     */ if (options.options.bundle) {
            // Load all source files and save the content in `sources`
            site.process(options.extensions, (file)=>{
                const specifier = getSpecifier(file);
                sources[specifier] = file.content;
            });
            // Load all other dependencies and save the content in `sources`
            site.process(options.extensions, async (file)=>{
                const specifier1 = getSpecifier(file);
                await createGraph(specifier1, {
                    resolve (specifier, referrer) {
                        return isBare(specifier) ? getFileSpecifier(specifier) : new URL(specifier, referrer).href;
                    },
                    async load (specifier, isDynamic) {
                        if (isDynamic) {
                            return;
                        }
                        if (specifier in sources) {
                            return {
                                specifier: specifier,
                                content: sources[specifier]
                            };
                        }
                        const response = await load(specifier);
                        if (response) {
                            sources[specifier] = response.content;
                            return response;
                        }
                    }
                });
            });
        }
        // Now we are ready to emit the entries
        site.process(options.extensions, async (file)=>{
            const specifier = getSpecifier(file);
            const { files  } = await Deno.emit(specifier, {
                ...options.options,
                sources: {
                    ...sources,
                    [specifier]: file.content
                }
            });
            const content = files[specifier] || files[specifier + ".js"] || files["deno:///bundle.js"];
            if (content) {
                file.content = fixExtensions(content);
                file.dest.ext = ".js";
            }
            const mapContent = files[specifier + ".map"] || files[specifier + ".js.map"] || files["deno:///bundle.js.map"];
            if (options.sourceMap && mapContent) {
                const mapFile = new SitePage();
                mapFile.dest = {
                    path: file.dest.path,
                    ext: ".js.map"
                };
                mapFile.content = mapContent;
                site.pages.push(mapFile);
            }
        });
        function getSpecifier(file) {
            file._data.specifier ||= toFileUrl(site.src(file.data.url)).href;
            return file._data.specifier;
        }
        function getFileSpecifier(file) {
            for(const key in importMap?.imports){
                if (file.startsWith(key)) {
                    return importMap?.imports[key] + file.slice(key.length);
                }
            }
            throw new Error(`Invalid specifier ${file}`);
        }
    };
};
/** Replace all .ts, .tsx and .jsx files with .js files */ function fixExtensions(content) {
    return content.replaceAll(/\.(ts|tsx|jsx)("|')/ig, ".js$2");
}
function isBare(specifier) {
    return !specifier.startsWith(".") && !specifier.includes("://");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvcGx1Z2lucy9idW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4uL2NvcmUvdXRpbHMudHNcIjtcbmltcG9ydCB7IFBhZ2UsIFNpdGUgfSBmcm9tIFwiLi4vY29yZS50c1wiO1xuaW1wb3J0IHsgdG9GaWxlVXJsIH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlR3JhcGgsIGxvYWQsIExvYWRSZXNwb25zZSB9IGZyb20gXCIuLi9kZXBzL2dyYXBoLnRzXCI7XG5pbXBvcnQgeyBTaXRlUGFnZSB9IGZyb20gXCIuLi9jb3JlL2ZpbGVzeXN0ZW0udHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLyoqIFRoZSBsaXN0IG9mIGV4dGVuc2lvbnMgdGhpcyBwbHVnaW4gYXBwbGllcyB0byAqL1xuICBleHRlbnNpb25zOiBzdHJpbmdbXTtcblxuICAvKiogU2V0IGB0cnVlYCB0byBnZW5lcmF0ZSBzb3VyY2UgbWFwIGZpbGVzICovXG4gIHNvdXJjZU1hcDogYm9vbGVhbjtcblxuICAvKiogVGhlIG9wdGlvbnMgZm9yIERlbm8uZW1pdCAqL1xuICBvcHRpb25zOiBEZW5vLkVtaXRPcHRpb25zO1xufVxuXG4vLyBEZWZhdWx0IG9wdGlvbnNcbmNvbnN0IGRlZmF1bHRzOiBPcHRpb25zID0ge1xuICBleHRlbnNpb25zOiBbXCIudHNcIiwgXCIuanNcIl0sXG4gIHNvdXJjZU1hcDogZmFsc2UsXG4gIG9wdGlvbnM6IHt9LFxufTtcblxuLyoqIEEgcGx1Z2luIHRvIGxvYWQgYWxsIC5qcywgLnRzLCAuanN4LCAudHN4IGZpbGVzIGFuZCBidW5kbGUgdGhlbSB1c2luZyBEZW5vLmVtaXQoKSAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHVzZXJPcHRpb25zPzogUGFydGlhbDxPcHRpb25zPikge1xuICBjb25zdCBvcHRpb25zID0gbWVyZ2UoZGVmYXVsdHMsIHVzZXJPcHRpb25zKTtcblxuICByZXR1cm4gKHNpdGU6IFNpdGUpID0+IHtcbiAgICBjb25zdCBzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgY29uc3QgeyBpbXBvcnRNYXAgfSA9IG9wdGlvbnMub3B0aW9ucztcblxuICAgIC8vIFJlZnJlc2ggdXBkYXRlZCBmaWxlc1xuICAgIHNpdGUuYWRkRXZlbnRMaXN0ZW5lcihcImJlZm9yZVVwZGF0ZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LmZpbGVzPy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IHNwZWNpZmllciA9IHRvRmlsZVVybChzaXRlLnNyYyhmaWxlKSkuaHJlZjtcbiAgICAgICAgZGVsZXRlIHNvdXJjZXNbc3BlY2lmaWVyXTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc2l0ZS5sb2FkQXNzZXRzKG9wdGlvbnMuZXh0ZW5zaW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiBGb3IgYnVuZGxlLCB3ZSBuZWVkIHRvIGxvYWQgYWxsIHRoZSBmaWxlcyBzb3VyY2VzXG4gICAgICogYmVmb3JlIGVtaXR0aW5nIHRoZSBidW5kbGVcbiAgICAgKi9cbiAgICBpZiAob3B0aW9ucy5vcHRpb25zLmJ1bmRsZSkge1xuICAgICAgLy8gTG9hZCBhbGwgc291cmNlIGZpbGVzIGFuZCBzYXZlIHRoZSBjb250ZW50IGluIGBzb3VyY2VzYFxuICAgICAgc2l0ZS5wcm9jZXNzKG9wdGlvbnMuZXh0ZW5zaW9ucywgKGZpbGU6IFBhZ2UpID0+IHtcbiAgICAgICAgY29uc3Qgc3BlY2lmaWVyID0gZ2V0U3BlY2lmaWVyKGZpbGUpO1xuICAgICAgICBzb3VyY2VzW3NwZWNpZmllcl0gPSBmaWxlLmNvbnRlbnQgYXMgc3RyaW5nO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIExvYWQgYWxsIG90aGVyIGRlcGVuZGVuY2llcyBhbmQgc2F2ZSB0aGUgY29udGVudCBpbiBgc291cmNlc2BcbiAgICAgIHNpdGUucHJvY2VzcyhvcHRpb25zLmV4dGVuc2lvbnMsIGFzeW5jIChmaWxlOiBQYWdlKSA9PiB7XG4gICAgICAgIGNvbnN0IHNwZWNpZmllciA9IGdldFNwZWNpZmllcihmaWxlKTtcblxuICAgICAgICBhd2FpdCBjcmVhdGVHcmFwaChzcGVjaWZpZXIsIHtcbiAgICAgICAgICByZXNvbHZlKHNwZWNpZmllciwgcmVmZXJyZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBpc0JhcmUoc3BlY2lmaWVyKVxuICAgICAgICAgICAgICA/IGdldEZpbGVTcGVjaWZpZXIoc3BlY2lmaWVyKVxuICAgICAgICAgICAgICA6IG5ldyBVUkwoc3BlY2lmaWVyLCByZWZlcnJlcikuaHJlZjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFzeW5jIGxvYWQoXG4gICAgICAgICAgICBzcGVjaWZpZXI6IHN0cmluZyxcbiAgICAgICAgICAgIGlzRHluYW1pYzogYm9vbGVhbixcbiAgICAgICAgICApOiBQcm9taXNlPExvYWRSZXNwb25zZSB8IHVuZGVmaW5lZD4ge1xuICAgICAgICAgICAgaWYgKGlzRHluYW1pYykge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3BlY2lmaWVyIGluIHNvdXJjZXMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzcGVjaWZpZXI6IHNwZWNpZmllcixcbiAgICAgICAgICAgICAgICBjb250ZW50OiBzb3VyY2VzW3NwZWNpZmllcl0sXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbG9hZChzcGVjaWZpZXIpO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgc291cmNlc1tzcGVjaWZpZXJdID0gcmVzcG9uc2UuY29udGVudDtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGFyZSByZWFkeSB0byBlbWl0IHRoZSBlbnRyaWVzXG4gICAgc2l0ZS5wcm9jZXNzKG9wdGlvbnMuZXh0ZW5zaW9ucywgYXN5bmMgKGZpbGU6IFBhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHNwZWNpZmllciA9IGdldFNwZWNpZmllcihmaWxlKTtcbiAgICAgIGNvbnN0IHsgZmlsZXMgfSA9IGF3YWl0IERlbm8uZW1pdChzcGVjaWZpZXIsIHtcbiAgICAgICAgLi4ub3B0aW9ucy5vcHRpb25zLFxuICAgICAgICBzb3VyY2VzOiB7XG4gICAgICAgICAgLi4uc291cmNlcyxcbiAgICAgICAgICBbc3BlY2lmaWVyXTogZmlsZS5jb250ZW50IGFzIHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gZmlsZXNbc3BlY2lmaWVyXSB8fCBmaWxlc1tzcGVjaWZpZXIgKyBcIi5qc1wiXSB8fFxuICAgICAgICBmaWxlc1tcImRlbm86Ly8vYnVuZGxlLmpzXCJdO1xuXG4gICAgICBpZiAoY29udGVudCkge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaXhFeHRlbnNpb25zKGNvbnRlbnQpO1xuICAgICAgICBmaWxlLmRlc3QuZXh0ID0gXCIuanNcIjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWFwQ29udGVudCA9IGZpbGVzW3NwZWNpZmllciArIFwiLm1hcFwiXSB8fFxuICAgICAgICBmaWxlc1tzcGVjaWZpZXIgKyBcIi5qcy5tYXBcIl0gfHwgZmlsZXNbXCJkZW5vOi8vL2J1bmRsZS5qcy5tYXBcIl07XG5cbiAgICAgIGlmIChvcHRpb25zLnNvdXJjZU1hcCAmJiBtYXBDb250ZW50KSB7XG4gICAgICAgIGNvbnN0IG1hcEZpbGUgPSBuZXcgU2l0ZVBhZ2UoKTtcbiAgICAgICAgbWFwRmlsZS5kZXN0ID0ge1xuICAgICAgICAgIHBhdGg6IGZpbGUuZGVzdC5wYXRoLFxuICAgICAgICAgIGV4dDogXCIuanMubWFwXCIsXG4gICAgICAgIH07XG4gICAgICAgIG1hcEZpbGUuY29udGVudCA9IG1hcENvbnRlbnQ7XG4gICAgICAgIHNpdGUucGFnZXMucHVzaChtYXBGaWxlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGdldFNwZWNpZmllcihmaWxlOiBQYWdlKSB7XG4gICAgICBmaWxlLl9kYXRhLnNwZWNpZmllciB8fD1cbiAgICAgICAgdG9GaWxlVXJsKHNpdGUuc3JjKGZpbGUuZGF0YS51cmwgYXMgc3RyaW5nKSkuaHJlZjtcbiAgICAgIHJldHVybiBmaWxlLl9kYXRhLnNwZWNpZmllciBhcyBzdHJpbmc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RmlsZVNwZWNpZmllcihmaWxlOiBzdHJpbmcpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGltcG9ydE1hcD8uaW1wb3J0cykge1xuICAgICAgICBpZiAoZmlsZS5zdGFydHNXaXRoKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gaW1wb3J0TWFwPy5pbXBvcnRzW2tleV0gKyBmaWxlLnNsaWNlKGtleS5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc3BlY2lmaWVyICR7ZmlsZX1gKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBSZXBsYWNlIGFsbCAudHMsIC50c3ggYW5kIC5qc3ggZmlsZXMgd2l0aCAuanMgZmlsZXMgKi9cbmZ1bmN0aW9uIGZpeEV4dGVuc2lvbnMoY29udGVudDogc3RyaW5nKSB7XG4gIHJldHVybiBjb250ZW50LnJlcGxhY2VBbGwoL1xcLih0c3x0c3h8anN4KShcInwnKS9pZywgXCIuanMkMlwiKTtcbn1cblxuZnVuY3Rpb24gaXNCYXJlKHNwZWNpZmllcjogc3RyaW5nKSB7XG4gIHJldHVybiAhc3BlY2lmaWVyLnN0YXJ0c1dpdGgo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