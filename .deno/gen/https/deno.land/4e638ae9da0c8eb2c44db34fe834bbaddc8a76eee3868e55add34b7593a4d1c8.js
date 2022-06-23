// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
export const SEMVER_SPEC_VERSION = "2.0.0";
const MAX_LENGTH = 256;
// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;
// The actual regexps
const re = [];
const src = [];
let R = 0;
// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.
// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.
const NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";
const NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = "[0-9]+";
// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.
const NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
// ## Main Version
// Three dot-separated numeric identifiers.
const MAINVERSION = R++;
const nid = src[NUMERICIDENTIFIER];
src[MAINVERSION] = `(${nid})\\.(${nid})\\.(${nid})`;
const MAINVERSIONLOOSE = R++;
const nidl = src[NUMERICIDENTIFIERLOOSE];
src[MAINVERSIONLOOSE] = `(${nidl})\\.(${nidl})\\.(${nidl})`;
// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.
const PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = "(?:" + src[NUMERICIDENTIFIER] + "|" + src[NONNUMERICIDENTIFIER] + ")";
const PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = "(?:" + src[NUMERICIDENTIFIERLOOSE] + "|" + src[NONNUMERICIDENTIFIER] + ")";
// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.
const PRERELEASE = R++;
src[PRERELEASE] = "(?:-(" + src[PRERELEASEIDENTIFIER] + "(?:\\." + src[PRERELEASEIDENTIFIER] + ")*))";
const PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = "(?:-?(" + src[PRERELEASEIDENTIFIERLOOSE] + "(?:\\." + src[PRERELEASEIDENTIFIERLOOSE] + ")*))";
// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.
const BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";
// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.
const BUILD = R++;
src[BUILD] = "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." + src[BUILDIDENTIFIER] + ")*))";
// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.
// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.
const FULL = R++;
const FULLPLAIN = "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] + "?";
src[FULL] = "^" + FULLPLAIN + "$";
// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
const LOOSEPLAIN = "[v=\\s]*" + src[MAINVERSIONLOOSE] + src[PRERELEASELOOSE] + "?" + src[BUILD] + "?";
const LOOSE = R++;
src[LOOSE] = "^" + LOOSEPLAIN + "$";
const GTLT = R++;
src[GTLT] = "((?:<|>)?=?)";
// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
const XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + "|x|X|\\*";
const XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";
const XRANGEPLAIN = R++;
src[XRANGEPLAIN] = "[v=\\s]*(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:" + src[PRERELEASE] + ")?" + src[BUILD] + "?" + ")?)?";
const XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = "[v=\\s]*(" + src[XRANGEIDENTIFIERLOOSE] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIERLOOSE] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIERLOOSE] + ")" + "(?:" + src[PRERELEASELOOSE] + ")?" + src[BUILD] + "?" + ")?)?";
const XRANGE = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";
const XRANGELOOSE = R++;
src[XRANGELOOSE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAINLOOSE] + "$";
// Coercion.
// Extract anything that could conceivably be a part of a valid semver
const COERCE = R++;
src[COERCE] = "(?:^|[^\\d])" + "(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "})" + "(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?" + "(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?" + "(?:$|[^\\d])";
// Tilde ranges.
// Meaning is "reasonably at or greater than"
const LONETILDE = R++;
src[LONETILDE] = "(?:~>?)";
const TILDETRIM = R++;
src[TILDETRIM] = "(\\s*)" + src[LONETILDE] + "\\s+";
re[TILDETRIM] = new RegExp(src[TILDETRIM], "g");
const tildeTrimReplace = "$1~";
const TILDE = R++;
src[TILDE] = "^" + src[LONETILDE] + src[XRANGEPLAIN] + "$";
const TILDELOOSE = R++;
src[TILDELOOSE] = "^" + src[LONETILDE] + src[XRANGEPLAINLOOSE] + "$";
// Caret ranges.
// Meaning is "at least and backwards compatible with"
const LONECARET = R++;
src[LONECARET] = "(?:\\^)";
const CARETTRIM = R++;
src[CARETTRIM] = "(\\s*)" + src[LONECARET] + "\\s+";
re[CARETTRIM] = new RegExp(src[CARETTRIM], "g");
const caretTrimReplace = "$1^";
const CARET = R++;
src[CARET] = "^" + src[LONECARET] + src[XRANGEPLAIN] + "$";
const CARETLOOSE = R++;
src[CARETLOOSE] = "^" + src[LONECARET] + src[XRANGEPLAINLOOSE] + "$";
// A simple gt/lt/eq thing, or just "" to indicate "any version"
const COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = "^" + src[GTLT] + "\\s*(" + LOOSEPLAIN + ")$|^$";
const COMPARATOR = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";
// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
const COMPARATORTRIM = R++;
src[COMPARATORTRIM] = "(\\s*)" + src[GTLT] + "\\s*(" + LOOSEPLAIN + "|" + src[XRANGEPLAIN] + ")";
// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], "g");
const comparatorTrimReplace = "$1$2$3";
// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
const HYPHENRANGE = R++;
src[HYPHENRANGE] = "^\\s*(" + src[XRANGEPLAIN] + ")" + "\\s+-\\s+" + "(" + src[XRANGEPLAIN] + ")" + "\\s*$";
const HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = "^\\s*(" + src[XRANGEPLAINLOOSE] + ")" + "\\s+-\\s+" + "(" + src[XRANGEPLAINLOOSE] + ")" + "\\s*$";
// Star ranges basically just allow anything at all.
const STAR = R++;
src[STAR] = "(<|>)?=?\\s*\\*";
// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for(let i = 0; i < R; i++){
    if (!re[i]) {
        re[i] = new RegExp(src[i]);
    }
}
export function parse(version, optionsOrLoose) {
    if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
        optionsOrLoose = {
            loose: !!optionsOrLoose,
            includePrerelease: false
        };
    }
    if (version instanceof SemVer) {
        return version;
    }
    if (typeof version !== "string") {
        return null;
    }
    if (version.length > MAX_LENGTH) {
        return null;
    }
    const r = optionsOrLoose.loose ? re[LOOSE] : re[FULL];
    if (!r.test(version)) {
        return null;
    }
    try {
        return new SemVer(version, optionsOrLoose);
    } catch (er) {
        return null;
    }
}
export function valid(version, optionsOrLoose) {
    if (version === null) return null;
    const v = parse(version, optionsOrLoose);
    return v ? v.version : null;
}
export function clean(version, optionsOrLoose) {
    const s = parse(version.trim().replace(/^[=v]+/, ""), optionsOrLoose);
    return s ? s.version : null;
}
export class SemVer {
    raw;
    loose;
    options;
    major;
    minor;
    patch;
    version;
    build;
    prerelease;
    constructor(version, optionsOrLoose){
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false
            };
        }
        if (version instanceof SemVer) {
            if (version.loose === optionsOrLoose.loose) {
                return version;
            } else {
                version = version.version;
            }
        } else if (typeof version !== "string") {
            throw new TypeError("Invalid Version: " + version);
        }
        if (version.length > MAX_LENGTH) {
            throw new TypeError("version is longer than " + MAX_LENGTH + " characters");
        }
        if (!(this instanceof SemVer)) {
            return new SemVer(version, optionsOrLoose);
        }
        this.options = optionsOrLoose;
        this.loose = !!optionsOrLoose.loose;
        const m = version.trim().match(optionsOrLoose.loose ? re[LOOSE] : re[FULL]);
        if (!m) {
            throw new TypeError("Invalid Version: " + version);
        }
        this.raw = version;
        // these are actually numbers
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > Number.MAX_SAFE_INTEGER || this.major < 0) {
            throw new TypeError("Invalid major version");
        }
        if (this.minor > Number.MAX_SAFE_INTEGER || this.minor < 0) {
            throw new TypeError("Invalid minor version");
        }
        if (this.patch > Number.MAX_SAFE_INTEGER || this.patch < 0) {
            throw new TypeError("Invalid patch version");
        }
        // numberify any prerelease numeric ids
        if (!m[4]) {
            this.prerelease = [];
        } else {
            this.prerelease = m[4].split(".").map((id)=>{
                if (/^[0-9]+$/.test(id)) {
                    const num = +id;
                    if (num >= 0 && num < Number.MAX_SAFE_INTEGER) {
                        return num;
                    }
                }
                return id;
            });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
    }
    format() {
        this.version = this.major + "." + this.minor + "." + this.patch;
        if (this.prerelease.length) {
            this.version += "-" + this.prerelease.join(".");
        }
        return this.version;
    }
    compare(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        return this.compareMain(other) || this.comparePre(other);
    }
    compareMain(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
    }
    comparePre(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        // NOT having a prerelease is > having one
        if (this.prerelease.length && !other.prerelease.length) {
            return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
            return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
            return 0;
        }
        let i = 0;
        do {
            const a = this.prerelease[i];
            const b = other.prerelease[i];
            if (a === undefined && b === undefined) {
                return 0;
            } else if (b === undefined) {
                return 1;
            } else if (a === undefined) {
                return -1;
            } else if (a === b) {
                continue;
            } else {
                return compareIdentifiers(a, b);
            }
        }while (++i)
        return 1;
    }
    compareBuild(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        let i = 0;
        do {
            const a = this.build[i];
            const b = other.build[i];
            if (a === undefined && b === undefined) {
                return 0;
            } else if (b === undefined) {
                return 1;
            } else if (a === undefined) {
                return -1;
            } else if (a === b) {
                continue;
            } else {
                return compareIdentifiers(a, b);
            }
        }while (++i)
        return 1;
    }
    inc(release, identifier) {
        switch(release){
            case "premajor":
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor = 0;
                this.major++;
                this.inc("pre", identifier);
                break;
            case "preminor":
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor++;
                this.inc("pre", identifier);
                break;
            case "prepatch":
                // If this is already a prerelease, it will bump to the next version
                // drop any prereleases that might already exist, since they are not
                // relevant at this point.
                this.prerelease.length = 0;
                this.inc("patch", identifier);
                this.inc("pre", identifier);
                break;
            // If the input is a non-prerelease version, this acts the same as
            // prepatch.
            case "prerelease":
                if (this.prerelease.length === 0) {
                    this.inc("patch", identifier);
                }
                this.inc("pre", identifier);
                break;
            case "major":
                // If this is a pre-major version, bump up to the same major version.
                // Otherwise increment major.
                // 1.0.0-5 bumps to 1.0.0
                // 1.1.0 bumps to 2.0.0
                if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
                    this.major++;
                }
                this.minor = 0;
                this.patch = 0;
                this.prerelease = [];
                break;
            case "minor":
                // If this is a pre-minor version, bump up to the same minor version.
                // Otherwise increment minor.
                // 1.2.0-5 bumps to 1.2.0
                // 1.2.1 bumps to 1.3.0
                if (this.patch !== 0 || this.prerelease.length === 0) {
                    this.minor++;
                }
                this.patch = 0;
                this.prerelease = [];
                break;
            case "patch":
                // If this is not a pre-release version, it will increment the patch.
                // If it is a pre-release it will bump up to the same patch version.
                // 1.2.0-5 patches to 1.2.0
                // 1.2.0 patches to 1.2.1
                if (this.prerelease.length === 0) {
                    this.patch++;
                }
                this.prerelease = [];
                break;
            // This probably shouldn't be used publicly.
            // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
            case "pre":
                if (this.prerelease.length === 0) {
                    this.prerelease = [
                        0
                    ];
                } else {
                    let i = this.prerelease.length;
                    while(--i >= 0){
                        if (typeof this.prerelease[i] === "number") {
                            this.prerelease[i]++;
                            i = -2;
                        }
                    }
                    if (i === -1) {
                        // didn't increment anything
                        this.prerelease.push(0);
                    }
                }
                if (identifier) {
                    // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
                    // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
                    if (this.prerelease[0] === identifier) {
                        if (isNaN(this.prerelease[1])) {
                            this.prerelease = [
                                identifier,
                                0
                            ];
                        }
                    } else {
                        this.prerelease = [
                            identifier,
                            0
                        ];
                    }
                }
                break;
            default:
                throw new Error("invalid increment argument: " + release);
        }
        this.format();
        this.raw = this.version;
        return this;
    }
    toString() {
        return this.version;
    }
}
/**
 * Return the version incremented by the release type (major, minor, patch, or prerelease), or null if it's not valid.
 */ export function inc(version, release, optionsOrLoose, identifier) {
    if (typeof optionsOrLoose === "string") {
        identifier = optionsOrLoose;
        optionsOrLoose = undefined;
    }
    try {
        return new SemVer(version, optionsOrLoose).inc(release, identifier).version;
    } catch (er) {
        return null;
    }
}
export function diff(version1, version2, optionsOrLoose) {
    if (eq(version1, version2, optionsOrLoose)) {
        return null;
    } else {
        const v1 = parse(version1);
        const v2 = parse(version2);
        let prefix = "";
        let defaultResult = null;
        if (v1 && v2) {
            if (v1.prerelease.length || v2.prerelease.length) {
                prefix = "pre";
                defaultResult = "prerelease";
            }
            for(const key in v1){
                if (key === "major" || key === "minor" || key === "patch") {
                    if (v1[key] !== v2[key]) {
                        return prefix + key;
                    }
                }
            }
        }
        return defaultResult; // may be undefined
    }
}
const numeric = /^[0-9]+$/;
export function compareIdentifiers(a, b) {
    const anum = numeric.test(a);
    const bnum = numeric.test(b);
    if (a === null || b === null) throw "Comparison against null invalid";
    if (anum && bnum) {
        a = +a;
        b = +b;
    }
    return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
}
export function rcompareIdentifiers(a, b) {
    return compareIdentifiers(b, a);
}
function major1(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).major;
}
/**
 * Return the major version number.
 */ export { major1 as major };
function minor1(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).minor;
}
/**
 * Return the minor version number.
 */ export { minor1 as minor };
function patch1(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).patch;
}
/**
 * Return the patch version number.
 */ export { patch1 as patch };
