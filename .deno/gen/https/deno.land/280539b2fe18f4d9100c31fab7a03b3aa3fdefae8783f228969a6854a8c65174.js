import { basename, dirname, extname, join } from "../deps/path.ts";
import { SiteDirectory, SitePage } from "./filesystem.ts";
import { checkExtensions, concurrent, Exception, normalizePath, searchByExtension } from "./utils.ts";
class SiteSource {
    site;
    /** The root of the src directory */ root;
    /** List of extensions to load data files and the loader used */ dataLoaders = new Map();
    /** List of extensions to load page files and the loader used */ pageLoaders = new Map();
    /** List of files and folders to copy */ staticFiles = new Map();
    /** List of extensions that must be treated as assets (`.css`, `.js`, etc) */ assets = new Set();
    /** The list of paths to ignore */ ignored = new Set();
    /** Used to cache the loaded files */ #cache = new Map();
    constructor(site){
        this.site = site;
        // Update the cache
        site.addEventListener("beforeBuild", ()=>{
            this.root?.refreshCache();
            this.#cache.clear();
        });
        site.addEventListener("beforeUpdate", (ev)=>{
            this.root?.refreshCache();
            for (const filename of ev.files){
                this.#cache.delete(site.src(filename));
            }
        });
    }
    addDataLoader(extensions, loader) {
        checkExtensions(extensions);
        extensions.forEach((extension)=>this.dataLoaders.set(extension, loader)
        );
    }
    addPageLoader(extensions, loader, isAsset) {
        checkExtensions(extensions);
        extensions.forEach((extension)=>this.pageLoaders.set(extension, loader)
        );
        if (isAsset) {
            extensions.forEach((extension)=>this.assets.add(extension)
            );
        }
    }
    getPageLoader(path) {
        return searchByExtension(path, this.pageLoaders);
    }
    addStaticFile(from, to) {
        this.staticFiles.set(join("/", from), join("/", to));
        this.addIgnoredPath(from); // Ignore static paths
    }
    addIgnoredPath(path) {
        this.ignored.add(join("/", path));
    }
    get pages() {
        return this.root?.getPages() ?? [];
    }
    load() {
        this.root = new SiteDirectory({
            path: "/"
        });
        return this.#loadDirectory(this.root);
    }
    async reload(file) {
        // It's an ignored file
        if (this.#isIgnored(file)) {
            return;
        }
        const normalized = normalizePath(file);
        // It's inside a _data file or directory
        if (/\/_data(?:\.\w+$|\/)/.test(normalized)) {
            return await this.#reloadFile(normalized);
        }
        // Any path segment starts with _ or .
        if (normalized.includes("/_") || normalized.includes("/.")) {
            return;
        }
        // Default
        return await this.#reloadFile(normalized);
    }
    getFileOrDirectory(path) {
        let result = this.root;
        path.split("/").forEach((name)=>{
            if (!name || !result) {
                return;
            }
            if (result instanceof SiteDirectory) {
                result = result.dirs.get(name) || result.pages.get(name);
            }
        });
        return result;
    }
    readFile(path, loader) {
        try {
            if (!this.#cache.has(path)) {
                this.#cache.set(path, loader(path));
            }
            return this.#cache.get(path);
        } catch (cause) {
            throw new Exception("Couldn't load this file", {
                cause,
                path
            });
        }
    }
    /* Check if a file is in the ignored list */  #isIgnored(path) {
        for (const pattern of this.ignored){
            if (pattern === path || path.startsWith(`${pattern}/`)) {
                return true;
            }
        }
        return false;
    }
    /** Loads a directory recursively */  #loadDirectory(directory) {
        const path = this.site.src(directory.src.path);
        return concurrent(Deno.readDir(path), (entry)=>this.#loadEntry(directory, entry)
        );
    }
    /** Reloads a file */ async #reloadFile(file) {
        const entry = {
            name: basename(file),
            isFile: true,
            isDirectory: false,
            isSymlink: false
        };
        // Is a file inside a _data directory
        if (file.includes("/_data/")) {
            const [dir, remain] = file.split("/_data/", 2);
            const directory = await this.#getOrCreateDirectory(dir);
            const path = dirname(remain).split("/").filter((name)=>name && name !== "."
            );
            let data = directory.data;
            for (const name of path){
                if (!(name in data)) {
                    data[name] = {
                    };
                }
                data = data[name];
            }
            return await this.#loadDataDirectoryEntry(join(dirname(file)), entry, data);
        }
        const directory = await this.#getOrCreateDirectory(dirname(file));
        await this.#loadEntry(directory, entry);
    }
    /** Get an existing directory. Create it if it doesn't exist */ async #getOrCreateDirectory(path) {
        let dir;
        if (this.root) {
            dir = this.root;
        } else {
            dir = this.root = new SiteDirectory({
                path: "/"
            });
            const path = this.site.src();
            await concurrent(Deno.readDir(path), (entry)=>this.#loadEntry(dir, entry, true)
            );
        }
        for (const name of path.split("/")){
            if (!name) {
                continue;
            }
            if (dir.dirs.has(name)) {
                dir = dir.dirs.get(name);
                continue;
            }
            dir = dir.createDirectory(name);
            const path = this.site.src(dir.src.path);
            await concurrent(Deno.readDir(path), (entry)=>this.#loadEntry(dir, entry, true)
            );
        }
        return dir;
    }
    /** Load an entry from a directory */ async #loadEntry(directory, entry, onlyData = false) {
        if (entry.isSymlink || entry.name.startsWith(".")) {
            return;
        }
        const path = join(directory.src.path, entry.name);
        const { metrics  } = this.site;
        if (this.ignored.has(path)) {
            return;
        }
        if (entry.isDirectory && entry.name === "_data") {
            const metric = metrics.start("Load", {
                path
            });
            directory.addData(await this.#loadDataDirectory(path));
            return metric.stop();
        }
        if (entry.isFile && /^_data\.\w+$/.test(entry.name)) {
            const metric = metrics.start("Load", {
                path
            });
            directory.addData(await this.#loadData(path));
            return metric.stop();
        }
        if (onlyData || entry.name.startsWith("_")) {
            return;
        }
        if (entry.isFile) {
            const metric = metrics.start("Load", {
                path
            });
            const page = await this.#loadPage(path);
            if (page) {
                directory.setPage(entry.name, page);
            } else {
                directory.unsetPage(entry.name);
            }
            return metric.stop();
        }
        if (entry.isDirectory) {
            const metric = metrics.start("Load", {
                path
            });
            const subDirectory = directory.createDirectory(entry.name);
            await this.#loadDirectory(subDirectory);
            return metric.stop();
        }
    }
    /** Create and return a Page */ async #loadPage(path) {
        const result = this.getPageLoader(path);
        if (!result) {
            return;
        }
        const [ext, loader] = result;
        const fullPath = this.site.src(path);
        let info;
        try {
            info = await Deno.stat(fullPath);
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                return;
            }
        }
        const page = new SitePage({
            path: path.slice(0, -ext.length),
            lastModified: info?.mtime || undefined,
            created: info?.birthtime || undefined,
            ext
        });
        const data = await this.readFile(fullPath, loader);
        if (!data.date) {
            data.date = getDate(page);
        } else if (!(data.date instanceof Date)) {
            throw new Exception('Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats', {
                path
            });
        }
        page.data = data;
        // If it's not an asset, remove the extension
        if (!this.assets.has(page.dest.ext)) {
            page.dest.ext = "";
        }
        // Subextensions, like styles.css.njk
        const subext = extname(page.dest.path);
        if (subext) {
            page.dest.path = page.dest.path.slice(0, -subext.length);
            page.dest.ext = subext;
        }
        return page;
    }
    /** Load a _data.* file and return the content */ async #loadData(path) {
        const result = searchByExtension(path, this.dataLoaders);
        if (result) {
            const [, loader] = result;
            return await this.readFile(this.site.src(path), loader);
        }
        return {
        };
    }
    /** Load a _data directory and return the content of all files */ async #loadDataDirectory(path) {
        const data = {
        };
        for (const entry of Deno.readDirSync(this.site.src(path))){
            await this.#loadDataDirectoryEntry(path, entry, data);
        }
        return data;
    }
    /** Load a data file inside a _data directory */ async #loadDataDirectoryEntry(path, entry, data) {
        if (entry.isSymlink || entry.name.startsWith(".") || entry.name.startsWith("_")) {
            return;
        }
        if (entry.isFile) {
            const name = basename(entry.name, extname(entry.name));
            const fileData = await this.#loadData(join(path, entry.name));
            if (fileData.content && Object.keys(fileData).length === 1) {
                data[name] = fileData.content;
            } else {
                data[name] = Object.assign(data[name] || {
                }, fileData);
            }
            return;
        }
        if (entry.isDirectory) {
            data[entry.name] = await this.#loadDataDirectory(join(path, entry.name));
        }
    }
}
/**
 * Scan and load files from the source folder
 * with the data, pages, assets and static files
 */ export { SiteSource as default };
