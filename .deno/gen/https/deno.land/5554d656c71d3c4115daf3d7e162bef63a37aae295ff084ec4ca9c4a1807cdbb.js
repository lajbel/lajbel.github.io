// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2019 Denolibs authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
import { assert } from "../_util/assert.ts";
import { ERR_INVALID_ARG_TYPE, ERR_OUT_OF_RANGE } from "./_errors.ts";
import { inspect } from "./util.ts";
// deno-lint-ignore no-explicit-any
function createIterResult(value, done) {
    return {
        value,
        done
    };
}
export let defaultMaxListeners = 10;
function validateMaxListeners(n, name) {
    if (!Number.isInteger(n) || n < 0) {
        throw new ERR_OUT_OF_RANGE(name, "a non-negative number", inspect(n));
    }
}
/**
 * See also https://nodejs.org/api/events.html
 */ export class EventEmitter {
    static captureRejectionSymbol = Symbol.for("nodejs.rejection");
    static errorMonitor = Symbol("events.errorMonitor");
    static get defaultMaxListeners() {
        return defaultMaxListeners;
    }
    static set defaultMaxListeners(value) {
        validateMaxListeners(value, "defaultMaxListeners");
        defaultMaxListeners = value;
    }
    maxListeners;
    _events;
    static _alreadyWarnedEvents;
    constructor(){
        this._events = new Map();
    }
    _addListener(eventName, listener, prepend) {
        this.checkListenerArgument(listener);
        this.emit("newListener", eventName, listener);
        if (this._events.has(eventName)) {
            const listeners = this._events.get(eventName);
            if (prepend) {
                listeners.unshift(listener);
            } else {
                listeners.push(listener);
            }
        } else {
            this._events.set(eventName, [
                listener
            ]);
        }
        const max = this.getMaxListeners();
        if (max > 0 && this.listenerCount(eventName) > max) {
            const warning = new MaxListenersExceededWarning(this, eventName);
            this.warnIfNeeded(eventName, warning);
        }
        return this;
    }
    /** Alias for emitter.on(eventName, listener). */ addListener(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    /**
   * Synchronously calls each of the listeners registered for the event named
   * eventName, in the order they were registered, passing the supplied
   * arguments to each.
   * @return true if the event had listeners, false otherwise
   */ // deno-lint-ignore no-explicit-any
    emit(eventName, ...args) {
        if (this._events.has(eventName)) {
            if (eventName === "error" && this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners = this._events.get(eventName).slice(); // We copy with slice() so array is not mutated during emit
            for (const listener of listeners){
                try {
                    listener.apply(this, args);
                } catch (err) {
                    this.emit("error", err);
                }
            }
            return true;
        } else if (eventName === "error") {
            if (this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const errMsg = args.length > 0 ? args[0] : Error("Unhandled error.");
            throw errMsg;
        }
        return false;
    }
    /**
   * Returns an array listing the events for which the emitter has
   * registered listeners.
   */ eventNames() {
        return Array.from(this._events.keys());
    }
    /**
   * Returns the current max listener value for the EventEmitter which is
   * either set by emitter.setMaxListeners(n) or defaults to
   * EventEmitter.defaultMaxListeners.
   */ getMaxListeners() {
        return this.maxListeners == null ? EventEmitter.defaultMaxListeners : this.maxListeners;
    }
    /**
   * Returns the number of listeners listening to the event named
   * eventName.
   */ listenerCount(eventName) {
        if (this._events.has(eventName)) {
            return this._events.get(eventName).length;
        } else {
            return 0;
        }
    }
    static listenerCount(emitter, eventName) {
        return emitter.listenerCount(eventName);
    }
    _listeners(target, eventName, unwrap) {
        if (!target._events?.has(eventName)) {
            return [];
        }
        const eventListeners = target._events.get(eventName);
        return unwrap ? this.unwrapListeners(eventListeners) : eventListeners.slice(0);
    }
    unwrapListeners(arr) {
        const unwrappedListeners = new Array(arr.length);
        for(let i = 0; i < arr.length; i++){
            // deno-lint-ignore no-explicit-any
            unwrappedListeners[i] = arr[i]["listener"] || arr[i];
        }
        return unwrappedListeners;
    }
    /** Returns a copy of the array of listeners for the event named eventName.*/ listeners(eventName) {
        return this._listeners(this, eventName, true);
    }
    /**
   * Returns a copy of the array of listeners for the event named eventName,
   * including any wrappers (such as those created by .once()).
   */ rawListeners(eventName) {
        return this._listeners(this, eventName, false);
    }
    /** Alias for emitter.removeListener(). */ off(eventName, listener) {
        return this.removeListener(eventName, listener);
    }
    /**
   * Adds the listener function to the end of the listeners array for the event
   *  named eventName. No checks are made to see if the listener has already
   * been added. Multiple calls passing the same combination of eventName and
   * listener will result in the listener being added, and called, multiple
   * times.
   */ on(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    /**
   * Adds a one-time listener function for the event named eventName. The next
   * time eventName is triggered, this listener is removed and then invoked.
   */ once(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.on(eventName, wrapped);
        return this;
    }
    // Wrapped function that calls EventEmitter.removeListener(eventName, self) on execution.
    onceWrap(eventName, listener) {
        this.checkListenerArgument(listener);
        const wrapper = function(// deno-lint-ignore no-explicit-any
        ...args) {
            // If `emit` is called in listeners, the same listener can be called multiple times.
            // To prevent that, check the flag here.
            if (this.isCalled) {
                return;
            }
            this.context.removeListener(this.eventName, this.rawListener);
            this.isCalled = true;
            return this.listener.apply(this.context, args);
        };
        const wrapperContext = {
            eventName: eventName,
            listener: listener,
            rawListener: wrapper,
            context: this
        };
        const wrapped = wrapper.bind(wrapperContext);
        wrapperContext.rawListener = wrapped;
        wrapped.listener = listener;
        return wrapped;
    }
    /**
   * Adds the listener function to the beginning of the listeners array for the
   *  event named eventName. No checks are made to see if the listener has
   * already been added. Multiple calls passing the same combination of
   * eventName and listener will result in the listener being added, and
   * called, multiple times.
   */ prependListener(eventName, listener) {
        return this._addListener(eventName, listener, true);
    }
    /**
   * Adds a one-time listener function for the event named eventName to the
   * beginning of the listeners array. The next time eventName is triggered,
   * this listener is removed, and then invoked.
   */ prependOnceListener(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.prependListener(eventName, wrapped);
        return this;
    }
    /** Removes all listeners, or those of the specified eventName. */ removeAllListeners(eventName) {
        if (this._events === undefined) {
            return this;
        }
        if (eventName) {
            if (this._events.has(eventName)) {
                const listeners = this._events.get(eventName).slice(); // Create a copy; We use it AFTER it's deleted.
                this._events.delete(eventName);
                for (const listener of listeners){
                    this.emit("removeListener", eventName, listener);
                }
            }
        } else {
            const eventList = this.eventNames();
            eventList.map((value)=>{
                this.removeAllListeners(value);
            });
        }
        return this;
    }
    /**
   * Removes the specified listener from the listener array for the event
   * named eventName.
   */ removeListener(eventName, listener) {
        this.checkListenerArgument(listener);
        if (this._events.has(eventName)) {
            const arr = this._events.get(eventName);
            assert(arr);
            let listenerIndex = -1;
            for(let i = arr.length - 1; i >= 0; i--){
                // arr[i]["listener"] is the reference to the listener inside a bound 'once' wrapper
                if (arr[i] == listener || arr[i] && arr[i]["listener"] == listener) {
                    listenerIndex = i;
                    break;
                }
            }
            if (listenerIndex >= 0) {
                arr.splice(listenerIndex, 1);
                this.emit("removeListener", eventName, listener);
                if (arr.length === 0) {
                    this._events.delete(eventName);
                }
            }
        }
        return this;
    }
    /**
   * By default EventEmitters will print a warning if more than 10 listeners
   * are added for a particular event. This is a useful default that helps
   * finding memory leaks. Obviously, not all events should be limited to just
   * 10 listeners. The emitter.setMaxListeners() method allows the limit to be
   * modified for this specific EventEmitter instance. The value can be set to
   * Infinity (or 0) to indicate an unlimited number of listeners.
   */ setMaxListeners(n) {
        if (n !== Infinity) {
            validateMaxListeners(n, "n");
        }
        this.maxListeners = n;
        return this;
    }
    /**
   * Creates a Promise that is fulfilled when the EventEmitter emits the given
   * event or that is rejected when the EventEmitter emits 'error'. The Promise
   * will resolve with an array of all the arguments emitted to the given event.
   */ static once(emitter, name) {
        return new Promise((resolve, reject)=>{
            if (emitter instanceof EventTarget) {
                // EventTarget does not have `error` event semantics like Node
                // EventEmitters, we do not listen to `error` events here.
                emitter.addEventListener(name, (...args)=>{
                    resolve(args);
                }, {
                    once: true,
                    passive: false,
                    capture: false
                });
                return;
            } else if (emitter instanceof EventEmitter) {
                // deno-lint-ignore no-explicit-any
                const eventListener = (...args)=>{
                    if (errorListener !== undefined) {
                        emitter.removeListener("error", errorListener);
                    }
                    resolve(args);
                };
                let errorListener;
                // Adding an error listener is not optional because
                // if an error is thrown on an event emitter we cannot
                // guarantee that the actual event we are waiting will
                // be fired. The result could be a silent way to create
                // memory or file descriptor leaks, which is something
                // we should avoid.
                if (name !== "error") {
                    // deno-lint-ignore no-explicit-any
                    errorListener = (err)=>{
                        emitter.removeListener(name, eventListener);
                        reject(err);
                    };
                    emitter.once("error", errorListener);
                }
                emitter.once(name, eventListener);
                return;
            }
        });
    }
    /**
   * Returns an AsyncIterator that iterates eventName events. It will throw if
   * the EventEmitter emits 'error'. It removes all listeners when exiting the
   * loop. The value returned by each iteration is an array composed of the
   * emitted event arguments.
   */ static on(emitter, event) {
        // deno-lint-ignore no-explicit-any
        const unconsumedEventValues = [];
        // deno-lint-ignore no-explicit-any
        const unconsumedPromises = [];
        let error = null;
        let finished = false;
        const iterator = {
            // deno-lint-ignore no-explicit-any
            next () {
                // First, we consume all unread events
                // deno-lint-ignore no-explicit-any
                const value = unconsumedEventValues.shift();
                if (value) {
                    return Promise.resolve(createIterResult(value, false));
                }
                // Then we error, if an error happened
                // This happens one time if at all, because after 'error'
                // we stop listening
                if (error) {
                    const p = Promise.reject(error);
                    // Only the first element errors
                    error = null;
                    return p;
                }
                // If the iterator is finished, resolve to done
                if (finished) {
                    return Promise.resolve(createIterResult(undefined, true));
                }
                // Wait until an event happens
                return new Promise(function(resolve, reject) {
                    unconsumedPromises.push({
                        resolve,
                        reject
                    });
                });
            },
            // deno-lint-ignore no-explicit-any
            return () {
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
                finished = true;
                for (const promise of unconsumedPromises){
                    promise.resolve(createIterResult(undefined, true));
                }
                return Promise.resolve(createIterResult(undefined, true));
            },
            throw (err) {
                error = err;
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
            },
            // deno-lint-ignore no-explicit-any
            [Symbol.asyncIterator] () {
                return this;
            }
        };
        emitter.on(event, eventHandler);
        emitter.on("error", errorHandler);
        return iterator;
        // deno-lint-ignore no-explicit-any
        function eventHandler(...args) {
            const promise = unconsumedPromises.shift();
            if (promise) {
                promise.resolve(createIterResult(args, false));
            } else {
                unconsumedEventValues.push(args);
            }
        }
        // deno-lint-ignore no-explicit-any
        function errorHandler(err) {
            finished = true;
            const toError = unconsumedPromises.shift();
            if (toError) {
                toError.reject(err);
            } else {
                // The next time we call next()
                error = err;
            }
            iterator.return();
        }
    }
    checkListenerArgument(listener) {
        if (typeof listener !== "function") {
            throw new ERR_INVALID_ARG_TYPE("listener", "function", listener);
        }
    }
    warnIfNeeded(eventName, warning) {
        EventEmitter._alreadyWarnedEvents ||= new Set();
        if (EventEmitter._alreadyWarnedEvents.has(eventName)) {
            return;
        }
        EventEmitter._alreadyWarnedEvents.add(eventName);
        console.warn(warning);
        // TODO(uki00a): Here are two problems:
        // * If `global.ts` is not imported, then `globalThis.process` will be undefined.
        // * Importing `process.ts` from this file will result in circurlar reference.
        // As a workaround, explicitly check for the existence of `globalThis.process`.
        // deno-lint-ignore no-explicit-any
        const maybeProcess = globalThis.process;
        if (maybeProcess instanceof EventEmitter) {
            maybeProcess.emit("warning", warning);
        }
    }
}
class MaxListenersExceededWarning extends Error {
    emitter;
    type;
    count;
    constructor(emitter, type){
        const listenerCount = emitter.listenerCount(type);
        const message = "Possible EventEmitter memory leak detected. " + `${listenerCount} ${type == null ? "null" : type.toString()} listeners added to [${emitter.constructor.name}]. ` + " Use emitter.setMaxListeners() to increase limit";
        super(message);
        this.emitter = emitter;
        this.type = type;
        this.count = listenerCount;
        this.name = "MaxListenersExceededWarning";
    }
}
export default Object.assign(EventEmitter, {
    EventEmitter
});
const captureRejectionSymbol1 = EventEmitter.captureRejectionSymbol;
export { captureRejectionSymbol1 as captureRejectionSymbol };
const errorMonitor1 = EventEmitter.errorMonitor;
export { errorMonitor1 as errorMonitor };
export const listenerCount = EventEmitter.listenerCount;
export const on = EventEmitter.on;
export const once = EventEmitter.once;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9ldmVudHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAoYykgMjAxOSBEZW5vbGlicyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBFUlJfSU5WQUxJRF9BUkdfVFlQRSwgRVJSX09VVF9PRl9SQU5HRSB9IGZyb20gXCIuL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IGluc3BlY3QgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5leHBvcnQgdHlwZSBHZW5lcmljRnVuY3Rpb24gPSAoLi4uYXJnczogYW55W10pID0+IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBXcmFwcGVkRnVuY3Rpb24gZXh0ZW5kcyBGdW5jdGlvbiB7XG4gIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjcmVhdGVJdGVyUmVzdWx0KHZhbHVlOiBhbnksIGRvbmU6IGJvb2xlYW4pOiBJdGVyYXRvclJlc3VsdDxhbnk+IHtcbiAgcmV0dXJuIHsgdmFsdWUsIGRvbmUgfTtcbn1cblxuaW50ZXJmYWNlIEFzeW5jSXRlcmFibGUge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBuZXh0KCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55LCBhbnk+PjtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmV0dXJuKCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55LCBhbnk+PjtcbiAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQ7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogYW55O1xufVxuXG5leHBvcnQgbGV0IGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbmZ1bmN0aW9uIHZhbGlkYXRlTWF4TGlzdGVuZXJzKG46IG51bWJlciwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkge1xuICAgIHRocm93IG5ldyBFUlJfT1VUX09GX1JBTkdFKG5hbWUsIFwiYSBub24tbmVnYXRpdmUgbnVtYmVyXCIsIGluc3BlY3QobikpO1xuICB9XG59XG5cbi8qKlxuICogU2VlIGFsc28gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbFxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgcHVibGljIHN0YXRpYyBjYXB0dXJlUmVqZWN0aW9uU3ltYm9sID0gU3ltYm9sLmZvcihcIm5vZGVqcy5yZWplY3Rpb25cIik7XG4gIHB1YmxpYyBzdGF0aWMgZXJyb3JNb25pdG9yID0gU3ltYm9sKFwiZXZlbnRzLmVycm9yTW9uaXRvclwiKTtcbiAgcHVibGljIHN0YXRpYyBnZXQgZGVmYXVsdE1heExpc3RlbmVycygpIHtcbiAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgfVxuICBwdWJsaWMgc3RhdGljIHNldCBkZWZhdWx0TWF4TGlzdGVuZXJzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB2YWxpZGF0ZU1heExpc3RlbmVycyh2YWx1ZSwgXCJkZWZhdWx0TWF4TGlzdGVuZXJzXCIpO1xuICAgIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF4TGlzdGVuZXJzOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2V2ZW50czogTWFwPFxuICAgIHN0cmluZyB8IHN5bWJvbCxcbiAgICBBcnJheTxHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24+XG4gID47XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX2FscmVhZHlXYXJuZWRFdmVudHM/OiBTZXQ8c3RyaW5nIHwgc3ltYm9sPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgICBwcmVwZW5kOiBib29sZWFuLFxuICApOiB0aGlzIHtcbiAgICB0aGlzLmNoZWNrTGlzdGVuZXJBcmd1bWVudChsaXN0ZW5lcik7XG4gICAgdGhpcy5lbWl0KFwibmV3TGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEFycmF5PFxuICAgICAgICBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb25cbiAgICAgID47XG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2V2ZW50cy5zZXQoZXZlbnROYW1lLCBbbGlzdGVuZXJdKTtcbiAgICB9XG4gICAgY29uc3QgbWF4ID0gdGhpcy5nZXRNYXhMaXN0ZW5lcnMoKTtcbiAgICBpZiAobWF4ID4gMCAmJiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnROYW1lKSA+IG1heCkge1xuICAgICAgY29uc3Qgd2FybmluZyA9IG5ldyBNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcodGhpcywgZXZlbnROYW1lKTtcbiAgICAgIHRoaXMud2FybklmTmVlZGVkKGV2ZW50TmFtZSwgd2FybmluZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQWxpYXMgZm9yIGVtaXR0ZXIub24oZXZlbnROYW1lLCBsaXN0ZW5lcikuICovXG4gIHB1YmxpYyBhZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lciwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN5bmNocm9ub3VzbHkgY2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIHRoZSBldmVudCBuYW1lZFxuICAgKiBldmVudE5hbWUsIGluIHRoZSBvcmRlciB0aGV5IHdlcmUgcmVnaXN0ZXJlZCwgcGFzc2luZyB0aGUgc3VwcGxpZWRcbiAgICogYXJndW1lbnRzIHRvIGVhY2guXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBwdWJsaWMgZW1pdChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgLi4uYXJnczogYW55W10pOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50TmFtZSA9PT0gXCJlcnJvclwiICYmXG4gICAgICAgIHRoaXMuX2V2ZW50cy5nZXQoRXZlbnRFbWl0dGVyLmVycm9yTW9uaXRvcilcbiAgICAgICkge1xuICAgICAgICB0aGlzLmVtaXQoRXZlbnRFbWl0dGVyLmVycm9yTW9uaXRvciwgLi4uYXJncyk7XG4gICAgICB9XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSAodGhpcy5fZXZlbnRzLmdldChcbiAgICAgICAgZXZlbnROYW1lLFxuICAgICAgKSBhcyBHZW5lcmljRnVuY3Rpb25bXSkuc2xpY2UoKTsgLy8gV2UgY29weSB3aXRoIHNsaWNlKCkgc28gYXJyYXkgaXMgbm90IG11dGF0ZWQgZHVyaW5nIGVtaXRcbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoZXZlbnROYW1lID09PSBcImVycm9yXCIpIHtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMuZ2V0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IpKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9IGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBFcnJvcihcIlVuaGFuZGxlZCBlcnJvci5cIik7XG4gICAgICB0aHJvdyBlcnJNc2c7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzXG4gICAqIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGV2ZW50TmFtZXMoKTogW3N0cmluZyB8IHN5bWJvbF0ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2V2ZW50cy5rZXlzKCkpIGFzIFtzdHJpbmcgfCBzeW1ib2xdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWF4IGxpc3RlbmVyIHZhbHVlIGZvciB0aGUgRXZlbnRFbWl0dGVyIHdoaWNoIGlzXG4gICAqIGVpdGhlciBzZXQgYnkgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMobikgb3IgZGVmYXVsdHMgdG9cbiAgICogRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0TWF4TGlzdGVuZXJzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWF4TGlzdGVuZXJzID09IG51bGxcbiAgICAgID8gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnNcbiAgICAgIDogdGhpcy5tYXhMaXN0ZW5lcnM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50IG5hbWVkXG4gICAqIGV2ZW50TmFtZS5cbiAgICovXG4gIHB1YmxpYyBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICByZXR1cm4gKHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKSBhcyBHZW5lcmljRnVuY3Rpb25bXSkubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbGlzdGVuZXJDb3VudChcbiAgICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IG51bWJlciB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudChldmVudE5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbGlzdGVuZXJzKFxuICAgIHRhcmdldDogRXZlbnRFbWl0dGVyLFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIHVud3JhcDogYm9vbGVhbixcbiAgKTogR2VuZXJpY0Z1bmN0aW9uW10ge1xuICAgIGlmICghdGFyZ2V0Ll9ldmVudHM/LmhhcyhldmVudE5hbWUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzID0gdGFyZ2V0Ll9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgR2VuZXJpY0Z1bmN0aW9uW107XG5cbiAgICByZXR1cm4gdW53cmFwXG4gICAgICA/IHRoaXMudW53cmFwTGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzKVxuICAgICAgOiBldmVudExpc3RlbmVycy5zbGljZSgwKTtcbiAgfVxuXG4gIHByaXZhdGUgdW53cmFwTGlzdGVuZXJzKGFycjogR2VuZXJpY0Z1bmN0aW9uW10pOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXJzID0gbmV3IEFycmF5KGFyci5sZW5ndGgpIGFzIEdlbmVyaWNGdW5jdGlvbltdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgdW53cmFwcGVkTGlzdGVuZXJzW2ldID0gKGFycltpXSBhcyBhbnkpW1wibGlzdGVuZXJcIl0gfHwgYXJyW2ldO1xuICAgIH1cbiAgICByZXR1cm4gdW53cmFwcGVkTGlzdGVuZXJzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUuKi9cbiAgcHVibGljIGxpc3RlbmVycyhldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCk6IEdlbmVyaWNGdW5jdGlvbltdIHtcbiAgICByZXR1cm4gdGhpcy5fbGlzdGVuZXJzKHRoaXMsIGV2ZW50TmFtZSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGFycmF5IG9mIGxpc3RlbmVycyBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZSxcbiAgICogaW5jbHVkaW5nIGFueSB3cmFwcGVycyAoc3VjaCBhcyB0aG9zZSBjcmVhdGVkIGJ5IC5vbmNlKCkpLlxuICAgKi9cbiAgcHVibGljIHJhd0xpc3RlbmVycyhcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgKTogQXJyYXk8R2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBBbGlhcyBmb3IgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcigpLiAqL1xuICBwdWJsaWMgb2ZmKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGVuZCBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGUgZXZlbnRcbiAgICogIG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzIGFscmVhZHlcbiAgICogYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZiBldmVudE5hbWUgYW5kXG4gICAqIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kIGNhbGxlZCwgbXVsdGlwbGVcbiAgICogdGltZXMuXG4gICAqL1xuICBwdWJsaWMgb24oXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgb25lLXRpbWUgbGlzdGVuZXIgZnVuY3Rpb24gZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUuIFRoZSBuZXh0XG4gICAqIHRpbWUgZXZlbnROYW1lIGlzIHRyaWdnZXJlZCwgdGhpcyBsaXN0ZW5lciBpcyByZW1vdmVkIGFuZCB0aGVuIGludm9rZWQuXG4gICAqL1xuICBwdWJsaWMgb25jZShldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbik6IHRoaXMge1xuICAgIGNvbnN0IHdyYXBwZWQ6IFdyYXBwZWRGdW5jdGlvbiA9IHRoaXMub25jZVdyYXAoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgdGhpcy5vbihldmVudE5hbWUsIHdyYXBwZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gV3JhcHBlZCBmdW5jdGlvbiB0aGF0IGNhbGxzIEV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIHNlbGYpIG9uIGV4ZWN1dGlvbi5cbiAgcHJpdmF0ZSBvbmNlV3JhcChcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uLFxuICApOiBXcmFwcGVkRnVuY3Rpb24ge1xuICAgIHRoaXMuY2hlY2tMaXN0ZW5lckFyZ3VtZW50KGxpc3RlbmVyKTtcbiAgICBjb25zdCB3cmFwcGVyID0gZnVuY3Rpb24gKFxuICAgICAgdGhpczoge1xuICAgICAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbDtcbiAgICAgICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbjtcbiAgICAgICAgcmF3TGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbjtcbiAgICAgICAgY29udGV4dDogRXZlbnRFbWl0dGVyO1xuICAgICAgICBpc0NhbGxlZD86IGJvb2xlYW47XG4gICAgICB9LFxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIC4uLmFyZ3M6IGFueVtdXG4gICAgKTogdm9pZCB7XG4gICAgICAvLyBJZiBgZW1pdGAgaXMgY2FsbGVkIGluIGxpc3RlbmVycywgdGhlIHNhbWUgbGlzdGVuZXIgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIC8vIFRvIHByZXZlbnQgdGhhdCwgY2hlY2sgdGhlIGZsYWcgaGVyZS5cbiAgICAgIGlmICh0aGlzLmlzQ2FsbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ldmVudE5hbWUsXG4gICAgICAgIHRoaXMucmF3TGlzdGVuZXIgYXMgR2VuZXJpY0Z1bmN0aW9uLFxuICAgICAgKTtcbiAgICAgIHRoaXMuaXNDYWxsZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZXJDb250ZXh0ID0ge1xuICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICByYXdMaXN0ZW5lcjogKHdyYXBwZXIgYXMgdW5rbm93bikgYXMgV3JhcHBlZEZ1bmN0aW9uLFxuICAgICAgY29udGV4dDogdGhpcyxcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZWQgPSAod3JhcHBlci5iaW5kKFxuICAgICAgd3JhcHBlckNvbnRleHQsXG4gICAgKSBhcyB1bmtub3duKSBhcyBXcmFwcGVkRnVuY3Rpb247XG4gICAgd3JhcHBlckNvbnRleHQucmF3TGlzdGVuZXIgPSB3cmFwcGVkO1xuICAgIHdyYXBwZWQubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICByZXR1cm4gd3JhcHBlZCBhcyBXcmFwcGVkRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGVcbiAgICogIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzXG4gICAqIGFscmVhZHkgYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZlxuICAgKiBldmVudE5hbWUgYW5kIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kXG4gICAqIGNhbGxlZCwgbXVsdGlwbGUgdGltZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgb25lLXRpbWUgbGlzdGVuZXIgZnVuY3Rpb24gZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUgdG8gdGhlXG4gICAqIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5LiBUaGUgbmV4dCB0aW1lIGV2ZW50TmFtZSBpcyB0cmlnZ2VyZWQsXG4gICAqIHRoaXMgbGlzdGVuZXIgaXMgcmVtb3ZlZCwgYW5kIHRoZW4gaW52b2tlZC5cbiAgICovXG4gIHB1YmxpYyBwcmVwZW5kT25jZUxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIGNvbnN0IHdyYXBwZWQ6IFdyYXBwZWRGdW5jdGlvbiA9IHRoaXMub25jZVdyYXAoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMsIG9yIHRob3NlIG9mIHRoZSBzcGVjaWZpZWQgZXZlbnROYW1lLiAqL1xuICBwdWJsaWMgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZT86IHN0cmluZyB8IHN5bWJvbCk6IHRoaXMge1xuICAgIGlmICh0aGlzLl9ldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSkge1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSAodGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEFycmF5PFxuICAgICAgICAgIEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvblxuICAgICAgICA+KS5zbGljZSgpOyAvLyBDcmVhdGUgYSBjb3B5OyBXZSB1c2UgaXQgQUZURVIgaXQncyBkZWxldGVkLlxuICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXZlbnRMaXN0OiBbc3RyaW5nIHwgc3ltYm9sXSA9IHRoaXMuZXZlbnROYW1lcygpO1xuICAgICAgZXZlbnRMaXN0Lm1hcCgodmFsdWU6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiBuYW1lZCBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5jaGVja0xpc3RlbmVyQXJndW1lbnQobGlzdGVuZXIpO1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGNvbnN0IGFycjpcbiAgICAgICAgfCBBcnJheTxHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24+XG4gICAgICAgIHwgdW5kZWZpbmVkID0gdGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpO1xuXG4gICAgICBhc3NlcnQoYXJyKTtcblxuICAgICAgbGV0IGxpc3RlbmVySW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSBhcnIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgLy8gYXJyW2ldW1wibGlzdGVuZXJcIl0gaXMgdGhlIHJlZmVyZW5jZSB0byB0aGUgbGlzdGVuZXIgaW5zaWRlIGEgYm91bmQgJ29uY2UnIHdyYXBwZXJcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFycltpXSA9PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChhcnJbaV0gJiYgKGFycltpXSBhcyBXcmFwcGVkRnVuY3Rpb24pW1wibGlzdGVuZXJcIl0gPT0gbGlzdGVuZXIpXG4gICAgICAgICkge1xuICAgICAgICAgIGxpc3RlbmVySW5kZXggPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsaXN0ZW5lckluZGV4ID49IDApIHtcbiAgICAgICAgYXJyLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzLmRlbGV0ZShldmVudE5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzXG4gICAqIGFyZSBhZGRlZCBmb3IgYSBwYXJ0aWN1bGFyIGV2ZW50LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgdGhhdCBoZWxwc1xuICAgKiBmaW5kaW5nIG1lbW9yeSBsZWFrcy4gT2J2aW91c2x5LCBub3QgYWxsIGV2ZW50cyBzaG91bGQgYmUgbGltaXRlZCB0byBqdXN0XG4gICAqIDEwIGxpc3RlbmVycy4gVGhlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgbWV0aG9kIGFsbG93cyB0aGUgbGltaXQgdG8gYmVcbiAgICogbW9kaWZpZWQgZm9yIHRoaXMgc3BlY2lmaWMgRXZlbnRFbWl0dGVyIGluc3RhbmNlLiBUaGUgdmFsdWUgY2FuIGJlIHNldCB0b1xuICAgKiBJbmZpbml0eSAob3IgMCkgdG8gaW5kaWNhdGUgYW4gdW5saW1pdGVkIG51bWJlciBvZiBsaXN0ZW5lcnMuXG4gICAqL1xuICBwdWJsaWMgc2V0TWF4TGlzdGVuZXJzKG46IG51bWJlcik6IHRoaXMge1xuICAgIGlmIChuICE9PSBJbmZpbml0eSkge1xuICAgICAgdmFsaWRhdGVNYXhMaXN0ZW5lcnMobiwgXCJuXCIpO1xuICAgIH1cblxuICAgIHRoaXMubWF4TGlzdGVuZXJzID0gbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgUHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIHRoZSBFdmVudEVtaXR0ZXIgZW1pdHMgdGhlIGdpdmVuXG4gICAqIGV2ZW50IG9yIHRoYXQgaXMgcmVqZWN0ZWQgd2hlbiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIFRoZSBQcm9taXNlXG4gICAqIHdpbGwgcmVzb2x2ZSB3aXRoIGFuIGFycmF5IG9mIGFsbCB0aGUgYXJndW1lbnRzIGVtaXR0ZWQgdG8gdGhlIGdpdmVuIGV2ZW50LlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvbmNlKFxuICAgIGVtaXR0ZXI6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChlbWl0dGVyIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcbiAgICAgICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAgICAgLy8gRXZlbnRFbWl0dGVycywgd2UgZG8gbm90IGxpc3RlbiB0byBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgICAgICBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UsIGNhcHR1cmU6IGZhbHNlIH0sXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoZW1pdHRlciBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICBsZXQgZXJyb3JMaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uO1xuXG4gICAgICAgIC8vIEFkZGluZyBhbiBlcnJvciBsaXN0ZW5lciBpcyBub3Qgb3B0aW9uYWwgYmVjYXVzZVxuICAgICAgICAvLyBpZiBhbiBlcnJvciBpcyB0aHJvd24gb24gYW4gZXZlbnQgZW1pdHRlciB3ZSBjYW5ub3RcbiAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdGhlIGFjdHVhbCBldmVudCB3ZSBhcmUgd2FpdGluZyB3aWxsXG4gICAgICAgIC8vIGJlIGZpcmVkLiBUaGUgcmVzdWx0IGNvdWxkIGJlIGEgc2lsZW50IHdheSB0byBjcmVhdGVcbiAgICAgICAgLy8gbWVtb3J5IG9yIGZpbGUgZGVzY3JpcHRvciBsZWFrcywgd2hpY2ggaXMgc29tZXRoaW5nXG4gICAgICAgIC8vIHdlIHNob3VsZCBhdm9pZC5cbiAgICAgICAgaWYgKG5hbWUgIT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgZXJyb3JMaXN0ZW5lciA9IChlcnI6IGFueSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBlbWl0dGVyLm9uY2UoXCJlcnJvclwiLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gQXN5bmNJdGVyYXRvciB0aGF0IGl0ZXJhdGVzIGV2ZW50TmFtZSBldmVudHMuIEl0IHdpbGwgdGhyb3cgaWZcbiAgICogdGhlIEV2ZW50RW1pdHRlciBlbWl0cyAnZXJyb3InLiBJdCByZW1vdmVzIGFsbCBsaXN0ZW5lcnMgd2hlbiBleGl0aW5nIHRoZVxuICAgKiBsb29wLiBUaGUgdmFsdWUgcmV0dXJuZWQgYnkgZWFjaCBpdGVyYXRpb24gaXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlXG4gICAqIGVtaXR0ZWQgZXZlbnQgYXJndW1lbnRzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvbihcbiAgICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCxcbiAgKTogQXN5bmNJdGVyYWJsZSB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCB1bmNvbnN1bWVkRXZlbnRWYWx1ZXM6IGFueVtdID0gW107XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCB1bmNvbnN1bWVkUHJvbWlzZXM6IGFueVtdID0gW107XG4gICAgbGV0IGVycm9yOiBFcnJvciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gICAgY29uc3QgaXRlcmF0b3IgPSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueT4+IHtcbiAgICAgICAgLy8gRmlyc3QsIHdlIGNvbnN1bWUgYWxsIHVucmVhZCBldmVudHNcbiAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgY29uc3QgdmFsdWU6IGFueSA9IHVuY29uc3VtZWRFdmVudFZhbHVlcy5zaGlmdCgpO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodmFsdWUsIGZhbHNlKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVuIHdlIGVycm9yLCBpZiBhbiBlcnJvciBoYXBwZW5lZFxuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgb25lIHRpbWUgaWYgYXQgYWxsLCBiZWNhdXNlIGFmdGVyICdlcnJvcidcbiAgICAgICAgLy8gd2Ugc3RvcCBsaXN0ZW5pbmdcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc3QgcDogUHJvbWlzZTxuZXZlcj4gPSBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgLy8gT25seSB0aGUgZmlyc3QgZWxlbWVudCBlcnJvcnNcbiAgICAgICAgICBlcnJvciA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgaXRlcmF0b3IgaXMgZmluaXNoZWQsIHJlc29sdmUgdG8gZG9uZVxuICAgICAgICBpZiAoZmluaXNoZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWl0IHVudGlsIGFuIGV2ZW50IGhhcHBlbnNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB1bmNvbnN1bWVkUHJvbWlzZXMucHVzaCh7IHJlc29sdmUsIHJlamVjdCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgcmV0dXJuKCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55Pj4ge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3JIYW5kbGVyKTtcbiAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB1bmNvbnN1bWVkUHJvbWlzZXMpIHtcbiAgICAgICAgICBwcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIH0sXG5cbiAgICAgIHRocm93KGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBlcnJvckhhbmRsZXIpO1xuICAgICAgfSxcblxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICBlbWl0dGVyLm9uKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgIGVtaXR0ZXIub24oXCJlcnJvclwiLCBlcnJvckhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIGl0ZXJhdG9yO1xuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBmdW5jdGlvbiBldmVudEhhbmRsZXIoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgIGNvbnN0IHByb21pc2UgPSB1bmNvbnN1bWVkUHJvbWlzZXMuc2hpZnQoKTtcbiAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShjcmVhdGVJdGVyUmVzdWx0KGFyZ3MsIGZhbHNlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmNvbnN1bWVkRXZlbnRWYWx1ZXMucHVzaChhcmdzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGZ1bmN0aW9uIGVycm9ySGFuZGxlcihlcnI6IGFueSk6IHZvaWQge1xuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuXG4gICAgICBjb25zdCB0b0Vycm9yID0gdW5jb25zdW1lZFByb21pc2VzLnNoaWZ0KCk7XG4gICAgICBpZiAodG9FcnJvcikge1xuICAgICAgICB0b0Vycm9yLnJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIG5leHQgdGltZSB3ZSBjYWxsIG5leHQoKVxuICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgIH1cblxuICAgICAgaXRlcmF0b3IucmV0dXJuKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjaGVja0xpc3RlbmVyQXJndW1lbnQobGlzdGVuZXI6IHVua25vd24pOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBFUlJfSU5WQUxJRF9BUkdfVFlQRShcImxpc3RlbmVyXCIsIFwiZnVuY3Rpb25cIiwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgd2FybklmTmVlZGVkKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCB3YXJuaW5nOiBFcnJvcik6IHZvaWQge1xuICAgIEV2ZW50RW1pdHRlci5fYWxyZWFkeVdhcm5lZEV2ZW50cyB8fD0gbmV3IFNldCgpO1xuICAgIGlmIChFdmVudEVtaXR0ZXIuX2FscmVhZHlXYXJuZWRFdmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgRXZlbnRFbWl0dGVyLl9hbHJlYWR5V2FybmVkRXZlbnRzLmFkZChldmVudE5hbWUpO1xuICAgIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcblxuICAgIC8vIFRPRE8odWtpMDBhKTogSGVyZSBhcmUgdHdvIHByb2JsZW1zOlxuICAgIC8vICogSWYgYGdsb2JhbC50c2AgaXMgbm90IGltcG9ydGVkLCB0aGVuIGBnbG9iYWxUaGlzLnByb2Nlc3NgIHdpbGwgYmUgdW5kZWZpbmVkLlxuICAgIC8vICogSW1wb3J0aW5nIGBwcm9jZXNzLnRzYCBmcm9tIHRoaXMgZmlsZSB3aWxsIHJlc3VsdCBpbiBjaXJjdXJsYXIgcmVmZXJlbmNlLlxuICAgIC8vIEFzIGEgd29ya2Fyb3VuZCwgZXhwbGljaXRseSBjaGVjayBmb3IgdGhlIGV4aXN0ZW5jZSBvZiBgZ2xvYmFsVGhpcy5wcm9jZXNzYC5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IG1heWJlUHJvY2VzcyA9IChnbG9iYWxUaGlzIGFzIGFueSkucHJvY2VzcztcbiAgICBpZiAobWF5YmVQcm9jZXNzIGluc3RhbmNlb2YgRXZlbnRFbWl0dGVyKSB7XG4gICAgICBtYXliZVByb2Nlc3MuZW1pdChcIndhcm5pbmdcIiwgd2FybmluZyk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIE1heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyBleHRlbmRzIEVycm9yIHtcbiAgcmVhZG9ubHkgY291bnQ6IG51bWJlcjtcbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgZW1pdHRlcjogRXZlbnRFbWl0dGVyLFxuICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZyB8IHN5bWJvbCxcbiAgKSB7XG4gICAgY29uc3QgbGlzdGVuZXJDb3VudCA9IGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgICBjb25zdCBtZXNzYWdlID0gXCJQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuIFwiICtcbiAgICAgIGAke2xpc3RlbmVyQ291bnR9ICR7XG4gICAgICAgIHR5cGUgPT0gbnVsbCA/IFwibnVsbFwiIDogdHlwZS50b1N0cmluZygpXG4gICAgICB9IGxpc3RlbmVycyBhZGRlZCB0byBbJHtlbWl0dGVyLmNvbnN0cnVjdG9yLm5hbWV9XS4gYCArXG4gICAgICBcIiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdFwiO1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMuY291bnQgPSBsaXN0ZW5lckNvdW50O1xuICAgIHRoaXMubmFtZSA9IFwiTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nXCI7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT2JqZWN0LmFzc2lnbihFdmVudEVtaXR0ZXIsIHsgRXZlbnRFbWl0dGVyIH0pO1xuXG5leHBvcnQgY29uc3QgY2FwdHVyZVJlamVjdGlvblN5bWJvbCA9IEV2ZW50RW1pdHRlci5jYXB0dXJlUmVqZWN0aW9uU3ltYm9sO1xuZXhwb3J0IGNvbnN0IGVycm9yTW9uaXRvciA9IEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3I7XG5leHBvcnQgY29uc3QgbGlzdGVuZXJDb3VudCA9IEV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50O1xuZXhwb3J0IGNvbnN0IG9uID0gRXZlbnRFbWl0dGVyLm9uO1xuZXhwb3J0IGNvbnN0IG9uY2UgPSBFdmVudEVtaXR0ZXIub25jZTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBeUUsQUFBekUsdUVBQXlFO0FBQ3pFLEVBQXNELEFBQXRELG9EQUFzRDtBQUN0RCxFQUFFO0FBQ0YsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQWdFLEFBQWhFLDhEQUFnRTtBQUNoRSxFQUFzRSxBQUF0RSxvRUFBc0U7QUFDdEUsRUFBc0UsQUFBdEUsb0VBQXNFO0FBQ3RFLEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUFxRSxBQUFyRSxtRUFBcUU7QUFDckUsRUFBd0IsQUFBeEIsc0JBQXdCO0FBQ3hCLEVBQUU7QUFDRixFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBeUQsQUFBekQsdURBQXlEO0FBQ3pELEVBQUU7QUFDRixFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBNkQsQUFBN0QsMkRBQTZEO0FBQzdELEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUEyRSxBQUEzRSx5RUFBMkU7QUFDM0UsRUFBd0UsQUFBeEUsc0VBQXdFO0FBQ3hFLEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUF5QyxBQUF6Qyx1Q0FBeUM7QUFFekMsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFvQjtBQUMzQyxNQUFNLEdBQUcsb0JBQW9CLEVBQUUsZ0JBQWdCLFFBQVEsQ0FBYztBQUNyRSxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQVc7QUFTbkMsRUFBbUMsQUFBbkMsaUNBQW1DO1NBQzFCLGdCQUFnQixDQUFDLEtBQVUsRUFBRSxJQUFhLEVBQXVCLENB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