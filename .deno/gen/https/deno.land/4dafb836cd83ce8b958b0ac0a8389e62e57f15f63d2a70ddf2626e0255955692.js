// Copyright Node.js contributors. All rights reserved. MIT License.
/************ NOT IMPLEMENTED
* ERR_INVALID_MODULE_SPECIFIER
* ERR_INVALID_PACKAGE_TARGET
* ERR_INVALID_URL_SCHEME
* ERR_MANIFEST_ASSERT_INTEGRITY
* ERR_MODULE_NOT_FOUND
* ERR_PACKAGE_PATH_NOT_EXPORTED
* ERR_QUICSESSION_VERSION_NEGOTIATION
* ERR_REQUIRE_ESM
* ERR_SOCKET_BAD_PORT
* ERR_TLS_CERT_ALTNAME_INVALID
* ERR_UNHANDLED_ERROR
* ERR_WORKER_INVALID_EXEC_ARGV
* ERR_WORKER_PATH
* ERR_QUIC_ERROR
* ERR_SOCKET_BUFFER_SIZE //System error, shouldn't ever happen inside Deno
* ERR_SYSTEM_ERROR //System error, shouldn't ever happen inside Deno
* ERR_TTY_INIT_FAILED //System error, shouldn't ever happen inside Deno
* ERR_INVALID_PACKAGE_CONFIG // package.json stuff, probably useless
*************/ import { unreachable } from "../testing/asserts.ts";
import { inspect } from "./util.ts";
/**
 * @see https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js
 */ const classRegExp = /^([A-Z][a-z0-9]*)+$/;