export function compare(v1, v2, optionsOrLoose) {
    return new SemVer(v1, optionsOrLoose).compare(new SemVer(v2, optionsOrLoose));
}
export function compareLoose(a, b) {
    return compare(a, b, true);
}
export function compareBuild(a, b, loose) {
    var versionA = new SemVer(a, loose);
    var versionB = new SemVer(b, loose);
    return versionA.compare(versionB) || versionA.compareBuild(versionB);
}
export function rcompare(v1, v2, optionsOrLoose) {
    return compare(v2, v1, optionsOrLoose);
}
export function sort(list, optionsOrLoose) {
    return list.sort((a, b)=>{
        return compareBuild(a, b, optionsOrLoose);
    });
}
export function rsort(list, optionsOrLoose) {
    return list.sort((a, b)=>{
        return compareBuild(b, a, optionsOrLoose);
    });
}
export function gt(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) > 0;
}
export function lt(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) < 0;
}
export function eq(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) === 0;
}
export function neq(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) !== 0;
}
export function gte(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) >= 0;
}
export function lte(v1, v2, optionsOrLoose) {
    return compare(v1, v2, optionsOrLoose) <= 0;
}
export function cmp(v1, operator, v2, optionsOrLoose) {
    switch(operator){
        case "===":
            if (typeof v1 === "object") v1 = v1.version;
            if (typeof v2 === "object") v2 = v2.version;
            return v1 === v2;
        case "!==":
            if (typeof v1 === "object") v1 = v1.version;
            if (typeof v2 === "object") v2 = v2.version;
            return v1 !== v2;
        case "":
        case "=":
        case "==":
            return eq(v1, v2, optionsOrLoose);
        case "!=":
            return neq(v1, v2, optionsOrLoose);
        case ">":
            return gt(v1, v2, optionsOrLoose);
        case ">=":
            return gte(v1, v2, optionsOrLoose);
        case "<":
            return lt(v1, v2, optionsOrLoose);
        case "<=":
            return lte(v1, v2, optionsOrLoose);
        default:
            throw new TypeError("Invalid operator: " + operator);
    }
}
const ANY = {
};
export class Comparator {
    semver;
    operator;
    value;
    loose;
    options;
    constructor(comp, optionsOrLoose){
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false
            };
        }
        if (comp instanceof Comparator) {
            if (comp.loose === !!optionsOrLoose.loose) {
                return comp;
            } else {
                comp = comp.value;
            }
        }
        if (!(this instanceof Comparator)) {
            return new Comparator(comp, optionsOrLoose);
        }
        this.options = optionsOrLoose;
        this.loose = !!optionsOrLoose.loose;
        this.parse(comp);
        if (this.semver === ANY) {
            this.value = "";
        } else {
            this.value = this.operator + this.semver.version;
        }
    }
    parse(comp) {
        const r = this.options.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
        const m = comp.match(r);
        if (!m) {
            throw new TypeError("Invalid comparator: " + comp);
        }
        const m1 = m[1];
        this.operator = m1 !== undefined ? m1 : "";
        if (this.operator === "=") {
            this.operator = "";
        }
        // if it literally is just '>' or '' then allow anything.
        if (!m[2]) {
            this.semver = ANY;
        } else {
            this.semver = new SemVer(m[2], this.options.loose);
        }
    }
    test(version) {
        if (this.semver === ANY || version === ANY) {
            return true;
        }
        if (typeof version === "string") {
            version = new SemVer(version, this.options);
        }
        return cmp(version, this.operator, this.semver, this.options);
    }
    intersects(comp, optionsOrLoose) {
        if (!(comp instanceof Comparator)) {
            throw new TypeError("a Comparator is required");
        }
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false
            };
        }
        let rangeTmp;
        if (this.operator === "") {
            if (this.value === "") {
                return true;
            }
            rangeTmp = new Range(comp.value, optionsOrLoose);
            return satisfies(this.value, rangeTmp, optionsOrLoose);
        } else if (comp.operator === "") {
            if (comp.value === "") {
                return true;
            }
            rangeTmp = new Range(this.value, optionsOrLoose);
            return satisfies(comp.semver, rangeTmp, optionsOrLoose);
        }
        const sameDirectionIncreasing = (this.operator === ">=" || this.operator === ">") && (comp.operator === ">=" || comp.operator === ">");
        const sameDirectionDecreasing = (this.operator === "<=" || this.operator === "<") && (comp.operator === "<=" || comp.operator === "<");
        const sameSemVer = this.semver.version === comp.semver.version;
        const differentDirectionsInclusive = (this.operator === ">=" || this.operator === "<=") && (comp.operator === ">=" || comp.operator === "<=");
        const oppositeDirectionsLessThan = cmp(this.semver, "<", comp.semver, optionsOrLoose) && (this.operator === ">=" || this.operator === ">") && (comp.operator === "<=" || comp.operator === "<");
        const oppositeDirectionsGreaterThan = cmp(this.semver, ">", comp.semver, optionsOrLoose) && (this.operator === "<=" || this.operator === "<") && (comp.operator === ">=" || comp.operator === ">");
        return sameDirectionIncreasing || sameDirectionDecreasing || sameSemVer && differentDirectionsInclusive || oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
    }
    toString() {
        return this.value;
    }
}
export class Range {
    range;
    raw;
    loose;
    options;
    includePrerelease;
    set;
    constructor(range, optionsOrLoose){
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false
            };
        }
        if (range instanceof Range) {
            if (range.loose === !!optionsOrLoose.loose && range.includePrerelease === !!optionsOrLoose.includePrerelease) {
                return range;
            } else {
                return new Range(range.raw, optionsOrLoose);
            }
        }
        if (range instanceof Comparator) {
            return new Range(range.value, optionsOrLoose);
        }
        if (!(this instanceof Range)) {
            return new Range(range, optionsOrLoose);
        }
        this.options = optionsOrLoose;
        this.loose = !!optionsOrLoose.loose;
        this.includePrerelease = !!optionsOrLoose.includePrerelease;
        // First, split based on boolean or ||
        this.raw = range;
        this.set = range.split(/\s*\|\|\s*/).map((range)=>this.parseRange(range.trim())
        ).filter((c)=>{
            // throw out any that are not relevant for whatever reason
            return c.length;
        });
        if (!this.set.length) {
            throw new TypeError("Invalid SemVer Range: " + range);
        }
        this.format();
    }
    format() {
        this.range = this.set.map((comps)=>comps.join(" ").trim()
        ).join("||").trim();
        return this.range;
    }
    parseRange(range) {
        const loose = this.options.loose;
        range = range.trim();
        // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
        const hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
        range = range.replace(hr, hyphenReplace);
        // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
        range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
        // `~ 1.2.3` => `~1.2.3`
        range = range.replace(re[TILDETRIM], tildeTrimReplace);
        // `^ 1.2.3` => `^1.2.3`
        range = range.replace(re[CARETTRIM], caretTrimReplace);
        // normalize spaces
        range = range.split(/\s+/).join(" ");
        // At this point, the range is completely trimmed and
        // ready to be split into comparators.
        const compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
        let set = range.split(" ").map((comp)=>parseComparator(comp, this.options)
        ).join(" ").split(/\s+/);
        if (this.options.loose) {
            // in loose mode, throw out any that are not valid comparators
            set = set.filter((comp)=>{
                return !!comp.match(compRe);
            });
        }
        return set.map((comp)=>new Comparator(comp, this.options)
        );
    }
    test(version) {
        if (typeof version === "string") {
            version = new SemVer(version, this.options);
        }
        for(var i1 = 0; i1 < this.set.length; i1++){
            if (testSet(this.set[i1], version, this.options)) {
                return true;
            }
        }
        return false;
    }
    intersects(range, optionsOrLoose) {
        if (!(range instanceof Range)) {
            throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators)=>{
            return isSatisfiable(thisComparators, optionsOrLoose) && range.set.some((rangeComparators)=>{
                return isSatisfiable(rangeComparators, optionsOrLoose) && thisComparators.every((thisComparator)=>{
                    return rangeComparators.every((rangeComparator)=>{
                        return thisComparator.intersects(rangeComparator, optionsOrLoose);
                    });
                });
            });
        });
    }
    toString() {
        return this.range;
    }
}
function testSet(set, version, options) {
    for(let i = 0; i < set.length; i++){
        if (!set[i].test(version)) {
            return false;
        }
    }
    if (version.prerelease.length && !options.includePrerelease) {
        // Find the set of versions that are allowed to have prereleases
        // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
        // That should allow `1.2.3-pr.2` to pass.
        // However, `1.2.4-alpha.notready` should NOT be allowed,
        // even though it's within the range set by the comparators.
        for(let i = 0; i < set.length; i++){
            if (set[i].semver === ANY) {
                continue;
            }
            if (set[i].semver.prerelease.length > 0) {
                const allowed = set[i].semver;
                if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
                    return true;
                }
            }
        }
        // Version has a -pre, but it's not one of the ones we like.
        return false;
    }
    return true;
}
// take a set of comparators and determine whether there
// exists a version which can satisfy it
function isSatisfiable(comparators, options) {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while(result && remainingComparators.length){
        result = remainingComparators.every((otherComparator)=>{
            return testComparator?.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
    }
    return result;
}
// Mostly just for testing and legacy API reasons
export function toComparators(range, optionsOrLoose) {
    return new Range(range, optionsOrLoose).set.map((comp)=>{
        return comp.map((c)=>c.value
        ).join(" ").trim().split(" ");
    });
}
// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, options) {
    comp = replaceCarets(comp, options);
    comp = replaceTildes(comp, options);
    comp = replaceXRanges(comp, options);
    comp = replaceStars(comp, options);
    return comp;
}
function isX(id) {
    return !id || id.toLowerCase() === "x" || id === "*";
}
// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, options) {
    return comp.trim().split(/\s+/).map((comp)=>replaceTilde(comp, options)
    ).join(" ");
}
function replaceTilde(comp, options) {
    const r = options.loose ? re[TILDELOOSE] : re[TILDE];
    return comp.replace(r, (_, M, m, p, pr)=>{
        let ret;
        if (isX(M)) {
            ret = "";
        } else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (isX(p)) {
            // ~1.2 == >=1.2.0 <1.3.0
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        } else if (pr) {
            ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
        } else {
            // ~1.2.3 == >=1.2.3 <1.3.0
            ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, options) {
    return comp.trim().split(/\s+/).map((comp)=>replaceCaret(comp, options)
    ).join(" ");
}
function replaceCaret(comp, options) {
    const r = options.loose ? re[CARETLOOSE] : re[CARET];
    return comp.replace(r, (_, M, m, p, pr)=>{
        let ret;
        if (isX(M)) {
            ret = "";
        } else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (isX(p)) {
            if (M === "0") {
                ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
            } else {
                ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
            }
        } else if (pr) {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + m + "." + (+p + 1);
                } else {
                    ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
                }
            } else {
                ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) + ".0.0";
            }
        } else {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." + (+p + 1);
                } else {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
                }
            } else {
                ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
            }
        }
        return ret;
    });
}
function replaceXRanges(comp, options) {
    return comp.split(/\s+/).map((comp)=>replaceXRange(comp, options)
    ).join(" ");
}
function replaceXRange(comp, options) {
    comp = comp.trim();
    const r = options.loose ? re[XRANGELOOSE] : re[XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr)=>{
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
            gtlt = "";
        }
        if (xM) {
            if (gtlt === ">" || gtlt === "<") {
                // nothing is allowed
                ret = "<0.0.0";
            } else {
                // nothing is forbidden
                ret = "*";
            }
        } else if (gtlt && anyX) {
            // we know patch is an x, because we have any x at all.
            // replace X with 0
            if (xm) {
                m = 0;
            }
            p = 0;
            if (gtlt === ">") {
                // >1 => >=2.0.0
                // >1.2 => >=1.3.0
                // >1.2.3 => >= 1.2.4
                gtlt = ">=";
                if (xm) {
                    M = +M + 1;
                    m = 0;
                    p = 0;
                } else {
                    m = +m + 1;
                    p = 0;
                }
            } else if (gtlt === "<=") {
                // <=0.7.x is actually <0.8.0, since any 0.7.x should
                // pass.  Similarly, <=7.x is actually <8.0.0, etc.
                gtlt = "<";
                if (xm) {
                    M = +M + 1;
                } else {
                    m = +m + 1;
                }
            }
            ret = gtlt + M + "." + m + "." + p;
        } else if (xm) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (xp) {
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, options) {
    // Looseness is ignored here.  star is always as loose as it gets!
    return comp.trim().replace(re[STAR], "");
}
// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
    if (isX(fM)) {
        from = "";
    } else if (isX(fm)) {
        from = ">=" + fM + ".0.0";
    } else if (isX(fp)) {
        from = ">=" + fM + "." + fm + ".0";
    } else {
        from = ">=" + from;
    }
    if (isX(tM)) {
        to = "";
    } else if (isX(tm)) {
        to = "<" + (+tM + 1) + ".0.0";
    } else if (isX(tp)) {
        to = "<" + tM + "." + (+tm + 1) + ".0";
    } else if (tpr) {
        to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
    } else {
        to = "<=" + to;
    }
    return (from + " " + to).trim();
}
export function satisfies(version, range, optionsOrLoose) {
    try {
        range = new Range(range, optionsOrLoose);
    } catch (er) {
        return false;
    }
    return range.test(version);
}
export function maxSatisfying(versions, range, optionsOrLoose) {
    //todo
    var max = null;
    var maxSV = null;
    try {
        var rangeObj = new Range(range, optionsOrLoose);
    } catch (er) {
        return null;
    }
    versions.forEach((v)=>{
        if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!max || maxSV && maxSV.compare(v) === -1) {
                // compare(max, v, true)
                max = v;
                maxSV = new SemVer(max, optionsOrLoose);
            }
        }
    });
    return max;
}
export function minSatisfying(versions, range, optionsOrLoose) {
    //todo
    var min = null;
    var minSV = null;
    try {
        var rangeObj = new Range(range, optionsOrLoose);
    } catch (er) {
        return null;
    }
    versions.forEach((v)=>{
        if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!min || minSV.compare(v) === 1) {
                // compare(min, v, true)
                min = v;
                minSV = new SemVer(min, optionsOrLoose);
            }
        }
    });
    return min;
}
export function minVersion(range, optionsOrLoose) {
    range = new Range(range, optionsOrLoose);
    var minver = new SemVer("0.0.0");
    if (range.test(minver)) {
        return minver;
    }
    minver = new SemVer("0.0.0-0");
    if (range.test(minver)) {
        return minver;
    }
    minver = null;
    for(var i1 = 0; i1 < range.set.length; ++i1){
        var comparators = range.set[i1];
        comparators.forEach((comparator)=>{
            // Clone to avoid manipulating the comparator's semver object.
            var compver = new SemVer(comparator.semver.version);
            switch(comparator.operator){
                case ">":
                    if (compver.prerelease.length === 0) {
                        compver.patch++;
                    } else {
                        compver.prerelease.push(0);
                    }
                    compver.raw = compver.format();
                /* fallthrough */ case "":
                case ">=":
                    if (!minver || gt(minver, compver)) {
                        minver = compver;
                    }
                    break;
                case "<":
                case "<=":
                    break;
                /* istanbul ignore next */ default:
                    throw new Error("Unexpected operation: " + comparator.operator);
            }
        });
    }
    if (minver && range.test(minver)) {
        return minver;
    }
    return null;
}
export function validRange(range, optionsOrLoose) {
    try {
        if (range === null) return null;
        // Return '*' instead of '' so that truthiness works.
        // This will throw if it's invalid anyway
        return new Range(range, optionsOrLoose).range || "*";
    } catch (er) {
        return null;
    }
}
/**
 * Return true if version is less than all the versions possible in the range.
 */ export function ltr(version, range, optionsOrLoose) {
    return outside(version, range, "<", optionsOrLoose);
}
/**
 * Return true if version is greater than all the versions possible in the range.
 */ export function gtr(version, range, optionsOrLoose) {
    return outside(version, range, ">", optionsOrLoose);
}
/**
 * Return true if the version is outside the bounds of the range in either the high or low direction.
 * The hilo argument must be either the string '>' or '<'. (This is the function called by gtr and ltr.)
 */ export function outside(version, range, hilo, optionsOrLoose) {
    version = new SemVer(version, optionsOrLoose);
    range = new Range(range, optionsOrLoose);
    let gtfn;
    let ltefn;
    let ltfn;
    let comp;
    let ecomp;
    switch(hilo){
        case ">":
            gtfn = gt;
            ltefn = lte;
            ltfn = lt;
            comp = ">";
            ecomp = ">=";
            break;
        case "<":
            gtfn = lt;
            ltefn = gte;
            ltfn = gt;
            comp = "<";
            ecomp = "<=";
            break;
        default:
            throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    // If it satisifes the range it is not outside
    if (satisfies(version, range, optionsOrLoose)) {
        return false;
    }
    // From now on, variable terms are as if we're in "gtr" mode.
    // but note that everything is flipped for the "ltr" function.
    for(let i = 0; i < range.set.length; ++i){
        const comparators = range.set[i];
        let high = null;
        let low = null;
        for (let comparator of comparators){
            if (comparator.semver === ANY) {
                comparator = new Comparator(">=0.0.0");
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver, optionsOrLoose)) {
                high = comparator;
            } else if (ltfn(comparator.semver, low.semver, optionsOrLoose)) {
                low = comparator;
            }
        }
        if (high === null || low === null) return true;
        // If the edge version comparator has a operator then our version
        // isn't outside it
        if (high.operator === comp || high.operator === ecomp) {
            return false;
        }
        // If the lowest version comparator has an operator and our version
        // is less than it then it isn't higher than the range
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
            return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
        }
    }
    return true;
}
function prerelease1(version, optionsOrLoose) {
    var parsed = parse(version, optionsOrLoose);
    return parsed && parsed.prerelease.length ? parsed.prerelease : null;
}
export { prerelease1 as prerelease };
/**
 * Return true if any of the ranges comparators intersect
 */ export function intersects(range1, range2, optionsOrLoose) {
    range1 = new Range(range1, optionsOrLoose);
    range2 = new Range(range2, optionsOrLoose);
    return range1.intersects(range2);
}
/**
 * Coerces a string to semver if possible
 */ export function coerce(version, optionsOrLoose) {
    if (version instanceof SemVer) {
        return version;
    }
    if (typeof version !== "string") {
        return null;
    }
    const match = version.match(re[COERCE]);
    if (match == null) {
        return null;
    }
    return parse(match[1] + "." + (match[2] || "0") + "." + (match[3] || "0"), optionsOrLoose);
}
export default SemVer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvc2VtdmVyQHYxLjQuMC9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHR5cGUgUmVsZWFzZVR5cGUgPVxuICB8IFwicHJlXCJcbiAgfCBcIm1ham9yXCJcbiAgfCBcInByZW1ham9yXCJcbiAgfCBcIm1pbm9yXCJcbiAgfCBcInByZW1pbm9yXCJcbiAgfCBcInBhdGNoXCJcbiAgfCBcInByZXBhdGNoXCJcbiAgfCBcInByZXJlbGVhc2VcIjtcblxuZXhwb3J0IHR5cGUgT3BlcmF0b3IgPVxuICB8IFwiPT09XCJcbiAgfCBcIiE9PVwiXG4gIHwgXCJcIlxuICB8IFwiPVwiXG4gIHwgXCI9PVwiXG4gIHwgXCIhPVwiXG4gIHwgXCI+XCJcbiAgfCBcIj49XCJcbiAgfCBcIjxcIlxuICB8IFwiPD1cIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgbG9vc2U/OiBib29sZWFuO1xuICBpbmNsdWRlUHJlcmVsZWFzZT86IGJvb2xlYW47XG59XG5cbi8vIE5vdGU6IHRoaXMgaXMgdGhlIHNlbXZlci5vcmcgdmVyc2lvbiBvZiB0aGUgc3BlYyB0aGF0IGl0IGltcGxlbWVudHNcbi8vIE5vdCBuZWNlc3NhcmlseSB0aGUgcGFja2FnZSB2ZXJzaW9uIG9mIHRoaXMgY29kZS5cbmV4cG9ydCBjb25zdCBTRU1WRVJfU1BFQ19WRVJTSU9OID0gXCIyLjAuMFwiO1xuXG5jb25zdCBNQVhfTEVOR1RIOiBudW1iZXIgPSAyNTY7XG5cbi8vIE1heCBzYWZlIHNlZ21lbnQgbGVuZ3RoIGZvciBjb2VyY2lvbi5cbmNvbnN0IE1BWF9TQUZFX0NPTVBPTkVOVF9MRU5HVEg6IG51bWJlciA9IDE2O1xuXG4vLyBUaGUgYWN0dWFsIHJlZ2V4cHNcbmNvbnN0IHJlOiBSZWdFeHBbXSA9IFtdO1xuY29uc3Qgc3JjOiBzdHJpbmdbXSA9IFtdO1xubGV0IFI6IG51bWJlciA9IDA7XG5cbi8vIFRoZSBmb2xsb3dpbmcgUmVndWxhciBFeHByZXNzaW9ucyBjYW4gYmUgdXNlZCBmb3IgdG9rZW5pemluZyxcbi8vIHZhbGlkYXRpbmcsIGFuZCBwYXJzaW5nIFNlbVZlciB2ZXJzaW9uIHN0cmluZ3MuXG5cbi8vICMjIE51bWVyaWMgSWRlbnRpZmllclxuLy8gQSBzaW5nbGUgYDBgLCBvciBhIG5vbi16ZXJvIGRpZ2l0IGZvbGxvd2VkIGJ5IHplcm8gb3IgbW9yZSBkaWdpdHMuXG5cbmNvbnN0IE5VTUVSSUNJREVOVElGSUVSOiBudW1iZXIgPSBSKys7XG5zcmNbTlVNRVJJQ0lERU5USUZJRVJdID0gXCIwfFsxLTldXFxcXGQqXCI7XG5jb25zdCBOVU1FUklDSURFTlRJRklFUkxPT1NFOiBudW1iZXIgPSBSKys7XG5zcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gPSBcIlswLTldK1wiO1xuXG4vLyAjIyBOb24tbnVtZXJpYyBJZGVudGlmaWVyXG4vLyBaZXJvIG9yIG1vcmUgZGlnaXRzLCBmb2xsb3dlZCBieSBhIGxldHRlciBvciBoeXBoZW4sIGFuZCB0aGVuIHplcm8gb3Jcbi8vIG1vcmUgbGV0dGVycywgZGlnaXRzLCBvciBoeXBoZW5zLlxuXG5jb25zdCBOT05OVU1FUklDSURFTlRJRklFUjogbnVtYmVyID0gUisrO1xuc3JjW05PTk5VTUVSSUNJREVOVElGSUVSXSA9IFwiXFxcXGQqW2EtekEtWi1dW2EtekEtWjAtOS1dKlwiO1xuXG4vLyAjIyBNYWluIFZlcnNpb25cbi8vIFRocmVlIGRvdC1zZXBhcmF0ZWQgbnVtZXJpYyBpZGVudGlmaWVycy5cblxuY29uc3QgTUFJTlZFUlNJT046IG51bWJlciA9IFIrKztcbmNvbnN0IG5pZCA9IHNyY1tOVU1FUklDSURFTlRJRklFUl07XG5zcmNbTUFJTlZFUlNJT05dID0gYCgke25pZH0pXFxcXC4oJHtuaWR9KVxcXFwuKCR7bmlkfSlgO1xuXG5jb25zdCBNQUlOVkVSU0lPTkxPT1NFOiBudW1iZXIgPSBSKys7XG5jb25zdCBuaWRsID0gc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdO1xuc3JjW01BSU5WRVJTSU9OTE9PU0VdID0gYCgke25pZGx9KVxcXFwuKCR7bmlkbH0pXFxcXC4oJHtuaWRsfSlgO1xuXG4vLyAjIyBQcmUtcmVsZWFzZSBWZXJzaW9uIElkZW50aWZpZXJcbi8vIEEgbnVtZXJpYyBpZGVudGlmaWVyLCBvciBhIG5vbi1udW1lcmljIGlkZW50aWZpZXIuXG5cbmNvbnN0IFBSRVJFTEVBU0VJREVOVElGSUVSOiBudW1iZXIgPSBSKys7XG5zcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdID0gXCIoPzpcIiArIHNyY1tOVU1FUklDSURFTlRJRklFUl0gKyBcInxcIiArXG4gIHNyY1tOT05OVU1FUklDSURFTlRJRklFUl0gKyBcIilcIjtcblxuY29uc3QgUFJFUkVMRUFTRUlERU5USUZJRVJMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSTE9PU0VdID0gXCIoPzpcIiArIHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArIFwifFwiICtcbiAgc3JjW05PTk5VTUVSSUNJREVOVElGSUVSXSArIFwiKVwiO1xuXG4vLyAjIyBQcmUtcmVsZWFzZSBWZXJzaW9uXG4vLyBIeXBoZW4sIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIGRvdC1zZXBhcmF0ZWQgcHJlLXJlbGVhc2UgdmVyc2lvblxuLy8gaWRlbnRpZmllcnMuXG5cbmNvbnN0IFBSRVJFTEVBU0U6IG51bWJlciA9IFIrKztcbnNyY1tQUkVSRUxFQVNFXSA9IFwiKD86LShcIiArXG4gIHNyY1tQUkVSRUxFQVNFSURFTlRJRklFUl0gK1xuICBcIig/OlxcXFwuXCIgK1xuICBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdICtcbiAgXCIpKikpXCI7XG5cbmNvbnN0IFBSRVJFTEVBU0VMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW1BSRVJFTEVBU0VMT09TRV0gPSBcIig/Oi0/KFwiICtcbiAgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSTE9PU0VdICtcbiAgXCIoPzpcXFxcLlwiICtcbiAgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSTE9PU0VdICtcbiAgXCIpKikpXCI7XG5cbi8vICMjIEJ1aWxkIE1ldGFkYXRhIElkZW50aWZpZXJcbi8vIEFueSBjb21iaW5hdGlvbiBvZiBkaWdpdHMsIGxldHRlcnMsIG9yIGh5cGhlbnMuXG5cbmNvbnN0IEJVSUxESURFTlRJRklFUjogbnVtYmVyID0gUisrO1xuc3JjW0JVSUxESURFTlRJRklFUl0gPSBcIlswLTlBLVphLXotXStcIjtcblxuLy8gIyMgQnVpbGQgTWV0YWRhdGFcbi8vIFBsdXMgc2lnbiwgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgcGVyaW9kLXNlcGFyYXRlZCBidWlsZCBtZXRhZGF0YVxuLy8gaWRlbnRpZmllcnMuXG5cbmNvbnN0IEJVSUxEOiBudW1iZXIgPSBSKys7XG5zcmNbQlVJTERdID0gXCIoPzpcXFxcKyhcIiArIHNyY1tCVUlMRElERU5USUZJRVJdICsgXCIoPzpcXFxcLlwiICtcbiAgc3JjW0JVSUxESURFTlRJRklFUl0gKyBcIikqKSlcIjtcblxuLy8gIyMgRnVsbCBWZXJzaW9uIFN0cmluZ1xuLy8gQSBtYWluIHZlcnNpb24sIGZvbGxvd2VkIG9wdGlvbmFsbHkgYnkgYSBwcmUtcmVsZWFzZSB2ZXJzaW9uIGFuZFxuLy8gYnVpbGQgbWV0YWRhdGEuXG5cbi8vIE5vdGUgdGhhdCB0aGUgb25seSBtYWpvciwgbWlub3IsIHBhdGNoLCBhbmQgcHJlLXJlbGVhc2Ugc2VjdGlvbnMgb2Zcbi8vIHRoZSB2ZXJzaW9uIHN0cmluZyBhcmUgY2FwdHVyaW5nIGdyb3Vwcy4gIFRoZSBidWlsZCBtZXRhZGF0YSBpcyBub3QgYVxuLy8gY2FwdHVyaW5nIGdyb3VwLCBiZWNhdXNlIGl0IHNob3VsZCBub3QgZXZlciBiZSB1c2VkIGluIHZlcnNpb25cbi8vIGNvbXBhcmlzb24uXG5cbmNvbnN0IEZVTEw6IG51bWJlciA9IFIrKztcbmNvbnN0IEZVTExQTEFJTiA9IFwidj9cIiArIHNyY1tNQUlOVkVSU0lPTl0gKyBzcmNbUFJFUkVMRUFTRV0gKyBcIj9cIiArIHNyY1tCVUlMRF0gK1xuICBcIj9cIjtcblxuc3JjW0ZVTExdID0gXCJeXCIgKyBGVUxMUExBSU4gKyBcIiRcIjtcblxuLy8gbGlrZSBmdWxsLCBidXQgYWxsb3dzIHYxLjIuMyBhbmQgPTEuMi4zLCB3aGljaCBwZW9wbGUgZG8gc29tZXRpbWVzLlxuLy8gYWxzbywgMS4wLjBhbHBoYTEgKHByZXJlbGVhc2Ugd2l0aG91dCB0aGUgaHlwaGVuKSB3aGljaCBpcyBwcmV0dHlcbi8vIGNvbW1vbiBpbiB0aGUgbnBtIHJlZ2lzdHJ5LlxuY29uc3QgTE9PU0VQTEFJTjogc3RyaW5nID0gXCJbdj1cXFxcc10qXCIgK1xuICBzcmNbTUFJTlZFUlNJT05MT09TRV0gK1xuICBzcmNbUFJFUkVMRUFTRUxPT1NFXSArXG4gIFwiP1wiICtcbiAgc3JjW0JVSUxEXSArXG4gIFwiP1wiO1xuXG5jb25zdCBMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW0xPT1NFXSA9IFwiXlwiICsgTE9PU0VQTEFJTiArIFwiJFwiO1xuXG5jb25zdCBHVExUOiBudW1iZXIgPSBSKys7XG5zcmNbR1RMVF0gPSBcIigoPzo8fD4pPz0/KVwiO1xuXG4vLyBTb21ldGhpbmcgbGlrZSBcIjIuKlwiIG9yIFwiMS4yLnhcIi5cbi8vIE5vdGUgdGhhdCBcIngueFwiIGlzIGEgdmFsaWQgeFJhbmdlIGlkZW50aWZlciwgbWVhbmluZyBcImFueSB2ZXJzaW9uXCJcbi8vIE9ubHkgdGhlIGZpcnN0IGl0ZW0gaXMgc3RyaWN0bHkgcmVxdWlyZWQuXG5jb25zdCBYUkFOR0VJREVOVElGSUVSTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdID0gc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdICsgXCJ8eHxYfFxcXFwqXCI7XG5jb25zdCBYUkFOR0VJREVOVElGSUVSOiBudW1iZXIgPSBSKys7XG5zcmNbWFJBTkdFSURFTlRJRklFUl0gPSBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICsgXCJ8eHxYfFxcXFwqXCI7XG5cbmNvbnN0IFhSQU5HRVBMQUlOOiBudW1iZXIgPSBSKys7XG5zcmNbWFJBTkdFUExBSU5dID0gXCJbdj1cXFxcc10qKFwiICtcbiAgc3JjW1hSQU5HRUlERU5USUZJRVJdICtcbiAgXCIpXCIgK1xuICBcIig/OlxcXFwuKFwiICtcbiAgc3JjW1hSQU5HRUlERU5USUZJRVJdICtcbiAgXCIpXCIgK1xuICBcIig/OlxcXFwuKFwiICtcbiAgc3JjW1hSQU5HRUlERU5USUZJRVJdICtcbiAgXCIpXCIgK1xuICBcIig/OlwiICtcbiAgc3JjW1BSRVJFTEVBU0VdICtcbiAgXCIpP1wiICtcbiAgc3JjW0JVSUxEXSArXG4gIFwiP1wiICtcbiAgXCIpPyk/XCI7XG5cbmNvbnN0IFhSQU5HRVBMQUlOTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tYUkFOR0VQTEFJTkxPT1NFXSA9IFwiW3Y9XFxcXHNdKihcIiArXG4gIHNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdICtcbiAgXCIpXCIgK1xuICBcIig/OlxcXFwuKFwiICtcbiAgc3JjW1hSQU5HRUlERU5USUZJRVJMT09TRV0gK1xuICBcIilcIiArXG4gIFwiKD86XFxcXC4oXCIgK1xuICBzcmNbWFJBTkdFSURFTlRJRklFUkxPT1NFXSArXG4gIFwiKVwiICtcbiAgXCIoPzpcIiArXG4gIHNyY1tQUkVSRUxFQVNFTE9PU0VdICtcbiAgXCIpP1wiICtcbiAgc3JjW0JVSUxEXSArXG4gIFwiP1wiICtcbiAgXCIpPyk/XCI7XG5cbmNvbnN0IFhSQU5HRTogbnVtYmVyID0gUisrO1xuc3JjW1hSQU5HRV0gPSBcIl5cIiArIHNyY1tHVExUXSArIFwiXFxcXHMqXCIgKyBzcmNbWFJBTkdFUExBSU5dICsgXCIkXCI7XG5jb25zdCBYUkFOR0VMT09TRSA9IFIrKztcbnNyY1tYUkFOR0VMT09TRV0gPSBcIl5cIiArIHNyY1tHVExUXSArIFwiXFxcXHMqXCIgKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyBcIiRcIjtcblxuLy8gQ29lcmNpb24uXG4vLyBFeHRyYWN0IGFueXRoaW5nIHRoYXQgY291bGQgY29uY2VpdmFibHkgYmUgYSBwYXJ0IG9mIGEgdmFsaWQgc2VtdmVyXG5jb25zdCBDT0VSQ0U6IG51bWJlciA9IFIrKztcbnNyY1tDT0VSQ0VdID0gXCIoPzpefFteXFxcXGRdKVwiICtcbiAgXCIoXFxcXGR7MSxcIiArXG4gIE1BWF9TQUZFX0NPTVBPTkVOVF9MRU5HVEggK1xuICBcIn0pXCIgK1xuICBcIig/OlxcXFwuKFxcXFxkezEsXCIgK1xuICBNQVhfU0FGRV9DT01QT05FTlRfTEVOR1RIICtcbiAgXCJ9KSk/XCIgK1xuICBcIig/OlxcXFwuKFxcXFxkezEsXCIgK1xuICBNQVhfU0FGRV9DT01QT05FTlRfTEVOR1RIICtcbiAgXCJ9KSk/XCIgK1xuICBcIig/OiR8W15cXFxcZF0pXCI7XG5cbi8vIFRpbGRlIHJhbmdlcy5cbi8vIE1lYW5pbmcgaXMgXCJyZWFzb25hYmx5IGF0IG9yIGdyZWF0ZXIgdGhhblwiXG5jb25zdCBMT05FVElMREU6IG51bWJlciA9IFIrKztcbnNyY1tMT05FVElMREVdID0gXCIoPzp+Pj8pXCI7XG5cbmNvbnN0IFRJTERFVFJJTTogbnVtYmVyID0gUisrO1xuc3JjW1RJTERFVFJJTV0gPSBcIihcXFxccyopXCIgKyBzcmNbTE9ORVRJTERFXSArIFwiXFxcXHMrXCI7XG5yZVtUSUxERVRSSU1dID0gbmV3IFJlZ0V4cChzcmNbVElMREVUUklNXSwgXCJnXCIpO1xuY29uc3QgdGlsZGVUcmltUmVwbGFjZTogc3RyaW5nID0gXCIkMX5cIjtcblxuY29uc3QgVElMREU6IG51bWJlciA9IFIrKztcbnNyY1tUSUxERV0gPSBcIl5cIiArIHNyY1tMT05FVElMREVdICsgc3JjW1hSQU5HRVBMQUlOXSArIFwiJFwiO1xuY29uc3QgVElMREVMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW1RJTERFTE9PU0VdID0gXCJeXCIgKyBzcmNbTE9ORVRJTERFXSArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArIFwiJFwiO1xuXG4vLyBDYXJldCByYW5nZXMuXG4vLyBNZWFuaW5nIGlzIFwiYXQgbGVhc3QgYW5kIGJhY2t3YXJkcyBjb21wYXRpYmxlIHdpdGhcIlxuY29uc3QgTE9ORUNBUkVUOiBudW1iZXIgPSBSKys7XG5zcmNbTE9ORUNBUkVUXSA9IFwiKD86XFxcXF4pXCI7XG5cbmNvbnN0IENBUkVUVFJJTTogbnVtYmVyID0gUisrO1xuc3JjW0NBUkVUVFJJTV0gPSBcIihcXFxccyopXCIgKyBzcmNbTE9ORUNBUkVUXSArIFwiXFxcXHMrXCI7XG5yZVtDQVJFVFRSSU1dID0gbmV3IFJlZ0V4cChzcmNbQ0FSRVRUUklNXSwgXCJnXCIpO1xuY29uc3QgY2FyZXRUcmltUmVwbGFjZTogc3RyaW5nID0gXCIkMV5cIjtcblxuY29uc3QgQ0FSRVQ6IG51bWJlciA9IFIrKztcbnNyY1tDQVJFVF0gPSBcIl5cIiArIHNyY1tMT05FQ0FSRVRdICsgc3JjW1hSQU5HRVBMQUlOXSArIFwiJFwiO1xuY29uc3QgQ0FSRVRMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW0NBUkVUTE9PU0VdID0gXCJeXCIgKyBzcmNbTE9ORUNBUkVUXSArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArIFwiJFwiO1xuXG4vLyBBIHNpbXBsZSBndC9sdC9lcSB0aGluZywgb3IganVzdCBcIlwiIHRvIGluZGljYXRlIFwiYW55IHZlcnNpb25cIlxuY29uc3QgQ09NUEFSQVRPUkxPT1NFOiBudW1iZXIgPSBSKys7XG5zcmNbQ09NUEFSQVRPUkxPT1NFXSA9IFwiXlwiICsgc3JjW0dUTFRdICsgXCJcXFxccyooXCIgKyBMT09TRVBMQUlOICsgXCIpJHxeJFwiO1xuY29uc3QgQ09NUEFSQVRPUjogbnVtYmVyID0gUisrO1xuc3JjW0NPTVBBUkFUT1JdID0gXCJeXCIgKyBzcmNbR1RMVF0gKyBcIlxcXFxzKihcIiArIEZVTExQTEFJTiArIFwiKSR8XiRcIjtcblxuLy8gQW4gZXhwcmVzc2lvbiB0byBzdHJpcCBhbnkgd2hpdGVzcGFjZSBiZXR3ZWVuIHRoZSBndGx0IGFuZCB0aGUgdGhpbmdcbi8vIGl0IG1vZGlmaWVzLCBzbyB0aGF0IGA+IDEuMi4zYCA9PT4gYD4xLjIuM2BcbmNvbnN0IENPTVBBUkFUT1JUUklNOiBudW1iZXIgPSBSKys7XG5zcmNbQ09NUEFSQVRPUlRSSU1dID0gXCIoXFxcXHMqKVwiICsgc3JjW0dUTFRdICsgXCJcXFxccyooXCIgKyBMT09TRVBMQUlOICsgXCJ8XCIgK1xuICBzcmNbWFJBTkdFUExBSU5dICsgXCIpXCI7XG5cbi8vIHRoaXMgb25lIGhhcyB0byB1c2UgdGhlIC9nIGZsYWdcbnJlW0NPTVBBUkFUT1JUUklNXSA9IG5ldyBSZWdFeHAoc3JjW0NPTVBBUkFUT1JUUklNXSwgXCJnXCIpO1xuY29uc3QgY29tcGFyYXRvclRyaW1SZXBsYWNlOiBzdHJpbmcgPSBcIiQxJDIkM1wiO1xuXG4vLyBTb21ldGhpbmcgbGlrZSBgMS4yLjMgLSAxLjIuNGBcbi8vIE5vdGUgdGhhdCB0aGVzZSBhbGwgdXNlIHRoZSBsb29zZSBmb3JtLCBiZWNhdXNlIHRoZXknbGwgYmVcbi8vIGNoZWNrZWQgYWdhaW5zdCBlaXRoZXIgdGhlIHN0cmljdCBvciBsb29zZSBjb21wYXJhdG9yIGZvcm1cbi8vIGxhdGVyLlxuY29uc3QgSFlQSEVOUkFOR0U6IG51bWJlciA9IFIrKztcbnNyY1tIWVBIRU5SQU5HRV0gPSBcIl5cXFxccyooXCIgK1xuICBzcmNbWFJBTkdFUExBSU5dICtcbiAgXCIpXCIgK1xuICBcIlxcXFxzKy1cXFxccytcIiArXG4gIFwiKFwiICtcbiAgc3JjW1hSQU5HRVBMQUlOXSArXG4gIFwiKVwiICtcbiAgXCJcXFxccyokXCI7XG5cbmNvbnN0IEhZUEhFTlJBTkdFTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tIWVBIRU5SQU5HRUxPT1NFXSA9IFwiXlxcXFxzKihcIiArXG4gIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArXG4gIFwiKVwiICtcbiAgXCJcXFxccystXFxcXHMrXCIgK1xuICBcIihcIiArXG4gIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArXG4gIFwiKVwiICtcbiAgXCJcXFxccyokXCI7XG5cbi8vIFN0YXIgcmFuZ2VzIGJhc2ljYWxseSBqdXN0IGFsbG93IGFueXRoaW5nIGF0IGFsbC5cbmNvbnN0IFNUQVI6IG51bWJlciA9IFIrKztcbnNyY1tTVEFSXSA9IFwiKDx8Pik/PT9cXFxccypcXFxcKlwiO1xuXG4vLyBDb21waWxlIHRvIGFjdHVhbCByZWdleHAgb2JqZWN0cy5cbi8vIEFsbCBhcmUgZmxhZy1mcmVlLCB1bmxlc3MgdGhleSB3ZXJlIGNyZWF0ZWQgYWJvdmUgd2l0aCBhIGZsYWcuXG5mb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgUjsgaSsrKSB7XG4gIGlmICghcmVbaV0pIHtcbiAgICByZVtpXSA9IG5ldyBSZWdFeHAoc3JjW2ldKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoXG4gIHZlcnNpb246IHN0cmluZyB8IFNlbVZlciB8IG51bGwsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBTZW1WZXIgfCBudWxsIHtcbiAgaWYgKCFvcHRpb25zT3JMb29zZSB8fCB0eXBlb2Ygb3B0aW9uc09yTG9vc2UgIT09IFwib2JqZWN0XCIpIHtcbiAgICBvcHRpb25zT3JMb29zZSA9IHtcbiAgICAgIGxvb3NlOiAhIW9wdGlvbnNPckxvb3NlLFxuICAgICAgaW5jbHVkZVByZXJlbGVhc2U6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICBpZiAodmVyc2lvbiBpbnN0YW5jZW9mIFNlbVZlcikge1xuICAgIHJldHVybiB2ZXJzaW9uO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2ZXJzaW9uICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAodmVyc2lvbi5sZW5ndGggPiBNQVhfTEVOR1RIKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCByOiBSZWdFeHAgPSBvcHRpb25zT3JMb29zZS5sb29zZSA/IHJlW0xPT1NFXSA6IHJlW0ZVTExdO1xuICBpZiAoIXIudGVzdCh2ZXJzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IFNlbVZlcih2ZXJzaW9uLCBvcHRpb25zT3JMb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIgfCBudWxsLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh2ZXJzaW9uID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdjogU2VtVmVyIHwgbnVsbCA9IHBhcnNlKHZlcnNpb24sIG9wdGlvbnNPckxvb3NlKTtcbiAgcmV0dXJuIHYgPyB2LnZlcnNpb24gOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW4oXG4gIHZlcnNpb246IHN0cmluZyxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzOiBTZW1WZXIgfCBudWxsID0gcGFyc2UoXG4gICAgdmVyc2lvbi50cmltKCkucmVwbGFjZSgvXls9dl0rLywgXCJcIiksXG4gICAgb3B0aW9uc09yTG9vc2UsXG4gICk7XG4gIHJldHVybiBzID8gcy52ZXJzaW9uIDogbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFNlbVZlciB7XG4gIHJhdyE6IHN0cmluZztcbiAgbG9vc2UhOiBib29sZWFuO1xuICBvcHRpb25zITogT3B0aW9ucztcblxuICBtYWpvciE6IG51bWJlcjtcbiAgbWlub3IhOiBudW1iZXI7XG4gIHBhdGNoITogbnVtYmVyO1xuICB2ZXJzaW9uITogc3RyaW5nO1xuICBidWlsZCE6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPjtcbiAgcHJlcmVsZWFzZSE6IEFycmF5PHN0cmluZyB8IG51bWJlcj47XG5cbiAgY29uc3RydWN0b3IodmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLCBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zT3JMb29zZSB8fCB0eXBlb2Ygb3B0aW9uc09yTG9vc2UgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG9wdGlvbnNPckxvb3NlID0ge1xuICAgICAgICBsb29zZTogISFvcHRpb25zT3JMb29zZSxcbiAgICAgICAgaW5jbHVkZVByZXJlbGVhc2U6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHZlcnNpb24gaW5zdGFuY2VvZiBTZW1WZXIpIHtcbiAgICAgIGlmICh2ZXJzaW9uLmxvb3NlID09PSBvcHRpb25zT3JMb29zZS5sb29zZSkge1xuICAgICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uLnZlcnNpb247XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgVmVyc2lvbjogXCIgKyB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICBpZiAodmVyc2lvbi5sZW5ndGggPiBNQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcInZlcnNpb24gaXMgbG9uZ2VyIHRoYW4gXCIgKyBNQVhfTEVOR1RIICsgXCIgY2hhcmFjdGVyc1wiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2VtVmVyKSkge1xuICAgICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgb3B0aW9uc09yTG9vc2UpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNPckxvb3NlO1xuICAgIHRoaXMubG9vc2UgPSAhIW9wdGlvbnNPckxvb3NlLmxvb3NlO1xuXG4gICAgY29uc3QgbSA9IHZlcnNpb24udHJpbSgpLm1hdGNoKG9wdGlvbnNPckxvb3NlLmxvb3NlID8gcmVbTE9PU0VdIDogcmVbRlVMTF0pO1xuXG4gICAgaWYgKCFtKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBWZXJzaW9uOiBcIiArIHZlcnNpb24pO1xuICAgIH1cblxuICAgIHRoaXMucmF3ID0gdmVyc2lvbjtcblxuICAgIC8vIHRoZXNlIGFyZSBhY3R1YWxseSBudW1iZXJzXG4gICAgdGhpcy5tYWpvciA9ICttWzFdO1xuICAgIHRoaXMubWlub3IgPSArbVsyXTtcbiAgICB0aGlzLnBhdGNoID0gK21bM107XG5cbiAgICBpZiAodGhpcy5tYWpvciA+IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSIHx8IHRoaXMubWFqb3IgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBtYWpvciB2ZXJzaW9uXCIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1pbm9yID4gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgfHwgdGhpcy5taW5vciA8IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIG1pbm9yIHZlcnNpb25cIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGF0Y2ggPiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiB8fCB0aGlzLnBhdGNoIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgcGF0Y2ggdmVyc2lvblwiKTtcbiAgICB9XG5cbiAgICAvLyBudW1iZXJpZnkgYW55IHByZXJlbGVhc2UgbnVtZXJpYyBpZHNcbiAgICBpZiAoIW1bNF0pIHtcbiAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnByZXJlbGVhc2UgPSBtWzRdLnNwbGl0KFwiLlwiKS5tYXAoKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKC9eWzAtOV0rJC8udGVzdChpZCkpIHtcbiAgICAgICAgICBjb25zdCBudW06IG51bWJlciA9ICtpZDtcbiAgICAgICAgICBpZiAobnVtID49IDAgJiYgbnVtIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcbiAgICAgICAgICAgIHJldHVybiBudW07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpZDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuYnVpbGQgPSBtWzVdID8gbVs1XS5zcGxpdChcIi5cIikgOiBbXTtcbiAgICB0aGlzLmZvcm1hdCgpO1xuICB9XG5cbiAgZm9ybWF0KCk6IHN0cmluZyB7XG4gICAgdGhpcy52ZXJzaW9uID0gdGhpcy5tYWpvciArIFwiLlwiICsgdGhpcy5taW5vciArIFwiLlwiICsgdGhpcy5wYXRjaDtcbiAgICBpZiAodGhpcy5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgICAgdGhpcy52ZXJzaW9uICs9IFwiLVwiICsgdGhpcy5wcmVyZWxlYXNlLmpvaW4oXCIuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy52ZXJzaW9uO1xuICB9XG5cbiAgY29tcGFyZShvdGhlcjogc3RyaW5nIHwgU2VtVmVyKTogMSB8IDAgfCAtMSB7XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBTZW1WZXIpKSB7XG4gICAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY29tcGFyZU1haW4ob3RoZXIpIHx8IHRoaXMuY29tcGFyZVByZShvdGhlcik7XG4gIH1cblxuICBjb21wYXJlTWFpbihvdGhlcjogc3RyaW5nIHwgU2VtVmVyKTogMSB8IDAgfCAtMSB7XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBTZW1WZXIpKSB7XG4gICAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIGNvbXBhcmVJZGVudGlmaWVycyh0aGlzLm1ham9yLCBvdGhlci5tYWpvcikgfHxcbiAgICAgIGNvbXBhcmVJZGVudGlmaWVycyh0aGlzLm1pbm9yLCBvdGhlci5taW5vcikgfHxcbiAgICAgIGNvbXBhcmVJZGVudGlmaWVycyh0aGlzLnBhdGNoLCBvdGhlci5wYXRjaClcbiAgICApO1xuICB9XG5cbiAgY29tcGFyZVByZShvdGhlcjogc3RyaW5nIHwgU2VtVmVyKTogMSB8IDAgfCAtMSB7XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBTZW1WZXIpKSB7XG4gICAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gTk9UIGhhdmluZyBhIHByZXJlbGVhc2UgaXMgPiBoYXZpbmcgb25lXG4gICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggJiYgIW90aGVyLnByZXJlbGVhc2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIGlmICghdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCAmJiBvdGhlci5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfSBlbHNlIGlmICghdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCAmJiAhb3RoZXIucHJlcmVsZWFzZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCBpOiBudW1iZXIgPSAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IGE6IHN0cmluZyB8IG51bWJlciA9IHRoaXMucHJlcmVsZWFzZVtpXTtcbiAgICAgIGNvbnN0IGI6IHN0cmluZyB8IG51bWJlciA9IG90aGVyLnByZXJlbGVhc2VbaV07XG4gICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkICYmIGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfSBlbHNlIGlmIChhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfSBlbHNlIGlmIChhID09PSBiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmVJZGVudGlmaWVycyhhLCBiKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlICgrK2kpO1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgY29tcGFyZUJ1aWxkKG90aGVyOiBzdHJpbmcgfCBTZW1WZXIpOiAxIHwgMCB8IC0xIHtcbiAgICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFNlbVZlcikpIHtcbiAgICAgIG90aGVyID0gbmV3IFNlbVZlcihvdGhlciwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICBsZXQgaTogbnVtYmVyID0gMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCBhOiBzdHJpbmcgPSB0aGlzLmJ1aWxkW2ldO1xuICAgICAgY29uc3QgYjogc3RyaW5nID0gb3RoZXIuYnVpbGRbaV07XG4gICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkICYmIGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH0gZWxzZSBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfSBlbHNlIGlmIChhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfSBlbHNlIGlmIChhID09PSBiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmVJZGVudGlmaWVycyhhLCBiKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlICgrK2kpO1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgaW5jKHJlbGVhc2U6IFJlbGVhc2VUeXBlLCBpZGVudGlmaWVyPzogc3RyaW5nKTogU2VtVmVyIHtcbiAgICBzd2l0Y2ggKHJlbGVhc2UpIHtcbiAgICAgIGNhc2UgXCJwcmVtYWpvclwiOlxuICAgICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5wYXRjaCA9IDA7XG4gICAgICAgIHRoaXMubWlub3IgPSAwO1xuICAgICAgICB0aGlzLm1ham9yKys7XG4gICAgICAgIHRoaXMuaW5jKFwicHJlXCIsIGlkZW50aWZpZXIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJwcmVtaW5vclwiOlxuICAgICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5wYXRjaCA9IDA7XG4gICAgICAgIHRoaXMubWlub3IrKztcbiAgICAgICAgdGhpcy5pbmMoXCJwcmVcIiwgaWRlbnRpZmllcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInByZXBhdGNoXCI6XG4gICAgICAgIC8vIElmIHRoaXMgaXMgYWxyZWFkeSBhIHByZXJlbGVhc2UsIGl0IHdpbGwgYnVtcCB0byB0aGUgbmV4dCB2ZXJzaW9uXG4gICAgICAgIC8vIGRyb3AgYW55IHByZXJlbGVhc2VzIHRoYXQgbWlnaHQgYWxyZWFkeSBleGlzdCwgc2luY2UgdGhleSBhcmUgbm90XG4gICAgICAgIC8vIHJlbGV2YW50IGF0IHRoaXMgcG9pbnQuXG4gICAgICAgIHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmluYyhcInBhdGNoXCIsIGlkZW50aWZpZXIpO1xuICAgICAgICB0aGlzLmluYyhcInByZVwiLCBpZGVudGlmaWVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBJZiB0aGUgaW5wdXQgaXMgYSBub24tcHJlcmVsZWFzZSB2ZXJzaW9uLCB0aGlzIGFjdHMgdGhlIHNhbWUgYXNcbiAgICAgIC8vIHByZXBhdGNoLlxuICAgICAgY2FzZSBcInByZXJlbGVhc2VcIjpcbiAgICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLmluYyhcInBhdGNoXCIsIGlkZW50aWZpZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5jKFwicHJlXCIsIGlkZW50aWZpZXIpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcIm1ham9yXCI6XG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBwcmUtbWFqb3IgdmVyc2lvbiwgYnVtcCB1cCB0byB0aGUgc2FtZSBtYWpvciB2ZXJzaW9uLlxuICAgICAgICAvLyBPdGhlcndpc2UgaW5jcmVtZW50IG1ham9yLlxuICAgICAgICAvLyAxLjAuMC01IGJ1bXBzIHRvIDEuMC4wXG4gICAgICAgIC8vIDEuMS4wIGJ1bXBzIHRvIDIuMC4wXG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLm1pbm9yICE9PSAwIHx8XG4gICAgICAgICAgdGhpcy5wYXRjaCAhPT0gMCB8fFxuICAgICAgICAgIHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5tYWpvcisrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWlub3IgPSAwO1xuICAgICAgICB0aGlzLnBhdGNoID0gMDtcbiAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW107XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm1pbm9yXCI6XG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBwcmUtbWlub3IgdmVyc2lvbiwgYnVtcCB1cCB0byB0aGUgc2FtZSBtaW5vciB2ZXJzaW9uLlxuICAgICAgICAvLyBPdGhlcndpc2UgaW5jcmVtZW50IG1pbm9yLlxuICAgICAgICAvLyAxLjIuMC01IGJ1bXBzIHRvIDEuMi4wXG4gICAgICAgIC8vIDEuMi4xIGJ1bXBzIHRvIDEuMy4wXG4gICAgICAgIGlmICh0aGlzLnBhdGNoICE9PSAwIHx8IHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLm1pbm9yKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYXRjaCA9IDA7XG4gICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJwYXRjaFwiOlxuICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCBhIHByZS1yZWxlYXNlIHZlcnNpb24sIGl0IHdpbGwgaW5jcmVtZW50IHRoZSBwYXRjaC5cbiAgICAgICAgLy8gSWYgaXQgaXMgYSBwcmUtcmVsZWFzZSBpdCB3aWxsIGJ1bXAgdXAgdG8gdGhlIHNhbWUgcGF0Y2ggdmVyc2lvbi5cbiAgICAgICAgLy8gMS4yLjAtNSBwYXRjaGVzIHRvIDEuMi4wXG4gICAgICAgIC8vIDEuMi4wIHBhdGNoZXMgdG8gMS4yLjFcbiAgICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLnBhdGNoKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW107XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gVGhpcyBwcm9iYWJseSBzaG91bGRuJ3QgYmUgdXNlZCBwdWJsaWNseS5cbiAgICAgIC8vIDEuMC4wIFwicHJlXCIgd291bGQgYmVjb21lIDEuMC4wLTAgd2hpY2ggaXMgdGhlIHdyb25nIGRpcmVjdGlvbi5cbiAgICAgIGNhc2UgXCJwcmVcIjpcbiAgICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLnByZXJlbGVhc2UgPSBbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGk6IG51bWJlciA9IHRoaXMucHJlcmVsZWFzZS5sZW5ndGg7XG4gICAgICAgICAgd2hpbGUgKC0taSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJlcmVsZWFzZVtpXSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAodGhpcy5wcmVyZWxlYXNlW2ldIGFzIG51bWJlcikrKztcbiAgICAgICAgICAgICAgaSA9IC0yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGRpZG4ndCBpbmNyZW1lbnQgYW55dGhpbmdcbiAgICAgICAgICAgIHRoaXMucHJlcmVsZWFzZS5wdXNoKDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRlbnRpZmllcikge1xuICAgICAgICAgIC8vIDEuMi4wLWJldGEuMSBidW1wcyB0byAxLjIuMC1iZXRhLjIsXG4gICAgICAgICAgLy8gMS4yLjAtYmV0YS5mb29ibHogb3IgMS4yLjAtYmV0YSBidW1wcyB0byAxLjIuMC1iZXRhLjBcbiAgICAgICAgICBpZiAodGhpcy5wcmVyZWxlYXNlWzBdID09PSBpZGVudGlmaWVyKSB7XG4gICAgICAgICAgICBpZiAoaXNOYU4odGhpcy5wcmVyZWxlYXNlWzFdIGFzIG51bWJlcikpIHtcbiAgICAgICAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW2lkZW50aWZpZXIsIDBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnByZXJlbGVhc2UgPSBbaWRlbnRpZmllciwgMF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGluY3JlbWVudCBhcmd1bWVudDogXCIgKyByZWxlYXNlKTtcbiAgICB9XG4gICAgdGhpcy5mb3JtYXQoKTtcbiAgICB0aGlzLnJhdyA9IHRoaXMudmVyc2lvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvbjtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgdmVyc2lvbiBpbmNyZW1lbnRlZCBieSB0aGUgcmVsZWFzZSB0eXBlIChtYWpvciwgbWlub3IsIHBhdGNoLCBvciBwcmVyZWxlYXNlKSwgb3IgbnVsbCBpZiBpdCdzIG5vdCB2YWxpZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluYyhcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLFxuICByZWxlYXNlOiBSZWxlYXNlVHlwZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbiAgaWRlbnRpZmllcj86IHN0cmluZyxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIG9wdGlvbnNPckxvb3NlID09PSBcInN0cmluZ1wiKSB7XG4gICAgaWRlbnRpZmllciA9IG9wdGlvbnNPckxvb3NlO1xuICAgIG9wdGlvbnNPckxvb3NlID0gdW5kZWZpbmVkO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgb3B0aW9uc09yTG9vc2UpLmluYyhyZWxlYXNlLCBpZGVudGlmaWVyKS52ZXJzaW9uO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmKFxuICB2ZXJzaW9uMTogc3RyaW5nIHwgU2VtVmVyLFxuICB2ZXJzaW9uMjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogUmVsZWFzZVR5cGUgfCBudWxsIHtcbiAgaWYgKGVxKHZlcnNpb24xLCB2ZXJzaW9uMiwgb3B0aW9uc09yTG9vc2UpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdjE6IFNlbVZlciB8IG51bGwgPSBwYXJzZSh2ZXJzaW9uMSk7XG4gICAgY29uc3QgdjI6IFNlbVZlciB8IG51bGwgPSBwYXJzZSh2ZXJzaW9uMik7XG4gICAgbGV0IHByZWZpeDogc3RyaW5nID0gXCJcIjtcbiAgICBsZXQgZGVmYXVsdFJlc3VsdDogUmVsZWFzZVR5cGUgfCBudWxsID0gbnVsbDtcblxuICAgIGlmICh2MSAmJiB2Mikge1xuICAgICAgaWYgKHYxLnByZXJlbGVhc2UubGVuZ3RoIHx8IHYyLnByZXJlbGVhc2UubGVuZ3RoKSB7XG4gICAgICAgIHByZWZpeCA9IFwicHJlXCI7XG4gICAgICAgIGRlZmF1bHRSZXN1bHQgPSBcInByZXJlbGVhc2VcIjtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gdjEpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gXCJtYWpvclwiIHx8IGtleSA9PT0gXCJtaW5vclwiIHx8IGtleSA9PT0gXCJwYXRjaFwiKSB7XG4gICAgICAgICAgaWYgKHYxW2tleV0gIT09IHYyW2tleV0pIHtcbiAgICAgICAgICAgIHJldHVybiAocHJlZml4ICsga2V5KSBhcyBSZWxlYXNlVHlwZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRSZXN1bHQ7IC8vIG1heSBiZSB1bmRlZmluZWRcbiAgfVxufVxuXG5jb25zdCBudW1lcmljOiBSZWdFeHAgPSAvXlswLTldKyQvO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZUlkZW50aWZpZXJzKFxuICBhOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsLFxuICBiOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsLFxuKTogMSB8IDAgfCAtMSB7XG4gIGNvbnN0IGFudW06IGJvb2xlYW4gPSBudW1lcmljLnRlc3QoYSBhcyBzdHJpbmcpO1xuICBjb25zdCBibnVtOiBib29sZWFuID0gbnVtZXJpYy50ZXN0KGIgYXMgc3RyaW5nKTtcblxuICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKSB0aHJvdyBcIkNvbXBhcmlzb24gYWdhaW5zdCBudWxsIGludmFsaWRcIjtcblxuICBpZiAoYW51bSAmJiBibnVtKSB7XG4gICAgYSA9ICthO1xuICAgIGIgPSArYjtcbiAgfVxuXG4gIHJldHVybiBhID09PSBiID8gMCA6IGFudW0gJiYgIWJudW0gPyAtMSA6IGJudW0gJiYgIWFudW0gPyAxIDogYSA8IGIgPyAtMSA6IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByY29tcGFyZUlkZW50aWZpZXJzKFxuICBhOiBzdHJpbmcgfCBudWxsLFxuICBiOiBzdHJpbmcgfCBudWxsLFxuKTogMSB8IDAgfCAtMSB7XG4gIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnMoYiwgYSk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBtYWpvciB2ZXJzaW9uIG51bWJlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ham9yKFxuICB2OiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBudW1iZXIge1xuICByZXR1cm4gbmV3IFNlbVZlcih2LCBvcHRpb25zT3JMb29zZSkubWFqb3I7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBtaW5vciB2ZXJzaW9uIG51bWJlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pbm9yKFxuICB2OiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBudW1iZXIge1xuICByZXR1cm4gbmV3IFNlbVZlcih2LCBvcHRpb25zT3JMb29zZSkubWlub3I7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwYXRjaCB2ZXJzaW9uIG51bWJlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoKFxuICB2OiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBudW1iZXIge1xuICByZXR1cm4gbmV3IFNlbVZlcih2LCBvcHRpb25zT3JMb29zZSkucGF0Y2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogMSB8IDAgfCAtMSB7XG4gIHJldHVybiBuZXcgU2VtVmVyKHYxLCBvcHRpb25zT3JMb29zZSkuY29tcGFyZShuZXcgU2VtVmVyKHYyLCBvcHRpb25zT3JMb29zZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZUxvb3NlKFxuICBhOiBzdHJpbmcgfCBTZW1WZXIsXG4gIGI6IHN0cmluZyB8IFNlbVZlcixcbik6IDEgfCAwIHwgLTEge1xuICByZXR1cm4gY29tcGFyZShhLCBiLCB0cnVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVCdWlsZChcbiAgYTogc3RyaW5nIHwgU2VtVmVyLFxuICBiOiBzdHJpbmcgfCBTZW1WZXIsXG4gIGxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiAxIHwgMCB8IC0xIHtcbiAgdmFyIHZlcnNpb25BID0gbmV3IFNlbVZlcihhLCBsb29zZSk7XG4gIHZhciB2ZXJzaW9uQiA9IG5ldyBTZW1WZXIoYiwgbG9vc2UpO1xuICByZXR1cm4gdmVyc2lvbkEuY29tcGFyZSh2ZXJzaW9uQikgfHwgdmVyc2lvbkEuY29tcGFyZUJ1aWxkKHZlcnNpb25CKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJjb21wYXJlKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogMSB8IDAgfCAtMSB7XG4gIHJldHVybiBjb21wYXJlKHYyLCB2MSwgb3B0aW9uc09yTG9vc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc29ydDxUIGV4dGVuZHMgc3RyaW5nIHwgU2VtVmVyPihcbiAgbGlzdDogVFtdLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogVFtdIHtcbiAgcmV0dXJuIGxpc3Quc29ydCgoYSwgYikgPT4ge1xuICAgIHJldHVybiBjb21wYXJlQnVpbGQoYSwgYiwgb3B0aW9uc09yTG9vc2UpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJzb3J0PFQgZXh0ZW5kcyBzdHJpbmcgfCBTZW1WZXI+KFxuICBsaXN0OiBUW10sXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBUW10ge1xuICByZXR1cm4gbGlzdC5zb3J0KChhLCBiKSA9PiB7XG4gICAgcmV0dXJuIGNvbXBhcmVCdWlsZChiLCBhLCBvcHRpb25zT3JMb29zZSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3QoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbHQoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgPCAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXEoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgPT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXEoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBndGUoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgPj0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGx0ZShcbiAgdjE6IHN0cmluZyB8IFNlbVZlcixcbiAgdjI6IHN0cmluZyB8IFNlbVZlcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gY29tcGFyZSh2MSwgdjIsIG9wdGlvbnNPckxvb3NlKSA8PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY21wKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICBvcGVyYXRvcjogT3BlcmF0b3IsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgIGNhc2UgXCI9PT1cIjpcbiAgICAgIGlmICh0eXBlb2YgdjEgPT09IFwib2JqZWN0XCIpIHYxID0gdjEudmVyc2lvbjtcbiAgICAgIGlmICh0eXBlb2YgdjIgPT09IFwib2JqZWN0XCIpIHYyID0gdjIudmVyc2lvbjtcbiAgICAgIHJldHVybiB2MSA9PT0gdjI7XG5cbiAgICBjYXNlIFwiIT09XCI6XG4gICAgICBpZiAodHlwZW9mIHYxID09PSBcIm9iamVjdFwiKSB2MSA9IHYxLnZlcnNpb247XG4gICAgICBpZiAodHlwZW9mIHYyID09PSBcIm9iamVjdFwiKSB2MiA9IHYyLnZlcnNpb247XG4gICAgICByZXR1cm4gdjEgIT09IHYyO1xuXG4gICAgY2FzZSBcIlwiOlxuICAgIGNhc2UgXCI9XCI6XG4gICAgY2FzZSBcIj09XCI6XG4gICAgICByZXR1cm4gZXEodjEsIHYyLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgICBjYXNlIFwiIT1cIjpcbiAgICAgIHJldHVybiBuZXEodjEsIHYyLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgICBjYXNlIFwiPlwiOlxuICAgICAgcmV0dXJuIGd0KHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpO1xuXG4gICAgY2FzZSBcIj49XCI6XG4gICAgICByZXR1cm4gZ3RlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpO1xuXG4gICAgY2FzZSBcIjxcIjpcbiAgICAgIHJldHVybiBsdCh2MSwgdjIsIG9wdGlvbnNPckxvb3NlKTtcblxuICAgIGNhc2UgXCI8PVwiOlxuICAgICAgcmV0dXJuIGx0ZSh2MSwgdjIsIG9wdGlvbnNPckxvb3NlKTtcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XG4gIH1cbn1cblxuY29uc3QgQU5ZOiBTZW1WZXIgPSB7fSBhcyBTZW1WZXI7XG5cbmV4cG9ydCBjbGFzcyBDb21wYXJhdG9yIHtcbiAgc2VtdmVyITogU2VtVmVyO1xuICBvcGVyYXRvciE6IFwiXCIgfCBcIj1cIiB8IFwiPFwiIHwgXCI+XCIgfCBcIjw9XCIgfCBcIj49XCI7XG4gIHZhbHVlITogc3RyaW5nO1xuICBsb29zZSE6IGJvb2xlYW47XG4gIG9wdGlvbnMhOiBPcHRpb25zO1xuXG4gIGNvbnN0cnVjdG9yKGNvbXA6IHN0cmluZyB8IENvbXBhcmF0b3IsIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnNPckxvb3NlIHx8IHR5cGVvZiBvcHRpb25zT3JMb29zZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgb3B0aW9uc09yTG9vc2UgPSB7XG4gICAgICAgIGxvb3NlOiAhIW9wdGlvbnNPckxvb3NlLFxuICAgICAgICBpbmNsdWRlUHJlcmVsZWFzZTogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjb21wIGluc3RhbmNlb2YgQ29tcGFyYXRvcikge1xuICAgICAgaWYgKGNvbXAubG9vc2UgPT09ICEhb3B0aW9uc09yTG9vc2UubG9vc2UpIHtcbiAgICAgICAgcmV0dXJuIGNvbXA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wID0gY29tcC52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ29tcGFyYXRvcikpIHtcbiAgICAgIHJldHVybiBuZXcgQ29tcGFyYXRvcihjb21wLCBvcHRpb25zT3JMb29zZSk7XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc09yTG9vc2U7XG4gICAgdGhpcy5sb29zZSA9ICEhb3B0aW9uc09yTG9vc2UubG9vc2U7XG4gICAgdGhpcy5wYXJzZShjb21wKTtcblxuICAgIGlmICh0aGlzLnNlbXZlciA9PT0gQU5ZKSB7XG4gICAgICB0aGlzLnZhbHVlID0gXCJcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMub3BlcmF0b3IgKyB0aGlzLnNlbXZlci52ZXJzaW9uO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlKGNvbXA6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHIgPSB0aGlzLm9wdGlvbnMubG9vc2UgPyByZVtDT01QQVJBVE9STE9PU0VdIDogcmVbQ09NUEFSQVRPUl07XG4gICAgY29uc3QgbSA9IGNvbXAubWF0Y2gocik7XG5cbiAgICBpZiAoIW0pIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGNvbXBhcmF0b3I6IFwiICsgY29tcCk7XG4gICAgfVxuXG4gICAgY29uc3QgbTEgPSBtWzFdIGFzIFwiXCIgfCBcIj1cIiB8IFwiPFwiIHwgXCI+XCIgfCBcIjw9XCIgfCBcIj49XCI7XG4gICAgdGhpcy5vcGVyYXRvciA9IG0xICE9PSB1bmRlZmluZWQgPyBtMSA6IFwiXCI7XG5cbiAgICBpZiAodGhpcy5vcGVyYXRvciA9PT0gXCI9XCIpIHtcbiAgICAgIHRoaXMub3BlcmF0b3IgPSBcIlwiO1xuICAgIH1cblxuICAgIC8vIGlmIGl0IGxpdGVyYWxseSBpcyBqdXN0ICc+JyBvciAnJyB0aGVuIGFsbG93IGFueXRoaW5nLlxuICAgIGlmICghbVsyXSkge1xuICAgICAgdGhpcy5zZW12ZXIgPSBBTlk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2VtdmVyID0gbmV3IFNlbVZlcihtWzJdLCB0aGlzLm9wdGlvbnMubG9vc2UpO1xuICAgIH1cbiAgfVxuXG4gIHRlc3QodmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuc2VtdmVyID09PSBBTlkgfHwgdmVyc2lvbiA9PT0gQU5ZKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZlcnNpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNtcCh2ZXJzaW9uLCB0aGlzLm9wZXJhdG9yLCB0aGlzLnNlbXZlciwgdGhpcy5vcHRpb25zKTtcbiAgfVxuXG4gIGludGVyc2VjdHMoY29tcDogQ29tcGFyYXRvciwgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgIGlmICghKGNvbXAgaW5zdGFuY2VvZiBDb21wYXJhdG9yKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImEgQ29tcGFyYXRvciBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnNPckxvb3NlIHx8IHR5cGVvZiBvcHRpb25zT3JMb29zZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgb3B0aW9uc09yTG9vc2UgPSB7XG4gICAgICAgIGxvb3NlOiAhIW9wdGlvbnNPckxvb3NlLFxuICAgICAgICBpbmNsdWRlUHJlcmVsZWFzZTogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCByYW5nZVRtcDogUmFuZ2U7XG5cbiAgICBpZiAodGhpcy5vcGVyYXRvciA9PT0gXCJcIikge1xuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByYW5nZVRtcCA9IG5ldyBSYW5nZShjb21wLnZhbHVlLCBvcHRpb25zT3JMb29zZSk7XG4gICAgICByZXR1cm4gc2F0aXNmaWVzKHRoaXMudmFsdWUsIHJhbmdlVG1wLCBvcHRpb25zT3JMb29zZSk7XG4gICAgfSBlbHNlIGlmIChjb21wLm9wZXJhdG9yID09PSBcIlwiKSB7XG4gICAgICBpZiAoY29tcC52YWx1ZSA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJhbmdlVG1wID0gbmV3IFJhbmdlKHRoaXMudmFsdWUsIG9wdGlvbnNPckxvb3NlKTtcbiAgICAgIHJldHVybiBzYXRpc2ZpZXMoY29tcC5zZW12ZXIsIHJhbmdlVG1wLCBvcHRpb25zT3JMb29zZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2FtZURpcmVjdGlvbkluY3JlYXNpbmc6IGJvb2xlYW4gPVxuICAgICAgKHRoaXMub3BlcmF0b3IgPT09IFwiPj1cIiB8fCB0aGlzLm9wZXJhdG9yID09PSBcIj5cIikgJiZcbiAgICAgIChjb21wLm9wZXJhdG9yID09PSBcIj49XCIgfHwgY29tcC5vcGVyYXRvciA9PT0gXCI+XCIpO1xuICAgIGNvbnN0IHNhbWVEaXJlY3Rpb25EZWNyZWFzaW5nOiBib29sZWFuID1cbiAgICAgICh0aGlzLm9wZXJhdG9yID09PSBcIjw9XCIgfHwgdGhpcy5vcGVyYXRvciA9PT0gXCI8XCIpICYmXG4gICAgICAoY29tcC5vcGVyYXRvciA9PT0gXCI8PVwiIHx8IGNvbXAub3BlcmF0b3IgPT09IFwiPFwiKTtcbiAgICBjb25zdCBzYW1lU2VtVmVyOiBib29sZWFuID0gdGhpcy5zZW12ZXIudmVyc2lvbiA9PT0gY29tcC5zZW12ZXIudmVyc2lvbjtcbiAgICBjb25zdCBkaWZmZXJlbnREaXJlY3Rpb25zSW5jbHVzaXZlOiBib29sZWFuID1cbiAgICAgICh0aGlzLm9wZXJhdG9yID09PSBcIj49XCIgfHwgdGhpcy5vcGVyYXRvciA9PT0gXCI8PVwiKSAmJlxuICAgICAgKGNvbXAub3BlcmF0b3IgPT09IFwiPj1cIiB8fCBjb21wLm9wZXJhdG9yID09PSBcIjw9XCIpO1xuICAgIGNvbnN0IG9wcG9zaXRlRGlyZWN0aW9uc0xlc3NUaGFuOiBib29sZWFuID1cbiAgICAgIGNtcCh0aGlzLnNlbXZlciwgXCI8XCIsIGNvbXAuc2VtdmVyLCBvcHRpb25zT3JMb29zZSkgJiZcbiAgICAgICh0aGlzLm9wZXJhdG9yID09PSBcIj49XCIgfHwgdGhpcy5vcGVyYXRvciA9PT0gXCI+XCIpICYmXG4gICAgICAoY29tcC5vcGVyYXRvciA9PT0gXCI8PVwiIHx8IGNvbXAub3BlcmF0b3IgPT09IFwiPFwiKTtcbiAgICBjb25zdCBvcHBvc2l0ZURpcmVjdGlvbnNHcmVhdGVyVGhhbjogYm9vbGVhbiA9XG4gICAgICBjbXAodGhpcy5zZW12ZXIsIFwiPlwiLCBjb21wLnNlbXZlciwgb3B0aW9uc09yTG9vc2UpICYmXG4gICAgICAodGhpcy5vcGVyYXRvciA9PT0gXCI8PVwiIHx8IHRoaXMub3BlcmF0b3IgPT09IFwiPFwiKSAmJlxuICAgICAgKGNvbXAub3BlcmF0b3IgPT09IFwiPj1cIiB8fCBjb21wLm9wZXJhdG9yID09PSBcIj5cIik7XG5cbiAgICByZXR1cm4gKFxuICAgICAgc2FtZURpcmVjdGlvbkluY3JlYXNpbmcgfHxcbiAgICAgIHNhbWVEaXJlY3Rpb25EZWNyZWFzaW5nIHx8XG4gICAgICAoc2FtZVNlbVZlciAmJiBkaWZmZXJlbnREaXJlY3Rpb25zSW5jbHVzaXZlKSB8fFxuICAgICAgb3Bwb3NpdGVEaXJlY3Rpb25zTGVzc1RoYW4gfHxcbiAgICAgIG9wcG9zaXRlRGlyZWN0aW9uc0dyZWF0ZXJUaGFuXG4gICAgKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJhbmdlIHtcbiAgcmFuZ2UhOiBzdHJpbmc7XG4gIHJhdyE6IHN0cmluZztcbiAgbG9vc2UhOiBib29sZWFuO1xuICBvcHRpb25zITogT3B0aW9ucztcbiAgaW5jbHVkZVByZXJlbGVhc2UhOiBib29sZWFuO1xuICBzZXQhOiBSZWFkb25seUFycmF5PFJlYWRvbmx5QXJyYXk8Q29tcGFyYXRvcj4+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSB8IENvbXBhcmF0b3IsXG4gICAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbiAgKSB7XG4gICAgaWYgKCFvcHRpb25zT3JMb29zZSB8fCB0eXBlb2Ygb3B0aW9uc09yTG9vc2UgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG9wdGlvbnNPckxvb3NlID0ge1xuICAgICAgICBsb29zZTogISFvcHRpb25zT3JMb29zZSxcbiAgICAgICAgaW5jbHVkZVByZXJlbGVhc2U6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAocmFuZ2UgaW5zdGFuY2VvZiBSYW5nZSkge1xuICAgICAgaWYgKFxuICAgICAgICByYW5nZS5sb29zZSA9PT0gISFvcHRpb25zT3JMb29zZS5sb29zZSAmJlxuICAgICAgICByYW5nZS5pbmNsdWRlUHJlcmVsZWFzZSA9PT0gISFvcHRpb25zT3JMb29zZS5pbmNsdWRlUHJlcmVsZWFzZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiByYW5nZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UucmF3LCBvcHRpb25zT3JMb29zZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlIGluc3RhbmNlb2YgQ29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIG5ldyBSYW5nZShyYW5nZS52YWx1ZSwgb3B0aW9uc09yTG9vc2UpO1xuICAgIH1cblxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSYW5nZSkpIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zT3JMb29zZTtcbiAgICB0aGlzLmxvb3NlID0gISFvcHRpb25zT3JMb29zZS5sb29zZTtcbiAgICB0aGlzLmluY2x1ZGVQcmVyZWxlYXNlID0gISFvcHRpb25zT3JMb29zZS5pbmNsdWRlUHJlcmVsZWFzZTtcblxuICAgIC8vIEZpcnN0LCBzcGxpdCBiYXNlZCBvbiBib29sZWFuIG9yIHx8XG4gICAgdGhpcy5yYXcgPSByYW5nZTtcbiAgICB0aGlzLnNldCA9IHJhbmdlXG4gICAgICAuc3BsaXQoL1xccypcXHxcXHxcXHMqLylcbiAgICAgIC5tYXAoKHJhbmdlKSA9PiB0aGlzLnBhcnNlUmFuZ2UocmFuZ2UudHJpbSgpKSlcbiAgICAgIC5maWx0ZXIoKGMpID0+IHtcbiAgICAgICAgLy8gdGhyb3cgb3V0IGFueSB0aGF0IGFyZSBub3QgcmVsZXZhbnQgZm9yIHdoYXRldmVyIHJlYXNvblxuICAgICAgICByZXR1cm4gYy5sZW5ndGg7XG4gICAgICB9KTtcblxuICAgIGlmICghdGhpcy5zZXQubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBTZW1WZXIgUmFuZ2U6IFwiICsgcmFuZ2UpO1xuICAgIH1cblxuICAgIHRoaXMuZm9ybWF0KCk7XG4gIH1cblxuICBmb3JtYXQoKTogc3RyaW5nIHtcbiAgICB0aGlzLnJhbmdlID0gdGhpcy5zZXRcbiAgICAgIC5tYXAoKGNvbXBzKSA9PiBjb21wcy5qb2luKFwiIFwiKS50cmltKCkpXG4gICAgICAuam9pbihcInx8XCIpXG4gICAgICAudHJpbSgpO1xuICAgIHJldHVybiB0aGlzLnJhbmdlO1xuICB9XG5cbiAgcGFyc2VSYW5nZShyYW5nZTogc3RyaW5nKTogUmVhZG9ubHlBcnJheTxDb21wYXJhdG9yPiB7XG4gICAgY29uc3QgbG9vc2UgPSB0aGlzLm9wdGlvbnMubG9vc2U7XG4gICAgcmFuZ2UgPSByYW5nZS50cmltKCk7XG4gICAgLy8gYDEuMi4zIC0gMS4yLjRgID0+IGA+PTEuMi4zIDw9MS4yLjRgXG4gICAgY29uc3QgaHI6IFJlZ0V4cCA9IGxvb3NlID8gcmVbSFlQSEVOUkFOR0VMT09TRV0gOiByZVtIWVBIRU5SQU5HRV07XG4gICAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKGhyLCBoeXBoZW5SZXBsYWNlKTtcblxuICAgIC8vIGA+IDEuMi4zIDwgMS4yLjVgID0+IGA+MS4yLjMgPDEuMi41YFxuICAgIHJhbmdlID0gcmFuZ2UucmVwbGFjZShyZVtDT01QQVJBVE9SVFJJTV0sIGNvbXBhcmF0b3JUcmltUmVwbGFjZSk7XG5cbiAgICAvLyBgfiAxLjIuM2AgPT4gYH4xLjIuM2BcbiAgICByYW5nZSA9IHJhbmdlLnJlcGxhY2UocmVbVElMREVUUklNXSwgdGlsZGVUcmltUmVwbGFjZSk7XG5cbiAgICAvLyBgXiAxLjIuM2AgPT4gYF4xLjIuM2BcbiAgICByYW5nZSA9IHJhbmdlLnJlcGxhY2UocmVbQ0FSRVRUUklNXSwgY2FyZXRUcmltUmVwbGFjZSk7XG5cbiAgICAvLyBub3JtYWxpemUgc3BhY2VzXG4gICAgcmFuZ2UgPSByYW5nZS5zcGxpdCgvXFxzKy8pLmpvaW4oXCIgXCIpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIHJhbmdlIGlzIGNvbXBsZXRlbHkgdHJpbW1lZCBhbmRcbiAgICAvLyByZWFkeSB0byBiZSBzcGxpdCBpbnRvIGNvbXBhcmF0b3JzLlxuXG4gICAgY29uc3QgY29tcFJlOiBSZWdFeHAgPSBsb29zZSA/IHJlW0NPTVBBUkFUT1JMT09TRV0gOiByZVtDT01QQVJBVE9SXTtcbiAgICBsZXQgc2V0OiBzdHJpbmdbXSA9IHJhbmdlXG4gICAgICAuc3BsaXQoXCIgXCIpXG4gICAgICAubWFwKChjb21wKSA9PiBwYXJzZUNvbXBhcmF0b3IoY29tcCwgdGhpcy5vcHRpb25zKSlcbiAgICAgIC5qb2luKFwiIFwiKVxuICAgICAgLnNwbGl0KC9cXHMrLyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb29zZSkge1xuICAgICAgLy8gaW4gbG9vc2UgbW9kZSwgdGhyb3cgb3V0IGFueSB0aGF0IGFyZSBub3QgdmFsaWQgY29tcGFyYXRvcnNcbiAgICAgIHNldCA9IHNldC5maWx0ZXIoKGNvbXApID0+IHtcbiAgICAgICAgcmV0dXJuICEhY29tcC5tYXRjaChjb21wUmUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNldC5tYXAoKGNvbXApID0+IG5ldyBDb21wYXJhdG9yKGNvbXAsIHRoaXMub3B0aW9ucykpO1xuICB9XG5cbiAgdGVzdCh2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIpOiBib29sZWFuIHtcbiAgICBpZiAodHlwZW9mIHZlcnNpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNldC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRlc3RTZXQodGhpcy5zZXRbaV0sIHZlcnNpb24sIHRoaXMub3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGludGVyc2VjdHMocmFuZ2U/OiBSYW5nZSwgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyk6IGJvb2xlYW4ge1xuICAgIGlmICghKHJhbmdlIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYSBSYW5nZSBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXQuc29tZSgodGhpc0NvbXBhcmF0b3JzKSA9PiB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBpc1NhdGlzZmlhYmxlKHRoaXNDb21wYXJhdG9ycywgb3B0aW9uc09yTG9vc2UpICYmXG4gICAgICAgIHJhbmdlLnNldC5zb21lKChyYW5nZUNvbXBhcmF0b3JzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIGlzU2F0aXNmaWFibGUocmFuZ2VDb21wYXJhdG9ycywgb3B0aW9uc09yTG9vc2UpICYmXG4gICAgICAgICAgICB0aGlzQ29tcGFyYXRvcnMuZXZlcnkoKHRoaXNDb21wYXJhdG9yKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByYW5nZUNvbXBhcmF0b3JzLmV2ZXJ5KChyYW5nZUNvbXBhcmF0b3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc0NvbXBhcmF0b3IuaW50ZXJzZWN0cyhcbiAgICAgICAgICAgICAgICAgIHJhbmdlQ29tcGFyYXRvcixcbiAgICAgICAgICAgICAgICAgIG9wdGlvbnNPckxvb3NlLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucmFuZ2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGVzdFNldChcbiAgc2V0OiBSZWFkb25seUFycmF5PENvbXBhcmF0b3I+LFxuICB2ZXJzaW9uOiBTZW1WZXIsXG4gIG9wdGlvbnM6IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghc2V0W2ldLnRlc3QodmVyc2lvbikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAodmVyc2lvbi5wcmVyZWxlYXNlLmxlbmd0aCAmJiAhb3B0aW9ucy5pbmNsdWRlUHJlcmVsZWFzZSkge1xuICAgIC8vIEZpbmQgdGhlIHNldCBvZiB2ZXJzaW9ucyB0aGF0IGFyZSBhbGxvd2VkIHRvIGhhdmUgcHJlcmVsZWFzZXNcbiAgICAvLyBGb3IgZXhhbXBsZSwgXjEuMi4zLXByLjEgZGVzdWdhcnMgdG8gPj0xLjIuMy1wci4xIDwyLjAuMFxuICAgIC8vIFRoYXQgc2hvdWxkIGFsbG93IGAxLjIuMy1wci4yYCB0byBwYXNzLlxuICAgIC8vIEhvd2V2ZXIsIGAxLjIuNC1hbHBoYS5ub3RyZWFkeWAgc2hvdWxkIE5PVCBiZSBhbGxvd2VkLFxuICAgIC8vIGV2ZW4gdGhvdWdoIGl0J3Mgd2l0aGluIHRoZSByYW5nZSBzZXQgYnkgdGhlIGNvbXBhcmF0b3JzLlxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzZXRbaV0uc2VtdmVyID09PSBBTlkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXRbaV0uc2VtdmVyLnByZXJlbGVhc2UubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBhbGxvd2VkOiBTZW1WZXIgPSBzZXRbaV0uc2VtdmVyO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgYWxsb3dlZC5tYWpvciA9PT0gdmVyc2lvbi5tYWpvciAmJlxuICAgICAgICAgIGFsbG93ZWQubWlub3IgPT09IHZlcnNpb24ubWlub3IgJiZcbiAgICAgICAgICBhbGxvd2VkLnBhdGNoID09PSB2ZXJzaW9uLnBhdGNoXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmVyc2lvbiBoYXMgYSAtcHJlLCBidXQgaXQncyBub3Qgb25lIG9mIHRoZSBvbmVzIHdlIGxpa2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIHRha2UgYSBzZXQgb2YgY29tcGFyYXRvcnMgYW5kIGRldGVybWluZSB3aGV0aGVyIHRoZXJlXG4vLyBleGlzdHMgYSB2ZXJzaW9uIHdoaWNoIGNhbiBzYXRpc2Z5IGl0XG5mdW5jdGlvbiBpc1NhdGlzZmlhYmxlKFxuICBjb21wYXJhdG9yczogcmVhZG9ubHkgQ29tcGFyYXRvcltdLFxuICBvcHRpb25zPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgbGV0IHJlc3VsdDogYm9vbGVhbiA9IHRydWU7XG4gIGNvbnN0IHJlbWFpbmluZ0NvbXBhcmF0b3JzOiBDb21wYXJhdG9yW10gPSBjb21wYXJhdG9ycy5zbGljZSgpO1xuICBsZXQgdGVzdENvbXBhcmF0b3IgPSByZW1haW5pbmdDb21wYXJhdG9ycy5wb3AoKTtcblxuICB3aGlsZSAocmVzdWx0ICYmIHJlbWFpbmluZ0NvbXBhcmF0b3JzLmxlbmd0aCkge1xuICAgIHJlc3VsdCA9IHJlbWFpbmluZ0NvbXBhcmF0b3JzLmV2ZXJ5KChvdGhlckNvbXBhcmF0b3IpID0+IHtcbiAgICAgIHJldHVybiB0ZXN0Q29tcGFyYXRvcj8uaW50ZXJzZWN0cyhvdGhlckNvbXBhcmF0b3IsIG9wdGlvbnMpO1xuICAgIH0pO1xuXG4gICAgdGVzdENvbXBhcmF0b3IgPSByZW1haW5pbmdDb21wYXJhdG9ycy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIE1vc3RseSBqdXN0IGZvciB0ZXN0aW5nIGFuZCBsZWdhY3kgQVBJIHJlYXNvbnNcbmV4cG9ydCBmdW5jdGlvbiB0b0NvbXBhcmF0b3JzKFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBzdHJpbmdbXVtdIHtcbiAgcmV0dXJuIG5ldyBSYW5nZShyYW5nZSwgb3B0aW9uc09yTG9vc2UpLnNldC5tYXAoKGNvbXApID0+IHtcbiAgICByZXR1cm4gY29tcFxuICAgICAgLm1hcCgoYykgPT4gYy52YWx1ZSlcbiAgICAgIC5qb2luKFwiIFwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnNwbGl0KFwiIFwiKTtcbiAgfSk7XG59XG5cbi8vIGNvbXByaXNlZCBvZiB4cmFuZ2VzLCB0aWxkZXMsIHN0YXJzLCBhbmQgZ3RsdCdzIGF0IHRoaXMgcG9pbnQuXG4vLyBhbHJlYWR5IHJlcGxhY2VkIHRoZSBoeXBoZW4gcmFuZ2VzXG4vLyB0dXJuIGludG8gYSBzZXQgb2YgSlVTVCBjb21wYXJhdG9ycy5cbmZ1bmN0aW9uIHBhcnNlQ29tcGFyYXRvcihjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICBjb21wID0gcmVwbGFjZUNhcmV0cyhjb21wLCBvcHRpb25zKTtcbiAgY29tcCA9IHJlcGxhY2VUaWxkZXMoY29tcCwgb3B0aW9ucyk7XG4gIGNvbXAgPSByZXBsYWNlWFJhbmdlcyhjb21wLCBvcHRpb25zKTtcbiAgY29tcCA9IHJlcGxhY2VTdGFycyhjb21wLCBvcHRpb25zKTtcbiAgcmV0dXJuIGNvbXA7XG59XG5cbmZ1bmN0aW9uIGlzWChpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAhaWQgfHwgaWQudG9Mb3dlckNhc2UoKSA9PT0gXCJ4XCIgfHwgaWQgPT09IFwiKlwiO1xufVxuXG4vLyB+LCB+PiAtLT4gKiAoYW55LCBraW5kYSBzaWxseSlcbi8vIH4yLCB+Mi54LCB+Mi54LngsIH4+Miwgfj4yLnggfj4yLngueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIH4yLjAsIH4yLjAueCwgfj4yLjAsIH4+Mi4wLnggLS0+ID49Mi4wLjAgPDIuMS4wXG4vLyB+MS4yLCB+MS4yLngsIH4+MS4yLCB+PjEuMi54IC0tPiA+PTEuMi4wIDwxLjMuMFxuLy8gfjEuMi4zLCB+PjEuMi4zIC0tPiA+PTEuMi4zIDwxLjMuMFxuLy8gfjEuMi4wLCB+PjEuMi4wIC0tPiA+PTEuMi4wIDwxLjMuMFxuZnVuY3Rpb24gcmVwbGFjZVRpbGRlcyhjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICByZXR1cm4gY29tcFxuICAgIC50cmltKClcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5tYXAoKGNvbXApID0+IHJlcGxhY2VUaWxkZShjb21wLCBvcHRpb25zKSlcbiAgICAuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VUaWxkZShjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICBjb25zdCByOiBSZWdFeHAgPSBvcHRpb25zLmxvb3NlID8gcmVbVElMREVMT09TRV0gOiByZVtUSUxERV07XG4gIHJldHVybiBjb21wLnJlcGxhY2UoXG4gICAgcixcbiAgICAoXzogc3RyaW5nLCBNOiBzdHJpbmcsIG06IHN0cmluZywgcDogc3RyaW5nLCBwcjogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcmV0OiBzdHJpbmc7XG5cbiAgICAgIGlmIChpc1goTSkpIHtcbiAgICAgICAgcmV0ID0gXCJcIjtcbiAgICAgIH0gZWxzZSBpZiAoaXNYKG0pKSB7XG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi4wLjAgPFwiICsgKCtNICsgMSkgKyBcIi4wLjBcIjtcbiAgICAgIH0gZWxzZSBpZiAoaXNYKHApKSB7XG4gICAgICAgIC8vIH4xLjIgPT0gPj0xLjIuMCA8MS4zLjBcbiAgICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLjAgPFwiICsgTSArIFwiLlwiICsgKCttICsgMSkgKyBcIi4wXCI7XG4gICAgICB9IGVsc2UgaWYgKHByKSB7XG4gICAgICAgIHJldCA9IFwiPj1cIiArXG4gICAgICAgICAgTSArXG4gICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgIG0gK1xuICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICBwICtcbiAgICAgICAgICBcIi1cIiArXG4gICAgICAgICAgcHIgK1xuICAgICAgICAgIFwiIDxcIiArXG4gICAgICAgICAgTSArXG4gICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgICgrbSArIDEpICtcbiAgICAgICAgICBcIi4wXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB+MS4yLjMgPT0gPj0xLjIuMyA8MS4zLjBcbiAgICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLlwiICsgcCArIFwiIDxcIiArIE0gKyBcIi5cIiArICgrbSArIDEpICsgXCIuMFwiO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG4gICk7XG59XG5cbi8vIF4gLS0+ICogKGFueSwga2luZGEgc2lsbHkpXG4vLyBeMiwgXjIueCwgXjIueC54IC0tPiA+PTIuMC4wIDwzLjAuMFxuLy8gXjIuMCwgXjIuMC54IC0tPiA+PTIuMC4wIDwzLjAuMFxuLy8gXjEuMiwgXjEuMi54IC0tPiA+PTEuMi4wIDwyLjAuMFxuLy8gXjEuMi4zIC0tPiA+PTEuMi4zIDwyLjAuMFxuLy8gXjEuMi4wIC0tPiA+PTEuMi4wIDwyLjAuMFxuZnVuY3Rpb24gcmVwbGFjZUNhcmV0cyhjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICByZXR1cm4gY29tcFxuICAgIC50cmltKClcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5tYXAoKGNvbXApID0+IHJlcGxhY2VDYXJldChjb21wLCBvcHRpb25zKSlcbiAgICAuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VDYXJldChjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICBjb25zdCByOiBSZWdFeHAgPSBvcHRpb25zLmxvb3NlID8gcmVbQ0FSRVRMT09TRV0gOiByZVtDQVJFVF07XG4gIHJldHVybiBjb21wLnJlcGxhY2UociwgKF86IHN0cmluZywgTSwgbSwgcCwgcHIpID0+IHtcbiAgICBsZXQgcmV0OiBzdHJpbmc7XG5cbiAgICBpZiAoaXNYKE0pKSB7XG4gICAgICByZXQgPSBcIlwiO1xuICAgIH0gZWxzZSBpZiAoaXNYKG0pKSB7XG4gICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuMC4wIDxcIiArICgrTSArIDEpICsgXCIuMC4wXCI7XG4gICAgfSBlbHNlIGlmIChpc1gocCkpIHtcbiAgICAgIGlmIChNID09PSBcIjBcIikge1xuICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuMCA8XCIgKyBNICsgXCIuXCIgKyAoK20gKyAxKSArIFwiLjBcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi4wIDxcIiArICgrTSArIDEpICsgXCIuMC4wXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcikge1xuICAgICAgaWYgKE0gPT09IFwiMFwiKSB7XG4gICAgICAgIGlmIChtID09PSBcIjBcIikge1xuICAgICAgICAgIHJldCA9IFwiPj1cIiArXG4gICAgICAgICAgICBNICtcbiAgICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAgIG0gK1xuICAgICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgICAgcCArXG4gICAgICAgICAgICBcIi1cIiArXG4gICAgICAgICAgICBwciArXG4gICAgICAgICAgICBcIiA8XCIgK1xuICAgICAgICAgICAgTSArXG4gICAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgICBtICtcbiAgICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAgICgrcCArIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldCA9IFwiPj1cIiArXG4gICAgICAgICAgICBNICtcbiAgICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAgIG0gK1xuICAgICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgICAgcCArXG4gICAgICAgICAgICBcIi1cIiArXG4gICAgICAgICAgICBwciArXG4gICAgICAgICAgICBcIiA8XCIgK1xuICAgICAgICAgICAgTSArXG4gICAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgICAoK20gKyAxKSArXG4gICAgICAgICAgICBcIi4wXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi5cIiArIHAgKyBcIi1cIiArIHByICsgXCIgPFwiICsgKCtNICsgMSkgK1xuICAgICAgICAgIFwiLjAuMFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoTSA9PT0gXCIwXCIpIHtcbiAgICAgICAgaWYgKG0gPT09IFwiMFwiKSB7XG4gICAgICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLlwiICsgcCArIFwiIDxcIiArIE0gKyBcIi5cIiArIG0gKyBcIi5cIiArXG4gICAgICAgICAgICAoK3AgKyAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuXCIgKyBwICsgXCIgPFwiICsgTSArIFwiLlwiICsgKCttICsgMSkgKyBcIi4wXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi5cIiArIHAgKyBcIiA8XCIgKyAoK00gKyAxKSArIFwiLjAuMFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlWFJhbmdlcyhjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICByZXR1cm4gY29tcFxuICAgIC5zcGxpdCgvXFxzKy8pXG4gICAgLm1hcCgoY29tcCkgPT4gcmVwbGFjZVhSYW5nZShjb21wLCBvcHRpb25zKSlcbiAgICAuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VYUmFuZ2UoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgY29tcCA9IGNvbXAudHJpbSgpO1xuICBjb25zdCByOiBSZWdFeHAgPSBvcHRpb25zLmxvb3NlID8gcmVbWFJBTkdFTE9PU0VdIDogcmVbWFJBTkdFXTtcbiAgcmV0dXJuIGNvbXAucmVwbGFjZShyLCAocmV0OiBzdHJpbmcsIGd0bHQsIE0sIG0sIHAsIHByKSA9PiB7XG4gICAgY29uc3QgeE06IGJvb2xlYW4gPSBpc1goTSk7XG4gICAgY29uc3QgeG06IGJvb2xlYW4gPSB4TSB8fCBpc1gobSk7XG4gICAgY29uc3QgeHA6IGJvb2xlYW4gPSB4bSB8fCBpc1gocCk7XG4gICAgY29uc3QgYW55WDogYm9vbGVhbiA9IHhwO1xuXG4gICAgaWYgKGd0bHQgPT09IFwiPVwiICYmIGFueVgpIHtcbiAgICAgIGd0bHQgPSBcIlwiO1xuICAgIH1cblxuICAgIGlmICh4TSkge1xuICAgICAgaWYgKGd0bHQgPT09IFwiPlwiIHx8IGd0bHQgPT09IFwiPFwiKSB7XG4gICAgICAgIC8vIG5vdGhpbmcgaXMgYWxsb3dlZFxuICAgICAgICByZXQgPSBcIjwwLjAuMFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm90aGluZyBpcyBmb3JiaWRkZW5cbiAgICAgICAgcmV0ID0gXCIqXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChndGx0ICYmIGFueVgpIHtcbiAgICAgIC8vIHdlIGtub3cgcGF0Y2ggaXMgYW4geCwgYmVjYXVzZSB3ZSBoYXZlIGFueSB4IGF0IGFsbC5cbiAgICAgIC8vIHJlcGxhY2UgWCB3aXRoIDBcbiAgICAgIGlmICh4bSkge1xuICAgICAgICBtID0gMDtcbiAgICAgIH1cbiAgICAgIHAgPSAwO1xuXG4gICAgICBpZiAoZ3RsdCA9PT0gXCI+XCIpIHtcbiAgICAgICAgLy8gPjEgPT4gPj0yLjAuMFxuICAgICAgICAvLyA+MS4yID0+ID49MS4zLjBcbiAgICAgICAgLy8gPjEuMi4zID0+ID49IDEuMi40XG4gICAgICAgIGd0bHQgPSBcIj49XCI7XG4gICAgICAgIGlmICh4bSkge1xuICAgICAgICAgIE0gPSArTSArIDE7XG4gICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgcCA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbSA9ICttICsgMTtcbiAgICAgICAgICBwID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChndGx0ID09PSBcIjw9XCIpIHtcbiAgICAgICAgLy8gPD0wLjcueCBpcyBhY3R1YWxseSA8MC44LjAsIHNpbmNlIGFueSAwLjcueCBzaG91bGRcbiAgICAgICAgLy8gcGFzcy4gIFNpbWlsYXJseSwgPD03LnggaXMgYWN0dWFsbHkgPDguMC4wLCBldGMuXG4gICAgICAgIGd0bHQgPSBcIjxcIjtcbiAgICAgICAgaWYgKHhtKSB7XG4gICAgICAgICAgTSA9ICtNICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtID0gK20gKyAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldCA9IGd0bHQgKyBNICsgXCIuXCIgKyBtICsgXCIuXCIgKyBwO1xuICAgIH0gZWxzZSBpZiAoeG0pIHtcbiAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi4wLjAgPFwiICsgKCtNICsgMSkgKyBcIi4wLjBcIjtcbiAgICB9IGVsc2UgaWYgKHhwKSB7XG4gICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuMCA8XCIgKyBNICsgXCIuXCIgKyAoK20gKyAxKSArIFwiLjBcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcbn1cblxuLy8gQmVjYXVzZSAqIGlzIEFORC1lZCB3aXRoIGV2ZXJ5dGhpbmcgZWxzZSBpbiB0aGUgY29tcGFyYXRvcixcbi8vIGFuZCAnJyBtZWFucyBcImFueSB2ZXJzaW9uXCIsIGp1c3QgcmVtb3ZlIHRoZSAqcyBlbnRpcmVseS5cbmZ1bmN0aW9uIHJlcGxhY2VTdGFycyhjb21wOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpOiBzdHJpbmcge1xuICAvLyBMb29zZW5lc3MgaXMgaWdub3JlZCBoZXJlLiAgc3RhciBpcyBhbHdheXMgYXMgbG9vc2UgYXMgaXQgZ2V0cyFcbiAgcmV0dXJuIGNvbXAudHJpbSgpLnJlcGxhY2UocmVbU1RBUl0sIFwiXCIpO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGlzIHBhc3NlZCB0byBzdHJpbmcucmVwbGFjZShyZVtIWVBIRU5SQU5HRV0pXG4vLyBNLCBtLCBwYXRjaCwgcHJlcmVsZWFzZSwgYnVpbGRcbi8vIDEuMiAtIDMuNC41ID0+ID49MS4yLjAgPD0zLjQuNVxuLy8gMS4yLjMgLSAzLjQgPT4gPj0xLjIuMCA8My41LjAgQW55IDMuNC54IHdpbGwgZG9cbi8vIDEuMiAtIDMuNCA9PiA+PTEuMi4wIDwzLjUuMFxuZnVuY3Rpb24gaHlwaGVuUmVwbGFjZShcbiAgJDA6IGFueSxcbiAgZnJvbTogYW55LFxuICBmTTogYW55LFxuICBmbTogYW55LFxuICBmcDogYW55LFxuICBmcHI6IGFueSxcbiAgZmI6IGFueSxcbiAgdG86IGFueSxcbiAgdE06IGFueSxcbiAgdG06IGFueSxcbiAgdHA6IGFueSxcbiAgdHByOiBhbnksXG4gIHRiOiBhbnksXG4pIHtcbiAgaWYgKGlzWChmTSkpIHtcbiAgICBmcm9tID0gXCJcIjtcbiAgfSBlbHNlIGlmIChpc1goZm0pKSB7XG4gICAgZnJvbSA9IFwiPj1cIiArIGZNICsgXCIuMC4wXCI7XG4gIH0gZWxzZSBpZiAoaXNYKGZwKSkge1xuICAgIGZyb20gPSBcIj49XCIgKyBmTSArIFwiLlwiICsgZm0gKyBcIi4wXCI7XG4gIH0gZWxzZSB7XG4gICAgZnJvbSA9IFwiPj1cIiArIGZyb207XG4gIH1cblxuICBpZiAoaXNYKHRNKSkge1xuICAgIHRvID0gXCJcIjtcbiAgfSBlbHNlIGlmIChpc1godG0pKSB7XG4gICAgdG8gPSBcIjxcIiArICgrdE0gKyAxKSArIFwiLjAuMFwiO1xuICB9IGVsc2UgaWYgKGlzWCh0cCkpIHtcbiAgICB0byA9IFwiPFwiICsgdE0gKyBcIi5cIiArICgrdG0gKyAxKSArIFwiLjBcIjtcbiAgfSBlbHNlIGlmICh0cHIpIHtcbiAgICB0byA9IFwiPD1cIiArIHRNICsgXCIuXCIgKyB0bSArIFwiLlwiICsgdHAgKyBcIi1cIiArIHRwcjtcbiAgfSBlbHNlIHtcbiAgICB0byA9IFwiPD1cIiArIHRvO1xuICB9XG5cbiAgcmV0dXJuIChmcm9tICsgXCIgXCIgKyB0bykudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F0aXNmaWVzKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIHJhbmdlID0gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiByYW5nZS50ZXN0KHZlcnNpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF4U2F0aXNmeWluZzxUIGV4dGVuZHMgc3RyaW5nIHwgU2VtVmVyPihcbiAgdmVyc2lvbnM6IFJlYWRvbmx5QXJyYXk8VD4sXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFQgfCBudWxsIHtcbiAgLy90b2RvXG4gIHZhciBtYXg6IFQgfCBTZW1WZXIgfCBudWxsID0gbnVsbDtcbiAgdmFyIG1heFNWOiBTZW1WZXIgfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICB2YXIgcmFuZ2VPYmogPSBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKTtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2ZXJzaW9ucy5mb3JFYWNoKCh2KSA9PiB7XG4gICAgaWYgKHJhbmdlT2JqLnRlc3QodikpIHtcbiAgICAgIC8vIHNhdGlzZmllcyh2LCByYW5nZSwgb3B0aW9ucylcbiAgICAgIGlmICghbWF4IHx8IChtYXhTViAmJiBtYXhTVi5jb21wYXJlKHYpID09PSAtMSkpIHtcbiAgICAgICAgLy8gY29tcGFyZShtYXgsIHYsIHRydWUpXG4gICAgICAgIG1heCA9IHY7XG4gICAgICAgIG1heFNWID0gbmV3IFNlbVZlcihtYXgsIG9wdGlvbnNPckxvb3NlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbWF4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWluU2F0aXNmeWluZzxUIGV4dGVuZHMgc3RyaW5nIHwgU2VtVmVyPihcbiAgdmVyc2lvbnM6IFJlYWRvbmx5QXJyYXk8VD4sXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFQgfCBudWxsIHtcbiAgLy90b2RvXG4gIHZhciBtaW46IGFueSA9IG51bGw7XG4gIHZhciBtaW5TVjogYW55ID0gbnVsbDtcbiAgdHJ5IHtcbiAgICB2YXIgcmFuZ2VPYmogPSBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKTtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2ZXJzaW9ucy5mb3JFYWNoKCh2KSA9PiB7XG4gICAgaWYgKHJhbmdlT2JqLnRlc3QodikpIHtcbiAgICAgIC8vIHNhdGlzZmllcyh2LCByYW5nZSwgb3B0aW9ucylcbiAgICAgIGlmICghbWluIHx8IG1pblNWLmNvbXBhcmUodikgPT09IDEpIHtcbiAgICAgICAgLy8gY29tcGFyZShtaW4sIHYsIHRydWUpXG4gICAgICAgIG1pbiA9IHY7XG4gICAgICAgIG1pblNWID0gbmV3IFNlbVZlcihtaW4sIG9wdGlvbnNPckxvb3NlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWluVmVyc2lvbihcbiAgcmFuZ2U6IHN0cmluZyB8IFJhbmdlLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogU2VtVmVyIHwgbnVsbCB7XG4gIHJhbmdlID0gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgdmFyIG1pbnZlcjogU2VtVmVyIHwgbnVsbCA9IG5ldyBTZW1WZXIoXCIwLjAuMFwiKTtcbiAgaWYgKHJhbmdlLnRlc3QobWludmVyKSkge1xuICAgIHJldHVybiBtaW52ZXI7XG4gIH1cblxuICBtaW52ZXIgPSBuZXcgU2VtVmVyKFwiMC4wLjAtMFwiKTtcbiAgaWYgKHJhbmdlLnRlc3QobWludmVyKSkge1xuICAgIHJldHVybiBtaW52ZXI7XG4gIH1cblxuICBtaW52ZXIgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlLnNldC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBjb21wYXJhdG9ycyA9IHJhbmdlLnNldFtpXTtcblxuICAgIGNvbXBhcmF0b3JzLmZvckVhY2goKGNvbXBhcmF0b3IpID0+IHtcbiAgICAgIC8vIENsb25lIHRvIGF2b2lkIG1hbmlwdWxhdGluZyB0aGUgY29tcGFyYXRvcidzIHNlbXZlciBvYmplY3QuXG4gICAgICB2YXIgY29tcHZlciA9IG5ldyBTZW1WZXIoY29tcGFyYXRvci5zZW12ZXIudmVyc2lvbik7XG4gICAgICBzd2l0Y2ggKGNvbXBhcmF0b3Iub3BlcmF0b3IpIHtcbiAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICBpZiAoY29tcHZlci5wcmVyZWxlYXNlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29tcHZlci5wYXRjaCsrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb21wdmVyLnByZXJlbGVhc2UucHVzaCgwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29tcHZlci5yYXcgPSBjb21wdmVyLmZvcm1hdCgpO1xuICAgICAgICAvKiBmYWxsdGhyb3VnaCAqL1xuICAgICAgICBjYXNlIFwiXCI6XG4gICAgICAgIGNhc2UgXCI+PVwiOlxuICAgICAgICAgIGlmICghbWludmVyIHx8IGd0KG1pbnZlciwgY29tcHZlcikpIHtcbiAgICAgICAgICAgIG1pbnZlciA9IGNvbXB2ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICBjYXNlIFwiPD1cIjpcbiAgICAgICAgICAvKiBJZ25vcmUgbWF4aW11bSB2ZXJzaW9ucyAqL1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgb3BlcmF0aW9uOiBcIiArIGNvbXBhcmF0b3Iub3BlcmF0b3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKG1pbnZlciAmJiByYW5nZS50ZXN0KG1pbnZlcikpIHtcbiAgICByZXR1cm4gbWludmVyO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZFJhbmdlKFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UgfCBudWxsLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgaWYgKHJhbmdlID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAvLyBSZXR1cm4gJyonIGluc3RlYWQgb2YgJycgc28gdGhhdCB0cnV0aGluZXNzIHdvcmtzLlxuICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBpZiBpdCdzIGludmFsaWQgYW55d2F5XG4gICAgcmV0dXJuIG5ldyBSYW5nZShyYW5nZSwgb3B0aW9uc09yTG9vc2UpLnJhbmdlIHx8IFwiKlwiO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgdmVyc2lvbiBpcyBsZXNzIHRoYW4gYWxsIHRoZSB2ZXJzaW9ucyBwb3NzaWJsZSBpbiB0aGUgcmFuZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsdHIoXG4gIHZlcnNpb246IHN0cmluZyB8IFNlbVZlcixcbiAgcmFuZ2U6IHN0cmluZyB8IFJhbmdlLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBvdXRzaWRlKHZlcnNpb24sIHJhbmdlLCBcIjxcIiwgb3B0aW9uc09yTG9vc2UpO1xufVxuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIHZlcnNpb24gaXMgZ3JlYXRlciB0aGFuIGFsbCB0aGUgdmVyc2lvbnMgcG9zc2libGUgaW4gdGhlIHJhbmdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3RyKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gb3V0c2lkZSh2ZXJzaW9uLCByYW5nZSwgXCI+XCIsIG9wdGlvbnNPckxvb3NlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmVyc2lvbiBpcyBvdXRzaWRlIHRoZSBib3VuZHMgb2YgdGhlIHJhbmdlIGluIGVpdGhlciB0aGUgaGlnaCBvciBsb3cgZGlyZWN0aW9uLlxuICogVGhlIGhpbG8gYXJndW1lbnQgbXVzdCBiZSBlaXRoZXIgdGhlIHN0cmluZyAnPicgb3IgJzwnLiAoVGhpcyBpcyB0aGUgZnVuY3Rpb24gY2FsbGVkIGJ5IGd0ciBhbmQgbHRyLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG91dHNpZGUoXG4gIHZlcnNpb246IHN0cmluZyB8IFNlbVZlcixcbiAgcmFuZ2U6IHN0cmluZyB8IFJhbmdlLFxuICBoaWxvOiBcIj5cIiB8IFwiPFwiLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIG9wdGlvbnNPckxvb3NlKTtcbiAgcmFuZ2UgPSBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKTtcblxuICBsZXQgZ3RmbjogdHlwZW9mIGd0O1xuICBsZXQgbHRlZm46IHR5cGVvZiBsdGU7XG4gIGxldCBsdGZuOiB0eXBlb2YgbHQ7XG4gIGxldCBjb21wOiBzdHJpbmc7XG4gIGxldCBlY29tcDogc3RyaW5nO1xuICBzd2l0Y2ggKGhpbG8pIHtcbiAgICBjYXNlIFwiPlwiOlxuICAgICAgZ3RmbiA9IGd0O1xuICAgICAgbHRlZm4gPSBsdGU7XG4gICAgICBsdGZuID0gbHQ7XG4gICAgICBjb21wID0gXCI+XCI7XG4gICAgICBlY29tcCA9IFwiPj1cIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCI8XCI6XG4gICAgICBndGZuID0gbHQ7XG4gICAgICBsdGVmbiA9IGd0ZTtcbiAgICAgIGx0Zm4gPSBndDtcbiAgICAgIGNvbXAgPSBcIjxcIjtcbiAgICAgIGVjb21wID0gXCI8PVwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ011c3QgcHJvdmlkZSBhIGhpbG8gdmFsIG9mIFwiPFwiIG9yIFwiPlwiJyk7XG4gIH1cblxuICAvLyBJZiBpdCBzYXRpc2lmZXMgdGhlIHJhbmdlIGl0IGlzIG5vdCBvdXRzaWRlXG4gIGlmIChzYXRpc2ZpZXModmVyc2lvbiwgcmFuZ2UsIG9wdGlvbnNPckxvb3NlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEZyb20gbm93IG9uLCB2YXJpYWJsZSB0ZXJtcyBhcmUgYXMgaWYgd2UncmUgaW4gXCJndHJcIiBtb2RlLlxuICAvLyBidXQgbm90ZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgZmxpcHBlZCBmb3IgdGhlIFwibHRyXCIgZnVuY3Rpb24uXG5cbiAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHJhbmdlLnNldC5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IGNvbXBhcmF0b3JzOiByZWFkb25seSBDb21wYXJhdG9yW10gPSByYW5nZS5zZXRbaV07XG5cbiAgICBsZXQgaGlnaDogQ29tcGFyYXRvciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsb3c6IENvbXBhcmF0b3IgfCBudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IGNvbXBhcmF0b3Igb2YgY29tcGFyYXRvcnMpIHtcbiAgICAgIGlmIChjb21wYXJhdG9yLnNlbXZlciA9PT0gQU5ZKSB7XG4gICAgICAgIGNvbXBhcmF0b3IgPSBuZXcgQ29tcGFyYXRvcihcIj49MC4wLjBcIik7XG4gICAgICB9XG4gICAgICBoaWdoID0gaGlnaCB8fCBjb21wYXJhdG9yO1xuICAgICAgbG93ID0gbG93IHx8IGNvbXBhcmF0b3I7XG4gICAgICBpZiAoZ3Rmbihjb21wYXJhdG9yLnNlbXZlciwgaGlnaC5zZW12ZXIsIG9wdGlvbnNPckxvb3NlKSkge1xuICAgICAgICBoaWdoID0gY29tcGFyYXRvcjtcbiAgICAgIH0gZWxzZSBpZiAobHRmbihjb21wYXJhdG9yLnNlbXZlciwgbG93LnNlbXZlciwgb3B0aW9uc09yTG9vc2UpKSB7XG4gICAgICAgIGxvdyA9IGNvbXBhcmF0b3I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhpZ2ggPT09IG51bGwgfHwgbG93ID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIElmIHRoZSBlZGdlIHZlcnNpb24gY29tcGFyYXRvciBoYXMgYSBvcGVyYXRvciB0aGVuIG91ciB2ZXJzaW9uXG4gICAgLy8gaXNuJ3Qgb3V0c2lkZSBpdFxuICAgIGlmIChoaWdoIS5vcGVyYXRvciA9PT0gY29tcCB8fCBoaWdoIS5vcGVyYXRvciA9PT0gZWNvbXApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbG93ZXN0IHZlcnNpb24gY29tcGFyYXRvciBoYXMgYW4gb3BlcmF0b3IgYW5kIG91ciB2ZXJzaW9uXG4gICAgLy8gaXMgbGVzcyB0aGFuIGl0IHRoZW4gaXQgaXNuJ3QgaGlnaGVyIHRoYW4gdGhlIHJhbmdlXG4gICAgaWYgKFxuICAgICAgKCFsb3chLm9wZXJhdG9yIHx8IGxvdyEub3BlcmF0b3IgPT09IGNvbXApICYmXG4gICAgICBsdGVmbih2ZXJzaW9uLCBsb3chLnNlbXZlcilcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGxvdyEub3BlcmF0b3IgPT09IGVjb21wICYmIGx0Zm4odmVyc2lvbiwgbG93IS5zZW12ZXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJlcmVsZWFzZShcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogUmVhZG9ubHlBcnJheTxzdHJpbmcgfCBudW1iZXI+IHwgbnVsbCB7XG4gIHZhciBwYXJzZWQgPSBwYXJzZSh2ZXJzaW9uLCBvcHRpb25zT3JMb29zZSk7XG4gIHJldHVybiBwYXJzZWQgJiYgcGFyc2VkLnByZXJlbGVhc2UubGVuZ3RoID8gcGFyc2VkLnByZXJlbGVhc2UgOiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIGFueSBvZiB0aGUgcmFuZ2VzIGNvbXBhcmF0b3JzIGludGVyc2VjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0cyhcbiAgcmFuZ2UxOiBzdHJpbmcgfCBSYW5nZSB8IENvbXBhcmF0b3IsXG4gIHJhbmdlMjogc3RyaW5nIHwgUmFuZ2UgfCBDb21wYXJhdG9yLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJhbmdlMSA9IG5ldyBSYW5nZShyYW5nZTEsIG9wdGlvbnNPckxvb3NlKTtcbiAgcmFuZ2UyID0gbmV3IFJhbmdlKHJhbmdlMiwgb3B0aW9uc09yTG9vc2UpO1xuICByZXR1cm4gcmFuZ2UxLmludGVyc2VjdHMocmFuZ2UyKTtcbn1cblxuLyoqXG4gKiBDb2VyY2VzIGEgc3RyaW5nIHRvIHNlbXZlciBpZiBwb3NzaWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBTZW1WZXIgfCBudWxsIHtcbiAgaWYgKHZlcnNpb24gaW5zdGFuY2VvZiBTZW1WZXIpIHtcbiAgICByZXR1cm4gdmVyc2lvbjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgbWF0Y2ggPSB2ZXJzaW9uLm1hdGNoKHJlW0NPRVJDRV0pO1xuXG4gIGlmIChtYXRjaCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gcGFyc2UoXG4gICAgbWF0Y2hbMV0gKyBcIi5cIiArIChtYXRjaFsyXSB8fCBcIjBcIikgKyBcIi5cIiArIChtYXRjaFszXSB8fCBcIjBcIiksXG4gICAgb3B0aW9uc09yTG9vc2UsXG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlbVZlcjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyQkEsRUFBc0UsQUFBdEUsb0VBQXNFO0FBQ3RFLEVBQW9ELEFBQXBELGtEQUFvRDtBQUNwRCxNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixHQUFHLENBQU87QUFFMUMsS0FBSyxDQUFDLFVBQVUsR0FBVyxHQUFHO0FBRTlCLEVBQXdDLEFBQXhDLHNDQUF3QztBQUN4QyxLQUFLLENBQUMseUJBQXlCLEdBQVcsRUFBRTtBQUU1QyxFQUFxQixBQUFyQixtQkFBcUI7QUFDckIsS0FBSyxDQUFDLEVBQUUsR0FBYSxDQUFDLENBQUM7QUFDdkIsS0FBSyxDQUFDLEdBQUcsR0FBYSxDQUFDLENBQUM7QUFDeEIsR0FBRyxDQUFDLENBQUMsR0FBVyxDQUFDO0FBRWpCLEVBQWdFLEFBQWhFLDhEQUFnRTtBQUNoRSxFQUFrRCxBQUFsRCxnREFBa0Q7QUFFbEQsRUFBd0IsQUFBeEIsc0JBQXdCO0FBQ3hCLEVBQXFFLEFBQXJFLG1FQUFxRTtBQUVyRSxLQUFLLENBQUMsaUJBQWlCLEdBQVcsQ0FBQztBQUNuQyxHQUFHLENBQUMsaUJBQWlCLElBQUksQ0FBYTtBQUN0QyxLQUFLLENBQUMsc0JBQXNCLEdBQVcsQ0FBQztBQUN4QyxHQUFHLENBQUMsc0JBQXNCLElBQUksQ0FBUTtB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