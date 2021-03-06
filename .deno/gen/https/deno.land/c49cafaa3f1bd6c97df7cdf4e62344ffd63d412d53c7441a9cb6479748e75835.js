import { existsSync, parseYaml, path } from "../deps.ts";
const CONFIG_FILE_NAMES = [
    "scripts",
    "velociraptor"
];
const STATIC_CONFIG_FILE_EXTENSIONS = [
    "yaml",
    "yml",
    "json"
];
const DYNAMIC_CONFIG_FILE_EXTENSIONS = [
    "ts",
    "js",
    "mjs"
];
const CONFIG_DENO_FILE_NAMES = [
    "deno.json",
    "deno.jsonc"
];
const CONFIG_FILE_EXTENSIONS = [
    ...STATIC_CONFIG_FILE_EXTENSIONS,
    ...DYNAMIC_CONFIG_FILE_EXTENSIONS
];
export async function loadConfig() {
    let ext, name, dir = Deno.cwd();
    while(parent(dir) !== dir){
        for (ext of CONFIG_FILE_EXTENSIONS){
            for (name of CONFIG_FILE_NAMES){
                const p = `${path.join(dir, name)}.${ext}`;
                if (existsSync(p)) {
                    return {
                        cwd: dir,
                        config: await parseConfig(p, DYNAMIC_CONFIG_FILE_EXTENSIONS.includes(ext))
                    };
                }
            }
        }
        for (const file of CONFIG_DENO_FILE_NAMES){
            const p = path.join(dir, file);
            if (existsSync(p)) {
                return {
                    cwd: dir,
                    config: await parseDenoConfig(p)
                };
            }
        }
        dir = parent(dir);
    }
    return null;
}
function parent(dir) {
    return path.join(dir, "..");
}
async function parseConfig(configPath, isDynamic) {
    if (isDynamic) {
        return (await import(`file://${configPath}`)).default;
    }
    return parseYaml(Deno.readTextFileSync(configPath));
}
async function parseDenoConfig(configPath) {
    let content = Deno.readTextFileSync(configPath);
    // Strips comments for .jsonc (credits to @tarkh)
    if (/\.jsonc$/.test(configPath)) {
        content = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g)=>g ? "" : m
        );
    }
    const { velociraptor: config = {
    }  } = JSON.parse(content);
    return config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9sb2FkX2NvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCBwYXJzZVlhbWwsIHBhdGggfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgU2NyaXB0c0NvbmZpZ3VyYXRpb24gfSBmcm9tIFwiLi9zY3JpcHRzX2NvbmZpZy50c1wiO1xuXG5jb25zdCBDT05GSUdfRklMRV9OQU1FUyA9IFtcInNjcmlwdHNcIiwgXCJ2ZWxvY2lyYXB0b3JcIl07XG5jb25zdCBTVEFUSUNfQ09ORklHX0ZJTEVfRVhURU5TSU9OUyA9IFtcInlhbWxcIiwgXCJ5bWxcIiwgXCJqc29uXCJdO1xuY29uc3QgRFlOQU1JQ19DT05GSUdfRklMRV9FWFRFTlNJT05TID0gW1widHNcIiwgXCJqc1wiLCBcIm1qc1wiXTtcbmNvbnN0IENPTkZJR19ERU5PX0ZJTEVfTkFNRVMgPSBbXCJkZW5vLmpzb25cIiwgXCJkZW5vLmpzb25jXCJdO1xuY29uc3QgQ09ORklHX0ZJTEVfRVhURU5TSU9OUyA9IFsuLi5TVEFUSUNfQ09ORklHX0ZJTEVfRVhURU5TSU9OUywgLi4uRFlOQU1JQ19DT05GSUdfRklMRV9FWFRFTlNJT05TXTtcblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdEYXRhIHtcbiAgY3dkOiBzdHJpbmc7XG4gIGNvbmZpZzogU2NyaXB0c0NvbmZpZ3VyYXRpb247XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQ29uZmlnKCk6IFByb21pc2U8Q29uZmlnRGF0YSB8IG51bGw+IHtcbiAgbGV0IGV4dCwgbmFtZSwgZGlyID0gRGVuby5jd2QoKTtcbiAgd2hpbGUgKHBhcmVudChkaXIpICE9PSBkaXIpIHtcbiAgICBmb3IgKGV4dCBvZiBDT05GSUdfRklMRV9FWFRFTlNJT05TKSB7XG4gICAgICBmb3IgKG5hbWUgb2YgQ09ORklHX0ZJTEVfTkFNRVMpIHtcbiAgICAgICAgY29uc3QgcCA9IGAke3BhdGguam9pbihkaXIsIG5hbWUpfS4ke2V4dH1gO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyhwKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjd2Q6IGRpcixcbiAgICAgICAgICAgIGNvbmZpZzogYXdhaXQgcGFyc2VDb25maWcocCwgRFlOQU1JQ19DT05GSUdfRklMRV9FWFRFTlNJT05TLmluY2x1ZGVzKGV4dCkpLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIENPTkZJR19ERU5PX0ZJTEVfTkFNRVMpIHtcbiAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oZGlyLCBmaWxlKTtcbiAgICAgIGlmIChleGlzdHNTeW5jKHApKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY3dkOiBkaXIsXG4gICAgICAgICAgY29uZmlnOiBhd2FpdCBwYXJzZURlbm9Db25maWcocCksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIGRpciA9IHBhcmVudChkaXIpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBwYXJlbnQoZGlyOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkaXIsIFwiLi5cIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBhcnNlQ29uZmlnKFxuICBjb25maWdQYXRoOiBzdHJpbmcsXG4gIGlzRHluYW1pYzogYm9vbGVhbixcbik6IFByb21pc2U8U2NyaXB0c0NvbmZpZ3VyYXRpb24+IHtcbiAgaWYgKGlzRHluYW1pYykge1xuICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KGBmaWxlOi8vJHtjb25maWdQYXRofWApKVxuICAgICAgLmRlZmF1bHQgYXMgU2NyaXB0c0NvbmZpZ3VyYXRpb247XG4gIH1cbiAgcmV0dXJuIHBhcnNlWWFtbChcbiAgICBEZW5vLnJlYWRUZXh0RmlsZVN5bmMoY29uZmlnUGF0aCksXG4gICkgYXMgU2NyaXB0c0NvbmZpZ3VyYXRpb247XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBhcnNlRGVub0NvbmZpZyhcbiAgY29uZmlnUGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTxTY3JpcHRzQ29uZmlndXJhdGlvbj4ge1xuICBsZXQgY29udGVudCA9IERlbm8ucmVhZFRleHRGaWxlU3luYyhjb25maWdQYXRoKTtcbiAgLy8gU3RyaXBzIGNvbW1lbnRzIGZvciAuanNvbmMgKGNyZWRpdHMgdG8gQHRhcmtoKVxuICBpZiAoL1xcLmpzb25jJC8udGVzdChjb25maWdQYXRoKSkge1xuICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoXG4gICAgICAvXFxcXFwifFwiKD86XFxcXFwifFteXCJdKSpcInwoXFwvXFwvLip8XFwvXFwqW1xcc1xcU10qP1xcKlxcLykvZyxcbiAgICAgIChtLCBnKSA9PiBnID8gXCJcIiA6IG0sXG4gICAgKTtcbiAgfVxuICBjb25zdCB7IHZlbG9jaXJhcHRvcjogY29uZmlnID0ge30gfSA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gIHJldHVybiBjb25maWcgYXMgU2NyaXB0c0NvbmZpZ3VyYXRpb247XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLFVBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSSxRQUFRLENBQVk7QUFHeEQsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUM7SUFBQSxDQUFTO0lBQUUsQ0FBYztBQUFBLENBQUM7QUFDckQsS0FBSyxDQUFDLDZCQUE2QixHQUFHLENBQUM7SUFBQSxDQUFNO0lBQUUsQ0FBSztJQUFFLENBQU07QUFBQSxDQUFDO0FBQzdELEtBQUssQ0FBQyw4QkFBOEIsR0FBRyxDQUFDO0lBQUEsQ0FBSTtJQUFFLENBQUk7SUFBRSxDQUFLO0FBQUEsQ0FBQztBQUMxRCxLQUFLLENBQUMsc0JBQXNCLEdBQUcsQ0FBQztJQUFBLENBQVc7SUFBRSxDQUFZO0FBQUEsQ0FBQztBQUMxRCxLQUFLLENBQUMsc0JBQXNCLEdBQUcs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