// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/**
 * Test whether or not the given path exists by checking with the file system
 * @deprecated Checking the state of a file before using it causes a race condition. Perform the actual operation directly instead.
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */ export async function exists(filePath) {
    try {
        await Deno.lstat(filePath);
        return true;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
/**
 * Test whether or not the given path exists by checking with the file system
 * @deprecated Checking the state of a file before using it causes a race condition. Perform the actual operation directly instead.
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */ export function existsSync(filePath) {
    try {
        Deno.lstatSync(filePath);
        return true;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjExMy4wL2ZzL2V4aXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLyoqXG4gKiBUZXN0IHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBwYXRoIGV4aXN0cyBieSBjaGVja2luZyB3aXRoIHRoZSBmaWxlIHN5c3RlbVxuICogQGRlcHJlY2F0ZWQgQ2hlY2tpbmcgdGhlIHN0YXRlIG9mIGEgZmlsZSBiZWZvcmUgdXNpbmcgaXQgY2F1c2VzIGEgcmFjZSBjb25kaXRpb24uIFBlcmZvcm0gdGhlIGFjdHVhbCBvcGVyYXRpb24gZGlyZWN0bHkgaW5zdGVhZC5cbiAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVGltZS1vZi1jaGVja190b190aW1lLW9mLXVzZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhpc3RzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBEZW5vLmxzdGF0KGZpbGVQYXRoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gcGF0aCBleGlzdHMgYnkgY2hlY2tpbmcgd2l0aCB0aGUgZmlsZSBzeXN0ZW1cbiAqIEBkZXByZWNhdGVkIENoZWNraW5nIHRoZSBzdGF0ZSBvZiBhIGZpbGUgYmVmb3JlIHVzaW5nIGl0IGNhdXNlcyBhIHJhY2UgY29uZGl0aW9uLiBQZXJmb3JtIHRoZSBhY3R1YWwgb3BlcmF0aW9uIGRpcmVjdGx5IGluc3RlYWQuXG4gKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RpbWUtb2YtY2hlY2tfdG9fdGltZS1vZi11c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4aXN0c1N5bmMoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIERlbm8ubHN0YXRTeW5jKGZpbGVQYXRoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsQ0FDSCxNQUFNLGdCQUFnQixNQUFNLENBQUMsUUFBZ0IsRUFBb0IsQ0FBQztJQUNoRSxHQUFHLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7UUFDekIsTUFBTSxDQUFDLElBQUk7SUFDYixDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsRUFBRSxFQUFFLEdBQUcsWUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxLQUFLO1FBQ2QsQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHO0lBQ1gsQ0FBQztBQUNILENBQUM7QUFFRCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsQ0FDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLFFBQWdCLEVBQVcsQ0FBQztJQUNyRCxHQUFHLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUTtRQUN2QixNQUFNLENBQUMsSUFBSTtJQUNiLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixFQUFFLEVBQUUsR0FBRyxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEMsTUFBTSxDQUFDLEtBQUs7UUFDZCxDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUc7SUFDWCxDQUFDO0FBQ0gsQ0FBQyJ9