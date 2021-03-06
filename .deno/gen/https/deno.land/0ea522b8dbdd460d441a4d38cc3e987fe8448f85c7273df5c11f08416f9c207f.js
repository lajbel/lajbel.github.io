import { fromFileUrl } from "../path.ts";
const allowedModes = /^[0-7]{3}/;
/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */ export function chmod(path, mode, callback) {
    path = path instanceof URL ? fromFileUrl(path) : path;
    Deno.chmod(path, getResolvedMode(mode)).then(()=>callback(null)
    , callback);
}
/**
 * TODO: Also accept 'path' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */ export function chmodSync(path, mode) {
    path = path instanceof URL ? fromFileUrl(path) : path;
    Deno.chmodSync(path, getResolvedMode(mode));
}
function getResolvedMode(mode) {
    if (typeof mode === "number") {
        return mode;
    }
    if (typeof mode === "string" && !allowedModes.test(mode)) {
        throw new Error("Unrecognized mode: " + mode);
    }
    return parseInt(mode, 8);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19jaG1vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHR5cGUgeyBDYWxsYmFja1dpdGhFcnJvciB9IGZyb20gXCIuL19mc19jb21tb24udHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcblxuY29uc3QgYWxsb3dlZE1vZGVzID0gL15bMC03XXszfS87XG5cbi8qKlxuICogVE9ETzogQWxzbyBhY2NlcHQgJ3BhdGgnIHBhcmFtZXRlciBhcyBhIE5vZGUgcG9seWZpbGwgQnVmZmVyIHR5cGUgb25jZSB0aGVzZVxuICogYXJlIGltcGxlbWVudGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzM0MDNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNobW9kKFxuICBwYXRoOiBzdHJpbmcgfCBVUkwsXG4gIG1vZGU6IHN0cmluZyB8IG51bWJlcixcbiAgY2FsbGJhY2s6IENhbGxiYWNrV2l0aEVycm9yLFxuKTogdm9pZCB7XG4gIHBhdGggPSBwYXRoIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aCkgOiBwYXRoO1xuXG4gIERlbm8uY2htb2QocGF0aCwgZ2V0UmVzb2x2ZWRNb2RlKG1vZGUpKS50aGVuKCgpID0+IGNhbGxiYWNrKG51bGwpLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogVE9ETzogQWxzbyBhY2NlcHQgJ3BhdGgnIHBhcmFtZXRlciBhcyBhIE5vZGUgcG9seWZpbGwgQnVmZmVyIHR5cGUgb25jZSB0aGVzZVxuICogYXJlIGltcGxlbWVudGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzM0MDNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNobW9kU3luYyhwYXRoOiBzdHJpbmcgfCBVUkwsIG1vZGU6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xuICBwYXRoID0gcGF0aCBpbnN0YW5jZW9mIFVSTCA/IGZyb21GaWxlVXJsKHBhdGgpIDogcGF0aDtcbiAgRGVuby5jaG1vZFN5bmMocGF0aCwgZ2V0UmVzb2x2ZWRNb2RlKG1vZGUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVzb2x2ZWRNb2RlKG1vZGU6IHN0cmluZyB8IG51bWJlcik6IG51bWJlciB7XG4gIGlmICh0eXBlb2YgbW9kZSA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBtb2RlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBtb2RlID09PSBcInN0cmluZ1wiICYmICFhbGxvd2VkTW9kZXMudGVzdChtb2RlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBtb2RlOiBcIiArIG1vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnNlSW50KG1vZGUsIDgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE1BQU0sR0FBRyxXQUFXLFFBQVEsQ0FBWTtBQUV4QyxLQUFLLENBQUMsWUFBWTtBQUVsQixFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxDQUNILE1BQU0sVUFBVSxLQUFLLENBQ25CLElBQWtCLEVBQ2xCLElBQXFCLEVBQ3JCLFFBQTJCLEVBQ3JCLENBQUM7SUFDUCxJQUFJLEdBQUcsSUFBSSxZQUFZLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxJQUFJLElBQUk7SUFFckQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLElBQUksR0FBRyxJQUFJLEtBQU8sUUFBUSxDQUFDLElBQUk7TUFBRyxRQUFRO0FBQzdFLENBQUM7QUFFRCxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxDQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBa0IsRUFBRSxJQUFxQixFQUFRLENBQUM7SUFDMUUsSUFBSSxHQUFHLElBQUksWUFBWSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksSUFBSSxJQUFJO0lBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxJQUFJO0FBQzNDLENBQUM7U0FFUSxlQUFlLENBQUMsSUFBcUIsRUFBVSxDQUFDO0lBQ3ZELEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQVEsU0FBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJO0lBQ2IsQ0FBQztJQUVELEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQVEsWUFBSyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDO1FBQ3pELEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQXFCLHVCQUFHLElBQUk7SUFDOUMsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDekIsQ0FBQyJ9