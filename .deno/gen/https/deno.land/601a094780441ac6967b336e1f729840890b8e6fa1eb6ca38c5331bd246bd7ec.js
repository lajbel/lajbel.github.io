import { isParallel } from "./command.ts";
import { mergeParams } from "./merge_params.ts";
import { isParallelScripts, isScriptObject } from "./util.ts";
/**
 * Normalizes a script definition to a list of `Command` objects
 */ export function normalizeScript(script, rootParams) {
    const res = _normalizeScript(script, rootParams);
    return Array.isArray(res) ? res : [
        res
    ];
}
function _normalizeScript(node, parentParams) {
    if (typeof node === "string") {
        return {
            cmd: node.trim(),
            ...mergeParams({
            }, parentParams)
        };
    }
    if (Array.isArray(node)) {
        return node.map((s)=>_normalizeScript(s, parentParams)
        );
    }
    if (isParallelScripts(node)) {
        return {
            pll: node.pll.flatMap((s)=>_normalizeScript(s, parentParams)
            )
        };
    }
    if (isScriptObject(node)) {
        const { cmd , ...nodeParams } = node;
        return _normalizeScript(node.cmd, mergeParams(nodeParams, parentParams));
    }
    return null;
}
export function flattenCommands(commands) {
    return commands.filter((c)=>c !== null
    ).flatMap((c)=>c instanceof Object && isParallel(c) ? flattenCommands(c.pll) : c
    );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9ub3JtYWxpemVfc2NyaXB0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFBhcmFsbGVsU2NyaXB0cyxcbiAgU2NyaXB0RGVmaW5pdGlvbixcbiAgU2NyaXB0T3B0aW9ucyxcbn0gZnJvbSBcIi4vc2NyaXB0c19jb25maWcudHNcIjtcbmltcG9ydCB7IENvbW1hbmQsIGlzUGFyYWxsZWwsIFBhcmFsbGVsQ29tbWFuZHMgfSBmcm9tIFwiLi9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBtZXJnZVBhcmFtcyB9IGZyb20gXCIuL21lcmdlX3BhcmFtcy50c1wiO1xuaW1wb3J0IHsgaXNQYXJhbGxlbFNjcmlwdHMsIGlzU2NyaXB0T2JqZWN0IH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYSBzY3JpcHQgZGVmaW5pdGlvbiB0byBhIGxpc3Qgb2YgYENvbW1hbmRgIG9iamVjdHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVNjcmlwdChcbiAgc2NyaXB0OiBTY3JpcHREZWZpbml0aW9uLFxuICByb290UGFyYW1zOiBTY3JpcHRPcHRpb25zLFxuKTogQXJyYXk8Q29tbWFuZCB8IFBhcmFsbGVsQ29tbWFuZHMgfCBudWxsPiB7XG4gIGNvbnN0IHJlcyA9IF9ub3JtYWxpemVTY3JpcHQoc2NyaXB0LCByb290UGFyYW1zKTtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkocmVzKSA/IHJlcyA6IFtyZXNdO1xufVxuXG5mdW5jdGlvbiBfbm9ybWFsaXplU2NyaXB0KFxuICBub2RlOiBTY3JpcHREZWZpbml0aW9uIHwgUGFyYWxsZWxTY3JpcHRzLFxuICBwYXJlbnRQYXJhbXM6IFNjcmlwdE9wdGlvbnMsXG4pOiBDb21tYW5kIHwgUGFyYWxsZWxDb21tYW5kcyB8IEFycmF5PENvbW1hbmQgfCBQYXJhbGxlbENvbW1hbmRzPiB8IG51bGwge1xuICBpZiAodHlwZW9mIG5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY21kOiBub2RlLnRyaW0oKSxcbiAgICAgIC4uLm1lcmdlUGFyYW1zKHt9LCBwYXJlbnRQYXJhbXMpLFxuICAgIH0gYXMgQ29tbWFuZDtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgIHJldHVybiBub2RlLm1hcCgocykgPT4gX25vcm1hbGl6ZVNjcmlwdChzLCBwYXJlbnRQYXJhbXMpKSBhcyBBcnJheTxcbiAgICAgIENvbW1hbmQgfCBQYXJhbGxlbENvbW1hbmRzXG4gICAgPjtcbiAgfVxuICBpZiAoaXNQYXJhbGxlbFNjcmlwdHMobm9kZSkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxsOiBub2RlLnBsbC5mbGF0TWFwKChzKSA9PiBfbm9ybWFsaXplU2NyaXB0KHMsIHBhcmVudFBhcmFtcykpLFxuICAgIH0gYXMgUGFyYWxsZWxDb21tYW5kcztcbiAgfVxuICBpZiAoaXNTY3JpcHRPYmplY3Qobm9kZSkpIHtcbiAgICBjb25zdCB7IGNtZCwgLi4ubm9kZVBhcmFtcyB9ID0gbm9kZTtcbiAgICByZXR1cm4gX25vcm1hbGl6ZVNjcmlwdChcbiAgICAgIG5vZGUuY21kLFxuICAgICAgbWVyZ2VQYXJhbXMobm9kZVBhcmFtcywgcGFyZW50UGFyYW1zKSxcbiAgICApIGFzIENvbW1hbmQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuQ29tbWFuZHMoXG4gIGNvbW1hbmRzOiAoQ29tbWFuZCB8IFBhcmFsbGVsQ29tbWFuZHMgfCBudWxsKVtdLFxuKTogQ29tbWFuZFtdIHtcbiAgcmV0dXJuIGNvbW1hbmRzXG4gICAgLmZpbHRlcigoYykgPT4gYyAhPT0gbnVsbClcbiAgICAuZmxhdE1hcCgoYykgPT5cbiAgICAgIGMgaW5zdGFuY2VvZiBPYmplY3QgJiYgaXNQYXJhbGxlbChjKSA/IGZsYXR0ZW5Db21tYW5kcyhjLnBsbCkgOiBjXG4gICAgKSBhcyBDb21tYW5kW107XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsTUFBTSxHQUFZLFVBQVUsUUFBMEIsQ0FBYztBQUNwRSxNQUFNLEdBQUcsV0FBVyxRQUFRLENBQW1CO0FBQy9DLE1BQU0sR0FBRyxpQkFBaUIsRUFBRSxjQUFjLFFBQVEsQ0FBVztBQUU3RCxFQUVHLEFBRkg7O0NBRUcsQUFGSCxFQUVHLENBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDN0IsTUFBd0IsRUFDeEIsVUFBeUIsRUFDaUIsQ0FBQztJQUMzQyxLQUFLLENBQUMsR0FBRyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxVQUFVO0lBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUFBLEdBQUc7SUFBQSxDQUFDO0FBQ3pDLENBQUM7U0FFUSxnQkFBZ0IsQ0FDdkIsSUFBd0MsRUFDeEMsWUFBMkIsRUFDNEMsQ0FBQztJQUN4RSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFRLFNBQUUsQ0FBQztRQUM3QixNQUFNLENBQUMsQ0FBQztZQUNOLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSTtlQUNYLFdBQVcsQ0FBQyxDQUFDO1lBQUEsQ0FBQyxFQUFFLFlBQVk7UUFDakMsQ0FBQztJQUNILENBQUM7SUFDRCxFQUFFLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUssZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLFlBQVk7O0lBR3pELENBQUM7SUFDRCxFQUFFLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxHQUFHLENBQUM7UUFDNUIsTUFBTSxDQUFDLENBQUM7WUFDTixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFLLGdCQUFnQixDQUFDLENBQUMsRUFBRSxZQUFZOztRQUMvRCxDQUFDO0lBQ0gsQ0FBQztJQUNELEVBQUUsRUFBRSxjQUFjLENBQUMsSUFBSSxHQUFHLENBQUM7UUFDekIsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQUssVUFBVSxDQUFDLENBQUMsR0FBRyxJQUFJO1FBQ25DLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDckIsSUFBSSxDQUFDLEdBQUcsRUFDUixXQUFXLENBQUMsVUFBVSxFQUFFLFlBQVk7SUFFeEMsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJO0FBQ2IsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQzdCLFFBQStDLEVBQ3BDLENBQUM7SUFDWixNQUFNLENBQUMsUUFBUSxDQUNaLE1BQU0sRUFBRSxDQUFDLEdBQUssQ0FBQyxLQUFLLElBQUk7TUFDeEIsT0FBTyxFQUFFLENBQUMsR0FDVCxDQUFDLFlBQVksTUFBTSxJQUFJLFVBQVUsQ0FBQyxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFdkUsQ0FBQyJ9