/**
 * @see https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js
 * @description Sorted by a rough estimate on most frequently used entries.
 */ const kTypes = [
    "string",
    "function",
    "number",
    "object",
    // Accept 'Function' and 'Object' as alternative to the lower cased version.
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol", 
];
/**
 * All error instances in Node have additional methods and properties
 * This export class is meant to be extended by these instances abstracting native JS error instances
 */ export class NodeErrorAbstraction extends Error {
    code;
    constructor(name, code, message){
        super(message);
        this.code = code;
        this.name = name;
        //This number changes dependending on the name of this class
        //20 characters as of now
        this.stack = this.stack && `${name} [${this.code}]${this.stack.slice(20)}`;
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
export class NodeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(Error.prototype.name, code, message);
    }
}
export class NodeSyntaxError extends NodeErrorAbstraction {
    constructor(code, message){
        super(SyntaxError.prototype.name, code, message);
        Object.setPrototypeOf(this, SyntaxError.prototype);
    }
}
export class NodeRangeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(RangeError.prototype.name, code, message);
        Object.setPrototypeOf(this, RangeError.prototype);
    }
}
export class NodeTypeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(TypeError.prototype.name, code, message);
        Object.setPrototypeOf(this, TypeError.prototype);
    }
}
export class NodeURIError extends NodeErrorAbstraction {
    constructor(code, message){
        super(URIError.prototype.name, code, message);
        Object.setPrototypeOf(this, URIError.prototype);
    }
}
export class ERR_INVALID_ARG_TYPE extends NodeTypeError {
    constructor(name, expected, actual){
        // https://github.com/nodejs/node/blob/f3eb224/lib/internal/errors.js#L1037-L1087
        expected = Array.isArray(expected) ? expected : [
            expected
        ];
        let msg = "The ";
        if (name.endsWith(" argument")) {
            // For cases like 'first argument'
            msg += `${name} `;
        } else {
            const type = name.includes(".") ? "property" : "argument";
            msg += `"${name}" ${type} `;
        }
        msg += "must be ";
        const types = [];
        const instances = [];
        const other = [];
        for (const value of expected){
            if (kTypes.includes(value)) {
                types.push(value.toLocaleLowerCase());
            } else if (classRegExp.test(value)) {
                instances.push(value);
            } else {
                other.push(value);
            }
        }
        // Special handle `object` in case other instances are allowed to outline
        // the differences between each other.
        if (instances.length > 0) {
            const pos = types.indexOf("object");
            if (pos !== -1) {
                types.splice(pos, 1);
                instances.push("Object");
            }
        }
        if (types.length > 0) {
            if (types.length > 2) {
                const last = types.pop();
                msg += `one of type ${types.join(", ")}, or ${last}`;
            } else if (types.length === 2) {
                msg += `one of type ${types[0]} or ${types[1]}`;
            } else {
                msg += `of type ${types[0]}`;
            }
            if (instances.length > 0 || other.length > 0) {
                msg += " or ";
            }
        }
        if (instances.length > 0) {
            if (instances.length > 2) {
                const last = instances.pop();
                msg += `an instance of ${instances.join(", ")}, or ${last}`;
            } else {
                msg += `an instance of ${instances[0]}`;
                if (instances.length === 2) {
                    msg += ` or ${instances[1]}`;
                }
            }
            if (other.length > 0) {
                msg += " or ";
            }
        }
        if (other.length > 0) {
            if (other.length > 2) {
                const last = other.pop();
                msg += `one of ${other.join(", ")}, or ${last}`;
            } else if (other.length === 2) {
                msg += `one of ${other[0]} or ${other[1]}`;
            } else {
                if (other[0].toLowerCase() !== other[0]) {
                    msg += "an ";
                }
                msg += `${other[0]}`;
            }
        }
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
}
export class ERR_INVALID_ARG_VALUE extends NodeTypeError {
    constructor(name, value, reason){
        super("ERR_INVALID_ARG_VALUE", `The argument '${name}' ${reason}. Received ${inspect(value)}`);
    }
}
// A helper function to simplify checking for ERR_INVALID_ARG_TYPE output.
// deno-lint-ignore no-explicit-any
function invalidArgTypeHelper(input) {
    if (input == null) {
        return ` Received ${input}`;
    }
    if (typeof input === "function" && input.name) {
        return ` Received function ${input.name}`;
    }
    if (typeof input === "object") {
        if (input.constructor && input.constructor.name) {
            return ` Received an instance of ${input.constructor.name}`;
        }
        return ` Received ${inspect(input, {
            depth: -1
        })}`;
    }
    let inspected = inspect(input, {
        colors: false
    });
    if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
    }
    return ` Received type ${typeof input} (${inspected})`;
}
export class ERR_OUT_OF_RANGE extends RangeError {
    code = "ERR_OUT_OF_RANGE";
    constructor(str, range, received){
        super(`The value of "${str}" is out of range. It must be ${range}. Received ${received}`);
        const { name  } = this;
        // Add the error code to the name to include it in the stack trace.
        this.name = `${name} [${this.code}]`;
        // Access the stack to generate the error message including the error code from the name.
        this.stack;
        // Reset the name to the actual name.
        this.name = name;
    }
}
export class ERR_AMBIGUOUS_ARGUMENT extends NodeTypeError {
    constructor(x, y){
        super("ERR_AMBIGUOUS_ARGUMENT", `The "${x}" argument is ambiguous. ${y}`);
    }
}
export class ERR_ARG_NOT_ITERABLE extends NodeTypeError {
    constructor(x){
        super("ERR_ARG_NOT_ITERABLE", `${x} must be iterable`);
    }
}
export class ERR_ASSERTION extends NodeError {
    constructor(x){
        super("ERR_ASSERTION", `${x}`);
    }
}
export class ERR_ASYNC_CALLBACK extends NodeTypeError {
    constructor(x){
        super("ERR_ASYNC_CALLBACK", `${x} must be a function`);
    }
}
export class ERR_ASYNC_TYPE extends NodeTypeError {
    constructor(x){
        super("ERR_ASYNC_TYPE", `Invalid name for async "type": ${x}`);
    }
}
export class ERR_BROTLI_INVALID_PARAM extends NodeRangeError {
    constructor(x){
        super("ERR_BROTLI_INVALID_PARAM", `${x} is not a valid Brotli parameter`);
    }
}
export class ERR_BUFFER_OUT_OF_BOUNDS extends NodeRangeError {
    constructor(name){
        super("ERR_BUFFER_OUT_OF_BOUNDS", name ? `"${name}" is outside of buffer bounds` : "Attempt to access memory outside buffer bounds");
    }
}
export class ERR_BUFFER_TOO_LARGE extends NodeRangeError {
    constructor(x){
        super("ERR_BUFFER_TOO_LARGE", `Cannot create a Buffer larger than ${x} bytes`);
    }
}
export class ERR_CANNOT_WATCH_SIGINT extends NodeError {
    constructor(){
        super("ERR_CANNOT_WATCH_SIGINT", "Cannot watch for SIGINT signals");
    }
}
export class ERR_CHILD_CLOSED_BEFORE_REPLY extends NodeError {
    constructor(){
        super("ERR_CHILD_CLOSED_BEFORE_REPLY", "Child closed before reply received");
    }
}
export class ERR_CHILD_PROCESS_IPC_REQUIRED extends NodeError {
    constructor(x){
        super("ERR_CHILD_PROCESS_IPC_REQUIRED", `Forked processes must have an IPC channel, missing value 'ipc' in ${x}`);
    }
}
export class ERR_CHILD_PROCESS_STDIO_MAXBUFFER extends NodeRangeError {
    constructor(x){
        super("ERR_CHILD_PROCESS_STDIO_MAXBUFFER", `${x} maxBuffer length exceeded`);
    }
}
export class ERR_CONSOLE_WRITABLE_STREAM extends NodeTypeError {
    constructor(x){
        super("ERR_CONSOLE_WRITABLE_STREAM", `Console expects a writable stream instance for ${x}`);
    }
}
export class ERR_CONTEXT_NOT_INITIALIZED extends NodeError {
    constructor(){
        super("ERR_CONTEXT_NOT_INITIALIZED", "context used is not initialized");
    }
}
export class ERR_CPU_USAGE extends NodeError {
    constructor(x){
        super("ERR_CPU_USAGE", `Unable to obtain cpu usage ${x}`);
    }
}
export class ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED", "Custom engines not supported by this OpenSSL");
    }
}
export class ERR_CRYPTO_ECDH_INVALID_FORMAT extends NodeTypeError {
    constructor(x){
        super("ERR_CRYPTO_ECDH_INVALID_FORMAT", `Invalid ECDH format: ${x}`);
    }
}
export class ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY extends NodeError {
    constructor(){
        super("ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY", "Public key is not valid for specified curve");
    }
}
export class ERR_CRYPTO_ENGINE_UNKNOWN extends NodeError {
    constructor(x){
        super("ERR_CRYPTO_ENGINE_UNKNOWN", `Engine "${x}" was not found`);
    }
}
export class ERR_CRYPTO_FIPS_FORCED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_FIPS_FORCED", "Cannot set FIPS mode, it was forced with --force-fips at startup.");
    }
}
export class ERR_CRYPTO_FIPS_UNAVAILABLE extends NodeError {
    constructor(){
        super("ERR_CRYPTO_FIPS_UNAVAILABLE", "Cannot set FIPS mode in a non-FIPS build.");
    }
}
export class ERR_CRYPTO_HASH_FINALIZED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_HASH_FINALIZED", "Digest already called");
    }
}
export class ERR_CRYPTO_HASH_UPDATE_FAILED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_HASH_UPDATE_FAILED", "Hash update failed");
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY extends NodeError {
    constructor(x, y){
        super("ERR_CRYPTO_INCOMPATIBLE_KEY", `Incompatible ${x}: ${y}`);
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS extends NodeError {
    constructor(x, y){
        super("ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS", `The selected key encoding ${x} ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_DIGEST extends NodeTypeError {
    constructor(x){
        super("ERR_CRYPTO_INVALID_DIGEST", `Invalid digest: ${x}`);
    }
}
export class ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE extends NodeTypeError {
    constructor(x, y){
        super("ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE", `Invalid key object type ${x}, expected ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_STATE extends NodeError {
    constructor(x){
        super("ERR_CRYPTO_INVALID_STATE", `Invalid state for operation ${x}`);
    }
}
export class ERR_CRYPTO_PBKDF2_ERROR extends NodeError {
    constructor(){
        super("ERR_CRYPTO_PBKDF2_ERROR", "PBKDF2 error");
    }
}
export class ERR_CRYPTO_SCRYPT_INVALID_PARAMETER extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SCRYPT_INVALID_PARAMETER", "Invalid scrypt parameter");
    }
}
export class ERR_CRYPTO_SCRYPT_NOT_SUPPORTED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SCRYPT_NOT_SUPPORTED", "Scrypt algorithm not supported");
    }
}
export class ERR_CRYPTO_SIGN_KEY_REQUIRED extends NodeError {
    constructor(){
        super("ERR_CRYPTO_SIGN_KEY_REQUIRED", "No key provided to sign");
    }
}
export class ERR_DIR_CLOSED extends NodeError {
    constructor(){
        super("ERR_DIR_CLOSED", "Directory handle was closed");
    }
}
export class ERR_DIR_CONCURRENT_OPERATION extends NodeError {
    constructor(){
        super("ERR_DIR_CONCURRENT_OPERATION", "Cannot do synchronous work on directory handle with concurrent asynchronous operations");
    }
}
export class ERR_DNS_SET_SERVERS_FAILED extends NodeError {
    constructor(x, y){
        super("ERR_DNS_SET_SERVERS_FAILED", `c-ares failed to set servers: "${x}" [${y}]`);
    }
}
export class ERR_DOMAIN_CALLBACK_NOT_AVAILABLE extends NodeError {
    constructor(){
        super("ERR_DOMAIN_CALLBACK_NOT_AVAILABLE", "A callback was registered through " + "process.setUncaughtExceptionCaptureCallback(), which is mutually " + "exclusive with using the `domain` module");
    }
}
export class ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE extends NodeError {
    constructor(){
        super("ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE", "The `domain` module is in use, which is mutually exclusive with calling " + "process.setUncaughtExceptionCaptureCallback()");
    }
}
export class ERR_ENCODING_INVALID_ENCODED_DATA extends NodeErrorAbstraction {
    errno;
    constructor(encoding, ret){
        super(TypeError.prototype.name, "ERR_ENCODING_INVALID_ENCODED_DATA", `The encoded data was not valid for encoding ${encoding}`);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.errno = ret;
    }
}
const windows = [
    [
        -4093,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -4092,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -4091,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -4090,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -4089,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -4088,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -4084,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -4083,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -4082,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -4081,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -4079,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -4078,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -4077,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -4076,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -4075,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -4074,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -4036,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -4073,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4072,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -4071,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -4070,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -4069,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -4068,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -4067,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -4066,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -4065,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -4064,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -4063,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -4062,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -4061,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -4060,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -4059,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -4058,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -4057,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -4035,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -4055,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -4054,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -4053,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -4052,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -4051,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -4050,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -4049,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -4048,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -4047,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -4046,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -4045,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -4044,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -4034,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -4043,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -4042,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -4041,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -4040,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -4039,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -4038,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -4037,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -4033,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -4032,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -4031,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -4029,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -4027,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const darwin = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -48,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -49,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -47,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -35,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -37,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -89,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -53,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -61,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -54,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -39,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -65,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -56,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -62,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -40,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -63,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -50,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -51,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -55,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -42,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -78,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -57,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -66,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -38,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -45,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -100,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -43,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -41,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -58,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -60,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -64,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -79,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -92,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const linux = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -98,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -99,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -97,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -11,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -114,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -125,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -103,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -111,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -104,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -89,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -113,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -106,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -40,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -90,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -36,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -100,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -101,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -105,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -64,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -92,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -38,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -107,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -39,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -88,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -95,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -71,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -93,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -91,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -108,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -110,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -112,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -121,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -84,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const { os  } = Deno.build;
export const errorMap = new Map(os === "windows" ? windows : os === "darwin" ? darwin : os === "linux" ? linux : unreachable());
export class ERR_ENCODING_NOT_SUPPORTED extends NodeRangeError {
    constructor(x){
        super("ERR_ENCODING_NOT_SUPPORTED", `The "${x}" encoding is not supported`);
    }
}
export class ERR_EVAL_ESM_CANNOT_PRINT extends NodeError {
    constructor(){
        super("ERR_EVAL_ESM_CANNOT_PRINT", `--print cannot be used with ESM input`);
    }
}
export class ERR_EVENT_RECURSION extends NodeError {
    constructor(x){
        super("ERR_EVENT_RECURSION", `The event "${x}" is already being dispatched`);
    }
}
export class ERR_FEATURE_UNAVAILABLE_ON_PLATFORM extends NodeTypeError {
    constructor(x){
        super("ERR_FEATURE_UNAVAILABLE_ON_PLATFORM", `The feature ${x} is unavailable on the current platform, which is being used to run Node.js`);
    }
}
export class ERR_FS_FILE_TOO_LARGE extends NodeRangeError {
    constructor(x){
        super("ERR_FS_FILE_TOO_LARGE", `File size (${x}) is greater than 2 GB`);
    }
}
export class ERR_FS_INVALID_SYMLINK_TYPE extends NodeError {
    constructor(x){
        super("ERR_FS_INVALID_SYMLINK_TYPE", `Symlink type must be one of "dir", "file", or "junction". Received "${x}"`);
    }
}
export class ERR_HTTP2_ALTSVC_INVALID_ORIGIN extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ALTSVC_INVALID_ORIGIN", `HTTP/2 ALTSVC frames require a valid origin`);
    }
}
export class ERR_HTTP2_ALTSVC_LENGTH extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ALTSVC_LENGTH", `HTTP/2 ALTSVC frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_CONNECT_AUTHORITY extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_AUTHORITY", `:authority header is required for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_PATH extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_PATH", `The :path header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_SCHEME extends NodeError {
    constructor(){
        super("ERR_HTTP2_CONNECT_SCHEME", `The :scheme header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_GOAWAY_SESSION extends NodeError {
    constructor(){
        super("ERR_HTTP2_GOAWAY_SESSION", `New streams cannot be created after receiving a GOAWAY`);
    }
}
export class ERR_HTTP2_HEADERS_AFTER_RESPOND extends NodeError {
    constructor(){
        super("ERR_HTTP2_HEADERS_AFTER_RESPOND", `Cannot specify additional headers after response initiated`);
    }
}
export class ERR_HTTP2_HEADERS_SENT extends NodeError {
    constructor(){
        super("ERR_HTTP2_HEADERS_SENT", `Response has already been initiated.`);
    }
}
export class ERR_HTTP2_HEADER_SINGLE_VALUE extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_HEADER_SINGLE_VALUE", `Header field "${x}" must only have a single value`);
    }
}
export class ERR_HTTP2_INFO_STATUS_NOT_ALLOWED extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_INFO_STATUS_NOT_ALLOWED", `Informational status codes cannot be used`);
    }
}
export class ERR_HTTP2_INVALID_CONNECTION_HEADERS extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_CONNECTION_HEADERS", `HTTP/1 Connection specific headers are forbidden: "${x}"`);
    }
}
export class ERR_HTTP2_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y){
        super("ERR_HTTP2_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP2_INVALID_INFO_STATUS extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_INFO_STATUS", `Invalid informational status code: ${x}`);
    }
}
export class ERR_HTTP2_INVALID_ORIGIN extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_INVALID_ORIGIN", `HTTP/2 ORIGIN frames require a valid origin`);
    }
}
export class ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH", `Packed settings length must be a multiple of six`);
    }
}
export class ERR_HTTP2_INVALID_PSEUDOHEADER extends NodeTypeError {
    constructor(x){
        super("ERR_HTTP2_INVALID_PSEUDOHEADER", `"${x}" is an invalid pseudoheader or is used incorrectly`);
    }
}
export class ERR_HTTP2_INVALID_SESSION extends NodeError {
    constructor(){
        super("ERR_HTTP2_INVALID_SESSION", `The session has been destroyed`);
    }
}
export class ERR_HTTP2_INVALID_STREAM extends NodeError {
    constructor(){
        super("ERR_HTTP2_INVALID_STREAM", `The stream has been destroyed`);
    }
}
export class ERR_HTTP2_MAX_PENDING_SETTINGS_ACK extends NodeError {
    constructor(){
        super("ERR_HTTP2_MAX_PENDING_SETTINGS_ACK", `Maximum number of pending settings acknowledgements`);
    }
}
export class ERR_HTTP2_NESTED_PUSH extends NodeError {
    constructor(){
        super("ERR_HTTP2_NESTED_PUSH", `A push stream cannot initiate another push stream.`);
    }
}
export class ERR_HTTP2_NO_SOCKET_MANIPULATION extends NodeError {
    constructor(){
        super("ERR_HTTP2_NO_SOCKET_MANIPULATION", `HTTP/2 sockets should not be directly manipulated (e.g. read and written)`);
    }
}
export class ERR_HTTP2_ORIGIN_LENGTH extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_ORIGIN_LENGTH", `HTTP/2 ORIGIN frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_OUT_OF_STREAMS extends NodeError {
    constructor(){
        super("ERR_HTTP2_OUT_OF_STREAMS", `No stream ID is available because maximum stream ID has been reached`);
    }
}
export class ERR_HTTP2_PAYLOAD_FORBIDDEN extends NodeError {
    constructor(x){
        super("ERR_HTTP2_PAYLOAD_FORBIDDEN", `Responses with ${x} status must not have a payload`);
    }
}
export class ERR_HTTP2_PING_CANCEL extends NodeError {
    constructor(){
        super("ERR_HTTP2_PING_CANCEL", `HTTP2 ping cancelled`);
    }
}
export class ERR_HTTP2_PING_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_HTTP2_PING_LENGTH", `HTTP2 ping payload must be 8 bytes`);
    }
}
export class ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED extends NodeTypeError {
    constructor(){
        super("ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED", `Cannot set HTTP/2 pseudo-headers`);
    }
}
export class ERR_HTTP2_PUSH_DISABLED extends NodeError {
    constructor(){
        super("ERR_HTTP2_PUSH_DISABLED", `HTTP/2 client has disabled push streams`);
    }
}
export class ERR_HTTP2_SEND_FILE extends NodeError {
    constructor(){
        super("ERR_HTTP2_SEND_FILE", `Directories cannot be sent`);
    }
}
export class ERR_HTTP2_SEND_FILE_NOSEEK extends NodeError {
    constructor(){
        super("ERR_HTTP2_SEND_FILE_NOSEEK", `Offset or length can only be specified for regular files`);
    }
}
export class ERR_HTTP2_SESSION_ERROR extends NodeError {
    constructor(x){
        super("ERR_HTTP2_SESSION_ERROR", `Session closed with error code ${x}`);
    }
}
export class ERR_HTTP2_SETTINGS_CANCEL extends NodeError {
    constructor(){
        super("ERR_HTTP2_SETTINGS_CANCEL", `HTTP2 session settings canceled`);
    }
}
export class ERR_HTTP2_SOCKET_BOUND extends NodeError {
    constructor(){
        super("ERR_HTTP2_SOCKET_BOUND", `The socket is already bound to an Http2Session`);
    }
}
export class ERR_HTTP2_SOCKET_UNBOUND extends NodeError {
    constructor(){
        super("ERR_HTTP2_SOCKET_UNBOUND", `The socket has been disconnected from the Http2Session`);
    }
}
export class ERR_HTTP2_STATUS_101 extends NodeError {
    constructor(){
        super("ERR_HTTP2_STATUS_101", `HTTP status code 101 (Switching Protocols) is forbidden in HTTP/2`);
    }
}
export class ERR_HTTP2_STATUS_INVALID extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP2_STATUS_INVALID", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP2_STREAM_ERROR extends NodeError {
    constructor(x){
        super("ERR_HTTP2_STREAM_ERROR", `Stream closed with error code ${x}`);
    }
}
export class ERR_HTTP2_STREAM_SELF_DEPENDENCY extends NodeError {
    constructor(){
        super("ERR_HTTP2_STREAM_SELF_DEPENDENCY", `A stream cannot depend on itself`);
    }
}
export class ERR_HTTP2_TRAILERS_ALREADY_SENT extends NodeError {
    constructor(){
        super("ERR_HTTP2_TRAILERS_ALREADY_SENT", `Trailing headers have already been sent`);
    }
}
export class ERR_HTTP2_TRAILERS_NOT_READY extends NodeError {
    constructor(){
        super("ERR_HTTP2_TRAILERS_NOT_READY", `Trailing headers cannot be sent until after the wantTrailers event is emitted`);
    }
}
export class ERR_HTTP2_UNSUPPORTED_PROTOCOL extends NodeError {
    constructor(x){
        super("ERR_HTTP2_UNSUPPORTED_PROTOCOL", `protocol "${x}" is unsupported.`);
    }
}
export class ERR_HTTP_HEADERS_SENT extends NodeError {
    constructor(x){
        super("ERR_HTTP_HEADERS_SENT", `Cannot ${x} headers after they are sent to the client`);
    }
}
export class ERR_HTTP_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y){
        super("ERR_HTTP_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP_INVALID_STATUS_CODE extends NodeRangeError {
    constructor(x){
        super("ERR_HTTP_INVALID_STATUS_CODE", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP_SOCKET_ENCODING extends NodeError {
    constructor(){
        super("ERR_HTTP_SOCKET_ENCODING", `Changing the socket encoding is not allowed per RFC7230 Section 3.`);
    }
}
export class ERR_HTTP_TRAILER_INVALID extends NodeError {
    constructor(){
        super("ERR_HTTP_TRAILER_INVALID", `Trailers are invalid with this transfer encoding`);
    }
}
export class ERR_INCOMPATIBLE_OPTION_PAIR extends NodeTypeError {
    constructor(x, y){
        super("ERR_INCOMPATIBLE_OPTION_PAIR", `Option "${x}" cannot be used in combination with option "${y}"`);
    }
}
export class ERR_INPUT_TYPE_NOT_ALLOWED extends NodeError {
    constructor(){
        super("ERR_INPUT_TYPE_NOT_ALLOWED", `--input-type can only be used with string input via --eval, --print, or STDIN`);
    }
}
export class ERR_INSPECTOR_ALREADY_ACTIVATED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_ALREADY_ACTIVATED", `Inspector is already activated. Close it with inspector.close() before activating it again.`);
    }
}
export class ERR_INSPECTOR_ALREADY_CONNECTED extends NodeError {
    constructor(x){
        super("ERR_INSPECTOR_ALREADY_CONNECTED", `${x} is already connected`);
    }
}
export class ERR_INSPECTOR_CLOSED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_CLOSED", `Session was closed`);
    }
}
export class ERR_INSPECTOR_COMMAND extends NodeError {
    constructor(x, y){
        super("ERR_INSPECTOR_COMMAND", `Inspector error ${x}: ${y}`);
    }
}
export class ERR_INSPECTOR_NOT_ACTIVE extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_ACTIVE", `Inspector is not active`);
    }
}
export class ERR_INSPECTOR_NOT_AVAILABLE extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_AVAILABLE", `Inspector is not available`);
    }
}
export class ERR_INSPECTOR_NOT_CONNECTED extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_CONNECTED", `Session is not connected`);
    }
}
export class ERR_INSPECTOR_NOT_WORKER extends NodeError {
    constructor(){
        super("ERR_INSPECTOR_NOT_WORKER", `Current thread is not a worker`);
    }
}
export class ERR_INVALID_ASYNC_ID extends NodeRangeError {
    constructor(x, y){
        super("ERR_INVALID_ASYNC_ID", `Invalid ${x} value: ${y}`);
    }
}
export class ERR_INVALID_BUFFER_SIZE extends NodeRangeError {
    constructor(x){
        super("ERR_INVALID_BUFFER_SIZE", `Buffer size must be a multiple of ${x}`);
    }
}
export class ERR_INVALID_CALLBACK extends NodeTypeError {
    constructor(object){
        super("ERR_INVALID_CALLBACK", `Callback must be a function. Received ${JSON.stringify(object)}`);
    }
}
export class ERR_INVALID_CURSOR_POS extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_CURSOR_POS", `Cannot set cursor row without setting its column`);
    }
}
export class ERR_INVALID_FD extends NodeRangeError {
    constructor(x){
        super("ERR_INVALID_FD", `"fd" must be a positive integer: ${x}`);
    }
}
export class ERR_INVALID_FD_TYPE extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FD_TYPE", `Unsupported fd type: ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_HOST extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_HOST", `File URL host must be "localhost" or empty on ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_PATH extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_FILE_URL_PATH", `File URL path ${x}`);
    }
}
export class ERR_INVALID_HANDLE_TYPE extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_HANDLE_TYPE", `This handle type cannot be sent`);
    }
}
export class ERR_INVALID_HTTP_TOKEN extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_HTTP_TOKEN", `${x} must be a valid HTTP token ["${y}"]`);
    }
}
export class ERR_INVALID_IP_ADDRESS extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_IP_ADDRESS", `Invalid IP address: ${x}`);
    }
}
export class ERR_INVALID_OPT_VALUE_ENCODING extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_OPT_VALUE_ENCODING", `The value "${x}" is invalid for option "encoding"`);
    }
}
export class ERR_INVALID_PERFORMANCE_MARK extends NodeError {
    constructor(x){
        super("ERR_INVALID_PERFORMANCE_MARK", `The "${x}" performance mark has not been set`);
    }
}
export class ERR_INVALID_PROTOCOL extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_PROTOCOL", `Protocol "${x}" not supported. Expected "${y}"`);
    }
}
export class ERR_INVALID_REPL_EVAL_CONFIG extends NodeTypeError {
    constructor(){
        super("ERR_INVALID_REPL_EVAL_CONFIG", `Cannot specify both "breakEvalOnSigint" and "eval" for REPL`);
    }
}
export class ERR_INVALID_REPL_INPUT extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_REPL_INPUT", `${x}`);
    }
}
export class ERR_INVALID_SYNC_FORK_INPUT extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_SYNC_FORK_INPUT", `Asynchronous forks do not support Buffer, TypedArray, DataView or string input: ${x}`);
    }
}
export class ERR_INVALID_THIS extends NodeTypeError {
    constructor(x){
        super("ERR_INVALID_THIS", `Value of "this" must be of type ${x}`);
    }
}
export class ERR_INVALID_TUPLE extends NodeTypeError {
    constructor(x, y){
        super("ERR_INVALID_TUPLE", `${x} must be an iterable ${y} tuple`);
    }
}
export class ERR_INVALID_URI extends NodeURIError {
    constructor(){
        super("ERR_INVALID_URI", `URI malformed`);
    }
}
export class ERR_IPC_CHANNEL_CLOSED extends NodeError {
    constructor(){
        super("ERR_IPC_CHANNEL_CLOSED", `Channel closed`);
    }
}
export class ERR_IPC_DISCONNECTED extends NodeError {
    constructor(){
        super("ERR_IPC_DISCONNECTED", `IPC channel is already disconnected`);
    }
}
export class ERR_IPC_ONE_PIPE extends NodeError {
    constructor(){
        super("ERR_IPC_ONE_PIPE", `Child process can have only one IPC pipe`);
    }
}
export class ERR_IPC_SYNC_FORK extends NodeError {
    constructor(){
        super("ERR_IPC_SYNC_FORK", `IPC cannot be used with synchronous forks`);
    }
}
export class ERR_MANIFEST_DEPENDENCY_MISSING extends NodeError {
    constructor(x, y){
        super("ERR_MANIFEST_DEPENDENCY_MISSING", `Manifest resource ${x} does not list ${y} as a dependency specifier`);
    }
}
export class ERR_MANIFEST_INTEGRITY_MISMATCH extends NodeSyntaxError {
    constructor(x){
        super("ERR_MANIFEST_INTEGRITY_MISMATCH", `Manifest resource ${x} has multiple entries but integrity lists do not match`);
    }
}
export class ERR_MANIFEST_INVALID_RESOURCE_FIELD extends NodeTypeError {
    constructor(x, y){
        super("ERR_MANIFEST_INVALID_RESOURCE_FIELD", `Manifest resource ${x} has invalid property value for ${y}`);
    }
}
export class ERR_MANIFEST_TDZ extends NodeError {
    constructor(){
        super("ERR_MANIFEST_TDZ", `Manifest initialization has not yet run`);
    }
}
export class ERR_MANIFEST_UNKNOWN_ONERROR extends NodeSyntaxError {
    constructor(x){
        super("ERR_MANIFEST_UNKNOWN_ONERROR", `Manifest specified unknown error behavior "${x}".`);
    }
}
export class ERR_METHOD_NOT_IMPLEMENTED extends NodeError {
    constructor(x){
        super("ERR_METHOD_NOT_IMPLEMENTED", `The ${x} method is not implemented`);
    }
}
export class ERR_MISSING_ARGS extends NodeTypeError {
    constructor(...args){
        args = args.map((a)=>`"${a}"`
        );
        let msg = "The ";
        switch(args.length){
            case 1:
                msg += `${args[0]} argument`;
                break;
            case 2:
                msg += `${args[0]} and ${args[1]} arguments`;
                break;
            default:
                msg += args.slice(0, args.length - 1).join(", ");
                msg += `, and ${args[args.length - 1]} arguments`;
                break;
        }
        super("ERR_MISSING_ARGS", `${msg} must be specified`);
    }
}
export class ERR_MISSING_OPTION extends NodeTypeError {
    constructor(x){
        super("ERR_MISSING_OPTION", `${x} is required`);
    }
}
export class ERR_MULTIPLE_CALLBACK extends NodeError {
    constructor(){
        super("ERR_MULTIPLE_CALLBACK", `Callback called multiple times`);
    }
}
export class ERR_NAPI_CONS_FUNCTION extends NodeTypeError {
    constructor(){
        super("ERR_NAPI_CONS_FUNCTION", `Constructor must be a function`);
    }
}
export class ERR_NAPI_INVALID_DATAVIEW_ARGS extends NodeRangeError {
    constructor(){
        super("ERR_NAPI_INVALID_DATAVIEW_ARGS", `byte_offset + byte_length should be less than or equal to the size in bytes of the array passed in`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT extends NodeRangeError {
    constructor(x, y){
        super("ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT", `start offset of ${x} should be a multiple of ${y}`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_LENGTH extends NodeRangeError {
    constructor(){
        super("ERR_NAPI_INVALID_TYPEDARRAY_LENGTH", `Invalid typed array length`);
    }
}
export class ERR_NO_CRYPTO extends NodeError {
    constructor(){
        super("ERR_NO_CRYPTO", `Node.js is not compiled with OpenSSL crypto support`);
    }
}
export class ERR_NO_ICU extends NodeTypeError {
    constructor(x){
        super("ERR_NO_ICU", `${x} is not supported on Node.js compiled without ICU`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED extends NodeError {
    constructor(x){
        super("ERR_QUICCLIENTSESSION_FAILED", `Failed to create a new QuicClientSession: ${x}`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED_SETSOCKET extends NodeError {
    constructor(){
        super("ERR_QUICCLIENTSESSION_FAILED_SETSOCKET", `Failed to set the QuicSocket`);
    }
}
export class ERR_QUICSESSION_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSESSION_DESTROYED", `Cannot call ${x} after a QuicSession has been destroyed`);
    }
}
export class ERR_QUICSESSION_INVALID_DCID extends NodeError {
    constructor(x){
        super("ERR_QUICSESSION_INVALID_DCID", `Invalid DCID value: ${x}`);
    }
}
export class ERR_QUICSESSION_UPDATEKEY extends NodeError {
    constructor(){
        super("ERR_QUICSESSION_UPDATEKEY", `Unable to update QuicSession keys`);
    }
}
export class ERR_QUICSOCKET_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSOCKET_DESTROYED", `Cannot call ${x} after a QuicSocket has been destroyed`);
    }
}
export class ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH extends NodeError {
    constructor(){
        super("ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH", `The stateResetToken must be exactly 16-bytes in length`);
    }
}
export class ERR_QUICSOCKET_LISTENING extends NodeError {
    constructor(){
        super("ERR_QUICSOCKET_LISTENING", `This QuicSocket is already listening`);
    }
}
export class ERR_QUICSOCKET_UNBOUND extends NodeError {
    constructor(x){
        super("ERR_QUICSOCKET_UNBOUND", `Cannot call ${x} before a QuicSocket has been bound`);
    }
}
export class ERR_QUICSTREAM_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_QUICSTREAM_DESTROYED", `Cannot call ${x} after a QuicStream has been destroyed`);
    }
}
export class ERR_QUICSTREAM_INVALID_PUSH extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_INVALID_PUSH", `Push streams are only supported on client-initiated, bidirectional streams`);
    }
}
export class ERR_QUICSTREAM_OPEN_FAILED extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_OPEN_FAILED", `Opening a new QuicStream failed`);
    }
}
export class ERR_QUICSTREAM_UNSUPPORTED_PUSH extends NodeError {
    constructor(){
        super("ERR_QUICSTREAM_UNSUPPORTED_PUSH", `Push streams are not supported on this QuicSession`);
    }
}
export class ERR_QUIC_TLS13_REQUIRED extends NodeError {
    constructor(){
        super("ERR_QUIC_TLS13_REQUIRED", `QUIC requires TLS version 1.3`);
    }
}
export class ERR_SCRIPT_EXECUTION_INTERRUPTED extends NodeError {
    constructor(){
        super("ERR_SCRIPT_EXECUTION_INTERRUPTED", "Script execution was interrupted by `SIGINT`");
    }
}
export class ERR_SERVER_ALREADY_LISTEN extends NodeError {
    constructor(){
        super("ERR_SERVER_ALREADY_LISTEN", `Listen method has been called more than once without closing.`);
    }
}
export class ERR_SERVER_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_SERVER_NOT_RUNNING", `Server is not running.`);
    }
}
export class ERR_SOCKET_ALREADY_BOUND extends NodeError {
    constructor(){
        super("ERR_SOCKET_ALREADY_BOUND", `Socket is already bound`);
    }
}
export class ERR_SOCKET_BAD_BUFFER_SIZE extends NodeTypeError {
    constructor(){
        super("ERR_SOCKET_BAD_BUFFER_SIZE", `Buffer size must be a positive integer`);
    }
}
export class ERR_SOCKET_BAD_TYPE extends NodeTypeError {
    constructor(){
        super("ERR_SOCKET_BAD_TYPE", `Bad socket type specified. Valid types are: udp4, udp6`);
    }
}
export class ERR_SOCKET_CLOSED extends NodeError {
    constructor(){
        super("ERR_SOCKET_CLOSED", `Socket is closed`);
    }
}
export class ERR_SOCKET_DGRAM_IS_CONNECTED extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_IS_CONNECTED", `Already connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_CONNECTED extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_NOT_CONNECTED", `Not connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_SOCKET_DGRAM_NOT_RUNNING", `Not running`);
    }
}
export class ERR_SRI_PARSE extends NodeSyntaxError {
    constructor(name, char, position){
        super("ERR_SRI_PARSE", `Subresource Integrity string ${name} had an unexpected ${char} at position ${position}`);
    }
}
export class ERR_STREAM_ALREADY_FINISHED extends NodeError {
    constructor(x){
        super("ERR_STREAM_ALREADY_FINISHED", `Cannot call ${x} after a stream was finished`);
    }
}
export class ERR_STREAM_CANNOT_PIPE extends NodeError {
    constructor(){
        super("ERR_STREAM_CANNOT_PIPE", `Cannot pipe, not readable`);
    }
}
export class ERR_STREAM_DESTROYED extends NodeError {
    constructor(x){
        super("ERR_STREAM_DESTROYED", `Cannot call ${x} after a stream was destroyed`);
    }
}
export class ERR_STREAM_NULL_VALUES extends NodeTypeError {
    constructor(){
        super("ERR_STREAM_NULL_VALUES", `May not write null values to stream`);
    }
}
export class ERR_STREAM_PREMATURE_CLOSE extends NodeError {
    constructor(){
        super("ERR_STREAM_PREMATURE_CLOSE", `Premature close`);
    }
}
export class ERR_STREAM_PUSH_AFTER_EOF extends NodeError {
    constructor(){
        super("ERR_STREAM_PUSH_AFTER_EOF", `stream.push() after EOF`);
    }
}
export class ERR_STREAM_UNSHIFT_AFTER_END_EVENT extends NodeError {
    constructor(){
        super("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", `stream.unshift() after end event`);
    }
}
export class ERR_STREAM_WRAP extends NodeError {
    constructor(){
        super("ERR_STREAM_WRAP", `Stream has StringDecoder set or is in objectMode`);
    }
}
export class ERR_STREAM_WRITE_AFTER_END extends NodeError {
    constructor(){
        super("ERR_STREAM_WRITE_AFTER_END", `write after end`);
    }
}
export class ERR_SYNTHETIC extends NodeError {
    constructor(){
        super("ERR_SYNTHETIC", `JavaScript Callstack`);
    }
}
export class ERR_TLS_DH_PARAM_SIZE extends NodeError {
    constructor(x){
        super("ERR_TLS_DH_PARAM_SIZE", `DH parameter size ${x} is less than 2048`);
    }
}
export class ERR_TLS_HANDSHAKE_TIMEOUT extends NodeError {
    constructor(){
        super("ERR_TLS_HANDSHAKE_TIMEOUT", `TLS handshake timeout`);
    }
}
export class ERR_TLS_INVALID_CONTEXT extends NodeTypeError {
    constructor(x){
        super("ERR_TLS_INVALID_CONTEXT", `${x} must be a SecureContext`);
    }
}
export class ERR_TLS_INVALID_STATE extends NodeError {
    constructor(){
        super("ERR_TLS_INVALID_STATE", `TLS socket connection must be securely established`);
    }
}
export class ERR_TLS_INVALID_PROTOCOL_VERSION extends NodeTypeError {
    constructor(protocol, x){
        super("ERR_TLS_INVALID_PROTOCOL_VERSION", `${protocol} is not a valid ${x} TLS protocol version`);
    }
}
export class ERR_TLS_PROTOCOL_VERSION_CONFLICT extends NodeTypeError {
    constructor(prevProtocol, protocol){
        super("ERR_TLS_PROTOCOL_VERSION_CONFLICT", `TLS protocol version ${prevProtocol} conflicts with secureProtocol ${protocol}`);
    }
}
export class ERR_TLS_RENEGOTIATION_DISABLED extends NodeError {
    constructor(){
        super("ERR_TLS_RENEGOTIATION_DISABLED", `TLS session renegotiation disabled for this socket`);
    }
}
export class ERR_TLS_REQUIRED_SERVER_NAME extends NodeError {
    constructor(){
        super("ERR_TLS_REQUIRED_SERVER_NAME", `"servername" is required parameter for Server.addContext`);
    }
}
export class ERR_TLS_SESSION_ATTACK extends NodeError {
    constructor(){
        super("ERR_TLS_SESSION_ATTACK", `TLS session renegotiation attack detected`);
    }
}
export class ERR_TLS_SNI_FROM_SERVER extends NodeError {
    constructor(){
        super("ERR_TLS_SNI_FROM_SERVER", `Cannot issue SNI from a TLS server-side socket`);
    }
}
export class ERR_TRACE_EVENTS_CATEGORY_REQUIRED extends NodeTypeError {
    constructor(){
        super("ERR_TRACE_EVENTS_CATEGORY_REQUIRED", `At least one category is required`);
    }
}
export class ERR_TRACE_EVENTS_UNAVAILABLE extends NodeError {
    constructor(){
        super("ERR_TRACE_EVENTS_UNAVAILABLE", `Trace events are unavailable`);
    }
}
export class ERR_UNAVAILABLE_DURING_EXIT extends NodeError {
    constructor(){
        super("ERR_UNAVAILABLE_DURING_EXIT", `Cannot call function in process exit handler`);
    }
}
export class ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET extends NodeError {
    constructor(){
        super("ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET", "`process.setupUncaughtExceptionCapture()` was called while a capture callback was already active");
    }
}
export class ERR_UNESCAPED_CHARACTERS extends NodeTypeError {
    constructor(x){
        super("ERR_UNESCAPED_CHARACTERS", `${x} contains unescaped characters`);
    }
}
export class ERR_UNKNOWN_BUILTIN_MODULE extends NodeError {
    constructor(x){
        super("ERR_UNKNOWN_BUILTIN_MODULE", `No such built-in module: ${x}`);
    }
}
export class ERR_UNKNOWN_CREDENTIAL extends NodeError {
    constructor(x, y){
        super("ERR_UNKNOWN_CREDENTIAL", `${x} identifier does not exist: ${y}`);
    }
}
export class ERR_UNKNOWN_ENCODING extends NodeTypeError {
    constructor(x){
        super("ERR_UNKNOWN_ENCODING", `Unknown encoding: ${x}`);
    }
}
export class ERR_UNKNOWN_FILE_EXTENSION extends NodeTypeError {
    constructor(x, y){
        super("ERR_UNKNOWN_FILE_EXTENSION", `Unknown file extension "${x}" for ${y}`);
    }
}
export class ERR_UNKNOWN_MODULE_FORMAT extends NodeRangeError {
    constructor(x){
        super("ERR_UNKNOWN_MODULE_FORMAT", `Unknown module format: ${x}`);
    }
}
export class ERR_UNKNOWN_SIGNAL extends NodeTypeError {
    constructor(x){
        super("ERR_UNKNOWN_SIGNAL", `Unknown signal: ${x}`);
    }
}
export class ERR_UNSUPPORTED_DIR_IMPORT extends NodeError {
    constructor(x, y){
        super("ERR_UNSUPPORTED_DIR_IMPORT", `Directory import '${x}' is not supported resolving ES modules, imported from ${y}`);
    }
}
export class ERR_UNSUPPORTED_ESM_URL_SCHEME extends NodeError {
    constructor(){
        super("ERR_UNSUPPORTED_ESM_URL_SCHEME", `Only file and data URLs are supported by the default ESM loader`);
    }
}
export class ERR_V8BREAKITERATOR extends NodeError {
    constructor(){
        super("ERR_V8BREAKITERATOR", `Full ICU data not installed. See https://github.com/nodejs/node/wiki/Intl`);
    }
}
export class ERR_VALID_PERFORMANCE_ENTRY_TYPE extends NodeError {
    constructor(){
        super("ERR_VALID_PERFORMANCE_ENTRY_TYPE", `At least one valid performance entry type is required`);
    }
}
export class ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING extends NodeTypeError {
    constructor(){
        super("ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING", `A dynamic import callback was not specified.`);
    }
}
export class ERR_VM_MODULE_ALREADY_LINKED extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_ALREADY_LINKED", `Module has already been linked`);
    }
}
export class ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA", `Cached data cannot be created for a module which has been evaluated`);
    }
}
export class ERR_VM_MODULE_DIFFERENT_CONTEXT extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_DIFFERENT_CONTEXT", `Linked modules must use the same context`);
    }
}
export class ERR_VM_MODULE_LINKING_ERRORED extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_LINKING_ERRORED", `Linking has already failed for the provided module`);
    }
}
export class ERR_VM_MODULE_NOT_MODULE extends NodeError {
    constructor(){
        super("ERR_VM_MODULE_NOT_MODULE", `Provided module is not an instance of Module`);
    }
}
export class ERR_VM_MODULE_STATUS extends NodeError {
    constructor(x){
        super("ERR_VM_MODULE_STATUS", `Module status ${x}`);
    }
}
export class ERR_WASI_ALREADY_STARTED extends NodeError {
    constructor(){
        super("ERR_WASI_ALREADY_STARTED", `WASI instance has already started`);
    }
}
export class ERR_WORKER_INIT_FAILED extends NodeError {
    constructor(x){
        super("ERR_WORKER_INIT_FAILED", `Worker initialization failure: ${x}`);
    }
}
export class ERR_WORKER_NOT_RUNNING extends NodeError {
    constructor(){
        super("ERR_WORKER_NOT_RUNNING", `Worker instance not running`);
    }
}
export class ERR_WORKER_OUT_OF_MEMORY extends NodeError {
    constructor(x){
        super("ERR_WORKER_OUT_OF_MEMORY", `Worker terminated due to reaching memory limit: ${x}`);
    }
}
export class ERR_WORKER_UNSERIALIZABLE_ERROR extends NodeError {
    constructor(){
        super("ERR_WORKER_UNSERIALIZABLE_ERROR", `Serializing an uncaught exception failed`);
    }
}
export class ERR_WORKER_UNSUPPORTED_EXTENSION extends NodeTypeError {
    constructor(x){
        super("ERR_WORKER_UNSUPPORTED_EXTENSION", `The worker script extension must be ".js", ".mjs", or ".cjs". Received "${x}"`);
    }
}
export class ERR_WORKER_UNSUPPORTED_OPERATION extends NodeTypeError {
    constructor(x){
        super("ERR_WORKER_UNSUPPORTED_OPERATION", `${x} is not supported in workers`);
    }
}
export class ERR_ZLIB_INITIALIZATION_FAILED extends NodeError {
    constructor(){
        super("ERR_ZLIB_INITIALIZATION_FAILED", `Initialization failed`);
    }
}
export class ERR_FALSY_VALUE_REJECTION extends NodeError {
    reason;
    constructor(reason){
        super("ERR_FALSY_VALUE_REJECTION", "Promise was rejected with falsy value");
        this.reason = reason;
    }
}
export class ERR_HTTP2_INVALID_SETTING_VALUE extends NodeRangeError {
    actual;
    min;
    max;
    constructor(name, actual, min, max){
        super("ERR_HTTP2_INVALID_SETTING_VALUE", `Invalid value for setting "${name}": ${actual}`);
        this.actual = actual;
        if (min !== undefined) {
            this.min = min;
            this.max = max;
        }
    }
}
export class ERR_HTTP2_STREAM_CANCEL extends NodeError {
    cause;
    constructor(error){
        super("ERR_HTTP2_STREAM_CANCEL", typeof error.message === "string" ? `The pending stream has been canceled (caused by: ${error.message})` : "The pending stream has been canceled");
        if (error) {
            this.cause = error;
        }
    }
}
export class ERR_INVALID_ADDRESS_FAMILY extends NodeRangeError {
    host;
    port;
    constructor(addressType, host, port){
        super("ERR_INVALID_ADDRESS_FAMILY", `Invalid address family: ${addressType} ${host}:${port}`);
        this.host = host;
        this.port = port;
    }
}
export class ERR_INVALID_CHAR extends NodeTypeError {
    constructor(name, field){
        super("ERR_INVALID_CHAR", field ? `Invalid character in ${name}` : `Invalid character in ${name} ["${field}"]`);
    }
}
export class ERR_INVALID_OPT_VALUE extends NodeTypeError {
    constructor(name, value){
        super("ERR_INVALID_OPT_VALUE", `The value "${value}" is invalid for option "${name}"`);
    }
}
export class ERR_INVALID_RETURN_PROPERTY extends NodeTypeError {
    constructor(input, name, prop, value){
        super("ERR_INVALID_RETURN_PROPERTY", `Expected a valid ${input} to be returned for the "${prop}" from the "${name}" function but got ${value}.`);
    }
}
// deno-lint-ignore no-explicit-any
function buildReturnPropertyType(value) {
    if (value && value.constructor && value.constructor.name) {
        return `instance of ${value.constructor.name}`;
    } else {
        return `type ${typeof value}`;
    }
}
export class ERR_INVALID_RETURN_PROPERTY_VALUE extends NodeTypeError {
    constructor(input, name, prop, value){
        super("ERR_INVALID_RETURN_PROPERTY_VALUE", `Expected ${input} to be returned for the "${prop}" from the "${name}" function but got ${buildReturnPropertyType(value)}.`);
    }
}
export class ERR_INVALID_RETURN_VALUE extends NodeTypeError {
    constructor(input, name, value){
        super("ERR_INVALID_RETURN_VALUE", `Expected ${input} to be returned from the "${name}" function but got ${buildReturnPropertyType(value)}.`);
    }
}
export class ERR_INVALID_URL extends NodeTypeError {
    input;
    constructor(input){
        super("ERR_INVALID_URL", `Invalid URL: ${input}`);
        this.input = input;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZXJyb3JzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBOb2RlLmpzIGNvbnRyaWJ1dG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIExpY2Vuc2UuXG4vKioqKioqKioqKioqIE5PVCBJTVBMRU1FTlRFRFxuKiBFUlJfSU5WQUxJRF9NT0RVTEVfU1BFQ0lGSUVSXG4qIEVSUl9JTlZBTElEX1BBQ0tBR0VfVEFSR0VUXG4qIEVSUl9JTlZBTElEX1VSTF9TQ0hFTUVcbiogRVJSX01BTklGRVNUX0FTU0VSVF9JTlRFR1JJVFlcbiogRVJSX01PRFVMRV9OT1RfRk9VTkRcbiogRVJSX1BBQ0tBR0VfUEFUSF9OT1RfRVhQT1JURURcbiogRVJSX1FVSUNTRVNTSU9OX1ZFUlNJT05fTkVHT1RJQVRJT05cbiogRVJSX1JFUVVJUkVfRVNNXG4qIEVSUl9TT0NLRVRfQkFEX1BPUlRcbiogRVJSX1RMU19DRVJUX0FMVE5BTUVfSU5WQUxJRFxuKiBFUlJfVU5IQU5ETEVEX0VSUk9SXG4qIEVSUl9XT1JLRVJfSU5WQUxJRF9FWEVDX0FSR1ZcbiogRVJSX1dPUktFUl9QQVRIXG4qIEVSUl9RVUlDX0VSUk9SXG4qIEVSUl9TT0NLRVRfQlVGRkVSX1NJWkUgLy9TeXN0ZW0gZXJyb3IsIHNob3VsZG4ndCBldmVyIGhhcHBlbiBpbnNpZGUgRGVub1xuKiBFUlJfU1lTVEVNX0VSUk9SIC8vU3lzdGVtIGVycm9yLCBzaG91bGRuJ3QgZXZlciBoYXBwZW4gaW5zaWRlIERlbm9cbiogRVJSX1RUWV9JTklUX0ZBSUxFRCAvL1N5c3RlbSBlcnJvciwgc2hvdWxkbid0IGV2ZXIgaGFwcGVuIGluc2lkZSBEZW5vXG4qIEVSUl9JTlZBTElEX1BBQ0tBR0VfQ09ORklHIC8vIHBhY2thZ2UuanNvbiBzdHVmZiwgcHJvYmFibHkgdXNlbGVzc1xuKioqKioqKioqKioqKi9cblxuaW1wb3J0IHsgdW5yZWFjaGFibGUgfSBmcm9tIFwiLi4vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG5pbXBvcnQgeyBpbnNwZWN0IH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG4vKipcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvZjNlYjIyNC9saWIvaW50ZXJuYWwvZXJyb3JzLmpzXG4gKi9cbmNvbnN0IGNsYXNzUmVnRXhwID0gL14oW0EtWl1bYS16MC05XSopKyQvO1xuXG4vKipcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvZjNlYjIyNC9saWIvaW50ZXJuYWwvZXJyb3JzLmpzXG4gKiBAZGVzY3JpcHRpb24gU29ydGVkIGJ5IGEgcm91Z2ggZXN0aW1hdGUgb24gbW9zdCBmcmVxdWVudGx5IHVzZWQgZW50cmllcy5cbiAqL1xuY29uc3Qga1R5cGVzID0gW1xuICBcInN0cmluZ1wiLFxuICBcImZ1bmN0aW9uXCIsXG4gIFwibnVtYmVyXCIsXG4gIFwib2JqZWN0XCIsXG4gIC8vIEFjY2VwdCAnRnVuY3Rpb24nIGFuZCAnT2JqZWN0JyBhcyBhbHRlcm5hdGl2ZSB0byB0aGUgbG93ZXIgY2FzZWQgdmVyc2lvbi5cbiAgXCJGdW5jdGlvblwiLFxuICBcIk9iamVjdFwiLFxuICBcImJvb2xlYW5cIixcbiAgXCJiaWdpbnRcIixcbiAgXCJzeW1ib2xcIixcbl07XG5cbi8qKlxuICogQWxsIGVycm9yIGluc3RhbmNlcyBpbiBOb2RlIGhhdmUgYWRkaXRpb25hbCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzXG4gKiBUaGlzIGV4cG9ydCBjbGFzcyBpcyBtZWFudCB0byBiZSBleHRlbmRlZCBieSB0aGVzZSBpbnN0YW5jZXMgYWJzdHJhY3RpbmcgbmF0aXZlIEpTIGVycm9yIGluc3RhbmNlc1xuICovXG5leHBvcnQgY2xhc3MgTm9kZUVycm9yQWJzdHJhY3Rpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvZGU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIC8vVGhpcyBudW1iZXIgY2hhbmdlcyBkZXBlbmRlbmRpbmcgb24gdGhlIG5hbWUgb2YgdGhpcyBjbGFzc1xuICAgIC8vMjAgY2hhcmFjdGVycyBhcyBvZiBub3dcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5zdGFjayAmJiBgJHtuYW1lfSBbJHt0aGlzLmNvZGV9XSR7dGhpcy5zdGFjay5zbGljZSgyMCl9YDtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlU3ludGF4RXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvblxuICBpbXBsZW1lbnRzIFN5bnRheEVycm9yIHtcbiAgY29uc3RydWN0b3IoY29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihTeW50YXhFcnJvci5wcm90b3R5cGUubmFtZSwgY29kZSwgbWVzc2FnZSk7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIFN5bnRheEVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVSYW5nZUVycm9yIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb24ge1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFJhbmdlRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBSYW5nZUVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVUeXBlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiBpbXBsZW1lbnRzIFR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoVHlwZUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVHlwZUVycm9yLnByb3RvdHlwZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVVUklFcnJvciBleHRlbmRzIE5vZGVFcnJvckFic3RyYWN0aW9uIGltcGxlbWVudHMgVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFVSSUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVVJJRXJyb3IucHJvdG90eXBlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQVJHX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBleHBlY3RlZDogc3RyaW5nIHwgc3RyaW5nW10sIGFjdHVhbDogdW5rbm93bikge1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2YzZWIyMjQvbGliL2ludGVybmFsL2Vycm9ycy5qcyNMMTAzNy1MMTA4N1xuICAgIGV4cGVjdGVkID0gQXJyYXkuaXNBcnJheShleHBlY3RlZCkgPyBleHBlY3RlZCA6IFtleHBlY3RlZF07XG4gICAgbGV0IG1zZyA9IFwiVGhlIFwiO1xuICAgIGlmIChuYW1lLmVuZHNXaXRoKFwiIGFyZ3VtZW50XCIpKSB7XG4gICAgICAvLyBGb3IgY2FzZXMgbGlrZSAnZmlyc3QgYXJndW1lbnQnXG4gICAgICBtc2cgKz0gYCR7bmFtZX0gYDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdHlwZSA9IG5hbWUuaW5jbHVkZXMoXCIuXCIpID8gXCJwcm9wZXJ0eVwiIDogXCJhcmd1bWVudFwiO1xuICAgICAgbXNnICs9IGBcIiR7bmFtZX1cIiAke3R5cGV9IGA7XG4gICAgfVxuICAgIG1zZyArPSBcIm11c3QgYmUgXCI7XG5cbiAgICBjb25zdCB0eXBlcyA9IFtdO1xuICAgIGNvbnN0IGluc3RhbmNlcyA9IFtdO1xuICAgIGNvbnN0IG90aGVyID0gW107XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBleHBlY3RlZCkge1xuICAgICAgaWYgKGtUeXBlcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgICAgdHlwZXMucHVzaCh2YWx1ZS50b0xvY2FsZUxvd2VyQ2FzZSgpKTtcbiAgICAgIH0gZWxzZSBpZiAoY2xhc3NSZWdFeHAudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgaW5zdGFuY2VzLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3RoZXIucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU3BlY2lhbCBoYW5kbGUgYG9iamVjdGAgaW4gY2FzZSBvdGhlciBpbnN0YW5jZXMgYXJlIGFsbG93ZWQgdG8gb3V0bGluZVxuICAgIC8vIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGVhY2ggb3RoZXIuXG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwb3MgPSB0eXBlcy5pbmRleE9mKFwib2JqZWN0XCIpO1xuICAgICAgaWYgKHBvcyAhPT0gLTEpIHtcbiAgICAgICAgdHlwZXMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgIGluc3RhbmNlcy5wdXNoKFwiT2JqZWN0XCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlcy5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodHlwZXMubGVuZ3RoID4gMikge1xuICAgICAgICBjb25zdCBsYXN0ID0gdHlwZXMucG9wKCk7XG4gICAgICAgIG1zZyArPSBgb25lIG9mIHR5cGUgJHt0eXBlcy5qb2luKFwiLCBcIil9LCBvciAke2xhc3R9YDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIG1zZyArPSBgb25lIG9mIHR5cGUgJHt0eXBlc1swXX0gb3IgJHt0eXBlc1sxXX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXNnICs9IGBvZiB0eXBlICR7dHlwZXNbMF19YDtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMCB8fCBvdGhlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1zZyArPSBcIiBvciBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMikge1xuICAgICAgICBjb25zdCBsYXN0ID0gaW5zdGFuY2VzLnBvcCgpO1xuICAgICAgICBtc2cgKz0gYGFuIGluc3RhbmNlIG9mICR7aW5zdGFuY2VzLmpvaW4oXCIsIFwiKX0sIG9yICR7bGFzdH1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXNnICs9IGBhbiBpbnN0YW5jZSBvZiAke2luc3RhbmNlc1swXX1gO1xuICAgICAgICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgIG1zZyArPSBgIG9yICR7aW5zdGFuY2VzWzFdfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvdGhlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1zZyArPSBcIiBvciBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3RoZXIubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKG90aGVyLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IG90aGVyLnBvcCgpO1xuICAgICAgICBtc2cgKz0gYG9uZSBvZiAke290aGVyLmpvaW4oXCIsIFwiKX0sIG9yICR7bGFzdH1gO1xuICAgICAgfSBlbHNlIGlmIChvdGhlci5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgbXNnICs9IGBvbmUgb2YgJHtvdGhlclswXX0gb3IgJHtvdGhlclsxXX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG90aGVyWzBdLnRvTG93ZXJDYXNlKCkgIT09IG90aGVyWzBdKSB7XG4gICAgICAgICAgbXNnICs9IFwiYW4gXCI7XG4gICAgICAgIH1cbiAgICAgICAgbXNnICs9IGAke290aGVyWzBdfWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0FSR19UWVBFXCIsXG4gICAgICBgJHttc2d9LiR7aW52YWxpZEFyZ1R5cGVIZWxwZXIoYWN0dWFsKX1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCByZWFzb246IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9BUkdfVkFMVUVcIixcbiAgICAgIGBUaGUgYXJndW1lbnQgJyR7bmFtZX0nICR7cmVhc29ufS4gUmVjZWl2ZWQgJHtpbnNwZWN0KHZhbHVlKX1gLFxuICAgICk7XG4gIH1cbn1cblxuLy8gQSBoZWxwZXIgZnVuY3Rpb24gdG8gc2ltcGxpZnkgY2hlY2tpbmcgZm9yIEVSUl9JTlZBTElEX0FSR19UWVBFIG91dHB1dC5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBpbnZhbGlkQXJnVHlwZUhlbHBlcihpbnB1dDogYW55KSB7XG4gIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGAgUmVjZWl2ZWQgJHtpbnB1dH1gO1xuICB9XG4gIGlmICh0eXBlb2YgaW5wdXQgPT09IFwiZnVuY3Rpb25cIiAmJiBpbnB1dC5uYW1lKSB7XG4gICAgcmV0dXJuIGAgUmVjZWl2ZWQgZnVuY3Rpb24gJHtpbnB1dC5uYW1lfWA7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChpbnB1dC5jb25zdHJ1Y3RvciAmJiBpbnB1dC5jb25zdHJ1Y3Rvci5uYW1lKSB7XG4gICAgICByZXR1cm4gYCBSZWNlaXZlZCBhbiBpbnN0YW5jZSBvZiAke2lucHV0LmNvbnN0cnVjdG9yLm5hbWV9YDtcbiAgICB9XG4gICAgcmV0dXJuIGAgUmVjZWl2ZWQgJHtpbnNwZWN0KGlucHV0LCB7IGRlcHRoOiAtMSB9KX1gO1xuICB9XG4gIGxldCBpbnNwZWN0ZWQgPSBpbnNwZWN0KGlucHV0LCB7IGNvbG9yczogZmFsc2UgfSk7XG4gIGlmIChpbnNwZWN0ZWQubGVuZ3RoID4gMjUpIHtcbiAgICBpbnNwZWN0ZWQgPSBgJHtpbnNwZWN0ZWQuc2xpY2UoMCwgMjUpfS4uLmA7XG4gIH1cbiAgcmV0dXJuIGAgUmVjZWl2ZWQgdHlwZSAke3R5cGVvZiBpbnB1dH0gKCR7aW5zcGVjdGVkfSlgO1xufVxuXG5leHBvcnQgY2xhc3MgRVJSX09VVF9PRl9SQU5HRSBleHRlbmRzIFJhbmdlRXJyb3Ige1xuICBjb2RlID0gXCJFUlJfT1VUX09GX1JBTkdFXCI7XG5cbiAgY29uc3RydWN0b3Ioc3RyOiBzdHJpbmcsIHJhbmdlOiBzdHJpbmcsIHJlY2VpdmVkOiB1bmtub3duKSB7XG4gICAgc3VwZXIoXG4gICAgICBgVGhlIHZhbHVlIG9mIFwiJHtzdHJ9XCIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlICR7cmFuZ2V9LiBSZWNlaXZlZCAke3JlY2VpdmVkfWAsXG4gICAgKTtcblxuICAgIGNvbnN0IHsgbmFtZSB9ID0gdGhpcztcbiAgICAvLyBBZGQgdGhlIGVycm9yIGNvZGUgdG8gdGhlIG5hbWUgdG8gaW5jbHVkZSBpdCBpbiB0aGUgc3RhY2sgdHJhY2UuXG4gICAgdGhpcy5uYW1lID0gYCR7bmFtZX0gWyR7dGhpcy5jb2RlfV1gO1xuICAgIC8vIEFjY2VzcyB0aGUgc3RhY2sgdG8gZ2VuZXJhdGUgdGhlIGVycm9yIG1lc3NhZ2UgaW5jbHVkaW5nIHRoZSBlcnJvciBjb2RlIGZyb20gdGhlIG5hbWUuXG4gICAgdGhpcy5zdGFjaztcbiAgICAvLyBSZXNldCB0aGUgbmFtZSB0byB0aGUgYWN0dWFsIG5hbWUuXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0FNQklHVU9VU19BUkdVTUVOVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0FNQklHVU9VU19BUkdVTUVOVFwiLCBgVGhlIFwiJHt4fVwiIGFyZ3VtZW50IGlzIGFtYmlndW91cy4gJHt5fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQVJHX05PVF9JVEVSQUJMRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9BUkdfTk9UX0lURVJBQkxFXCIsIGAke3h9IG11c3QgYmUgaXRlcmFibGVgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0FTU0VSVElPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0FTU0VSVElPTlwiLCBgJHt4fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQVNZTkNfQ0FMTEJBQ0sgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQVNZTkNfQ0FMTEJBQ0tcIiwgYCR7eH0gbXVzdCBiZSBhIGZ1bmN0aW9uYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9BU1lOQ19UWVBFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0FTWU5DX1RZUEVcIiwgYEludmFsaWQgbmFtZSBmb3IgYXN5bmMgXCJ0eXBlXCI6ICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0JST1RMSV9JTlZBTElEX1BBUkFNIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9CUk9UTElfSU5WQUxJRF9QQVJBTVwiLCBgJHt4fSBpcyBub3QgYSB2YWxpZCBCcm90bGkgcGFyYW1ldGVyYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9CVUZGRVJfT1VUX09GX0JPVU5EUyBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZT86IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQlVGRkVSX09VVF9PRl9CT1VORFNcIixcbiAgICAgIG5hbWVcbiAgICAgICAgPyBgXCIke25hbWV9XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzYFxuICAgICAgICA6IFwiQXR0ZW1wdCB0byBhY2Nlc3MgbWVtb3J5IG91dHNpZGUgYnVmZmVyIGJvdW5kc1wiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9CVUZGRVJfVE9PX0xBUkdFIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0JVRkZFUl9UT09fTEFSR0VcIixcbiAgICAgIGBDYW5ub3QgY3JlYXRlIGEgQnVmZmVyIGxhcmdlciB0aGFuICR7eH0gYnl0ZXNgLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DQU5OT1RfV0FUQ0hfU0lHSU5UIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DQU5OT1RfV0FUQ0hfU0lHSU5UXCIsXG4gICAgICBcIkNhbm5vdCB3YXRjaCBmb3IgU0lHSU5UIHNpZ25hbHNcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ0hJTERfQ0xPU0VEX0JFRk9SRV9SRVBMWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ0hJTERfQ0xPU0VEX0JFRk9SRV9SRVBMWVwiLFxuICAgICAgXCJDaGlsZCBjbG9zZWQgYmVmb3JlIHJlcGx5IHJlY2VpdmVkXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NISUxEX1BST0NFU1NfSVBDX1JFUVVJUkVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DSElMRF9QUk9DRVNTX0lQQ19SRVFVSVJFRFwiLFxuICAgICAgYEZvcmtlZCBwcm9jZXNzZXMgbXVzdCBoYXZlIGFuIElQQyBjaGFubmVsLCBtaXNzaW5nIHZhbHVlICdpcGMnIGluICR7eH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DSElMRF9QUk9DRVNTX1NURElPX01BWEJVRkZFUiBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DSElMRF9QUk9DRVNTX1NURElPX01BWEJVRkZFUlwiLFxuICAgICAgYCR7eH0gbWF4QnVmZmVyIGxlbmd0aCBleGNlZWRlZGAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NPTlNPTEVfV1JJVEFCTEVfU1RSRUFNIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ09OU09MRV9XUklUQUJMRV9TVFJFQU1cIixcbiAgICAgIGBDb25zb2xlIGV4cGVjdHMgYSB3cml0YWJsZSBzdHJlYW0gaW5zdGFuY2UgZm9yICR7eH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DT05URVhUX05PVF9JTklUSUFMSVpFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ09OVEVYVF9OT1RfSU5JVElBTElaRURcIixcbiAgICAgIFwiY29udGV4dCB1c2VkIGlzIG5vdCBpbml0aWFsaXplZFwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUFVfVVNBR0UgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NQVV9VU0FHRVwiLFxuICAgICAgYFVuYWJsZSB0byBvYnRhaW4gY3B1IHVzYWdlICR7eH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fQ1VTVE9NX0VOR0lORV9OT1RfU1VQUE9SVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fQ1VTVE9NX0VOR0lORV9OT1RfU1VQUE9SVEVEXCIsXG4gICAgICBcIkN1c3RvbSBlbmdpbmVzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBPcGVuU1NMXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19FQ0RIX0lOVkFMSURfRk9STUFUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVRcIixcbiAgICAgIGBJbnZhbGlkIEVDREggZm9ybWF0OiAke3h9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9QVUJMSUNfS0VZIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fRUNESF9JTlZBTElEX1BVQkxJQ19LRVlcIixcbiAgICAgIFwiUHVibGljIGtleSBpcyBub3QgdmFsaWQgZm9yIHNwZWNpZmllZCBjdXJ2ZVwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fRU5HSU5FX1VOS05PV04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19FTkdJTkVfVU5LTk9XTlwiLFxuICAgICAgYEVuZ2luZSBcIiR7eH1cIiB3YXMgbm90IGZvdW5kYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfRk9SQ0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fRklQU19GT1JDRURcIixcbiAgICAgIFwiQ2Fubm90IHNldCBGSVBTIG1vZGUsIGl0IHdhcyBmb3JjZWQgd2l0aCAtLWZvcmNlLWZpcHMgYXQgc3RhcnR1cC5cIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfVU5BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19GSVBTX1VOQVZBSUxBQkxFXCIsXG4gICAgICBcIkNhbm5vdCBzZXQgRklQUyBtb2RlIGluIGEgbm9uLUZJUFMgYnVpbGQuXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0hBU0hfRklOQUxJWkVEXCIsXG4gICAgICBcIkRpZ2VzdCBhbHJlYWR5IGNhbGxlZFwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fSEFTSF9VUERBVEVfRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fSEFTSF9VUERBVEVfRkFJTEVEXCIsXG4gICAgICBcIkhhc2ggdXBkYXRlIGZhaWxlZFwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWVwiLFxuICAgICAgYEluY29tcGF0aWJsZSAke3h9OiAke3l9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOQ09NUEFUSUJMRV9LRVlfT1BUSU9OUyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWV9PUFRJT05TXCIsXG4gICAgICBgVGhlIHNlbGVjdGVkIGtleSBlbmNvZGluZyAke3h9ICR7eX0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOVkFMSURfRElHRVNUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0lOVkFMSURfRElHRVNUXCIsXG4gICAgICBgSW52YWxpZCBkaWdlc3Q6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fSU5WQUxJRF9LRVlfT0JKRUNUX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19JTlZBTElEX0tFWV9PQkpFQ1RfVFlQRVwiLFxuICAgICAgYEludmFsaWQga2V5IG9iamVjdCB0eXBlICR7eH0sIGV4cGVjdGVkICR7eX0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOVkFMSURfU1RBVEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19JTlZBTElEX1NUQVRFXCIsXG4gICAgICBgSW52YWxpZCBzdGF0ZSBmb3Igb3BlcmF0aW9uICR7eH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fUEJLREYyX0VSUk9SIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fUEJLREYyX0VSUk9SXCIsXG4gICAgICBcIlBCS0RGMiBlcnJvclwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSXCIsXG4gICAgICBcIkludmFsaWQgc2NyeXB0IHBhcmFtZXRlclwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fU0NSWVBUX05PVF9TVVBQT1JURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19TQ1JZUFRfTk9UX1NVUFBPUlRFRFwiLFxuICAgICAgXCJTY3J5cHQgYWxnb3JpdGhtIG5vdCBzdXBwb3J0ZWRcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX1NJR05fS0VZX1JFUVVJUkVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fU0lHTl9LRVlfUkVRVUlSRURcIixcbiAgICAgIFwiTm8ga2V5IHByb3ZpZGVkIHRvIHNpZ25cIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRElSX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRElSX0NMT1NFRFwiLFxuICAgICAgXCJEaXJlY3RvcnkgaGFuZGxlIHdhcyBjbG9zZWRcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRElSX0NPTkNVUlJFTlRfT1BFUkFUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9ESVJfQ09OQ1VSUkVOVF9PUEVSQVRJT05cIixcbiAgICAgIFwiQ2Fubm90IGRvIHN5bmNocm9ub3VzIHdvcmsgb24gZGlyZWN0b3J5IGhhbmRsZSB3aXRoIGNvbmN1cnJlbnQgYXN5bmNocm9ub3VzIG9wZXJhdGlvbnNcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRE5TX1NFVF9TRVJWRVJTX0ZBSUxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9ETlNfU0VUX1NFUlZFUlNfRkFJTEVEXCIsXG4gICAgICBgYy1hcmVzIGZhaWxlZCB0byBzZXQgc2VydmVyczogXCIke3h9XCIgWyR7eX1dYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRE9NQUlOX0NBTExCQUNLX05PVF9BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0RPTUFJTl9DQUxMQkFDS19OT1RfQVZBSUxBQkxFXCIsXG4gICAgICBcIkEgY2FsbGJhY2sgd2FzIHJlZ2lzdGVyZWQgdGhyb3VnaCBcIiArXG4gICAgICAgIFwicHJvY2Vzcy5zZXRVbmNhdWdodEV4Y2VwdGlvbkNhcHR1cmVDYWxsYmFjaygpLCB3aGljaCBpcyBtdXR1YWxseSBcIiArXG4gICAgICAgIFwiZXhjbHVzaXZlIHdpdGggdXNpbmcgdGhlIGBkb21haW5gIG1vZHVsZVwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ET01BSU5fQ0FOTk9UX1NFVF9VTkNBVUdIVF9FWENFUFRJT05fQ0FQVFVSRVxuICBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRE9NQUlOX0NBTk5PVF9TRVRfVU5DQVVHSFRfRVhDRVBUSU9OX0NBUFRVUkVcIixcbiAgICAgIFwiVGhlIGBkb21haW5gIG1vZHVsZSBpcyBpbiB1c2UsIHdoaWNoIGlzIG11dHVhbGx5IGV4Y2x1c2l2ZSB3aXRoIGNhbGxpbmcgXCIgK1xuICAgICAgICBcInByb2Nlc3Muc2V0VW5jYXVnaHRFeGNlcHRpb25DYXB0dXJlQ2FsbGJhY2soKVwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9FTkNPRElOR19JTlZBTElEX0VOQ09ERURfREFUQSBleHRlbmRzIE5vZGVFcnJvckFic3RyYWN0aW9uXG4gIGltcGxlbWVudHMgVHlwZUVycm9yIHtcbiAgZXJybm86IG51bWJlcjtcbiAgY29uc3RydWN0b3IoZW5jb2Rpbmc6IHN0cmluZywgcmV0OiBudW1iZXIpIHtcbiAgICBzdXBlcihcbiAgICAgIFR5cGVFcnJvci5wcm90b3R5cGUubmFtZSxcbiAgICAgIFwiRVJSX0VOQ09ESU5HX0lOVkFMSURfRU5DT0RFRF9EQVRBXCIsXG4gICAgICBgVGhlIGVuY29kZWQgZGF0YSB3YXMgbm90IHZhbGlkIGZvciBlbmNvZGluZyAke2VuY29kaW5nfWAsXG4gICAgKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVHlwZUVycm9yLnByb3RvdHlwZSk7XG5cbiAgICB0aGlzLmVycm5vID0gcmV0O1xuICB9XG59XG5cbi8vIEluIE5vZGUgdGhlc2UgdmFsdWVzIGFyZSBjb21pbmcgZnJvbSBsaWJ1djpcbi8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL2xpYnV2L2xpYnV2L2Jsb2IvdjEueC9pbmNsdWRlL3V2L2Vycm5vLmhcbi8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvNTI0MTIzZmJmMDY0ZmY2NGJiNmZjZDgzNDg1Y2ZjMjdkYjkzMmY2OC9saWIvaW50ZXJuYWwvZXJyb3JzLmpzI0wzODNcbi8vIFNpbmNlIHRoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIHBvcnQgY29kZSBmcm9tIGxpYnV2IGFuZCB0aGVzZSBtYXBzIGFyZVxuLy8gY2hhbmdpbmcgdmVyeSByYXJlbHksIHdlIHNpbXBseSBleHRyYWN0IHRoZW0gZnJvbSBOb2RlIGFuZCBzdG9yZSBoZXJlLlxuXG4vLyBOb3RlXG4vLyBSdW4gdGhlIGZvbGxvd2luZyB0byBnZXQgdGhlIG1hcDpcbi8vICQgbm9kZSAtZSBcImNvbnNvbGUubG9nKHByb2Nlc3MuYmluZGluZygndXYnKS5nZXRFcnJvck1hcCgpKVwiXG4vLyBUaGlzIHNldHVwIGF1dG9tYXRpY2FsbHkgZXhwb3J0cyBtYXBzIGZyb20gYm90aCBcIndpblwiLCBcImxpbnV4XCIgJiBkYXJ3aW46XG4vLyBodHRwczovL2dpdGh1Yi5jb20vc2Nod2FyemtvcGZiL25vZGVfZXJybm9fbWFwXG5cbnR5cGUgRXJyTWFwRGF0YSA9IEFycmF5PFtudW1iZXIsIFtzdHJpbmcsIHN0cmluZ11dPjtcblxuY29uc3Qgd2luZG93czogRXJyTWFwRGF0YSA9IFtcbiAgWy00MDkzLCBbXCJFMkJJR1wiLCBcImFyZ3VtZW50IGxpc3QgdG9vIGxvbmdcIl1dLFxuICBbLTQwOTIsIFtcIkVBQ0NFU1wiLCBcInBlcm1pc3Npb24gZGVuaWVkXCJdXSxcbiAgWy00MDkxLCBbXCJFQUREUklOVVNFXCIsIFwiYWRkcmVzcyBhbHJlYWR5IGluIHVzZVwiXV0sXG4gIFstNDA5MCwgW1wiRUFERFJOT1RBVkFJTFwiLCBcImFkZHJlc3Mgbm90IGF2YWlsYWJsZVwiXV0sXG4gIFstNDA4OSwgW1wiRUFGTk9TVVBQT1JUXCIsIFwiYWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZFwiXV0sXG4gIFstNDA4OCwgW1wiRUFHQUlOXCIsIFwicmVzb3VyY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGVcIl1dLFxuICBbLTMwMDAsIFtcIkVBSV9BRERSRkFNSUxZXCIsIFwiYWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZFwiXV0sXG4gIFstMzAwMSwgW1wiRUFJX0FHQUlOXCIsIFwidGVtcG9yYXJ5IGZhaWx1cmVcIl1dLFxuICBbLTMwMDIsIFtcIkVBSV9CQURGTEFHU1wiLCBcImJhZCBhaV9mbGFncyB2YWx1ZVwiXV0sXG4gIFstMzAxMywgW1wiRUFJX0JBREhJTlRTXCIsIFwiaW52YWxpZCB2YWx1ZSBmb3IgaGludHNcIl1dLFxuICBbLTMwMDMsIFtcIkVBSV9DQU5DRUxFRFwiLCBcInJlcXVlc3QgY2FuY2VsZWRcIl1dLFxuICBbLTMwMDQsIFtcIkVBSV9GQUlMXCIsIFwicGVybWFuZW50IGZhaWx1cmVcIl1dLFxuICBbLTMwMDUsIFtcIkVBSV9GQU1JTFlcIiwgXCJhaV9mYW1pbHkgbm90IHN1cHBvcnRlZFwiXV0sXG4gIFstMzAwNiwgW1wiRUFJX01FTU9SWVwiLCBcIm91dCBvZiBtZW1vcnlcIl1dLFxuICBbLTMwMDcsIFtcIkVBSV9OT0RBVEFcIiwgXCJubyBhZGRyZXNzXCJdXSxcbiAgWy0zMDA4LCBbXCJFQUlfTk9OQU1FXCIsIFwidW5rbm93biBub2RlIG9yIHNlcnZpY2VcIl1dLFxuICBbLTMwMDksIFtcIkVBSV9PVkVSRkxPV1wiLCBcImFyZ3VtZW50IGJ1ZmZlciBvdmVyZmxvd1wiXV0sXG4gIFstMzAxNCwgW1wiRUFJX1BST1RPQ09MXCIsIFwicmVzb2x2ZWQgcHJvdG9jb2wgaXMgdW5rbm93blwiXV0sXG4gIFstMzAxMCwgW1wiRUFJX1NFUlZJQ0VcIiwgXCJzZXJ2aWNlIG5vdCBhdmFpbGFibGUgZm9yIHNvY2tldCB0eXBlXCJdXSxcbiAgWy0zMDExLCBbXCJFQUlfU09DS1RZUEVcIiwgXCJzb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkXCJdXSxcbiAgWy00MDg0LCBbXCJFQUxSRUFEWVwiLCBcImNvbm5lY3Rpb24gYWxyZWFkeSBpbiBwcm9ncmVzc1wiXV0sXG4gIFstNDA4MywgW1wiRUJBREZcIiwgXCJiYWQgZmlsZSBkZXNjcmlwdG9yXCJdXSxcbiAgWy00MDgyLCBbXCJFQlVTWVwiLCBcInJlc291cmNlIGJ1c3kgb3IgbG9ja2VkXCJdXSxcbiAgWy00MDgxLCBbXCJFQ0FOQ0VMRURcIiwgXCJvcGVyYXRpb24gY2FuY2VsZWRcIl1dLFxuICBbLTQwODAsIFtcIkVDSEFSU0VUXCIsIFwiaW52YWxpZCBVbmljb2RlIGNoYXJhY3RlclwiXV0sXG4gIFstNDA3OSwgW1wiRUNPTk5BQk9SVEVEXCIsIFwic29mdHdhcmUgY2F1c2VkIGNvbm5lY3Rpb24gYWJvcnRcIl1dLFxuICBbLTQwNzgsIFtcIkVDT05OUkVGVVNFRFwiLCBcImNvbm5lY3Rpb24gcmVmdXNlZFwiXV0sXG4gIFstNDA3NywgW1wiRUNPTk5SRVNFVFwiLCBcImNvbm5lY3Rpb24gcmVzZXQgYnkgcGVlclwiXV0sXG4gIFstNDA3NiwgW1wiRURFU1RBRERSUkVRXCIsIFwiZGVzdGluYXRpb24gYWRkcmVzcyByZXF1aXJlZFwiXV0sXG4gIFstNDA3NSwgW1wiRUVYSVNUXCIsIFwiZmlsZSBhbHJlYWR5IGV4aXN0c1wiXV0sXG4gIFstNDA3NCwgW1wiRUZBVUxUXCIsIFwiYmFkIGFkZHJlc3MgaW4gc3lzdGVtIGNhbGwgYXJndW1lbnRcIl1dLFxuICBbLTQwMzYsIFtcIkVGQklHXCIsIFwiZmlsZSB0b28gbGFyZ2VcIl1dLFxuICBbLTQwNzMsIFtcIkVIT1NUVU5SRUFDSFwiLCBcImhvc3QgaXMgdW5yZWFjaGFibGVcIl1dLFxuICBbLTQwNzIsIFtcIkVJTlRSXCIsIFwiaW50ZXJydXB0ZWQgc3lzdGVtIGNhbGxcIl1dLFxuICBbLTQwNzEsIFtcIkVJTlZBTFwiLCBcImludmFsaWQgYXJndW1lbnRcIl1dLFxuICBbLTQwNzAsIFtcIkVJT1wiLCBcImkvbyBlcnJvclwiXV0sXG4gIFstNDA2OSwgW1wiRUlTQ09OTlwiLCBcInNvY2tldCBpcyBhbHJlYWR5IGNvbm5lY3RlZFwiXV0sXG4gIFstNDA2OCwgW1wiRUlTRElSXCIsIFwiaWxsZWdhbCBvcGVyYXRpb24gb24gYSBkaXJlY3RvcnlcIl1dLFxuICBbLTQwNjcsIFtcIkVMT09QXCIsIFwidG9vIG1hbnkgc3ltYm9saWMgbGlua3MgZW5jb3VudGVyZWRcIl1dLFxuICBbLTQwNjYsIFtcIkVNRklMRVwiLCBcInRvbyBtYW55IG9wZW4gZmlsZXNcIl1dLFxuICBbLTQwNjUsIFtcIkVNU0dTSVpFXCIsIFwibWVzc2FnZSB0b28gbG9uZ1wiXV0sXG4gIFstNDA2NCwgW1wiRU5BTUVUT09MT05HXCIsIFwibmFtZSB0b28gbG9uZ1wiXV0sXG4gIFstNDA2MywgW1wiRU5FVERPV05cIiwgXCJuZXR3b3JrIGlzIGRvd25cIl1dLFxuICBbLTQwNjIsIFtcIkVORVRVTlJFQUNIXCIsIFwibmV0d29yayBpcyB1bnJlYWNoYWJsZVwiXV0sXG4gIFstNDA2MSwgW1wiRU5GSUxFXCIsIFwiZmlsZSB0YWJsZSBvdmVyZmxvd1wiXV0sXG4gIFstNDA2MCwgW1wiRU5PQlVGU1wiLCBcIm5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGVcIl1dLFxuICBbLTQwNTksIFtcIkVOT0RFVlwiLCBcIm5vIHN1Y2ggZGV2aWNlXCJdXSxcbiAgWy00MDU4LCBbXCJFTk9FTlRcIiwgXCJubyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5XCJdXSxcbiAgWy00MDU3LCBbXCJFTk9NRU1cIiwgXCJub3QgZW5vdWdoIG1lbW9yeVwiXV0sXG4gIFstNDA1NiwgW1wiRU5PTkVUXCIsIFwibWFjaGluZSBpcyBub3Qgb24gdGhlIG5ldHdvcmtcIl1dLFxuICBbLTQwMzUsIFtcIkVOT1BST1RPT1BUXCIsIFwicHJvdG9jb2wgbm90IGF2YWlsYWJsZVwiXV0sXG4gIFstNDA1NSwgW1wiRU5PU1BDXCIsIFwibm8gc3BhY2UgbGVmdCBvbiBkZXZpY2VcIl1dLFxuICBbLTQwNTQsIFtcIkVOT1NZU1wiLCBcImZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZFwiXV0sXG4gIFstNDA1MywgW1wiRU5PVENPTk5cIiwgXCJzb2NrZXQgaXMgbm90IGNvbm5lY3RlZFwiXV0sXG4gIFstNDA1MiwgW1wiRU5PVERJUlwiLCBcIm5vdCBhIGRpcmVjdG9yeVwiXV0sXG4gIFstNDA1MSwgW1wiRU5PVEVNUFRZXCIsIFwiZGlyZWN0b3J5IG5vdCBlbXB0eVwiXV0sXG4gIFstNDA1MCwgW1wiRU5PVFNPQ0tcIiwgXCJzb2NrZXQgb3BlcmF0aW9uIG9uIG5vbi1zb2NrZXRcIl1dLFxuICBbLTQwNDksIFtcIkVOT1RTVVBcIiwgXCJvcGVyYXRpb24gbm90IHN1cHBvcnRlZCBvbiBzb2NrZXRcIl1dLFxuICBbLTQwNDgsIFtcIkVQRVJNXCIsIFwib3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWRcIl1dLFxuICBbLTQwNDcsIFtcIkVQSVBFXCIsIFwiYnJva2VuIHBpcGVcIl1dLFxuICBbLTQwNDYsIFtcIkVQUk9UT1wiLCBcInByb3RvY29sIGVycm9yXCJdXSxcbiAgWy00MDQ1LCBbXCJFUFJPVE9OT1NVUFBPUlRcIiwgXCJwcm90b2NvbCBub3Qgc3VwcG9ydGVkXCJdXSxcbiAgWy00MDQ0LCBbXCJFUFJPVE9UWVBFXCIsIFwicHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0XCJdXSxcbiAgWy00MDM0LCBbXCJFUkFOR0VcIiwgXCJyZXN1bHQgdG9vIGxhcmdlXCJdXSxcbiAgWy00MDQzLCBbXCJFUk9GU1wiLCBcInJlYWQtb25seSBmaWxlIHN5c3RlbVwiXV0sXG4gIFstNDA0MiwgW1wiRVNIVVRET1dOXCIsIFwiY2Fubm90IHNlbmQgYWZ0ZXIgdHJhbnNwb3J0IGVuZHBvaW50IHNodXRkb3duXCJdXSxcbiAgWy00MDQxLCBbXCJFU1BJUEVcIiwgXCJpbnZhbGlkIHNlZWtcIl1dLFxuICBbLTQwNDAsIFtcIkVTUkNIXCIsIFwibm8gc3VjaCBwcm9jZXNzXCJdXSxcbiAgWy00MDM5LCBbXCJFVElNRURPVVRcIiwgXCJjb25uZWN0aW9uIHRpbWVkIG91dFwiXV0sXG4gIFstNDAzOCwgW1wiRVRYVEJTWVwiLCBcInRleHQgZmlsZSBpcyBidXN5XCJdXSxcbiAgWy00MDM3LCBbXCJFWERFVlwiLCBcImNyb3NzLWRldmljZSBsaW5rIG5vdCBwZXJtaXR0ZWRcIl1dLFxuICBbLTQwOTQsIFtcIlVOS05PV05cIiwgXCJ1bmtub3duIGVycm9yXCJdXSxcbiAgWy00MDk1LCBbXCJFT0ZcIiwgXCJlbmQgb2YgZmlsZVwiXV0sXG4gIFstNDAzMywgW1wiRU5YSU9cIiwgXCJubyBzdWNoIGRldmljZSBvciBhZGRyZXNzXCJdXSxcbiAgWy00MDMyLCBbXCJFTUxJTktcIiwgXCJ0b28gbWFueSBsaW5rc1wiXV0sXG4gIFstNDAzMSwgW1wiRUhPU1RET1dOXCIsIFwiaG9zdCBpcyBkb3duXCJdXSxcbiAgWy00MDMwLCBbXCJFUkVNT1RFSU9cIiwgXCJyZW1vdGUgSS9PIGVycm9yXCJdXSxcbiAgWy00MDI5LCBbXCJFTk9UVFlcIiwgXCJpbmFwcHJvcHJpYXRlIGlvY3RsIGZvciBkZXZpY2VcIl1dLFxuICBbLTQwMjgsIFtcIkVGVFlQRVwiLCBcImluYXBwcm9wcmlhdGUgZmlsZSB0eXBlIG9yIGZvcm1hdFwiXV0sXG4gIFstNDAyNywgW1wiRUlMU0VRXCIsIFwiaWxsZWdhbCBieXRlIHNlcXVlbmNlXCJdXSxcbl07XG5cbmNvbnN0IGRhcndpbjogRXJyTWFwRGF0YSA9IFtcbiAgWy03LCBbXCJFMkJJR1wiLCBcImFyZ3VtZW50IGxpc3QgdG9vIGxvbmdcIl1dLFxuICBbLTEzLCBbXCJFQUNDRVNcIiwgXCJwZXJtaXNzaW9uIGRlbmllZFwiXV0sXG4gIFstNDgsIFtcIkVBRERSSU5VU0VcIiwgXCJhZGRyZXNzIGFscmVhZHkgaW4gdXNlXCJdXSxcbiAgWy00OSwgW1wiRUFERFJOT1RBVkFJTFwiLCBcImFkZHJlc3Mgbm90IGF2YWlsYWJsZVwiXV0sXG4gIFstNDcsIFtcIkVBRk5PU1VQUE9SVFwiLCBcImFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWRcIl1dLFxuICBbLTM1LCBbXCJFQUdBSU5cIiwgXCJyZXNvdXJjZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZVwiXV0sXG4gIFstMzAwMCwgW1wiRUFJX0FERFJGQU1JTFlcIiwgXCJhZGRyZXNzIGZhbWlseSBub3Qgc3VwcG9ydGVkXCJdXSxcbiAgWy0zMDAxLCBbXCJFQUlfQUdBSU5cIiwgXCJ0ZW1wb3JhcnkgZmFpbHVyZVwiXV0sXG4gIFstMzAwMiwgW1wiRUFJX0JBREZMQUdTXCIsIFwiYmFkIGFpX2ZsYWdzIHZhbHVlXCJdXSxcbiAgWy0zMDEzLCBbXCJFQUlfQkFESElOVFNcIiwgXCJpbnZhbGlkIHZhbHVlIGZvciBoaW50c1wiXV0sXG4gIFstMzAwMywgW1wiRUFJX0NBTkNFTEVEXCIsIFwicmVxdWVzdCBjYW5jZWxlZFwiXV0sXG4gIFstMzAwNCwgW1wiRUFJX0ZBSUxcIiwgXCJwZXJtYW5lbnQgZmFpbHVyZVwiXV0sXG4gIFstMzAwNSwgW1wiRUFJX0ZBTUlMWVwiLCBcImFpX2ZhbWlseSBub3Qgc3VwcG9ydGVkXCJdXSxcbiAgWy0zMDA2LCBbXCJFQUlfTUVNT1JZXCIsIFwib3V0IG9mIG1lbW9yeVwiXV0sXG4gIFstMzAwNywgW1wiRUFJX05PREFUQVwiLCBcIm5vIGFkZHJlc3NcIl1dLFxuICBbLTMwMDgsIFtcIkVBSV9OT05BTUVcIiwgXCJ1bmtub3duIG5vZGUgb3Igc2VydmljZVwiXV0sXG4gIFstMzAwOSwgW1wiRUFJX09WRVJGTE9XXCIsIFwiYXJndW1lbnQgYnVmZmVyIG92ZXJmbG93XCJdXSxcbiAgWy0zMDE0LCBbXCJFQUlfUFJPVE9DT0xcIiwgXCJyZXNvbHZlZCBwcm90b2NvbCBpcyB1bmtub3duXCJdXSxcbiAgWy0zMDEwLCBbXCJFQUlfU0VSVklDRVwiLCBcInNlcnZpY2Ugbm90IGF2YWlsYWJsZSBmb3Igc29ja2V0IHR5cGVcIl1dLFxuICBbLTMwMTEsIFtcIkVBSV9TT0NLVFlQRVwiLCBcInNvY2tldCB0eXBlIG5vdCBzdXBwb3J0ZWRcIl1dLFxuICBbLTM3LCBbXCJFQUxSRUFEWVwiLCBcImNvbm5lY3Rpb24gYWxyZWFkeSBpbiBwcm9ncmVzc1wiXV0sXG4gIFstOSwgW1wiRUJBREZcIiwgXCJiYWQgZmlsZSBkZXNjcmlwdG9yXCJdXSxcbiAgWy0xNiwgW1wiRUJVU1lcIiwgXCJyZXNvdXJjZSBidXN5IG9yIGxvY2tlZFwiXV0sXG4gIFstODksIFtcIkVDQU5DRUxFRFwiLCBcIm9wZXJhdGlvbiBjYW5jZWxlZFwiXV0sXG4gIFstNDA4MCwgW1wiRUNIQVJTRVRcIiwgXCJpbnZhbGlkIFVuaWNvZGUgY2hhcmFjdGVyXCJdXSxcbiAgWy01MywgW1wiRUNPTk5BQk9SVEVEXCIsIFwic29mdHdhcmUgY2F1c2VkIGNvbm5lY3Rpb24gYWJvcnRcIl1dLFxuICBbLTYxLCBbXCJFQ09OTlJFRlVTRURcIiwgXCJjb25uZWN0aW9uIHJlZnVzZWRcIl1dLFxuICBbLTU0LCBbXCJFQ09OTlJFU0VUXCIsIFwiY29ubmVjdGlvbiByZXNldCBieSBwZWVyXCJdXSxcbiAgWy0zOSwgW1wiRURFU1RBRERSUkVRXCIsIFwiZGVzdGluYXRpb24gYWRkcmVzcyByZXF1aXJlZFwiXV0sXG4gIFstMTcsIFtcIkVFWElTVFwiLCBcImZpbGUgYWxyZWFkeSBleGlzdHNcIl1dLFxuICBbLTE0LCBbXCJFRkFVTFRcIiwgXCJiYWQgYWRkcmVzcyBpbiBzeXN0ZW0gY2FsbCBhcmd1bWVudFwiXV0sXG4gIFstMjcsIFtcIkVGQklHXCIsIFwiZmlsZSB0b28gbGFyZ2VcIl1dLFxuICBbLTY1LCBbXCJFSE9TVFVOUkVBQ0hcIiwgXCJob3N0IGlzIHVucmVhY2hhYmxlXCJdXSxcbiAgWy00LCBbXCJFSU5UUlwiLCBcImludGVycnVwdGVkIHN5c3RlbSBjYWxsXCJdXSxcbiAgWy0yMiwgW1wiRUlOVkFMXCIsIFwiaW52YWxpZCBhcmd1bWVudFwiXV0sXG4gIFstNSwgW1wiRUlPXCIsIFwiaS9vIGVycm9yXCJdXSxcbiAgWy01NiwgW1wiRUlTQ09OTlwiLCBcInNvY2tldCBpcyBhbHJlYWR5IGNvbm5lY3RlZFwiXV0sXG4gIFstMjEsIFtcIkVJU0RJUlwiLCBcImlsbGVnYWwgb3BlcmF0aW9uIG9uIGEgZGlyZWN0b3J5XCJdXSxcbiAgWy02MiwgW1wiRUxPT1BcIiwgXCJ0b28gbWFueSBzeW1ib2xpYyBsaW5rcyBlbmNvdW50ZXJlZFwiXV0sXG4gIFstMjQsIFtcIkVNRklMRVwiLCBcInRvbyBtYW55IG9wZW4gZmlsZXNcIl1dLFxuICBbLTQwLCBbXCJFTVNHU0laRVwiLCBcIm1lc3NhZ2UgdG9vIGxvbmdcIl1dLFxuICBbLTYzLCBbXCJFTkFNRVRPT0xPTkdcIiwgXCJuYW1lIHRvbyBsb25nXCJdXSxcbiAgWy01MCwgW1wiRU5FVERPV05cIiwgXCJuZXR3b3JrIGlzIGRvd25cIl1dLFxuICBbLTUxLCBbXCJFTkVUVU5SRUFDSFwiLCBcIm5ldHdvcmsgaXMgdW5yZWFjaGFibGVcIl1dLFxuICBbLTIzLCBbXCJFTkZJTEVcIiwgXCJmaWxlIHRhYmxlIG92ZXJmbG93XCJdXSxcbiAgWy01NSwgW1wiRU5PQlVGU1wiLCBcIm5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGVcIl1dLFxuICBbLTE5LCBbXCJFTk9ERVZcIiwgXCJubyBzdWNoIGRldmljZVwiXV0sXG4gIFstMiwgW1wiRU5PRU5UXCIsIFwibm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeVwiXV0sXG4gIFstMTIsIFtcIkVOT01FTVwiLCBcIm5vdCBlbm91Z2ggbWVtb3J5XCJdXSxcbiAgWy00MDU2LCBbXCJFTk9ORVRcIiwgXCJtYWNoaW5lIGlzIG5vdCBvbiB0aGUgbmV0d29ya1wiXV0sXG4gIFstNDIsIFtcIkVOT1BST1RPT1BUXCIsIFwicHJvdG9jb2wgbm90IGF2YWlsYWJsZVwiXV0sXG4gIFstMjgsIFtcIkVOT1NQQ1wiLCBcIm5vIHNwYWNlIGxlZnQgb24gZGV2aWNlXCJdXSxcbiAgWy03OCwgW1wiRU5PU1lTXCIsIFwiZnVuY3Rpb24gbm90IGltcGxlbWVudGVkXCJdXSxcbiAgWy01NywgW1wiRU5PVENPTk5cIiwgXCJzb2NrZXQgaXMgbm90IGNvbm5lY3RlZFwiXV0sXG4gIFstMjAsIFtcIkVOT1RESVJcIiwgXCJub3QgYSBkaXJlY3RvcnlcIl1dLFxuICBbLTY2LCBbXCJFTk9URU1QVFlcIiwgXCJkaXJlY3Rvcnkgbm90IGVtcHR5XCJdXSxcbiAgWy0zOCwgW1wiRU5PVFNPQ0tcIiwgXCJzb2NrZXQgb3BlcmF0aW9uIG9uIG5vbi1zb2NrZXRcIl1dLFxuICBbLTQ1LCBbXCJFTk9UU1VQXCIsIFwib3BlcmF0aW9uIG5vdCBzdXBwb3J0ZWQgb24gc29ja2V0XCJdXSxcbiAgWy0xLCBbXCJFUEVSTVwiLCBcIm9wZXJhdGlvbiBub3QgcGVybWl0dGVkXCJdXSxcbiAgWy0zMiwgW1wiRVBJUEVcIiwgXCJicm9rZW4gcGlwZVwiXV0sXG4gIFstMTAwLCBbXCJFUFJPVE9cIiwgXCJwcm90b2NvbCBlcnJvclwiXV0sXG4gIFstNDMsIFtcIkVQUk9UT05PU1VQUE9SVFwiLCBcInByb3RvY29sIG5vdCBzdXBwb3J0ZWRcIl1dLFxuICBbLTQxLCBbXCJFUFJPVE9UWVBFXCIsIFwicHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0XCJdXSxcbiAgWy0zNCwgW1wiRVJBTkdFXCIsIFwicmVzdWx0IHRvbyBsYXJnZVwiXV0sXG4gIFstMzAsIFtcIkVST0ZTXCIsIFwicmVhZC1vbmx5IGZpbGUgc3lzdGVtXCJdXSxcbiAgWy01OCwgW1wiRVNIVVRET1dOXCIsIFwiY2Fubm90IHNlbmQgYWZ0ZXIgdHJhbnNwb3J0IGVuZHBvaW50IHNodXRkb3duXCJdXSxcbiAgWy0yOSwgW1wiRVNQSVBFXCIsIFwiaW52YWxpZCBzZWVrXCJdXSxcbiAgWy0zLCBbXCJFU1JDSFwiLCBcIm5vIHN1Y2ggcHJvY2Vzc1wiXV0sXG4gIFstNjAsIFtcIkVUSU1FRE9VVFwiLCBcImNvbm5lY3Rpb24gdGltZWQgb3V0XCJdXSxcbiAgWy0yNiwgW1wiRVRYVEJTWVwiLCBcInRleHQgZmlsZSBpcyBidXN5XCJdXSxcbiAgWy0xOCwgW1wiRVhERVZcIiwgXCJjcm9zcy1kZXZpY2UgbGluayBub3QgcGVybWl0dGVkXCJdXSxcbiAgWy00MDk0LCBbXCJVTktOT1dOXCIsIFwidW5rbm93biBlcnJvclwiXV0sXG4gIFstNDA5NSwgW1wiRU9GXCIsIFwiZW5kIG9mIGZpbGVcIl1dLFxuICBbLTYsIFtcIkVOWElPXCIsIFwibm8gc3VjaCBkZXZpY2Ugb3IgYWRkcmVzc1wiXV0sXG4gIFstMzEsIFtcIkVNTElOS1wiLCBcInRvbyBtYW55IGxpbmtzXCJdXSxcbiAgWy02NCwgW1wiRUhPU1RET1dOXCIsIFwiaG9zdCBpcyBkb3duXCJdXSxcbiAgWy00MDMwLCBbXCJFUkVNT1RFSU9cIiwgXCJyZW1vdGUgSS9PIGVycm9yXCJdXSxcbiAgWy0yNSwgW1wiRU5PVFRZXCIsIFwiaW5hcHByb3ByaWF0ZSBpb2N0bCBmb3IgZGV2aWNlXCJdXSxcbiAgWy03OSwgW1wiRUZUWVBFXCIsIFwiaW5hcHByb3ByaWF0ZSBmaWxlIHR5cGUgb3IgZm9ybWF0XCJdXSxcbiAgWy05MiwgW1wiRUlMU0VRXCIsIFwiaWxsZWdhbCBieXRlIHNlcXVlbmNlXCJdXSxcbl07XG5cbmNvbnN0IGxpbnV4OiBFcnJNYXBEYXRhID0gW1xuICBbLTcsIFtcIkUyQklHXCIsIFwiYXJndW1lbnQgbGlzdCB0b28gbG9uZ1wiXV0sXG4gIFstMTMsIFtcIkVBQ0NFU1wiLCBcInBlcm1pc3Npb24gZGVuaWVkXCJdXSxcbiAgWy05OCwgW1wiRUFERFJJTlVTRVwiLCBcImFkZHJlc3MgYWxyZWFkeSBpbiB1c2VcIl1dLFxuICBbLTk5LCBbXCJFQUREUk5PVEFWQUlMXCIsIFwiYWRkcmVzcyBub3QgYXZhaWxhYmxlXCJdXSxcbiAgWy05NywgW1wiRUFGTk9TVVBQT1JUXCIsIFwiYWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZFwiXV0sXG4gIFstMTEsIFtcIkVBR0FJTlwiLCBcInJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlXCJdXSxcbiAgWy0zMDAwLCBbXCJFQUlfQUREUkZBTUlMWVwiLCBcImFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWRcIl1dLFxuICBbLTMwMDEsIFtcIkVBSV9BR0FJTlwiLCBcInRlbXBvcmFyeSBmYWlsdXJlXCJdXSxcbiAgWy0zMDAyLCBbXCJFQUlfQkFERkxBR1NcIiwgXCJiYWQgYWlfZmxhZ3MgdmFsdWVcIl1dLFxuICBbLTMwMTMsIFtcIkVBSV9CQURISU5UU1wiLCBcImludmFsaWQgdmFsdWUgZm9yIGhpbnRzXCJdXSxcbiAgWy0zMDAzLCBbXCJFQUlfQ0FOQ0VMRURcIiwgXCJyZXF1ZXN0IGNhbmNlbGVkXCJdXSxcbiAgWy0zMDA0LCBbXCJFQUlfRkFJTFwiLCBcInBlcm1hbmVudCBmYWlsdXJlXCJdXSxcbiAgWy0zMDA1LCBbXCJFQUlfRkFNSUxZXCIsIFwiYWlfZmFtaWx5IG5vdCBzdXBwb3J0ZWRcIl1dLFxuICBbLTMwMDYsIFtcIkVBSV9NRU1PUllcIiwgXCJvdXQgb2YgbWVtb3J5XCJdXSxcbiAgWy0zMDA3LCBbXCJFQUlfTk9EQVRBXCIsIFwibm8gYWRkcmVzc1wiXV0sXG4gIFstMzAwOCwgW1wiRUFJX05PTkFNRVwiLCBcInVua25vd24gbm9kZSBvciBzZXJ2aWNlXCJdXSxcbiAgWy0zMDA5LCBbXCJFQUlfT1ZFUkZMT1dcIiwgXCJhcmd1bWVudCBidWZmZXIgb3ZlcmZsb3dcIl1dLFxuICBbLTMwMTQsIFtcIkVBSV9QUk9UT0NPTFwiLCBcInJlc29sdmVkIHByb3RvY29sIGlzIHVua25vd25cIl1dLFxuICBbLTMwMTAsIFtcIkVBSV9TRVJWSUNFXCIsIFwic2VydmljZSBub3QgYXZhaWxhYmxlIGZvciBzb2NrZXQgdHlwZVwiXV0sXG4gIFstMzAxMSwgW1wiRUFJX1NPQ0tUWVBFXCIsIFwic29ja2V0IHR5cGUgbm90IHN1cHBvcnRlZFwiXV0sXG4gIFstMTE0LCBbXCJFQUxSRUFEWVwiLCBcImNvbm5lY3Rpb24gYWxyZWFkeSBpbiBwcm9ncmVzc1wiXV0sXG4gIFstOSwgW1wiRUJBREZcIiwgXCJiYWQgZmlsZSBkZXNjcmlwdG9yXCJdXSxcbiAgWy0xNiwgW1wiRUJVU1lcIiwgXCJyZXNvdXJjZSBidXN5IG9yIGxvY2tlZFwiXV0sXG4gIFstMTI1LCBbXCJFQ0FOQ0VMRURcIiwgXCJvcGVyYXRpb24gY2FuY2VsZWRcIl1dLFxuICBbLTQwODAsIFtcIkVDSEFSU0VUXCIsIFwiaW52YWxpZCBVbmljb2RlIGNoYXJhY3RlclwiXV0sXG4gIFstMTAzLCBbXCJFQ09OTkFCT1JURURcIiwgXCJzb2Z0d2FyZSBjYXVzZWQgY29ubmVjdGlvbiBhYm9ydFwiXV0sXG4gIFstMTExLCBbXCJFQ09OTlJFRlVTRURcIiwgXCJjb25uZWN0aW9uIHJlZnVzZWRcIl1dLFxuICBbLTEwNCwgW1wiRUNPTk5SRVNFVFwiLCBcImNvbm5lY3Rpb24gcmVzZXQgYnkgcGVlclwiXV0sXG4gIFstODksIFtcIkVERVNUQUREUlJFUVwiLCBcImRlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWRcIl1dLFxuICBbLTE3LCBbXCJFRVhJU1RcIiwgXCJmaWxlIGFscmVhZHkgZXhpc3RzXCJdXSxcbiAgWy0xNCwgW1wiRUZBVUxUXCIsIFwiYmFkIGFkZHJlc3MgaW4gc3lzdGVtIGNhbGwgYXJndW1lbnRcIl1dLFxuICBbLTI3LCBbXCJFRkJJR1wiLCBcImZpbGUgdG9vIGxhcmdlXCJdXSxcbiAgWy0xMTMsIFtcIkVIT1NUVU5SRUFDSFwiLCBcImhvc3QgaXMgdW5yZWFjaGFibGVcIl1dLFxuICBbLTQsIFtcIkVJTlRSXCIsIFwiaW50ZXJydXB0ZWQgc3lzdGVtIGNhbGxcIl1dLFxuICBbLTIyLCBbXCJFSU5WQUxcIiwgXCJpbnZhbGlkIGFyZ3VtZW50XCJdXSxcbiAgWy01LCBbXCJFSU9cIiwgXCJpL28gZXJyb3JcIl1dLFxuICBbLTEwNiwgW1wiRUlTQ09OTlwiLCBcInNvY2tldCBpcyBhbHJlYWR5IGNvbm5lY3RlZFwiXV0sXG4gIFstMjEsIFtcIkVJU0RJUlwiLCBcImlsbGVnYWwgb3BlcmF0aW9uIG9uIGEgZGlyZWN0b3J5XCJdXSxcbiAgWy00MCwgW1wiRUxPT1BcIiwgXCJ0b28gbWFueSBzeW1ib2xpYyBsaW5rcyBlbmNvdW50ZXJlZFwiXV0sXG4gIFstMjQsIFtcIkVNRklMRVwiLCBcInRvbyBtYW55IG9wZW4gZmlsZXNcIl1dLFxuICBbLTkwLCBbXCJFTVNHU0laRVwiLCBcIm1lc3NhZ2UgdG9vIGxvbmdcIl1dLFxuICBbLTM2LCBbXCJFTkFNRVRPT0xPTkdcIiwgXCJuYW1lIHRvbyBsb25nXCJdXSxcbiAgWy0xMDAsIFtcIkVORVRET1dOXCIsIFwibmV0d29yayBpcyBkb3duXCJdXSxcbiAgWy0xMDEsIFtcIkVORVRVTlJFQUNIXCIsIFwibmV0d29yayBpcyB1bnJlYWNoYWJsZVwiXV0sXG4gIFstMjMsIFtcIkVORklMRVwiLCBcImZpbGUgdGFibGUgb3ZlcmZsb3dcIl1dLFxuICBbLTEwNSwgW1wiRU5PQlVGU1wiLCBcIm5vIGJ1ZmZlciBzcGFjZSBhdmFpbGFibGVcIl1dLFxuICBbLTE5LCBbXCJFTk9ERVZcIiwgXCJubyBzdWNoIGRldmljZVwiXV0sXG4gIFstMiwgW1wiRU5PRU5UXCIsIFwibm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeVwiXV0sXG4gIFstMTIsIFtcIkVOT01FTVwiLCBcIm5vdCBlbm91Z2ggbWVtb3J5XCJdXSxcbiAgWy02NCwgW1wiRU5PTkVUXCIsIFwibWFjaGluZSBpcyBub3Qgb24gdGhlIG5ldHdvcmtcIl1dLFxuICBbLTkyLCBbXCJFTk9QUk9UT09QVFwiLCBcInByb3RvY29sIG5vdCBhdmFpbGFibGVcIl1dLFxuICBbLTI4LCBbXCJFTk9TUENcIiwgXCJubyBzcGFjZSBsZWZ0IG9uIGRldmljZVwiXV0sXG4gIFstMzgsIFtcIkVOT1NZU1wiLCBcImZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZFwiXV0sXG4gIFstMTA3LCBbXCJFTk9UQ09OTlwiLCBcInNvY2tldCBpcyBub3QgY29ubmVjdGVkXCJdXSxcbiAgWy0yMCwgW1wiRU5PVERJUlwiLCBcIm5vdCBhIGRpcmVjdG9yeVwiXV0sXG4gIFstMzksIFtcIkVOT1RFTVBUWVwiLCBcImRpcmVjdG9yeSBub3QgZW1wdHlcIl1dLFxuICBbLTg4LCBbXCJFTk9UU09DS1wiLCBcInNvY2tldCBvcGVyYXRpb24gb24gbm9uLXNvY2tldFwiXV0sXG4gIFstOTUsIFtcIkVOT1RTVVBcIiwgXCJvcGVyYXRpb24gbm90IHN1cHBvcnRlZCBvbiBzb2NrZXRcIl1dLFxuICBbLTEsIFtcIkVQRVJNXCIsIFwib3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWRcIl1dLFxuICBbLTMyLCBbXCJFUElQRVwiLCBcImJyb2tlbiBwaXBlXCJdXSxcbiAgWy03MSwgW1wiRVBST1RPXCIsIFwicHJvdG9jb2wgZXJyb3JcIl1dLFxuICBbLTkzLCBbXCJFUFJPVE9OT1NVUFBPUlRcIiwgXCJwcm90b2NvbCBub3Qgc3VwcG9ydGVkXCJdXSxcbiAgWy05MSwgW1wiRVBST1RPVFlQRVwiLCBcInByb3RvY29sIHdyb25nIHR5cGUgZm9yIHNvY2tldFwiXV0sXG4gIFstMzQsIFtcIkVSQU5HRVwiLCBcInJlc3VsdCB0b28gbGFyZ2VcIl1dLFxuICBbLTMwLCBbXCJFUk9GU1wiLCBcInJlYWQtb25seSBmaWxlIHN5c3RlbVwiXV0sXG4gIFstMTA4LCBbXCJFU0hVVERPV05cIiwgXCJjYW5ub3Qgc2VuZCBhZnRlciB0cmFuc3BvcnQgZW5kcG9pbnQgc2h1dGRvd25cIl1dLFxuICBbLTI5LCBbXCJFU1BJUEVcIiwgXCJpbnZhbGlkIHNlZWtcIl1dLFxuICBbLTMsIFtcIkVTUkNIXCIsIFwibm8gc3VjaCBwcm9jZXNzXCJdXSxcbiAgWy0xMTAsIFtcIkVUSU1FRE9VVFwiLCBcImNvbm5lY3Rpb24gdGltZWQgb3V0XCJdXSxcbiAgWy0yNiwgW1wiRVRYVEJTWVwiLCBcInRleHQgZmlsZSBpcyBidXN5XCJdXSxcbiAgWy0xOCwgW1wiRVhERVZcIiwgXCJjcm9zcy1kZXZpY2UgbGluayBub3QgcGVybWl0dGVkXCJdXSxcbiAgWy00MDk0LCBbXCJVTktOT1dOXCIsIFwidW5rbm93biBlcnJvclwiXV0sXG4gIFstNDA5NSwgW1wiRU9GXCIsIFwiZW5kIG9mIGZpbGVcIl1dLFxuICBbLTYsIFtcIkVOWElPXCIsIFwibm8gc3VjaCBkZXZpY2Ugb3IgYWRkcmVzc1wiXV0sXG4gIFstMzEsIFtcIkVNTElOS1wiLCBcInRvbyBtYW55IGxpbmtzXCJdXSxcbiAgWy0xMTIsIFtcIkVIT1NURE9XTlwiLCBcImhvc3QgaXMgZG93blwiXV0sXG4gIFstMTIxLCBbXCJFUkVNT1RFSU9cIiwgXCJyZW1vdGUgSS9PIGVycm9yXCJdXSxcbiAgWy0yNSwgW1wiRU5PVFRZXCIsIFwiaW5hcHByb3ByaWF0ZSBpb2N0bCBmb3IgZGV2aWNlXCJdXSxcbiAgWy00MDI4LCBbXCJFRlRZUEVcIiwgXCJpbmFwcHJvcHJpYXRlIGZpbGUgdHlwZSBvciBmb3JtYXRcIl1dLFxuICBbLTg0LCBbXCJFSUxTRVFcIiwgXCJpbGxlZ2FsIGJ5dGUgc2VxdWVuY2VcIl1dLFxuXTtcblxuY29uc3QgeyBvcyB9ID0gRGVuby5idWlsZDtcbmV4cG9ydCBjb25zdCBlcnJvck1hcCA9IG5ldyBNYXA8bnVtYmVyLCBbc3RyaW5nLCBzdHJpbmddPihcbiAgb3MgPT09IFwid2luZG93c1wiXG4gICAgPyB3aW5kb3dzXG4gICAgOiBvcyA9PT0gXCJkYXJ3aW5cIlxuICAgID8gZGFyd2luXG4gICAgOiBvcyA9PT0gXCJsaW51eFwiXG4gICAgPyBsaW51eFxuICAgIDogdW5yZWFjaGFibGUoKSxcbik7XG5leHBvcnQgY2xhc3MgRVJSX0VOQ09ESU5HX05PVF9TVVBQT1JURUQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRU5DT0RJTkdfTk9UX1NVUFBPUlRFRFwiLFxuICAgICAgYFRoZSBcIiR7eH1cIiBlbmNvZGluZyBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0VWQUxfRVNNX0NBTk5PVF9QUklOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRVZBTF9FU01fQ0FOTk9UX1BSSU5UXCIsXG4gICAgICBgLS1wcmludCBjYW5ub3QgYmUgdXNlZCB3aXRoIEVTTSBpbnB1dGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9FVkVOVF9SRUNVUlNJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0VWRU5UX1JFQ1VSU0lPTlwiLFxuICAgICAgYFRoZSBldmVudCBcIiR7eH1cIiBpcyBhbHJlYWR5IGJlaW5nIGRpc3BhdGNoZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRkVBVFVSRV9VTkFWQUlMQUJMRV9PTl9QTEFURk9STSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ZFQVRVUkVfVU5BVkFJTEFCTEVfT05fUExBVEZPUk1cIixcbiAgICAgIGBUaGUgZmVhdHVyZSAke3h9IGlzIHVuYXZhaWxhYmxlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLCB3aGljaCBpcyBiZWluZyB1c2VkIHRvIHJ1biBOb2RlLmpzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFXCIsXG4gICAgICBgRmlsZSBzaXplICgke3h9KSBpcyBncmVhdGVyIHRoYW4gMiBHQmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9GU19JTlZBTElEX1NZTUxJTktfVFlQRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRlNfSU5WQUxJRF9TWU1MSU5LX1RZUEVcIixcbiAgICAgIGBTeW1saW5rIHR5cGUgbXVzdCBiZSBvbmUgb2YgXCJkaXJcIiwgXCJmaWxlXCIsIG9yIFwianVuY3Rpb25cIi4gUmVjZWl2ZWQgXCIke3h9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfQUxUU1ZDX0lOVkFMSURfT1JJR0lOIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfQUxUU1ZDX0lOVkFMSURfT1JJR0lOXCIsXG4gICAgICBgSFRUUC8yIEFMVFNWQyBmcmFtZXMgcmVxdWlyZSBhIHZhbGlkIG9yaWdpbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9BTFRTVkNfTEVOR1RIIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfQUxUU1ZDX0xFTkdUSFwiLFxuICAgICAgYEhUVFAvMiBBTFRTVkMgZnJhbWVzIGFyZSBsaW1pdGVkIHRvIDE2MzgyIGJ5dGVzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0NPTk5FQ1RfQVVUSE9SSVRZIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9DT05ORUNUX0FVVEhPUklUWVwiLFxuICAgICAgYDphdXRob3JpdHkgaGVhZGVyIGlzIHJlcXVpcmVkIGZvciBDT05ORUNUIHJlcXVlc3RzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0NPTk5FQ1RfUEFUSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfQ09OTkVDVF9QQVRIXCIsXG4gICAgICBgVGhlIDpwYXRoIGhlYWRlciBpcyBmb3JiaWRkZW4gZm9yIENPTk5FQ1QgcmVxdWVzdHNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfQ09OTkVDVF9TQ0hFTUUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0NPTk5FQ1RfU0NIRU1FXCIsXG4gICAgICBgVGhlIDpzY2hlbWUgaGVhZGVyIGlzIGZvcmJpZGRlbiBmb3IgQ09OTkVDVCByZXF1ZXN0c2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9HT0FXQVlfU0VTU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfR09BV0FZX1NFU1NJT05cIixcbiAgICAgIGBOZXcgc3RyZWFtcyBjYW5ub3QgYmUgY3JlYXRlZCBhZnRlciByZWNlaXZpbmcgYSBHT0FXQVlgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSEVBREVSU19BRlRFUl9SRVNQT05EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9IRUFERVJTX0FGVEVSX1JFU1BPTkRcIixcbiAgICAgIGBDYW5ub3Qgc3BlY2lmeSBhZGRpdGlvbmFsIGhlYWRlcnMgYWZ0ZXIgcmVzcG9uc2UgaW5pdGlhdGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUlNfU0VOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSEVBREVSU19TRU5UXCIsXG4gICAgICBgUmVzcG9uc2UgaGFzIGFscmVhZHkgYmVlbiBpbml0aWF0ZWQuYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUl9TSU5HTEVfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9IRUFERVJfU0lOR0xFX1ZBTFVFXCIsXG4gICAgICBgSGVhZGVyIGZpZWxkIFwiJHt4fVwiIG11c3Qgb25seSBoYXZlIGEgc2luZ2xlIHZhbHVlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEXCIsXG4gICAgICBgSW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZXMgY2Fubm90IGJlIHVzZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9DT05ORUNUSU9OX0hFQURFUlMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX0NPTk5FQ1RJT05fSEVBREVSU1wiLFxuICAgICAgYEhUVFAvMSBDb25uZWN0aW9uIHNwZWNpZmljIGhlYWRlcnMgYXJlIGZvcmJpZGRlbjogXCIke3h9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9IRUFERVJfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfSEVBREVSX1ZBTFVFXCIsXG4gICAgICBgSW52YWxpZCB2YWx1ZSBcIiR7eH1cIiBmb3IgaGVhZGVyIFwiJHt5fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfSU5GT19TVEFUVVMgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9JTkZPX1NUQVRVU1wiLFxuICAgICAgYEludmFsaWQgaW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZTogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX09SSUdJTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfT1JJR0lOXCIsXG4gICAgICBgSFRUUC8yIE9SSUdJTiBmcmFtZXMgcmVxdWlyZSBhIHZhbGlkIG9yaWdpbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX1BBQ0tFRF9TRVRUSU5HU19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QQUNLRURfU0VUVElOR1NfTEVOR1RIXCIsXG4gICAgICBgUGFja2VkIHNldHRpbmdzIGxlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2Ygc2l4YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfUFNFVURPSEVBREVSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QU0VVRE9IRUFERVJcIixcbiAgICAgIGBcIiR7eH1cIiBpcyBhbiBpbnZhbGlkIHBzZXVkb2hlYWRlciBvciBpcyB1c2VkIGluY29ycmVjdGx5YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9TRVNTSU9OXCIsXG4gICAgICBgVGhlIHNlc3Npb24gaGFzIGJlZW4gZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfU1RSRUFNIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX1NUUkVBTVwiLFxuICAgICAgYFRoZSBzdHJlYW0gaGFzIGJlZW4gZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX01BWF9QRU5ESU5HX1NFVFRJTkdTX0FDSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfTUFYX1BFTkRJTkdfU0VUVElOR1NfQUNLXCIsXG4gICAgICBgTWF4aW11bSBudW1iZXIgb2YgcGVuZGluZyBzZXR0aW5ncyBhY2tub3dsZWRnZW1lbnRzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX05FU1RFRF9QVVNIIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9ORVNURURfUFVTSFwiLFxuICAgICAgYEEgcHVzaCBzdHJlYW0gY2Fubm90IGluaXRpYXRlIGFub3RoZXIgcHVzaCBzdHJlYW0uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX05PX1NPQ0tFVF9NQU5JUFVMQVRJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX05PX1NPQ0tFVF9NQU5JUFVMQVRJT05cIixcbiAgICAgIGBIVFRQLzIgc29ja2V0cyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IG1hbmlwdWxhdGVkIChlLmcuIHJlYWQgYW5kIHdyaXR0ZW4pYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX09SSUdJTl9MRU5HVEggZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9PUklHSU5fTEVOR1RIXCIsXG4gICAgICBgSFRUUC8yIE9SSUdJTiBmcmFtZXMgYXJlIGxpbWl0ZWQgdG8gMTYzODIgYnl0ZXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfT1VUX09GX1NUUkVBTVMgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX09VVF9PRl9TVFJFQU1TXCIsXG4gICAgICBgTm8gc3RyZWFtIElEIGlzIGF2YWlsYWJsZSBiZWNhdXNlIG1heGltdW0gc3RyZWFtIElEIGhhcyBiZWVuIHJlYWNoZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUEFZTE9BRF9GT1JCSURERU4gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1BBWUxPQURfRk9SQklEREVOXCIsXG4gICAgICBgUmVzcG9uc2VzIHdpdGggJHt4fSBzdGF0dXMgbXVzdCBub3QgaGF2ZSBhIHBheWxvYWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUElOR19DQU5DRUwgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1BJTkdfQ0FOQ0VMXCIsXG4gICAgICBgSFRUUDIgcGluZyBjYW5jZWxsZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUElOR19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfUElOR19MRU5HVEhcIixcbiAgICAgIGBIVFRQMiBwaW5nIHBheWxvYWQgbXVzdCBiZSA4IGJ5dGVzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BTRVVET0hFQURFUl9OT1RfQUxMT1dFRCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1BTRVVET0hFQURFUl9OT1RfQUxMT1dFRFwiLFxuICAgICAgYENhbm5vdCBzZXQgSFRUUC8yIHBzZXVkby1oZWFkZXJzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BVU0hfRElTQUJMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1BVU0hfRElTQUJMRURcIixcbiAgICAgIGBIVFRQLzIgY2xpZW50IGhhcyBkaXNhYmxlZCBwdXNoIHN0cmVhbXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VORF9GSUxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TRU5EX0ZJTEVcIixcbiAgICAgIGBEaXJlY3RvcmllcyBjYW5ub3QgYmUgc2VudGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLXCIsXG4gICAgICBgT2Zmc2V0IG9yIGxlbmd0aCBjYW4gb25seSBiZSBzcGVjaWZpZWQgZm9yIHJlZ3VsYXIgZmlsZXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VTU0lPTl9FUlJPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfU0VTU0lPTl9FUlJPUlwiLFxuICAgICAgYFNlc3Npb24gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NFVFRJTkdTX0NBTkNFTCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMXCIsXG4gICAgICBgSFRUUDIgc2Vzc2lvbiBzZXR0aW5ncyBjYW5jZWxlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TT0NLRVRfQk9VTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1NPQ0tFVF9CT1VORFwiLFxuICAgICAgYFRoZSBzb2NrZXQgaXMgYWxyZWFkeSBib3VuZCB0byBhbiBIdHRwMlNlc3Npb25gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU09DS0VUX1VOQk9VTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1NPQ0tFVF9VTkJPVU5EXCIsXG4gICAgICBgVGhlIHNvY2tldCBoYXMgYmVlbiBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgSHR0cDJTZXNzaW9uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NUQVRVU18xMDEgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1NUQVRVU18xMDFcIixcbiAgICAgIGBIVFRQIHN0YXR1cyBjb2RlIDEwMSAoU3dpdGNoaW5nIFByb3RvY29scykgaXMgZm9yYmlkZGVuIGluIEhUVFAvMmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TVEFUVVNfSU5WQUxJRCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVEFUVVNfSU5WQUxJRFwiLFxuICAgICAgYEludmFsaWQgc3RhdHVzIGNvZGU6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RSRUFNX0VSUk9SIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVFJFQU1fRVJST1JcIixcbiAgICAgIGBTdHJlYW0gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NUUkVBTV9TRUxGX0RFUEVOREVOQ1kgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1NUUkVBTV9TRUxGX0RFUEVOREVOQ1lcIixcbiAgICAgIGBBIHN0cmVhbSBjYW5ub3QgZGVwZW5kIG9uIGl0c2VsZmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9UUkFJTEVSU19BTFJFQURZX1NFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1RSQUlMRVJTX0FMUkVBRFlfU0VOVFwiLFxuICAgICAgYFRyYWlsaW5nIGhlYWRlcnMgaGF2ZSBhbHJlYWR5IGJlZW4gc2VudGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9UUkFJTEVSU19OT1RfUkVBRFkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1RSQUlMRVJTX05PVF9SRUFEWVwiLFxuICAgICAgYFRyYWlsaW5nIGhlYWRlcnMgY2Fubm90IGJlIHNlbnQgdW50aWwgYWZ0ZXIgdGhlIHdhbnRUcmFpbGVycyBldmVudCBpcyBlbWl0dGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1VOU1VQUE9SVEVEX1BST1RPQ09MIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9VTlNVUFBPUlRFRF9QUk9UT0NPTFwiLFxuICAgICAgYHByb3RvY29sIFwiJHt4fVwiIGlzIHVuc3VwcG9ydGVkLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX0hFQURFUlNfU0VOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9IRUFERVJTX1NFTlRcIixcbiAgICAgIGBDYW5ub3QgJHt4fSBoZWFkZXJzIGFmdGVyIHRoZXkgYXJlIHNlbnQgdG8gdGhlIGNsaWVudGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX0lOVkFMSURfSEVBREVSX1ZBTFVFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQX0lOVkFMSURfSEVBREVSX1ZBTFVFXCIsXG4gICAgICBgSW52YWxpZCB2YWx1ZSBcIiR7eH1cIiBmb3IgaGVhZGVyIFwiJHt5fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFBfSU5WQUxJRF9TVEFUVVNfQ09ERSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQX0lOVkFMSURfU1RBVFVTX0NPREVcIixcbiAgICAgIGBJbnZhbGlkIHN0YXR1cyBjb2RlOiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFBfU09DS0VUX0VOQ09ESU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQX1NPQ0tFVF9FTkNPRElOR1wiLFxuICAgICAgYENoYW5naW5nIHRoZSBzb2NrZXQgZW5jb2RpbmcgaXMgbm90IGFsbG93ZWQgcGVyIFJGQzcyMzAgU2VjdGlvbiAzLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX1RSQUlMRVJfSU5WQUxJRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9UUkFJTEVSX0lOVkFMSURcIixcbiAgICAgIGBUcmFpbGVycyBhcmUgaW52YWxpZCB3aXRoIHRoaXMgdHJhbnNmZXIgZW5jb2RpbmdgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5DT01QQVRJQkxFX09QVElPTl9QQUlSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTkNPTVBBVElCTEVfT1BUSU9OX1BBSVJcIixcbiAgICAgIGBPcHRpb24gXCIke3h9XCIgY2Fubm90IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvcHRpb24gXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRFwiLFxuICAgICAgYC0taW5wdXQtdHlwZSBjYW4gb25seSBiZSB1c2VkIHdpdGggc3RyaW5nIGlucHV0IHZpYSAtLWV2YWwsIC0tcHJpbnQsIG9yIFNURElOYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9BTFJFQURZX0FDVElWQVRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5TUEVDVE9SX0FMUkVBRFlfQUNUSVZBVEVEXCIsXG4gICAgICBgSW5zcGVjdG9yIGlzIGFscmVhZHkgYWN0aXZhdGVkLiBDbG9zZSBpdCB3aXRoIGluc3BlY3Rvci5jbG9zZSgpIGJlZm9yZSBhY3RpdmF0aW5nIGl0IGFnYWluLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOU1BFQ1RPUl9BTFJFQURZX0NPTk5FQ1RFRFwiLFxuICAgICAgYCR7eH0gaXMgYWxyZWFkeSBjb25uZWN0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5TUEVDVE9SX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5TUEVDVE9SX0NMT1NFRFwiLFxuICAgICAgYFNlc3Npb24gd2FzIGNsb3NlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQ09NTUFORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlNQRUNUT1JfQ09NTUFORFwiLFxuICAgICAgYEluc3BlY3RvciBlcnJvciAke3h9OiAke3l9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9OT1RfQUNUSVZFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlNQRUNUT1JfTk9UX0FDVElWRVwiLFxuICAgICAgYEluc3BlY3RvciBpcyBub3QgYWN0aXZlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9OT1RfQVZBSUxBQkxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlNQRUNUT1JfTk9UX0FWQUlMQUJMRVwiLFxuICAgICAgYEluc3BlY3RvciBpcyBub3QgYXZhaWxhYmxlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9OT1RfQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlNQRUNUT1JfTk9UX0NPTk5FQ1RFRFwiLFxuICAgICAgYFNlc3Npb24gaXMgbm90IGNvbm5lY3RlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfTk9UX1dPUktFUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5TUEVDVE9SX05PVF9XT1JLRVJcIixcbiAgICAgIGBDdXJyZW50IHRocmVhZCBpcyBub3QgYSB3b3JrZXJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9BU1lOQ19JRCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfQVNZTkNfSURcIixcbiAgICAgIGBJbnZhbGlkICR7eH0gdmFsdWU6ICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9CVUZGRVJfU0laRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0JVRkZFUl9TSVpFXCIsXG4gICAgICBgQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9DQUxMQkFDSyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvYmplY3Q6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfQ0FMTEJBQ0tcIixcbiAgICAgIGBDYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkob2JqZWN0KX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9DVVJTT1JfUE9TIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9DVVJTT1JfUE9TXCIsXG4gICAgICBgQ2Fubm90IHNldCBjdXJzb3Igcm93IHdpdGhvdXQgc2V0dGluZyBpdHMgY29sdW1uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRkQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9GRFwiLFxuICAgICAgYFwiZmRcIiBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcjogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0ZEX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0ZEX1RZUEVcIixcbiAgICAgIGBVbnN1cHBvcnRlZCBmZCB0eXBlOiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRklMRV9VUkxfSE9TVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfRklMRV9VUkxfSE9TVFwiLFxuICAgICAgYEZpbGUgVVJMIGhvc3QgbXVzdCBiZSBcImxvY2FsaG9zdFwiIG9yIGVtcHR5IG9uICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9GSUxFX1VSTF9QQVRIIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9GSUxFX1VSTF9QQVRIXCIsXG4gICAgICBgRmlsZSBVUkwgcGF0aCAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfSEFORExFX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0hBTkRMRV9UWVBFXCIsXG4gICAgICBgVGhpcyBoYW5kbGUgdHlwZSBjYW5ub3QgYmUgc2VudGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0hUVFBfVE9LRU4gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfSFRUUF9UT0tFTlwiLFxuICAgICAgYCR7eH0gbXVzdCBiZSBhIHZhbGlkIEhUVFAgdG9rZW4gW1wiJHt5fVwiXWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0lQX0FERFJFU1MgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0lQX0FERFJFU1NcIixcbiAgICAgIGBJbnZhbGlkIElQIGFkZHJlc3M6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9PUFRfVkFMVUVfRU5DT0RJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX09QVF9WQUxVRV9FTkNPRElOR1wiLFxuICAgICAgYFRoZSB2YWx1ZSBcIiR7eH1cIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJlbmNvZGluZ1wiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUEVSRk9STUFOQ0VfTUFSSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9QRVJGT1JNQU5DRV9NQVJLXCIsXG4gICAgICBgVGhlIFwiJHt4fVwiIHBlcmZvcm1hbmNlIG1hcmsgaGFzIG5vdCBiZWVuIHNldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1BST1RPQ09MIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1BST1RPQ09MXCIsXG4gICAgICBgUHJvdG9jb2wgXCIke3h9XCIgbm90IHN1cHBvcnRlZC4gRXhwZWN0ZWQgXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHXCIsXG4gICAgICBgQ2Fubm90IHNwZWNpZnkgYm90aCBcImJyZWFrRXZhbE9uU2lnaW50XCIgYW5kIFwiZXZhbFwiIGZvciBSRVBMYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVQTF9JTlBVVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVQTF9JTlBVVFwiLFxuICAgICAgYCR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9TWU5DX0ZPUktfSU5QVVQgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1NZTkNfRk9SS19JTlBVVFwiLFxuICAgICAgYEFzeW5jaHJvbm91cyBmb3JrcyBkbyBub3Qgc3VwcG9ydCBCdWZmZXIsIFR5cGVkQXJyYXksIERhdGFWaWV3IG9yIHN0cmluZyBpbnB1dDogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1RISVMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1RISVNcIixcbiAgICAgIGBWYWx1ZSBvZiBcInRoaXNcIiBtdXN0IGJlIG9mIHR5cGUgJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1RVUExFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1RVUExFXCIsXG4gICAgICBgJHt4fSBtdXN0IGJlIGFuIGl0ZXJhYmxlICR7eX0gdHVwbGVgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkkgZXh0ZW5kcyBOb2RlVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfVVJJXCIsXG4gICAgICBgVVJJIG1hbGZvcm1lZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfQ0hBTk5FTF9DTE9TRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lQQ19DSEFOTkVMX0NMT1NFRFwiLFxuICAgICAgYENoYW5uZWwgY2xvc2VkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lQQ19ESVNDT05ORUNURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lQQ19ESVNDT05ORUNURURcIixcbiAgICAgIGBJUEMgY2hhbm5lbCBpcyBhbHJlYWR5IGRpc2Nvbm5lY3RlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfT05FX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lQQ19PTkVfUElQRVwiLFxuICAgICAgYENoaWxkIHByb2Nlc3MgY2FuIGhhdmUgb25seSBvbmUgSVBDIHBpcGVgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSVBDX1NZTkNfRk9SSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSVBDX1NZTkNfRk9SS1wiLFxuICAgICAgYElQQyBjYW5ub3QgYmUgdXNlZCB3aXRoIHN5bmNocm9ub3VzIGZvcmtzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX01BTklGRVNUX0RFUEVOREVOQ1lfTUlTU0lORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9NQU5JRkVTVF9ERVBFTkRFTkNZX01JU1NJTkdcIixcbiAgICAgIGBNYW5pZmVzdCByZXNvdXJjZSAke3h9IGRvZXMgbm90IGxpc3QgJHt5fSBhcyBhIGRlcGVuZGVuY3kgc3BlY2lmaWVyYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX01BTklGRVNUX0lOVEVHUklUWV9NSVNNQVRDSCBleHRlbmRzIE5vZGVTeW50YXhFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTUFOSUZFU1RfSU5URUdSSVRZX01JU01BVENIXCIsXG4gICAgICBgTWFuaWZlc3QgcmVzb3VyY2UgJHt4fSBoYXMgbXVsdGlwbGUgZW50cmllcyBidXQgaW50ZWdyaXR5IGxpc3RzIGRvIG5vdCBtYXRjaGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9JTlZBTElEX1JFU09VUkNFX0ZJRUxEIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9NQU5JRkVTVF9JTlZBTElEX1JFU09VUkNFX0ZJRUxEXCIsXG4gICAgICBgTWFuaWZlc3QgcmVzb3VyY2UgJHt4fSBoYXMgaW52YWxpZCBwcm9wZXJ0eSB2YWx1ZSBmb3IgJHt5fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9URFogZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX1REWlwiLFxuICAgICAgYE1hbmlmZXN0IGluaXRpYWxpemF0aW9uIGhhcyBub3QgeWV0IHJ1bmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9VTktOT1dOX09ORVJST1IgZXh0ZW5kcyBOb2RlU3ludGF4RXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX1VOS05PV05fT05FUlJPUlwiLFxuICAgICAgYE1hbmlmZXN0IHNwZWNpZmllZCB1bmtub3duIGVycm9yIGJlaGF2aW9yIFwiJHt4fVwiLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEXCIsXG4gICAgICBgVGhlICR7eH0gbWV0aG9kIGlzIG5vdCBpbXBsZW1lbnRlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NSVNTSU5HX0FSR1MgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoLi4uYXJnczogc3RyaW5nW10pIHtcbiAgICBhcmdzID0gYXJncy5tYXAoKGEpID0+IGBcIiR7YX1cImApO1xuXG4gICAgbGV0IG1zZyA9IFwiVGhlIFwiO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgbXNnICs9IGAke2FyZ3NbMF19IGFyZ3VtZW50YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIG1zZyArPSBgJHthcmdzWzBdfSBhbmQgJHthcmdzWzFdfSBhcmd1bWVudHNgO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG1zZyArPSBhcmdzLnNsaWNlKDAsIGFyZ3MubGVuZ3RoIC0gMSkuam9pbihcIiwgXCIpO1xuICAgICAgICBtc2cgKz0gYCwgYW5kICR7YXJnc1thcmdzLmxlbmd0aCAtIDFdfSBhcmd1bWVudHNgO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9NSVNTSU5HX0FSR1NcIixcbiAgICAgIGAke21zZ30gbXVzdCBiZSBzcGVjaWZpZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUlTU0lOR19PUFRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9NSVNTSU5HX09QVElPTlwiLFxuICAgICAgYCR7eH0gaXMgcmVxdWlyZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTVVMVElQTEVfQ0FMTEJBQ0sgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01VTFRJUExFX0NBTExCQUNLXCIsXG4gICAgICBgQ2FsbGJhY2sgY2FsbGVkIG11bHRpcGxlIHRpbWVzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05BUElfQ09OU19GVU5DVElPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05BUElfQ09OU19GVU5DVElPTlwiLFxuICAgICAgYENvbnN0cnVjdG9yIG11c3QgYmUgYSBmdW5jdGlvbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHUyBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHU1wiLFxuICAgICAgYGJ5dGVfb2Zmc2V0ICsgYnl0ZV9sZW5ndGggc2hvdWxkIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgc2l6ZSBpbiBieXRlcyBvZiB0aGUgYXJyYXkgcGFzc2VkIGluYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVFwiLFxuICAgICAgYHN0YXJ0IG9mZnNldCBvZiAke3h9IHNob3VsZCBiZSBhIG11bHRpcGxlIG9mICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTkFQSV9JTlZBTElEX1RZUEVEQVJSQVlfTEVOR1RIIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0xFTkdUSFwiLFxuICAgICAgYEludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05PX0NSWVBUTyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTk9fQ1JZUFRPXCIsXG4gICAgICBgTm9kZS5qcyBpcyBub3QgY29tcGlsZWQgd2l0aCBPcGVuU1NMIGNyeXB0byBzdXBwb3J0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05PX0lDVSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05PX0lDVVwiLFxuICAgICAgYCR7eH0gaXMgbm90IHN1cHBvcnRlZCBvbiBOb2RlLmpzIGNvbXBpbGVkIHdpdGhvdXQgSUNVYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ0NMSUVOVFNFU1NJT05fRkFJTEVEXCIsXG4gICAgICBgRmFpbGVkIHRvIGNyZWF0ZSBhIG5ldyBRdWljQ2xpZW50U2Vzc2lvbjogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDQ0xJRU5UU0VTU0lPTl9GQUlMRURfU0VUU09DS0VUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDQ0xJRU5UU0VTU0lPTl9GQUlMRURfU0VUU09DS0VUXCIsXG4gICAgICBgRmFpbGVkIHRvIHNldCB0aGUgUXVpY1NvY2tldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU0VTU0lPTl9ERVNUUk9ZRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTRVNTSU9OX0RFU1RST1lFRFwiLFxuICAgICAgYENhbm5vdCBjYWxsICR7eH0gYWZ0ZXIgYSBRdWljU2Vzc2lvbiBoYXMgYmVlbiBkZXN0cm95ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NFU1NJT05fSU5WQUxJRF9EQ0lEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSURcIixcbiAgICAgIGBJbnZhbGlkIERDSUQgdmFsdWU6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NFU1NJT05fVVBEQVRFS0VZIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU0VTU0lPTl9VUERBVEVLRVlcIixcbiAgICAgIGBVbmFibGUgdG8gdXBkYXRlIFF1aWNTZXNzaW9uIGtleXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NPQ0tFVF9ERVNUUk9ZRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTT0NLRVRfREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIFF1aWNTb2NrZXQgaGFzIGJlZW4gZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfSU5WQUxJRF9TVEFURUxFU1NfUkVTRVRfU0VDUkVUX0xFTkdUSFxuICBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NPQ0tFVF9JTlZBTElEX1NUQVRFTEVTU19SRVNFVF9TRUNSRVRfTEVOR1RIXCIsXG4gICAgICBgVGhlIHN0YXRlUmVzZXRUb2tlbiBtdXN0IGJlIGV4YWN0bHkgMTYtYnl0ZXMgaW4gbGVuZ3RoYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfTElTVEVOSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU09DS0VUX0xJU1RFTklOR1wiLFxuICAgICAgYFRoaXMgUXVpY1NvY2tldCBpcyBhbHJlYWR5IGxpc3RlbmluZ2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU09DS0VUX1VOQk9VTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTT0NLRVRfVU5CT1VORFwiLFxuICAgICAgYENhbm5vdCBjYWxsICR7eH0gYmVmb3JlIGEgUXVpY1NvY2tldCBoYXMgYmVlbiBib3VuZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU1RSRUFNX0RFU1RST1lFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9ERVNUUk9ZRURcIixcbiAgICAgIGBDYW5ub3QgY2FsbCAke3h9IGFmdGVyIGEgUXVpY1N0cmVhbSBoYXMgYmVlbiBkZXN0cm95ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NUUkVBTV9JTlZBTElEX1BVU0ggZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTVFJFQU1fSU5WQUxJRF9QVVNIXCIsXG4gICAgICBgUHVzaCBzdHJlYW1zIGFyZSBvbmx5IHN1cHBvcnRlZCBvbiBjbGllbnQtaW5pdGlhdGVkLCBiaWRpcmVjdGlvbmFsIHN0cmVhbXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NUUkVBTV9PUEVOX0ZBSUxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9PUEVOX0ZBSUxFRFwiLFxuICAgICAgYE9wZW5pbmcgYSBuZXcgUXVpY1N0cmVhbSBmYWlsZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NUUkVBTV9VTlNVUFBPUlRFRF9QVVNIIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU1RSRUFNX1VOU1VQUE9SVEVEX1BVU0hcIixcbiAgICAgIGBQdXNoIHN0cmVhbXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBRdWljU2Vzc2lvbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDX1RMUzEzX1JFUVVJUkVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDX1RMUzEzX1JFUVVJUkVEXCIsXG4gICAgICBgUVVJQyByZXF1aXJlcyBUTFMgdmVyc2lvbiAxLjNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRFwiLFxuICAgICAgXCJTY3JpcHQgZXhlY3V0aW9uIHdhcyBpbnRlcnJ1cHRlZCBieSBgU0lHSU5UYFwiLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0VSVkVSX0FMUkVBRFlfTElTVEVOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TRVJWRVJfQUxSRUFEWV9MSVNURU5cIixcbiAgICAgIGBMaXN0ZW4gbWV0aG9kIGhhcyBiZWVuIGNhbGxlZCBtb3JlIHRoYW4gb25jZSB3aXRob3V0IGNsb3NpbmcuYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NFUlZFUl9OT1RfUlVOTklORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU0VSVkVSX05PVF9SVU5OSU5HXCIsXG4gICAgICBgU2VydmVyIGlzIG5vdCBydW5uaW5nLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQUxSRUFEWV9CT1VORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU09DS0VUX0FMUkVBRFlfQk9VTkRcIixcbiAgICAgIGBTb2NrZXQgaXMgYWxyZWFkeSBib3VuZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQkFEX0JVRkZFUl9TSVpFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU09DS0VUX0JBRF9CVUZGRVJfU0laRVwiLFxuICAgICAgYEJ1ZmZlciBzaXplIG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NPQ0tFVF9CQURfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfVFlQRVwiLFxuICAgICAgYEJhZCBzb2NrZXQgdHlwZSBzcGVjaWZpZWQuIFZhbGlkIHR5cGVzIGFyZTogdWRwNCwgdWRwNmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQ0xPU0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TT0NLRVRfQ0xPU0VEXCIsXG4gICAgICBgU29ja2V0IGlzIGNsb3NlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVEXCIsXG4gICAgICBgQWxyZWFkeSBjb25uZWN0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0RHUkFNX05PVF9DT05ORUNURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9ER1JBTV9OT1RfQ09OTkVDVEVEXCIsXG4gICAgICBgTm90IGNvbm5lY3RlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fTk9UX1JVTk5JTkcgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9ER1JBTV9OT1RfUlVOTklOR1wiLFxuICAgICAgYE5vdCBydW5uaW5nYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NSSV9QQVJTRSBleHRlbmRzIE5vZGVTeW50YXhFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY2hhcjogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TUklfUEFSU0VcIixcbiAgICAgIGBTdWJyZXNvdXJjZSBJbnRlZ3JpdHkgc3RyaW5nICR7bmFtZX0gaGFkIGFuIHVuZXhwZWN0ZWQgJHtjaGFyfSBhdCBwb3NpdGlvbiAke3Bvc2l0aW9ufWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQUxSRUFEWV9GSU5JU0hFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX0FMUkVBRFlfRklOSVNIRURcIixcbiAgICAgIGBDYW5ub3QgY2FsbCAke3h9IGFmdGVyIGEgc3RyZWFtIHdhcyBmaW5pc2hlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQ0FOTk9UX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NUUkVBTV9DQU5OT1RfUElQRVwiLFxuICAgICAgYENhbm5vdCBwaXBlLCBub3QgcmVhZGFibGVgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1RSRUFNX0RFU1RST1lFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX0RFU1RST1lFRFwiLFxuICAgICAgYENhbm5vdCBjYWxsICR7eH0gYWZ0ZXIgYSBzdHJlYW0gd2FzIGRlc3Ryb3llZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fTlVMTF9WQUxVRVMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fTlVMTF9WQUxVRVNcIixcbiAgICAgIGBNYXkgbm90IHdyaXRlIG51bGwgdmFsdWVzIHRvIHN0cmVhbWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFXCIsXG4gICAgICBgUHJlbWF0dXJlIGNsb3NlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX1BVU0hfQUZURVJfRU9GXCIsXG4gICAgICBgc3RyZWFtLnB1c2goKSBhZnRlciBFT0ZgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1RSRUFNX1VOU0hJRlRfQUZURVJfRU5EX0VWRU5UIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fVU5TSElGVF9BRlRFUl9FTkRfRVZFTlRcIixcbiAgICAgIGBzdHJlYW0udW5zaGlmdCgpIGFmdGVyIGVuZCBldmVudGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fV1JBUCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX1dSQVBcIixcbiAgICAgIGBTdHJlYW0gaGFzIFN0cmluZ0RlY29kZXIgc2V0IG9yIGlzIGluIG9iamVjdE1vZGVgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORFwiLFxuICAgICAgYHdyaXRlIGFmdGVyIGVuZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TWU5USEVUSUMgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NZTlRIRVRJQ1wiLFxuICAgICAgYEphdmFTY3JpcHQgQ2FsbHN0YWNrYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19ESF9QQVJBTV9TSVpFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfREhfUEFSQU1fU0laRVwiLFxuICAgICAgYERIIHBhcmFtZXRlciBzaXplICR7eH0gaXMgbGVzcyB0aGFuIDIwNDhgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0hBTkRTSEFLRV9USU1FT1VUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfSEFORFNIQUtFX1RJTUVPVVRcIixcbiAgICAgIGBUTFMgaGFuZHNoYWtlIHRpbWVvdXRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfQ09OVEVYVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19JTlZBTElEX0NPTlRFWFRcIixcbiAgICAgIGAke3h9IG11c3QgYmUgYSBTZWN1cmVDb250ZXh0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19JTlZBTElEX1NUQVRFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfSU5WQUxJRF9TVEFURVwiLFxuICAgICAgYFRMUyBzb2NrZXQgY29ubmVjdGlvbiBtdXN0IGJlIHNlY3VyZWx5IGVzdGFibGlzaGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19JTlZBTElEX1BST1RPQ09MX1ZFUlNJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IocHJvdG9jb2w6IHN0cmluZywgeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfSU5WQUxJRF9QUk9UT0NPTF9WRVJTSU9OXCIsXG4gICAgICBgJHtwcm90b2NvbH0gaXMgbm90IGEgdmFsaWQgJHt4fSBUTFMgcHJvdG9jb2wgdmVyc2lvbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfUFJPVE9DT0xfVkVSU0lPTl9DT05GTElDVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwcmV2UHJvdG9jb2w6IHN0cmluZywgcHJvdG9jb2w6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVExTX1BST1RPQ09MX1ZFUlNJT05fQ09ORkxJQ1RcIixcbiAgICAgIGBUTFMgcHJvdG9jb2wgdmVyc2lvbiAke3ByZXZQcm90b2NvbH0gY29uZmxpY3RzIHdpdGggc2VjdXJlUHJvdG9jb2wgJHtwcm90b2NvbH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX1JFTkVHT1RJQVRJT05fRElTQUJMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19SRU5FR09USUFUSU9OX0RJU0FCTEVEXCIsXG4gICAgICBgVExTIHNlc3Npb24gcmVuZWdvdGlhdGlvbiBkaXNhYmxlZCBmb3IgdGhpcyBzb2NrZXRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX1JFUVVJUkVEX1NFUlZFUl9OQU1FIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfUkVRVUlSRURfU0VSVkVSX05BTUVcIixcbiAgICAgIGBcInNlcnZlcm5hbWVcIiBpcyByZXF1aXJlZCBwYXJhbWV0ZXIgZm9yIFNlcnZlci5hZGRDb250ZXh0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19TRVNTSU9OX0FUVEFDSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVExTX1NFU1NJT05fQVRUQUNLXCIsXG4gICAgICBgVExTIHNlc3Npb24gcmVuZWdvdGlhdGlvbiBhdHRhY2sgZGV0ZWN0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX1NOSV9GUk9NX1NFUlZFUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVExTX1NOSV9GUk9NX1NFUlZFUlwiLFxuICAgICAgYENhbm5vdCBpc3N1ZSBTTkkgZnJvbSBhIFRMUyBzZXJ2ZXItc2lkZSBzb2NrZXRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVFJBQ0VfRVZFTlRTX0NBVEVHT1JZX1JFUVVJUkVEIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVFJBQ0VfRVZFTlRTX0NBVEVHT1JZX1JFUVVJUkVEXCIsXG4gICAgICBgQXQgbGVhc3Qgb25lIGNhdGVnb3J5IGlzIHJlcXVpcmVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RSQUNFX0VWRU5UU19VTkFWQUlMQUJMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVFJBQ0VfRVZFTlRTX1VOQVZBSUxBQkxFXCIsXG4gICAgICBgVHJhY2UgZXZlbnRzIGFyZSB1bmF2YWlsYWJsZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTkFWQUlMQUJMRV9EVVJJTkdfRVhJVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVU5BVkFJTEFCTEVfRFVSSU5HX0VYSVRcIixcbiAgICAgIGBDYW5ub3QgY2FsbCBmdW5jdGlvbiBpbiBwcm9jZXNzIGV4aXQgaGFuZGxlcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTkNBVUdIVF9FWENFUFRJT05fQ0FQVFVSRV9BTFJFQURZX1NFVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVU5DQVVHSFRfRVhDRVBUSU9OX0NBUFRVUkVfQUxSRUFEWV9TRVRcIixcbiAgICAgIFwiYHByb2Nlc3Muc2V0dXBVbmNhdWdodEV4Y2VwdGlvbkNhcHR1cmUoKWAgd2FzIGNhbGxlZCB3aGlsZSBhIGNhcHR1cmUgY2FsbGJhY2sgd2FzIGFscmVhZHkgYWN0aXZlXCIsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTkVTQ0FQRURfQ0hBUkFDVEVSUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VORVNDQVBFRF9DSEFSQUNURVJTXCIsXG4gICAgICBgJHt4fSBjb250YWlucyB1bmVzY2FwZWQgY2hhcmFjdGVyc2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTktOT1dOX0JVSUxUSU5fTU9EVUxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9VTktOT1dOX0JVSUxUSU5fTU9EVUxFXCIsXG4gICAgICBgTm8gc3VjaCBidWlsdC1pbiBtb2R1bGU6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9DUkVERU5USUFMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOS05PV05fQ1JFREVOVElBTFwiLFxuICAgICAgYCR7eH0gaWRlbnRpZmllciBkb2VzIG5vdCBleGlzdDogJHt5fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTktOT1dOX0VOQ09ESU5HIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVU5LTk9XTl9FTkNPRElOR1wiLFxuICAgICAgYFVua25vd24gZW5jb2Rpbmc6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9GSUxFX0VYVEVOU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVU5LTk9XTl9GSUxFX0VYVEVOU0lPTlwiLFxuICAgICAgYFVua25vd24gZmlsZSBleHRlbnNpb24gXCIke3h9XCIgZm9yICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9NT0RVTEVfRk9STUFUIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOS05PV05fTU9EVUxFX0ZPUk1BVFwiLFxuICAgICAgYFVua25vd24gbW9kdWxlIGZvcm1hdDogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTktOT1dOX1NJR05BTCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOS05PV05fU0lHTkFMXCIsXG4gICAgICBgVW5rbm93biBzaWduYWw6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5TVVBQT1JURURfRElSX0lNUE9SVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9VTlNVUFBPUlRFRF9ESVJfSU1QT1JUXCIsXG4gICAgICBgRGlyZWN0b3J5IGltcG9ydCAnJHt4fScgaXMgbm90IHN1cHBvcnRlZCByZXNvbHZpbmcgRVMgbW9kdWxlcywgaW1wb3J0ZWQgZnJvbSAke3l9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOU1VQUE9SVEVEX0VTTV9VUkxfU0NIRU1FIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9VTlNVUFBPUlRFRF9FU01fVVJMX1NDSEVNRVwiLFxuICAgICAgYE9ubHkgZmlsZSBhbmQgZGF0YSBVUkxzIGFyZSBzdXBwb3J0ZWQgYnkgdGhlIGRlZmF1bHQgRVNNIGxvYWRlcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WOEJSRUFLSVRFUkFUT1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1Y4QlJFQUtJVEVSQVRPUlwiLFxuICAgICAgYEZ1bGwgSUNVIGRhdGEgbm90IGluc3RhbGxlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS93aWtpL0ludGxgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVkFMSURfUEVSRk9STUFOQ0VfRU5UUllfVFlQRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVkFMSURfUEVSRk9STUFOQ0VfRU5UUllfVFlQRVwiLFxuICAgICAgYEF0IGxlYXN0IG9uZSB2YWxpZCBwZXJmb3JtYW5jZSBlbnRyeSB0eXBlIGlzIHJlcXVpcmVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX0RZTkFNSUNfSU1QT1JUX0NBTExCQUNLX01JU1NJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9EWU5BTUlDX0lNUE9SVF9DQUxMQkFDS19NSVNTSU5HXCIsXG4gICAgICBgQSBkeW5hbWljIGltcG9ydCBjYWxsYmFjayB3YXMgbm90IHNwZWNpZmllZC5gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fTU9EVUxFX0FMUkVBRFlfTElOS0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfQUxSRUFEWV9MSU5LRURcIixcbiAgICAgIGBNb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBsaW5rZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fTU9EVUxFX0NBTk5PVF9DUkVBVEVfQ0FDSEVEX0RBVEEgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX01PRFVMRV9DQU5OT1RfQ1JFQVRFX0NBQ0hFRF9EQVRBXCIsXG4gICAgICBgQ2FjaGVkIGRhdGEgY2Fubm90IGJlIGNyZWF0ZWQgZm9yIGEgbW9kdWxlIHdoaWNoIGhhcyBiZWVuIGV2YWx1YXRlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfRElGRkVSRU5UX0NPTlRFWFQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX01PRFVMRV9ESUZGRVJFTlRfQ09OVEVYVFwiLFxuICAgICAgYExpbmtlZCBtb2R1bGVzIG11c3QgdXNlIHRoZSBzYW1lIGNvbnRleHRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fTU9EVUxFX0xJTktJTkdfRVJST1JFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVk1fTU9EVUxFX0xJTktJTkdfRVJST1JFRFwiLFxuICAgICAgYExpbmtpbmcgaGFzIGFscmVhZHkgZmFpbGVkIGZvciB0aGUgcHJvdmlkZWQgbW9kdWxlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9OT1RfTU9EVUxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfTk9UX01PRFVMRVwiLFxuICAgICAgYFByb3ZpZGVkIG1vZHVsZSBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgTW9kdWxlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9TVEFUVVMgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX01PRFVMRV9TVEFUVVNcIixcbiAgICAgIGBNb2R1bGUgc3RhdHVzICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV0FTSV9BTFJFQURZX1NUQVJURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dBU0lfQUxSRUFEWV9TVEFSVEVEXCIsXG4gICAgICBgV0FTSSBpbnN0YW5jZSBoYXMgYWxyZWFkeSBzdGFydGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9JTklUX0ZBSUxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfV09SS0VSX0lOSVRfRkFJTEVEXCIsXG4gICAgICBgV29ya2VyIGluaXRpYWxpemF0aW9uIGZhaWx1cmU6ICR7eH1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX05PVF9SVU5OSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9XT1JLRVJfTk9UX1JVTk5JTkdcIixcbiAgICAgIGBXb3JrZXIgaW5zdGFuY2Ugbm90IHJ1bm5pbmdgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX09VVF9PRl9NRU1PUlkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9PVVRfT0ZfTUVNT1JZXCIsXG4gICAgICBgV29ya2VyIHRlcm1pbmF0ZWQgZHVlIHRvIHJlYWNoaW5nIG1lbW9yeSBsaW1pdDogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9XT1JLRVJfVU5TRVJJQUxJWkFCTEVfRVJST1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNFUklBTElaQUJMRV9FUlJPUlwiLFxuICAgICAgYFNlcmlhbGl6aW5nIGFuIHVuY2F1Z2h0IGV4Y2VwdGlvbiBmYWlsZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX1VOU1VQUE9SVEVEX0VYVEVOU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9FWFRFTlNJT05cIixcbiAgICAgIGBUaGUgd29ya2VyIHNjcmlwdCBleHRlbnNpb24gbXVzdCBiZSBcIi5qc1wiLCBcIi5tanNcIiwgb3IgXCIuY2pzXCIuIFJlY2VpdmVkIFwiJHt4fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9PUEVSQVRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9XT1JLRVJfVU5TVVBQT1JURURfT1BFUkFUSU9OXCIsXG4gICAgICBgJHt4fSBpcyBub3Qgc3VwcG9ydGVkIGluIHdvcmtlcnNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfWkxJQl9JTklUSUFMSVpBVElPTl9GQUlMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1pMSUJfSU5JVElBTElaQVRJT05fRkFJTEVEXCIsXG4gICAgICBgSW5pdGlhbGl6YXRpb24gZmFpbGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0ZBTFNZX1ZBTFVFX1JFSkVDVElPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBjb25zdHJ1Y3RvcihyZWFzb246IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OXCIsXG4gICAgICBcIlByb21pc2Ugd2FzIHJlamVjdGVkIHdpdGggZmFsc3kgdmFsdWVcIixcbiAgICApO1xuICAgIHRoaXMucmVhc29uID0gcmVhc29uO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfU0VUVElOR19WQUxVRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgYWN0dWFsOiB1bmtub3duO1xuICBtaW4/OiBudW1iZXI7XG4gIG1heD86IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFjdHVhbDogdW5rbm93biwgbWluPzogbnVtYmVyLCBtYXg/OiBudW1iZXIpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfU0VUVElOR19WQUxVRVwiLFxuICAgICAgYEludmFsaWQgdmFsdWUgZm9yIHNldHRpbmcgXCIke25hbWV9XCI6ICR7YWN0dWFsfWAsXG4gICAgKTtcbiAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbDtcbiAgICBpZiAobWluICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubWluID0gbWluO1xuICAgICAgdGhpcy5tYXggPSBtYXg7XG4gICAgfVxuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NUUkVBTV9DQU5DRUwgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjYXVzZT86IEVycm9yO1xuICBjb25zdHJ1Y3RvcihlcnJvcjogRXJyb3IpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX1NUUkVBTV9DQU5DRUxcIixcbiAgICAgIHR5cGVvZiBlcnJvci5tZXNzYWdlID09PSBcInN0cmluZ1wiXG4gICAgICAgID8gYFRoZSBwZW5kaW5nIHN0cmVhbSBoYXMgYmVlbiBjYW5jZWxlZCAoY2F1c2VkIGJ5OiAke2Vycm9yLm1lc3NhZ2V9KWBcbiAgICAgICAgOiBcIlRoZSBwZW5kaW5nIHN0cmVhbSBoYXMgYmVlbiBjYW5jZWxlZFwiLFxuICAgICk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aGlzLmNhdXNlID0gZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9BRERSRVNTX0ZBTUlMWSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgaG9zdDogc3RyaW5nO1xuICBwb3J0OiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKGFkZHJlc3NUeXBlOiBzdHJpbmcsIGhvc3Q6IHN0cmluZywgcG9ydDogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0FERFJFU1NfRkFNSUxZXCIsXG4gICAgICBgSW52YWxpZCBhZGRyZXNzIGZhbWlseTogJHthZGRyZXNzVHlwZX0gJHtob3N0fToke3BvcnR9YCxcbiAgICApO1xuICAgIHRoaXMuaG9zdCA9IGhvc3Q7XG4gICAgdGhpcy5wb3J0ID0gcG9ydDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQ0hBUiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGZpZWxkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0NIQVJcIixcbiAgICAgIGZpZWxkXG4gICAgICAgID8gYEludmFsaWQgY2hhcmFjdGVyIGluICR7bmFtZX1gXG4gICAgICAgIDogYEludmFsaWQgY2hhcmFjdGVyIGluICR7bmFtZX0gW1wiJHtmaWVsZH1cIl1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX09QVF9WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX09QVF9WQUxVRVwiLFxuICAgICAgYFRoZSB2YWx1ZSBcIiR7dmFsdWV9XCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwiJHtuYW1lfVwiYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9SRVRVUk5fUFJPUEVSVFkgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoaW5wdXQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZXCIsXG4gICAgICBgRXhwZWN0ZWQgYSB2YWxpZCAke2lucHV0fSB0byBiZSByZXR1cm5lZCBmb3IgdGhlIFwiJHtwcm9wfVwiIGZyb20gdGhlIFwiJHtuYW1lfVwiIGZ1bmN0aW9uIGJ1dCBnb3QgJHt2YWx1ZX0uYCxcbiAgICApO1xuICB9XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBidWlsZFJldHVyblByb3BlcnR5VHlwZSh2YWx1ZTogYW55KSB7XG4gIGlmICh2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lKSB7XG4gICAgcmV0dXJuIGBpbnN0YW5jZSBvZiAke3ZhbHVlLmNvbnN0cnVjdG9yLm5hbWV9YDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYHR5cGUgJHt0eXBlb2YgdmFsdWV9YDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZX1ZBTFVFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJvcDogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9SRVRVUk5fUFJPUEVSVFlfVkFMVUVcIixcbiAgICAgIGBFeHBlY3RlZCAke2lucHV0fSB0byBiZSByZXR1cm5lZCBmb3IgdGhlIFwiJHtwcm9wfVwiIGZyb20gdGhlIFwiJHtuYW1lfVwiIGZ1bmN0aW9uIGJ1dCBnb3QgJHtcbiAgICAgICAgYnVpbGRSZXR1cm5Qcm9wZXJ0eVR5cGUodmFsdWUpXG4gICAgICB9LmAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFXCIsXG4gICAgICBgRXhwZWN0ZWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZnJvbSB0aGUgXCIke25hbWV9XCIgZnVuY3Rpb24gYnV0IGdvdCAke1xuICAgICAgICBidWlsZFJldHVyblByb3BlcnR5VHlwZSh2YWx1ZSlcbiAgICAgIH0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkwgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgaW5wdXQ6IHN0cmluZztcbiAgY29uc3RydWN0b3IoaW5wdXQ6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9VUkxcIixcbiAgICAgIGBJbnZhbGlkIFVSTDogJHtpbnB1dH1gLFxuICAgICk7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEVBbUJjLEFBbkJkOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBbUJjLEFBbkJkLEVBbUJjLENBRWQsTUFBTSxHQUFHLFdBQVcsUUFBUSxDQUF1QjtBQUNuRCxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQVc7QUFFbkMsRUFFRyxBQUZIOztDQUVHLEFBRkgsRUFFRyxDQUNILEtBQUssQ0FBQyxXQUFXO0FBRWpCLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLENBQ0gsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO0lBQ2QsQ0FBUTtJQUNSLENBQVU7SUFDVixDQUFRO0lBQ1IsQ0FBUTtJQUNSLEVBQTRFLEFBQTVFLDBFQUE0RTtJQUM1RSxDQUFVO0lBQ1YsQ0FBUTtJQUNSLENBQVM7SUFDVCxDQUFRO0lBQ1IsQ0FBUTtBQUNWLENBQUM7QUFFRCxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxDQUNILE1BQU0sT0FBTyxvQkFBb0IsU0FBUyxLQUFLO0lBQzdDLElBQUk7Z0JBRVEsSUFBWSxFQUFFLElBQVksRUFBRSxPQUFlLENBQUUsQ0FBQztRQUN4RCxLQUFLLENBQUMsT0FBTztRQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSTtRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUk7UUFDaEIsRUFBNEQsQUFBNUQsMERBQTREO1FBQzVELEVBQXlCLEFBQXpCLHVCQUF5QjtRQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLE9BQU8sSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0lBQ3pFLENBQUM7SUFFRCxRQUFRLEdBQUcsQ0FBQztRQUNWLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTztJQUNyRCxDQUFDOztBQUdILE1BQU0sT0FBTyxTQUFTLFNBQVMsb0JBQW9CO2dCQUNyQyxJQUFZLEVBQUUsT0FBZSxDQUFFLENBQUM7UUFDMUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPO0lBQzNDLENBQUM7O0FBR0gsTUFBTSxPQUFPLGVBQWUsU0FBUyxvQkFBb0I7Z0JBRTNDLElBQVksRUFBRSxPQUFlLENBQUUsQ0FBQztRQUMxQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU87UUFDL0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLFNBQVM7SUFDbkQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sY0FBYyxTQUFTLG9CQUFvQjtnQkFDMUMsSUFBWSxFQUFFLE9BQWUsQ0FBRSxDQUFDO1FBQzFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTztRQUM5QyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsU0FBUztJQUNsRCxDQUFDOztBQUdILE1BQU0sT0FBTyxhQUFhLFNBQVMsb0JBQW9CO2dCQUN6QyxJQUFZLEVBQUUsT0FBZSxDQUFFLENBQUM7UUFDMUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPO1FBQzdDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxTQUFTO0lBQ2pELENBQUM7O0FBR0gsTUFBTSxPQUFPLFlBQVksU0FBUyxvQkFBb0I7Z0JBQ3hDLElBQVksRUFBRSxPQUFlLENBQUUsQ0FBQztRQUMxQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU87UUFDNUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLFNBQVM7SUFDaEQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sb0JBQW9CLFNBQVMsYUFBYTtnQkFDekMsSUFBWSxFQUFFLFFBQTJCLEVBQUUsTUFBZSxDQUFFLENBQUM7UUFDdkUsRUFBaUYsQUFBakYsK0VBQWlGO1FBQ2pGLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxRQUFRLEdBQUcsQ0FBQztZQUFBLFFBQVE7UUFBQSxDQUFDO1FBQzFELEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBTTtRQUNoQixFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFXLGFBQUcsQ0FBQztZQUMvQixFQUFrQyxBQUFsQyxnQ0FBa0M7WUFDbEMsR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUMsTUFBTSxDQUFDO1lBQ04sS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUcsTUFBSSxDQUFVLFlBQUcsQ0FBVTtZQUN6RCxHQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUNELEdBQUcsSUFBSSxDQUFVO1FBRWpCLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBRSxDQUFDO1lBQzdCLEVBQUUsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUI7WUFDcEMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO2dCQUNuQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUs7WUFDdEIsQ0FBQyxNQUFNLENBQUM7Z0JBQ04sS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLO1lBQ2xCLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBeUUsQUFBekUsdUVBQXlFO1FBQ3pFLEVBQXNDLEFBQXRDLG9DQUFzQztRQUN0QyxFQUFFLEVBQUUsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6QixLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBUTtZQUNsQyxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNmLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ25CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBUTtZQUN6QixDQUFDO1FBQ0gsQ0FBQztRQUVELEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3JCLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHO2dCQUN0QixHQUFHLEtBQUssWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBSSxLQUFFLEtBQUssRUFBRSxJQUFJO1lBQ3BELENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsR0FBRyxLQUFLLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM5QyxDQUFDLE1BQU0sQ0FBQztnQkFDTixHQUFHLEtBQUssUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxFQUFFLEVBQUUsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsR0FBRyxJQUFJLENBQU07WUFDZixDQUFDO1FBQ0gsQ0FBQztRQUVELEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pCLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6QixLQUFLLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxHQUFHO2dCQUMxQixHQUFHLEtBQUssZUFBZSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBSSxLQUFFLEtBQUssRUFBRSxJQUFJO1lBQzNELENBQUMsTUFBTSxDQUFDO2dCQUNOLEdBQUcsS0FBSyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3BDLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMzQixHQUFHLEtBQUssSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO1lBQ0gsQ0FBQztZQUNELEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQixHQUFHLElBQUksQ0FBTTtZQUNmLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDckIsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUc7Z0JBQ3RCLEdBQUcsS0FBSyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFJLEtBQUUsS0FBSyxFQUFFLElBQUk7WUFDL0MsQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM5QixHQUFHLEtBQUssT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLENBQUMsTUFBTSxDQUFDO2dCQUNOLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLFdBQVcsT0FBTyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ3hDLEdBQUcsSUFBSSxDQUFLO2dCQUNkLENBQUM7Z0JBQ0QsR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDO1lBQ25CLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUNILENBQXNCLDBCQUNuQixHQUFHLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLE1BQU07SUFFekMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8scUJBQXFCLFNBQVMsYUFBYTtnQkFDMUMsSUFBWSxFQUFFLEtBQWMsRUFBRSxNQUFjLENBQUUsQ0FBQztRQUN6RCxLQUFLLENBQ0gsQ0FBdUIseUJBQ3RCLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEtBQUs7SUFFL0QsQ0FBQzs7QUFHSCxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBbUMsQUFBbkMsaUNBQW1DO1NBQzFCLG9CQUFvQixDQUFDLEtBQVUsRUFBRSxDQUFDO0lBQ3pDLEVBQUUsRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLENBQUM7UUFDbEIsTUFBTSxFQUFFLFVBQVUsRUFBRSxLQUFLO0lBQzNCLENBQUM7SUFDRCxFQUFFLEVBQUUsTUFBTSxDQUFDLEtBQUssS0FBSyxDQUFVLGFBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlDLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUMsSUFBSTtJQUN6QyxDQUFDO0lBQ0QsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssQ0FBUSxTQUFFLENBQUM7UUFDOUIsRUFBRSxFQUFFLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoRCxNQUFNLEVBQUUseUJBQXlCLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJO1FBQzNELENBQUM7UUFDRCxNQUFNLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUFDLEtBQUssR0FBRyxDQUFDO1FBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQ0QsR0FBRyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFBQyxNQUFNLEVBQUUsS0FBSztJQUFDLENBQUM7SUFDaEQsRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDMUIsU0FBUyxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHO0lBQzNDLENBQUM7SUFDRCxNQUFNLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFRCxNQUFNLE9BQU8sZ0JBQWdCLFNBQVMsVUFBVTtJQUM5QyxJQUFJLEdBQUcsQ0FBa0I7Z0JBRWIsR0FBVyxFQUFFLEtBQWEsRUFBRSxRQUFpQixDQUFFLENBQUM7UUFDMUQsS0FBSyxFQUNGLGNBQWMsRUFBRSxHQUFHLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRO1FBR2xGLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBRyxJQUFJO1FBQ3JCLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxJQUFJLENBQUMsSUFBSSxNQUFNLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLEVBQXlGLEFBQXpGLHVGQUF5RjtRQUN6RixJQUFJLENBQUMsS0FBSztRQUNWLEVBQXFDLEFBQXJDLG1DQUFxQztRQUNyQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUk7SUFDbEIsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sc0JBQXNCLFNBQVMsYUFBYTtnQkFDM0MsQ0FBUyxFQUFFLENBQVMsQ0FBRSxDQUFDO1FBQ2pDLEtBQUssQ0FBQyxDQUF3QiwwQkFBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLHlCQUF5QixFQUFFLENBQUM7SUFDeEUsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sb0JBQW9CLFNBQVMsYUFBYTtnQkFDekMsQ0FBUyxDQUFFLENBQUM7UUFDdEIsS0FBSyxDQUFDLENBQXNCLDBCQUFLLENBQUMsQ0FBQyxpQkFBaUI7SUFDdEQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sYUFBYSxTQUFTLFNBQVM7Z0JBQzlCLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxDQUFlLG1CQUFLLENBQUM7SUFDN0IsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sa0JBQWtCLFNBQVMsYUFBYTtnQkFDdkMsQ0FBUyxDQUFFLENBQUM7UUFDdEIsS0FBSyxDQUFDLENBQW9CLHdCQUFLLENBQUMsQ0FBQyxtQkFBbUI7SUFDdEQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sY0FBYyxTQUFTLGFBQWE7Z0JBQ25DLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxDQUFnQixrQkFBRywrQkFBK0IsRUFBRSxDQUFDO0lBQzdELENBQUM7O0FBR0gsTUFBTSxPQUFPLHdCQUF3QixTQUFTLGNBQWM7Z0JBQzlDLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxDQUEwQiw4QkFBSyxDQUFDLENBQUMsZ0NBQWdDO0lBQ3pFLENBQUM7O0FBR0gsTUFBTSxPQUFPLHdCQUF3QixTQUFTLGNBQWM7Z0JBQzlDLElBQWEsQ0FBRSxDQUFDO1FBQzFCLEtBQUssQ0FDSCxDQUEwQiwyQkFDMUIsSUFBSSxJQUNDLENBQUMsRUFBRSxJQUFJLENBQUMsNkJBQTZCLElBQ3RDLENBQWdEO0lBRXhELENBQUM7O0FBR0gsTUFBTSxPQUFPLG9CQUFvQixTQUFTLGNBQWM7Z0JBQzFDLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FDSCxDQUFzQix3QkFDckIsbUNBQW1DLEVBQUUsQ0FBQyxDQUFDLE1BQU07SUFFbEQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sdUJBQXVCLFNBQVMsU0FBUztpQkFDdEMsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUF5QiwwQkFDekIsQ0FBaUM7SUFFckMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sNkJBQTZCLFNBQVMsU0FBUztpQkFDNUMsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUErQixnQ0FDL0IsQ0FBb0M7SUFFeEMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sOEJBQThCLFNBQVMsU0FBUztnQkFDL0MsQ0FBUyxDQUFFLENBQUM7UUFDdEIsS0FBSyxDQUNILENBQWdDLGtDQUMvQixrRUFBa0UsRUFBRSxDQUFDO0lBRTFFLENBQUM7O0FBR0gsTUFBTSxPQUFPLGlDQUFpQyxTQUFTLGNBQWM7Z0JBQ3ZELENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FDSCxDQUFtQyx1Q0FDaEMsQ0FBQyxDQUFDLDBCQUEwQjtJQUVuQyxDQUFDOztBQUdILE1BQU0sT0FBTywyQkFBMkIsU0FBUyxhQUFhO2dCQUNoRCxDQUFTLENBQUUsQ0FBQztRQUN0QixLQUFLLENBQ0gsQ0FBNkIsK0JBQzVCLCtDQUErQyxFQUFFLENBQUM7SUFFdkQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sMkJBQTJCLFNBQVMsU0FBUztpQkFDMUMsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUE2Qiw4QkFDN0IsQ0FBaUM7SUFFckMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sYUFBYSxTQUFTLFNBQVM7Z0JBQzlCLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FDSCxDQUFlLGlCQUNkLDJCQUEyQixFQUFFLENBQUM7SUFFbkMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sc0NBQXNDLFNBQVMsU0FBUztpQkFDckQsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUF3Qyx5Q0FDeEMsQ0FBOEM7SUFFbEQsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sOEJBQThCLFNBQVMsYUFBYTtnQkFDbkQsQ0FBUyxDQUFFLENBQUM7UUFDdEIsS0FBSyxDQUNILENBQWdDLGtDQUMvQixxQkFBcUIsRUFBRSxDQUFDO0lBRTdCLENBQUM7O0FBR0gsTUFBTSxPQUFPLGtDQUFrQyxTQUFTLFNBQVM7aUJBQ2pELENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBb0MscUNBQ3BDLENBQTZDO0lBRWpELENBQUM7O0FBR0gsTUFBTSxPQUFPLHlCQUF5QixTQUFTLFNBQVM7Z0JBQzFDLENBQVMsQ0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FDSCxDQUEyQiw2QkFDMUIsUUFBUSxFQUFFLENBQUMsQ0FBQyxlQUFlO0lBRWhDLENBQUM7O0FBR0gsTUFBTSxPQUFPLHNCQUFzQixTQUFTLFNBQVM7aUJBQ3JDLENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBd0IseUJBQ3hCLENBQW1FO0lBRXZFLENBQUM7O0FBR0gsTUFBTSxPQUFPLDJCQUEyQixTQUFTLFNBQVM7aUJBQzFDLENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBNkIsOEJBQzdCLENBQTJDO0lBRS9DLENBQUM7O0FBR0gsTUFBTSxPQUFPLHlCQUF5QixTQUFTLFNBQVM7aUJBQ3hDLENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBMkIsNEJBQzNCLENBQXVCO0lBRTNCLENBQUM7O0FBR0gsTUFBTSxPQUFPLDZCQUE2QixTQUFTLFNBQVM7aUJBQzVDLENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBK0IsZ0NBQy9CLENBQW9CO0lBRXhCLENBQUM7O0FBR0gsTUFBTSxPQUFPLDJCQUEyQixTQUFTLFNBQVM7Z0JBQzVDLENBQVMsRUFBRSxDQUFTLENBQUUsQ0FBQztRQUNqQyxLQUFLLENBQ0gsQ0FBNkIsK0JBQzVCLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFFM0IsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sbUNBQW1DLFNBQVMsU0FBUztnQkFDcEQsQ0FBUyxFQUFFLENBQVMsQ0FBRSxDQUFDO1FBQ2pDLEtBQUssQ0FDSCxDQUFxQyx1Q0FDcEMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV6QyxDQUFDOztBQUdILE1BQU0sT0FBTyx5QkFBeUIsU0FBUyxhQUFhO2dCQUM5QyxDQUFTLENBQUUsQ0FBQztRQUN0QixLQUFLLENBQ0gsQ0FBMkIsNkJBQzFCLGdCQUFnQixFQUFFLENBQUM7SUFFeEIsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sa0NBQWtDLFNBQVMsYUFBYTtnQkFDdkQsQ0FBUyxFQUFFLENBQVMsQ0FBRSxDQUFDO1FBQ2pDLEtBQUssQ0FDSCxDQUFvQyxzQ0FDbkMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVqRCxDQUFDOztBQUdILE1BQU0sT0FBTyx3QkFBd0IsU0FBUyxTQUFTO2dCQUN6QyxDQUFTLENBQUUsQ0FBQztRQUN0QixLQUFLLENBQ0gsQ0FBMEIsNEJBQ3pCLDRCQUE0QixFQUFFLENBQUM7SUFFcEMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sdUJBQXVCLFNBQVMsU0FBUztpQkFDdEMsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUF5QiwwQkFDekIsQ0FBYztJQUVsQixDQUFDOztBQUdILE1BQU0sT0FBTyxtQ0FBbUMsU0FBUyxTQUFTO2lCQUNsRCxDQUFDO1FBQ2IsS0FBSyxDQUNILENBQXFDLHNDQUNyQyxDQUEwQjtJQUU5QixDQUFDOztBQUdILE1BQU0sT0FBTywrQkFBK0IsU0FBUyxTQUFTO2lCQUM5QyxDQUFDO1FBQ2IsS0FBSyxDQUNILENBQWlDLGtDQUNqQyxDQUFnQztJQUVwQyxDQUFDOztBQUdILE1BQU0sT0FBTyw0QkFBNEIsU0FBUyxTQUFTO2lCQUMzQyxDQUFDO1FBQ2IsS0FBSyxDQUNILENBQThCLCtCQUM5QixDQUF5QjtJQUU3QixDQUFDOztBQUdILE1BQU0sT0FBTyxjQUFjLFNBQVMsU0FBUztpQkFDN0IsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUFnQixpQkFDaEIsQ0FBNkI7SUFFakMsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sNEJBQTRCLFNBQVMsU0FBUztpQkFDM0MsQ0FBQztRQUNiLEtBQUssQ0FDSCxDQUE4QiwrQkFDOUIsQ0FBd0Y7SUFFNUYsQ0FBQzs7QUFHSCxNQUFNLE9BQU8sMEJBQTBCLFNBQVMsU0FBUztnQkFDM0MsQ0FBUyxFQUFFLENBQVMsQ0FBRSxDQUFDO1FBQ2pDLEtBQUssQ0FDSCxDQUE0Qiw4QkFDM0IsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVoRCxDQUFDOztBQUdILE1BQU0sT0FBTyxpQ0FBaUMsU0FBUyxTQUFTO2lCQUNoRCxDQUFDO1FBQ2IsS0FBSyxDQUNILENBQW1DLG9DQUNuQyxDQUFvQyxzQ0FDbEMsQ0FBbUUscUVBQ25FLENBQTBDO0lBRWhELENBQUM7O0FBR0gsTUFBTSxPQUFPLGdEQUFnRCxTQUNuRCxTQUFTO2lCQUNILENBQUM7UUFDYixLQUFLLENBQ0gsQ0FBa0QsbURBQ2xELENBQTBFLDRFQUN4RSxDQUErQztJQUVyRCxDQUFDOztBQUdILE1BQU0sT0FBTyxpQ0FBaUMsU0FBUyxvQkFBb0I7SUFFekUsS0FBSztnQkFDTyxRQUFnQixFQUFFLEdBQVcsQ0FBRSxDQUFDO1FBQzFDLEtBQUssQ0FDSCxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksRUFDeEIsQ0FBbUMscUNBQ2xDLDRDQUE0QyxFQUFFLFFBQVE7UUFFekQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLFNBQVM7UUFFL0MsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHO0lBQ2xCLENBQUM7O0FBaUJILEtBQUssQ0FBQyxPQUFPLEdBQWUsQ0FBQztJQUMzQixDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBd0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM1QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBbUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFZO1lBQUUsQ0FBd0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNqRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFlO1lBQUUsQ0FBdUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNuRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBOEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN6RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBa0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFnQjtZQUFFLENBQThCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDM0QsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBVztZQUFFLENBQW1CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDM0MsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQW9CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDL0MsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDcEQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQWtCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDN0MsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQW1CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDMUMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbEQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQWU7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFZO1lBQUUsQ0FBWTtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVk7WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2xELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUEwQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUE4QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3pELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWE7WUFBRSxDQUF1QztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2pFLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUEyQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3RELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUFnQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3pDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVc7WUFBRSxDQUFvQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzVDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUEyQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2xELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFrQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFvQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQy9DLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVk7WUFBRSxDQUEwQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ25ELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUE4QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3pELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFxQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUFnQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3BDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2hELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFrQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQUs7WUFBRSxDQUFXO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDN0IsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBUztZQUFFLENBQTZCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbkQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQWtDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdkQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXFDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDekQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQXFCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDMUMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQWtCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDekMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQWU7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMxQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBaUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFhO1lBQUUsQ0FBd0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMxQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFTO1lBQUUsQ0FBMkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNqRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBZ0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBMkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNoRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBbUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBK0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNwRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFhO1lBQUUsQ0FBd0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM5QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBMEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMvQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNoRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFTO1lBQUUsQ0FBaUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFXO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM3QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBZ0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFTO1lBQUUsQ0FBbUM7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN6RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM3QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBYTtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2pDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFnQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWlCO1lBQUUsQ0FBd0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN0RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFZO1lBQUUsQ0FBZ0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN6RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBa0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2QyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBdUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMzQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFXO1lBQUUsQ0FBK0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2RSxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBYztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ25DLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUFpQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVc7WUFBRSxDQUFzQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzlDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUFtQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3pDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUFpQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUFlO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBSztZQUFFLENBQWE7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMvQixDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBMkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMvQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBZ0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFXO1lBQUUsQ0FBYztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3RDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVc7WUFBRSxDQUFrQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFnQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFtQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3hELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUF1QjtRQUFBLENBQUM7SUFBQSxDQUFDO0FBQzlDLENBQUM7QUFFRCxLQUFLLENBQUMsTUFBTSxHQUFlLENBQUM7SUFDMUIsQ0FBQztTQUFDLENBQUM7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDekMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQW1CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQXdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDL0MsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBZTtZQUFFLENBQXVCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDakQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQThCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdkQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQWtDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckQsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBZ0I7WUFBRSxDQUE4QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzNELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVc7WUFBRSxDQUFtQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzNDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFvQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQy9DLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3BELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFrQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUFtQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFDLENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVk7WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2xELENBQUM7U0FBQyxJQUFJO1FBQUUsQ0FBQztZQUFBLENBQVk7WUFBRSxDQUFlO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDeEMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQVk7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFZO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBMEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyRCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBOEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN6RCxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFhO1lBQUUsQ0FBdUM7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNqRSxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBMkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN0RCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBZ0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyRCxDQUFDO1NBQUMsQ0FBQztRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN0QyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMzQyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFXO1lBQUUsQ0FBb0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMxQyxDQUFDO1NBQUMsSUFBSTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBMkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsRCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBa0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMzRCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBb0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM3QyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFZO1lBQUUsQ0FBMEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNqRCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBOEI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2RCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBcUM7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4RCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBZ0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsQyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUM5QyxDQUFDO1NBQUMsQ0FBQztRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBeUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMxQyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBa0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyQyxDQUFDO1NBQUMsQ0FBQztRQUFFLENBQUM7WUFBQSxDQUFLO1lBQUUsQ0FBVztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFCLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUE2QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2pELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFrQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUFxQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3hDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUFrQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQWM7WUFBRSxDQUFlO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDeEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQWlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBYTtZQUFFLENBQXdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDaEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQXFCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDeEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUztZQUFFLENBQTJCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDL0MsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQWdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbkMsQ0FBQztTQUFDLENBQUM7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQTJCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDN0MsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQW1CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdEMsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQStCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDcEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBYTtZQUFFLENBQXdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDaEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDNUMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQTBCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDN0MsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDOUMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUztZQUFFLENBQWlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBVztZQUFFLENBQXFCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDM0MsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQWdDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUztZQUFFLENBQW1DO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdkQsQ0FBQztTQUFDLENBQUM7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDMUMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQWE7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMvQixDQUFDO1NBQUMsR0FBRztRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBZ0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNwQyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFpQjtZQUFFLENBQXdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDcEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQWdDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdkQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQWtCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXVCO1FBQUEsQ0FBQztJQUFB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LENBQUM7SUFDdEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDM0MsQ0FBQztTQUFDLEdBQUc7UUFBRSxDQUFDO1lBQUEsQ0FBVztZQUFFLENBQW9CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDM0MsQ0FBQztTQUFDLElBQUk7UUFBRSxDQUFDO1lBQUEsQ0FBVTtZQUFFLENBQTJCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbEQsQ0FBQztTQUFDLEdBQUc7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQWtDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDNUQsQ0FBQztTQUFDLEdBQUc7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQW9CO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDOUMsQ0FBQztTQUFDLEdBQUc7UUFBRSxDQUFDO1lBQUEsQ0FBWTtZQUFFLENBQTBCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQThCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDdkQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQXFCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDeEMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQXFDO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDeEQsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQWdCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDbEMsQ0FBQztTQUFDLEdBQUc7UUFBRSxDQUFDO1lBQUEsQ0FBYztZQUFFLENBQXFCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDL0MsQ0FBQztTQUFDLENBQUM7UUFBRSxDQUFDO1lBQUEsQ0FBTztZQUFFLENBQXlCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDMUMsQ0FBQztTQUFDLEVBQUU7UUFBRSxDQUFDO1lBQUEsQ0FBUTtZQUFFLENBQWtCO1FBQUEsQ0FBQztJQUFBLENBQUM7SUFDckMsQ0FBQztTQUFDLENBQUM7UUFBRSxDQUFDO1lBQUEsQ0FBSztZQUFFLENBQVc7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUMxQixDQUFDO1NBQUMsR0FBRztRQUFFLENBQUM7WUFBQSxDQUFTO1lBQUUsQ0FBNkI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNsRCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBa0M7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUNyRCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFPO1lBQUUsQ0FBcUM7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2RCxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFRO1lBQUUsQ0FBcUI7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN4QyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFVO1lBQUUsQ0FBa0I7UUFBQSxDQUFDO0lBQUEsQ0FBQztJQUN2QyxDQUFDO1NBQUMsRUFBRTtRQUFFLENBQUM7WUFBQSxDQUFjO1lBQUUsQ0FBZTtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3hDLENBQUM7U0FBQyxHQUFHO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUFpQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZDLENBQUM7U0FBQyxHQUFHO1FBQUUsQ0FBQztZQUFBLENBQWE7WUFBRSxDQUF3QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2pELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3hDLENBQUM7U0FBQyxHQUFHO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUEyQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2hELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFnQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ25DLENBQUM7U0FBQyxDQUFDO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUEyQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUFtQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3RDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUErQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2xELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQWE7WUFBRSxDQUF3QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ2hELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzVDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVE7WUFBRSxDQUEwQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzdDLENBQUM7U0FBQyxHQUFHO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQy9DLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUFpQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVc7WUFBRSxDQUFxQjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzNDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVU7WUFBRSxDQUFnQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3JELENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZQUFBLENBQVM7WUFBRSxDQUFtQztRQUFBLENBQUM7SUFBQSxDQUFDO0lBQ3ZELENBQUM7U0FBQyxDQUFDO1FBQUUsQ0FBQztZQUFBLENBQU87WUFBRSxDQUF5QjtRQUFBLENBQUM7SUFBQSxDQUFDO0lBQzFDLENBQUM7U0FBQyxFQUFFO1FBQUUsQ0FBQztZ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