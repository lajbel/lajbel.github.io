const { build , run , readAll  } = Deno;
/**
 * Get the single process information.
 * Requires `--allow-run` flag
 * @param pid
 */ export async function get(pid) {
    return (await getAll()).find((v)=>v.pid === pid
    );
}
/**
 * Get process list
 * Requires `--allow-run` flag
 */ export async function getAll() {
    const commands = build.os == "windows" ? [
        "wmic.exe",
        "PROCESS",
        "GET",
        "Name,ProcessId,ParentProcessId,Status"
    ] : [
        "ps",
        "-A",
        "-o",
        "comm,ppid,pid,stat"
    ];
    const ps = run({
        cmd: commands,
        stdout: "piped"
    });
    const output = new TextDecoder().decode(await readAll(ps.stdout));
    const { success , code  } = await ps.status();
    ps.stdout?.close();
    ps.close();
    if (!success || code !== 0) {
        throw new Error("Fail to get process.");
    }
    const lines = output.split("\n").filter((v)=>v.trim()
    );
    lines.shift();
    const processList = lines.map((line)=>{
        const columns = line.trim().split(/\s+/);
        return {
            command: columns[0],
            ppid: +columns[1],
            pid: +columns[2],
            stat: columns[3]
        };
    });
    return processList;
}
/**
 * Get process tree
 * Requires `--allow-run` flag
 */ export async function getTree() {
    const items = await getAll();
    const nest = (items, pid = 0)=>{
        return items.filter((item)=>item.ppid === pid
        ).map((item)=>{
            const children = nest(items, item.pid);
            if (!children.length) {
                return item;
            } else {
                return {
                    ...item,
                    children
                };
            }
        });
    };
    return nest(items);
}
function getKillCommand(pidOrName, options = {
}) {
    const killByName = typeof pidOrName === "string";
    if (build.os === "windows") {
        const commands = [
            "taskkill"
        ];
        if (options.force) {
            commands.push("/f");
        }
        if (options.tree) {
            commands.push("/t");
        }
        commands.push(killByName ? "/im" : "/pid", pidOrName + "");
        return commands;
    } else if (build.os === "linux") {
        const commands = [
            killByName ? "killall" : "kill"
        ];
        if (options.force) {
            commands.push("-9");
        }
        if (killByName && options.ignoreCase) {
            commands.push("-I");
        }
        commands.push(pidOrName + "");
        return commands;
    } else {
        const commands = [
            killByName ? "pkill" : "kill"
        ];
        if (options.force) {
            commands.push("-9");
        }
        if (killByName && options.ignoreCase) {
            commands.push("-i");
        }
        commands.push(pidOrName + "");
        return commands;
    }
}
/**
 * kill process
 * Requires `--allow-run` flag
 * @param pidOrName pid or process name
 * @param options
 */ export async function kill(pidOrName, options = {
}) {
    const commands = getKillCommand(pidOrName, options);
    const ps = run({
        cmd: commands,
        stderr: "piped"
    });
    const { success , code  } = await ps.status();
    ps.stderr?.close();
    ps.close();
    if (!success || code !== 0) {
        const msg = new TextDecoder().decode(await readAll(ps.stderr));
        throw new Error(msg || "exit with code: " + code);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcHJvY2Vzc0B2MC4zLjAvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgYnVpbGQsIHJ1biwgcmVhZEFsbCB9ID0gRGVubztcblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzIHtcbiAgY29tbWFuZDogc3RyaW5nOyAvLyBDb21tYW5kIHRvIHJ1biB0aGlzIHByb2Nlc3NcbiAgcHBpZDogbnVtYmVyOyAvLyBUaGUgcGFyZW50IHByb2Nlc3MgSUQgb2YgdGhlIHByb2Nlc3NcbiAgcGlkOiBudW1iZXI7IC8vIFByb2Nlc3MgSURcbiAgc3RhdDogc3RyaW5nOyAvLyBQcm9jZXNzIHN0YXR1c1xuICBjaGlsZHJlbj86IFByb2Nlc3NbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLaWxsT3B0aW9ucyB7XG4gIGZvcmNlPzogYm9vbGVhbjtcbiAgaWdub3JlQ2FzZT86IGJvb2xlYW47XG4gIHRyZWU/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEdldCB0aGUgc2luZ2xlIHByb2Nlc3MgaW5mb3JtYXRpb24uXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1ydW5gIGZsYWdcbiAqIEBwYXJhbSBwaWRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldChwaWQ6IG51bWJlcik6IFByb21pc2U8UHJvY2VzcyB8IHZvaWQ+IHtcbiAgcmV0dXJuIChhd2FpdCBnZXRBbGwoKSkuZmluZCgodikgPT4gdi5waWQgPT09IHBpZCk7XG59XG5cbi8qKlxuICogR2V0IHByb2Nlc3MgbGlzdFxuICogUmVxdWlyZXMgYC0tYWxsb3ctcnVuYCBmbGFnXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGwoKTogUHJvbWlzZTxQcm9jZXNzW10+IHtcbiAgY29uc3QgY29tbWFuZHMgPSBidWlsZC5vcyA9PSBcIndpbmRvd3NcIlxuICAgID8gW1wid21pYy5leGVcIiwgXCJQUk9DRVNTXCIsIFwiR0VUXCIsIFwiTmFtZSxQcm9jZXNzSWQsUGFyZW50UHJvY2Vzc0lkLFN0YXR1c1wiXVxuICAgIDogW1wicHNcIiwgXCItQVwiLCBcIi1vXCIsIFwiY29tbSxwcGlkLHBpZCxzdGF0XCJdO1xuXG4gIGNvbnN0IHBzID0gcnVuKHtcbiAgICBjbWQ6IGNvbW1hbmRzLFxuICAgIHN0ZG91dDogXCJwaXBlZFwiLFxuICB9KTtcblxuICBjb25zdCBvdXRwdXQgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYXdhaXQgcmVhZEFsbChwcy5zdGRvdXQhKSk7XG5cbiAgY29uc3QgeyBzdWNjZXNzLCBjb2RlIH0gPSBhd2FpdCBwcy5zdGF0dXMoKTtcblxuICBwcy5zdGRvdXQ/LmNsb3NlKCk7XG5cbiAgcHMuY2xvc2UoKTtcblxuICBpZiAoIXN1Y2Nlc3MgfHwgY29kZSAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWwgdG8gZ2V0IHByb2Nlc3MuXCIpO1xuICB9XG5cbiAgY29uc3QgbGluZXMgPSBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKCh2OiBzdHJpbmcpOiBzdHJpbmcgPT4gdi50cmltKCkpO1xuICBsaW5lcy5zaGlmdCgpO1xuXG4gIGNvbnN0IHByb2Nlc3NMaXN0OiBQcm9jZXNzW10gPSBsaW5lcy5tYXAoXG4gICAgKGxpbmU6IHN0cmluZyk6IFByb2Nlc3MgPT4ge1xuICAgICAgY29uc3QgY29sdW1ucyA9IGxpbmUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb21tYW5kOiBjb2x1bW5zWzBdLFxuICAgICAgICBwcGlkOiArY29sdW1uc1sxXSxcbiAgICAgICAgcGlkOiArY29sdW1uc1syXSxcbiAgICAgICAgc3RhdDogY29sdW1uc1szXSxcbiAgICAgIH07XG4gICAgfSxcbiAgKTtcblxuICByZXR1cm4gcHJvY2Vzc0xpc3Q7XG59XG5cbi8qKlxuICogR2V0IHByb2Nlc3MgdHJlZVxuICogUmVxdWlyZXMgYC0tYWxsb3ctcnVuYCBmbGFnXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUcmVlKCk6IFByb21pc2U8UHJvY2Vzc1tdPiB7XG4gIGNvbnN0IGl0ZW1zID0gYXdhaXQgZ2V0QWxsKCk7XG4gIGNvbnN0IG5lc3QgPSAoaXRlbXM6IFByb2Nlc3NbXSwgcGlkOiBudW1iZXIgPSAwKTogUHJvY2Vzc1tdID0+IHtcbiAgICByZXR1cm4gaXRlbXNcbiAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0ucHBpZCA9PT0gcGlkKVxuICAgICAgLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IG5lc3QoaXRlbXMsIGl0ZW0ucGlkKTtcbiAgICAgICAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4geyAuLi5pdGVtLCBjaGlsZHJlbiB9O1xuICAgICAgICB9XG4gICAgICB9KSBhcyBQcm9jZXNzW107XG4gIH07XG5cbiAgcmV0dXJuIG5lc3QoaXRlbXMpO1xufVxuXG5mdW5jdGlvbiBnZXRLaWxsQ29tbWFuZChcbiAgcGlkT3JOYW1lOiBudW1iZXIgfCBzdHJpbmcsXG4gIG9wdGlvbnM6IEtpbGxPcHRpb25zID0ge30sXG4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGtpbGxCeU5hbWUgPSB0eXBlb2YgcGlkT3JOYW1lID09PSBcInN0cmluZ1wiO1xuICBpZiAoYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gICAgY29uc3QgY29tbWFuZHMgPSBbXCJ0YXNra2lsbFwiXTtcblxuICAgIGlmIChvcHRpb25zLmZvcmNlKSB7XG4gICAgICBjb21tYW5kcy5wdXNoKFwiL2ZcIik7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMudHJlZSkge1xuICAgICAgY29tbWFuZHMucHVzaChcIi90XCIpO1xuICAgIH1cblxuICAgIGNvbW1hbmRzLnB1c2goa2lsbEJ5TmFtZSA/IFwiL2ltXCIgOiBcIi9waWRcIiwgcGlkT3JOYW1lICsgXCJcIik7XG5cbiAgICByZXR1cm4gY29tbWFuZHM7XG4gIH0gZWxzZSBpZiAoYnVpbGQub3MgPT09IFwibGludXhcIikge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gW2tpbGxCeU5hbWUgPyBcImtpbGxhbGxcIiA6IFwia2lsbFwiXTtcblxuICAgIGlmIChvcHRpb25zLmZvcmNlKSB7XG4gICAgICBjb21tYW5kcy5wdXNoKFwiLTlcIik7XG4gICAgfVxuXG4gICAgaWYgKGtpbGxCeU5hbWUgJiYgb3B0aW9ucy5pZ25vcmVDYXNlKSB7XG4gICAgICBjb21tYW5kcy5wdXNoKFwiLUlcIik7XG4gICAgfVxuXG4gICAgY29tbWFuZHMucHVzaChwaWRPck5hbWUgKyBcIlwiKTtcblxuICAgIHJldHVybiBjb21tYW5kcztcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjb21tYW5kcyA9IFtraWxsQnlOYW1lID8gXCJwa2lsbFwiIDogXCJraWxsXCJdO1xuXG4gICAgaWYgKG9wdGlvbnMuZm9yY2UpIHtcbiAgICAgIGNvbW1hbmRzLnB1c2goXCItOVwiKTtcbiAgICB9XG5cbiAgICBpZiAoa2lsbEJ5TmFtZSAmJiBvcHRpb25zLmlnbm9yZUNhc2UpIHtcbiAgICAgIGNvbW1hbmRzLnB1c2goXCItaVwiKTtcbiAgICB9XG5cbiAgICBjb21tYW5kcy5wdXNoKHBpZE9yTmFtZSArIFwiXCIpO1xuXG4gICAgcmV0dXJuIGNvbW1hbmRzO1xuICB9XG59XG5cbi8qKlxuICoga2lsbCBwcm9jZXNzXG4gKiBSZXF1aXJlcyBgLS1hbGxvdy1ydW5gIGZsYWdcbiAqIEBwYXJhbSBwaWRPck5hbWUgcGlkIG9yIHByb2Nlc3MgbmFtZVxuICogQHBhcmFtIG9wdGlvbnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGtpbGwoXG4gIHBpZE9yTmFtZTogbnVtYmVyIHwgc3RyaW5nLFxuICBvcHRpb25zOiBLaWxsT3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbW1hbmRzID0gZ2V0S2lsbENvbW1hbmQocGlkT3JOYW1lLCBvcHRpb25zKTtcblxuICBjb25zdCBwcyA9IHJ1bih7XG4gICAgY21kOiBjb21tYW5kcyxcbiAgICBzdGRlcnI6IFwicGlwZWRcIixcbiAgfSk7XG5cbiAgY29uc3QgeyBzdWNjZXNzLCBjb2RlIH0gPSBhd2FpdCBwcy5zdGF0dXMoKTtcblxuICBwcy5zdGRlcnI/LmNsb3NlKCk7XG5cbiAgcHMuY2xvc2UoKTtcblxuICBpZiAoIXN1Y2Nlc3MgfHwgY29kZSAhPT0gMCkge1xuICAgIGNvbnN0IG1zZyA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShhd2FpdCByZWFkQWxsKHBzLnN0ZGVyciEpKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnIHx8IFwiZXhpdCB3aXRoIGNvZGU6IFwiICsgY29kZSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRSxHQUFHLEdBQUUsT0FBTyxFQUFDLENBQUMsR0FBRyxJQUFJO0FBZ0JwQyxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsQ0FDSCxNQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBVyxFQUEyQixDQUFDO0lBQy9ELE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDLEdBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHOztBQUNuRCxDQUFDO0FBRUQsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csQ0FDSCxNQUFNLGdCQUFnQixNQUFNLEdBQXVCLENBQUM7SUFDbEQsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQVMsV0FDbEMsQ0FBQztRQUFBLENBQVU7UUFBRSxDQUFTO1FBQUUsQ0FBSztRQUFFLENBQXVDO0lBQUEsQ0FBQyxHQUN2RSxDQUFDO1FBQUEsQ0FBSTtRQUFFLENBQUk7UUFBRSxDQUFJO1FBQUUsQ0FBb0I7SUFBQSxDQUFDO0lBRTVDLEtBQUssQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENB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