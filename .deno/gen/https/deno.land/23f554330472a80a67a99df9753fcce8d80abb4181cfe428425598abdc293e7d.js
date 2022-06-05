import { createSite, runWatch } from "./utils.ts";
import { warn } from "../core/utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import runServe from "./serve.ts";
/** Build the website and optionally watch changes and serve the site */ export default async function build({ root , config , serve , watch , experimental  }) {
    if (experimental) {
        if (!serve && !watch) {
            warn("Experimental mode requires either --serve or --watch");
            return;
        }
        runExperimentalWatcher(serve, root, config);
        return;
    }
    const site = await createSite(root, config);
    const quiet = site.options.quiet;
    if (!quiet) {
        console.log();
    }
    await site.build();
    if (!quiet) {
        console.log();
        console.log(`🍾 ${brightGreen("Site built into")} ${dim(site.options.dest)}`);
    }
    if (!serve && !watch) {
        return;
    }
    // Disable metrics for the watcher
    site.options.metrics = false;
    // Start the watcher
    runWatch({
        root: site.src(),
        ignore: site.options.watcher.ignore,
        debounce: site.options.watcher.debounce,
        fn: (files)=>{
            console.log();
            console.log("Changes detected:");
            files.forEach((file)=>console.log("-", dim(file))
            );
            console.log();
            return site.update(files);
        }
    });
    // Start the local server
    if (serve) {
        await runServe(site.dest(), site.options.server);
    }
};
/** Build the site using a Worker so it can reload the modules */ function runExperimentalWatcher(initServer, root, config) {
    const url = new URL("watch.ts", import.meta.url);
    let serving = false;
    function init() {
        const work = new Worker(url, {
            type: "module",
            deno: true
        });
        // Start watching
        work.postMessage({
            root,
            config
        });
        // Listen for messages
        work.onmessage = (event)=>{
            const { type  } = event.data;
            // Init the local server
            if (type === "built") {
                if (serving || !initServer) {
                    return;
                }
                const { root , options  } = event.data;
                runServe(root, options);
                serving = true;
                return;
            }
            // Reload the worker
            if (type === "reload") {
                work.terminate();
                init();
            }
        };
    }
    init();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY2xpL2J1aWxkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVNpdGUsIHJ1bldhdGNoIH0gZnJvbSBcIi4vdXRpbHMudHNcIjtcbmltcG9ydCB7IHdhcm4gfSBmcm9tIFwiLi4vY29yZS91dGlscy50c1wiO1xuaW1wb3J0IHsgYnJpZ2h0R3JlZW4sIGRpbSB9IGZyb20gXCIuLi9kZXBzL2NvbG9ycy50c1wiO1xuaW1wb3J0IHJ1blNlcnZlIGZyb20gXCIuL3NlcnZlLnRzXCI7XG5cbmludGVyZmFjZSBPcHRpb25zIHtcbiAgcm9vdDogc3RyaW5nO1xuICBjb25maWc/OiBzdHJpbmc7XG4gIHNlcnZlOiBib29sZWFuO1xuICB3YXRjaDogYm9vbGVhbjtcbiAgZXhwZXJpbWVudGFsOiBib29sZWFuO1xufVxuXG4vKiogQnVpbGQgdGhlIHdlYnNpdGUgYW5kIG9wdGlvbmFsbHkgd2F0Y2ggY2hhbmdlcyBhbmQgc2VydmUgdGhlIHNpdGUgKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkKFxuICB7IHJvb3QsIGNvbmZpZywgc2VydmUsIHdhdGNoLCBleHBlcmltZW50YWwgfTogT3B0aW9ucyxcbikge1xuICBpZiAoZXhwZXJpbWVudGFsKSB7XG4gICAgaWYgKCFzZXJ2ZSAmJiAhd2F0Y2gpIHtcbiAgICAgIHdhcm4oXCJFeHBlcmltZW50YWwgbW9kZSByZXF1aXJlcyBlaXRoZXIgLS1zZXJ2ZSBvciAtLXdhdGNoXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5FeHBlcmltZW50YWxXYXRjaGVyKHNlcnZlLCByb290LCBjb25maWcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNpdGUgPSBhd2FpdCBjcmVhdGVTaXRlKHJvb3QsIGNvbmZpZyk7XG4gIGNvbnN0IHF1aWV0ID0gc2l0ZS5vcHRpb25zLnF1aWV0O1xuXG4gIGlmICghcXVpZXQpIHtcbiAgICBjb25zb2xlLmxvZygpO1xuICB9XG5cbiAgYXdhaXQgc2l0ZS5idWlsZCgpO1xuXG4gIGlmICghcXVpZXQpIHtcbiAgICBjb25zb2xlLmxvZygpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYPCfjb4gJHticmlnaHRHcmVlbihcIlNpdGUgYnVpbHQgaW50b1wiKX0gJHtkaW0oc2l0ZS5vcHRpb25zLmRlc3QpfWAsXG4gICAgKTtcbiAgfVxuXG4gIGlmICghc2VydmUgJiYgIXdhdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGlzYWJsZSBtZXRyaWNzIGZvciB0aGUgd2F0Y2hlclxuICBzaXRlLm9wdGlvbnMubWV0cmljcyA9IGZhbHNlO1xuXG4gIC8vIFN0YXJ0IHRoZSB3YXRjaGVyXG4gIHJ1bldhdGNoKHtcbiAgICByb290OiBzaXRlLnNyYygpLFxuICAgIGlnbm9yZTogc2l0ZS5vcHRpb25zLndhdGNoZXIuaWdub3JlLFxuICAgIGRlYm91bmNlOiBzaXRlLm9wdGlvbnMud2F0Y2hlci5kZWJvdW5jZSxcbiAgICBmbjogKGZpbGVzKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygpO1xuICAgICAgY29uc29sZS5sb2coXCJDaGFuZ2VzIGRldGVjdGVkOlwiKTtcbiAgICAgIGZpbGVzLmZvckVhY2goKGZpbGUpID0+IGNvbnNvbGUubG9nKFwiLVwiLCBkaW0oZmlsZSkpKTtcbiAgICAgIGNvbnNvbGUubG9nKCk7XG4gICAgICByZXR1cm4gc2l0ZS51cGRhdGUoZmlsZXMpO1xuICAgIH0sXG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBsb2NhbCBzZXJ2ZXJcbiAgaWYgKHNlcnZlKSB7XG4gICAgYXdhaXQgcnVuU2VydmUoc2l0ZS5kZXN0KCksIHNpdGUub3B0aW9ucy5zZXJ2ZXIpO1xuICB9XG59XG5cbi8qKiBCdWlsZCB0aGUgc2l0ZSB1c2luZyBhIFdvcmtlciBzbyBpdCBjYW4gcmVsb2FkIHRoZSBtb2R1bGVzICovXG5mdW5jdGlvbiBydW5FeHBlcmltZW50YWxXYXRjaGVyKFxuICBpbml0U2VydmVyOiBib29sZWFuLFxuICByb290OiBzdHJpbmcsXG4gIGNvbmZpZz86IHN0cmluZyxcbikge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFwid2F0Y2gudHNcIiwgaW1wb3J0Lm1ldGEudXJsKTtcbiAgbGV0IHNlcnZpbmcgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGNvbnN0IHdvcmsgPSBuZXcgV29ya2VyKHVybCwge1xuICAgICAgdHlwZTogXCJtb2R1bGVcIixcbiAgICAgIGRlbm86IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBTdGFydCB3YXRjaGluZ1xuICAgIHdvcmsucG9zdE1lc3NhZ2UoeyByb290LCBjb25maWcgfSk7XG5cbiAgICAvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzXG4gICAgd29yay5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHsgdHlwZSB9ID0gZXZlbnQuZGF0YTtcblxuICAgICAgLy8gSW5pdCB0aGUgbG9jYWwgc2VydmVyXG4gICAgICBpZiAodHlwZSA9PT0gXCJidWlsdFwiKSB7XG4gICAgICAgIGlmIChzZXJ2aW5nIHx8ICFpbml0U2VydmVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyByb290LCBvcHRpb25zIH0gPSBldmVudC5kYXRhO1xuICAgICAgICBydW5TZXJ2ZShyb290LCBvcHRpb25zKTtcbiAgICAgICAgc2VydmluZyA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVsb2FkIHRoZSB3b3JrZXJcbiAgICAgIGlmICh0eXBlID09PSBcInJlbG9hZFwiKSB7XG4gICAgICAgIHdvcmsudGVybWluYXRlKCk7XG4gICAgICAgIGluaXQoKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgaW5pdCgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxVQUFVLEVBQUUs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