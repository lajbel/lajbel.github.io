// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Logger } from "./logger.ts";
import { BaseHandler, ConsoleHandler, FileHandler, RotatingFileHandler, WriterHandler } from "./handlers.ts";
import { assert } from "../_util/assert.ts";
export { LogLevels } from "./levels.ts";
export { Logger } from "./logger.ts";
export class LoggerConfig {
    level;
    handlers;
}
const DEFAULT_LEVEL = "INFO";
const DEFAULT_CONFIG = {
    handlers: {
        default: new ConsoleHandler(DEFAULT_LEVEL)
    },
    loggers: {
        default: {
            level: DEFAULT_LEVEL,
            handlers: [
                "default"
            ]
        }
    }
};
const state = {
    handlers: new Map(),
    loggers: new Map(),
    config: DEFAULT_CONFIG
};
const handlers1 = {
    BaseHandler,
    ConsoleHandler,
    WriterHandler,
    FileHandler,
    RotatingFileHandler
};
export { handlers1 as handlers };
/** Get a logger instance. If not specified `name`, get the default logger.  */ export function getLogger(name) {
    if (!name) {
        const d = state.loggers.get("default");
        assert(d != null, `"default" logger must be set for getting logger without name`);
        return d;
    }
    const result = state.loggers.get(name);
    if (!result) {
        const logger = new Logger(name, "NOTSET", {
            handlers: []
        });
        state.loggers.set(name, logger);
        return logger;
    }
    return result;
}
export function debug(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").debug(msg, ...args);
    }
    return getLogger("default").debug(msg, ...args);
}
export function info(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").info(msg, ...args);
    }
    return getLogger("default").info(msg, ...args);
}
export function warning(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").warning(msg, ...args);
    }
    return getLogger("default").warning(msg, ...args);
}
export function error(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").error(msg, ...args);
    }
    return getLogger("default").error(msg, ...args);
}
export function critical(msg, ...args) {
    // Assist TS compiler with pass-through generic type
    if (msg instanceof Function) {
        return getLogger("default").critical(msg, ...args);
    }
    return getLogger("default").critical(msg, ...args);
}
/** Setup logger config. */ export async function setup(config) {
    state.config = {
        handlers: {
            ...DEFAULT_CONFIG.handlers,
            ...config.handlers
        },
        loggers: {
            ...DEFAULT_CONFIG.loggers,
            ...config.loggers
        }
    };
    // tear down existing handlers
    state.handlers.forEach((handler)=>{
        handler.destroy();
    });
    state.handlers.clear();
    // setup handlers
    const handlers = state.config.handlers || {
    };
    for(const handlerName in handlers){
        const handler = handlers[handlerName];
        await handler.setup();
        state.handlers.set(handlerName, handler);
    }
    // remove existing loggers
    state.loggers.clear();
    // setup loggers
    const loggers = state.config.loggers || {
    };
    for(const loggerName in loggers){
        const loggerConfig = loggers[loggerName];
        const handlerNames = loggerConfig.handlers || [];
        const handlers = [];
        handlerNames.forEach((handlerName)=>{
            const handler = state.handlers.get(handlerName);
            if (handler) {
                handlers.push(handler);
            }
        });
        const levelName = loggerConfig.level || DEFAULT_LEVEL;
        const logger = new Logger(loggerName, levelName, {
            handlers: handlers
        });
        state.loggers.set(loggerName, logger);
    }
}
await setup(DEFAULT_CONFIG);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL2xvZy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBHZW5lcmljRnVuY3Rpb24gfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7XG4gIEJhc2VIYW5kbGVyLFxuICBDb25zb2xlSGFuZGxlcixcbiAgRmlsZUhhbmRsZXIsXG4gIFJvdGF0aW5nRmlsZUhhbmRsZXIsXG4gIFdyaXRlckhhbmRsZXIsXG59IGZyb20gXCIuL2hhbmRsZXJzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IExldmVsTmFtZSB9IGZyb20gXCIuL2xldmVscy50c1wiO1xuXG5leHBvcnQgeyBMb2dMZXZlbHMgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmV4cG9ydCB0eXBlIHsgTGV2ZWxOYW1lIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5leHBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcblxuZXhwb3J0IGNsYXNzIExvZ2dlckNvbmZpZyB7XG4gIGxldmVsPzogTGV2ZWxOYW1lO1xuICBoYW5kbGVycz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ0NvbmZpZyB7XG4gIGhhbmRsZXJzPzoge1xuICAgIFtuYW1lOiBzdHJpbmddOiBCYXNlSGFuZGxlcjtcbiAgfTtcbiAgbG9nZ2Vycz86IHtcbiAgICBbbmFtZTogc3RyaW5nXTogTG9nZ2VyQ29uZmlnO1xuICB9O1xufVxuXG5jb25zdCBERUZBVUxUX0xFVkVMID0gXCJJTkZPXCI7XG5jb25zdCBERUZBVUxUX0NPTkZJRzogTG9nQ29uZmlnID0ge1xuICBoYW5kbGVyczoge1xuICAgIGRlZmF1bHQ6IG5ldyBDb25zb2xlSGFuZGxlcihERUZBVUxUX0xFVkVMKSxcbiAgfSxcblxuICBsb2dnZXJzOiB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgbGV2ZWw6IERFRkFVTFRfTEVWRUwsXG4gICAgICBoYW5kbGVyczogW1wiZGVmYXVsdFwiXSxcbiAgICB9LFxuICB9LFxufTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gIGhhbmRsZXJzOiBuZXcgTWFwPHN0cmluZywgQmFzZUhhbmRsZXI+KCksXG4gIGxvZ2dlcnM6IG5ldyBNYXA8c3RyaW5nLCBMb2dnZXI+KCksXG4gIGNvbmZpZzogREVGQVVMVF9DT05GSUcsXG59O1xuXG5leHBvcnQgY29uc3QgaGFuZGxlcnMgPSB7XG4gIEJhc2VIYW5kbGVyLFxuICBDb25zb2xlSGFuZGxlcixcbiAgV3JpdGVySGFuZGxlcixcbiAgRmlsZUhhbmRsZXIsXG4gIFJvdGF0aW5nRmlsZUhhbmRsZXIsXG59O1xuXG4vKiogR2V0IGEgbG9nZ2VyIGluc3RhbmNlLiBJZiBub3Qgc3BlY2lmaWVkIGBuYW1lYCwgZ2V0IHRoZSBkZWZhdWx0IGxvZ2dlci4gICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9nZ2VyKG5hbWU/OiBzdHJpbmcpOiBMb2dnZXIge1xuICBpZiAoIW5hbWUpIHtcbiAgICBjb25zdCBkID0gc3RhdGUubG9nZ2Vycy5nZXQoXCJkZWZhdWx0XCIpO1xuICAgIGFzc2VydChcbiAgICAgIGQgIT0gbnVsbCxcbiAgICAgIGBcImRlZmF1bHRcIiBsb2dnZXIgbXVzdCBiZSBzZXQgZm9yIGdldHRpbmcgbG9nZ2VyIHdpdGhvdXQgbmFtZWAsXG4gICAgKTtcbiAgICByZXR1cm4gZDtcbiAgfVxuICBjb25zdCByZXN1bHQgPSBzdGF0ZS5sb2dnZXJzLmdldChuYW1lKTtcbiAgaWYgKCFyZXN1bHQpIHtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKG5hbWUsIFwiTk9UU0VUXCIsIHsgaGFuZGxlcnM6IFtdIH0pO1xuICAgIHN0YXRlLmxvZ2dlcnMuc2V0KG5hbWUsIGxvZ2dlcik7XG4gICAgcmV0dXJuIGxvZ2dlcjtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogTG9nIHdpdGggZGVidWcgbGV2ZWwsIHVzaW5nIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBkZWJ1ZzxUPihcbiAgbXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGVidWc8VD4oXG4gIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQgfCB1bmRlZmluZWQge1xuICAvLyBBc3Npc3QgVFMgY29tcGlsZXIgd2l0aCBwYXNzLXRocm91Z2ggZ2VuZXJpYyB0eXBlXG4gIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmRlYnVnKG1zZywgLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuZGVidWcobXNnLCAuLi5hcmdzKTtcbn1cblxuLyoqIExvZyB3aXRoIGluZm8gbGV2ZWwsIHVzaW5nIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZm88VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIGluZm88VD4oXG4gIG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGluZm88VD4oXG4gIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQgfCB1bmRlZmluZWQge1xuICAvLyBBc3Npc3QgVFMgY29tcGlsZXIgd2l0aCBwYXNzLXRocm91Z2ggZ2VuZXJpYyB0eXBlXG4gIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmluZm8obXNnLCAuLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5pbmZvKG1zZywgLi4uYXJncyk7XG59XG5cbi8qKiBMb2cgd2l0aCB3YXJuaW5nIGxldmVsLCB1c2luZyBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YXJuaW5nPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiB3YXJuaW5nPFQ+KFxuICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVDtcbmV4cG9ydCBmdW5jdGlvbiB3YXJuaW5nPFQ+KFxuICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgLy8gQXNzaXN0IFRTIGNvbXBpbGVyIHdpdGggcGFzcy10aHJvdWdoIGdlbmVyaWMgdHlwZVxuICBpZiAobXNnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS53YXJuaW5nKG1zZywgLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikud2FybmluZyhtc2csIC4uLmFyZ3MpO1xufVxuXG4vKiogTG9nIHdpdGggZXJyb3IgbGV2ZWwsIHVzaW5nIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVycm9yPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBlcnJvcjxUPihcbiAgbXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZXJyb3I8VD4oXG4gIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQgfCB1bmRlZmluZWQge1xuICAvLyBBc3Npc3QgVFMgY29tcGlsZXIgd2l0aCBwYXNzLXRocm91Z2ggZ2VuZXJpYyB0eXBlXG4gIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmVycm9yKG1zZywgLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuZXJyb3IobXNnLCAuLi5hcmdzKTtcbn1cblxuLyoqIExvZyB3aXRoIGNyaXRpY2FsIGxldmVsLCB1c2luZyBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcml0aWNhbDxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gY3JpdGljYWw8VD4oXG4gIG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGNyaXRpY2FsPFQ+KFxuICBtc2c6IChUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBUKSB8ICgoKSA9PiBUKSxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgLy8gQXNzaXN0IFRTIGNvbXBpbGVyIHdpdGggcGFzcy10aHJvdWdoIGdlbmVyaWMgdHlwZVxuICBpZiAobXNnIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5jcml0aWNhbChtc2csIC4uLmFyZ3MpO1xuICB9XG4gIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmNyaXRpY2FsKG1zZywgLi4uYXJncyk7XG59XG5cbi8qKiBTZXR1cCBsb2dnZXIgY29uZmlnLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZzogTG9nQ29uZmlnKSB7XG4gIHN0YXRlLmNvbmZpZyA9IHtcbiAgICBoYW5kbGVyczogeyAuLi5ERUZBVUxUX0NPTkZJRy5oYW5kbGVycywgLi4uY29uZmlnLmhhbmRsZXJzIH0sXG4gICAgbG9nZ2VyczogeyAuLi5ERUZBVUxUX0NPTkZJRy5sb2dnZXJzLCAuLi5jb25maWcubG9nZ2VycyB9LFxuICB9O1xuXG4gIC8vIHRlYXIgZG93biBleGlzdGluZyBoYW5kbGVyc1xuICBzdGF0ZS5oYW5kbGVycy5mb3JFYWNoKChoYW5kbGVyKTogdm9pZCA9PiB7XG4gICAgaGFuZGxlci5kZXN0cm95KCk7XG4gIH0pO1xuICBzdGF0ZS5oYW5kbGVycy5jbGVhcigpO1xuXG4gIC8vIHNldHVwIGhhbmRsZXJzXG4gIGNvbnN0IGhhbmRsZXJzID0gc3RhdGUuY29uZmlnLmhhbmRsZXJzIHx8IHt9O1xuXG4gIGZvciAoY29uc3QgaGFuZGxlck5hbWUgaW4gaGFuZGxlcnMpIHtcbiAgICBjb25zdCBoYW5kbGVyID0gaGFuZGxlcnNbaGFuZGxlck5hbWVdO1xuICAgIGF3YWl0IGhhbmRsZXIuc2V0dXAoKTtcbiAgICBzdGF0ZS5oYW5kbGVycy5zZXQoaGFuZGxlck5hbWUsIGhhbmRsZXIpO1xuICB9XG5cbiAgLy8gcmVtb3ZlIGV4aXN0aW5nIGxvZ2dlcnNcbiAgc3RhdGUubG9nZ2Vycy5jbGVhcigpO1xuXG4gIC8vIHNldHVwIGxvZ2dlcnNcbiAgY29uc3QgbG9nZ2VycyA9IHN0YXRlLmNvbmZpZy5sb2dnZXJzIHx8IHt9O1xuICBmb3IgKGNvbnN0IGxvZ2dlck5hbWUgaW4gbG9nZ2Vycykge1xuICAgIGNvbnN0IGxvZ2dlckNvbmZpZyA9IGxvZ2dlcnNbbG9nZ2VyTmFtZV07XG4gICAgY29uc3QgaGFuZGxlck5hbWVzID0gbG9nZ2VyQ29uZmlnLmhhbmRsZXJzIHx8IFtdO1xuICAgIGNvbnN0IGhhbmRsZXJzOiBCYXNlSGFuZGxlcltdID0gW107XG5cbiAgICBoYW5kbGVyTmFtZXMuZm9yRWFjaCgoaGFuZGxlck5hbWUpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBzdGF0ZS5oYW5kbGVycy5nZXQoaGFuZGxlck5hbWUpO1xuICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGxldmVsTmFtZSA9IGxvZ2dlckNvbmZpZy5sZXZlbCB8fCBERUZBVUxUX0xFVkVMO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIobG9nZ2VyTmFtZSwgbGV2ZWxOYW1lLCB7IGhhbmRsZXJzOiBoYW5kbGVycyB9KTtcbiAgICBzdGF0ZS5sb2dnZXJzLnNldChsb2dnZXJOYW1lLCBsb2dnZXIpO1xuICB9XG59XG5cbmF3YWl0IHNldHVwKERFRkFVTFRfQ09ORklHKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFhO0FBRXBDLE1BQU0sR0FD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