function getDate(page) {
    const { src , dest  } = page;
    const fileName = basename(src.path);
    const dateInPath = fileName.match(/^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?_/);
    if (dateInPath) {
        const [found, year, month, day, hour, minute, second] = dateInPath;
        dest.path = dest.path.replace(found, "");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour ? parseInt(hour) : 0, minute ? parseInt(minute) : 0, second ? parseInt(second) : 0);
    }
    const orderInPath = fileName.match(/^(\d+)_/);
    if (orderInPath) {
        const [found, timestamp] = orderInPath;
        dest.path = dest.path.replace(found, "");
        return new Date(parseInt(timestamp));
    }
    return src.created || src.lastModified;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY29yZS9zb3VyY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4gfSBmcm9tIFwiLi4vZGVwcy9wYXRoLnRzXCI7XG5pbXBvcnQgeyBTaXRlRGlyZWN0b3J5LCBTaXRlUGFnZSB9IGZyb20gXCIuL2ZpbGVzeXN0ZW0udHNcIjtcbmltcG9ydCB7XG4gIGNoZWNrRXh0ZW5zaW9ucyxcbiAgY29uY3VycmVudCxcbiAgRXhjZXB0aW9uLFxuICBub3JtYWxpemVQYXRoLFxuICBzZWFyY2hCeUV4dGVuc2lvbixcbn0gZnJvbSBcIi4vdXRpbHMudHNcIjtcbmltcG9ydCB7IERhdGEsIERpcmVjdG9yeSwgRXZlbnQsIExvYWRlciwgUGFnZSwgU2l0ZSwgU291cmNlIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcblxuLyoqXG4gKiBTY2FuIGFuZCBsb2FkIGZpbGVzIGZyb20gdGhlIHNvdXJjZSBmb2xkZXJcbiAqIHdpdGggdGhlIGRhdGEsIHBhZ2VzLCBhc3NldHMgYW5kIHN0YXRpYyBmaWxlc1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaXRlU291cmNlIGltcGxlbWVudHMgU291cmNlIHtcbiAgc2l0ZTogU2l0ZTtcblxuICAvKiogVGhlIHJvb3Qgb2YgdGhlIHNyYyBkaXJlY3RvcnkgKi9cbiAgcm9vdD86IERpcmVjdG9yeTtcblxuICAvKiogTGlzdCBvZiBleHRlbnNpb25zIHRvIGxvYWQgZGF0YSBmaWxlcyBhbmQgdGhlIGxvYWRlciB1c2VkICovXG4gIGRhdGFMb2FkZXJzOiBNYXA8c3RyaW5nLCBMb2FkZXI+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBMaXN0IG9mIGV4dGVuc2lvbnMgdG8gbG9hZCBwYWdlIGZpbGVzIGFuZCB0aGUgbG9hZGVyIHVzZWQgKi9cbiAgcGFnZUxvYWRlcnM6IE1hcDxzdHJpbmcsIExvYWRlcj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqIExpc3Qgb2YgZmlsZXMgYW5kIGZvbGRlcnMgdG8gY29weSAqL1xuICBzdGF0aWNGaWxlczogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcblxuICAvKiogTGlzdCBvZiBleHRlbnNpb25zIHRoYXQgbXVzdCBiZSB0cmVhdGVkIGFzIGFzc2V0cyAoYC5jc3NgLCBgLmpzYCwgZXRjKSAqL1xuICBhc3NldHM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBwYXRocyB0byBpZ25vcmUgKi9cbiAgaWdub3JlZDogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG5cbiAgLyoqIFVzZWQgdG8gY2FjaGUgdGhlIGxvYWRlZCBmaWxlcyAqL1xuICAjY2FjaGU6IE1hcDxzdHJpbmcsIFByb21pc2U8RGF0YT4+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKHNpdGU6IFNpdGUpIHtcbiAgICB0aGlzLnNpdGUgPSBzaXRlO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjYWNoZVxuICAgIHNpdGUuYWRkRXZlbnRMaXN0ZW5lcihcImJlZm9yZUJ1aWxkXCIsICgpID0+IHtcbiAgICAgIHRoaXMucm9vdD8ucmVmcmVzaENhY2hlKCk7XG4gICAgICB0aGlzLiNjYWNoZS5jbGVhcigpO1xuICAgIH0pO1xuXG4gICAgc2l0ZS5hZGRFdmVudExpc3RlbmVyKFwiYmVmb3JlVXBkYXRlXCIsIChldjogRXZlbnQpID0+IHtcbiAgICAgIHRoaXMucm9vdD8ucmVmcmVzaENhY2hlKCk7XG5cbiAgICAgIGZvciAoY29uc3QgZmlsZW5hbWUgb2YgZXYuZmlsZXMhKSB7XG4gICAgICAgIHRoaXMuI2NhY2hlLmRlbGV0ZShzaXRlLnNyYyhmaWxlbmFtZSkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYWRkRGF0YUxvYWRlcihleHRlbnNpb25zOiBzdHJpbmdbXSwgbG9hZGVyOiBMb2FkZXIpIHtcbiAgICBjaGVja0V4dGVuc2lvbnMoZXh0ZW5zaW9ucyk7XG4gICAgZXh0ZW5zaW9ucy5mb3JFYWNoKChleHRlbnNpb24pID0+IHRoaXMuZGF0YUxvYWRlcnMuc2V0KGV4dGVuc2lvbiwgbG9hZGVyKSk7XG4gIH1cblxuICBhZGRQYWdlTG9hZGVyKGV4dGVuc2lvbnM6IHN0cmluZ1tdLCBsb2FkZXI6IExvYWRlciwgaXNBc3NldDogYm9vbGVhbikge1xuICAgIGNoZWNrRXh0ZW5zaW9ucyhleHRlbnNpb25zKTtcbiAgICBleHRlbnNpb25zLmZvckVhY2goKGV4dGVuc2lvbikgPT4gdGhpcy5wYWdlTG9hZGVycy5zZXQoZXh0ZW5zaW9uLCBsb2FkZXIpKTtcblxuICAgIGlmIChpc0Fzc2V0KSB7XG4gICAgICBleHRlbnNpb25zLmZvckVhY2goKGV4dGVuc2lvbikgPT4gdGhpcy5hc3NldHMuYWRkKGV4dGVuc2lvbikpO1xuICAgIH1cbiAgfVxuXG4gIGdldFBhZ2VMb2FkZXIocGF0aDogc3RyaW5nKTogW2V4dDogc3RyaW5nLCBsb2FkZXI6IExvYWRlcl0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBzZWFyY2hCeUV4dGVuc2lvbihwYXRoLCB0aGlzLnBhZ2VMb2FkZXJzKTtcbiAgfVxuXG4gIGFkZFN0YXRpY0ZpbGUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKSB7XG4gICAgdGhpcy5zdGF0aWNGaWxlcy5zZXQoam9pbihcIi9cIiwgZnJvbSksIGpvaW4oXCIvXCIsIHRvKSk7XG4gICAgdGhpcy5hZGRJZ25vcmVkUGF0aChmcm9tKTsgLy8gSWdub3JlIHN0YXRpYyBwYXRoc1xuICB9XG5cbiAgYWRkSWdub3JlZFBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5pZ25vcmVkLmFkZChqb2luKFwiL1wiLCBwYXRoKSk7XG4gIH1cblxuICBnZXQgcGFnZXMoKTogSXRlcmFibGU8UGFnZT4ge1xuICAgIHJldHVybiB0aGlzLnJvb3Q/LmdldFBhZ2VzKCkgPz8gW107XG4gIH1cblxuICBsb2FkKCkge1xuICAgIHRoaXMucm9vdCA9IG5ldyBTaXRlRGlyZWN0b3J5KHsgcGF0aDogXCIvXCIgfSk7XG4gICAgcmV0dXJuIHRoaXMuI2xvYWREaXJlY3RvcnkodGhpcy5yb290KTtcbiAgfVxuXG4gIGFzeW5jIHJlbG9hZChmaWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJdCdzIGFuIGlnbm9yZWQgZmlsZVxuICAgIGlmICh0aGlzLiNpc0lnbm9yZWQoZmlsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmaWxlKTtcblxuICAgIC8vIEl0J3MgaW5zaWRlIGEgX2RhdGEgZmlsZSBvciBkaXJlY3RvcnlcbiAgICBpZiAoL1xcL19kYXRhKD86XFwuXFx3KyR8XFwvKS8udGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuI3JlbG9hZEZpbGUobm9ybWFsaXplZCk7XG4gICAgfVxuXG4gICAgLy8gQW55IHBhdGggc2VnbWVudCBzdGFydHMgd2l0aCBfIG9yIC5cbiAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcIi9fXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCIvLlwiKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHRcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jcmVsb2FkRmlsZShub3JtYWxpemVkKTtcbiAgfVxuXG4gIGdldEZpbGVPckRpcmVjdG9yeShwYXRoOiBzdHJpbmcpOiBEaXJlY3RvcnkgfCBQYWdlIHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgcmVzdWx0OiBEaXJlY3RvcnkgfCBQYWdlIHwgdW5kZWZpbmVkID0gdGhpcy5yb290O1xuXG4gICAgcGF0aC5zcGxpdChcIi9cIikuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgaWYgKCFuYW1lIHx8ICFyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgU2l0ZURpcmVjdG9yeSkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQuZGlycy5nZXQobmFtZSkgfHwgcmVzdWx0LnBhZ2VzLmdldChuYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZWFkRmlsZShwYXRoOiBzdHJpbmcsIGxvYWRlcjogTG9hZGVyKTogUHJvbWlzZTxEYXRhPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy4jY2FjaGUuaGFzKHBhdGgpKSB7XG4gICAgICAgIHRoaXMuI2NhY2hlLnNldChwYXRoLCBsb2FkZXIocGF0aCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy4jY2FjaGUuZ2V0KHBhdGgpITtcbiAgICB9IGNhdGNoIChjYXVzZSkge1xuICAgICAgdGhyb3cgbmV3IEV4Y2VwdGlvbihcIkNvdWxkbid0IGxvYWQgdGhpcyBmaWxlXCIsIHsgY2F1c2UsIHBhdGggfSk7XG4gICAgfVxuICB9XG5cbiAgLyogQ2hlY2sgaWYgYSBmaWxlIGlzIGluIHRoZSBpZ25vcmVkIGxpc3QgKi9cbiAgI2lzSWdub3JlZChwYXRoOiBzdHJpbmcpIHtcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgdGhpcy5pZ25vcmVkKSB7XG4gICAgICBpZiAocGF0dGVybiA9PT0gcGF0aCB8fCBwYXRoLnN0YXJ0c1dpdGgoYCR7cGF0dGVybn0vYCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIExvYWRzIGEgZGlyZWN0b3J5IHJlY3Vyc2l2ZWx5ICovXG4gICNsb2FkRGlyZWN0b3J5KGRpcmVjdG9yeTogRGlyZWN0b3J5KSB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuc2l0ZS5zcmMoZGlyZWN0b3J5LnNyYy5wYXRoKTtcblxuICAgIHJldHVybiBjb25jdXJyZW50KFxuICAgICAgRGVuby5yZWFkRGlyKHBhdGgpLFxuICAgICAgKGVudHJ5KSA9PiB0aGlzLiNsb2FkRW50cnkoZGlyZWN0b3J5LCBlbnRyeSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBSZWxvYWRzIGEgZmlsZSAqL1xuICBhc3luYyAjcmVsb2FkRmlsZShmaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBlbnRyeSA9IHtcbiAgICAgIG5hbWU6IGJhc2VuYW1lKGZpbGUpLFxuICAgICAgaXNGaWxlOiB0cnVlLFxuICAgICAgaXNEaXJlY3Rvcnk6IGZhbHNlLFxuICAgICAgaXNTeW1saW5rOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgLy8gSXMgYSBmaWxlIGluc2lkZSBhIF9kYXRhIGRpcmVjdG9yeVxuICAgIGlmIChmaWxlLmluY2x1ZGVzKFwiL19kYXRhL1wiKSkge1xuICAgICAgY29uc3QgW2RpciwgcmVtYWluXSA9IGZpbGUuc3BsaXQoXCIvX2RhdGEvXCIsIDIpO1xuICAgICAgY29uc3QgZGlyZWN0b3J5ID0gYXdhaXQgdGhpcy4jZ2V0T3JDcmVhdGVEaXJlY3RvcnkoZGlyKTtcbiAgICAgIGNvbnN0IHBhdGggPSBkaXJuYW1lKHJlbWFpbikuc3BsaXQoXCIvXCIpLmZpbHRlcigobmFtZTogc3RyaW5nKSA9PlxuICAgICAgICBuYW1lICYmIG5hbWUgIT09IFwiLlwiXG4gICAgICApO1xuICAgICAgbGV0IGRhdGEgPSBkaXJlY3RvcnkuZGF0YSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcblxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIHBhdGgpIHtcbiAgICAgICAgaWYgKCEobmFtZSBpbiBkYXRhKSkge1xuICAgICAgICAgIGRhdGFbbmFtZV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGEgPSBkYXRhW25hbWVdIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy4jbG9hZERhdGFEaXJlY3RvcnlFbnRyeShcbiAgICAgICAgam9pbihkaXJuYW1lKGZpbGUpKSxcbiAgICAgICAgZW50cnksXG4gICAgICAgIGRhdGEsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdG9yeSA9IGF3YWl0IHRoaXMuI2dldE9yQ3JlYXRlRGlyZWN0b3J5KGRpcm5hbWUoZmlsZSkpO1xuICAgIGF3YWl0IHRoaXMuI2xvYWRFbnRyeShkaXJlY3RvcnksIGVudHJ5KTtcbiAgfVxuXG4gIC8qKiBHZXQgYW4gZXhpc3RpbmcgZGlyZWN0b3J5LiBDcmVhdGUgaXQgaWYgaXQgZG9lc24ndCBleGlzdCAqL1xuICBhc3luYyAjZ2V0T3JDcmVhdGVEaXJlY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxEaXJlY3Rvcnk+IHtcbiAgICBsZXQgZGlyOiBEaXJlY3Rvcnk7XG5cbiAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICBkaXIgPSB0aGlzLnJvb3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpciA9IHRoaXMucm9vdCA9IG5ldyBTaXRlRGlyZWN0b3J5KHsgcGF0aDogXCIvXCIgfSk7XG4gICAgICBjb25zdCBwYXRoID0gdGhpcy5zaXRlLnNyYygpO1xuXG4gICAgICBhd2FpdCBjb25jdXJyZW50KFxuICAgICAgICBEZW5vLnJlYWREaXIocGF0aCksXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy4jbG9hZEVudHJ5KGRpciwgZW50cnksIHRydWUpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgcGF0aC5zcGxpdChcIi9cIikpIHtcbiAgICAgIGlmICghbmFtZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpci5kaXJzLmhhcyhuYW1lKSkge1xuICAgICAgICBkaXIgPSBkaXIuZGlycy5nZXQobmFtZSkhO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZGlyID0gZGlyLmNyZWF0ZURpcmVjdG9yeShuYW1lKTtcblxuICAgICAgY29uc3QgcGF0aCA9IHRoaXMuc2l0ZS5zcmMoZGlyLnNyYy5wYXRoKTtcblxuICAgICAgYXdhaXQgY29uY3VycmVudChcbiAgICAgICAgRGVuby5yZWFkRGlyKHBhdGgpLFxuICAgICAgICAoZW50cnkpID0+IHRoaXMuI2xvYWRFbnRyeShkaXIsIGVudHJ5LCB0cnVlKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpcjtcbiAgfVxuXG4gIC8qKiBMb2FkIGFuIGVudHJ5IGZyb20gYSBkaXJlY3RvcnkgKi9cbiAgYXN5bmMgI2xvYWRFbnRyeShcbiAgICBkaXJlY3Rvcnk6IERpcmVjdG9yeSxcbiAgICBlbnRyeTogRGVuby5EaXJFbnRyeSxcbiAgICBvbmx5RGF0YSA9IGZhbHNlLFxuICApIHtcbiAgICBpZiAoZW50cnkuaXNTeW1saW5rIHx8IGVudHJ5Lm5hbWUuc3RhcnRzV2l0aChcIi5cIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXRoID0gam9pbihkaXJlY3Rvcnkuc3JjLnBhdGgsIGVudHJ5Lm5hbWUpO1xuICAgIGNvbnN0IHsgbWV0cmljcyB9ID0gdGhpcy5zaXRlO1xuXG4gICAgaWYgKHRoaXMuaWdub3JlZC5oYXMocGF0aCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkgJiYgZW50cnkubmFtZSA9PT0gXCJfZGF0YVwiKSB7XG4gICAgICBjb25zdCBtZXRyaWMgPSBtZXRyaWNzLnN0YXJ0KFwiTG9hZFwiLCB7IHBhdGggfSk7XG4gICAgICBkaXJlY3RvcnkuYWRkRGF0YShhd2FpdCB0aGlzLiNsb2FkRGF0YURpcmVjdG9yeShwYXRoKSk7XG4gICAgICByZXR1cm4gbWV0cmljLnN0b3AoKTtcbiAgICB9XG5cbiAgICBpZiAoZW50cnkuaXNGaWxlICYmIC9eX2RhdGFcXC5cXHcrJC8udGVzdChlbnRyeS5uYW1lKSkge1xuICAgICAgY29uc3QgbWV0cmljID0gbWV0cmljcy5zdGFydChcIkxvYWRcIiwgeyBwYXRoIH0pO1xuICAgICAgZGlyZWN0b3J5LmFkZERhdGEoYXdhaXQgdGhpcy4jbG9hZERhdGEocGF0aCkpO1xuICAgICAgcmV0dXJuIG1ldHJpYy5zdG9wKCk7XG4gICAgfVxuXG4gICAgaWYgKG9ubHlEYXRhIHx8IGVudHJ5Lm5hbWUuc3RhcnRzV2l0aChcIl9cIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZW50cnkuaXNGaWxlKSB7XG4gICAgICBjb25zdCBtZXRyaWMgPSBtZXRyaWNzLnN0YXJ0KFwiTG9hZFwiLCB7IHBhdGggfSk7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy4jbG9hZFBhZ2UocGF0aCk7XG5cbiAgICAgIGlmIChwYWdlKSB7XG4gICAgICAgIGRpcmVjdG9yeS5zZXRQYWdlKGVudHJ5Lm5hbWUsIHBhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlyZWN0b3J5LnVuc2V0UGFnZShlbnRyeS5uYW1lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZXRyaWMuc3RvcCgpO1xuICAgIH1cblxuICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgICAgY29uc3QgbWV0cmljID0gbWV0cmljcy5zdGFydChcIkxvYWRcIiwgeyBwYXRoIH0pO1xuICAgICAgY29uc3Qgc3ViRGlyZWN0b3J5ID0gZGlyZWN0b3J5LmNyZWF0ZURpcmVjdG9yeShlbnRyeS5uYW1lKTtcbiAgICAgIGF3YWl0IHRoaXMuI2xvYWREaXJlY3Rvcnkoc3ViRGlyZWN0b3J5KTtcbiAgICAgIHJldHVybiBtZXRyaWMuc3RvcCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGUgYW5kIHJldHVybiBhIFBhZ2UgKi9cbiAgYXN5bmMgI2xvYWRQYWdlKHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZ2V0UGFnZUxvYWRlcihwYXRoKTtcblxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgW2V4dCwgbG9hZGVyXSA9IHJlc3VsdDtcbiAgICBjb25zdCBmdWxsUGF0aCA9IHRoaXMuc2l0ZS5zcmMocGF0aCk7XG5cbiAgICBsZXQgaW5mbzogRGVuby5GaWxlSW5mbyB8IHVuZGVmaW5lZDtcblxuICAgIHRyeSB7XG4gICAgICBpbmZvID0gYXdhaXQgRGVuby5zdGF0KGZ1bGxQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFnZSA9IG5ldyBTaXRlUGFnZSh7XG4gICAgICBwYXRoOiBwYXRoLnNsaWNlKDAsIC1leHQubGVuZ3RoKSxcbiAgICAgIGxhc3RNb2RpZmllZDogaW5mbz8ubXRpbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgY3JlYXRlZDogaW5mbz8uYmlydGh0aW1lIHx8IHVuZGVmaW5lZCxcbiAgICAgIGV4dCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnJlYWRGaWxlKGZ1bGxQYXRoLCBsb2FkZXIpO1xuXG4gICAgaWYgKCFkYXRhLmRhdGUpIHtcbiAgICAgIGRhdGEuZGF0ZSA9IGdldERhdGUocGFnZSk7XG4gICAgfSBlbHNlIGlmICghKGRhdGEuZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXhjZXB0aW9uKFxuICAgICAgICAnSW52YWxpZCBkYXRlLiBVc2UgXCJ5eXl5LW1tLWRkXCIgb3IgXCJ5eXktbW0tZGQgaGg6bW06c3NcIiBmb3JtYXRzJyxcbiAgICAgICAgeyBwYXRoIH0sXG4gICAgICApO1xuICAgIH1cblxuICAgIHBhZ2UuZGF0YSA9IGRhdGE7XG5cbiAgICAvLyBJZiBpdCdzIG5vdCBhbiBhc3NldCwgcmVtb3ZlIHRoZSBleHRlbnNpb25cbiAgICBpZiAoIXRoaXMuYXNzZXRzLmhhcyhwYWdlLmRlc3QuZXh0KSkge1xuICAgICAgcGFnZS5kZXN0LmV4dCA9IFwiXCI7XG4gICAgfVxuXG4gICAgLy8gU3ViZXh0ZW5zaW9ucywgbGlrZSBzdHlsZXMuY3NzLm5qa1xuICAgIGNvbnN0IHN1YmV4dCA9IGV4dG5hbWUocGFnZS5kZXN0LnBhdGgpO1xuXG4gICAgaWYgKHN1YmV4dCkge1xuICAgICAgcGFnZS5kZXN0LnBhdGggPSBwYWdlLmRlc3QucGF0aC5zbGljZSgwLCAtc3ViZXh0Lmxlbmd0aCk7XG4gICAgICBwYWdlLmRlc3QuZXh0ID0gc3ViZXh0O1xuICAgIH1cblxuICAgIHJldHVybiBwYWdlO1xuICB9XG5cbiAgLyoqIExvYWQgYSBfZGF0YS4qIGZpbGUgYW5kIHJldHVybiB0aGUgY29udGVudCAqL1xuICBhc3luYyAjbG9hZERhdGEocGF0aDogc3RyaW5nKTogUHJvbWlzZTxEYXRhPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gc2VhcmNoQnlFeHRlbnNpb24ocGF0aCwgdGhpcy5kYXRhTG9hZGVycyk7XG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBjb25zdCBbLCBsb2FkZXJdID0gcmVzdWx0O1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVhZEZpbGUodGhpcy5zaXRlLnNyYyhwYXRoKSwgbG9hZGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvKiogTG9hZCBhIF9kYXRhIGRpcmVjdG9yeSBhbmQgcmV0dXJuIHRoZSBjb250ZW50IG9mIGFsbCBmaWxlcyAqL1xuICBhc3luYyAjbG9hZERhdGFEaXJlY3RvcnkocGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGF0YSA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBEZW5vLnJlYWREaXJTeW5jKHRoaXMuc2l0ZS5zcmMocGF0aCkpKSB7XG4gICAgICBhd2FpdCB0aGlzLiNsb2FkRGF0YURpcmVjdG9yeUVudHJ5KHBhdGgsIGVudHJ5LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKiBMb2FkIGEgZGF0YSBmaWxlIGluc2lkZSBhIF9kYXRhIGRpcmVjdG9yeSAqL1xuICBhc3luYyAjbG9hZERhdGFEaXJlY3RvcnlFbnRyeShcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZW50cnk6IERlbm8uRGlyRW50cnksXG4gICAgZGF0YTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICkge1xuICAgIGlmIChcbiAgICAgIGVudHJ5LmlzU3ltbGluayB8fFxuICAgICAgZW50cnkubmFtZS5zdGFydHNXaXRoKFwiLlwiKSB8fCBlbnRyeS5uYW1lLnN0YXJ0c1dpdGgoXCJfXCIpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGVudHJ5LmlzRmlsZSkge1xuICAgICAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGVudHJ5Lm5hbWUsIGV4dG5hbWUoZW50cnkubmFtZSkpO1xuICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCB0aGlzLiNsb2FkRGF0YShqb2luKHBhdGgsIGVudHJ5Lm5hbWUpKTtcblxuICAgICAgaWYgKGZpbGVEYXRhLmNvbnRlbnQgJiYgT2JqZWN0LmtleXMoZmlsZURhdGEpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBkYXRhW25hbWVdID0gZmlsZURhdGEuY29udGVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGFbbmFtZV0gPSBPYmplY3QuYXNzaWduKGRhdGFbbmFtZV0gfHwge30sIGZpbGVEYXRhKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgICAgZGF0YVtlbnRyeS5uYW1lXSA9IGF3YWl0IHRoaXMuI2xvYWREYXRhRGlyZWN0b3J5KGpvaW4ocGF0aCwgZW50cnkubmFtZSkpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXREYXRlKHBhZ2U6IFBhZ2UpIHtcbiAgY29uc3QgeyBzcmMsIGRlc3QgfSA9IHBhZ2U7XG4gIGNvbnN0IGZpbGVOYW1lID0gYmFzZW5hbWUoc3JjLnBhdGgpO1xuXG4gIGNvbnN0IGRhdGVJblBhdGggPSBmaWxlTmFtZS5tYXRjaChcbiAgICAvXihcXGR7NH0pLShcXGRcXGQpLShcXGRcXGQpKD86LShcXGRcXGQpLShcXGRcXGQpKD86LShcXGRcXGQpKT8pP18vLFxuICApO1xuXG4gIGlmIChkYXRlSW5QYXRoKSB7XG4gICAgY29uc3QgW2ZvdW5kLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZF0gPSBkYXRlSW5QYXRoO1xuICAgIGRlc3QucGF0aCA9IGRlc3QucGF0aC5yZXBsYWNlKGZvdW5kLCBcIlwiKTtcblxuICAgIHJldHVybiBuZXcgRGF0ZShcbiAgICAgIHBhcnNlSW50KHllYXIpLFxuICAgICAgcGFyc2VJbnQobW9udGgpIC0gMSxcbiAgICAgIHBhcnNlSW50KGRheSksXG4gICAgICBob3VyID8gcGFyc2VJbnQoaG91cikgOiAwLFxuICAgICAgbWludXRlID8gcGFyc2VJbnQobWludXRlKSA6IDAsXG4gICAgICBzZWNvbmQgPyBwYXJzZUludChzZWNvbmQpIDogMCxcbiAgICApO1xuICB9XG5cbiAgY29uc3Qgb3JkZXJJblBhdGggPSBmaWxlTmFtZS5tYXRjaCgvXihcXGQrKV8vKTtcblxuICBpZiAob3JkZXJJblBhdGgpIHtcbiAgICBjb25zdCBbZm91bmQsIHRpbWVzdGFtcF0gPSBvcmRlckluUGF0aDtcbiAgICBkZXN0LnBhdGggPSBkZXN0LnBhdGgucmVwbGFjZShmb3VuZCwgXCJcIik7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHBhcnNlSW50KHRpbWVzdGFtcCkpO1xuICB9XG5cbiAgcmV0dXJuIHNyYy5jcmVhdGVkIHx8IHNyYy5sYXN0TW9kaWZpZWQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksUUFBUSxDQUFpQjtBQUNsRSxNQUFNLEdBQUcsYUFBYSxFQUFFLFFBQVEsUUFBUSxDQUFpQjtBQUN6RCxNQUFNLEdBQ0osZUFBZSxFQUNmLFVBQVUsRUFDVixTQUFTLEVBQ1QsYUFBYSxFQUNiLGlCQUFpQixR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