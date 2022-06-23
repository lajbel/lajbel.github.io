// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { getFileInfoType } from "./_util.ts";
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            // if dir not exists. then create it.
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export function ensureDirSync(dir) {
    try {
        const fileInfo = Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            // if dir not exists. then create it.
            Deno.mkdirSync(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZnMvZW5zdXJlX2Rpci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZ2V0RmlsZUluZm9UeXBlIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgdGhlIGRpcmVjdG9yeSBleGlzdHMuXG4gKiBJZiB0aGUgZGlyZWN0b3J5IHN0cnVjdHVyZSBkb2VzIG5vdCBleGlzdCwgaXQgaXMgY3JlYXRlZC4gTGlrZSBta2RpciAtcC5cbiAqIFJlcXVpcmVzIHRoZSBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIGZsYWcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVEaXIoZGlyOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IERlbm8ubHN0YXQoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAvLyBpZiBkaXIgbm90IGV4aXN0cy4gdGhlbiBjcmVhdGUgaXQuXG4gICAgICBhd2FpdCBEZW5vLm1rZGlyKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG4vKipcbiAqIEVuc3VyZXMgdGhhdCB0aGUgZGlyZWN0b3J5IGV4aXN0cy5cbiAqIElmIHRoZSBkaXJlY3Rvcnkgc3RydWN0dXJlIGRvZXMgbm90IGV4aXN0LCBpdCBpcyBjcmVhdGVkLiBMaWtlIG1rZGlyIC1wLlxuICogUmVxdWlyZXMgdGhlIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgZmxhZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZURpclN5bmMoZGlyOiBzdHJpbmcpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlSW5mbyA9IERlbm8ubHN0YXRTeW5jKGRpcik7XG4gICAgaWYgKCFmaWxlSW5mby5pc0RpcmVjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRW5zdXJlIHBhdGggZXhpc3RzLCBleHBlY3RlZCAnZGlyJywgZ290ICcke1xuICAgICAgICAgIGdldEZpbGVJbmZvVHlwZShmaWxlSW5mbylcbiAgICAgICAgfSdgLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgLy8gaWYgZGlyIG5vdCBleGlzdHMuIHRoZW4gY3JlYXRlIGl0LlxuICAgICAgRGVuby5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLE1BQU0sR0FBRyxlQUFlLFFBQVEsQ0FBWTtBQUU1QyxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsQ0FDSCxNQUFNLGdCQUFnQixTQUFTLENBQUMsR0FBVyxFQUFFLENBQUM7SUFDNUMsR0FBRyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7UUFDckMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFDWix5Q0FBeUMsRUFDeEMsZUFBZSxDQUFDLFFBQVEsRUFDekIsQ0FBQztRQUVOLENBQUM7SUFDSCxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsRUFBRSxFQUFFLEdBQUcsWUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLEVBQXFDLEFBQXJDLG1DQUFxQztZQUNyQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFBQyxTQUFTLEVBQUUsSUFBSTtZQUFDLENBQUM7WUFDekMsTUFBTTtRQUNSLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRztJQUNYLENBQUM7QUFDSCxDQUFDO0FBRUQsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLENBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFXLEVBQVEsQ0FBQztJQUNoRCxHQUFHLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHO1FBQ25DLEVBQUUsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDMUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQ1oseUNBQXlDLEVBQ3hDLGVBQWUsQ0FBQyxRQUFRLEVBQ3pCLENBQUM7UUFFTixDQUFDO0lBQ0gsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLEVBQUUsRUFBRSxHQUFHLFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxFQUFxQyxBQUFyQyxtQ0FBcUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFBQyxTQUFTLEVBQUUsSUFBSTtZQUFDLENBQUM7WUFDdkMsTUFBTTtRQUNSLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRztJQUNYLENBQUM7QUFDSCxDQUFDIn0=