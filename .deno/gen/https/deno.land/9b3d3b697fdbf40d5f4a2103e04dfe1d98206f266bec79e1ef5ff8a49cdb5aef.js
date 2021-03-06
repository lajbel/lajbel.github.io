export const isWindows = Deno.build.os == "windows";
export function escape(str, ...exp) {
    return exp.reduce((str, e)=>str.replace(RegExp(e, "g"), `\\${e}`)
    , str);
}
export function makeFileExecutable(filePath) {
    try {
        Deno.chmodSync(filePath, 493);
    } catch (e) {
    // Windows
    }
}
export async function spawn(args, cwd) {
    const process = Deno.run({
        cmd: args,
        cwd,
        stdout: "piped",
        stderr: "piped"
    });
    const { code  } = await process.status();
    if (code === 0) {
        const rawOutput = await process.output();
        process.close();
        return new TextDecoder().decode(rawOutput);
    } else {
        const error = new TextDecoder().decode(await process.stderrOutput());
        process.close();
        throw new Error(error);
    }
}
export const isScriptObject = (script)=>script instanceof Object && "cmd" in script
;
export const isParallelScripts = (script)=>script instanceof Object && "pll" in script
;
export const isMultiCompositeScript = (script)=>Array.isArray(script)
;
export const notNull = (o)=>o != null
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy91dGlsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhcmFsbGVsU2NyaXB0cywgU2NyaXB0LCBTY3JpcHRPYmplY3QgfSBmcm9tIFwiLi9zY3JpcHRzX2NvbmZpZy50c1wiO1xuXG5leHBvcnQgdHlwZSBPbmVPck1vcmU8VD4gPSBUIHwgVFtdO1xuXG5leHBvcnQgY29uc3QgaXNXaW5kb3dzID0gRGVuby5idWlsZC5vcyA9PSBcIndpbmRvd3NcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZShzdHI6IHN0cmluZywgLi4uZXhwOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBleHAucmVkdWNlKFxuICAgIChzdHIsIGUpID0+IHN0ci5yZXBsYWNlKFJlZ0V4cChlLCBcImdcIiksIGBcXFxcJHtlfWApLFxuICAgIHN0cixcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWxlRXhlY3V0YWJsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgRGVuby5jaG1vZFN5bmMoZmlsZVBhdGgsIDBvMDc1NSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBXaW5kb3dzXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNwYXduKGFyZ3M6IHN0cmluZ1tdLCBjd2Q/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBwcm9jZXNzID0gRGVuby5ydW4oe1xuICAgIGNtZDogYXJncyxcbiAgICBjd2QsXG4gICAgc3Rkb3V0OiBcInBpcGVkXCIsXG4gICAgc3RkZXJyOiBcInBpcGVkXCIsXG4gIH0pO1xuICBjb25zdCB7IGNvZGUgfSA9IGF3YWl0IHByb2Nlc3Muc3RhdHVzKCk7XG4gIGlmIChjb2RlID09PSAwKSB7XG4gICAgY29uc3QgcmF3T3V0cHV0ID0gYXdhaXQgcHJvY2Vzcy5vdXRwdXQoKTtcbiAgICBwcm9jZXNzLmNsb3NlKCk7XG4gICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShyYXdPdXRwdXQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGF3YWl0IHByb2Nlc3Muc3RkZXJyT3V0cHV0KCkpO1xuICAgIHByb2Nlc3MuY2xvc2UoKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBpc1NjcmlwdE9iamVjdCA9IChzY3JpcHQ6IGFueSk6IHNjcmlwdCBpcyBTY3JpcHRPYmplY3QgPT5cbiAgc2NyaXB0IGluc3RhbmNlb2YgT2JqZWN0ICYmIFwiY21kXCIgaW4gc2NyaXB0O1xuXG5leHBvcnQgY29uc3QgaXNQYXJhbGxlbFNjcmlwdHMgPSAoc2NyaXB0OiBhbnkpOiBzY3JpcHQgaXMgUGFyYWxsZWxTY3JpcHRzID0+XG4gIHNjcmlwdCBpbnN0YW5jZW9mIE9iamVjdCAmJiBcInBsbFwiIGluIHNjcmlwdDtcblxuZXhwb3J0IGNvbnN0IGlzTXVsdGlDb21wb3NpdGVTY3JpcHQgPSAoXG4gIHNjcmlwdDogYW55LFxuKTogc2NyaXB0IGlzIEFycmF5PFNjcmlwdCB8IFBhcmFsbGVsU2NyaXB0cz4gPT4gQXJyYXkuaXNBcnJheShzY3JpcHQpO1xuXG5leHBvcnQgY29uc3Qgbm90TnVsbCA9IChvOiBhbnkpID0+IG8gIT0gbnVsbDtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFTO0FBRW5ELE1BQU0sVUFBVSxNQUFNLENBQUMsR0FBVyxLQUFLLEdBQUcsRUFBb0IsQ0FBQztJQUM3RCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFDZCxHQUFHLEVBQUUsQ0FBQyxHQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFHLE1BQUksRUFBRSxFQUFFLENBQUM7TUFDOUMsR0FBRztBQUVQLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsUUFBZ0IsRUFBRSxDQUFDO0lBQ3BELEdBQUcsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsR0FBTTtJQUNqQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ1gsRUFBVSxBQUFWLFFBQVU7SUFDWixDQUFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sZ0JBQWdCLEtBQUssQ0FBQyxJQUFjLEVBQUUsR0FBWSxFQUFtQixDQUFDO0lBQzFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRztRQUNILE1BQU0sRUFBRSxDQUFPO1FBQ2YsTUFBTSxFQUFFLENBQU87SUFDakIsQ0FBQztJQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU07SUFDckMsRUFBRSxFQUFFLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUNmLEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNO1FBQ3RDLE9BQU8sQ0FBQyxLQUFLO1FBQ2IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVM7SUFDM0MsQ0FBQyxNQUFNLENBQUM7UUFDTixLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWTtRQUNqRSxPQUFPLENBQUMsS0FBSztRQUNiLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUs7SUFDdkIsQ0FBQztBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsSUFBSSxNQUFXLEdBQ3hDLE1BQU0sWUFBWSxNQUFNLElBQUksQ0FBSyxRQUFJLE1BQU07O0FBRTdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksTUFBVyxHQUMzQyxNQUFNLFlBQVksTUFBTSxJQUFJLENBQUssUUFBSSxNQUFNOztBQUU3QyxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixJQUNqQyxNQUFXLEdBQ21DLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTTs7QUFFcEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksQ0FBTSxHQUFLLENBQUMsSUFBSSxJQUFJIn0=