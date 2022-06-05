// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import Dirent from "./_fs_dirent.ts";
import { assert } from "../../_util/assert.ts";
class Dir {
    dirPath;
    syncIterator;
    asyncIterator;
    constructor(path){
        this.dirPath = path;
    }
    get path() {
        if (this.dirPath instanceof Uint8Array) {
            return new TextDecoder().decode(this.dirPath);
        }
        return this.dirPath;
    }
    // deno-lint-ignore no-explicit-any
    read(callback) {
        return new Promise((resolve, reject)=>{
            if (!this.asyncIterator) {
                this.asyncIterator = Deno.readDir(this.path)[Symbol.asyncIterator]();
            }
            assert(this.asyncIterator);
            this.asyncIterator.next().then(({ value  })=>{
                resolve(value ? value : null);
                if (callback) {
                    callback(null, value ? value : null);
                }
            }, (err)=>{
                if (callback) {
                    callback(err);
                }
                reject(err);
            });
        });
    }
    readSync() {
        if (!this.syncIterator) {
            this.syncIterator = Deno.readDirSync(this.path)[Symbol.iterator]();
        }
        const file = this.syncIterator.next().value;
        return file ? new Dirent(file) : null;
    }
    /**
   * Unlike Node, Deno does not require managing resource ids for reading
   * directories, and therefore does not need to close directories when
   * finished reading.
   */ // deno-lint-ignore no-explicit-any
    close(callback) {
        return new Promise((resolve)=>{
            if (callback) {
                callback(null);
            }
            resolve();
        });
    }
    /**
   * Unlike Node, Deno does not require managing resource ids for reading
   * directories, and therefore does not need to close directories when
   * finished reading
   */ closeSync() {
    //No op
    }
    async *[Symbol.asyncIterator]() {
        try {
            while(true){
                const dirent = await this.read();
                if (dirent === null) {
                    break;
                }
                yield dirent;
            }
        } finally{
            await this.close();
        }
    }
}
export { Dir as default };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX2Rpci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IERpcmVudCBmcm9tIFwiLi9fZnNfZGlyZW50LnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpciB7XG4gIHByaXZhdGUgZGlyUGF0aDogc3RyaW5nIHwgVWludDhBcnJheTtcbiAgcHJpdmF0ZSBzeW5jSXRlcmF0b3IhOiBJdGVyYXRvcjxEZW5vLkRpckVudHJ5PiB8IG51bGw7XG4gIHByaXZhdGUgYXN5bmNJdGVyYXRvciE6IEFzeW5jSXRlcmF0b3I8RGVuby5EaXJFbnRyeT4gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZyB8IFVpbnQ4QXJyYXkpIHtcbiAgICB0aGlzLmRpclBhdGggPSBwYXRoO1xuICB9XG5cbiAgZ2V0IHBhdGgoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5kaXJQYXRoIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZSh0aGlzLmRpclBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kaXJQYXRoO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmVhZChjYWxsYmFjaz86ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IFByb21pc2U8RGlyZW50IHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuYXN5bmNJdGVyYXRvcikge1xuICAgICAgICB0aGlzLmFzeW5jSXRlcmF0b3IgPSBEZW5vLnJlYWREaXIodGhpcy5wYXRoKVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTtcbiAgICAgIH1cbiAgICAgIGFzc2VydCh0aGlzLmFzeW5jSXRlcmF0b3IpO1xuICAgICAgdGhpcy5hc3luY0l0ZXJhdG9yXG4gICAgICAgIC5uZXh0KClcbiAgICAgICAgLnRoZW4oKHsgdmFsdWUgfSkgPT4ge1xuICAgICAgICAgIHJlc29sdmUodmFsdWUgPyB2YWx1ZSA6IG51bGwpO1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUgPyB2YWx1ZSA6IG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmVhZFN5bmMoKTogRGlyZW50IHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLnN5bmNJdGVyYXRvcikge1xuICAgICAgdGhpcy5zeW5jSXRlcmF0b3IgPSBEZW5vLnJlYWREaXJTeW5jKHRoaXMucGF0aCkhW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlOiBEZW5vLkRpckVudHJ5ID0gdGhpcy5zeW5jSXRlcmF0b3IubmV4dCgpLnZhbHVlO1xuXG4gICAgcmV0dXJuIGZpbGUgPyBuZXcgRGlyZW50KGZpbGUpIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmxpa2UgTm9kZSwgRGVubyBkb2VzIG5vdCByZXF1aXJlIG1hbmFnaW5nIHJlc291cmNlIGlkcyBmb3IgcmVhZGluZ1xuICAgKiBkaXJlY3RvcmllcywgYW5kIHRoZXJlZm9yZSBkb2VzIG5vdCBuZWVkIHRvIGNsb3NlIGRpcmVjdG9yaWVzIHdoZW5cbiAgICogZmluaXNoZWQgcmVhZGluZy5cbiAgICovXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNsb3NlKGNhbGxiYWNrPzogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICB9XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVW5saWtlIE5vZGUsIERlbm8gZG9lcyBub3QgcmVxdWlyZSBtYW5hZ2luZyByZXNvdXJjZSBpZHMgZm9yIHJlYWRpbmdcbiAgICogZGlyZWN0b3JpZXMsIGFuZCB0aGVyZWZvcmUgZG9lcyBub3QgbmVlZCB0byBjbG9zZSBkaXJlY3RvcmllcyB3aGVuXG4gICAqIGZpbmlzaGVkIHJlYWRpbmdcbiAgICovXG4gIGNsb3NlU3luYygpOiB2b2lkIHtcbiAgICAvL05vIG9wXG4gIH1cblxuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8RGlyZW50PiB7XG4gICAgdHJ5IHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGNvbnN0IGRpcmVudDogRGlyZW50IHwgbnVsbCA9IGF3YWl0IHRoaXMucmVhZCgpO1xuICAgICAgICBpZiAoZGlyZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgZGlyZW50O1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBhd2FpdCB0aGlzLmNsb3NlKCk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLE1BQU0sQ0FBQyxNQUFNLE1BQU0sQ0FBaUI7QUFDcEMsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUF1QjtNQUV6QixHQUFHO0lBQ2QsT0FBTztJQUNQLFlBQVk7SUFDWixhQUFhO2dCQUVULElBQXlCLENBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUk7SUFDckIsQ0FBQztRQUVHLElBQUksR0FBVyxDQUFDO1FBQ2xCLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxZQUFZLFVBQVUsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTztRQUM5QyxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPO0lBQ3JCLENBQUM7SUFFRCxFQUFtQyxBQUFuQyxpQ0FBbUM7SUFDbkMsSUFBSSxDQUFDLFFBQW1DLEVBQTBCLENBQUM7UUFDakUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sR0FBSyxDQUFDO1lBQ3ZDLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhO1lBQ25FLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWE7WUFDekIsSUFBSSxDQUFDLGFBQWEsQ0FDZixJQUFJLEdBQ0osSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFLLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUk7Z0JBQzVCLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQztvQkFDYixRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSTtnQkFDckMsQ0FBQztZQUNILENBQUMsR0FBRyxHQUFHLEdBQUssQ0FBQztnQkFDWCxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7b0JBQ2IsUUFBUSxDQUFDLEdBQUc7Z0JBQ2QsQ0FBQztnQkFDRCxNQUFNLENBQUMsR0FBRztZQUNaLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUVELFFBQVEsR0FBa0IsQ0FBQztRQUN6QixFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFHLE1BQU0sQ0FBQyxRQUFRO1FBQ2xFLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxHQUFrQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxLQUFLO1FBRTFELE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtJQUN2QyxDQUFDO0lBRUQsRUFJRyxBQUpIOzs7O0dBSUcsQUFKSCxFQUlHLENBQ0gsRUFBbUMsQUFBbkMsaUNBQW1DO0lBQ25DLEtBQUssQ0FBQyxRQUFtQyxFQUFpQixDQUFDO1FBQ3pELE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sR0FBSyxDQUFDO1lBQy9CLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDYixRQUFRLENBQUMsSUFBSTtZQUNmLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztJQUNILENBQUM7SUFFRCxFQUlHLEFBSkg7Ozs7R0FJRyxBQUpILEVBSUcsQ0FDSCxTQUFTLEdBQVMsQ0FBQztJQUNqQixFQUFPLEFBQVAsS0FBTztJQUNULENBQUM7WUFFTyxNQUFNLENBQUMsYUFBYSxJQUFtQyxDQUFDO1FBQzlELEdBQUcsQ0FBQyxDQUFDO2tCQUNJLElBQUksQ0FBRSxDQUFDO2dCQUNaLEtBQUssQ0FBQyxNQUFNLEdBQWtCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSTtnQkFDN0MsRUFBRSxFQUFFLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDcEIsS0FBSztnQkFDUCxDQUFDO3NCQUNLLE1BQU07WUFDZCxDQUFDO1FBQ0gsQ0FBQyxRQUFTLENBQUM7WUFDVCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFDbEIsQ0FBQztJQUNILENBQUM7O0FBckZILE1BQU0sR0FBZSxHQUFHIn0=