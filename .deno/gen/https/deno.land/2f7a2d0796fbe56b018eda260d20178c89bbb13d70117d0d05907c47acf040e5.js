import { escape } from "./util.ts";
import { log } from "./logger.ts";
export var DenoOptions;
(function (DenoOptions) {
    DenoOptions["allow"] = "allow";
    DenoOptions["cachedOnly"] = "cachedOnly";
    DenoOptions["cert"] = "cert";
    DenoOptions["config"] = "config";
    DenoOptions["importMap"] = "importMap";
    DenoOptions["imap"] = "imap";
    DenoOptions["inspect"] = "inspect";
    DenoOptions["inspectBrk"] = "inspectBrk";
    DenoOptions["lock"] = "lock";
    DenoOptions["log"] = "log";
    DenoOptions["noCheck"] = "noCheck";
    DenoOptions["noRemote"] = "noRemote";
    DenoOptions["quiet"] = "quiet";
    DenoOptions["reload"] = "reload";
    DenoOptions["tsconfig"] = "tsconfig";
    DenoOptions["unstable"] = "unstable";
    DenoOptions["v8Flags"] = "v8Flags";
    DenoOptions["watch"] = "watch";
    DenoOptions["shuffle"] = "shuffle";
})(DenoOptions || (DenoOptions = {}));
export const denoCmdOptions = {
    bundle: [
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.watch,
    ],
    install: [
        DenoOptions.allow,
        DenoOptions.cachedOnly,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.v8Flags,
    ],
    run: [
        DenoOptions.allow,
        DenoOptions.cachedOnly,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.v8Flags,
        DenoOptions.watch,
    ],
    test: [
        DenoOptions.allow,
        DenoOptions.cachedOnly,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.v8Flags,
        DenoOptions.shuffle,
    ],
    cache: [
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
    ],
    doc: [
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.log,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.unstable,
    ],
    eval: [
        DenoOptions.cachedOnly,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.v8Flags,
    ],
    repl: [
        DenoOptions.cachedOnly,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.tsconfig,
        DenoOptions.unstable,
        DenoOptions.v8Flags,
    ],
    fmt: [
        DenoOptions.config,
        DenoOptions.log,
        DenoOptions.quiet,
        DenoOptions.unstable,
        DenoOptions.watch,
    ],
    lint: [
        DenoOptions.config,
        DenoOptions.log,
        DenoOptions.quiet,
        DenoOptions.unstable,
        DenoOptions.watch,
    ],
    types: [
        DenoOptions.log,
        DenoOptions.quiet,
        DenoOptions.unstable,
    ],
    info: [
        DenoOptions.cert,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.log,
        DenoOptions.quiet,
        DenoOptions.reload,
        DenoOptions.unstable,
    ],
};
export const denoOption = {
    ...DenoOptions,
    [DenoOptions.allow]: "allow-",
    [DenoOptions.importMap]: "import-map",
    [DenoOptions.imap]: "import-map",
    [DenoOptions.inspectBrk]: "inspect-brk",
    [DenoOptions.log]: "log-level",
    [DenoOptions.tsconfig]: "config",
    [DenoOptions.v8Flags]: "v8-flags",
    [DenoOptions.noCheck]: "no-check",
    [DenoOptions.noRemote]: "no-remote",
    [DenoOptions.cachedOnly]: "cached-only",
};
export const optionTypes = {
    multiArgObject: [DenoOptions.allow],
    singleArgObject: [DenoOptions.v8Flags],
    boolean: [
        DenoOptions.cachedOnly,
        DenoOptions.noCheck,
        DenoOptions.noRemote,
        DenoOptions.quiet,
        DenoOptions.unstable,
        DenoOptions.watch,
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.reload,
        DenoOptions.watch,
    ],
    string: [
        DenoOptions.inspect,
        DenoOptions.inspectBrk,
        DenoOptions.reload,
        DenoOptions.watch,
        DenoOptions.cert,
        DenoOptions.config,
        DenoOptions.tsconfig,
        DenoOptions.importMap,
        DenoOptions.imap,
        DenoOptions.lock,
        DenoOptions.log,
        DenoOptions.shuffle,
    ],
    strings: [
        DenoOptions.reload,
        DenoOptions.watch,
    ],
};
const deprecatedOptionNames = {
    [DenoOptions.imap]: DenoOptions.importMap,
    [DenoOptions.tsconfig]: DenoOptions.config,
};
export function buildCommandString(command) {
    let cmd = command.cmd.concat(), match;
    if (match = matchCompactRun(cmd)) {
        cmd = "deno run " + cmd;
    }
    if (match = matchDenoCommand(cmd)) {
        const subCommand = match[1];
        if (subCommand && subCommand in denoCmdOptions) {
            const insertAt = match[0].length;
            const options = denoCmdOptions[subCommand];
            for (const optionName of options) {
                const option = command[optionName];
                if (option) {
                    if (optionName in deprecatedOptionNames) {
                        const newName = deprecatedOptionNames[optionName];
                        log.warning(`The \`${optionName}\` option is deprecated in favor of \`${newName}\`. Please use \`${newName}\` going forward as \`${optionName}\` will be removed with the release of 2.0.0.`);
                    }
                    if (optionTypes.multiArgObject.includes(optionName)) {
                        const flags = generateFlagOptions(option, denoOption[optionName]);
                        if (flags && flags.length > 0) {
                            cmd = insertOptions(cmd, insertAt, ...flags);
                        }
                        continue;
                    }
                    if (optionTypes.singleArgObject.includes(optionName)) {
                        const flags = generateFlagOptions(option);
                        if (flags && flags.length > 0) {
                            cmd = insertOptions(cmd, insertAt, `--${denoOption[optionName]}=${flags.join(",")}`);
                        }
                        continue;
                    }
                    if (optionTypes.boolean.includes(optionName) && option === true) {
                        cmd = insertOptions(cmd, insertAt, `--${denoOption[optionName]}`);
                        continue;
                    }
                    if (optionTypes.string.includes(optionName) &&
                        typeof option === "string") {
                        cmd = insertOptions(cmd, insertAt, `--${denoOption[optionName]}=${escapeCliOption(option)}`);
                        continue;
                    }
                    if (optionTypes.strings.includes(optionName) && Array.isArray(option)) {
                        cmd = insertOptions(cmd, insertAt, `--${denoOption[optionName]}=${option.map(escapeCliOption).join(",")}`);
                    }
                }
            }
        }
    }
    return cmd;
}
function insertOptions(command, atPosition, ...options) {
    return command.slice(0, atPosition) + " " + options.join(" ") +
        command.slice(atPosition);
}
function generateFlagOptions(flags, prefix = "") {
    return Object.entries(flags).map(([k, v]) => `--${prefix}${k}${v !== true ? `="${escapeCliOption(v.toString())}"` : ""}`);
}
function matchDenoCommand(command) {
    return command.match(/^deno +(\w+)/);
}
function matchCompactRun(command) {
    return command.match(/^'(?:\\'|.)*?\.[tj]s'|^"(?:\\"|.)*?\.[tj]s"|^(?:\\\ |\S)+\.[tj]s/);
}
function escapeCliOption(option) {
    return escape(option, '"', " ");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRfY29tbWFuZF9zdHJpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZF9jb21tYW5kX3N0cmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25DLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFbEMsTUFBTSxDQUFOLElBQVksV0FvQlg7QUFwQkQsV0FBWSxXQUFXO0lBQ3JCLDhCQUFlLENBQUE7SUFDZix3Q0FBeUIsQ0FBQTtJQUN6Qiw0QkFBYSxDQUFBO0lBQ2IsZ0NBQWlCLENBQUE7SUFDakIsc0NBQXVCLENBQUE7SUFDdkIsNEJBQWEsQ0FBQTtJQUNiLGtDQUFtQixDQUFBO0lBQ25CLHdDQUF5QixDQUFBO0lBQ3pCLDRCQUFhLENBQUE7SUFDYiwwQkFBVyxDQUFBO0lBQ1gsa0NBQW1CLENBQUE7SUFDbkIsb0NBQXFCLENBQUE7SUFDckIsOEJBQWUsQ0FBQTtJQUNmLGdDQUFpQixDQUFBO0lBQ2pCLG9DQUFxQixDQUFBO0lBQ3JCLG9DQUFxQixDQUFBO0lBQ3JCLGtDQUFtQixDQUFBO0lBQ25CLDhCQUFlLENBQUE7SUFDZixrQ0FBbUIsQ0FBQTtBQUNyQixDQUFDLEVBcEJXLFdBQVcsS0FBWCxXQUFXLFFBb0J0QjtBQUVELE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBa0M7SUFDM0QsTUFBTSxFQUFFO1FBQ04sV0FBVyxDQUFDLElBQUk7UUFDaEIsV0FBVyxDQUFDLE1BQU07UUFDbEIsV0FBVyxDQUFDLFNBQVM7UUFDckIsV0FBVyxDQUFDLElBQUk7UUFDaEIsV0FBVyxDQUFDLElBQUk7UUFDaEIsV0FBVyxDQUFDLEdBQUc7UUFDZixXQUFXLENBQUMsT0FBTztRQUNuQixXQUFXLENBQUMsUUFBUTtRQUNwQixXQUFXLENBQUMsS0FBSztRQUNqQixXQUFXLENBQUMsTUFBTTtRQUNsQixXQUFXLENBQUMsUUFBUTtRQUNwQixXQUFX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QUFDO0FBQzlCLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUMxQixLQUFrQixFQUNsQixNQUFNLEdBQUcsRUFBRTtJQUVYLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQzFDLEtBQUssTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLGVBQWUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDNUUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE9BQWU7SUFDdkMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUFlO0lBQ3RDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FDbEIsa0VBQWtFLENBQ25FLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBYztJQUNyQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgRmxhZ3NPYmplY3QsIFNjcmlwdE9wdGlvbnMgfSBmcm9tIFwiLi9zY3JpcHRzX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgZXNjYXBlIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5cbmV4cG9ydCBlbnVtIERlbm9PcHRpb25zIHtcbiAgYWxsb3cgPSBcImFsbG93XCIsXG4gIGNhY2hlZE9ubHkgPSBcImNhY2hlZE9ubHlcIixcbiAgY2VydCA9IFwiY2VydFwiLFxuICBjb25maWcgPSBcImNvbmZpZ1wiLFxuICBpbXBvcnRNYXAgPSBcImltcG9ydE1hcFwiLFxuICBpbWFwID0gXCJpbWFwXCIsXG4gIGluc3BlY3QgPSBcImluc3BlY3RcIixcbiAgaW5zcGVjdEJyayA9IFwiaW5zcGVjdEJya1wiLFxuICBsb2NrID0gXCJsb2NrXCIsXG4gIGxvZyA9IFwibG9nXCIsXG4gIG5vQ2hlY2sgPSBcIm5vQ2hlY2tcIixcbiAgbm9SZW1vdGUgPSBcIm5vUmVtb3RlXCIsXG4gIHF1aWV0ID0gXCJxdWlldFwiLFxuICByZWxvYWQgPSBcInJlbG9hZFwiLFxuICB0c2NvbmZpZyA9IFwidHNjb25maWdcIixcbiAgdW5zdGFibGUgPSBcInVuc3RhYmxlXCIsXG4gIHY4RmxhZ3MgPSBcInY4RmxhZ3NcIixcbiAgd2F0Y2ggPSBcIndhdGNoXCIsXG4gIHNodWZmbGUgPSBcInNodWZmbGVcIixcbn1cblxuZXhwb3J0IGNvbnN0IGRlbm9DbWRPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBEZW5vT3B0aW9uc1tdPiA9IHtcbiAgYnVuZGxlOiBbXG4gICAgRGVub09wdGlvbnMuY2VydCxcbiAgICBEZW5vT3B0aW9ucy5jb25maWcsXG4gICAgRGVub09wdGlvbnMuaW1wb3J0TWFwLFxuICAgIERlbm9PcHRpb25zLmltYXAsXG4gICAgRGVub09wdGlvbnMubG9jayxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMubm9DaGVjayxcbiAgICBEZW5vT3B0aW9ucy5ub1JlbW90ZSxcbiAgICBEZW5vT3B0aW9ucy5xdWlldCxcbiAgICBEZW5vT3B0aW9ucy5yZWxvYWQsXG4gICAgRGVub09wdGlvbnMudHNjb25maWcsXG4gICAgRGVub09wdGlvbnMudW5zdGFibGUsXG4gICAgRGVub09wdGlvbnMud2F0Y2gsXG4gIF0sXG4gIGluc3RhbGw6IFtcbiAgICBEZW5vT3B0aW9ucy5hbGxvdyxcbiAgICBEZW5vT3B0aW9ucy5jYWNoZWRPbmx5LFxuICAgIERlbm9PcHRpb25zLmNlcnQsXG4gICAgRGVub09wdGlvbnMuY29uZmlnLFxuICAgIERlbm9PcHRpb25zLmltcG9ydE1hcCxcbiAgICBEZW5vT3B0aW9ucy5pbWFwLFxuICAgIERlbm9PcHRpb25zLmluc3BlY3QsXG4gICAgRGVub09wdGlvbnMuaW5zcGVjdEJyayxcbiAgICBEZW5vT3B0aW9ucy5sb2NrLFxuICAgIERlbm9PcHRpb25zLmxvZyxcbiAgICBEZW5vT3B0aW9ucy5ub0NoZWNrLFxuICAgIERlbm9PcHRpb25zLm5vUmVtb3RlLFxuICAgIERlbm9PcHRpb25zLnF1aWV0LFxuICAgIERlbm9PcHRpb25zLnJlbG9hZCxcbiAgICBEZW5vT3B0aW9ucy50c2NvbmZpZyxcbiAgICBEZW5vT3B0aW9ucy51bnN0YWJsZSxcbiAgICBEZW5vT3B0aW9ucy52OEZsYWdzLFxuICBdLFxuICBydW46IFtcbiAgICBEZW5vT3B0aW9ucy5hbGxvdyxcbiAgICBEZW5vT3B0aW9ucy5jYWNoZWRPbmx5LFxuICAgIERlbm9PcHRpb25zLmNlcnQsXG4gICAgRGVub09wdGlvbnMuY29uZmlnLFxuICAgIERlbm9PcHRpb25zLmltcG9ydE1hcCxcbiAgICBEZW5vT3B0aW9ucy5pbWFwLFxuICAgIERlbm9PcHRpb25zLmluc3BlY3QsXG4gICAgRGVub09wdGlvbnMuaW5zcGVjdEJyayxcbiAgICBEZW5vT3B0aW9ucy5sb2NrLFxuICAgIERlbm9PcHRpb25zLmxvZyxcbiAgICBEZW5vT3B0aW9ucy5ub0NoZWNrLFxuICAgIERlbm9PcHRpb25zLm5vUmVtb3RlLFxuICAgIERlbm9PcHRpb25zLnF1aWV0LFxuICAgIERlbm9PcHRpb25zLnJlbG9hZCxcbiAgICBEZW5vT3B0aW9ucy50c2NvbmZpZyxcbiAgICBEZW5vT3B0aW9ucy51bnN0YWJsZSxcbiAgICBEZW5vT3B0aW9ucy52OEZsYWdzLFxuICAgIERlbm9PcHRpb25zLndhdGNoLFxuICBdLFxuICB0ZXN0OiBbXG4gICAgRGVub09wdGlvbnMuYWxsb3csXG4gICAgRGVub09wdGlvbnMuY2FjaGVkT25seSxcbiAgICBEZW5vT3B0aW9ucy5jZXJ0LFxuICAgIERlbm9PcHRpb25zLmNvbmZpZyxcbiAgICBEZW5vT3B0aW9ucy5pbXBvcnRNYXAsXG4gICAgRGVub09wdGlvbnMuaW1hcCxcbiAgICBEZW5vT3B0aW9ucy5pbnNwZWN0LFxuICAgIERlbm9PcHRpb25zLmluc3BlY3RCcmssXG4gICAgRGVub09wdGlvbnMubG9jayxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMubm9DaGVjayxcbiAgICBEZW5vT3B0aW9ucy5ub1JlbW90ZSxcbiAgICBEZW5vT3B0aW9ucy5xdWlldCxcbiAgICBEZW5vT3B0aW9ucy5yZWxvYWQsXG4gICAgRGVub09wdGlvbnMudHNjb25maWcsXG4gICAgRGVub09wdGlvbnMudW5zdGFibGUsXG4gICAgRGVub09wdGlvbnMudjhGbGFncyxcbiAgICBEZW5vT3B0aW9ucy5zaHVmZmxlLFxuICBdLFxuICBjYWNoZTogW1xuICAgIERlbm9PcHRpb25zLmNlcnQsXG4gICAgRGVub09wdGlvbnMuY29uZmlnLFxuICAgIERlbm9PcHRpb25zLmltcG9ydE1hcCxcbiAgICBEZW5vT3B0aW9ucy5pbWFwLFxuICAgIERlbm9PcHRpb25zLmxvY2ssXG4gICAgRGVub09wdGlvbnMubG9nLFxuICAgIERlbm9PcHRpb25zLm5vQ2hlY2ssXG4gICAgRGVub09wdGlvbnMubm9SZW1vdGUsXG4gICAgRGVub09wdGlvbnMucXVpZXQsXG4gICAgRGVub09wdGlvbnMucmVsb2FkLFxuICAgIERlbm9PcHRpb25zLnRzY29uZmlnLFxuICAgIERlbm9PcHRpb25zLnVuc3RhYmxlLFxuICBdLFxuICBkb2M6IFtcbiAgICBEZW5vT3B0aW9ucy5pbXBvcnRNYXAsXG4gICAgRGVub09wdGlvbnMuaW1hcCxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMucXVpZXQsXG4gICAgRGVub09wdGlvbnMucmVsb2FkLFxuICAgIERlbm9PcHRpb25zLnVuc3RhYmxlLFxuICBdLFxuICBldmFsOiBbXG4gICAgRGVub09wdGlvbnMuY2FjaGVkT25seSxcbiAgICBEZW5vT3B0aW9ucy5jZXJ0LFxuICAgIERlbm9PcHRpb25zLmNvbmZpZyxcbiAgICBEZW5vT3B0aW9ucy5pbXBvcnRNYXAsXG4gICAgRGVub09wdGlvbnMuaW1hcCxcbiAgICBEZW5vT3B0aW9ucy5pbnNwZWN0LFxuICAgIERlbm9PcHRpb25zLmluc3BlY3RCcmssXG4gICAgRGVub09wdGlvbnMubG9jayxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMubm9DaGVjayxcbiAgICBEZW5vT3B0aW9ucy5ub1JlbW90ZSxcbiAgICBEZW5vT3B0aW9ucy5xdWlldCxcbiAgICBEZW5vT3B0aW9ucy5yZWxvYWQsXG4gICAgRGVub09wdGlvbnMudHNjb25maWcsXG4gICAgRGVub09wdGlvbnMudW5zdGFibGUsXG4gICAgRGVub09wdGlvbnMudjhGbGFncyxcbiAgXSxcbiAgcmVwbDogW1xuICAgIERlbm9PcHRpb25zLmNhY2hlZE9ubHksXG4gICAgRGVub09wdGlvbnMuY2VydCxcbiAgICBEZW5vT3B0aW9ucy5jb25maWcsXG4gICAgRGVub09wdGlvbnMuaW1wb3J0TWFwLFxuICAgIERlbm9PcHRpb25zLmltYXAsXG4gICAgRGVub09wdGlvbnMuaW5zcGVjdCxcbiAgICBEZW5vT3B0aW9ucy5pbnNwZWN0QnJrLFxuICAgIERlbm9PcHRpb25zLmxvY2ssXG4gICAgRGVub09wdGlvbnMubG9nLFxuICAgIERlbm9PcHRpb25zLm5vQ2hlY2ssXG4gICAgRGVub09wdGlvbnMubm9SZW1vdGUsXG4gICAgRGVub09wdGlvbnMucXVpZXQsXG4gICAgRGVub09wdGlvbnMucmVsb2FkLFxuICAgIERlbm9PcHRpb25zLnRzY29uZmlnLFxuICAgIERlbm9PcHRpb25zLnVuc3RhYmxlLFxuICAgIERlbm9PcHRpb25zLnY4RmxhZ3MsXG4gIF0sXG4gIGZtdDogW1xuICAgIERlbm9PcHRpb25zLmNvbmZpZyxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMucXVpZXQsXG4gICAgRGVub09wdGlvbnMudW5zdGFibGUsXG4gICAgRGVub09wdGlvbnMud2F0Y2gsXG4gIF0sXG4gIGxpbnQ6IFtcbiAgICBEZW5vT3B0aW9ucy5jb25maWcsXG4gICAgRGVub09wdGlvbnMubG9nLFxuICAgIERlbm9PcHRpb25zLnF1aWV0LFxuICAgIERlbm9PcHRpb25zLnVuc3RhYmxlLFxuICAgIERlbm9PcHRpb25zLndhdGNoLFxuICBdLFxuICB0eXBlczogW1xuICAgIERlbm9PcHRpb25zLmxvZyxcbiAgICBEZW5vT3B0aW9ucy5xdWlldCxcbiAgICBEZW5vT3B0aW9ucy51bnN0YWJsZSxcbiAgXSxcbiAgaW5mbzogW1xuICAgIERlbm9PcHRpb25zLmNlcnQsXG4gICAgRGVub09wdGlvbnMuaW1wb3J0TWFwLFxuICAgIERlbm9PcHRpb25zLmltYXAsXG4gICAgRGVub09wdGlvbnMubG9nLFxuICAgIERlbm9PcHRpb25zLnF1aWV0LFxuICAgIERlbm9PcHRpb25zLnJlbG9hZCxcbiAgICBEZW5vT3B0aW9ucy51bnN0YWJsZSxcbiAgXSxcbn07XG5cbmV4cG9ydCBjb25zdCBkZW5vT3B0aW9uOiBSZWNvcmQ8RGVub09wdGlvbnMsIHN0cmluZz4gPSB7XG4gIC4uLkRlbm9PcHRpb25zLFxuICBbRGVub09wdGlvbnMuYWxsb3ddOiBcImFsbG93LVwiLFxuICBbRGVub09wdGlvbnMuaW1wb3J0TWFwXTogXCJpbXBvcnQtbWFwXCIsXG4gIFtEZW5vT3B0aW9ucy5pbWFwXTogXCJpbXBvcnQtbWFwXCIsXG4gIFtEZW5vT3B0aW9ucy5pbnNwZWN0QnJrXTogXCJpbnNwZWN0LWJya1wiLFxuICBbRGVub09wdGlvbnMubG9nXTogXCJsb2ctbGV2ZWxcIixcbiAgW0Rlbm9PcHRpb25zLnRzY29uZmlnXTogXCJjb25maWdcIixcbiAgW0Rlbm9PcHRpb25zLnY4RmxhZ3NdOiBcInY4LWZsYWdzXCIsXG4gIFtEZW5vT3B0aW9ucy5ub0NoZWNrXTogXCJuby1jaGVja1wiLFxuICBbRGVub09wdGlvbnMubm9SZW1vdGVdOiBcIm5vLXJlbW90ZVwiLFxuICBbRGVub09wdGlvbnMuY2FjaGVkT25seV06IFwiY2FjaGVkLW9ubHlcIixcbn07XG5cbmV4cG9ydCBjb25zdCBvcHRpb25UeXBlcyA9IHtcbiAgbXVsdGlBcmdPYmplY3Q6IFtEZW5vT3B0aW9ucy5hbGxvd10sXG4gIHNpbmdsZUFyZ09iamVjdDogW0Rlbm9PcHRpb25zLnY4RmxhZ3NdLFxuICBib29sZWFuOiBbXG4gICAgRGVub09wdGlvbnMuY2FjaGVkT25seSxcbiAgICBEZW5vT3B0aW9ucy5ub0NoZWNrLFxuICAgIERlbm9PcHRpb25zLm5vUmVtb3RlLFxuICAgIERlbm9PcHRpb25zLnF1aWV0LFxuICAgIERlbm9PcHRpb25zLnVuc3RhYmxlLFxuICAgIERlbm9PcHRpb25zLndhdGNoLFxuICAgIERlbm9PcHRpb25zLmluc3BlY3QsXG4gICAgRGVub09wdGlvbnMuaW5zcGVjdEJyayxcbiAgICBEZW5vT3B0aW9ucy5yZWxvYWQsXG4gICAgRGVub09wdGlvbnMud2F0Y2gsXG4gIF0sXG4gIHN0cmluZzogW1xuICAgIERlbm9PcHRpb25zLmluc3BlY3QsXG4gICAgRGVub09wdGlvbnMuaW5zcGVjdEJyayxcbiAgICBEZW5vT3B0aW9ucy5yZWxvYWQsXG4gICAgRGVub09wdGlvbnMud2F0Y2gsXG4gICAgRGVub09wdGlvbnMuY2VydCxcbiAgICBEZW5vT3B0aW9ucy5jb25maWcsXG4gICAgRGVub09wdGlvbnMudHNjb25maWcsXG4gICAgRGVub09wdGlvbnMuaW1wb3J0TWFwLFxuICAgIERlbm9PcHRpb25zLmltYXAsXG4gICAgRGVub09wdGlvbnMubG9jayxcbiAgICBEZW5vT3B0aW9ucy5sb2csXG4gICAgRGVub09wdGlvbnMuc2h1ZmZsZSxcbiAgXSxcbiAgc3RyaW5nczogW1xuICAgIERlbm9PcHRpb25zLnJlbG9hZCxcbiAgICBEZW5vT3B0aW9ucy53YXRjaCxcbiAgXSxcbn07XG5cbmNvbnN0IGRlcHJlY2F0ZWRPcHRpb25OYW1lcyA9IHtcbiAgW0Rlbm9PcHRpb25zLmltYXBdOiBEZW5vT3B0aW9ucy5pbXBvcnRNYXAsXG4gIFtEZW5vT3B0aW9ucy50c2NvbmZpZ106IERlbm9PcHRpb25zLmNvbmZpZyxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZENvbW1hbmRTdHJpbmcoY29tbWFuZDogQ29tbWFuZCk6IHN0cmluZyB7XG4gIGxldCBjbWQgPSBjb21tYW5kLmNtZC5jb25jYXQoKSwgbWF0Y2g7XG4gIGlmIChtYXRjaCA9IG1hdGNoQ29tcGFjdFJ1bihjbWQpKSB7XG4gICAgY21kID0gXCJkZW5vIHJ1biBcIiArIGNtZDtcbiAgfVxuICBpZiAobWF0Y2ggPSBtYXRjaERlbm9Db21tYW5kKGNtZCkpIHtcbiAgICBjb25zdCBzdWJDb21tYW5kID0gbWF0Y2hbMV07XG4gICAgaWYgKHN1YkNvbW1hbmQgJiYgc3ViQ29tbWFuZCBpbiBkZW5vQ21kT3B0aW9ucykge1xuICAgICAgY29uc3QgaW5zZXJ0QXQgPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICBjb25zdCBvcHRpb25zID0gZGVub0NtZE9wdGlvbnNbc3ViQ29tbWFuZF07XG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgb2Ygb3B0aW9ucykge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBjb21tYW5kW29wdGlvbk5hbWUgYXMga2V5b2YgU2NyaXB0T3B0aW9uc107XG4gICAgICAgIGlmIChvcHRpb24pIHtcbiAgICAgICAgICBpZiAob3B0aW9uTmFtZSBpbiBkZXByZWNhdGVkT3B0aW9uTmFtZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld05hbWUgPVxuICAgICAgICAgICAgICBkZXByZWNhdGVkT3B0aW9uTmFtZXNbXG4gICAgICAgICAgICAgICAgb3B0aW9uTmFtZSBhcyBrZXlvZiB0eXBlb2YgZGVwcmVjYXRlZE9wdGlvbk5hbWVzXG4gICAgICAgICAgICAgIF07XG4gICAgICAgICAgICBsb2cud2FybmluZyhcbiAgICAgICAgICAgICAgYFRoZSBcXGAke29wdGlvbk5hbWV9XFxgIG9wdGlvbiBpcyBkZXByZWNhdGVkIGluIGZhdm9yIG9mIFxcYCR7bmV3TmFtZX1cXGAuIFBsZWFzZSB1c2UgXFxgJHtuZXdOYW1lfVxcYCBnb2luZyBmb3J3YXJkIGFzIFxcYCR7b3B0aW9uTmFtZX1cXGAgd2lsbCBiZSByZW1vdmVkIHdpdGggdGhlIHJlbGVhc2Ugb2YgMi4wLjAuYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9wdGlvblR5cGVzLm11bHRpQXJnT2JqZWN0LmluY2x1ZGVzKG9wdGlvbk5hbWUpKSB7XG4gICAgICAgICAgICBjb25zdCBmbGFncyA9IGdlbmVyYXRlRmxhZ09wdGlvbnMoXG4gICAgICAgICAgICAgIG9wdGlvbiBhcyBGbGFnc09iamVjdCxcbiAgICAgICAgICAgICAgZGVub09wdGlvbltvcHRpb25OYW1lXSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoZmxhZ3MgJiYgZmxhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBjbWQgPSBpbnNlcnRPcHRpb25zKGNtZCwgaW5zZXJ0QXQsIC4uLmZsYWdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvcHRpb25UeXBlcy5zaW5nbGVBcmdPYmplY3QuaW5jbHVkZXMob3B0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gZ2VuZXJhdGVGbGFnT3B0aW9ucyhvcHRpb24gYXMgRmxhZ3NPYmplY3QpO1xuICAgICAgICAgICAgaWYgKGZsYWdzICYmIGZsYWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgY21kID0gaW5zZXJ0T3B0aW9ucyhcbiAgICAgICAgICAgICAgICBjbWQsXG4gICAgICAgICAgICAgICAgaW5zZXJ0QXQsXG4gICAgICAgICAgICAgICAgYC0tJHtkZW5vT3B0aW9uW29wdGlvbk5hbWVdfT0ke2ZsYWdzLmpvaW4oXCIsXCIpfWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob3B0aW9uVHlwZXMuYm9vbGVhbi5pbmNsdWRlcyhvcHRpb25OYW1lKSAmJiBvcHRpb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgIGNtZCA9IGluc2VydE9wdGlvbnMoXG4gICAgICAgICAgICAgIGNtZCxcbiAgICAgICAgICAgICAgaW5zZXJ0QXQsXG4gICAgICAgICAgICAgIGAtLSR7ZGVub09wdGlvbltvcHRpb25OYW1lXX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG9wdGlvblR5cGVzLnN0cmluZy5pbmNsdWRlcyhvcHRpb25OYW1lKSAmJlxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY21kID0gaW5zZXJ0T3B0aW9ucyhcbiAgICAgICAgICAgICAgY21kLFxuICAgICAgICAgICAgICBpbnNlcnRBdCxcbiAgICAgICAgICAgICAgYC0tJHtkZW5vT3B0aW9uW29wdGlvbk5hbWVdfT0ke2VzY2FwZUNsaU9wdGlvbihvcHRpb24pfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3B0aW9uVHlwZXMuc3RyaW5ncy5pbmNsdWRlcyhvcHRpb25OYW1lKSAmJiBBcnJheS5pc0FycmF5KG9wdGlvbilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNtZCA9IGluc2VydE9wdGlvbnMoXG4gICAgICAgICAgICAgIGNtZCxcbiAgICAgICAgICAgICAgaW5zZXJ0QXQsXG4gICAgICAgICAgICAgIGAtLSR7ZGVub09wdGlvbltvcHRpb25OYW1lXX09JHtcbiAgICAgICAgICAgICAgICBvcHRpb24ubWFwKGVzY2FwZUNsaU9wdGlvbikuam9pbihcIixcIilcbiAgICAgICAgICAgICAgfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gY21kO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRPcHRpb25zKFxuICBjb21tYW5kOiBzdHJpbmcsXG4gIGF0UG9zaXRpb246IG51bWJlcixcbiAgLi4ub3B0aW9uczogc3RyaW5nW11cbikge1xuICByZXR1cm4gY29tbWFuZC5zbGljZSgwLCBhdFBvc2l0aW9uKSArIFwiIFwiICsgb3B0aW9ucy5qb2luKFwiIFwiKSArXG4gICAgY29tbWFuZC5zbGljZShhdFBvc2l0aW9uKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVGbGFnT3B0aW9ucyhcbiAgZmxhZ3M6IEZsYWdzT2JqZWN0LFxuICBwcmVmaXggPSBcIlwiLFxuKTogc3RyaW5nW10ge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoZmxhZ3MpLm1hcCgoW2ssIHZdKSA9PlxuICAgIGAtLSR7cHJlZml4fSR7a30ke3YgIT09IHRydWUgPyBgPVwiJHtlc2NhcGVDbGlPcHRpb24odi50b1N0cmluZygpKX1cImAgOiBcIlwifWBcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hEZW5vQ29tbWFuZChjb21tYW5kOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNvbW1hbmQubWF0Y2goL15kZW5vICsoXFx3KykvKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hDb21wYWN0UnVuKGNvbW1hbmQ6IHN0cmluZykge1xuICByZXR1cm4gY29tbWFuZC5tYXRjaChcbiAgICAvXicoPzpcXFxcJ3wuKSo/XFwuW3RqXXMnfF5cIig/OlxcXFxcInwuKSo/XFwuW3RqXXNcInxeKD86XFxcXFxcIHxcXFMpK1xcLlt0al1zLyxcbiAgKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlQ2xpT3B0aW9uKG9wdGlvbjogc3RyaW5nKSB7XG4gIHJldHVybiBlc2NhcGUob3B0aW9uLCAnXCInLCBcIiBcIik7XG59XG4iXX0=