import { exists } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { brightGreen, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";
/** Generate a _config.js file */ export default async function init({ only  }) {
    const path = new URL("..", import.meta.url).href;
    if (only === "config") {
        return await initConfig(path);
    }
    if (only === "vscode") {
        return await initVSCode(path);
    }
    await initConfig(path);
    if (confirm(brightGreen("Do you want to configure VS Code?"))) {
        return await initVSCode(path);
    }
};
/** (Re)configure lume config file */ async function initConfig(path) {
    const configFile = await getConfigFile();
    if (!configFile) {
        console.log();
        console.log("No config file created");
        return;
    }
    // Get the import path style
    path = getLumeUrl(path);
    // Generate the code for the config file
    const code = [
        `import lume from "${posix.join(path, "mod.ts")}";`
    ];
    const plugins = getPlugins();
    plugins.forEach((name)=>code.push(`import ${name} from "${posix.join(path, `plugins/${name}.ts`)}";`)
    );
    code.push("");
    code.push("const site = lume();");
    if (plugins.length) {
        code.push("");
        plugins.sort().forEach((name)=>code.push(`site.use(${name}());`)
        );
    }
    code.push("");
    code.push("export default site;");
    code.push("");
    // Write the code to the file
    await Deno.writeTextFile(configFile, code.join("\n"));
    console.log();
    console.log(brightGreen("Created a config file"), configFile);
}
/** (Re)configure VSCode for Deno/Lume */ async function initVSCode(path) {
    try {
        await Deno.mkdir(".vscode");
    } catch  {
    // Ignore if the directory already exists
    }
    // Enable Deno plugin
    const config = await exists(".vscode/settings.json") ? JSON.parse(await Deno.readTextFile(".vscode/settings.json")) : {
    };
    config["deno.enable"] = true;
    config["deno.lint"] = true;
    config["deno.unstable"] = true;
    config["deno.suggest.imports.hosts"] = {
        "https://deno.land": true
    };
    // Set up the import map
    config["deno.importMap"] = ".vscode/lume_import_map.json";
    const importMap = {
        imports: {
            "lume": posix.join(path, "/mod.ts"),
            "lume/": posix.join(path, "/"),
            "https://deno.land/x/lume/": posix.join(path, "/")
        }
    };
    // Create a launch.json file to debug
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    const baseConfig = {
        request: "launch",
        type: "pwa-node",
        program: posix.join(path, "/cli.ts"),
        cwd: "${workspaceFolder}",
        runtimeExecutable: "deno",
        runtimeArgs: [
            "run",
            "--unstable",
            "--import-map=.vscode/lume_import_map.json",
            "--inspect",
            "--allow-all", 
        ],
        attachSimplePort: 9229
    };
    const launch = {
        "version": "0.2.0",
        "configurations": [
            Object.assign({
            }, baseConfig, {
                name: "Lume build"
            }),
            Object.assign({
            }, baseConfig, {
                name: "Lume serve",
                args: [
                    "--serve"
                ]
            }), 
        ]
    };
    await Deno.writeTextFile(".vscode/settings.json", JSON.stringify(config, null, 2));
    await Deno.writeTextFile(".vscode/lume_import_map.json", JSON.stringify(importMap, null, 2));
    await Deno.writeTextFile(".vscode/launch.json", JSON.stringify(launch, null, 2));
    console.log(brightGreen("VS Code configured"));
}
/** Question to get the style to import lume in the config file */ function getLumeUrl(path) {
    const message = `
${brightGreen("How do you want to import lume?")}
Type a number:
1 ${dim('import lume from "lume/mod.ts"')}
2 ${dim('import lume from "https://deno.land/x/lume/mod.ts"')}
3 ${dim(`import lume from "${posix.join(path, "mod.ts")}"`)}
`;
    const choice = prompt(message, "1");
    switch(choice){
        case "1":
            return "lume";
        case "2":
            return "https://deno.land/x/lume/";
    }
    return path;
}
/** Question to get the list of plugins to install in the config file */ function getPlugins() {
    const message = `
${brightGreen("Do you want to import plugins?")}
Type the plugins you want to use separated by comma.

All available options:
${pluginNames.map((plugin)=>`- ${dim(plugin)} https://lumeland.github.io/plugins/${plugin}/`
    ).join("\n")}

