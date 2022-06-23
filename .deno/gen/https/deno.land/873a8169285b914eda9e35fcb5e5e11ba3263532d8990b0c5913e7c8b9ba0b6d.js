import { log } from "./logger.ts";
import { printScriptsInfo } from "./scripts_info.ts";
import { bold } from "../deps.ts";
import { normalizeScript } from "./normalize_script.ts";
import { resolveShell } from "./resolve_shell.ts";
import { runCommands } from "./run_commands.ts";
import { validateScript } from "./validate_script.ts";
export var ArgsForwardingMode;
(function(ArgsForwardingMode) {
    ArgsForwardingMode[ArgsForwardingMode["DIRECT"] = 0] = "DIRECT";
    ArgsForwardingMode[ArgsForwardingMode["INDIRECT"] = 1] = "INDIRECT";
})(ArgsForwardingMode || (ArgsForwardingMode = {
}));
export async function runScript({ configData , script , prefix , additionalArgs , argsForwardingMode  }) {
    const { cwd , config  } = configData;
    if (script == null || script.length < 1) {
        printScriptsInfo(config);
        Deno.exit();
    }
    validateScript(script, config);
    const scriptDef = config.scripts[script];
    const { scripts , ...rootConfig } = config;
    const commands = normalizeScript(scriptDef, rootConfig);
    const shell = resolveShell();
    try {
        await runCommands({
            shell,
            cwd,
            commands,
            prefix: typeof prefix === "function" ? prefix(shell) : prefix,
            additionalArgs,
            argsForwardingMode
        });
    } catch (e) {
        log.error(`Failed at the ${bold(script)} script`);
        Deno.exit(3);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9ydW5fc2NyaXB0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbmZpZ0RhdGEgfSBmcm9tIFwiLi9sb2FkX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQgeyBwcmludFNjcmlwdHNJbmZvIH0gZnJvbSBcIi4vc2NyaXB0c19pbmZvLnRzXCI7XG5pbXBvcnQgeyBib2xkIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVNjcmlwdCB9IGZyb20gXCIuL25vcm1hbGl6ZV9zY3JpcHQudHNcIjtcbmltcG9ydCB7IHJlc29sdmVTaGVsbCB9IGZyb20gXCIuL3Jlc29sdmVfc2hlbGwudHNcIjtcbmltcG9ydCB7IHJ1bkNvbW1hbmRzIH0gZnJvbSBcIi4vcnVuX2NvbW1hbmRzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZVNjcmlwdCB9IGZyb20gXCIuL3ZhbGlkYXRlX3NjcmlwdC50c1wiO1xuXG5leHBvcnQgZW51bSBBcmdzRm9yd2FyZGluZ01vZGUge1xuICBESVJFQ1QsXG4gIElORElSRUNULFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1blNjcmlwdE9wdGlvbnMge1xuICBjb25maWdEYXRhOiBDb25maWdEYXRhO1xuICBzY3JpcHQ6IHN0cmluZztcbiAgcHJlZml4Pzogc3RyaW5nIHwgKChzaGVsbDogc3RyaW5nKSA9PiBzdHJpbmcpO1xuICBhZGRpdGlvbmFsQXJncz86IHN0cmluZ1tdO1xuICBhcmdzRm9yd2FyZGluZ01vZGU/OiBBcmdzRm9yd2FyZGluZ01vZGU7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TY3JpcHQoXG4gIHsgY29uZmlnRGF0YSwgc2NyaXB0LCBwcmVmaXgsIGFkZGl0aW9uYWxBcmdzLCBhcmdzRm9yd2FyZGluZ01vZGUgfTpcbiAgICBSdW5TY3JpcHRPcHRpb25zLFxuKSB7XG4gIGNvbnN0IHsgY3dkLCBjb25maWcgfSA9IGNvbmZpZ0RhdGE7XG4gIGlmIChzY3JpcHQgPT0gbnVsbCB8fCBzY3JpcHQubGVuZ3RoIDwgMSkge1xuICAgIHByaW50U2NyaXB0c0luZm8oY29uZmlnKTtcbiAgICBEZW5vLmV4aXQoKTtcbiAgfVxuICB2YWxpZGF0ZVNjcmlwdChzY3JpcHQsIGNvbmZpZyk7XG4gIGNvbnN0IHNjcmlwdERlZiA9IGNvbmZpZy5zY3JpcHRzW3NjcmlwdF07XG4gIGNvbnN0IHsgc2NyaXB0cywgLi4ucm9vdENvbmZpZyB9ID0gY29uZmlnO1xuICBjb25zdCBjb21tYW5kcyA9IG5vcm1hbGl6ZVNjcmlwdChzY3JpcHREZWYsIHJvb3RDb25maWcpO1xuICBjb25zdCBzaGVsbCA9IHJlc29sdmVTaGVsbCgpO1xuICB0cnkge1xuICAgIGF3YWl0IHJ1bkNvbW1hbmRzKHtcbiAgICAgIHNoZWxsLFxuICAgICAgY3dkLFxuICAgICAgY29tbWFuZHMsXG4gICAgICBwcmVmaXg6IHR5cGVvZiBwcmVmaXggPT09IFwiZnVuY3Rpb25cIiA/IHByZWZpeChzaGVsbCkgOiBwcmVmaXgsXG4gICAgICBhZGRpdGlvbmFsQXJncyxcbiAgICAgIGFyZ3NGb3J3YXJkaW5nTW9kZSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy5lcnJvcihgRmFpbGVkIGF0IHRoZSAke2JvbGQoc2NyaXB0KX0gc2NyaXB0YCk7XG4gICAgRGVuby5leGl0KDMpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFhO0FBQ2pDLE1BQU0sR0FBRyxnQkFBZ0IsUUFBUSxDQUFtQjtBQUNwRCxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQVk7QUFDakMsTUFBTSxHQUFHLGVBQWUsUUFBUSxDQUF1QjtBQUN2RCxNQUFNLEdBQUcsWUFBWSxRQUFRLENBQW9CO0FBQ2pELE1BQU0sR0FBRyxXQUFXLFFBQVEsQ0FBbUI7QUFDL0MsTUFBTSxHQUFHLGNBQWMsUUFBUSxDQUFzQjtBQUU5QyxNQUFNO1VBQUQsa0JBQWtCO0lBQWxCLGtCQUFrQixDQUFsQixrQkFBa0IsQ0FDNUIsQ0FBTSxXQUFOLENBQU0sSUFBTixDQUFNO0lBREksa0JBQWtCLENBQWxCLGtCQUFrQixDQUU1QixDQUFRLGFBQVIsQ0FBUSxJQUFSLENBQVE7R0FGRSxrQkFBa0IsS0FBbEIsa0JBQWtCOztBQWE5QixNQUFNLGdCQUFnQixTQUFTLENBQzdCLENBQUMsQ0FBQyxVQUFVLEdBQUUsTUFBTSxHQUFFLE1BQU0sR0FBRSxjQUFjLEdBQUUsa0JBQWtCLEVBQy9DLENBQUMsRUFDbEIsQ0FBQztJQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFFLE1BQU0sRUFBQyxDQUFDLEdBQUcsVUFBVTtJQUNsQyxFQUFFLEVBQUUsTUFBTSxJQUFJLElBQUksSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ3hDLGdCQUFnQixDQUFDLE1BQU07UUFDdkIsSUFBSSxDQUFDLElBQUk7SUFDWCxDQUFDO0lBQ0QsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNO0lBQzdCLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNO0lBQ3ZDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxNQUFLLFVBQVUsQ0FBQyxDQUFDLEdBQUcsTUFBTTtJQUN6QyxLQUFLLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsVUFBVTtJQUN0RCxLQUFLLENBQUMsS0FBSyxHQUFHLFlBQVk7SUFDMUIsR0FBRyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakIsS0FBSztZQUNMLEdBQUc7WUFDSCxRQUFRO1lBQ1IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBVSxZQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksTUFBTTtZQUM3RCxjQUFjO1lBQ2Qsa0JBQWtCO1FBQ3BCLENBQUM7SUFDSCxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPO1FBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNiLENBQUM7QUFDSCxDQUFDIn0=