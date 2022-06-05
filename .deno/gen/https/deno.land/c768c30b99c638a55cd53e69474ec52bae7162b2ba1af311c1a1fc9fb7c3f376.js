import { getCurrentVersion, getLastDevelopmentVersion, getLastVersion } from "./utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
/** Upgrade the Lume installation to the latest version */ export default async function upgrade({ dev  }) {
    const latest = dev ? await getLastDevelopmentVersion() : await getLastVersion();
    if (latest === getCurrentVersion()) {
        console.log(`You're using the latest version of Lume: ${brightGreen(latest)}!`);
        console.log();
        return;
    }
    console.log(`New version available. Updating Lume to ${brightGreen(latest)}...`);
    await install(latest, dev);
    console.log();
    console.log("Update successful!");
    console.log(`You're using the latest version of Lume: ${brightGreen(latest)}!`);
    if (!dev) {
        console.log("See the changes in", gray(`https://github.com/lumeland/lume/blob/${latest}/CHANGELOG.md`));
    }
    console.log();
};
async function install(version, dev = false) {
    const url = dev ? `https://cdn.jsdelivr.net/gh/lumeland/lume@${version}` : `https://deno.land/x/lume@${version}`;
    const process = Deno.run({
        cmd: [
            Deno.execPath(),
            "run",
            "-A",
            `${url}/install.ts`,
            "--upgrade", 
        ]
    });
    const status = await process.status();
    process.close();
    return status.success;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY2xpL3VwZ3JhZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZ2V0Q3VycmVudFZlcnNpb24sXG4gIGdldExhc3REZXZlbG9wbWVudFZlcnNpb24sXG4gIGdldExhc3RWZXJzaW9uLFxufSBmcm9tIFwiLi91dGlscy50c1wiO1xuaW1wb3J0IHsgYnJpZ2h0R3JlZW4sIGdyYXkgfSBmcm9tIFwiLi4vZGVwcy9jb2xvcnMudHNcIjtcblxuaW50ZXJmYWNlIE9wdGlvbnMge1xuICBkZXY6IGJvb2xlYW47XG59XG5cbi8qKiBVcGdyYWRlIHRoZSBMdW1lIGluc3RhbGxhdGlvbiB0byB0aGUgbGF0ZXN0IHZlcnNpb24gKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHVwZ3JhZGUoeyBkZXYgfTogT3B0aW9ucykge1xuICBjb25zdCBsYXRlc3QgPSBkZXZcbiAgICA/IGF3YWl0IGdldExhc3REZXZlbG9wbWVudFZlcnNpb24oKVxuICAgIDogYXdhaXQgZ2V0TGFzdFZlcnNpb24oKTtcblxuICBpZiAobGF0ZXN0ID09PSBnZXRDdXJyZW50VmVyc2lvbigpKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgWW91J3JlIHVzaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiBMdW1lOiAke2JyaWdodEdyZWVuKGxhdGVzdCl9IWAsXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKFxuICAgIGBOZXcgdmVyc2lvbiBhdmFpbGFibGUuIFVwZGF0aW5nIEx1bWUgdG8gJHticmlnaHRHcmVlbihsYXRlc3QpfS4uLmAsXG4gICk7XG5cbiAgYXdhaXQgaW5zdGFsbChsYXRlc3QsIGRldik7XG5cbiAgY29uc29sZS5sb2coKTtcbiAgY29uc29sZS5sb2coXCJVcGRhdGUgc3VjY2Vzc2Z1bCFcIik7XG4gIGNvbnNvbGUubG9nKFxuICAgIGBZb3UncmUgdXNpbmcgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIEx1bWU6ICR7YnJpZ2h0R3JlZW4obGF0ZXN0KX0hYCxcbiAgKTtcblxuICBpZiAoIWRldikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgXCJTZWUgdGhlIGNoYW5nZXMgaW5cIixcbiAgICAgIGdyYXkoYGh0dHBzOi8vZ2l0aHViLmNvbS9sdW1lbGFuZC9sdW1lL2Jsb2IvJHtsYXRlc3R9L0NIQU5HRUxPRy5tZGApLFxuICAgICk7XG4gIH1cbiAgY29uc29sZS5sb2coKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbCh2ZXJzaW9uOiBzdHJpbmcsIGRldiA9IGZhbHNlKSB7XG4gIGNvbnN0IHVybCA9IGRldlxuICAgID8gYGh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9naC9sdW1lbGFuZC9sdW1lQCR7dmVyc2lvbn1gXG4gICAgOiBgaHR0cHM6Ly9kZW5vLmxhbmQveC9sdW1lQCR7dmVyc2lvbn1gO1xuXG4gIGNvbnN0IHByb2Nlc3MgPSBEZW5vLnJ1bih7XG4gICAgY21kOiBbXG4gICAgICBEZW5vLmV4ZWNQYXRoKCksXG4gICAgICBcInJ1blwiLFxuICAgICAgXCItQVwiLFxuICAgICAgYCR7dXJsfS9pbnN0YWxsLnRzYCxcbiAgICAgIFwiLS11cGdyYWRlXCIsXG4gICAgXSxcbiAgfSk7XG5cbiAgY29uc3Qgc3RhdHVzID0gYXdhaXQgcHJvY2Vzcy5zdGF0dXMoKTtcbiAgcHJvY2Vzcy5jbG9zZSgpO1xuXG4gIHJldHVybiBzdGF0dXMuc3VjY2Vzcztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQ0osaUJBQWlCLEVBQ2pCLHlCQUF5QixFQUN6QixjQUFjLFFBQ1QsQ0FBWTtBQUNuQixNQUFNLEdBQUcsV0FBVyxFQUFFLElBQUksUUFBUSxDQUFtQjtBQU1yRCxFQUEwRCxBQUExRCxzREFBMEQsQUFBMUQsRUFBMEQsQ0FDMUQsTUFBTSx3QkFBd0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQVUsQ0FBQyxFQUFFLENBQUM7SUFDdkQsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQ2QsS0FBSyxDQUFDLHlCQUF5QixLQUMvQixLQUFLLENBQUMsY0FBYztJQUV4QixFQUFFLEVBQUUsTUFBTSxLQUFLLGlCQUFpQixJQUFJLENBQUM7UUFDbkMsT0FBTyxDQUFDLEdBQUcsRUFDUix5Q0FBeUMsRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFbkUsT0FBTyxDQUFDLEdBQUc7UUFDWCxNQUFNO0lBQ1IsQ0FBQztJQUVELE9BQU8sQ0FBQyxHQUFHLEVBQ1Isd0NBQXdDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxHQUFHO0lBR3BFLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUc7SUFFekIsT0FBTyxDQUFDLEdBQUc7SUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQW9CO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLEVBQ1IseUNBQXlDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBR25FLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxHQUFHLENBQ1QsQ0FBb0IscUJBQ3BCLElBQUksRUFBRSxzQ0FBc0MsRUFBRSxNQUFNLENBQUMsYUFBYTtJQUV0RSxDQUFDO0lBQ0QsT0FBTyxDQUFDLEdBQUc7QUFDYixDQUFDO2VBRWMsT0FBTyxDQUFDLE9BQWUsRUFBRSxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDcEQsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQ1YsMENBQTBDLEVBQUUsT0FBTyxNQUNuRCx5QkFBeUIsRUFBRSxPQUFPO0lBRXZDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLEdBQUcsRUFBRSxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVE7WUFDYixDQUFLO1lBQ0wsQ0FBSTtlQUNELEdBQUcsQ0FBQyxXQUFXO1lBQ2xCLENBQVc7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNO0lBQ25DLE9BQU8sQ0FBQyxLQUFLO0lBRWIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPO0FBQ3ZCLENBQUMifQ==