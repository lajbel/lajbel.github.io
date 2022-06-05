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
function ensureArray(maybeArray) {
    return Array.isArray(maybeArray) ? maybeArray : [
        maybeArray
    ];
}
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
    static  #init(emitter) {
        if (emitter._events == null || emitter._events === Object.getPrototypeOf(emitter)._events // If `emitter` does not own `_events` but the prototype does
        ) {
            emitter._events = Object.create(null);
        }
    }
    /**
   * Overrides `call` to mimic the es5 behavior with the es6 class.
   */ // deno-lint-ignore no-explicit-any
    static call = function call(thisArg) {
        EventEmitter.#init(thisArg);
    };
    constructor(){
        EventEmitter.#init(this);
    }
    _addListener(eventName, listener, prepend) {
        this.checkListenerArgument(listener);
        this.emit("newListener", eventName, this.unwrapListener(listener));
        if (this.hasListeners(eventName)) {
            let listeners = this._events[eventName];
            if (!Array.isArray(listeners)) {
                listeners = [
                    listeners
                ];
                this._events[eventName] = listeners;
            }
            if (prepend) {
                listeners.unshift(listener);
            } else {
                listeners.push(listener);
            }
        } else if (this._events) {
            this._events[eventName] = listener;
        } else {
            EventEmitter.#init(this);
            this._events[eventName] = listener;
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
        if (this.hasListeners(eventName)) {
            if (eventName === "error" && this.hasListeners(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners = ensureArray(this._events[eventName]).slice(); // We copy with slice() so array is not mutated during emit
            for (const listener of listeners){
                try {
                    listener.apply(this, args);
                } catch (err) {
                    this.emit("error", err);
                }
            }
            return true;
        } else if (eventName === "error") {
            if (this.hasListeners(EventEmitter.errorMonitor)) {
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
        return Reflect.ownKeys(this._events);
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
        if (this.hasListeners(eventName)) {
            const maybeListeners = this._events[eventName];
            return Array.isArray(maybeListeners) ? maybeListeners.length : 1;
        } else {
            return 0;
        }
    }
    static listenerCount(emitter, eventName) {
        return emitter.listenerCount(eventName);
    }
    _listeners(target, eventName, unwrap) {
        if (!target.hasListeners(eventName)) {
            return [];
        }
        const eventListeners = target._events[eventName];
        if (Array.isArray(eventListeners)) {
            return unwrap ? this.unwrapListeners(eventListeners) : eventListeners.slice(0);
        } else {
            return [
                unwrap ? this.unwrapListener(eventListeners) : eventListeners, 
            ];
        }
    }
    unwrapListeners(arr) {
        const unwrappedListeners = new Array(arr.length);
        for(let i = 0; i < arr.length; i++){
            unwrappedListeners[i] = this.unwrapListener(arr[i]);
        }
        return unwrappedListeners;
    }
    unwrapListener(listener) {
        return listener["listener"] ?? listener;
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
    /** Alias for emitter.removeListener(). */ off(// deno-lint-ignore no-unused-vars
    eventName, // deno-lint-ignore no-unused-vars
    listener) {
    // The body of this method is empty because it will be overwritten by later code. (`EventEmitter.prototype.off = EventEmitter.prototype.removeListener;`)
    // The purpose of this dirty hack is to get around the current limitation of TypeScript type checking.
    }
    /**
   * Adds the listener function to the end of the listeners array for the event
   *  named eventName. No checks are made to see if the listener has already
   * been added. Multiple calls passing the same combination of eventName and
   * listener will result in the listener being added, and called, multiple
   * times.
   */ on(// deno-lint-ignore no-unused-vars
    eventName, // deno-lint-ignore no-unused-vars
    listener) {
    // The body of this method is empty because it will be overwritten by later code. (`EventEmitter.prototype.addListener = EventEmitter.prototype.on;`)
    // The purpose of this dirty hack is to get around the current limitation of TypeScript type checking.
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
            this.context.removeListener(this.eventName, this.listener);
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
            if (this.hasListeners(eventName)) {
                const listeners = ensureArray(this._events[eventName]).slice().reverse();
                for (const listener of listeners){
                    this.removeListener(eventName, this.unwrapListener(listener));
                }
            }
        } else {
            const eventList = this.eventNames();
            eventList.forEach((eventName)=>{
                if (eventName === "removeListener") return;
                this.removeAllListeners(eventName);
            });
            this.removeAllListeners("removeListener");
        }
        return this;
    }
    /**
   * Removes the specified listener from the listener array for the event
   * named eventName.
   */ removeListener(eventName, listener) {
        this.checkListenerArgument(listener);
        if (this.hasListeners(eventName)) {
            const maybeArr = this._events[eventName];
            assert(maybeArr);
            const arr = ensureArray(maybeArr);
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
                if (arr.length === 0) {
                    delete this._events[eventName];
                } else if (arr.length === 1) {
                    // If there is only one listener, an array is not necessary.
                    this._events[eventName] = arr[0];
                }
                if (this._events.removeListener) {
                    this.emit("removeListener", eventName, listener);
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
        const listeners = this._events[eventName];
        if (listeners.warned) {
            return;
        }
        listeners.warned = true;
        console.warn(warning);
        // TODO(uki00a): Here are two problems:
        // * If `global.ts` is not imported, then `globalThis.process` will be undefined.
        // * Importing `process.ts` from this file will result in circular reference.
        // As a workaround, explicitly check for the existence of `globalThis.process`.
        // deno-lint-ignore no-explicit-any
        const maybeProcess = globalThis.process;
        if (maybeProcess instanceof EventEmitter) {
            maybeProcess.emit("warning", warning);
        }
    }
    hasListeners(eventName) {
        return this._events && Boolean(this._events[eventName]);
    }
}
// EventEmitter#on should point to the same function as EventEmitter#addListener.
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
// EventEmitter#off should point to the same function as EventEmitter#removeListener.
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvZXZlbnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTkgRGVub2xpYnMgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgRVJSX0lOVkFMSURfQVJHX1RZUEUsIEVSUl9PVVRfT0ZfUkFOR0UgfSBmcm9tIFwiLi9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBpbnNwZWN0IH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgR2VuZXJpY0Z1bmN0aW9uID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JhcHBlZEZ1bmN0aW9uIGV4dGVuZHMgRnVuY3Rpb24ge1xuICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVBcnJheTxUPihtYXliZUFycmF5OiBUW10gfCBUKTogVFtdIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkobWF5YmVBcnJheSkgPyBtYXliZUFycmF5IDogW21heWJlQXJyYXldO1xufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZnVuY3Rpb24gY3JlYXRlSXRlclJlc3VsdCh2YWx1ZTogYW55LCBkb25lOiBib29sZWFuKTogSXRlcmF0b3JSZXN1bHQ8YW55PiB7XG4gIHJldHVybiB7IHZhbHVlLCBkb25lIH07XG59XG5cbmludGVyZmFjZSBBc3luY0l0ZXJhYmxlIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJldHVybigpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIHRocm93KGVycjogRXJyb3IpOiB2b2lkO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IGFueTtcbn1cblxudHlwZSBFdmVudE1hcCA9IFJlY29yZDxcbiAgc3RyaW5nIHwgc3ltYm9sLFxuICAoXG4gICAgfCAoQXJyYXk8R2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPilcbiAgICB8IEdlbmVyaWNGdW5jdGlvblxuICAgIHwgV3JhcHBlZEZ1bmN0aW9uXG4gICkgJiB7IHdhcm5lZD86IGJvb2xlYW4gfVxuPjtcblxuZXhwb3J0IGxldCBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5mdW5jdGlvbiB2YWxpZGF0ZU1heExpc3RlbmVycyhuOiBudW1iZXIsIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHtcbiAgICB0aHJvdyBuZXcgRVJSX09VVF9PRl9SQU5HRShuYW1lLCBcImEgbm9uLW5lZ2F0aXZlIG51bWJlclwiLCBpbnNwZWN0KG4pKTtcbiAgfVxufVxuXG4vKipcbiAqIFNlZSBhbHNvIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWxcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIHB1YmxpYyBzdGF0aWMgY2FwdHVyZVJlamVjdGlvblN5bWJvbCA9IFN5bWJvbC5mb3IoXCJub2RlanMucmVqZWN0aW9uXCIpO1xuICBwdWJsaWMgc3RhdGljIGVycm9yTW9uaXRvciA9IFN5bWJvbChcImV2ZW50cy5lcnJvck1vbml0b3JcIik7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0IGRlZmF1bHRNYXhMaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIH1cbiAgcHVibGljIHN0YXRpYyBzZXQgZGVmYXVsdE1heExpc3RlbmVycyh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdmFsaWRhdGVNYXhMaXN0ZW5lcnModmFsdWUsIFwiZGVmYXVsdE1heExpc3RlbmVyc1wiKTtcbiAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gdmFsdWU7XG4gIH1cblxuICBwcml2YXRlIG1heExpc3RlbmVyczogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9ldmVudHMhOiBFdmVudE1hcDtcblxuICBzdGF0aWMgI2luaXQoZW1pdHRlcjogRXZlbnRFbWl0dGVyKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgZW1pdHRlci5fZXZlbnRzID09IG51bGwgfHxcbiAgICAgIGVtaXR0ZXIuX2V2ZW50cyA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGVtaXR0ZXIpLl9ldmVudHMgLy8gSWYgYGVtaXR0ZXJgIGRvZXMgbm90IG93biBgX2V2ZW50c2AgYnV0IHRoZSBwcm90b3R5cGUgZG9lc1xuICAgICkge1xuICAgICAgZW1pdHRlci5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIGBjYWxsYCB0byBtaW1pYyB0aGUgZXM1IGJlaGF2aW9yIHdpdGggdGhlIGVzNiBjbGFzcy5cbiAgICovXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHN0YXRpYyBjYWxsID0gZnVuY3Rpb24gY2FsbCh0aGlzQXJnOiBhbnkpOiB2b2lkIHtcbiAgICBFdmVudEVtaXR0ZXIuI2luaXQodGhpc0FyZyk7XG4gIH07XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgRXZlbnRFbWl0dGVyLiNpbml0KHRoaXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgICBwcmVwZW5kOiBib29sZWFuLFxuICApOiB0aGlzIHtcbiAgICB0aGlzLmNoZWNrTGlzdGVuZXJBcmd1bWVudChsaXN0ZW5lcik7XG4gICAgdGhpcy5lbWl0KFwibmV3TGlzdGVuZXJcIiwgZXZlbnROYW1lLCB0aGlzLnVud3JhcExpc3RlbmVyKGxpc3RlbmVyKSk7XG4gICAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGxldCBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZlbnROYW1lXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShsaXN0ZW5lcnMpKSB7XG4gICAgICAgIGxpc3RlbmVycyA9IFtsaXN0ZW5lcnNdO1xuICAgICAgICB0aGlzLl9ldmVudHNbZXZlbnROYW1lXSA9IGxpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgaWYgKHByZXBlbmQpIHtcbiAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgICB0aGlzLl9ldmVudHNbZXZlbnROYW1lXSA9IGxpc3RlbmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICBFdmVudEVtaXR0ZXIuI2luaXQodGhpcyk7XG4gICAgICAodGhpcy5fZXZlbnRzIGFzIEV2ZW50TWFwKVtldmVudE5hbWVdID0gbGlzdGVuZXI7XG4gICAgfVxuICAgIGNvbnN0IG1heCA9IHRoaXMuZ2V0TWF4TGlzdGVuZXJzKCk7XG4gICAgaWYgKG1heCA+IDAgJiYgdGhpcy5saXN0ZW5lckNvdW50KGV2ZW50TmFtZSkgPiBtYXgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmcgPSBuZXcgTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nKHRoaXMsIGV2ZW50TmFtZSk7XG4gICAgICB0aGlzLndhcm5JZk5lZWRlZChldmVudE5hbWUsIHdhcm5pbmcpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEFsaWFzIGZvciBlbWl0dGVyLm9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpLiAqL1xuICBhZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lciwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN5bmNocm9ub3VzbHkgY2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIHRoZSBldmVudCBuYW1lZFxuICAgKiBldmVudE5hbWUsIGluIHRoZSBvcmRlciB0aGV5IHdlcmUgcmVnaXN0ZXJlZCwgcGFzc2luZyB0aGUgc3VwcGxpZWRcbiAgICogYXJndW1lbnRzIHRvIGVhY2guXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBwdWJsaWMgZW1pdChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgLi4uYXJnczogYW55W10pOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5oYXNMaXN0ZW5lcnMoZXZlbnROYW1lKSkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudE5hbWUgPT09IFwiZXJyb3JcIiAmJlxuICAgICAgICB0aGlzLmhhc0xpc3RlbmVycyhFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGlzdGVuZXJzID0gZW5zdXJlQXJyYXkodGhpcy5fZXZlbnRzW2V2ZW50TmFtZV0hKVxuICAgICAgICAuc2xpY2UoKSBhcyBBcnJheTxHZW5lcmljRnVuY3Rpb24+OyAvLyBXZSBjb3B5IHdpdGggc2xpY2UoKSBzbyBhcnJheSBpcyBub3QgbXV0YXRlZCBkdXJpbmcgZW1pdFxuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChldmVudE5hbWUgPT09IFwiZXJyb3JcIikge1xuICAgICAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IpKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9IGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBFcnJvcihcIlVuaGFuZGxlZCBlcnJvci5cIik7XG4gICAgICB0aHJvdyBlcnJNc2c7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzXG4gICAqIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGV2ZW50TmFtZXMoKTogW3N0cmluZyB8IHN5bWJvbF0ge1xuICAgIHJldHVybiBSZWZsZWN0Lm93bktleXModGhpcy5fZXZlbnRzKSBhcyBbXG4gICAgICBzdHJpbmcgfCBzeW1ib2wsXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG1heCBsaXN0ZW5lciB2YWx1ZSBmb3IgdGhlIEV2ZW50RW1pdHRlciB3aGljaCBpc1xuICAgKiBlaXRoZXIgc2V0IGJ5IGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKG4pIG9yIGRlZmF1bHRzIHRvXG4gICAqIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGdldE1heExpc3RlbmVycygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm1heExpc3RlbmVycyA9PSBudWxsXG4gICAgICA/IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzXG4gICAgICA6IHRoaXMubWF4TGlzdGVuZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMgbGlzdGVuaW5nIHRvIHRoZSBldmVudCBuYW1lZFxuICAgKiBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgbGlzdGVuZXJDb3VudChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGNvbnN0IG1heWJlTGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2ZW50TmFtZV07XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShtYXliZUxpc3RlbmVycykgPyBtYXliZUxpc3RlbmVycy5sZW5ndGggOiAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbGlzdGVuZXJDb3VudChcbiAgICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IG51bWJlciB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudChldmVudE5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbGlzdGVuZXJzKFxuICAgIHRhcmdldDogRXZlbnRFbWl0dGVyLFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIHVud3JhcDogYm9vbGVhbixcbiAgKTogR2VuZXJpY0Z1bmN0aW9uW10ge1xuICAgIGlmICghdGFyZ2V0Lmhhc0xpc3RlbmVycyhldmVudE5hbWUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgZXZlbnRMaXN0ZW5lcnMgPSB0YXJnZXQuX2V2ZW50c1tldmVudE5hbWVdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV2ZW50TGlzdGVuZXJzKSkge1xuICAgICAgcmV0dXJuIHVud3JhcFxuICAgICAgICA/IHRoaXMudW53cmFwTGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzKVxuICAgICAgICA6IGV2ZW50TGlzdGVuZXJzLnNsaWNlKDApIGFzIEdlbmVyaWNGdW5jdGlvbltdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB1bndyYXAgPyB0aGlzLnVud3JhcExpc3RlbmVyKGV2ZW50TGlzdGVuZXJzKSA6IGV2ZW50TGlzdGVuZXJzLFxuICAgICAgXSBhcyBHZW5lcmljRnVuY3Rpb25bXTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHVud3JhcExpc3RlbmVycyhcbiAgICBhcnI6IChHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24pW10sXG4gICk6IEdlbmVyaWNGdW5jdGlvbltdIHtcbiAgICBjb25zdCB1bndyYXBwZWRMaXN0ZW5lcnMgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCkgYXMgR2VuZXJpY0Z1bmN0aW9uW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHVud3JhcHBlZExpc3RlbmVyc1tpXSA9IHRoaXMudW53cmFwTGlzdGVuZXIoYXJyW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHVud3JhcHBlZExpc3RlbmVycztcbiAgfVxuXG4gIHByaXZhdGUgdW53cmFwTGlzdGVuZXIoXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgKTogR2VuZXJpY0Z1bmN0aW9uIHtcbiAgICByZXR1cm4gKGxpc3RlbmVyIGFzIFdyYXBwZWRGdW5jdGlvbilbXCJsaXN0ZW5lclwiXSA/PyBsaXN0ZW5lcjtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiovXG4gIHB1YmxpYyBsaXN0ZW5lcnMoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wpOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUsXG4gICAqIGluY2x1ZGluZyBhbnkgd3JhcHBlcnMgKHN1Y2ggYXMgdGhvc2UgY3JlYXRlZCBieSAub25jZSgpKS5cbiAgICovXG4gIHB1YmxpYyByYXdMaXN0ZW5lcnMoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IEFycmF5PEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcnModGhpcywgZXZlbnROYW1lLCBmYWxzZSk7XG4gIH1cblxuICAvKiogQWxpYXMgZm9yIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoKS4gKi9cbiAgcHVibGljIG9mZihcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLXVudXNlZC12YXJzXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby11bnVzZWQtdmFyc1xuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24sXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHMtY29tbWVudFxuICAgIC8vIEB0cy1pZ25vcmVcbiAgKTogdGhpcyB7XG4gICAgLy8gVGhlIGJvZHkgb2YgdGhpcyBtZXRob2QgaXMgZW1wdHkgYmVjYXVzZSBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IGxhdGVyIGNvZGUuIChgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO2ApXG4gICAgLy8gVGhlIHB1cnBvc2Ugb2YgdGhpcyBkaXJ0eSBoYWNrIGlzIHRvIGdldCBhcm91bmQgdGhlIGN1cnJlbnQgbGltaXRhdGlvbiBvZiBUeXBlU2NyaXB0IHR5cGUgY2hlY2tpbmcuXG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGVuZCBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGUgZXZlbnRcbiAgICogIG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzIGFscmVhZHlcbiAgICogYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZiBldmVudE5hbWUgYW5kXG4gICAqIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kIGNhbGxlZCwgbXVsdGlwbGVcbiAgICogdGltZXMuXG4gICAqL1xuICBwdWJsaWMgb24oXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby11bnVzZWQtdmFyc1xuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tdW51c2VkLXZhcnNcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXRzLWNvbW1lbnRcbiAgICAvLyBAdHMtaWdub3JlXG4gICk6IHRoaXMge1xuICAgIC8vIFRoZSBib2R5IG9mIHRoaXMgbWV0aG9kIGlzIGVtcHR5IGJlY2F1c2UgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSBsYXRlciBjb2RlLiAoYEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO2ApXG4gICAgLy8gVGhlIHB1cnBvc2Ugb2YgdGhpcyBkaXJ0eSBoYWNrIGlzIHRvIGdldCBhcm91bmQgdGhlIGN1cnJlbnQgbGltaXRhdGlvbiBvZiBUeXBlU2NyaXB0IHR5cGUgY2hlY2tpbmcuXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG9uZS10aW1lIGxpc3RlbmVyIGZ1bmN0aW9uIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiBUaGUgbmV4dFxuICAgKiB0aW1lIGV2ZW50TmFtZSBpcyB0cmlnZ2VyZWQsIHRoaXMgbGlzdGVuZXIgaXMgcmVtb3ZlZCBhbmQgdGhlbiBpbnZva2VkLlxuICAgKi9cbiAgcHVibGljIG9uY2UoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24pOiB0aGlzIHtcbiAgICBjb25zdCB3cmFwcGVkOiBXcmFwcGVkRnVuY3Rpb24gPSB0aGlzLm9uY2VXcmFwKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIHRoaXMub24oZXZlbnROYW1lLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFdyYXBwZWQgZnVuY3Rpb24gdGhhdCBjYWxscyBFdmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBzZWxmKSBvbiBleGVjdXRpb24uXG4gIHByaXZhdGUgb25jZVdyYXAoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogV3JhcHBlZEZ1bmN0aW9uIHtcbiAgICB0aGlzLmNoZWNrTGlzdGVuZXJBcmd1bWVudChsaXN0ZW5lcik7XG4gICAgY29uc3Qgd3JhcHBlciA9IGZ1bmN0aW9uIChcbiAgICAgIHRoaXM6IHtcbiAgICAgICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2w7XG4gICAgICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG4gICAgICAgIHJhd0xpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb247XG4gICAgICAgIGNvbnRleHQ6IEV2ZW50RW1pdHRlcjtcbiAgICAgICAgaXNDYWxsZWQ/OiBib29sZWFuO1xuICAgICAgfSxcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAuLi5hcmdzOiBhbnlbXVxuICAgICk6IHZvaWQge1xuICAgICAgLy8gSWYgYGVtaXRgIGlzIGNhbGxlZCBpbiBsaXN0ZW5lcnMsIHRoZSBzYW1lIGxpc3RlbmVyIGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICAvLyBUbyBwcmV2ZW50IHRoYXQsIGNoZWNrIHRoZSBmbGFnIGhlcmUuXG4gICAgICBpZiAodGhpcy5pc0NhbGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmNvbnRleHQucmVtb3ZlTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZXZlbnROYW1lLFxuICAgICAgICB0aGlzLmxpc3RlbmVyIGFzIEdlbmVyaWNGdW5jdGlvbixcbiAgICAgICk7XG4gICAgICB0aGlzLmlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVyQ29udGV4dCA9IHtcbiAgICAgIGV2ZW50TmFtZTogZXZlbnROYW1lLFxuICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgcmF3TGlzdGVuZXI6ICh3cmFwcGVyIGFzIHVua25vd24pIGFzIFdyYXBwZWRGdW5jdGlvbixcbiAgICAgIGNvbnRleHQ6IHRoaXMsXG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVkID0gKHdyYXBwZXIuYmluZChcbiAgICAgIHdyYXBwZXJDb250ZXh0LFxuICAgICkgYXMgdW5rbm93bikgYXMgV3JhcHBlZEZ1bmN0aW9uO1xuICAgIHdyYXBwZXJDb250ZXh0LnJhd0xpc3RlbmVyID0gd3JhcHBlZDtcbiAgICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgcmV0dXJuIHdyYXBwZWQgYXMgV3JhcHBlZEZ1bmN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheSBmb3IgdGhlXG4gICAqICBldmVudCBuYW1lZCBldmVudE5hbWUuIE5vIGNoZWNrcyBhcmUgbWFkZSB0byBzZWUgaWYgdGhlIGxpc3RlbmVyIGhhc1xuICAgKiBhbHJlYWR5IGJlZW4gYWRkZWQuIE11bHRpcGxlIGNhbGxzIHBhc3NpbmcgdGhlIHNhbWUgY29tYmluYXRpb24gb2ZcbiAgICogZXZlbnROYW1lIGFuZCBsaXN0ZW5lciB3aWxsIHJlc3VsdCBpbiB0aGUgbGlzdGVuZXIgYmVpbmcgYWRkZWQsIGFuZFxuICAgKiBjYWxsZWQsIG11bHRpcGxlIHRpbWVzLlxuICAgKi9cbiAgcHVibGljIHByZXBlbmRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG9uZS10aW1lIGxpc3RlbmVyIGZ1bmN0aW9uIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lIHRvIHRoZVxuICAgKiBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS4gVGhlIG5leHQgdGltZSBldmVudE5hbWUgaXMgdHJpZ2dlcmVkLFxuICAgKiB0aGlzIGxpc3RlbmVyIGlzIHJlbW92ZWQsIGFuZCB0aGVuIGludm9rZWQuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZE9uY2VMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICBjb25zdCB3cmFwcGVkOiBXcmFwcGVkRnVuY3Rpb24gPSB0aGlzLm9uY2VXcmFwKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50TmFtZS4gKi9cbiAgcHVibGljIHJlbW92ZUFsbExpc3RlbmVycyhldmVudE5hbWU/OiBzdHJpbmcgfCBzeW1ib2wpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycyhldmVudE5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IGVuc3VyZUFycmF5KHRoaXMuX2V2ZW50c1tldmVudE5hbWVdKS5zbGljZSgpXG4gICAgICAgICAgLnJldmVyc2UoKTtcbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKFxuICAgICAgICAgICAgZXZlbnROYW1lLFxuICAgICAgICAgICAgdGhpcy51bndyYXBMaXN0ZW5lcihsaXN0ZW5lciksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBldmVudExpc3QgPSB0aGlzLmV2ZW50TmFtZXMoKTtcbiAgICAgIGV2ZW50TGlzdC5mb3JFYWNoKChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnROYW1lID09PSBcInJlbW92ZUxpc3RlbmVyXCIpIHJldHVybjtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnROYW1lKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJyZW1vdmVMaXN0ZW5lclwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiBuYW1lZCBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5jaGVja0xpc3RlbmVyQXJndW1lbnQobGlzdGVuZXIpO1xuICAgIGlmICh0aGlzLmhhc0xpc3RlbmVycyhldmVudE5hbWUpKSB7XG4gICAgICBjb25zdCBtYXliZUFyciA9IHRoaXMuX2V2ZW50c1tldmVudE5hbWVdO1xuXG4gICAgICBhc3NlcnQobWF5YmVBcnIpO1xuICAgICAgY29uc3QgYXJyID0gZW5zdXJlQXJyYXkobWF5YmVBcnIpO1xuXG4gICAgICBsZXQgbGlzdGVuZXJJbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAvLyBhcnJbaV1bXCJsaXN0ZW5lclwiXSBpcyB0aGUgcmVmZXJlbmNlIHRvIHRoZSBsaXN0ZW5lciBpbnNpZGUgYSBib3VuZCAnb25jZScgd3JhcHBlclxuICAgICAgICBpZiAoXG4gICAgICAgICAgYXJyW2ldID09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGFycltpXSAmJiAoYXJyW2ldIGFzIFdyYXBwZWRGdW5jdGlvbilbXCJsaXN0ZW5lclwiXSA9PSBsaXN0ZW5lcilcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGlzdGVuZXJJbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxpc3RlbmVySW5kZXggPj0gMCkge1xuICAgICAgICBhcnIuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZlbnROYW1lXTtcbiAgICAgICAgfSBlbHNlIGlmIChhcnIubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgbGlzdGVuZXIsIGFuIGFycmF5IGlzIG5vdCBuZWNlc3NhcnkuXG4gICAgICAgICAgdGhpcy5fZXZlbnRzW2V2ZW50TmFtZV0gPSBhcnJbMF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnNcbiAgICogYXJlIGFkZGVkIGZvciBhIHBhcnRpY3VsYXIgZXZlbnQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB0aGF0IGhlbHBzXG4gICAqIGZpbmRpbmcgbWVtb3J5IGxlYWtzLiBPYnZpb3VzbHksIG5vdCBhbGwgZXZlbnRzIHNob3VsZCBiZSBsaW1pdGVkIHRvIGp1c3RcbiAgICogMTAgbGlzdGVuZXJzLiBUaGUgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSBtZXRob2QgYWxsb3dzIHRoZSBsaW1pdCB0byBiZVxuICAgKiBtb2RpZmllZCBmb3IgdGhpcyBzcGVjaWZpYyBFdmVudEVtaXR0ZXIgaW5zdGFuY2UuIFRoZSB2YWx1ZSBjYW4gYmUgc2V0IHRvXG4gICAqIEluZmluaXR5IChvciAwKSB0byBpbmRpY2F0ZSBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXhMaXN0ZW5lcnMobjogbnVtYmVyKTogdGhpcyB7XG4gICAgaWYgKG4gIT09IEluZmluaXR5KSB7XG4gICAgICB2YWxpZGF0ZU1heExpc3RlbmVycyhuLCBcIm5cIik7XG4gICAgfVxuXG4gICAgdGhpcy5tYXhMaXN0ZW5lcnMgPSBuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhlIEV2ZW50RW1pdHRlciBlbWl0cyB0aGUgZ2l2ZW5cbiAgICogZXZlbnQgb3IgdGhhdCBpcyByZWplY3RlZCB3aGVuIHRoZSBFdmVudEVtaXR0ZXIgZW1pdHMgJ2Vycm9yJy4gVGhlIFByb21pc2VcbiAgICogd2lsbCByZXNvbHZlIHdpdGggYW4gYXJyYXkgb2YgYWxsIHRoZSBhcmd1bWVudHMgZW1pdHRlZCB0byB0aGUgZ2l2ZW4gZXZlbnQuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIG9uY2UoXG4gICAgZW1pdHRlcjogRXZlbnRFbWl0dGVyIHwgRXZlbnRUYXJnZXQsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICk6IFByb21pc2U8YW55W10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKGVtaXR0ZXIgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuICAgICAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgICAgICAvLyBFdmVudEVtaXR0ZXJzLCB3ZSBkbyBub3QgbGlzdGVuIHRvIGBlcnJvcmAgZXZlbnRzIGhlcmUuXG4gICAgICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBvbmNlOiB0cnVlLCBwYXNzaXZlOiBmYWxzZSwgY2FwdHVyZTogZmFsc2UgfSxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIGlmIChlbWl0dGVyIGluc3RhbmNlb2YgRXZlbnRFbWl0dGVyKSB7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoLi4uYXJnczogYW55W10pOiB2b2lkID0+IHtcbiAgICAgICAgICBpZiAoZXJyb3JMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3JMaXN0ZW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIGxldCBlcnJvckxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG5cbiAgICAgICAgLy8gQWRkaW5nIGFuIGVycm9yIGxpc3RlbmVyIGlzIG5vdCBvcHRpb25hbCBiZWNhdXNlXG4gICAgICAgIC8vIGlmIGFuIGVycm9yIGlzIHRocm93biBvbiBhbiBldmVudCBlbWl0dGVyIHdlIGNhbm5vdFxuICAgICAgICAvLyBndWFyYW50ZWUgdGhhdCB0aGUgYWN0dWFsIGV2ZW50IHdlIGFyZSB3YWl0aW5nIHdpbGxcbiAgICAgICAgLy8gYmUgZmlyZWQuIFRoZSByZXN1bHQgY291bGQgYmUgYSBzaWxlbnQgd2F5IHRvIGNyZWF0ZVxuICAgICAgICAvLyBtZW1vcnkgb3IgZmlsZSBkZXNjcmlwdG9yIGxlYWtzLCB3aGljaCBpcyBzb21ldGhpbmdcbiAgICAgICAgLy8gd2Ugc2hvdWxkIGF2b2lkLlxuICAgICAgICBpZiAobmFtZSAhPT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgICBlcnJvckxpc3RlbmVyID0gKGVycjogYW55KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKG5hbWUsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGVtaXR0ZXIub25jZShcImVycm9yXCIsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBBc3luY0l0ZXJhdG9yIHRoYXQgaXRlcmF0ZXMgZXZlbnROYW1lIGV2ZW50cy4gSXQgd2lsbCB0aHJvdyBpZlxuICAgKiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIEl0IHJlbW92ZXMgYWxsIGxpc3RlbmVycyB3aGVuIGV4aXRpbmcgdGhlXG4gICAqIGxvb3AuIFRoZSB2YWx1ZSByZXR1cm5lZCBieSBlYWNoIGl0ZXJhdGlvbiBpcyBhbiBhcnJheSBjb21wb3NlZCBvZiB0aGVcbiAgICogZW1pdHRlZCBldmVudCBhcmd1bWVudHMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIG9uKFxuICAgIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcixcbiAgICBldmVudDogc3RyaW5nIHwgc3ltYm9sLFxuICApOiBBc3luY0l0ZXJhYmxlIHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IHVuY29uc3VtZWRFdmVudFZhbHVlczogYW55W10gPSBbXTtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IHVuY29uc3VtZWRQcm9taXNlczogYW55W10gPSBbXTtcbiAgICBsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGZpbmlzaGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCBpdGVyYXRvciA9IHtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBuZXh0KCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55Pj4ge1xuICAgICAgICAvLyBGaXJzdCwgd2UgY29uc3VtZSBhbGwgdW5yZWFkIGV2ZW50c1xuICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICBjb25zdCB2YWx1ZTogYW55ID0gdW5jb25zdW1lZEV2ZW50VmFsdWVzLnNoaWZ0KCk7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh2YWx1ZSwgZmFsc2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZW4gd2UgZXJyb3IsIGlmIGFuIGVycm9yIGhhcHBlbmVkXG4gICAgICAgIC8vIFRoaXMgaGFwcGVucyBvbmUgdGltZSBpZiBhdCBhbGwsIGJlY2F1c2UgYWZ0ZXIgJ2Vycm9yJ1xuICAgICAgICAvLyB3ZSBzdG9wIGxpc3RlbmluZ1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBwOiBQcm9taXNlPG5ldmVyPiA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAvLyBPbmx5IHRoZSBmaXJzdCBlbGVtZW50IGVycm9yc1xuICAgICAgICAgIGVycm9yID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBpdGVyYXRvciBpcyBmaW5pc2hlZCwgcmVzb2x2ZSB0byBkb25lXG4gICAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhaXQgdW50aWwgYW4gZXZlbnQgaGFwcGVuc1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHVuY29uc3VtZWRQcm9taXNlcy5wdXNoKHsgcmVzb2x2ZSwgcmVqZWN0IH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICByZXR1cm4oKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnk+PiB7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBlcnJvckhhbmRsZXIpO1xuICAgICAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9taXNlIG9mIHVuY29uc3VtZWRQcm9taXNlcykge1xuICAgICAgICAgIHByb21pc2UucmVzb2x2ZShjcmVhdGVJdGVyUmVzdWx0KHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjcmVhdGVJdGVyUmVzdWx0KHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgfSxcblxuICAgICAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQge1xuICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudCwgZXZlbnRIYW5kbGVyKTtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgICB9LFxuXG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGVtaXR0ZXIub24oZXZlbnQsIGV2ZW50SGFuZGxlcik7XG4gICAgZW1pdHRlci5vbihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG5cbiAgICByZXR1cm4gaXRlcmF0b3I7XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGZ1bmN0aW9uIGV2ZW50SGFuZGxlciguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IHVuY29uc3VtZWRQcm9taXNlcy5zaGlmdCgpO1xuICAgICAgaWYgKHByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQoYXJncywgZmFsc2UpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuY29uc3VtZWRFdmVudFZhbHVlcy5wdXNoKGFyZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGVycjogYW55KTogdm9pZCB7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICAgIGNvbnN0IHRvRXJyb3IgPSB1bmNvbnN1bWVkUHJvbWlzZXMuc2hpZnQoKTtcbiAgICAgIGlmICh0b0Vycm9yKSB7XG4gICAgICAgIHRvRXJyb3IucmVqZWN0KGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgbmV4dCB0aW1lIHdlIGNhbGwgbmV4dCgpXG4gICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgfVxuXG4gICAgICBpdGVyYXRvci5yZXR1cm4oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoZWNrTGlzdGVuZXJBcmd1bWVudChsaXN0ZW5lcjogdW5rbm93bik6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdGhyb3cgbmV3IEVSUl9JTlZBTElEX0FSR19UWVBFKFwibGlzdGVuZXJcIiwgXCJmdW5jdGlvblwiLCBsaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB3YXJuSWZOZWVkZWQoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIHdhcm5pbmc6IEVycm9yKTogdm9pZCB7XG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2ZW50TmFtZV07XG4gICAgaWYgKGxpc3RlbmVycy53YXJuZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XG4gICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuXG4gICAgLy8gVE9ETyh1a2kwMGEpOiBIZXJlIGFyZSB0d28gcHJvYmxlbXM6XG4gICAgLy8gKiBJZiBgZ2xvYmFsLnRzYCBpcyBub3QgaW1wb3J0ZWQsIHRoZW4gYGdsb2JhbFRoaXMucHJvY2Vzc2Agd2lsbCBiZSB1bmRlZmluZWQuXG4gICAgLy8gKiBJbXBvcnRpbmcgYHByb2Nlc3MudHNgIGZyb20gdGhpcyBmaWxlIHdpbGwgcmVzdWx0IGluIGNpcmN1bGFyIHJlZmVyZW5jZS5cbiAgICAvLyBBcyBhIHdvcmthcm91bmQsIGV4cGxpY2l0bHkgY2hlY2sgZm9yIHRoZSBleGlzdGVuY2Ugb2YgYGdsb2JhbFRoaXMucHJvY2Vzc2AuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBtYXliZVByb2Nlc3MgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLnByb2Nlc3M7XG4gICAgaWYgKG1heWJlUHJvY2VzcyBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgbWF5YmVQcm9jZXNzLmVtaXQoXCJ3YXJuaW5nXCIsIHdhcm5pbmcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFzTGlzdGVuZXJzKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50cyAmJiBCb29sZWFuKHRoaXMuX2V2ZW50c1tldmVudE5hbWVdKTtcbiAgfVxufVxuXG4vLyBFdmVudEVtaXR0ZXIjb24gc2hvdWxkIHBvaW50IHRvIHRoZSBzYW1lIGZ1bmN0aW9uIGFzIEV2ZW50RW1pdHRlciNhZGRMaXN0ZW5lci5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuLy8gRXZlbnRFbWl0dGVyI29mZiBzaG91bGQgcG9pbnQgdG8gdGhlIHNhbWUgZnVuY3Rpb24gYXMgRXZlbnRFbWl0dGVyI3JlbW92ZUxpc3RlbmVyLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuXG5jbGFzcyBNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcgZXh0ZW5kcyBFcnJvciB7XG4gIHJlYWRvbmx5IGNvdW50OiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlYWRvbmx5IGVtaXR0ZXI6IEV2ZW50RW1pdHRlcixcbiAgICByZWFkb25seSB0eXBlOiBzdHJpbmcgfCBzeW1ib2wsXG4gICkge1xuICAgIGNvbnN0IGxpc3RlbmVyQ291bnQgPSBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG4gICAgY29uc3QgbWVzc2FnZSA9IFwiUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLiBcIiArXG4gICAgICBgJHtsaXN0ZW5lckNvdW50fSAke1xuICAgICAgICB0eXBlID09IG51bGwgPyBcIm51bGxcIiA6IHR5cGUudG9TdHJpbmcoKVxuICAgICAgfSBsaXN0ZW5lcnMgYWRkZWQgdG8gWyR7ZW1pdHRlci5jb25zdHJ1Y3Rvci5uYW1lfV0uIGAgK1xuICAgICAgXCIgVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXRcIjtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLmNvdW50ID0gbGlzdGVuZXJDb3VudDtcbiAgICB0aGlzLm5hbWUgPSBcIk1heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZ1wiO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oRXZlbnRFbWl0dGVyLCB7IEV2ZW50RW1pdHRlciB9KTtcblxuZXhwb3J0IGNvbnN0IGNhcHR1cmVSZWplY3Rpb25TeW1ib2wgPSBFdmVudEVtaXR0ZXIuY2FwdHVyZVJlamVjdGlvblN5bWJvbDtcbmV4cG9ydCBjb25zdCBlcnJvck1vbml0b3IgPSBFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yO1xuZXhwb3J0IGNvbnN0IGxpc3RlbmVyQ291bnQgPSBFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudDtcbmV4cG9ydCBjb25zdCBvbiA9IEV2ZW50RW1pdHRlci5vbjtcbmV4cG9ydCBjb25zdCBvbmNlID0gRXZlbnRFbWl0dGVyLm9uY2U7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXlFLEFBQXpFLHVFQUF5RTtBQUN6RSxFQUFzRCxBQUF0RCxvREFBc0Q7QUFDdEQsRUFBRTtBQUNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUFnRSxBQUFoRSw4REFBZ0U7QUFDaEUsRUFBc0UsQUFBdEUsb0VBQXNFO0FBQ3RFLEVBQXNFLEFBQXRFLG9FQUFzRTtBQUN0RSxFQUE0RSxBQUE1RSwwRUFBNEU7QUFDNUUsRUFBcUUsQUFBckUsbUVBQXFFO0FBQ3JFLEVBQXdCLEFBQXhCLHNCQUF3QjtBQUN4QixFQUFFO0FBQ0YsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXlELEFBQXpELHVEQUF5RDtBQUN6RCxFQUFFO0FBQ0YsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQTZELEFBQTdELDJEQUE2RDtBQUM3RCxFQUE0RSxBQUE1RSwwRUFBNEU7QUFDNUUsRUFBMkUsQUFBM0UseUVBQTJFO0FBQzNFLEVBQXdFLEFBQXhFLHNFQUF3RTtBQUN4RSxFQUE0RSxBQUE1RSwwRUFBNEU7QUFDNUUsRUFBeUMsQUFBekMsdUNBQXlDO0FBRXpDLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBb0I7QUFDM0MsTUFBTSxHQUFHLG9CQUFvQixFQUFFLGdCQUFnQixRQUFRLENBQWM7QUFDckUsTUFBTSxHQUFHLE9BQU8sUUFBUSxDQUFXO1NBUzFCLFdBQVcsQ0FBSSxVQUFtQixFQUFPLENBQUM7SUFDakQsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLFVBQVUsR0FBRyxDQUFDO1FBQUEsVUFBVTtJQUFBLENBQUM7QUFDOUQsQ0FBQztBQUVELEVBQW1DLEFBQW5DLGlDQUFtQztTQUMxQixnQkFBZ0IsQ0FBQyxLQUFVLEVBQUUsSUFBYSxFQUF1QixD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