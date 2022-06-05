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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19kaXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCBEaXJlbnQgZnJvbSBcIi4vX2ZzX2RpcmVudC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uLy4uL191dGlsL2Fzc2VydC50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXIge1xuICBwcml2YXRlIGRpclBhdGg6IHN0cmluZyB8IFVpbnQ4QXJyYXk7XG4gIHByaXZhdGUgc3luY0l0ZXJhdG9yITogSXRlcmF0b3I8RGVuby5EaXJFbnRyeT4gfCBudWxsO1xuICBwcml2YXRlIGFzeW5jSXRlcmF0b3IhOiBBc3luY0l0ZXJhdG9yPERlbm8uRGlyRW50cnk+IHwgbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcgfCBVaW50OEFycmF5KSB7XG4gICAgdGhpcy5kaXJQYXRoID0gcGF0aDtcbiAgfVxuXG4gIGdldCBwYXRoKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuZGlyUGF0aCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUodGhpcy5kaXJQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGlyUGF0aDtcbiAgfVxuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJlYWQoY2FsbGJhY2s/OiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpOiBQcm9taXNlPERpcmVudCB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmFzeW5jSXRlcmF0b3IpIHtcbiAgICAgICAgdGhpcy5hc3luY0l0ZXJhdG9yID0gRGVuby5yZWFkRGlyKHRoaXMucGF0aClbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XG4gICAgICB9XG4gICAgICBhc3NlcnQodGhpcy5hc3luY0l0ZXJhdG9yKTtcbiAgICAgIHRoaXMuYXN5bmNJdGVyYXRvclxuICAgICAgICAubmV4dCgpXG4gICAgICAgIC50aGVuKCh7IHZhbHVlIH0pID0+IHtcbiAgICAgICAgICByZXNvbHZlKHZhbHVlID8gdmFsdWUgOiBudWxsKTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlID8gdmFsdWUgOiBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRTeW5jKCk6IERpcmVudCB8IG51bGwge1xuICAgIGlmICghdGhpcy5zeW5jSXRlcmF0b3IpIHtcbiAgICAgIHRoaXMuc3luY0l0ZXJhdG9yID0gRGVuby5yZWFkRGlyU3luYyh0aGlzLnBhdGgpIVtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZTogRGVuby5EaXJFbnRyeSA9IHRoaXMuc3luY0l0ZXJhdG9yLm5leHQoKS52YWx1ZTtcblxuICAgIHJldHVybiBmaWxlID8gbmV3IERpcmVudChmaWxlKSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVW5saWtlIE5vZGUsIERlbm8gZG9lcyBub3QgcmVxdWlyZSBtYW5hZ2luZyByZXNvdXJjZSBpZHMgZm9yIHJlYWRpbmdcbiAgICogZGlyZWN0b3JpZXMsIGFuZCB0aGVyZWZvcmUgZG9lcyBub3QgbmVlZCB0byBjbG9zZSBkaXJlY3RvcmllcyB3aGVuXG4gICAqIGZpbmlzaGVkIHJlYWRpbmcuXG4gICAqL1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjbG9zZShjYWxsYmFjaz86ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVubGlrZSBOb2RlLCBEZW5vIGRvZXMgbm90IHJlcXVpcmUgbWFuYWdpbmcgcmVzb3VyY2UgaWRzIGZvciByZWFkaW5nXG4gICAqIGRpcmVjdG9yaWVzLCBhbmQgdGhlcmVmb3JlIGRvZXMgbm90IG5lZWQgdG8gY2xvc2UgZGlyZWN0b3JpZXMgd2hlblxuICAgKiBmaW5pc2hlZCByZWFkaW5nXG4gICAqL1xuICBjbG9zZVN5bmMoKTogdm9pZCB7XG4gICAgLy9ObyBvcFxuICB9XG5cbiAgYXN5bmMgKltTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPERpcmVudD4ge1xuICAgIHRyeSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBjb25zdCBkaXJlbnQ6IERpcmVudCB8IG51bGwgPSBhd2FpdCB0aGlzLnJlYWQoKTtcbiAgICAgICAgaWYgKGRpcmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHlpZWxkIGRpcmVudDtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxNQUFNLENBQUMsTUFBTSxNQUFNLENBQWlCO0FBQ3BDLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FB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