Example: ${dim(`postcss, terser, base_path`)}
`;
    const choice = prompt(message);
    const plugins = choice ? choice.split(/[\s,]+/) : [];
    // Validate the plugins
    return plugins.filter((plugin)=>{
        if (pluginNames.includes(plugin)) {
            return true;
        }
        console.log(red(`Ignored not found plugin ${plugin}.`));
        return false;
    });
}
/** Question to get the filename of the config file */ async function getConfigFile() {
    const configFile = confirm(brightGreen("Use Typescript for the configuration file?")) ? "_config.ts" : "_config.js";
    if (await exists(configFile)) {
        return confirm(brightGreen(`The file "${configFile}" already exist. Override?`)) ? configFile : false;
    }
    return configFile;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY2xpL2luaXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzIH0gZnJvbSBcIi4uL2RlcHMvZnMudHNcIjtcbmltcG9ydCB7IHBvc2l4IH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgYnJpZ2h0R3JlZW4sIGRpbSwgcmVkIH0gZnJvbSBcIi4uL2RlcHMvY29sb3JzLnRzXCI7XG5pbXBvcnQgeyBwbHVnaW5OYW1lcyB9IGZyb20gXCIuL3V0aWxzLnRzXCI7XG5cbmludGVyZmFjZSBPcHRpb25zIHtcbiAgb25seT86IFwiY29uZmlnXCIgfCBcInZzY29kZVwiO1xufVxuXG4vKiogR2VuZXJhdGUgYSBfY29uZmlnLmpzIGZpbGUgKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGluaXQoeyBvbmx5IH06IE9wdGlvbnMpIHtcbiAgY29uc3QgcGF0aCA9IG5ldyBVUkwoXCIuLlwiLCBpbXBvcnQubWV0YS51cmwpLmhyZWY7XG5cbiAgaWYgKG9ubHkgPT09IFwiY29uZmlnXCIpIHtcbiAgICByZXR1cm4gYXdhaXQgaW5pdENvbmZpZyhwYXRoKTtcbiAgfVxuXG4gIGlmIChvbmx5ID09PSBcInZzY29kZVwiKSB7XG4gICAgcmV0dXJuIGF3YWl0IGluaXRWU0NvZGUocGF0aCk7XG4gIH1cblxuICBhd2FpdCBpbml0Q29uZmlnKHBhdGgpO1xuXG4gIGlmIChjb25maXJtKGJyaWdodEdyZWVuKFwiRG8geW91IHdhbnQgdG8gY29uZmlndXJlIFZTIENvZGU/XCIpKSkge1xuICAgIHJldHVybiBhd2FpdCBpbml0VlNDb2RlKHBhdGgpO1xuICB9XG59XG5cbi8qKiAoUmUpY29uZmlndXJlIGx1bWUgY29uZmlnIGZpbGUgKi9cbmFzeW5jIGZ1bmN0aW9uIGluaXRDb25maWcocGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGUgPSBhd2FpdCBnZXRDb25maWdGaWxlKCk7XG5cbiAgaWYgKCFjb25maWdGaWxlKSB7XG4gICAgY29uc29sZS5sb2coKTtcbiAgICBjb25zb2xlLmxvZyhcIk5vIGNvbmZpZyBmaWxlIGNyZWF0ZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBpbXBvcnQgcGF0aCBzdHlsZVxuICBwYXRoID0gZ2V0THVtZVVybChwYXRoKTtcblxuICAvLyBHZW5lcmF0ZSB0aGUgY29kZSBmb3IgdGhlIGNvbmZpZyBmaWxlXG4gIGNvbnN0IGNvZGUgPSBbYGltcG9ydCBsdW1lIGZyb20gXCIke3Bvc2l4LmpvaW4ocGF0aCwgXCJtb2QudHNcIil9XCI7YF07XG5cbiAgY29uc3QgcGx1Z2lucyA9IGdldFBsdWdpbnMoKTtcbiAgcGx1Z2lucy5mb3JFYWNoKChuYW1lKSA9PlxuICAgIGNvZGUucHVzaChcbiAgICAgIGBpbXBvcnQgJHtuYW1lfSBmcm9tIFwiJHtwb3NpeC5qb2luKHBhdGgsIGBwbHVnaW5zLyR7bmFtZX0udHNgKX1cIjtgLFxuICAgIClcbiAgKTtcbiAgY29kZS5wdXNoKFwiXCIpO1xuICBjb2RlLnB1c2goXCJjb25zdCBzaXRlID0gbHVtZSgpO1wiKTtcblxuICBpZiAocGx1Z2lucy5sZW5ndGgpIHtcbiAgICBjb2RlLnB1c2goXCJcIik7XG4gICAgcGx1Z2lucy5zb3J0KCkuZm9yRWFjaCgobmFtZSkgPT4gY29kZS5wdXNoKGBzaXRlLnVzZSgke25hbWV9KCkpO2ApKTtcbiAgfVxuXG4gIGNvZGUucHVzaChcIlwiKTtcbiAgY29kZS5wdXNoKFwiZXhwb3J0IGRlZmF1bHQgc2l0ZTtcIik7XG4gIGNvZGUucHVzaChcIlwiKTtcblxuICAvLyBXcml0ZSB0aGUgY29kZSB0byB0aGUgZmlsZVxuICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoY29uZmlnRmlsZSwgY29kZS5qb2luKFwiXFxuXCIpKTtcbiAgY29uc29sZS5sb2coKTtcbiAgY29uc29sZS5sb2coYnJpZ2h0R3JlZW4oXCJDcmVhdGVkIGEgY29uZmlnIGZpbGVcIiksIGNvbmZpZ0ZpbGUpO1xufVxuXG4vKiogKFJlKWNvbmZpZ3VyZSBWU0NvZGUgZm9yIERlbm8vTHVtZSAqL1xuYXN5bmMgZnVuY3Rpb24gaW5pdFZTQ29kZShwYXRoOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBEZW5vLm1rZGlyKFwiLnZzY29kZVwiKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gSWdub3JlIGlmIHRoZSBkaXJlY3RvcnkgYWxyZWFkeSBleGlzdHNcbiAgfVxuXG4gIC8vIEVuYWJsZSBEZW5vIHBsdWdpblxuICBjb25zdCBjb25maWcgPSBhd2FpdCBleGlzdHMoXCIudnNjb2RlL3NldHRpbmdzLmpzb25cIilcbiAgICA/IEpTT04ucGFyc2UoYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIudnNjb2RlL3NldHRpbmdzLmpzb25cIikpXG4gICAgOiB7fTtcblxuICBjb25maWdbXCJkZW5vLmVuYWJsZVwiXSA9IHRydWU7XG4gIGNvbmZpZ1tcImRlbm8ubGludFwiXSA9IHRydWU7XG4gIGNvbmZpZ1tcImRlbm8udW5zdGFibGVcIl0gPSB0cnVlO1xuICBjb25maWdbXCJkZW5vLnN1Z2dlc3QuaW1wb3J0cy5ob3N0c1wiXSA9IHtcbiAgICBcImh0dHBzOi8vZGVuby5sYW5kXCI6IHRydWUsXG4gIH07XG5cbiAgLy8gU2V0IHVwIHRoZSBpbXBvcnQgbWFwXG4gIGNvbmZpZ1tcImRlbm8uaW1wb3J0TWFwXCJdID0gXCIudnNjb2RlL2x1bWVfaW1wb3J0X21hcC5qc29uXCI7XG5cbiAgY29uc3QgaW1wb3J0TWFwID0ge1xuICAgIGltcG9ydHM6IHtcbiAgICAgIFwibHVtZVwiOiBwb3NpeC5qb2luKHBhdGgsIFwiL21vZC50c1wiKSxcbiAgICAgIFwibHVtZS9cIjogcG9zaXguam9pbihwYXRoLCBcIi9cIiksXG4gICAgICBcImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZS9cIjogcG9zaXguam9pbihwYXRoLCBcIi9cIiksXG4gICAgfSxcbiAgfTtcblxuICAvLyBDcmVhdGUgYSBsYXVuY2guanNvbiBmaWxlIHRvIGRlYnVnXG4gIC8vIEZvciBtb3JlIGluZm9ybWF0aW9uLCB2aXNpdDogaHR0cHM6Ly9nby5taWNyb3NvZnQuY29tL2Z3bGluay8/bGlua2lkPTgzMDM4N1xuICBjb25zdCBiYXNlQ29uZmlnID0ge1xuICAgIHJlcXVlc3Q6IFwibGF1bmNoXCIsXG4gICAgdHlwZTogXCJwd2Etbm9kZVwiLFxuICAgIHByb2dyYW06IHBvc2l4LmpvaW4ocGF0aCwgXCIvY2xpLnRzXCIpLFxuICAgIGN3ZDogXCIke3dvcmtzcGFjZUZvbGRlcn1cIixcbiAgICBydW50aW1lRXhlY3V0YWJsZTogXCJkZW5vXCIsXG4gICAgcnVudGltZUFyZ3M6IFtcbiAgICAgIFwicnVuXCIsXG4gICAgICBcIi0tdW5zdGFibGVcIixcbiAgICAgIFwiLS1pbXBvcnQtbWFwPS52c2NvZGUvbHVtZV9pbXBvcnRfbWFwLmpzb25cIixcbiAgICAgIFwiLS1pbnNwZWN0XCIsXG4gICAgICBcIi0tYWxsb3ctYWxsXCIsXG4gICAgXSxcbiAgICBhdHRhY2hTaW1wbGVQb3J0OiA5MjI5LFxuICB9O1xuXG4gIGNvbnN0IGxhdW5jaCA9IHtcbiAgICBcInZlcnNpb25cIjogXCIwLjIuMFwiLFxuICAgIFwiY29uZmlndXJhdGlvbnNcIjogW1xuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgYmFzZUNvbmZpZywge1xuICAgICAgICBuYW1lOiBcIkx1bWUgYnVpbGRcIixcbiAgICAgIH0pLFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgYmFzZUNvbmZpZywge1xuICAgICAgICBuYW1lOiBcIkx1bWUgc2VydmVcIixcbiAgICAgICAgYXJnczogW1wiLS1zZXJ2ZVwiXSxcbiAgICAgIH0pLFxuICAgIF0sXG4gIH07XG5cbiAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFxuICAgIFwiLnZzY29kZS9zZXR0aW5ncy5qc29uXCIsXG4gICAgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKSxcbiAgKTtcbiAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFxuICAgIFwiLnZzY29kZS9sdW1lX2ltcG9ydF9tYXAuanNvblwiLFxuICAgIEpTT04uc3RyaW5naWZ5KGltcG9ydE1hcCwgbnVsbCwgMiksXG4gICk7XG4gIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcbiAgICBcIi52c2NvZGUvbGF1bmNoLmpzb25cIixcbiAgICBKU09OLnN0cmluZ2lmeShsYXVuY2gsIG51bGwsIDIpLFxuICApO1xuICBjb25zb2xlLmxvZyhicmlnaHRHcmVlbihcIlZTIENvZGUgY29uZmlndXJlZFwiKSk7XG59XG5cbi8qKiBRdWVzdGlvbiB0byBnZXQgdGhlIHN0eWxlIHRvIGltcG9ydCBsdW1lIGluIHRoZSBjb25maWcgZmlsZSAqL1xuZnVuY3Rpb24gZ2V0THVtZVVybChwYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgbWVzc2FnZSA9IGBcbiR7YnJpZ2h0R3JlZW4oXCJIb3cgZG8geW91IHdhbnQgdG8gaW1wb3J0IGx1bWU/XCIpfVxuVHlwZSBhIG51bWJlcjpcbjEgJHtkaW0oJ2ltcG9ydCBsdW1lIGZyb20gXCJsdW1lL21vZC50c1wiJyl9XG4yICR7ZGltKCdpbXBvcnQgbHVtZSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9sdW1lL21vZC50c1wiJyl9XG4zICR7ZGltKGBpbXBvcnQgbHVtZSBmcm9tIFwiJHtwb3NpeC5qb2luKHBhdGgsIFwibW9kLnRzXCIpfVwiYCl9XG5gO1xuICBjb25zdCBjaG9pY2UgPSBwcm9tcHQobWVzc2FnZSwgXCIxXCIpO1xuXG4gIHN3aXRjaCAoY2hvaWNlKSB7XG4gICAgY2FzZSBcIjFcIjpcbiAgICAgIHJldHVybiBcImx1bWVcIjtcbiAgICBjYXNlIFwiMlwiOlxuICAgICAgcmV0dXJuIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9sdW1lL1wiO1xuICB9XG4gIHJldHVybiBwYXRoO1xufVxuXG4vKiogUXVlc3Rpb24gdG8gZ2V0IHRoZSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5zdGFsbCBpbiB0aGUgY29uZmlnIGZpbGUgKi9cbmZ1bmN0aW9uIGdldFBsdWdpbnMoKSB7XG4gIGNvbnN0IG1lc3NhZ2UgPSBgXG4ke2JyaWdodEdyZWVuKFwiRG8geW91IHdhbnQgdG8gaW1wb3J0IHBsdWdpbnM/XCIpfVxuVHlwZSB0aGUgcGx1Z2lucyB5b3Ugd2FudCB0byB1c2Ugc2VwYXJhdGVkIGJ5IGNvbW1hLlxuXG5BbGwgYXZhaWxhYmxlIG9wdGlvbnM6XG4ke1xuICAgIHBsdWdpbk5hbWVzLm1hcCgocGx1Z2luKSA9PlxuICAgICAgYC0gJHtkaW0ocGx1Z2luKX0gaHR0cHM6Ly9sdW1lbGFuZC5naXRodWIuaW8vcGx1Z2lucy8ke3BsdWdpbn0vYFxuICAgICkuam9pbihcIlxcblwiKVxuICB9XG5cbkV4YW1wbGU6ICR7ZGltKGBwb3N0Y3NzLCB0ZXJzZXIsIGJhc2VfcGF0aGApfVxuYDtcbiAgY29uc3QgY2hvaWNlID0gcHJvbXB0KG1lc3NhZ2UpO1xuICBjb25zdCBwbHVnaW5zID0gY2hvaWNlID8gY2hvaWNlLnNwbGl0KC9bXFxzLF0rLykgOiBbXTtcblxuICAvLyBWYWxpZGF0ZSB0aGUgcGx1Z2luc1xuICByZXR1cm4gcGx1Z2lucy5maWx0ZXIoKHBsdWdpbikgPT4ge1xuICAgIGlmIChwbHVnaW5OYW1lcy5pbmNsdWRlcyhwbHVnaW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc29sZS5sb2cocmVkKGBJZ25vcmVkIG5vdCBmb3VuZCBwbHVnaW4gJHtwbHVnaW59LmApKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG4vKiogUXVlc3Rpb24gdG8gZ2V0IHRoZSBmaWxlbmFtZSBvZiB0aGUgY29uZmlnIGZpbGUgKi9cbmFzeW5jIGZ1bmN0aW9uIGdldENvbmZpZ0ZpbGUoKTogUHJvbWlzZTxzdHJpbmcgfCBmYWxzZT4ge1xuICBjb25zdCBjb25maWdGaWxlID1cbiAgICBjb25maXJtKGJyaWdodEdyZWVuKFwiVXNlIFR5cGVzY3JpcHQgZm9yIHRoZSBjb25maWd1cmF0aW9uIGZpbGU/XCIpKVxuICAgICAgPyBcIl9jb25maWcudHNcIlxuICAgICAgOiBcIl9jb25maWcuanNcIjtcblxuICBpZiAoYXdhaXQgZXhpc3RzKGNvbmZpZ0ZpbGUpKSB7XG4gICAgcmV0dXJuIGNvbmZpcm0oXG4gICAgICAgIGJyaWdodEdyZWVuKGBUaGUgZmlsZSBcIiR7Y29uZmlnRmlsZX1cIiBhbHJlYWR5IGV4aXN0LiBPdmVycmlkZT9gKSxcbiAgICAgIClcbiAgICAgID8gY29uZmlnRmlsZVxuICAgICAgOiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBjb25maWdGaWxlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBZTtBQUN0QyxNQUFNLEdBQUcsS0FBSyxRQUFRLENBQWlCO0FBQ3ZDLE1BQU0sR0FBRyxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFtQjtBQUN6RCxNQUFNLEdBQUcsV0FBVyxRQUFRLENBQVk7QUFNeEMsRUFBaUMsQUFBakMsNkJBQWlDLEFBQWpDLEVBQWlDLENBQ2pDLE1BQU0sd0JBQXdCLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFVLENBQUMsRUFBRSxDQUFDO0lBQ3JELEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFJLEtBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSTtJQUVoRCxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQVEsU0FBRSxDQUFDO1FBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUk7SUFDOUIsQ0FBQztJQUVELEVBQUUsRUFBRSxJQUFJLEtBQUssQ0FBUSxTQUFFLENBQUM7UUFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSTtJQUM5QixDQUFDO0lBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJO0lBRXJCLEVBQUUsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQW1DLHND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