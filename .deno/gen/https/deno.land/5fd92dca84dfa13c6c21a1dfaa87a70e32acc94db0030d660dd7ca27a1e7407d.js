import { DOMParser } from "../deps/dom.ts";
import { extname, join, SEP } from "../deps/path.ts";
import { bold, dim, yellow } from "../deps/colors.ts";
/** Run a callback concurrently with all the elements of an Iterable */ export async function concurrent(iterable, iteratorFn, limit = 200) {
    const executing = [];
    for await (const item of iterable){
        const p = iteratorFn(item).then(()=>executing.splice(executing.indexOf(p), 1)
        );
        executing.push(p);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);
}
/**
 * The list of supported MIME types.
 * It's used by the server and some plugins.
 */ export const mimes = new Map([
    [
        ".aac",
        "audio/x-aac"
    ],
    [
        ".apng",
        "image/apng"
    ],
    [
        ".atom",
        "application/atom+xml; charset=utf-8"
    ],
    [
        ".avif",
        "image/avif"
    ],
    [
        ".bmp",
        "image/bmp"
    ],
    [
        ".css",
        "text/css; charset=utf-8"
    ],
    [
        ".es",
        "application/ecmascript"
    ],
    [
        ".eps",
        "application/postscript"
    ],
    [
        ".epub",
        "application/epub+zip"
    ],
    [
        ".flac",
        "audio/x-flac"
    ],
    [
        ".gif",
        "image/gif"
    ],
    [
        ".gz",
        "aplication/gzip"
    ],
    [
        ".heic",
        "image/heic"
    ],
    [
        ".heif",
        "image/heif"
    ],
    [
        ".html",
        "text/html; charset=utf-8"
    ],
    [
        ".htm",
        "text/html; charset=utf-8"
    ],
    [
        ".ico",
        "image/x-icon"
    ],
    [
        ".jpeg",
        "image/jpg"
    ],
    [
        ".jpg",
        "image/jpg"
    ],
    [
        ".js",
        "text/javascript; charset=utf-8"
    ],
    [
        ".json",
        "application/json"
    ],
    [
        ".kml",
        "application/vnd.google-earth.kml+xml"
    ],
    [
        ".kmz",
        "application/vnd.google-earth.kmz"
    ],
    [
        ".map",
        "application/json"
    ],
    [
        ".md",
        "text/markdown; charset=utf-8"
    ],
    [
        ".mid",
        "audio/midi"
    ],
    [
        ".midi",
        "audio/midi"
    ],
    [
        ".mjs",
        "application/javascript"
    ],
    [
        ".mkv",
        "video/x-matroska"
    ],
    [
        ".mov",
        "video/quicktime"
    ],
    [
        ".mp3",
        "audio/mp3"
    ],
    [
        ".mp4",
        "video/mp4"
    ],
    [
        ".mp4a",
        "video/mp4"
    ],
    [
        ".mp4v",
        "video/mp4"
    ],
    [
        ".m4a",
        "video/mp4"
    ],
    [
        ".ogg",
        "audio/ogg"
    ],
    [
        ".opus",
        "audio/ogg"
    ],
    [
        ".otf",
        "font/otf"
    ],
    [
        ".pdf",
        "application/pdf"
    ],
    [
        ".png",
        "image/png"
    ],
    [
        ".ps",
        "application/postscript"
    ],
    [
        ".rar",
        "application/vnd.rar"
    ],
    [
        ".rdf",
        "application/rdf+xml; charset=utf-8"
    ],
    [
        ".rss",
        "application/rss+xml; charset=utf-8"
    ],
    [
        ".rtf",
        "application/rtf"
    ],
    [
        ".svg",
        "image/svg+xml; charset=utf-8"
    ],
    [
        ".tiff",
        "image/tiff"
    ],
    [
        ".ttf",
        "font/ttf"
    ],
    [
        ".txt",
        "text/plain; charset=utf-8"
    ],
    [
        ".vtt",
        "text/vtt; charset=utf-8"
    ],
    [
        ".wasm",
        "application/wasm"
    ],
    [
        ".wav",
        "audio/wav"
    ],
    [
        ".webm",
        "video/webm"
    ],
    [
        ".webmanifest",
        "application/manifest+json"
    ],
    [
        ".webp",
        "image/webp"
    ],
    [
        ".woff",
        "font/woff"
    ],
    [
        ".woff2",
        "font/woff2"
    ],
    [
        ".yaml",
        "text/yaml; charset=utf-8"
    ],
    [
        ".yml",
        "text/yaml; charset=utf-8"
    ],
    [
        ".xml",
        "text/xml"
    ],
    [
        ".zip",
        "application/zip"
    ], 
]);
/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */ export function merge(defaults, user) {
    const merged = {
        ...defaults
    };
    if (!user) {
        return merged;
    }
    for (const [key, value] of Object.entries(user)){
        // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'unknown'
        if (isPlainObject(merged[key]) && isPlainObject(value)) {
            // @ts-ignore: Type 'string' cannot be used to index type 'Type'
            merged[key] = merge(merged[key], value);
            continue;
        }
        // @ts-ignore: Type 'string' cannot be used to index type 'Type'
        merged[key] = value;
    }
    return merged;
}
const reactElement = Symbol.for("react.element");
/** Check if the argument passed is a plain object */ export function isPlainObject(obj) {
    return typeof obj === "object" && obj !== null && obj.toString() === "[object Object]" && // @ts-ignore: Check if the argument passed is a React element
    obj["$$typeof"] !== reactElement;
}
/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/").
 */ export function normalizePath(path) {
    return SEP === "/" ? path : path.replaceAll(SEP, "/");
}
/**
 * Search an extension in a map.
 * It's useful for cases in which the extension is multiple.
 * Example: page.tmpl.js
 */ export function searchByExtension(path, extensions) {
    for (const [key, value] of extensions){
        if (path.endsWith(key)) {
            return [
                key,
                value
            ];
        }
    }
}
/** Convert an HTMLDocument instance to a string */ export function documentToString(document) {
    const { doctype , documentElement  } = document;
    if (!doctype) {
        return documentElement?.outerHTML || "";
    }
    return `<!DOCTYPE ${doctype.name}` + (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") + (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") + (doctype.systemId ? ` "${doctype.systemId}"` : "") + `>\n${documentElement?.outerHTML}`;
}
const parser = new DOMParser();
/** Parse a string with HTML code and return an HTMLDocument */ export function stringToDocument(string) {
    const document = parser.parseFromString(string, "text/html");
    if (!document) {
        throw new Error("Unable to parse the HTML code");
    }
    return document;
}
/**
 * Generic Exception to throw errors.
 * It allows to include extra data and the previous exception.
 */ export class Exception extends Error {
    data;
    constructor(message, data = {
    }){
        const options = data.cause ? {
            cause: data.cause
        } : {
        };
        delete data.cause;
        super(message, options);
        if (data.name) {
            this.name = data.name;
            delete data.name;
        }
        this.data = data;
    }
}
export function warn(message, data = {
}) {
    const name = data.name || "Warning";
    delete data.name;
    console.warn("⚠️ " + bold(yellow(name)), message);
    for (let [key, value] of Object.entries(data ?? {
    })){
        if (key === "page") {
            value = value.src.path + value.src.ext;
        } else if (value instanceof Error) {
            value = value.toString();
        } else if (value instanceof URL) {
            value = value.toString();
        }
        console.log(dim(`  ${key}:`), value);
    }
}
export function checkExtensions(extensions) {
    extensions.forEach((extension)=>{
        if (extension.charAt(0) !== ".") {
            throw new Exception("Invalid extension. It must start with '.'", {
                extension
            });
        }
    });
}
export async function serveFile(url, { root , directoryIndex , page404 , router  }) {
    const { pathname  } = url;
    let path = join(root, pathname);
    try {
        if (path.endsWith(SEP)) {
            path += "index.html";
        }
        // Redirect /example to /example/
        const info = await Deno.stat(path);
        if (info.isDirectory) {
            return [
                null,
                {
                    status: 301,
                    headers: {
                        "location": join(pathname, "/")
                    }
                }, 
            ];
        }
        // Serve the static file
        return [
            await Deno.readFile(path),
            {
                status: 200,
                headers: {
                    "content-type": mimes.get(extname(path).toLowerCase()) || "application/octet-stream"
                }
            }, 
        ];
    } catch  {
        // Serve pages on demand
        if (router) {
            const result = await router(url);
            if (result) {
                return result;
            }
        }
        // Not found page
        let body = "Not found";
        try {
            body = await Deno.readFile(join(root, page404));
        } catch  {
            if (directoryIndex) {
                body = await getDirectoryIndex(root, pathname);
            }
        }
        return [
            body,
            {
                status: 404,
                headers: {
                    "content-type": mimes.get(".html")
                }
            }, 
        ];
    }
}
/** Generate the default body for a 404 response */ async function getDirectoryIndex(root, file) {
    const folders = [];
    const files = [];
    try {
        for await (const info of Deno.readDir(join(root, file))){
            info.isDirectory ? folders.push([
                `${info.name}/`,
                `📁 ${info.name}/`
            ]) : files.push([
                info.name,
                `📄 ${info.name}`
            ]);
        }
    } catch  {
    // It's not a directory
    }
    const content = folders.concat(files);
    if (file.match(/.+\/.+/)) {
        content.unshift([
            "../",
            ".."
        ]);
    }
    return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not found</title>
      <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
    </head>
    <body>
      <h1>404 - Not found</h1>
      <p>The URL <code>${file}</code> does not exist</p>
      <ul>
    ${content.map(([url, name])=>`
      <li>
        <a href="${url}">
          ${name}
        </a>
      </li>`
    ).join("\n")}
      </ul>
    </body>
  </html>`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvY29yZS91dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBET01QYXJzZXIsIEhUTUxEb2N1bWVudCB9IGZyb20gXCIuLi9kZXBzL2RvbS50c1wiO1xuaW1wb3J0IHsgZXh0bmFtZSwgam9pbiwgU0VQIH0gZnJvbSBcIi4uL2RlcHMvcGF0aC50c1wiO1xuaW1wb3J0IHsgYm9sZCwgZGltLCB5ZWxsb3cgfSBmcm9tIFwiLi4vZGVwcy9jb2xvcnMudHNcIjtcbmltcG9ydCB7IEZpbGVSZXNwb25zZSwgUGFnZSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5cbi8qKiBSdW4gYSBjYWxsYmFjayBjb25jdXJyZW50bHkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIG9mIGFuIEl0ZXJhYmxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uY3VycmVudDxUeXBlPihcbiAgaXRlcmFibGU6IEFzeW5jSXRlcmFibGU8VHlwZT4gfCBJdGVyYWJsZTxUeXBlPixcbiAgaXRlcmF0b3JGbjogKGFyZzogVHlwZSkgPT4gUHJvbWlzZTx1bmtub3duPixcbiAgbGltaXQgPSAyMDAsXG4pIHtcbiAgY29uc3QgZXhlY3V0aW5nOiBQcm9taXNlPHVua25vd24+W10gPSBbXTtcblxuICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgaXRlcmFibGUpIHtcbiAgICBjb25zdCBwOiBQcm9taXNlPHVua25vd24+ID0gaXRlcmF0b3JGbihpdGVtKS50aGVuKCgpID0+XG4gICAgICBleGVjdXRpbmcuc3BsaWNlKGV4ZWN1dGluZy5pbmRleE9mKHApLCAxKVxuICAgICk7XG5cbiAgICBleGVjdXRpbmcucHVzaChwKTtcblxuICAgIGlmIChleGVjdXRpbmcubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICBhd2FpdCBQcm9taXNlLnJhY2UoZXhlY3V0aW5nKTtcbiAgICB9XG4gIH1cblxuICBhd2FpdCBQcm9taXNlLmFsbChleGVjdXRpbmcpO1xufVxuXG4vKipcbiAqIFRoZSBsaXN0IG9mIHN1cHBvcnRlZCBNSU1FIHR5cGVzLlxuICogSXQncyB1c2VkIGJ5IHRoZSBzZXJ2ZXIgYW5kIHNvbWUgcGx1Z2lucy5cbiAqL1xuZXhwb3J0IGNvbnN0IG1pbWVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcChbXG4gIFtcIi5hYWNcIiwgXCJhdWRpby94LWFhY1wiXSxcbiAgW1wiLmFwbmdcIiwgXCJpbWFnZS9hcG5nXCJdLFxuICBbXCIuYXRvbVwiLCBcImFwcGxpY2F0aW9uL2F0b20reG1sOyBjaGFyc2V0PXV0Zi04XCJdLFxuICBbXCIuYXZpZlwiLCBcImltYWdlL2F2aWZcIl0sXG4gIFtcIi5ibXBcIiwgXCJpbWFnZS9ibXBcIl0sXG4gIFtcIi5jc3NcIiwgXCJ0ZXh0L2NzczsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLmVzXCIsIFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiXSxcbiAgW1wiLmVwc1wiLCBcImFwcGxpY2F0aW9uL3Bvc3RzY3JpcHRcIl0sXG4gIFtcIi5lcHViXCIsIFwiYXBwbGljYXRpb24vZXB1Yit6aXBcIl0sXG4gIFtcIi5mbGFjXCIsIFwiYXVkaW8veC1mbGFjXCJdLFxuICBbXCIuZ2lmXCIsIFwiaW1hZ2UvZ2lmXCJdLFxuICBbXCIuZ3pcIiwgXCJhcGxpY2F0aW9uL2d6aXBcIl0sXG4gIFtcIi5oZWljXCIsIFwiaW1hZ2UvaGVpY1wiXSxcbiAgW1wiLmhlaWZcIiwgXCJpbWFnZS9oZWlmXCJdLFxuICBbXCIuaHRtbFwiLCBcInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLmh0bVwiLCBcInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLmljb1wiLCBcImltYWdlL3gtaWNvblwiXSxcbiAgW1wiLmpwZWdcIiwgXCJpbWFnZS9qcGdcIl0sXG4gIFtcIi5qcGdcIiwgXCJpbWFnZS9qcGdcIl0sXG4gIFtcIi5qc1wiLCBcInRleHQvamF2YXNjcmlwdDsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLmpzb25cIiwgXCJhcHBsaWNhdGlvbi9qc29uXCJdLFxuICBbXCIua21sXCIsIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS1lYXJ0aC5rbWwreG1sXCJdLFxuICBbXCIua216XCIsIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS1lYXJ0aC5rbXpcIl0sXG4gIFtcIi5tYXBcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCJdLFxuICBbXCIubWRcIiwgXCJ0ZXh0L21hcmtkb3duOyBjaGFyc2V0PXV0Zi04XCJdLFxuICBbXCIubWlkXCIsIFwiYXVkaW8vbWlkaVwiXSxcbiAgW1wiLm1pZGlcIiwgXCJhdWRpby9taWRpXCJdLFxuICBbXCIubWpzXCIsIFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiXSxcbiAgW1wiLm1rdlwiLCBcInZpZGVvL3gtbWF0cm9za2FcIl0sXG4gIFtcIi5tb3ZcIiwgXCJ2aWRlby9xdWlja3RpbWVcIl0sXG4gIFtcIi5tcDNcIiwgXCJhdWRpby9tcDNcIl0sXG4gIFtcIi5tcDRcIiwgXCJ2aWRlby9tcDRcIl0sXG4gIFtcIi5tcDRhXCIsIFwidmlkZW8vbXA0XCJdLFxuICBbXCIubXA0dlwiLCBcInZpZGVvL21wNFwiXSxcbiAgW1wiLm00YVwiLCBcInZpZGVvL21wNFwiXSxcbiAgW1wiLm9nZ1wiLCBcImF1ZGlvL29nZ1wiXSxcbiAgW1wiLm9wdXNcIiwgXCJhdWRpby9vZ2dcIl0sXG4gIFtcIi5vdGZcIiwgXCJmb250L290ZlwiXSxcbiAgW1wiLnBkZlwiLCBcImFwcGxpY2F0aW9uL3BkZlwiXSxcbiAgW1wiLnBuZ1wiLCBcImltYWdlL3BuZ1wiXSxcbiAgW1wiLnBzXCIsIFwiYXBwbGljYXRpb24vcG9zdHNjcmlwdFwiXSxcbiAgW1wiLnJhclwiLCBcImFwcGxpY2F0aW9uL3ZuZC5yYXJcIl0sXG4gIFtcIi5yZGZcIiwgXCJhcHBsaWNhdGlvbi9yZGYreG1sOyBjaGFyc2V0PXV0Zi04XCJdLFxuICBbXCIucnNzXCIsIFwiYXBwbGljYXRpb24vcnNzK3htbDsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLnJ0ZlwiLCBcImFwcGxpY2F0aW9uL3J0ZlwiXSxcbiAgW1wiLnN2Z1wiLCBcImltYWdlL3N2Zyt4bWw7IGNoYXJzZXQ9dXRmLThcIl0sXG4gIFtcIi50aWZmXCIsIFwiaW1hZ2UvdGlmZlwiXSxcbiAgW1wiLnR0ZlwiLCBcImZvbnQvdHRmXCJdLFxuICBbXCIudHh0XCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiXSxcbiAgW1wiLnZ0dFwiLCBcInRleHQvdnR0OyBjaGFyc2V0PXV0Zi04XCJdLFxuICBbXCIud2FzbVwiLCBcImFwcGxpY2F0aW9uL3dhc21cIl0sXG4gIFtcIi53YXZcIiwgXCJhdWRpby93YXZcIl0sXG4gIFtcIi53ZWJtXCIsIFwidmlkZW8vd2VibVwiXSxcbiAgW1wiLndlYm1hbmlmZXN0XCIsIFwiYXBwbGljYXRpb24vbWFuaWZlc3QranNvblwiXSxcbiAgW1wiLndlYnBcIiwgXCJpbWFnZS93ZWJwXCJdLFxuICBbXCIud29mZlwiLCBcImZvbnQvd29mZlwiXSxcbiAgW1wiLndvZmYyXCIsIFwiZm9udC93b2ZmMlwiXSxcbiAgW1wiLnlhbWxcIiwgXCJ0ZXh0L3lhbWw7IGNoYXJzZXQ9dXRmLThcIl0sXG4gIFtcIi55bWxcIiwgXCJ0ZXh0L3lhbWw7IGNoYXJzZXQ9dXRmLThcIl0sXG4gIFtcIi54bWxcIiwgXCJ0ZXh0L3htbFwiXSxcbiAgW1wiLnppcFwiLCBcImFwcGxpY2F0aW9uL3ppcFwiXSxcbl0pO1xuXG4vKipcbiAqIE1lcmdlIHR3byBvYmplY3RzIHJlY3Vyc2l2ZWx5LlxuICogSXQncyB1c2VkIHRvIG1lcmdlIHVzZXIgb3B0aW9ucyB3aXRoIGRlZmF1bHQgb3B0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlPFR5cGU+KFxuICBkZWZhdWx0czogVHlwZSxcbiAgdXNlcj86IFBhcnRpYWw8VHlwZT4sXG4pIHtcbiAgY29uc3QgbWVyZ2VkID0geyAuLi5kZWZhdWx0cyB9O1xuXG4gIGlmICghdXNlcikge1xuICAgIHJldHVybiBtZXJnZWQ7XG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh1c2VyKSkge1xuICAgIC8vIEB0cy1pZ25vcmU6IE5vIGluZGV4IHNpZ25hdHVyZSB3aXRoIGEgcGFyYW1ldGVyIG9mIHR5cGUgJ3N0cmluZycgd2FzIGZvdW5kIG9uIHR5cGUgJ3Vua25vd24nXG4gICAgaWYgKGlzUGxhaW5PYmplY3QobWVyZ2VkW2tleV0pICYmIGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICAvLyBAdHMtaWdub3JlOiBUeXBlICdzdHJpbmcnIGNhbm5vdCBiZSB1c2VkIHRvIGluZGV4IHR5cGUgJ1R5cGUnXG4gICAgICBtZXJnZWRba2V5XSA9IG1lcmdlKG1lcmdlZFtrZXldLCB2YWx1ZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlOiBUeXBlICdzdHJpbmcnIGNhbm5vdCBiZSB1c2VkIHRvIGluZGV4IHR5cGUgJ1R5cGUnXG4gICAgbWVyZ2VkW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmNvbnN0IHJlYWN0RWxlbWVudCA9IFN5bWJvbC5mb3IoXCJyZWFjdC5lbGVtZW50XCIpO1xuLyoqIENoZWNrIGlmIHRoZSBhcmd1bWVudCBwYXNzZWQgaXMgYSBwbGFpbiBvYmplY3QgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iajogdW5rbm93bikge1xuICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJiBvYmogIT09IG51bGwgJiZcbiAgICBvYmoudG9TdHJpbmcoKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIiAmJlxuICAgIC8vIEB0cy1pZ25vcmU6IENoZWNrIGlmIHRoZSBhcmd1bWVudCBwYXNzZWQgaXMgYSBSZWFjdCBlbGVtZW50XG4gICAgb2JqW1wiJCR0eXBlb2ZcIl0gIT09IHJlYWN0RWxlbWVudDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHRoZSBXaW5kb3dzIHBhdGhzICh0aGF0IHVzZSB0aGUgc2VwYXJhdG9yIFwiXFxcIilcbiAqIHRvIFBvc2l4IHBhdGhzICh3aXRoIHRoZSBzZXBhcmF0b3IgXCIvXCIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUGF0aChwYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIFNFUCA9PT0gXCIvXCIgPyBwYXRoIDogcGF0aC5yZXBsYWNlQWxsKFNFUCwgXCIvXCIpO1xufVxuXG4vKipcbiAqIFNlYXJjaCBhbiBleHRlbnNpb24gaW4gYSBtYXAuXG4gKiBJdCdzIHVzZWZ1bCBmb3IgY2FzZXMgaW4gd2hpY2ggdGhlIGV4dGVuc2lvbiBpcyBtdWx0aXBsZS5cbiAqIEV4YW1wbGU6IHBhZ2UudG1wbC5qc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoQnlFeHRlbnNpb248VHlwZT4oXG4gIHBhdGg6IHN0cmluZyxcbiAgZXh0ZW5zaW9uczogTWFwPHN0cmluZywgVHlwZT4sXG4pOiBbc3RyaW5nLCBUeXBlXSB8IHVuZGVmaW5lZCB7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGV4dGVuc2lvbnMpIHtcbiAgICBpZiAocGF0aC5lbmRzV2l0aChrZXkpKSB7XG4gICAgICByZXR1cm4gW2tleSwgdmFsdWVdO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ29udmVydCBhbiBIVE1MRG9jdW1lbnQgaW5zdGFuY2UgdG8gYSBzdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBkb2N1bWVudFRvU3RyaW5nKGRvY3VtZW50OiBIVE1MRG9jdW1lbnQpIHtcbiAgY29uc3QgeyBkb2N0eXBlLCBkb2N1bWVudEVsZW1lbnQgfSA9IGRvY3VtZW50O1xuXG4gIGlmICghZG9jdHlwZSkge1xuICAgIHJldHVybiBkb2N1bWVudEVsZW1lbnQ/Lm91dGVySFRNTCB8fCBcIlwiO1xuICB9XG5cbiAgcmV0dXJuIGA8IURPQ1RZUEUgJHtkb2N0eXBlLm5hbWV9YCArXG4gICAgKGRvY3R5cGUucHVibGljSWQgPyBgIFBVQkxJQyBcIiR7ZG9jdHlwZS5wdWJsaWNJZH1cImAgOiBcIlwiKSArXG4gICAgKCFkb2N0eXBlLnB1YmxpY0lkICYmIGRvY3R5cGUuc3lzdGVtSWQgPyBcIiBTWVNURU1cIiA6IFwiXCIpICtcbiAgICAoZG9jdHlwZS5zeXN0ZW1JZCA/IGAgXCIke2RvY3R5cGUuc3lzdGVtSWR9XCJgIDogXCJcIikgK1xuICAgIGA+XFxuJHtkb2N1bWVudEVsZW1lbnQ/Lm91dGVySFRNTH1gO1xufVxuXG5jb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG5cbi8qKiBQYXJzZSBhIHN0cmluZyB3aXRoIEhUTUwgY29kZSBhbmQgcmV0dXJuIGFuIEhUTUxEb2N1bWVudCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvRG9jdW1lbnQoc3RyaW5nOiBzdHJpbmcpOiBIVE1MRG9jdW1lbnQge1xuICBjb25zdCBkb2N1bWVudCA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoc3RyaW5nLCBcInRleHQvaHRtbFwiKTtcblxuICBpZiAoIWRvY3VtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIHBhcnNlIHRoZSBIVE1MIGNvZGVcIik7XG4gIH1cblxuICByZXR1cm4gZG9jdW1lbnQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXJyb3JEYXRhIHtcbiAgY2F1c2U/OiBFcnJvcjtcbiAgbmFtZT86IHN0cmluZztcbiAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbn1cblxuLyoqXG4gKiBHZW5lcmljIEV4Y2VwdGlvbiB0byB0aHJvdyBlcnJvcnMuXG4gKiBJdCBhbGxvd3MgdG8gaW5jbHVkZSBleHRyYSBkYXRhIGFuZCB0aGUgcHJldmlvdXMgZXhjZXB0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige1xuICBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG5cbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBkYXRhOiBFcnJvckRhdGEgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhLmNhdXNlID8geyBjYXVzZTogZGF0YS5jYXVzZSB9IDoge307XG4gICAgZGVsZXRlIGRhdGEuY2F1c2U7XG5cbiAgICBzdXBlcihtZXNzYWdlLCBvcHRpb25zKTtcblxuICAgIGlmIChkYXRhLm5hbWUpIHtcbiAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgIGRlbGV0ZSBkYXRhLm5hbWU7XG4gICAgfVxuXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FybihtZXNzYWdlOiBzdHJpbmcsIGRhdGE6IEVycm9yRGF0YSA9IHt9KSB7XG4gIGNvbnN0IG5hbWUgPSBkYXRhLm5hbWUgfHwgXCJXYXJuaW5nXCI7XG4gIGRlbGV0ZSBkYXRhLm5hbWU7XG5cbiAgY29uc29sZS53YXJuKFwi4pqg77iPIFwiICsgYm9sZCh5ZWxsb3cobmFtZSkpLCBtZXNzYWdlKTtcblxuICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZGF0YSA/PyB7fSkpIHtcbiAgICBpZiAoa2V5ID09PSBcInBhZ2VcIikge1xuICAgICAgdmFsdWUgPSAodmFsdWUgYXMgUGFnZSkuc3JjLnBhdGggKyAodmFsdWUgYXMgUGFnZSkuc3JjLmV4dDtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgVVJMKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coZGltKGAgICR7a2V5fTpgKSwgdmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0V4dGVuc2lvbnMoZXh0ZW5zaW9uczogc3RyaW5nW10pIHtcbiAgZXh0ZW5zaW9ucy5mb3JFYWNoKChleHRlbnNpb24pID0+IHtcbiAgICBpZiAoZXh0ZW5zaW9uLmNoYXJBdCgwKSAhPT0gXCIuXCIpIHtcbiAgICAgIHRocm93IG5ldyBFeGNlcHRpb24oXG4gICAgICAgIFwiSW52YWxpZCBleHRlbnNpb24uIEl0IG11c3Qgc3RhcnQgd2l0aCAnLidcIixcbiAgICAgICAgeyBleHRlbnNpb24gfSxcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBzZXJ2ZUZpbGVPcHRpb25zIHtcbiAgcm9vdDogc3RyaW5nO1xuICBkaXJlY3RvcnlJbmRleDogYm9vbGVhbjtcbiAgcGFnZTQwNDogc3RyaW5nO1xuICByb3V0ZXI/OiAodXJsOiBVUkwpID0+IFByb21pc2U8RmlsZVJlc3BvbnNlIHwgdW5kZWZpbmVkPjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcnZlRmlsZShcbiAgdXJsOiBVUkwsXG4gIHsgcm9vdCwgZGlyZWN0b3J5SW5kZXgsIHBhZ2U0MDQsIHJvdXRlciB9OiBzZXJ2ZUZpbGVPcHRpb25zLFxuKTogUHJvbWlzZTxGaWxlUmVzcG9uc2U+IHtcbiAgY29uc3QgeyBwYXRobmFtZSB9ID0gdXJsO1xuICBsZXQgcGF0aCA9IGpvaW4ocm9vdCwgcGF0aG5hbWUpO1xuXG4gIHRyeSB7XG4gICAgaWYgKHBhdGguZW5kc1dpdGgoU0VQKSkge1xuICAgICAgcGF0aCArPSBcImluZGV4Lmh0bWxcIjtcbiAgICB9XG5cbiAgICAvLyBSZWRpcmVjdCAvZXhhbXBsZSB0byAvZXhhbXBsZS9cbiAgICBjb25zdCBpbmZvID0gYXdhaXQgRGVuby5zdGF0KHBhdGgpO1xuXG4gICAgaWYgKGluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIG51bGwsXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXM6IDMwMSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBcImxvY2F0aW9uXCI6IGpvaW4ocGF0aG5hbWUsIFwiL1wiKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXTtcbiAgICB9XG5cbiAgICAvLyBTZXJ2ZSB0aGUgc3RhdGljIGZpbGVcbiAgICByZXR1cm4gW1xuICAgICAgYXdhaXQgRGVuby5yZWFkRmlsZShwYXRoKSxcbiAgICAgIHtcbiAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBtaW1lcy5nZXQoZXh0bmFtZShwYXRoKS50b0xvd2VyQ2FzZSgpKSB8fFxuICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gU2VydmUgcGFnZXMgb24gZGVtYW5kXG4gICAgaWYgKHJvdXRlcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcm91dGVyKHVybCk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOb3QgZm91bmQgcGFnZVxuICAgIGxldCBib2R5OiBCb2R5SW5pdCA9IFwiTm90IGZvdW5kXCI7XG5cbiAgICB0cnkge1xuICAgICAgYm9keSA9IGF3YWl0IERlbm8ucmVhZEZpbGUoam9pbihyb290LCBwYWdlNDA0KSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBpZiAoZGlyZWN0b3J5SW5kZXgpIHtcbiAgICAgICAgYm9keSA9IGF3YWl0IGdldERpcmVjdG9yeUluZGV4KHJvb3QsIHBhdGhuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgYm9keSxcbiAgICAgIHtcbiAgICAgICAgc3RhdHVzOiA0MDQsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBtaW1lcy5nZXQoXCIuaHRtbFwiKSEsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF07XG4gIH1cbn1cblxuLyoqIEdlbmVyYXRlIHRoZSBkZWZhdWx0IGJvZHkgZm9yIGEgNDA0IHJlc3BvbnNlICovXG5hc3luYyBmdW5jdGlvbiBnZXREaXJlY3RvcnlJbmRleChyb290OiBzdHJpbmcsIGZpbGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGZvbGRlcnM6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICBjb25zdCBmaWxlczogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG5cbiAgdHJ5IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGluZm8gb2YgRGVuby5yZWFkRGlyKGpvaW4ocm9vdCwgZmlsZSkpKSB7XG4gICAgICBpbmZvLmlzRGlyZWN0b3J5XG4gICAgICAgID8gZm9sZGVycy5wdXNoKFtgJHtpbmZvLm5hbWV9L2AsIGDwn5OBICR7aW5mby5uYW1lfS9gXSlcbiAgICAgICAgOiBmaWxlcy5wdXNoKFtpbmZvLm5hbWUsIGDwn5OEICR7aW5mby5uYW1lfWBdKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIEl0J3Mgbm90IGEgZGlyZWN0b3J5XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZm9sZGVycy5jb25jYXQoZmlsZXMpO1xuXG4gIGlmIChmaWxlLm1hdGNoKC8uK1xcLy4rLykpIHtcbiAgICBjb250ZW50LnVuc2hpZnQoW1wiLi4vXCIsIFwiLi5cIl0pO1xuICB9XG5cbiAgcmV0dXJuIGBcbiAgPCFET0NUWVBFIGh0bWw+XG4gICAgPGh0bWwgbGFuZz1cImVuXCI+XG4gICAgPGhlYWQ+XG4gICAgICA8bWV0YSBjaGFyc2V0PVwiVVRGLThcIj5cbiAgICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCI+XG4gICAgICA8dGl0bGU+NDA0IC0gTm90IGZvdW5kPC90aXRsZT5cbiAgICAgIDxzdHlsZT4gYm9keSB7IGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDQwZW07IG1hcmdpbjogYXV0bzsgcGFkZGluZzogMmVtOyBsaW5lLWhlaWdodDogMS41OyB9PC9zdHlsZT5cbiAgICA8L2hlYWQ+XG4gICAgPGJvZHk+XG4gICAgICA8aDE+NDA0IC0gTm90IGZvdW5kPC9oMT5cbiAgICAgIDxwPlRoZSBVUkwgPGNvZGU+JHtmaWxlfTwvY29kZT4gZG9lcyBub3QgZXhpc3Q8L3A+XG4gICAgICA8dWw+XG4gICAgJHtcbiAgICBjb250ZW50Lm1hcCgoW3VybCwgbmFtZV0pID0+IGBcbiAgICAgIDxsaT5cbiAgICAgICAgPGEgaHJlZj1cIiR7dXJsfVwiPlxuICAgICAgICAgICR7bmFtZX1cbiAgICAgICAgPC9hPlxuICAgICAgPC9saT5gKS5qb2luKFwiXFxuXCIpXG4gIH1cbiAgICAgIDwvdWw+XG4gICAgPC9ib2R5PlxuICA8L2h0bWw+YDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsU0FBUyxRQUFzQixDQUFnQjtBQUN4RCxNQUFNLEdBQUcsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBaUI7QUFDcEQsTUFBTSxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxRQUFRLENBQW1CO0FBR3JELEVBQXVFLEFBQXZFLG1FQUF1RSxBQUF2RSxFQUF1RSxDQUN2RSxNQUFNLGdCQUFnQixVQUFVLENBQzlCLFFBQThDLEVBQzlDLFVBQTJDLEVBQzNDLEtBQUssR0FBRyxHQUFHLEVBQ1gsQ0FBQztJQUNELEtBQUssQ0FBQyxTQUFTLEdBQXVCLENBQUMsQ0FBQztJQUV4QyxHQUFHLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUMsQ0FBQyxHQUFxQixVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksS0FDL0MsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDOztRQUcxQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEIsRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7WUFDOUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUztRQUM5QixDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVM7QUFDN0IsQ0FBQztBQUVELEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLENBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQXdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQWE7SUFBQSxDQUFDO0lBQ3ZCLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBWTtJQUFBLENBQUM7SUFDdkIsQ0FBQztRQUFBLENBQU87UUFBRSxDQUFxQztJQUFBLENBQUM7SUFDaEQsQ0FBQztRQUFBLENBQU87UUFBRSxDQUFZO0lBQUEsQ0FBQztJQUN2QixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3JCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBeUI7SUFBQSxDQUFDO0lBQ25DLENBQUM7UUFBQSxDQUFLO1FBQUUsQ0FBd0I7SUFBQSxDQUFDO0lBQ2pDLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBd0I7SUFBQSxDQUFDO0lBQ2xDLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBc0I7SUFBQSxDQUFDO0lBQ2pDLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBYztJQUFBLENBQUM7SUFDekIsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFXO0lBQUEsQ0FBQztJQUNyQixDQUFDO1FBQUEsQ0FBSztRQUFFLENBQWlCO0lBQUEsQ0FBQztJQUMxQixDQUFDO1FBQUEsQ0FBTztRQUFFLENBQVk7SUFBQSxDQUFDO0lBQ3ZCLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBWTtJQUFBLENBQUM7SUFDdkIsQ0FBQztRQUFBLENBQU87UUFBRSxDQUEwQjtJQUFBLENBQUM7SUFDckMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUEwQjtJQUFBLENBQUM7SUFDcEMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFjO0lBQUEsQ0FBQztJQUN4QixDQUFDO1FBQUEsQ0FBTztRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3RCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBVztJQUFBLENBQUM7SUFDckIsQ0FBQztRQUFBLENBQUs7UUFBRSxDQUFnQztJQUFBLENBQUM7SUFDekMsQ0FBQztRQUFBLENBQU87UUFBRSxDQUFrQjtJQUFBLENBQUM7SUFDN0IsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFzQztJQUFBLENBQUM7SUFDaEQsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFrQztJQUFBLENBQUM7SUFDNUMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFrQjtJQUFBLENBQUM7SUFDNUIsQ0FBQztRQUFBLENBQUs7UUFBRSxDQUE4QjtJQUFBLENBQUM7SUFDdkMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFZO0lBQUEsQ0FBQztJQUN0QixDQUFDO1FBQUEsQ0FBTztRQUFFLENBQVk7SUFBQSxDQUFDO0lBQ3ZCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBd0I7SUFBQSxDQUFDO0lBQ2xDLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBa0I7SUFBQSxDQUFDO0lBQzVCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBaUI7SUFBQSxDQUFDO0lBQzNCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBVztJQUFBLENBQUM7SUFDckIsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFXO0lBQUEsQ0FBQztJQUNyQixDQUFDO1FBQUEsQ0FBTztRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3RCLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBVztJQUFBLENBQUM7SUFDdEIsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFXO0lBQUEsQ0FBQztJQUNyQixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3JCLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBVztJQUFBLENBQUM7SUFDdEIsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFVO0lBQUEsQ0FBQztJQUNwQixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQWlCO0lBQUEsQ0FBQztJQUMzQixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3JCLENBQUM7UUFBQSxDQUFLO1FBQUUsQ0FBd0I7SUFBQSxDQUFDO0lBQ2pDLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBcUI7SUFBQSxDQUFDO0lBQy9CLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBb0M7SUFBQSxDQUFDO0lBQzlDLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBb0M7SUFBQSxDQUFDO0lBQzlDLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBaUI7SUFBQSxDQUFDO0lBQzNCLENBQUM7UUFBQSxDQUFNO1FBQUUsQ0FBOEI7SUFBQSxDQUFDO0lBQ3hDLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBWTtJQUFBLENBQUM7SUFDdkIsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFVO0lBQUEsQ0FBQztJQUNwQixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQTJCO0lBQUEsQ0FBQztJQUNyQyxDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQXlCO0lBQUEsQ0FBQztJQUNuQyxDQUFDO1FBQUEsQ0FBTztRQUFFLENBQWtCO0lBQUEsQ0FBQztJQUM3QixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3JCLENBQUM7UUFBQSxDQUFPO1FBQUUsQ0FBWTtJQUFBLENBQUM7SUFDdkIsQ0FBQztRQUFBLENBQWM7UUFBRSxDQUEyQjtJQUFBLENBQUM7SUFDN0MsQ0FBQztRQUFBLENBQU87UUFBRSxDQUFZO0lBQUEsQ0FBQztJQUN2QixDQUFDO1FBQUEsQ0FBTztRQUFFLENBQVc7SUFBQSxDQUFDO0lBQ3RCLENBQUM7UUFBQSxDQUFRO1FBQUUsQ0FBWTtJQUFBLENBQUM7SUFDeEIsQ0FBQztRQUFBLENBQU87UUFBRSxDQUEwQjtJQUFBLENBQUM7SUFDckMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUEwQjtJQUFBLENBQUM7SUFDcEMsQ0FBQztRQUFBLENBQU07UUFBRSxDQUFVO0lBQUEsQ0FBQztJQUNwQixDQUFDO1FBQUEsQ0FBTTtRQUFFLENBQWlCO0lBQUEsQ0FBQztBQUM3QixDQUFDO0FBRUQsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csQ0FDSCxNQUFNLFVBQVUsS0FBSyxDQUNuQixRQUFjLEVBQ2QsSUFBb0IsRUFDcEIsQ0FBQztJQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztXQUFJLFFBQVE7SUFBQyxDQUFDO0lBRTlCLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQztRQUNWLE1BQU0sQ0FBQyxNQUFNO0lBQ2YsQ0FBQztJQUVELEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRyxDQUFDO1FBQ2hELEVBQStGLEFBQS9GLDZGQUErRjtRQUMvRixFQUFFLEVBQUUsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sYUFBYSxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQ3ZELEVBQWdFLEFBQWhFLDhEQUFnRTtZQUNoRSxNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUs7WUFDdEMsUUFBUTtRQUNWLENBQUM7UUFFRCxFQUFnRSxBQUFoRSw4REFBZ0U7UUFDaEUsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLO0lBQ3JCLENBQUM7SUFFRCxNQUFNLENBQUMsTUFBTTtBQUNmLENBQUM7QUFFRCxLQUFLLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBZTtBQUMvQyxFQUFxRCxBQUFyRCxpREFBcUQsQUFBckQsRUFBcUQsQ0FDckQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFZLEVBQUUsQ0FBQztJQUMzQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFRLFdBQUksR0FBRyxLQUFLLElBQUksSUFDNUMsR0FBRyxDQUFDLFFBQVEsT0FBTyxDQUFpQixvQkFDcEMsRUFBOEQsQUFBOUQsNERBQThEO0lBQzlELEdBQUcsQ0FBQyxDQUFVLGVBQU0sWUFBWTtBQUNwQyxDQUFDO0FBRUQsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csQ0FDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLElBQVksRUFBRSxDQUFDO0lBQzNDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBRyxLQUFHLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFHO0FBQ3RELENBQUM7QUFFRCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsQ0FDSCxNQUFNLFVBQVUsaUJBQWlCLENBQy9CLElBQVksRUFDWixVQUE2QixFQUNELENBQUM7SUFDN0IsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxLQUFLLFVBQVUsQ0FBRSxDQUFDO1FBQ3RDLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxDQUFDO2dCQUFBLEdBQUc7Z0JBQUUsS0FBSztZQUFBLENBQUM7UUFDckIsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsRUFBbUQsQUFBbkQsK0NBQW1ELEFBQW5ELEVBQW1ELENBQ25ELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxRQUFzQixFQUFFLENBQUM7SUFDeEQsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUUsZUFBZSxFQUFDLENBQUMsR0FBRyxRQUFRO0lBRTdDLEVBQUUsR0FBRyxPQUFPLEVBQUUsQ0FBQztRQUNiLE1BQU0sQ0FBQyxlQUFlLEVBQUUsU0FBUyxJQUFJLENBQUU7SUFDekMsQ0FBQztJQUVELE1BQU0sRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLElBQUksTUFDN0IsT0FBTyxDQUFDLFFBQVEsSUFBSSxTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBRSxPQUN0RCxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBUyxXQUFHLENBQUUsTUFDdEQsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBRSxNQUNoRCxHQUFHLEVBQUUsZUFBZSxFQUFFLFNBQVM7QUFDcEMsQ0FBQztBQUVELEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVM7QUFFNUIsRUFBK0QsQUFBL0QsMkRBQStELEFBQS9ELEVBQStELENBQy9ELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxNQUFjLEVBQWdCLENBQUM7SUFDOUQsS0FBSyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFXO0lBRTNELEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQStCO0lBQ2pELENBQUM7SUFFRCxNQUFNLENBQUMsUUFBUTtBQUNqQixDQUFDO0FBUUQsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csQ0FDSCxNQUFNLE9BQU8sU0FBUyxTQUFTLEtBQUs7SUFDbEMsSUFBSTtnQkFFUSxPQUFlLEVBQUUsSUFBZSxHQUFHLENBQUM7SUFBQSxDQUFDLENBQUUsQ0FBQztRQUNsRCxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQztZQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztRQUFDLENBQUMsR0FBRyxDQUFDO1FBQUEsQ0FBQztRQUN2RCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFFakIsS0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPO1FBRXRCLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJO1lBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtRQUNsQixDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO0lBQ2xCLENBQUM7O0FBR0gsTUFBTSxVQUFVLElBQUksQ0FBQyxPQUFlLEVBQUUsSUFBZSxHQUFHLENBQUM7QUFBQSxDQUFDLEVBQUUsQ0FBQztJQUMzRCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBUztJQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUk7SUFFaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFLLFdBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksT0FBTztJQUVoRCxHQUFELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEtBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQztJQUFBLENBQUMsRUFBRyxDQUFDO1FBQ3BELEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBTSxPQUFFLENBQUM7WUFDbkIsS0FBSyxHQUFJLEtBQUssQ0FBVSxHQUFHLENBQUMsSUFBSSxHQUFJLEtBQUssQ0FBVSxHQUFHLENBQUMsR0FBRztRQUM1RCxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssWUFBWSxLQUFLLEVBQUUsQ0FBQztZQUNsQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVE7UUFDeEIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDaEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRO1FBQ3hCLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLO0lBQ3JDLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxVQUFvQixFQUFFLENBQUM7SUFDckQsVUFBVSxDQUFDLE9BQU8sRUFBRSxTQUFTLEdBQUssQ0FBQztRQUNqQyxFQUFFLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBRyxJQUFFLENBQUM7WUFDaEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQ2pCLENBQTJDLDRDQUMzQyxDQUFDO2dCQUFDLFNBQVM7WUFBQyxDQUFDO1FBRWpCLENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQVNELE1BQU0sZ0JBQWdCLFNBQVMsQ0FDN0IsR0FBUSxFQUNSLENBQUMsQ0FBQyxJQUFJLEdBQUUsY0FBYyxHQUFFLE9BQU8sR0FBRSxNQUFNLEVBQW1CLENBQUMsRUFDcEMsQ0FBQztJQUN4QixLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUcsR0FBRztJQUN4QixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUTtJQUU5QixHQUFHLENBQUMsQ0FBQztRQUNILEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3ZCLElBQUksSUFBSSxDQUFZO1FBQ3RCLENBQUM7UUFFRCxFQUFpQyxBQUFqQywrQkFBaUM7UUFDakMsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1FBRWpDLEVBQUUsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLENBQUM7Z0JBQ04sSUFBSTtnQkFDSixDQUFDO29CQUNDLE1BQU0sRUFBRSxHQUFHO29CQUNYLE9BQU8sRUFBRSxDQUFDO3dCQUNSLENBQVUsV0FBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUc7b0JBQ2hDLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBd0IsQUFBeEIsc0JBQXdCO1FBQ3hCLE1BQU0sQ0FBQyxDQUFDO1lBQ04sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSTtZQUN4QixDQUFDO2dCQUNDLE1BQU0sRUFBRSxHQUFHO2dCQUNYLE9BQU8sRUFBRSxDQUFDO29CQUNSLENBQWMsZUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxPQUNqRCxDQUEwQjtnQkFDOUIsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLEtBQUssRUFBQyxDQUFDO1FBQ1AsRUFBd0IsQUFBeEIsc0JBQXdCO1FBQ3hCLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUNYLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHO1lBRS9CLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDWCxNQUFNLENBQUMsTUFBTTtZQUNmLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBaUIsQUFBakIsZUFBaUI7UUFDakIsR0FBRyxDQUFDLElBQUksR0FBYSxDQUFXO1FBRWhDLEdBQUcsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTztRQUMvQyxDQUFDLENBQUMsS0FBSyxFQUFDLENBQUM7WUFDUCxFQUFFLEVBQUUsY0FBYyxFQUFFLENBQUM7Z0JBQ25CLElBQUksR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFFBQVE7WUFDL0MsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLENBQUMsQ0FBQztZQUNOLElBQUk7WUFDSixDQUFDO2dCQUNDLE1BQU0sRUFBRSxHQUFHO2dCQUNYLE9BQU8sRUFBRSxDQUFDO29CQUNSLENBQWMsZUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQU87Z0JBQ25DLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsRUFBbUQsQUFBbkQsK0NBQW1ELEFBQW5ELEVBQW1ELGdCQUNwQyxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFtQixDQUFDO0lBQzdFLEtBQUssQ0FBQyxPQUFPLEdBQXVCLENBQUMsQ0FBQztJQUN0QyxLQUFLLENBQUMsS0FBSyxHQUF1QixDQUFDLENBQUM7SUFFcEMsR0FBRyxDQUFDLENBQUM7UUFDSCxHQUFHLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxHQUFJLENBQUM7WUFDeEQsSUFBSSxDQUFDLFdBQVcsR0FDWixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7bUJBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUFJLEtBQUUsRUFBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFBQyxDQUFDLElBQ2pELEtBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFBQSxJQUFJLENBQUMsSUFBSTtpQkFBRyxLQUFFLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFBRSxDQUFDO1FBQzlDLENBQUM7SUFDSCxDQUFDLENBQUMsS0FBSyxFQUFDLENBQUM7SUFDUCxFQUF1QixBQUF2QixxQkFBdUI7SUFDekIsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLO0lBRXBDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxZQUFZLENBQUM7UUFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQUEsQ0FBSztZQUFFLENBQUk7UUFBQSxDQUFDO0lBQy9CLENBQUM7SUFFRCxNQUFNLEVBQUUsc1lBV2EsRUFBRSxJQUFJLENBQUMsMENBRTFCLEVBQ0EsT0FBTyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsSUFBSSxLQUFPLDZCQUVqQixFQUFFLEdBQUcsQ0FBQyxhQUNiLEVBQUUsSUFBSSxDQUFDLHlCQUVOO01BQUcsSUFBSSxDQUFDLENBQUksS0FDcEIsa0NBR007QUFDVCxDQUFDIn0=