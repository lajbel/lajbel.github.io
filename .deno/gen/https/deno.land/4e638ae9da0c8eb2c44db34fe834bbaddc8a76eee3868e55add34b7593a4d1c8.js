export const SEMVER_SPEC_VERSION = "2.0.0";
const MAX_LENGTH = 256;
const MAX_SAFE_COMPONENT_LENGTH = 16;
const re = [];
const src = [];
let R = 0;
const NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";
const NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = "[0-9]+";
const NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
const MAINVERSION = R++;
const nid = src[NUMERICIDENTIFIER];
src[MAINVERSION] = `(${nid})\\.(${nid})\\.(${nid})`;
const MAINVERSIONLOOSE = R++;
const nidl = src[NUMERICIDENTIFIERLOOSE];
src[MAINVERSIONLOOSE] = `(${nidl})\\.(${nidl})\\.(${nidl})`;
const PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = "(?:" + src[NUMERICIDENTIFIER] + "|" +
    src[NONNUMERICIDENTIFIER] + ")";
const PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = "(?:" + src[NUMERICIDENTIFIERLOOSE] + "|" +
    src[NONNUMERICIDENTIFIER] + ")";
const PRERELEASE = R++;
src[PRERELEASE] = "(?:-(" +
    src[PRERELEASEIDENTIFIER] +
    "(?:\\." +
    src[PRERELEASEIDENTIFIER] +
    ")*))";
const PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = "(?:-?(" +
    src[PRERELEASEIDENTIFIERLOOSE] +
    "(?:\\." +
    src[PRERELEASEIDENTIFIERLOOSE] +
    ")*))";
const BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";
const BUILD = R++;
src[BUILD] = "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." +
    src[BUILDIDENTIFIER] + ")*))";
const FULL = R++;
const FULLPLAIN = "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] +
    "?";
src[FULL] = "^" + FULLPLAIN + "$";
const LOOSEPLAIN = "[v=\\s]*" +
    src[MAINVERSIONLOOSE] +
    src[PRERELEASELOOSE] +
    "?" +
    src[BUILD] +
    "?";
const LOOSE = R++;
src[LOOSE] = "^" + LOOSEPLAIN + "$";
const GTLT = R++;
src[GTLT] = "((?:<|>)?=?)";
const XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + "|x|X|\\*";
const XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";
const XRANGEPLAIN = R++;
src[XRANGEPLAIN] = "[v=\\s]*(" +
    src[XRANGEIDENTIFIER] +
    ")" +
    "(?:\\.(" +
    src[XRANGEIDENTIFIER] +
    ")" +
    "(?:\\.(" +
    src[XRANGEIDENTIFIER] +
    ")" +
    "(?:" +
    src[PRERELEASE] +
    ")?" +
    src[BUILD] +
    "?" +
    ")?)?";
const XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = "[v=\\s]*(" +
    src[XRANGEIDENTIFIERLOOSE] +
    ")" +
    "(?:\\.(" +
    src[XRANGEIDENTIFIERLOOSE] +
    ")" +
    "(?:\\.(" +
    src[XRANGEIDENTIFIERLOOSE] +
    ")" +
    "(?:" +
    src[PRERELEASELOOSE] +
    ")?" +
    src[BUILD] +
    "?" +
    ")?)?";
const XRANGE = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";
const XRANGELOOSE = R++;
src[XRANGELOOSE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAINLOOSE] + "$";
const COERCE = R++;
src[COERCE] = "(?:^|[^\\d])" +
    "(\\d{1," +
    MAX_SAFE_COMPONENT_LENGTH +
    "})" +
    "(?:\\.(\\d{1," +
    MAX_SAFE_COMPONENT_LENGTH +
    "}))?" +
    "(?:\\.(\\d{1," +
    MAX_SAFE_COMPONENT_LENGTH +
    "}))?" +
    "(?:$|[^\\d])";
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
const COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = "^" + src[GTLT] + "\\s*(" + LOOSEPLAIN + ")$|^$";
const COMPARATOR = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";
const COMPARATORTRIM = R++;
src[COMPARATORTRIM] = "(\\s*)" + src[GTLT] + "\\s*(" + LOOSEPLAIN + "|" +
    src[XRANGEPLAIN] + ")";
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], "g");
const comparatorTrimReplace = "$1$2$3";
const HYPHENRANGE = R++;
src[HYPHENRANGE] = "^\\s*(" +
    src[XRANGEPLAIN] +
    ")" +
    "\\s+-\\s+" +
    "(" +
    src[XRANGEPLAIN] +
    ")" +
    "\\s*$";
const HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = "^\\s*(" +
    src[XRANGEPLAINLOOSE] +
    ")" +
    "\\s+-\\s+" +
    "(" +
    src[XRANGEPLAINLOOSE] +
    ")" +
    "\\s*$";
const STAR = R++;
src[STAR] = "(<|>)?=?\\s*\\*";
for (let i = 0; i < R; i++) {
    if (!re[i]) {
        re[i] = new RegExp(src[i]);
    }
}
export function parse(version, optionsOrLoose) {
    if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
        optionsOrLoose = {
            loose: !!optionsOrLoose,
            includePrerelease: false,
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
    }
    catch (er) {
        return null;
    }
}
export function valid(version, optionsOrLoose) {
    if (version === null)
        return null;
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
    constructor(version, optionsOrLoose) {
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false,
            };
        }
        if (version instanceof SemVer) {
            if (version.loose === optionsOrLoose.loose) {
                return version;
            }
            else {
                version = version.version;
            }
        }
        else if (typeof version !== "string") {
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
        if (!m[4]) {
            this.prerelease = [];
        }
        else {
            this.prerelease = m[4].split(".").map((id) => {
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
        return (compareIdentifiers(this.major, other.major) ||
            compareIdentifiers(this.minor, other.minor) ||
            compareIdentifiers(this.patch, other.patch));
    }
    comparePre(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
            return -1;
        }
        else if (!this.prerelease.length && other.prerelease.length) {
            return 1;
        }
        else if (!this.prerelease.length && !other.prerelease.length) {
            return 0;
        }
        let i = 0;
        do {
            const a = this.prerelease[i];
            const b = other.prerelease[i];
            if (a === undefined && b === undefined) {
                return 0;
            }
            else if (b === undefined) {
                return 1;
            }
            else if (a === undefined) {
                return -1;
            }
            else if (a === b) {
                continue;
            }
            else {
                return compareIdentifiers(a, b);
            }
        } while (++i);
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
            }
            else if (b === undefined) {
                return 1;
            }
            else if (a === undefined) {
                return -1;
            }
            else if (a === b) {
                continue;
            }
            else {
                return compareIdentifiers(a, b);
            }
        } while (++i);
        return 1;
    }
    inc(release, identifier) {
        switch (release) {
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
                this.prerelease.length = 0;
                this.inc("patch", identifier);
                this.inc("pre", identifier);
                break;
            case "prerelease":
                if (this.prerelease.length === 0) {
                    this.inc("patch", identifier);
                }
                this.inc("pre", identifier);
                break;
            case "major":
                if (this.minor !== 0 ||
                    this.patch !== 0 ||
                    this.prerelease.length === 0) {
                    this.major++;
                }
                this.minor = 0;
                this.patch = 0;
                this.prerelease = [];
                break;
            case "minor":
                if (this.patch !== 0 || this.prerelease.length === 0) {
                    this.minor++;
                }
                this.patch = 0;
                this.prerelease = [];
                break;
            case "patch":
                if (this.prerelease.length === 0) {
                    this.patch++;
                }
                this.prerelease = [];
                break;
            case "pre":
                if (this.prerelease.length === 0) {
                    this.prerelease = [0];
                }
                else {
                    let i = this.prerelease.length;
                    while (--i >= 0) {
                        if (typeof this.prerelease[i] === "number") {
                            this.prerelease[i]++;
                            i = -2;
                        }
                    }
                    if (i === -1) {
                        this.prerelease.push(0);
                    }
                }
                if (identifier) {
                    if (this.prerelease[0] === identifier) {
                        if (isNaN(this.prerelease[1])) {
                            this.prerelease = [identifier, 0];
                        }
                    }
                    else {
                        this.prerelease = [identifier, 0];
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
export function inc(version, release, optionsOrLoose, identifier) {
    if (typeof optionsOrLoose === "string") {
        identifier = optionsOrLoose;
        optionsOrLoose = undefined;
    }
    try {
        return new SemVer(version, optionsOrLoose).inc(release, identifier).version;
    }
    catch (er) {
        return null;
    }
}
export function diff(version1, version2, optionsOrLoose) {
    if (eq(version1, version2, optionsOrLoose)) {
        return null;
    }
    else {
        const v1 = parse(version1);
        const v2 = parse(version2);
        let prefix = "";
        let defaultResult = null;
        if (v1 && v2) {
            if (v1.prerelease.length || v2.prerelease.length) {
                prefix = "pre";
                defaultResult = "prerelease";
            }
            for (const key in v1) {
                if (key === "major" || key === "minor" || key === "patch") {
                    if (v1[key] !== v2[key]) {
                        return (prefix + key);
                    }
                }
            }
        }
        return defaultResult;
    }
}
const numeric = /^[0-9]+$/;
export function compareIdentifiers(a, b) {
    const anum = numeric.test(a);
    const bnum = numeric.test(b);
    if (a === null || b === null)
        throw "Comparison against null invalid";
    if (anum && bnum) {
        a = +a;
        b = +b;
    }
    return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
}
export function rcompareIdentifiers(a, b) {
    return compareIdentifiers(b, a);
}
export function major(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).major;
}
export function minor(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).minor;
}
export function patch(v, optionsOrLoose) {
    return new SemVer(v, optionsOrLoose).patch;
}
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
    return list.sort((a, b) => {
        return compareBuild(a, b, optionsOrLoose);
    });
}
export function rsort(list, optionsOrLoose) {
    return list.sort((a, b) => {
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
    switch (operator) {
        case "===":
            if (typeof v1 === "object")
                v1 = v1.version;
            if (typeof v2 === "object")
                v2 = v2.version;
            return v1 === v2;
        case "!==":
            if (typeof v1 === "object")
                v1 = v1.version;
            if (typeof v2 === "object")
                v2 = v2.version;
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
const ANY = {};
export class Comparator {
    semver;
    operator;
    value;
    loose;
    options;
    constructor(comp, optionsOrLoose) {
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false,
            };
        }
        if (comp instanceof Comparator) {
            if (comp.loose === !!optionsOrLoose.loose) {
                return comp;
            }
            else {
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
        }
        else {
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
        if (!m[2]) {
            this.semver = ANY;
        }
        else {
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
                includePrerelease: false,
            };
        }
        let rangeTmp;
        if (this.operator === "") {
            if (this.value === "") {
                return true;
            }
            rangeTmp = new Range(comp.value, optionsOrLoose);
            return satisfies(this.value, rangeTmp, optionsOrLoose);
        }
        else if (comp.operator === "") {
            if (comp.value === "") {
                return true;
            }
            rangeTmp = new Range(this.value, optionsOrLoose);
            return satisfies(comp.semver, rangeTmp, optionsOrLoose);
        }
        const sameDirectionIncreasing = (this.operator === ">=" || this.operator === ">") &&
            (comp.operator === ">=" || comp.operator === ">");
        const sameDirectionDecreasing = (this.operator === "<=" || this.operator === "<") &&
            (comp.operator === "<=" || comp.operator === "<");
        const sameSemVer = this.semver.version === comp.semver.version;
        const differentDirectionsInclusive = (this.operator === ">=" || this.operator === "<=") &&
            (comp.operator === ">=" || comp.operator === "<=");
        const oppositeDirectionsLessThan = cmp(this.semver, "<", comp.semver, optionsOrLoose) &&
            (this.operator === ">=" || this.operator === ">") &&
            (comp.operator === "<=" || comp.operator === "<");
        const oppositeDirectionsGreaterThan = cmp(this.semver, ">", comp.semver, optionsOrLoose) &&
            (this.operator === "<=" || this.operator === "<") &&
            (comp.operator === ">=" || comp.operator === ">");
        return (sameDirectionIncreasing ||
            sameDirectionDecreasing ||
            (sameSemVer && differentDirectionsInclusive) ||
            oppositeDirectionsLessThan ||
            oppositeDirectionsGreaterThan);
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
    constructor(range, optionsOrLoose) {
        if (!optionsOrLoose || typeof optionsOrLoose !== "object") {
            optionsOrLoose = {
                loose: !!optionsOrLoose,
                includePrerelease: false,
            };
        }
        if (range instanceof Range) {
            if (range.loose === !!optionsOrLoose.loose &&
                range.includePrerelease === !!optionsOrLoose.includePrerelease) {
                return range;
            }
            else {
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
        this.raw = range;
        this.set = range
            .split(/\s*\|\|\s*/)
            .map((range) => this.parseRange(range.trim()))
            .filter((c) => {
            return c.length;
        });
        if (!this.set.length) {
            throw new TypeError("Invalid SemVer Range: " + range);
        }
        this.format();
    }
    format() {
        this.range = this.set
            .map((comps) => comps.join(" ").trim())
            .join("||")
            .trim();
        return this.range;
    }
    parseRange(range) {
        const loose = this.options.loose;
        range = range.trim();
        const hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
        range = range.replace(hr, hyphenReplace);
        range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
        range = range.replace(re[TILDETRIM], tildeTrimReplace);
        range = range.replace(re[CARETTRIM], caretTrimReplace);
        range = range.split(/\s+/).join(" ");
        const compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
        let set = range
            .split(" ")
            .map((comp) => parseComparator(comp, this.options))
            .join(" ")
            .split(/\s+/);
        if (this.options.loose) {
            set = set.filter((comp) => {
                return !!comp.match(compRe);
            });
        }
        return set.map((comp) => new Comparator(comp, this.options));
    }
    test(version) {
        if (typeof version === "string") {
            version = new SemVer(version, this.options);
        }
        for (var i = 0; i < this.set.length; i++) {
            if (testSet(this.set[i], version, this.options)) {
                return true;
            }
        }
        return false;
    }
    intersects(range, optionsOrLoose) {
        if (!(range instanceof Range)) {
            throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
            return (isSatisfiable(thisComparators, optionsOrLoose) &&
                range.set.some((rangeComparators) => {
                    return (isSatisfiable(rangeComparators, optionsOrLoose) &&
                        thisComparators.every((thisComparator) => {
                            return rangeComparators.every((rangeComparator) => {
                                return thisComparator.intersects(rangeComparator, optionsOrLoose);
                            });
                        }));
                }));
        });
    }
    toString() {
        return this.range;
    }
}
function testSet(set, version, options) {
    for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
            return false;
        }
    }
    if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
            if (set[i].semver === ANY) {
                continue;
            }
            if (set[i].semver.prerelease.length > 0) {
                const allowed = set[i].semver;
                if (allowed.major === version.major &&
                    allowed.minor === version.minor &&
                    allowed.patch === version.patch) {
                    return true;
                }
            }
        }
        return false;
    }
    return true;
}
function isSatisfiable(comparators, options) {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
            return testComparator?.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
    }
    return result;
}
export function toComparators(range, optionsOrLoose) {
    return new Range(range, optionsOrLoose).set.map((comp) => {
        return comp
            .map((c) => c.value)
            .join(" ")
            .trim()
            .split(" ");
    });
}
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
function replaceTildes(comp, options) {
    return comp
        .trim()
        .split(/\s+/)
        .map((comp) => replaceTilde(comp, options))
        .join(" ");
}
function replaceTilde(comp, options) {
    const r = options.loose ? re[TILDELOOSE] : re[TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
        let ret;
        if (isX(M)) {
            ret = "";
        }
        else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        }
        else if (isX(p)) {
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        }
        else if (pr) {
            ret = ">=" +
                M +
                "." +
                m +
                "." +
                p +
                "-" +
                pr +
                " <" +
                M +
                "." +
                (+m + 1) +
                ".0";
        }
        else {
            ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
function replaceCarets(comp, options) {
    return comp
        .trim()
        .split(/\s+/)
        .map((comp) => replaceCaret(comp, options))
        .join(" ");
}
function replaceCaret(comp, options) {
    const r = options.loose ? re[CARETLOOSE] : re[CARET];
    return comp.replace(r, (_, M, m, p, pr) => {
        let ret;
        if (isX(M)) {
            ret = "";
        }
        else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        }
        else if (isX(p)) {
            if (M === "0") {
                ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
            }
            else {
                ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
            }
        }
        else if (pr) {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" +
                        M +
                        "." +
                        m +
                        "." +
                        p +
                        "-" +
                        pr +
                        " <" +
                        M +
                        "." +
                        m +
                        "." +
                        (+p + 1);
                }
                else {
                    ret = ">=" +
                        M +
                        "." +
                        m +
                        "." +
                        p +
                        "-" +
                        pr +
                        " <" +
                        M +
                        "." +
                        (+m + 1) +
                        ".0";
                }
            }
            else {
                ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) +
                    ".0.0";
            }
        }
        else {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." +
                        (+p + 1);
                }
                else {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
                }
            }
            else {
                ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
            }
        }
        return ret;
    });
}
function replaceXRanges(comp, options) {
    return comp
        .split(/\s+/)
        .map((comp) => replaceXRange(comp, options))
        .join(" ");
}
function replaceXRange(comp, options) {
    comp = comp.trim();
    const r = options.loose ? re[XRANGELOOSE] : re[XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
            gtlt = "";
        }
        if (xM) {
            if (gtlt === ">" || gtlt === "<") {
                ret = "<0.0.0";
            }
            else {
                ret = "*";
            }
        }
        else if (gtlt && anyX) {
            if (xm) {
                m = 0;
            }
            p = 0;
            if (gtlt === ">") {
                gtlt = ">=";
                if (xm) {
                    M = +M + 1;
                    m = 0;
                    p = 0;
                }
                else {
                    m = +m + 1;
                    p = 0;
                }
            }
            else if (gtlt === "<=") {
                gtlt = "<";
                if (xm) {
                    M = +M + 1;
                }
                else {
                    m = +m + 1;
                }
            }
            ret = gtlt + M + "." + m + "." + p;
        }
        else if (xm) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        }
        else if (xp) {
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
function replaceStars(comp, options) {
    return comp.trim().replace(re[STAR], "");
}
function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
    if (isX(fM)) {
        from = "";
    }
    else if (isX(fm)) {
        from = ">=" + fM + ".0.0";
    }
    else if (isX(fp)) {
        from = ">=" + fM + "." + fm + ".0";
    }
    else {
        from = ">=" + from;
    }
    if (isX(tM)) {
        to = "";
    }
    else if (isX(tm)) {
        to = "<" + (+tM + 1) + ".0.0";
    }
    else if (isX(tp)) {
        to = "<" + tM + "." + (+tm + 1) + ".0";
    }
    else if (tpr) {
        to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
    }
    else {
        to = "<=" + to;
    }
    return (from + " " + to).trim();
}
export function satisfies(version, range, optionsOrLoose) {
    try {
        range = new Range(range, optionsOrLoose);
    }
    catch (er) {
        return false;
    }
    return range.test(version);
}
export function maxSatisfying(versions, range, optionsOrLoose) {
    var max = null;
    var maxSV = null;
    try {
        var rangeObj = new Range(range, optionsOrLoose);
    }
    catch (er) {
        return null;
    }
    versions.forEach((v) => {
        if (rangeObj.test(v)) {
            if (!max || (maxSV && maxSV.compare(v) === -1)) {
                max = v;
                maxSV = new SemVer(max, optionsOrLoose);
            }
        }
    });
    return max;
}
export function minSatisfying(versions, range, optionsOrLoose) {
    var min = null;
    var minSV = null;
    try {
        var rangeObj = new Range(range, optionsOrLoose);
    }
    catch (er) {
        return null;
    }
    versions.forEach((v) => {
        if (rangeObj.test(v)) {
            if (!min || minSV.compare(v) === 1) {
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
    for (var i = 0; i < range.set.length; ++i) {
        var comparators = range.set[i];
        comparators.forEach((comparator) => {
            var compver = new SemVer(comparator.semver.version);
            switch (comparator.operator) {
                case ">":
                    if (compver.prerelease.length === 0) {
                        compver.patch++;
                    }
                    else {
                        compver.prerelease.push(0);
                    }
                    compver.raw = compver.format();
                case "":
                case ">=":
                    if (!minver || gt(minver, compver)) {
                        minver = compver;
                    }
                    break;
                case "<":
                case "<=":
                    break;
                default:
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
        if (range === null)
            return null;
        return new Range(range, optionsOrLoose).range || "*";
    }
    catch (er) {
        return null;
    }
}
export function ltr(version, range, optionsOrLoose) {
    return outside(version, range, "<", optionsOrLoose);
}
export function gtr(version, range, optionsOrLoose) {
    return outside(version, range, ">", optionsOrLoose);
}
export function outside(version, range, hilo, optionsOrLoose) {
    version = new SemVer(version, optionsOrLoose);
    range = new Range(range, optionsOrLoose);
    let gtfn;
    let ltefn;
    let ltfn;
    let comp;
    let ecomp;
    switch (hilo) {
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
    if (satisfies(version, range, optionsOrLoose)) {
        return false;
    }
    for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        for (let comparator of comparators) {
            if (comparator.semver === ANY) {
                comparator = new Comparator(">=0.0.0");
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver, optionsOrLoose)) {
                high = comparator;
            }
            else if (ltfn(comparator.semver, low.semver, optionsOrLoose)) {
                low = comparator;
            }
        }
        if (high === null || low === null)
            return true;
        if (high.operator === comp || high.operator === ecomp) {
            return false;
        }
        if ((!low.operator || low.operator === comp) &&
            ltefn(version, low.semver)) {
            return false;
        }
        else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
        }
    }
    return true;
}
export function prerelease(version, optionsOrLoose) {
    var parsed = parse(version, optionsOrLoose);
    return parsed && parsed.prerelease.length ? parsed.prerelease : null;
}
export function intersects(range1, range2, optionsOrLoose) {
    range1 = new Range(range1, optionsOrLoose);
    range2 = new Range(range2, optionsOrLoose);
    return range1.intersects(range2);
}
export function coerce(version, optionsOrLoose) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTZCQSxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUM7QUFFM0MsTUFBTSxVQUFVLEdBQVcsR0FBRyxDQUFDO0FBRy9CLE1BQU0seUJBQXlCLEdBQVcsRUFBRSxDQUFDO0FBRzdDLE1BQU0sRUFBRSxHQUFhLEVBQUUsQ0FBQztBQUN4QixNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUM7QUFDekIsSUFBSSxDQUFDLEdBQVcsQ0FBQyxDQUFDO0FBUWxCLE1BQU0saUJBQWlCLEdBQVcsQ0FBQyxFQUFFLENBQUM7QUFDdEMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsYUFBYSxDQUFDO0FBQ3ZDLE1BQU0sc0JBQXNCLEdBQVcsQ0FBQyxFQUFFLENBQUM7QUFDM0MsR0FBRyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsUUFBUSxDQUFDO0FBTXZDLE1BQU0sb0JBQW9CLEdBQVcsQ0FBQyxFQUFFLENBQUM7QUFDekMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsNEJBQTRCLENBQUM7QUFLekQsTUFBTSxXQUFXLEdBQVcsQ0FBQyxFQUFFLENBQUM7QUFDaEMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDbkMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksR0FBRyxRQUFRLEdBQUcsUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUVwRCxNQUFNLGdCQUFnQixHQUFXLENBQUMsRUFBRSxDQUFDO0FBQ3JDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3pDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLElBQUksSUFBSSxRQUFRLElBQUksUUFBUSxJQUFJLEdBQUcsQ0FBQztBQUs1RCxNQUFNLG9CQUFvQixHQUFXLENBQUMsRUFBRSxDQUFDO0FBQ3pDLEdBQUcsQ0FB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O0FBQ3ZFLENBQUM7QUFLRCxNQUFNLFVBQVUsVUFBVSxDQUN4QixNQUFtQyxFQUNuQyxNQUFtQyxFQUNuQyxjQUFrQztJQUVsQyxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0MsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFLRCxNQUFNLFVBQVUsTUFBTSxDQUNwQixPQUF3QixFQUN4QixjQUFrQztJQUVsQyxJQUFJLE9BQU8sWUFBWSxNQUFNLEVBQUU7UUFDN0IsT0FBTyxPQUFPLENBQUM7S0FDaEI7SUFFRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtRQUMvQixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUV4QyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUNWLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUM1RCxjQUFjLENBQ2YsQ0FBQztBQUNKLENBQUM7QUFFRCxlQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIFJlbGVhc2VUeXBlID1cbiAgfCBcInByZVwiXG4gIHwgXCJtYWpvclwiXG4gIHwgXCJwcmVtYWpvclwiXG4gIHwgXCJtaW5vclwiXG4gIHwgXCJwcmVtaW5vclwiXG4gIHwgXCJwYXRjaFwiXG4gIHwgXCJwcmVwYXRjaFwiXG4gIHwgXCJwcmVyZWxlYXNlXCI7XG5cbmV4cG9ydCB0eXBlIE9wZXJhdG9yID1cbiAgfCBcIj09PVwiXG4gIHwgXCIhPT1cIlxuICB8IFwiXCJcbiAgfCBcIj1cIlxuICB8IFwiPT1cIlxuICB8IFwiIT1cIlxuICB8IFwiPlwiXG4gIHwgXCI+PVwiXG4gIHwgXCI8XCJcbiAgfCBcIjw9XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIGxvb3NlPzogYm9vbGVhbjtcbiAgaW5jbHVkZVByZXJlbGVhc2U/OiBib29sZWFuO1xufVxuXG4vLyBOb3RlOiB0aGlzIGlzIHRoZSBzZW12ZXIub3JnIHZlcnNpb24gb2YgdGhlIHNwZWMgdGhhdCBpdCBpbXBsZW1lbnRzXG4vLyBOb3QgbmVjZXNzYXJpbHkgdGhlIHBhY2thZ2UgdmVyc2lvbiBvZiB0aGlzIGNvZGUuXG5leHBvcnQgY29uc3QgU0VNVkVSX1NQRUNfVkVSU0lPTiA9IFwiMi4wLjBcIjtcblxuY29uc3QgTUFYX0xFTkdUSDogbnVtYmVyID0gMjU2O1xuXG4vLyBNYXggc2FmZSBzZWdtZW50IGxlbmd0aCBmb3IgY29lcmNpb24uXG5jb25zdCBNQVhfU0FGRV9DT01QT05FTlRfTEVOR1RIOiBudW1iZXIgPSAxNjtcblxuLy8gVGhlIGFjdHVhbCByZWdleHBzXG5jb25zdCByZTogUmVnRXhwW10gPSBbXTtcbmNvbnN0IHNyYzogc3RyaW5nW10gPSBbXTtcbmxldCBSOiBudW1iZXIgPSAwO1xuXG4vLyBUaGUgZm9sbG93aW5nIFJlZ3VsYXIgRXhwcmVzc2lvbnMgY2FuIGJlIHVzZWQgZm9yIHRva2VuaXppbmcsXG4vLyB2YWxpZGF0aW5nLCBhbmQgcGFyc2luZyBTZW1WZXIgdmVyc2lvbiBzdHJpbmdzLlxuXG4vLyAjIyBOdW1lcmljIElkZW50aWZpZXJcbi8vIEEgc2luZ2xlIGAwYCwgb3IgYSBub24temVybyBkaWdpdCBmb2xsb3dlZCBieSB6ZXJvIG9yIG1vcmUgZGlnaXRzLlxuXG5jb25zdCBOVU1FUklDSURFTlRJRklFUjogbnVtYmVyID0gUisrO1xuc3JjW05VTUVSSUNJREVOVElGSUVSXSA9IFwiMHxbMS05XVxcXFxkKlwiO1xuY29uc3QgTlVNRVJJQ0lERU5USUZJRVJMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdID0gXCJbMC05XStcIjtcblxuLy8gIyMgTm9uLW51bWVyaWMgSWRlbnRpZmllclxuLy8gWmVybyBvciBtb3JlIGRpZ2l0cywgZm9sbG93ZWQgYnkgYSBsZXR0ZXIgb3IgaHlwaGVuLCBhbmQgdGhlbiB6ZXJvIG9yXG4vLyBtb3JlIGxldHRlcnMsIGRpZ2l0cywgb3IgaHlwaGVucy5cblxuY29uc3QgTk9OTlVNRVJJQ0lERU5USUZJRVI6IG51bWJlciA9IFIrKztcbnNyY1tOT05OVU1FUklDSURFTlRJRklFUl0gPSBcIlxcXFxkKlthLXpBLVotXVthLXpBLVowLTktXSpcIjtcblxuLy8gIyMgTWFpbiBWZXJzaW9uXG4vLyBUaHJlZSBkb3Qtc2VwYXJhdGVkIG51bWVyaWMgaWRlbnRpZmllcnMuXG5cbmNvbnN0IE1BSU5WRVJTSU9OOiBudW1iZXIgPSBSKys7XG5jb25zdCBuaWQgPSBzcmNbTlVNRVJJQ0lERU5USUZJRVJdO1xuc3JjW01BSU5WRVJTSU9OXSA9IGAoJHtuaWR9KVxcXFwuKCR7bmlkfSlcXFxcLigke25pZH0pYDtcblxuY29uc3QgTUFJTlZFUlNJT05MT09TRTogbnVtYmVyID0gUisrO1xuY29uc3QgbmlkbCA9IHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXTtcbnNyY1tNQUlOVkVSU0lPTkxPT1NFXSA9IGAoJHtuaWRsfSlcXFxcLigke25pZGx9KVxcXFwuKCR7bmlkbH0pYDtcblxuLy8gIyMgUHJlLXJlbGVhc2UgVmVyc2lvbiBJZGVudGlmaWVyXG4vLyBBIG51bWVyaWMgaWRlbnRpZmllciwgb3IgYSBub24tbnVtZXJpYyBpZGVudGlmaWVyLlxuXG5jb25zdCBQUkVSRUxFQVNFSURFTlRJRklFUjogbnVtYmVyID0gUisrO1xuc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSXSA9IFwiKD86XCIgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICsgXCJ8XCIgK1xuICBzcmNbTk9OTlVNRVJJQ0lERU5USUZJRVJdICsgXCIpXCI7XG5cbmNvbnN0IFBSRVJFTEVBU0VJREVOVElGSUVSTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tQUkVSRUxFQVNFSURFTlRJRklFUkxPT1NFXSA9IFwiKD86XCIgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gKyBcInxcIiArXG4gIHNyY1tOT05OVU1FUklDSURFTlRJRklFUl0gKyBcIilcIjtcblxuLy8gIyMgUHJlLXJlbGVhc2UgVmVyc2lvblxuLy8gSHlwaGVuLCBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBkb3Qtc2VwYXJhdGVkIHByZS1yZWxlYXNlIHZlcnNpb25cbi8vIGlkZW50aWZpZXJzLlxuXG5jb25zdCBQUkVSRUxFQVNFOiBudW1iZXIgPSBSKys7XG5zcmNbUFJFUkVMRUFTRV0gPSBcIig/Oi0oXCIgK1xuICBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdICtcbiAgXCIoPzpcXFxcLlwiICtcbiAgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSXSArXG4gIFwiKSopKVwiO1xuXG5jb25zdCBQUkVSRUxFQVNFTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tQUkVSRUxFQVNFTE9PU0VdID0gXCIoPzotPyhcIiArXG4gIHNyY1tQUkVSRUxFQVNFSURFTlRJRklFUkxPT1NFXSArXG4gIFwiKD86XFxcXC5cIiArXG4gIHNyY1tQUkVSRUxFQVNFSURFTlRJRklFUkxPT1NFXSArXG4gIFwiKSopKVwiO1xuXG4vLyAjIyBCdWlsZCBNZXRhZGF0YSBJZGVudGlmaWVyXG4vLyBBbnkgY29tYmluYXRpb24gb2YgZGlnaXRzLCBsZXR0ZXJzLCBvciBoeXBoZW5zLlxuXG5jb25zdCBCVUlMRElERU5USUZJRVI6IG51bWJlciA9IFIrKztcbnNyY1tCVUlMRElERU5USUZJRVJdID0gXCJbMC05QS1aYS16LV0rXCI7XG5cbi8vICMjIEJ1aWxkIE1ldGFkYXRhXG4vLyBQbHVzIHNpZ24sIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIHBlcmlvZC1zZXBhcmF0ZWQgYnVpbGQgbWV0YWRhdGFcbi8vIGlkZW50aWZpZXJzLlxuXG5jb25zdCBCVUlMRDogbnVtYmVyID0gUisrO1xuc3JjW0JVSUxEXSA9IFwiKD86XFxcXCsoXCIgKyBzcmNbQlVJTERJREVOVElGSUVSXSArIFwiKD86XFxcXC5cIiArXG4gIHNyY1tCVUlMRElERU5USUZJRVJdICsgXCIpKikpXCI7XG5cbi8vICMjIEZ1bGwgVmVyc2lvbiBTdHJpbmdcbi8vIEEgbWFpbiB2ZXJzaW9uLCBmb2xsb3dlZCBvcHRpb25hbGx5IGJ5IGEgcHJlLXJlbGVhc2UgdmVyc2lvbiBhbmRcbi8vIGJ1aWxkIG1ldGFkYXRhLlxuXG4vLyBOb3RlIHRoYXQgdGhlIG9ubHkgbWFqb3IsIG1pbm9yLCBwYXRjaCwgYW5kIHByZS1yZWxlYXNlIHNlY3Rpb25zIG9mXG4vLyB0aGUgdmVyc2lvbiBzdHJpbmcgYXJlIGNhcHR1cmluZyBncm91cHMuICBUaGUgYnVpbGQgbWV0YWRhdGEgaXMgbm90IGFcbi8vIGNhcHR1cmluZyBncm91cCwgYmVjYXVzZSBpdCBzaG91bGQgbm90IGV2ZXIgYmUgdXNlZCBpbiB2ZXJzaW9uXG4vLyBjb21wYXJpc29uLlxuXG5jb25zdCBGVUxMOiBudW1iZXIgPSBSKys7XG5jb25zdCBGVUxMUExBSU4gPSBcInY/XCIgKyBzcmNbTUFJTlZFUlNJT05dICsgc3JjW1BSRVJFTEVBU0VdICsgXCI/XCIgKyBzcmNbQlVJTERdICtcbiAgXCI/XCI7XG5cbnNyY1tGVUxMXSA9IFwiXlwiICsgRlVMTFBMQUlOICsgXCIkXCI7XG5cbi8vIGxpa2UgZnVsbCwgYnV0IGFsbG93cyB2MS4yLjMgYW5kID0xLjIuMywgd2hpY2ggcGVvcGxlIGRvIHNvbWV0aW1lcy5cbi8vIGFsc28sIDEuMC4wYWxwaGExIChwcmVyZWxlYXNlIHdpdGhvdXQgdGhlIGh5cGhlbikgd2hpY2ggaXMgcHJldHR5XG4vLyBjb21tb24gaW4gdGhlIG5wbSByZWdpc3RyeS5cbmNvbnN0IExPT1NFUExBSU46IHN0cmluZyA9IFwiW3Y9XFxcXHNdKlwiICtcbiAgc3JjW01BSU5WRVJTSU9OTE9PU0VdICtcbiAgc3JjW1BSRVJFTEVBU0VMT09TRV0gK1xuICBcIj9cIiArXG4gIHNyY1tCVUlMRF0gK1xuICBcIj9cIjtcblxuY29uc3QgTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tMT09TRV0gPSBcIl5cIiArIExPT1NFUExBSU4gKyBcIiRcIjtcblxuY29uc3QgR1RMVDogbnVtYmVyID0gUisrO1xuc3JjW0dUTFRdID0gXCIoKD86PHw+KT89PylcIjtcblxuLy8gU29tZXRoaW5nIGxpa2UgXCIyLipcIiBvciBcIjEuMi54XCIuXG4vLyBOb3RlIHRoYXQgXCJ4LnhcIiBpcyBhIHZhbGlkIHhSYW5nZSBpZGVudGlmZXIsIG1lYW5pbmcgXCJhbnkgdmVyc2lvblwiXG4vLyBPbmx5IHRoZSBmaXJzdCBpdGVtIGlzIHN0cmljdGx5IHJlcXVpcmVkLlxuY29uc3QgWFJBTkdFSURFTlRJRklFUkxPT1NFOiBudW1iZXIgPSBSKys7XG5zcmNbWFJBTkdFSURFTlRJRklFUkxPT1NFXSA9IHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArIFwifHh8WHxcXFxcKlwiO1xuY29uc3QgWFJBTkdFSURFTlRJRklFUjogbnVtYmVyID0gUisrO1xuc3JjW1hSQU5HRUlERU5USUZJRVJdID0gc3JjW05VTUVSSUNJREVOVElGSUVSXSArIFwifHh8WHxcXFxcKlwiO1xuXG5jb25zdCBYUkFOR0VQTEFJTjogbnVtYmVyID0gUisrO1xuc3JjW1hSQU5HRVBMQUlOXSA9IFwiW3Y9XFxcXHNdKihcIiArXG4gIHNyY1tYUkFOR0VJREVOVElGSUVSXSArXG4gIFwiKVwiICtcbiAgXCIoPzpcXFxcLihcIiArXG4gIHNyY1tYUkFOR0VJREVOVElGSUVSXSArXG4gIFwiKVwiICtcbiAgXCIoPzpcXFxcLihcIiArXG4gIHNyY1tYUkFOR0VJREVOVElGSUVSXSArXG4gIFwiKVwiICtcbiAgXCIoPzpcIiArXG4gIHNyY1tQUkVSRUxFQVNFXSArXG4gIFwiKT9cIiArXG4gIHNyY1tCVUlMRF0gK1xuICBcIj9cIiArXG4gIFwiKT8pP1wiO1xuXG5jb25zdCBYUkFOR0VQTEFJTkxPT1NFOiBudW1iZXIgPSBSKys7XG5zcmNbWFJBTkdFUExBSU5MT09TRV0gPSBcIlt2PVxcXFxzXSooXCIgK1xuICBzcmNbWFJBTkdFSURFTlRJRklFUkxPT1NFXSArXG4gIFwiKVwiICtcbiAgXCIoPzpcXFxcLihcIiArXG4gIHNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdICtcbiAgXCIpXCIgK1xuICBcIig/OlxcXFwuKFwiICtcbiAgc3JjW1hSQU5HRUlERU5USUZJRVJMT09TRV0gK1xuICBcIilcIiArXG4gIFwiKD86XCIgK1xuICBzcmNbUFJFUkVMRUFTRUxPT1NFXSArXG4gIFwiKT9cIiArXG4gIHNyY1tCVUlMRF0gK1xuICBcIj9cIiArXG4gIFwiKT8pP1wiO1xuXG5jb25zdCBYUkFOR0U6IG51bWJlciA9IFIrKztcbnNyY1tYUkFOR0VdID0gXCJeXCIgKyBzcmNbR1RMVF0gKyBcIlxcXFxzKlwiICsgc3JjW1hSQU5HRVBMQUlOXSArIFwiJFwiO1xuY29uc3QgWFJBTkdFTE9PU0UgPSBSKys7XG5zcmNbWFJBTkdFTE9PU0VdID0gXCJeXCIgKyBzcmNbR1RMVF0gKyBcIlxcXFxzKlwiICsgc3JjW1hSQU5HRVBMQUlOTE9PU0VdICsgXCIkXCI7XG5cbi8vIENvZXJjaW9uLlxuLy8gRXh0cmFjdCBhbnl0aGluZyB0aGF0IGNvdWxkIGNvbmNlaXZhYmx5IGJlIGEgcGFydCBvZiBhIHZhbGlkIHNlbXZlclxuY29uc3QgQ09FUkNFOiBudW1iZXIgPSBSKys7XG5zcmNbQ09FUkNFXSA9IFwiKD86XnxbXlxcXFxkXSlcIiArXG4gIFwiKFxcXFxkezEsXCIgK1xuICBNQVhfU0FGRV9DT01QT05FTlRfTEVOR1RIICtcbiAgXCJ9KVwiICtcbiAgXCIoPzpcXFxcLihcXFxcZHsxLFwiICtcbiAgTUFYX1NBRkVfQ09NUE9ORU5UX0xFTkdUSCArXG4gIFwifSkpP1wiICtcbiAgXCIoPzpcXFxcLihcXFxcZHsxLFwiICtcbiAgTUFYX1NBRkVfQ09NUE9ORU5UX0xFTkdUSCArXG4gIFwifSkpP1wiICtcbiAgXCIoPzokfFteXFxcXGRdKVwiO1xuXG4vLyBUaWxkZSByYW5nZXMuXG4vLyBNZWFuaW5nIGlzIFwicmVhc29uYWJseSBhdCBvciBncmVhdGVyIHRoYW5cIlxuY29uc3QgTE9ORVRJTERFOiBudW1iZXIgPSBSKys7XG5zcmNbTE9ORVRJTERFXSA9IFwiKD86fj4/KVwiO1xuXG5jb25zdCBUSUxERVRSSU06IG51bWJlciA9IFIrKztcbnNyY1tUSUxERVRSSU1dID0gXCIoXFxcXHMqKVwiICsgc3JjW0xPTkVUSUxERV0gKyBcIlxcXFxzK1wiO1xucmVbVElMREVUUklNXSA9IG5ldyBSZWdFeHAoc3JjW1RJTERFVFJJTV0sIFwiZ1wiKTtcbmNvbnN0IHRpbGRlVHJpbVJlcGxhY2U6IHN0cmluZyA9IFwiJDF+XCI7XG5cbmNvbnN0IFRJTERFOiBudW1iZXIgPSBSKys7XG5zcmNbVElMREVdID0gXCJeXCIgKyBzcmNbTE9ORVRJTERFXSArIHNyY1tYUkFOR0VQTEFJTl0gKyBcIiRcIjtcbmNvbnN0IFRJTERFTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tUSUxERUxPT1NFXSA9IFwiXlwiICsgc3JjW0xPTkVUSUxERV0gKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyBcIiRcIjtcblxuLy8gQ2FyZXQgcmFuZ2VzLlxuLy8gTWVhbmluZyBpcyBcImF0IGxlYXN0IGFuZCBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoXCJcbmNvbnN0IExPTkVDQVJFVDogbnVtYmVyID0gUisrO1xuc3JjW0xPTkVDQVJFVF0gPSBcIig/OlxcXFxeKVwiO1xuXG5jb25zdCBDQVJFVFRSSU06IG51bWJlciA9IFIrKztcbnNyY1tDQVJFVFRSSU1dID0gXCIoXFxcXHMqKVwiICsgc3JjW0xPTkVDQVJFVF0gKyBcIlxcXFxzK1wiO1xucmVbQ0FSRVRUUklNXSA9IG5ldyBSZWdFeHAoc3JjW0NBUkVUVFJJTV0sIFwiZ1wiKTtcbmNvbnN0IGNhcmV0VHJpbVJlcGxhY2U6IHN0cmluZyA9IFwiJDFeXCI7XG5cbmNvbnN0IENBUkVUOiBudW1iZXIgPSBSKys7XG5zcmNbQ0FSRVRdID0gXCJeXCIgKyBzcmNbTE9ORUNBUkVUXSArIHNyY1tYUkFOR0VQTEFJTl0gKyBcIiRcIjtcbmNvbnN0IENBUkVUTE9PU0U6IG51bWJlciA9IFIrKztcbnNyY1tDQVJFVExPT1NFXSA9IFwiXlwiICsgc3JjW0xPTkVDQVJFVF0gKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyBcIiRcIjtcblxuLy8gQSBzaW1wbGUgZ3QvbHQvZXEgdGhpbmcsIG9yIGp1c3QgXCJcIiB0byBpbmRpY2F0ZSBcImFueSB2ZXJzaW9uXCJcbmNvbnN0IENPTVBBUkFUT1JMT09TRTogbnVtYmVyID0gUisrO1xuc3JjW0NPTVBBUkFUT1JMT09TRV0gPSBcIl5cIiArIHNyY1tHVExUXSArIFwiXFxcXHMqKFwiICsgTE9PU0VQTEFJTiArIFwiKSR8XiRcIjtcbmNvbnN0IENPTVBBUkFUT1I6IG51bWJlciA9IFIrKztcbnNyY1tDT01QQVJBVE9SXSA9IFwiXlwiICsgc3JjW0dUTFRdICsgXCJcXFxccyooXCIgKyBGVUxMUExBSU4gKyBcIikkfF4kXCI7XG5cbi8vIEFuIGV4cHJlc3Npb24gdG8gc3RyaXAgYW55IHdoaXRlc3BhY2UgYmV0d2VlbiB0aGUgZ3RsdCBhbmQgdGhlIHRoaW5nXG4vLyBpdCBtb2RpZmllcywgc28gdGhhdCBgPiAxLjIuM2AgPT0+IGA+MS4yLjNgXG5jb25zdCBDT01QQVJBVE9SVFJJTTogbnVtYmVyID0gUisrO1xuc3JjW0NPTVBBUkFUT1JUUklNXSA9IFwiKFxcXFxzKilcIiArIHNyY1tHVExUXSArIFwiXFxcXHMqKFwiICsgTE9PU0VQTEFJTiArIFwifFwiICtcbiAgc3JjW1hSQU5HRVBMQUlOXSArIFwiKVwiO1xuXG4vLyB0aGlzIG9uZSBoYXMgdG8gdXNlIHRoZSAvZyBmbGFnXG5yZVtDT01QQVJBVE9SVFJJTV0gPSBuZXcgUmVnRXhwKHNyY1tDT01QQVJBVE9SVFJJTV0sIFwiZ1wiKTtcbmNvbnN0IGNvbXBhcmF0b3JUcmltUmVwbGFjZTogc3RyaW5nID0gXCIkMSQyJDNcIjtcblxuLy8gU29tZXRoaW5nIGxpa2UgYDEuMi4zIC0gMS4yLjRgXG4vLyBOb3RlIHRoYXQgdGhlc2UgYWxsIHVzZSB0aGUgbG9vc2UgZm9ybSwgYmVjYXVzZSB0aGV5J2xsIGJlXG4vLyBjaGVja2VkIGFnYWluc3QgZWl0aGVyIHRoZSBzdHJpY3Qgb3IgbG9vc2UgY29tcGFyYXRvciBmb3JtXG4vLyBsYXRlci5cbmNvbnN0IEhZUEhFTlJBTkdFOiBudW1iZXIgPSBSKys7XG5zcmNbSFlQSEVOUkFOR0VdID0gXCJeXFxcXHMqKFwiICtcbiAgc3JjW1hSQU5HRVBMQUlOXSArXG4gIFwiKVwiICtcbiAgXCJcXFxccystXFxcXHMrXCIgK1xuICBcIihcIiArXG4gIHNyY1tYUkFOR0VQTEFJTl0gK1xuICBcIilcIiArXG4gIFwiXFxcXHMqJFwiO1xuXG5jb25zdCBIWVBIRU5SQU5HRUxPT1NFOiBudW1iZXIgPSBSKys7XG5zcmNbSFlQSEVOUkFOR0VMT09TRV0gPSBcIl5cXFxccyooXCIgK1xuICBzcmNbWFJBTkdFUExBSU5MT09TRV0gK1xuICBcIilcIiArXG4gIFwiXFxcXHMrLVxcXFxzK1wiICtcbiAgXCIoXCIgK1xuICBzcmNbWFJBTkdFUExBSU5MT09TRV0gK1xuICBcIilcIiArXG4gIFwiXFxcXHMqJFwiO1xuXG4vLyBTdGFyIHJhbmdlcyBiYXNpY2FsbHkganVzdCBhbGxvdyBhbnl0aGluZyBhdCBhbGwuXG5jb25zdCBTVEFSOiBudW1iZXIgPSBSKys7XG5zcmNbU1RBUl0gPSBcIig8fD4pPz0/XFxcXHMqXFxcXCpcIjtcblxuLy8gQ29tcGlsZSB0byBhY3R1YWwgcmVnZXhwIG9iamVjdHMuXG4vLyBBbGwgYXJlIGZsYWctZnJlZSwgdW5sZXNzIHRoZXkgd2VyZSBjcmVhdGVkIGFib3ZlIHdpdGggYSBmbGFnLlxuZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IFI7IGkrKykge1xuICBpZiAoIXJlW2ldKSB7XG4gICAgcmVbaV0gPSBuZXcgUmVnRXhwKHNyY1tpXSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIgfCBudWxsLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogU2VtVmVyIHwgbnVsbCB7XG4gIGlmICghb3B0aW9uc09yTG9vc2UgfHwgdHlwZW9mIG9wdGlvbnNPckxvb3NlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgb3B0aW9uc09yTG9vc2UgPSB7XG4gICAgICBsb29zZTogISFvcHRpb25zT3JMb29zZSxcbiAgICAgIGluY2x1ZGVQcmVyZWxlYXNlOiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZlcnNpb24gaW5zdGFuY2VvZiBTZW1WZXIpIHtcbiAgICByZXR1cm4gdmVyc2lvbjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKHZlcnNpb24ubGVuZ3RoID4gTUFYX0xFTkdUSCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcjogUmVnRXhwID0gb3B0aW9uc09yTG9vc2UubG9vc2UgPyByZVtMT09TRV0gOiByZVtGVUxMXTtcbiAgaWYgKCFyLnRlc3QodmVyc2lvbikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgb3B0aW9uc09yTG9vc2UpO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZChcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyIHwgbnVsbCxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodmVyc2lvbiA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHY6IFNlbVZlciB8IG51bGwgPSBwYXJzZSh2ZXJzaW9uLCBvcHRpb25zT3JMb29zZSk7XG4gIHJldHVybiB2ID8gdi52ZXJzaW9uIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuKFxuICB2ZXJzaW9uOiBzdHJpbmcsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgczogU2VtVmVyIHwgbnVsbCA9IHBhcnNlKFxuICAgIHZlcnNpb24udHJpbSgpLnJlcGxhY2UoL15bPXZdKy8sIFwiXCIpLFxuICAgIG9wdGlvbnNPckxvb3NlLFxuICApO1xuICByZXR1cm4gcyA/IHMudmVyc2lvbiA6IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBTZW1WZXIge1xuICByYXchOiBzdHJpbmc7XG4gIGxvb3NlITogYm9vbGVhbjtcbiAgb3B0aW9ucyE6IE9wdGlvbnM7XG5cbiAgbWFqb3IhOiBudW1iZXI7XG4gIG1pbm9yITogbnVtYmVyO1xuICBwYXRjaCE6IG51bWJlcjtcbiAgdmVyc2lvbiE6IHN0cmluZztcbiAgYnVpbGQhOiBSZWFkb25seUFycmF5PHN0cmluZz47XG4gIHByZXJlbGVhc2UhOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+O1xuXG4gIGNvbnN0cnVjdG9yKHZlcnNpb246IHN0cmluZyB8IFNlbVZlciwgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucykge1xuICAgIGlmICghb3B0aW9uc09yTG9vc2UgfHwgdHlwZW9mIG9wdGlvbnNPckxvb3NlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICBvcHRpb25zT3JMb29zZSA9IHtcbiAgICAgICAgbG9vc2U6ICEhb3B0aW9uc09yTG9vc2UsXG4gICAgICAgIGluY2x1ZGVQcmVyZWxlYXNlOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICh2ZXJzaW9uIGluc3RhbmNlb2YgU2VtVmVyKSB7XG4gICAgICBpZiAodmVyc2lvbi5sb29zZSA9PT0gb3B0aW9uc09yTG9vc2UubG9vc2UpIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2ZXJzaW9uID0gdmVyc2lvbi52ZXJzaW9uO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZlcnNpb24gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIFZlcnNpb246IFwiICsgdmVyc2lvbik7XG4gICAgfVxuXG4gICAgaWYgKHZlcnNpb24ubGVuZ3RoID4gTUFYX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJ2ZXJzaW9uIGlzIGxvbmdlciB0aGFuIFwiICsgTUFYX0xFTkdUSCArIFwiIGNoYXJhY3RlcnNcIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNlbVZlcikpIHtcbiAgICAgIHJldHVybiBuZXcgU2VtVmVyKHZlcnNpb24sIG9wdGlvbnNPckxvb3NlKTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zT3JMb29zZTtcbiAgICB0aGlzLmxvb3NlID0gISFvcHRpb25zT3JMb29zZS5sb29zZTtcblxuICAgIGNvbnN0IG0gPSB2ZXJzaW9uLnRyaW0oKS5tYXRjaChvcHRpb25zT3JMb29zZS5sb29zZSA/IHJlW0xPT1NFXSA6IHJlW0ZVTExdKTtcblxuICAgIGlmICghbSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgVmVyc2lvbjogXCIgKyB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICB0aGlzLnJhdyA9IHZlcnNpb247XG5cbiAgICAvLyB0aGVzZSBhcmUgYWN0dWFsbHkgbnVtYmVyc1xuICAgIHRoaXMubWFqb3IgPSArbVsxXTtcbiAgICB0aGlzLm1pbm9yID0gK21bMl07XG4gICAgdGhpcy5wYXRjaCA9ICttWzNdO1xuXG4gICAgaWYgKHRoaXMubWFqb3IgPiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiB8fCB0aGlzLm1ham9yIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgbWFqb3IgdmVyc2lvblwiKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5vciA+IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSIHx8IHRoaXMubWlub3IgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBtaW5vciB2ZXJzaW9uXCIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBhdGNoID4gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgfHwgdGhpcy5wYXRjaCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHBhdGNoIHZlcnNpb25cIik7XG4gICAgfVxuXG4gICAgLy8gbnVtYmVyaWZ5IGFueSBwcmVyZWxlYXNlIG51bWVyaWMgaWRzXG4gICAgaWYgKCFtWzRdKSB7XG4gICAgICB0aGlzLnByZXJlbGVhc2UgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcmVyZWxlYXNlID0gbVs0XS5zcGxpdChcIi5cIikubWFwKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICgvXlswLTldKyQvLnRlc3QoaWQpKSB7XG4gICAgICAgICAgY29uc3QgbnVtOiBudW1iZXIgPSAraWQ7XG4gICAgICAgICAgaWYgKG51bSA+PSAwICYmIG51bSA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaWQ7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1aWxkID0gbVs1XSA/IG1bNV0uc3BsaXQoXCIuXCIpIDogW107XG4gICAgdGhpcy5mb3JtYXQoKTtcbiAgfVxuXG4gIGZvcm1hdCgpOiBzdHJpbmcge1xuICAgIHRoaXMudmVyc2lvbiA9IHRoaXMubWFqb3IgKyBcIi5cIiArIHRoaXMubWlub3IgKyBcIi5cIiArIHRoaXMucGF0Y2g7XG4gICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGgpIHtcbiAgICAgIHRoaXMudmVyc2lvbiArPSBcIi1cIiArIHRoaXMucHJlcmVsZWFzZS5qb2luKFwiLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudmVyc2lvbjtcbiAgfVxuXG4gIGNvbXBhcmUob3RoZXI6IHN0cmluZyB8IFNlbVZlcik6IDEgfCAwIHwgLTEge1xuICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSkge1xuICAgICAgb3RoZXIgPSBuZXcgU2VtVmVyKG90aGVyLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNvbXBhcmVNYWluKG90aGVyKSB8fCB0aGlzLmNvbXBhcmVQcmUob3RoZXIpO1xuICB9XG5cbiAgY29tcGFyZU1haW4ob3RoZXI6IHN0cmluZyB8IFNlbVZlcik6IDEgfCAwIHwgLTEge1xuICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSkge1xuICAgICAgb3RoZXIgPSBuZXcgU2VtVmVyKG90aGVyLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBjb21wYXJlSWRlbnRpZmllcnModGhpcy5tYWpvciwgb3RoZXIubWFqb3IpIHx8XG4gICAgICBjb21wYXJlSWRlbnRpZmllcnModGhpcy5taW5vciwgb3RoZXIubWlub3IpIHx8XG4gICAgICBjb21wYXJlSWRlbnRpZmllcnModGhpcy5wYXRjaCwgb3RoZXIucGF0Y2gpXG4gICAgKTtcbiAgfVxuXG4gIGNvbXBhcmVQcmUob3RoZXI6IHN0cmluZyB8IFNlbVZlcik6IDEgfCAwIHwgLTEge1xuICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSkge1xuICAgICAgb3RoZXIgPSBuZXcgU2VtVmVyKG90aGVyLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIE5PVCBoYXZpbmcgYSBwcmVyZWxlYXNlIGlzID4gaGF2aW5nIG9uZVxuICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoICYmICFvdGhlci5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMucHJlcmVsZWFzZS5sZW5ndGggJiYgb3RoZXIucHJlcmVsZWFzZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMucHJlcmVsZWFzZS5sZW5ndGggJiYgIW90aGVyLnByZXJlbGVhc2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBsZXQgaTogbnVtYmVyID0gMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCBhOiBzdHJpbmcgfCBudW1iZXIgPSB0aGlzLnByZXJlbGVhc2VbaV07XG4gICAgICBjb25zdCBiOiBzdHJpbmcgfCBudW1iZXIgPSBvdGhlci5wcmVyZWxlYXNlW2ldO1xuICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2UgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH0gZWxzZSBpZiAoYSA9PT0gYikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnMoYSwgYik7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoKytpKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIGNvbXBhcmVCdWlsZChvdGhlcjogc3RyaW5nIHwgU2VtVmVyKTogMSB8IDAgfCAtMSB7XG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBTZW1WZXIpKSB7XG4gICAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgbGV0IGk6IG51bWJlciA9IDA7XG4gICAgZG8ge1xuICAgICAgY29uc3QgYTogc3RyaW5nID0gdGhpcy5idWlsZFtpXTtcbiAgICAgIGNvbnN0IGI6IHN0cmluZyA9IG90aGVyLmJ1aWxkW2ldO1xuICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9IGVsc2UgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH0gZWxzZSBpZiAoYSA9PT0gYikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnMoYSwgYik7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoKytpKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIGluYyhyZWxlYXNlOiBSZWxlYXNlVHlwZSwgaWRlbnRpZmllcj86IHN0cmluZyk6IFNlbVZlciB7XG4gICAgc3dpdGNoIChyZWxlYXNlKSB7XG4gICAgICBjYXNlIFwicHJlbWFqb3JcIjpcbiAgICAgICAgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgICB0aGlzLm1pbm9yID0gMDtcbiAgICAgICAgdGhpcy5tYWpvcisrO1xuICAgICAgICB0aGlzLmluYyhcInByZVwiLCBpZGVudGlmaWVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwicHJlbWlub3JcIjpcbiAgICAgICAgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgICB0aGlzLm1pbm9yKys7XG4gICAgICAgIHRoaXMuaW5jKFwicHJlXCIsIGlkZW50aWZpZXIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJwcmVwYXRjaFwiOlxuICAgICAgICAvLyBJZiB0aGlzIGlzIGFscmVhZHkgYSBwcmVyZWxlYXNlLCBpdCB3aWxsIGJ1bXAgdG8gdGhlIG5leHQgdmVyc2lvblxuICAgICAgICAvLyBkcm9wIGFueSBwcmVyZWxlYXNlcyB0aGF0IG1pZ2h0IGFscmVhZHkgZXhpc3QsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICAgICAgICAvLyByZWxldmFudCBhdCB0aGlzIHBvaW50LlxuICAgICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5pbmMoXCJwYXRjaFwiLCBpZGVudGlmaWVyKTtcbiAgICAgICAgdGhpcy5pbmMoXCJwcmVcIiwgaWRlbnRpZmllcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gSWYgdGhlIGlucHV0IGlzIGEgbm9uLXByZXJlbGVhc2UgdmVyc2lvbiwgdGhpcyBhY3RzIHRoZSBzYW1lIGFzXG4gICAgICAvLyBwcmVwYXRjaC5cbiAgICAgIGNhc2UgXCJwcmVyZWxlYXNlXCI6XG4gICAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5pbmMoXCJwYXRjaFwiLCBpZGVudGlmaWVyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluYyhcInByZVwiLCBpZGVudGlmaWVyKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJtYWpvclwiOlxuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcHJlLW1ham9yIHZlcnNpb24sIGJ1bXAgdXAgdG8gdGhlIHNhbWUgbWFqb3IgdmVyc2lvbi5cbiAgICAgICAgLy8gT3RoZXJ3aXNlIGluY3JlbWVudCBtYWpvci5cbiAgICAgICAgLy8gMS4wLjAtNSBidW1wcyB0byAxLjAuMFxuICAgICAgICAvLyAxLjEuMCBidW1wcyB0byAyLjAuMFxuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy5taW5vciAhPT0gMCB8fFxuICAgICAgICAgIHRoaXMucGF0Y2ggIT09IDAgfHxcbiAgICAgICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMubWFqb3IrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1pbm9yID0gMDtcbiAgICAgICAgdGhpcy5wYXRjaCA9IDA7XG4gICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJtaW5vclwiOlxuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcHJlLW1pbm9yIHZlcnNpb24sIGJ1bXAgdXAgdG8gdGhlIHNhbWUgbWlub3IgdmVyc2lvbi5cbiAgICAgICAgLy8gT3RoZXJ3aXNlIGluY3JlbWVudCBtaW5vci5cbiAgICAgICAgLy8gMS4yLjAtNSBidW1wcyB0byAxLjIuMFxuICAgICAgICAvLyAxLjIuMSBidW1wcyB0byAxLjMuMFxuICAgICAgICBpZiAodGhpcy5wYXRjaCAhPT0gMCB8fCB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5taW5vcisrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgICB0aGlzLnByZXJlbGVhc2UgPSBbXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwicGF0Y2hcIjpcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgYSBwcmUtcmVsZWFzZSB2ZXJzaW9uLCBpdCB3aWxsIGluY3JlbWVudCB0aGUgcGF0Y2guXG4gICAgICAgIC8vIElmIGl0IGlzIGEgcHJlLXJlbGVhc2UgaXQgd2lsbCBidW1wIHVwIHRvIHRoZSBzYW1lIHBhdGNoIHZlcnNpb24uXG4gICAgICAgIC8vIDEuMi4wLTUgcGF0Y2hlcyB0byAxLjIuMFxuICAgICAgICAvLyAxLjIuMCBwYXRjaGVzIHRvIDEuMi4xXG4gICAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5wYXRjaCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIFRoaXMgcHJvYmFibHkgc2hvdWxkbid0IGJlIHVzZWQgcHVibGljbHkuXG4gICAgICAvLyAxLjAuMCBcInByZVwiIHdvdWxkIGJlY29tZSAxLjAuMC0wIHdoaWNoIGlzIHRoZSB3cm9uZyBkaXJlY3Rpb24uXG4gICAgICBjYXNlIFwicHJlXCI6XG4gICAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBpOiBudW1iZXIgPSB0aGlzLnByZXJlbGVhc2UubGVuZ3RoO1xuICAgICAgICAgIHdoaWxlICgtLWkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnByZXJlbGVhc2VbaV0gPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgKHRoaXMucHJlcmVsZWFzZVtpXSBhcyBudW1iZXIpKys7XG4gICAgICAgICAgICAgIGkgPSAtMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGkgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBkaWRuJ3QgaW5jcmVtZW50IGFueXRoaW5nXG4gICAgICAgICAgICB0aGlzLnByZXJlbGVhc2UucHVzaCgwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkZW50aWZpZXIpIHtcbiAgICAgICAgICAvLyAxLjIuMC1iZXRhLjEgYnVtcHMgdG8gMS4yLjAtYmV0YS4yLFxuICAgICAgICAgIC8vIDEuMi4wLWJldGEuZm9vYmx6IG9yIDEuMi4wLWJldGEgYnVtcHMgdG8gMS4yLjAtYmV0YS4wXG4gICAgICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZVswXSA9PT0gaWRlbnRpZmllcikge1xuICAgICAgICAgICAgaWYgKGlzTmFOKHRoaXMucHJlcmVsZWFzZVsxXSBhcyBudW1iZXIpKSB7XG4gICAgICAgICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtpZGVudGlmaWVyLCAwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW2lkZW50aWZpZXIsIDBdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBpbmNyZW1lbnQgYXJndW1lbnQ6IFwiICsgcmVsZWFzZSk7XG4gICAgfVxuICAgIHRoaXMuZm9ybWF0KCk7XG4gICAgdGhpcy5yYXcgPSB0aGlzLnZlcnNpb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnZlcnNpb247XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZlcnNpb24gaW5jcmVtZW50ZWQgYnkgdGhlIHJlbGVhc2UgdHlwZSAobWFqb3IsIG1pbm9yLCBwYXRjaCwgb3IgcHJlcmVsZWFzZSksIG9yIG51bGwgaWYgaXQncyBub3QgdmFsaWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmMoXG4gIHZlcnNpb246IHN0cmluZyB8IFNlbVZlcixcbiAgcmVsZWFzZTogUmVsZWFzZVR5cGUsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4gIGlkZW50aWZpZXI/OiBzdHJpbmcsXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBvcHRpb25zT3JMb29zZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGlkZW50aWZpZXIgPSBvcHRpb25zT3JMb29zZTtcbiAgICBvcHRpb25zT3JMb29zZSA9IHVuZGVmaW5lZDtcbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBuZXcgU2VtVmVyKHZlcnNpb24sIG9wdGlvbnNPckxvb3NlKS5pbmMocmVsZWFzZSwgaWRlbnRpZmllcikudmVyc2lvbjtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlmZihcbiAgdmVyc2lvbjE6IHN0cmluZyB8IFNlbVZlcixcbiAgdmVyc2lvbjI6IHN0cmluZyB8IFNlbVZlcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFJlbGVhc2VUeXBlIHwgbnVsbCB7XG4gIGlmIChlcSh2ZXJzaW9uMSwgdmVyc2lvbjIsIG9wdGlvbnNPckxvb3NlKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHYxOiBTZW1WZXIgfCBudWxsID0gcGFyc2UodmVyc2lvbjEpO1xuICAgIGNvbnN0IHYyOiBTZW1WZXIgfCBudWxsID0gcGFyc2UodmVyc2lvbjIpO1xuICAgIGxldCBwcmVmaXg6IHN0cmluZyA9IFwiXCI7XG4gICAgbGV0IGRlZmF1bHRSZXN1bHQ6IFJlbGVhc2VUeXBlIHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAodjEgJiYgdjIpIHtcbiAgICAgIGlmICh2MS5wcmVyZWxlYXNlLmxlbmd0aCB8fCB2Mi5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBcInByZVwiO1xuICAgICAgICBkZWZhdWx0UmVzdWx0ID0gXCJwcmVyZWxlYXNlXCI7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHYxKSB7XG4gICAgICAgIGlmIChrZXkgPT09IFwibWFqb3JcIiB8fCBrZXkgPT09IFwibWlub3JcIiB8fCBrZXkgPT09IFwicGF0Y2hcIikge1xuICAgICAgICAgIGlmICh2MVtrZXldICE9PSB2MltrZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gKHByZWZpeCArIGtleSkgYXMgUmVsZWFzZVR5cGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0UmVzdWx0OyAvLyBtYXkgYmUgdW5kZWZpbmVkXG4gIH1cbn1cblxuY29uc3QgbnVtZXJpYzogUmVnRXhwID0gL15bMC05XSskLztcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVJZGVudGlmaWVycyhcbiAgYTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCxcbiAgYjogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCxcbik6IDEgfCAwIHwgLTEge1xuICBjb25zdCBhbnVtOiBib29sZWFuID0gbnVtZXJpYy50ZXN0KGEgYXMgc3RyaW5nKTtcbiAgY29uc3QgYm51bTogYm9vbGVhbiA9IG51bWVyaWMudGVzdChiIGFzIHN0cmluZyk7XG5cbiAgaWYgKGEgPT09IG51bGwgfHwgYiA9PT0gbnVsbCkgdGhyb3cgXCJDb21wYXJpc29uIGFnYWluc3QgbnVsbCBpbnZhbGlkXCI7XG5cbiAgaWYgKGFudW0gJiYgYm51bSkge1xuICAgIGEgPSArYTtcbiAgICBiID0gK2I7XG4gIH1cblxuICByZXR1cm4gYSA9PT0gYiA/IDAgOiBhbnVtICYmICFibnVtID8gLTEgOiBibnVtICYmICFhbnVtID8gMSA6IGEgPCBiID8gLTEgOiAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmNvbXBhcmVJZGVudGlmaWVycyhcbiAgYTogc3RyaW5nIHwgbnVsbCxcbiAgYjogc3RyaW5nIHwgbnVsbCxcbik6IDEgfCAwIHwgLTEge1xuICByZXR1cm4gY29tcGFyZUlkZW50aWZpZXJzKGIsIGEpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbWFqb3IgdmVyc2lvbiBudW1iZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWpvcihcbiAgdjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogbnVtYmVyIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIodiwgb3B0aW9uc09yTG9vc2UpLm1ham9yO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbWlub3IgdmVyc2lvbiBudW1iZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaW5vcihcbiAgdjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogbnVtYmVyIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIodiwgb3B0aW9uc09yTG9vc2UpLm1pbm9yO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgcGF0Y2ggdmVyc2lvbiBudW1iZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaChcbiAgdjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogbnVtYmVyIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIodiwgb3B0aW9uc09yTG9vc2UpLnBhdGNoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZShcbiAgdjE6IHN0cmluZyB8IFNlbVZlcixcbiAgdjI6IHN0cmluZyB8IFNlbVZlcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IDEgfCAwIHwgLTEge1xuICByZXR1cm4gbmV3IFNlbVZlcih2MSwgb3B0aW9uc09yTG9vc2UpLmNvbXBhcmUobmV3IFNlbVZlcih2Miwgb3B0aW9uc09yTG9vc2UpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVMb29zZShcbiAgYTogc3RyaW5nIHwgU2VtVmVyLFxuICBiOiBzdHJpbmcgfCBTZW1WZXIsXG4pOiAxIHwgMCB8IC0xIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgdHJ1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlQnVpbGQoXG4gIGE6IHN0cmluZyB8IFNlbVZlcixcbiAgYjogc3RyaW5nIHwgU2VtVmVyLFxuICBsb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogMSB8IDAgfCAtMSB7XG4gIHZhciB2ZXJzaW9uQSA9IG5ldyBTZW1WZXIoYSwgbG9vc2UpO1xuICB2YXIgdmVyc2lvbkIgPSBuZXcgU2VtVmVyKGIsIGxvb3NlKTtcbiAgcmV0dXJuIHZlcnNpb25BLmNvbXBhcmUodmVyc2lvbkIpIHx8IHZlcnNpb25BLmNvbXBhcmVCdWlsZCh2ZXJzaW9uQik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByY29tcGFyZShcbiAgdjE6IHN0cmluZyB8IFNlbVZlcixcbiAgdjI6IHN0cmluZyB8IFNlbVZlcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IDEgfCAwIHwgLTEge1xuICByZXR1cm4gY29tcGFyZSh2MiwgdjEsIG9wdGlvbnNPckxvb3NlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNvcnQ8VCBleHRlbmRzIHN0cmluZyB8IFNlbVZlcj4oXG4gIGxpc3Q6IFRbXSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFRbXSB7XG4gIHJldHVybiBsaXN0LnNvcnQoKGEsIGIpID0+IHtcbiAgICByZXR1cm4gY29tcGFyZUJ1aWxkKGEsIGIsIG9wdGlvbnNPckxvb3NlKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByc29ydDxUIGV4dGVuZHMgc3RyaW5nIHwgU2VtVmVyPihcbiAgbGlzdDogVFtdLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogVFtdIHtcbiAgcmV0dXJuIGxpc3Quc29ydCgoYSwgYikgPT4ge1xuICAgIHJldHVybiBjb21wYXJlQnVpbGQoYiwgYSwgb3B0aW9uc09yTG9vc2UpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGd0KFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb21wYXJlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpID4gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGx0KFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb21wYXJlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpIDwgMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb21wYXJlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpID09PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmVxKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb21wYXJlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3RlKFxuICB2MTogc3RyaW5nIHwgU2VtVmVyLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb21wYXJlKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpID49IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsdGUoXG4gIHYxOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHYyOiBzdHJpbmcgfCBTZW1WZXIsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbXBhcmUodjEsIHYyLCBvcHRpb25zT3JMb29zZSkgPD0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNtcChcbiAgdjE6IHN0cmluZyB8IFNlbVZlcixcbiAgb3BlcmF0b3I6IE9wZXJhdG9yLFxuICB2Mjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICBjYXNlIFwiPT09XCI6XG4gICAgICBpZiAodHlwZW9mIHYxID09PSBcIm9iamVjdFwiKSB2MSA9IHYxLnZlcnNpb247XG4gICAgICBpZiAodHlwZW9mIHYyID09PSBcIm9iamVjdFwiKSB2MiA9IHYyLnZlcnNpb247XG4gICAgICByZXR1cm4gdjEgPT09IHYyO1xuXG4gICAgY2FzZSBcIiE9PVwiOlxuICAgICAgaWYgKHR5cGVvZiB2MSA9PT0gXCJvYmplY3RcIikgdjEgPSB2MS52ZXJzaW9uO1xuICAgICAgaWYgKHR5cGVvZiB2MiA9PT0gXCJvYmplY3RcIikgdjIgPSB2Mi52ZXJzaW9uO1xuICAgICAgcmV0dXJuIHYxICE9PSB2MjtcblxuICAgIGNhc2UgXCJcIjpcbiAgICBjYXNlIFwiPVwiOlxuICAgIGNhc2UgXCI9PVwiOlxuICAgICAgcmV0dXJuIGVxKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpO1xuXG4gICAgY2FzZSBcIiE9XCI6XG4gICAgICByZXR1cm4gbmVxKHYxLCB2Miwgb3B0aW9uc09yTG9vc2UpO1xuXG4gICAgY2FzZSBcIj5cIjpcbiAgICAgIHJldHVybiBndCh2MSwgdjIsIG9wdGlvbnNPckxvb3NlKTtcblxuICAgIGNhc2UgXCI+PVwiOlxuICAgICAgcmV0dXJuIGd0ZSh2MSwgdjIsIG9wdGlvbnNPckxvb3NlKTtcblxuICAgIGNhc2UgXCI8XCI6XG4gICAgICByZXR1cm4gbHQodjEsIHYyLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgICBjYXNlIFwiPD1cIjpcbiAgICAgIHJldHVybiBsdGUodjEsIHYyLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgb3BlcmF0b3I6IFwiICsgb3BlcmF0b3IpO1xuICB9XG59XG5cbmNvbnN0IEFOWTogU2VtVmVyID0ge30gYXMgU2VtVmVyO1xuXG5leHBvcnQgY2xhc3MgQ29tcGFyYXRvciB7XG4gIHNlbXZlciE6IFNlbVZlcjtcbiAgb3BlcmF0b3IhOiBcIlwiIHwgXCI9XCIgfCBcIjxcIiB8IFwiPlwiIHwgXCI8PVwiIHwgXCI+PVwiO1xuICB2YWx1ZSE6IHN0cmluZztcbiAgbG9vc2UhOiBib29sZWFuO1xuICBvcHRpb25zITogT3B0aW9ucztcblxuICBjb25zdHJ1Y3Rvcihjb21wOiBzdHJpbmcgfCBDb21wYXJhdG9yLCBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zT3JMb29zZSB8fCB0eXBlb2Ygb3B0aW9uc09yTG9vc2UgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG9wdGlvbnNPckxvb3NlID0ge1xuICAgICAgICBsb29zZTogISFvcHRpb25zT3JMb29zZSxcbiAgICAgICAgaW5jbHVkZVByZXJlbGVhc2U6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29tcCBpbnN0YW5jZW9mIENvbXBhcmF0b3IpIHtcbiAgICAgIGlmIChjb21wLmxvb3NlID09PSAhIW9wdGlvbnNPckxvb3NlLmxvb3NlKSB7XG4gICAgICAgIHJldHVybiBjb21wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcCA9IGNvbXAudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENvbXBhcmF0b3IpKSB7XG4gICAgICByZXR1cm4gbmV3IENvbXBhcmF0b3IoY29tcCwgb3B0aW9uc09yTG9vc2UpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNPckxvb3NlO1xuICAgIHRoaXMubG9vc2UgPSAhIW9wdGlvbnNPckxvb3NlLmxvb3NlO1xuICAgIHRoaXMucGFyc2UoY29tcCk7XG5cbiAgICBpZiAodGhpcy5zZW12ZXIgPT09IEFOWSkge1xuICAgICAgdGhpcy52YWx1ZSA9IFwiXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm9wZXJhdG9yICsgdGhpcy5zZW12ZXIudmVyc2lvbjtcbiAgICB9XG4gIH1cblxuICBwYXJzZShjb21wOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByID0gdGhpcy5vcHRpb25zLmxvb3NlID8gcmVbQ09NUEFSQVRPUkxPT1NFXSA6IHJlW0NPTVBBUkFUT1JdO1xuICAgIGNvbnN0IG0gPSBjb21wLm1hdGNoKHIpO1xuXG4gICAgaWYgKCFtKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjb21wYXJhdG9yOiBcIiArIGNvbXApO1xuICAgIH1cblxuICAgIGNvbnN0IG0xID0gbVsxXSBhcyBcIlwiIHwgXCI9XCIgfCBcIjxcIiB8IFwiPlwiIHwgXCI8PVwiIHwgXCI+PVwiO1xuICAgIHRoaXMub3BlcmF0b3IgPSBtMSAhPT0gdW5kZWZpbmVkID8gbTEgOiBcIlwiO1xuXG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiPVwiKSB7XG4gICAgICB0aGlzLm9wZXJhdG9yID0gXCJcIjtcbiAgICB9XG5cbiAgICAvLyBpZiBpdCBsaXRlcmFsbHkgaXMganVzdCAnPicgb3IgJycgdGhlbiBhbGxvdyBhbnl0aGluZy5cbiAgICBpZiAoIW1bMl0pIHtcbiAgICAgIHRoaXMuc2VtdmVyID0gQU5ZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbXZlciA9IG5ldyBTZW1WZXIobVsyXSwgdGhpcy5vcHRpb25zLmxvb3NlKTtcbiAgICB9XG4gIH1cblxuICB0ZXN0KHZlcnNpb246IHN0cmluZyB8IFNlbVZlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLnNlbXZlciA9PT0gQU5ZIHx8IHZlcnNpb24gPT09IEFOWSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB2ZXJzaW9uID0gbmV3IFNlbVZlcih2ZXJzaW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBjbXAodmVyc2lvbiwgdGhpcy5vcGVyYXRvciwgdGhpcy5zZW12ZXIsIHRoaXMub3B0aW9ucyk7XG4gIH1cblxuICBpbnRlcnNlY3RzKGNvbXA6IENvbXBhcmF0b3IsIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMpOiBib29sZWFuIHtcbiAgICBpZiAoIShjb21wIGluc3RhbmNlb2YgQ29tcGFyYXRvcikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhIENvbXBhcmF0b3IgaXMgcmVxdWlyZWRcIik7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zT3JMb29zZSB8fCB0eXBlb2Ygb3B0aW9uc09yTG9vc2UgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG9wdGlvbnNPckxvb3NlID0ge1xuICAgICAgICBsb29zZTogISFvcHRpb25zT3JMb29zZSxcbiAgICAgICAgaW5jbHVkZVByZXJlbGVhc2U6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgcmFuZ2VUbXA6IFJhbmdlO1xuXG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IFwiXCIpIHtcbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmFuZ2VUbXAgPSBuZXcgUmFuZ2UoY29tcC52YWx1ZSwgb3B0aW9uc09yTG9vc2UpO1xuICAgICAgcmV0dXJuIHNhdGlzZmllcyh0aGlzLnZhbHVlLCByYW5nZVRtcCwgb3B0aW9uc09yTG9vc2UpO1xuICAgIH0gZWxzZSBpZiAoY29tcC5vcGVyYXRvciA9PT0gXCJcIikge1xuICAgICAgaWYgKGNvbXAudmFsdWUgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByYW5nZVRtcCA9IG5ldyBSYW5nZSh0aGlzLnZhbHVlLCBvcHRpb25zT3JMb29zZSk7XG4gICAgICByZXR1cm4gc2F0aXNmaWVzKGNvbXAuc2VtdmVyLCByYW5nZVRtcCwgb3B0aW9uc09yTG9vc2UpO1xuICAgIH1cblxuICAgIGNvbnN0IHNhbWVEaXJlY3Rpb25JbmNyZWFzaW5nOiBib29sZWFuID1cbiAgICAgICh0aGlzLm9wZXJhdG9yID09PSBcIj49XCIgfHwgdGhpcy5vcGVyYXRvciA9PT0gXCI+XCIpICYmXG4gICAgICAoY29tcC5vcGVyYXRvciA9PT0gXCI+PVwiIHx8IGNvbXAub3BlcmF0b3IgPT09IFwiPlwiKTtcbiAgICBjb25zdCBzYW1lRGlyZWN0aW9uRGVjcmVhc2luZzogYm9vbGVhbiA9XG4gICAgICAodGhpcy5vcGVyYXRvciA9PT0gXCI8PVwiIHx8IHRoaXMub3BlcmF0b3IgPT09IFwiPFwiKSAmJlxuICAgICAgKGNvbXAub3BlcmF0b3IgPT09IFwiPD1cIiB8fCBjb21wLm9wZXJhdG9yID09PSBcIjxcIik7XG4gICAgY29uc3Qgc2FtZVNlbVZlcjogYm9vbGVhbiA9IHRoaXMuc2VtdmVyLnZlcnNpb24gPT09IGNvbXAuc2VtdmVyLnZlcnNpb247XG4gICAgY29uc3QgZGlmZmVyZW50RGlyZWN0aW9uc0luY2x1c2l2ZTogYm9vbGVhbiA9XG4gICAgICAodGhpcy5vcGVyYXRvciA9PT0gXCI+PVwiIHx8IHRoaXMub3BlcmF0b3IgPT09IFwiPD1cIikgJiZcbiAgICAgIChjb21wLm9wZXJhdG9yID09PSBcIj49XCIgfHwgY29tcC5vcGVyYXRvciA9PT0gXCI8PVwiKTtcbiAgICBjb25zdCBvcHBvc2l0ZURpcmVjdGlvbnNMZXNzVGhhbjogYm9vbGVhbiA9XG4gICAgICBjbXAodGhpcy5zZW12ZXIsIFwiPFwiLCBjb21wLnNlbXZlciwgb3B0aW9uc09yTG9vc2UpICYmXG4gICAgICAodGhpcy5vcGVyYXRvciA9PT0gXCI+PVwiIHx8IHRoaXMub3BlcmF0b3IgPT09IFwiPlwiKSAmJlxuICAgICAgKGNvbXAub3BlcmF0b3IgPT09IFwiPD1cIiB8fCBjb21wLm9wZXJhdG9yID09PSBcIjxcIik7XG4gICAgY29uc3Qgb3Bwb3NpdGVEaXJlY3Rpb25zR3JlYXRlclRoYW46IGJvb2xlYW4gPVxuICAgICAgY21wKHRoaXMuc2VtdmVyLCBcIj5cIiwgY29tcC5zZW12ZXIsIG9wdGlvbnNPckxvb3NlKSAmJlxuICAgICAgKHRoaXMub3BlcmF0b3IgPT09IFwiPD1cIiB8fCB0aGlzLm9wZXJhdG9yID09PSBcIjxcIikgJiZcbiAgICAgIChjb21wLm9wZXJhdG9yID09PSBcIj49XCIgfHwgY29tcC5vcGVyYXRvciA9PT0gXCI+XCIpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHNhbWVEaXJlY3Rpb25JbmNyZWFzaW5nIHx8XG4gICAgICBzYW1lRGlyZWN0aW9uRGVjcmVhc2luZyB8fFxuICAgICAgKHNhbWVTZW1WZXIgJiYgZGlmZmVyZW50RGlyZWN0aW9uc0luY2x1c2l2ZSkgfHxcbiAgICAgIG9wcG9zaXRlRGlyZWN0aW9uc0xlc3NUaGFuIHx8XG4gICAgICBvcHBvc2l0ZURpcmVjdGlvbnNHcmVhdGVyVGhhblxuICAgICk7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSYW5nZSB7XG4gIHJhbmdlITogc3RyaW5nO1xuICByYXchOiBzdHJpbmc7XG4gIGxvb3NlITogYm9vbGVhbjtcbiAgb3B0aW9ucyE6IE9wdGlvbnM7XG4gIGluY2x1ZGVQcmVyZWxlYXNlITogYm9vbGVhbjtcbiAgc2V0ITogUmVhZG9ubHlBcnJheTxSZWFkb25seUFycmF5PENvbXBhcmF0b3I+PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICByYW5nZTogc3RyaW5nIHwgUmFuZ2UgfCBDb21wYXJhdG9yLFxuICAgIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4gICkge1xuICAgIGlmICghb3B0aW9uc09yTG9vc2UgfHwgdHlwZW9mIG9wdGlvbnNPckxvb3NlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICBvcHRpb25zT3JMb29zZSA9IHtcbiAgICAgICAgbG9vc2U6ICEhb3B0aW9uc09yTG9vc2UsXG4gICAgICAgIGluY2x1ZGVQcmVyZWxlYXNlOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlIGluc3RhbmNlb2YgUmFuZ2UpIHtcbiAgICAgIGlmIChcbiAgICAgICAgcmFuZ2UubG9vc2UgPT09ICEhb3B0aW9uc09yTG9vc2UubG9vc2UgJiZcbiAgICAgICAgcmFuZ2UuaW5jbHVkZVByZXJlbGVhc2UgPT09ICEhb3B0aW9uc09yTG9vc2UuaW5jbHVkZVByZXJlbGVhc2VcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLnJhdywgb3B0aW9uc09yTG9vc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChyYW5nZSBpbnN0YW5jZW9mIENvbXBhcmF0b3IpIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UudmFsdWUsIG9wdGlvbnNPckxvb3NlKTtcbiAgICB9XG5cbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc09yTG9vc2U7XG4gICAgdGhpcy5sb29zZSA9ICEhb3B0aW9uc09yTG9vc2UubG9vc2U7XG4gICAgdGhpcy5pbmNsdWRlUHJlcmVsZWFzZSA9ICEhb3B0aW9uc09yTG9vc2UuaW5jbHVkZVByZXJlbGVhc2U7XG5cbiAgICAvLyBGaXJzdCwgc3BsaXQgYmFzZWQgb24gYm9vbGVhbiBvciB8fFxuICAgIHRoaXMucmF3ID0gcmFuZ2U7XG4gICAgdGhpcy5zZXQgPSByYW5nZVxuICAgICAgLnNwbGl0KC9cXHMqXFx8XFx8XFxzKi8pXG4gICAgICAubWFwKChyYW5nZSkgPT4gdGhpcy5wYXJzZVJhbmdlKHJhbmdlLnRyaW0oKSkpXG4gICAgICAuZmlsdGVyKChjKSA9PiB7XG4gICAgICAgIC8vIHRocm93IG91dCBhbnkgdGhhdCBhcmUgbm90IHJlbGV2YW50IGZvciB3aGF0ZXZlciByZWFzb25cbiAgICAgICAgcmV0dXJuIGMubGVuZ3RoO1xuICAgICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuc2V0Lmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2VtVmVyIFJhbmdlOiBcIiArIHJhbmdlKTtcbiAgICB9XG5cbiAgICB0aGlzLmZvcm1hdCgpO1xuICB9XG5cbiAgZm9ybWF0KCk6IHN0cmluZyB7XG4gICAgdGhpcy5yYW5nZSA9IHRoaXMuc2V0XG4gICAgICAubWFwKChjb21wcykgPT4gY29tcHMuam9pbihcIiBcIikudHJpbSgpKVxuICAgICAgLmpvaW4oXCJ8fFwiKVxuICAgICAgLnRyaW0oKTtcbiAgICByZXR1cm4gdGhpcy5yYW5nZTtcbiAgfVxuXG4gIHBhcnNlUmFuZ2UocmFuZ2U6IHN0cmluZyk6IFJlYWRvbmx5QXJyYXk8Q29tcGFyYXRvcj4ge1xuICAgIGNvbnN0IGxvb3NlID0gdGhpcy5vcHRpb25zLmxvb3NlO1xuICAgIHJhbmdlID0gcmFuZ2UudHJpbSgpO1xuICAgIC8vIGAxLjIuMyAtIDEuMi40YCA9PiBgPj0xLjIuMyA8PTEuMi40YFxuICAgIGNvbnN0IGhyOiBSZWdFeHAgPSBsb29zZSA/IHJlW0hZUEhFTlJBTkdFTE9PU0VdIDogcmVbSFlQSEVOUkFOR0VdO1xuICAgIHJhbmdlID0gcmFuZ2UucmVwbGFjZShociwgaHlwaGVuUmVwbGFjZSk7XG5cbiAgICAvLyBgPiAxLjIuMyA8IDEuMi41YCA9PiBgPjEuMi4zIDwxLjIuNWBcbiAgICByYW5nZSA9IHJhbmdlLnJlcGxhY2UocmVbQ09NUEFSQVRPUlRSSU1dLCBjb21wYXJhdG9yVHJpbVJlcGxhY2UpO1xuXG4gICAgLy8gYH4gMS4yLjNgID0+IGB+MS4yLjNgXG4gICAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKHJlW1RJTERFVFJJTV0sIHRpbGRlVHJpbVJlcGxhY2UpO1xuXG4gICAgLy8gYF4gMS4yLjNgID0+IGBeMS4yLjNgXG4gICAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKHJlW0NBUkVUVFJJTV0sIGNhcmV0VHJpbVJlcGxhY2UpO1xuXG4gICAgLy8gbm9ybWFsaXplIHNwYWNlc1xuICAgIHJhbmdlID0gcmFuZ2Uuc3BsaXQoL1xccysvKS5qb2luKFwiIFwiKTtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSByYW5nZSBpcyBjb21wbGV0ZWx5IHRyaW1tZWQgYW5kXG4gICAgLy8gcmVhZHkgdG8gYmUgc3BsaXQgaW50byBjb21wYXJhdG9ycy5cblxuICAgIGNvbnN0IGNvbXBSZTogUmVnRXhwID0gbG9vc2UgPyByZVtDT01QQVJBVE9STE9PU0VdIDogcmVbQ09NUEFSQVRPUl07XG4gICAgbGV0IHNldDogc3RyaW5nW10gPSByYW5nZVxuICAgICAgLnNwbGl0KFwiIFwiKVxuICAgICAgLm1hcCgoY29tcCkgPT4gcGFyc2VDb21wYXJhdG9yKGNvbXAsIHRoaXMub3B0aW9ucykpXG4gICAgICAuam9pbihcIiBcIilcbiAgICAgIC5zcGxpdCgvXFxzKy8pO1xuICAgIGlmICh0aGlzLm9wdGlvbnMubG9vc2UpIHtcbiAgICAgIC8vIGluIGxvb3NlIG1vZGUsIHRocm93IG91dCBhbnkgdGhhdCBhcmUgbm90IHZhbGlkIGNvbXBhcmF0b3JzXG4gICAgICBzZXQgPSBzZXQuZmlsdGVyKChjb21wKSA9PiB7XG4gICAgICAgIHJldHVybiAhIWNvbXAubWF0Y2goY29tcFJlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzZXQubWFwKChjb21wKSA9PiBuZXcgQ29tcGFyYXRvcihjb21wLCB0aGlzLm9wdGlvbnMpKTtcbiAgfVxuXG4gIHRlc3QodmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB2ZXJzaW9uID0gbmV3IFNlbVZlcih2ZXJzaW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0ZXN0U2V0KHRoaXMuc2V0W2ldLCB2ZXJzaW9uLCB0aGlzLm9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpbnRlcnNlY3RzKHJhbmdlPzogUmFuZ2UsIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMpOiBib29sZWFuIHtcbiAgICBpZiAoIShyYW5nZSBpbnN0YW5jZW9mIFJhbmdlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImEgUmFuZ2UgaXMgcmVxdWlyZWRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2V0LnNvbWUoKHRoaXNDb21wYXJhdG9ycykgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgaXNTYXRpc2ZpYWJsZSh0aGlzQ29tcGFyYXRvcnMsIG9wdGlvbnNPckxvb3NlKSAmJlxuICAgICAgICByYW5nZS5zZXQuc29tZSgocmFuZ2VDb21wYXJhdG9ycykgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBpc1NhdGlzZmlhYmxlKHJhbmdlQ29tcGFyYXRvcnMsIG9wdGlvbnNPckxvb3NlKSAmJlxuICAgICAgICAgICAgdGhpc0NvbXBhcmF0b3JzLmV2ZXJ5KCh0aGlzQ29tcGFyYXRvcikgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gcmFuZ2VDb21wYXJhdG9ycy5ldmVyeSgocmFuZ2VDb21wYXJhdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNDb21wYXJhdG9yLmludGVyc2VjdHMoXG4gICAgICAgICAgICAgICAgICByYW5nZUNvbXBhcmF0b3IsXG4gICAgICAgICAgICAgICAgICBvcHRpb25zT3JMb29zZSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJhbmdlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRlc3RTZXQoXG4gIHNldDogUmVhZG9ubHlBcnJheTxDb21wYXJhdG9yPixcbiAgdmVyc2lvbjogU2VtVmVyLFxuICBvcHRpb25zOiBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIXNldFtpXS50ZXN0KHZlcnNpb24pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKHZlcnNpb24ucHJlcmVsZWFzZS5sZW5ndGggJiYgIW9wdGlvbnMuaW5jbHVkZVByZXJlbGVhc2UpIHtcbiAgICAvLyBGaW5kIHRoZSBzZXQgb2YgdmVyc2lvbnMgdGhhdCBhcmUgYWxsb3dlZCB0byBoYXZlIHByZXJlbGVhc2VzXG4gICAgLy8gRm9yIGV4YW1wbGUsIF4xLjIuMy1wci4xIGRlc3VnYXJzIHRvID49MS4yLjMtcHIuMSA8Mi4wLjBcbiAgICAvLyBUaGF0IHNob3VsZCBhbGxvdyBgMS4yLjMtcHIuMmAgdG8gcGFzcy5cbiAgICAvLyBIb3dldmVyLCBgMS4yLjQtYWxwaGEubm90cmVhZHlgIHNob3VsZCBOT1QgYmUgYWxsb3dlZCxcbiAgICAvLyBldmVuIHRob3VnaCBpdCdzIHdpdGhpbiB0aGUgcmFuZ2Ugc2V0IGJ5IHRoZSBjb21wYXJhdG9ycy5cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoc2V0W2ldLnNlbXZlciA9PT0gQU5ZKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0W2ldLnNlbXZlci5wcmVyZWxlYXNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgYWxsb3dlZDogU2VtVmVyID0gc2V0W2ldLnNlbXZlcjtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFsbG93ZWQubWFqb3IgPT09IHZlcnNpb24ubWFqb3IgJiZcbiAgICAgICAgICBhbGxvd2VkLm1pbm9yID09PSB2ZXJzaW9uLm1pbm9yICYmXG4gICAgICAgICAgYWxsb3dlZC5wYXRjaCA9PT0gdmVyc2lvbi5wYXRjaFxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZlcnNpb24gaGFzIGEgLXByZSwgYnV0IGl0J3Mgbm90IG9uZSBvZiB0aGUgb25lcyB3ZSBsaWtlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyB0YWtlIGEgc2V0IG9mIGNvbXBhcmF0b3JzIGFuZCBkZXRlcm1pbmUgd2hldGhlciB0aGVyZVxuLy8gZXhpc3RzIGEgdmVyc2lvbiB3aGljaCBjYW4gc2F0aXNmeSBpdFxuZnVuY3Rpb24gaXNTYXRpc2ZpYWJsZShcbiAgY29tcGFyYXRvcnM6IHJlYWRvbmx5IENvbXBhcmF0b3JbXSxcbiAgb3B0aW9ucz86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogYm9vbGVhbiB7XG4gIGxldCByZXN1bHQ6IGJvb2xlYW4gPSB0cnVlO1xuICBjb25zdCByZW1haW5pbmdDb21wYXJhdG9yczogQ29tcGFyYXRvcltdID0gY29tcGFyYXRvcnMuc2xpY2UoKTtcbiAgbGV0IHRlc3RDb21wYXJhdG9yID0gcmVtYWluaW5nQ29tcGFyYXRvcnMucG9wKCk7XG5cbiAgd2hpbGUgKHJlc3VsdCAmJiByZW1haW5pbmdDb21wYXJhdG9ycy5sZW5ndGgpIHtcbiAgICByZXN1bHQgPSByZW1haW5pbmdDb21wYXJhdG9ycy5ldmVyeSgob3RoZXJDb21wYXJhdG9yKSA9PiB7XG4gICAgICByZXR1cm4gdGVzdENvbXBhcmF0b3I/LmludGVyc2VjdHMob3RoZXJDb21wYXJhdG9yLCBvcHRpb25zKTtcbiAgICB9KTtcblxuICAgIHRlc3RDb21wYXJhdG9yID0gcmVtYWluaW5nQ29tcGFyYXRvcnMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBNb3N0bHkganVzdCBmb3IgdGVzdGluZyBhbmQgbGVnYWN5IEFQSSByZWFzb25zXG5leHBvcnQgZnVuY3Rpb24gdG9Db21wYXJhdG9ycyhcbiAgcmFuZ2U6IHN0cmluZyB8IFJhbmdlLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogc3RyaW5nW11bXSB7XG4gIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKS5zZXQubWFwKChjb21wKSA9PiB7XG4gICAgcmV0dXJuIGNvbXBcbiAgICAgIC5tYXAoKGMpID0+IGMudmFsdWUpXG4gICAgICAuam9pbihcIiBcIilcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdChcIiBcIik7XG4gIH0pO1xufVxuXG4vLyBjb21wcmlzZWQgb2YgeHJhbmdlcywgdGlsZGVzLCBzdGFycywgYW5kIGd0bHQncyBhdCB0aGlzIHBvaW50LlxuLy8gYWxyZWFkeSByZXBsYWNlZCB0aGUgaHlwaGVuIHJhbmdlc1xuLy8gdHVybiBpbnRvIGEgc2V0IG9mIEpVU1QgY29tcGFyYXRvcnMuXG5mdW5jdGlvbiBwYXJzZUNvbXBhcmF0b3IoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgY29tcCA9IHJlcGxhY2VDYXJldHMoY29tcCwgb3B0aW9ucyk7XG4gIGNvbXAgPSByZXBsYWNlVGlsZGVzKGNvbXAsIG9wdGlvbnMpO1xuICBjb21wID0gcmVwbGFjZVhSYW5nZXMoY29tcCwgb3B0aW9ucyk7XG4gIGNvbXAgPSByZXBsYWNlU3RhcnMoY29tcCwgb3B0aW9ucyk7XG4gIHJldHVybiBjb21wO1xufVxuXG5mdW5jdGlvbiBpc1goaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gIWlkIHx8IGlkLnRvTG93ZXJDYXNlKCkgPT09IFwieFwiIHx8IGlkID09PSBcIipcIjtcbn1cblxuLy8gfiwgfj4gLS0+ICogKGFueSwga2luZGEgc2lsbHkpXG4vLyB+MiwgfjIueCwgfjIueC54LCB+PjIsIH4+Mi54IH4+Mi54LnggLS0+ID49Mi4wLjAgPDMuMC4wXG4vLyB+Mi4wLCB+Mi4wLngsIH4+Mi4wLCB+PjIuMC54IC0tPiA+PTIuMC4wIDwyLjEuMFxuLy8gfjEuMiwgfjEuMi54LCB+PjEuMiwgfj4xLjIueCAtLT4gPj0xLjIuMCA8MS4zLjBcbi8vIH4xLjIuMywgfj4xLjIuMyAtLT4gPj0xLjIuMyA8MS4zLjBcbi8vIH4xLjIuMCwgfj4xLjIuMCAtLT4gPj0xLjIuMCA8MS4zLjBcbmZ1bmN0aW9uIHJlcGxhY2VUaWxkZXMoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbXBcbiAgICAudHJpbSgpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAubWFwKChjb21wKSA9PiByZXBsYWNlVGlsZGUoY29tcCwgb3B0aW9ucykpXG4gICAgLmpvaW4oXCIgXCIpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlVGlsZGUoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgY29uc3QgcjogUmVnRXhwID0gb3B0aW9ucy5sb29zZSA/IHJlW1RJTERFTE9PU0VdIDogcmVbVElMREVdO1xuICByZXR1cm4gY29tcC5yZXBsYWNlKFxuICAgIHIsXG4gICAgKF86IHN0cmluZywgTTogc3RyaW5nLCBtOiBzdHJpbmcsIHA6IHN0cmluZywgcHI6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IHJldDogc3RyaW5nO1xuXG4gICAgICBpZiAoaXNYKE0pKSB7XG4gICAgICAgIHJldCA9IFwiXCI7XG4gICAgICB9IGVsc2UgaWYgKGlzWChtKSkge1xuICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuMC4wIDxcIiArICgrTSArIDEpICsgXCIuMC4wXCI7XG4gICAgICB9IGVsc2UgaWYgKGlzWChwKSkge1xuICAgICAgICAvLyB+MS4yID09ID49MS4yLjAgPDEuMy4wXG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi4wIDxcIiArIE0gKyBcIi5cIiArICgrbSArIDEpICsgXCIuMFwiO1xuICAgICAgfSBlbHNlIGlmIChwcikge1xuICAgICAgICByZXQgPSBcIj49XCIgK1xuICAgICAgICAgIE0gK1xuICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICBtICtcbiAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgcCArXG4gICAgICAgICAgXCItXCIgK1xuICAgICAgICAgIHByICtcbiAgICAgICAgICBcIiA8XCIgK1xuICAgICAgICAgIE0gK1xuICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAoK20gKyAxKSArXG4gICAgICAgICAgXCIuMFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gfjEuMi4zID09ID49MS4yLjMgPDEuMy4wXG4gICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi5cIiArIHAgKyBcIiA8XCIgKyBNICsgXCIuXCIgKyAoK20gKyAxKSArIFwiLjBcIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICApO1xufVxuXG4vLyBeIC0tPiAqIChhbnksIGtpbmRhIHNpbGx5KVxuLy8gXjIsIF4yLngsIF4yLngueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIF4yLjAsIF4yLjAueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIF4xLjIsIF4xLjIueCAtLT4gPj0xLjIuMCA8Mi4wLjBcbi8vIF4xLjIuMyAtLT4gPj0xLjIuMyA8Mi4wLjBcbi8vIF4xLjIuMCAtLT4gPj0xLjIuMCA8Mi4wLjBcbmZ1bmN0aW9uIHJlcGxhY2VDYXJldHMoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbXBcbiAgICAudHJpbSgpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAubWFwKChjb21wKSA9PiByZXBsYWNlQ2FyZXQoY29tcCwgb3B0aW9ucykpXG4gICAgLmpvaW4oXCIgXCIpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQ2FyZXQoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgY29uc3QgcjogUmVnRXhwID0gb3B0aW9ucy5sb29zZSA/IHJlW0NBUkVUTE9PU0VdIDogcmVbQ0FSRVRdO1xuICByZXR1cm4gY29tcC5yZXBsYWNlKHIsIChfOiBzdHJpbmcsIE0sIG0sIHAsIHByKSA9PiB7XG4gICAgbGV0IHJldDogc3RyaW5nO1xuXG4gICAgaWYgKGlzWChNKSkge1xuICAgICAgcmV0ID0gXCJcIjtcbiAgICB9IGVsc2UgaWYgKGlzWChtKSkge1xuICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLjAuMCA8XCIgKyAoK00gKyAxKSArIFwiLjAuMFwiO1xuICAgIH0gZWxzZSBpZiAoaXNYKHApKSB7XG4gICAgICBpZiAoTSA9PT0gXCIwXCIpIHtcbiAgICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLjAgPFwiICsgTSArIFwiLlwiICsgKCttICsgMSkgKyBcIi4wXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuMCA8XCIgKyAoK00gKyAxKSArIFwiLjAuMFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHIpIHtcbiAgICAgIGlmIChNID09PSBcIjBcIikge1xuICAgICAgICBpZiAobSA9PT0gXCIwXCIpIHtcbiAgICAgICAgICByZXQgPSBcIj49XCIgK1xuICAgICAgICAgICAgTSArXG4gICAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgICBtICtcbiAgICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAgIHAgK1xuICAgICAgICAgICAgXCItXCIgK1xuICAgICAgICAgICAgcHIgK1xuICAgICAgICAgICAgXCIgPFwiICtcbiAgICAgICAgICAgIE0gK1xuICAgICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgICAgbSArXG4gICAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgICAoK3AgKyAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXQgPSBcIj49XCIgK1xuICAgICAgICAgICAgTSArXG4gICAgICAgICAgICBcIi5cIiArXG4gICAgICAgICAgICBtICtcbiAgICAgICAgICAgIFwiLlwiICtcbiAgICAgICAgICAgIHAgK1xuICAgICAgICAgICAgXCItXCIgK1xuICAgICAgICAgICAgcHIgK1xuICAgICAgICAgICAgXCIgPFwiICtcbiAgICAgICAgICAgIE0gK1xuICAgICAgICAgICAgXCIuXCIgK1xuICAgICAgICAgICAgKCttICsgMSkgK1xuICAgICAgICAgICAgXCIuMFwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuXCIgKyBwICsgXCItXCIgKyBwciArIFwiIDxcIiArICgrTSArIDEpICtcbiAgICAgICAgICBcIi4wLjBcIjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKE0gPT09IFwiMFwiKSB7XG4gICAgICAgIGlmIChtID09PSBcIjBcIikge1xuICAgICAgICAgIHJldCA9IFwiPj1cIiArIE0gKyBcIi5cIiArIG0gKyBcIi5cIiArIHAgKyBcIiA8XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuXCIgK1xuICAgICAgICAgICAgKCtwICsgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLlwiICsgcCArIFwiIDxcIiArIE0gKyBcIi5cIiArICgrbSArIDEpICsgXCIuMFwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuXCIgKyBtICsgXCIuXCIgKyBwICsgXCIgPFwiICsgKCtNICsgMSkgKyBcIi4wLjBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVhSYW5nZXMoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbXBcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5tYXAoKGNvbXApID0+IHJlcGxhY2VYUmFuZ2UoY29tcCwgb3B0aW9ucykpXG4gICAgLmpvaW4oXCIgXCIpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlWFJhbmdlKGNvbXA6IHN0cmluZywgb3B0aW9uczogT3B0aW9ucyk6IHN0cmluZyB7XG4gIGNvbXAgPSBjb21wLnRyaW0oKTtcbiAgY29uc3QgcjogUmVnRXhwID0gb3B0aW9ucy5sb29zZSA/IHJlW1hSQU5HRUxPT1NFXSA6IHJlW1hSQU5HRV07XG4gIHJldHVybiBjb21wLnJlcGxhY2UociwgKHJldDogc3RyaW5nLCBndGx0LCBNLCBtLCBwLCBwcikgPT4ge1xuICAgIGNvbnN0IHhNOiBib29sZWFuID0gaXNYKE0pO1xuICAgIGNvbnN0IHhtOiBib29sZWFuID0geE0gfHwgaXNYKG0pO1xuICAgIGNvbnN0IHhwOiBib29sZWFuID0geG0gfHwgaXNYKHApO1xuICAgIGNvbnN0IGFueVg6IGJvb2xlYW4gPSB4cDtcblxuICAgIGlmIChndGx0ID09PSBcIj1cIiAmJiBhbnlYKSB7XG4gICAgICBndGx0ID0gXCJcIjtcbiAgICB9XG5cbiAgICBpZiAoeE0pIHtcbiAgICAgIGlmIChndGx0ID09PSBcIj5cIiB8fCBndGx0ID09PSBcIjxcIikge1xuICAgICAgICAvLyBub3RoaW5nIGlzIGFsbG93ZWRcbiAgICAgICAgcmV0ID0gXCI8MC4wLjBcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vdGhpbmcgaXMgZm9yYmlkZGVuXG4gICAgICAgIHJldCA9IFwiKlwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZ3RsdCAmJiBhbnlYKSB7XG4gICAgICAvLyB3ZSBrbm93IHBhdGNoIGlzIGFuIHgsIGJlY2F1c2Ugd2UgaGF2ZSBhbnkgeCBhdCBhbGwuXG4gICAgICAvLyByZXBsYWNlIFggd2l0aCAwXG4gICAgICBpZiAoeG0pIHtcbiAgICAgICAgbSA9IDA7XG4gICAgICB9XG4gICAgICBwID0gMDtcblxuICAgICAgaWYgKGd0bHQgPT09IFwiPlwiKSB7XG4gICAgICAgIC8vID4xID0+ID49Mi4wLjBcbiAgICAgICAgLy8gPjEuMiA9PiA+PTEuMy4wXG4gICAgICAgIC8vID4xLjIuMyA9PiA+PSAxLjIuNFxuICAgICAgICBndGx0ID0gXCI+PVwiO1xuICAgICAgICBpZiAoeG0pIHtcbiAgICAgICAgICBNID0gK00gKyAxO1xuICAgICAgICAgIG0gPSAwO1xuICAgICAgICAgIHAgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG0gPSArbSArIDE7XG4gICAgICAgICAgcCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZ3RsdCA9PT0gXCI8PVwiKSB7XG4gICAgICAgIC8vIDw9MC43LnggaXMgYWN0dWFsbHkgPDAuOC4wLCBzaW5jZSBhbnkgMC43Lnggc2hvdWxkXG4gICAgICAgIC8vIHBhc3MuICBTaW1pbGFybHksIDw9Ny54IGlzIGFjdHVhbGx5IDw4LjAuMCwgZXRjLlxuICAgICAgICBndGx0ID0gXCI8XCI7XG4gICAgICAgIGlmICh4bSkge1xuICAgICAgICAgIE0gPSArTSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbSA9ICttICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXQgPSBndGx0ICsgTSArIFwiLlwiICsgbSArIFwiLlwiICsgcDtcbiAgICB9IGVsc2UgaWYgKHhtKSB7XG4gICAgICByZXQgPSBcIj49XCIgKyBNICsgXCIuMC4wIDxcIiArICgrTSArIDEpICsgXCIuMC4wXCI7XG4gICAgfSBlbHNlIGlmICh4cCkge1xuICAgICAgcmV0ID0gXCI+PVwiICsgTSArIFwiLlwiICsgbSArIFwiLjAgPFwiICsgTSArIFwiLlwiICsgKCttICsgMSkgKyBcIi4wXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG59XG5cbi8vIEJlY2F1c2UgKiBpcyBBTkQtZWQgd2l0aCBldmVyeXRoaW5nIGVsc2UgaW4gdGhlIGNvbXBhcmF0b3IsXG4vLyBhbmQgJycgbWVhbnMgXCJhbnkgdmVyc2lvblwiLCBqdXN0IHJlbW92ZSB0aGUgKnMgZW50aXJlbHkuXG5mdW5jdGlvbiByZXBsYWNlU3RhcnMoY29tcDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKTogc3RyaW5nIHtcbiAgLy8gTG9vc2VuZXNzIGlzIGlnbm9yZWQgaGVyZS4gIHN0YXIgaXMgYWx3YXlzIGFzIGxvb3NlIGFzIGl0IGdldHMhXG4gIHJldHVybiBjb21wLnRyaW0oKS5yZXBsYWNlKHJlW1NUQVJdLCBcIlwiKTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBpcyBwYXNzZWQgdG8gc3RyaW5nLnJlcGxhY2UocmVbSFlQSEVOUkFOR0VdKVxuLy8gTSwgbSwgcGF0Y2gsIHByZXJlbGVhc2UsIGJ1aWxkXG4vLyAxLjIgLSAzLjQuNSA9PiA+PTEuMi4wIDw9My40LjVcbi8vIDEuMi4zIC0gMy40ID0+ID49MS4yLjAgPDMuNS4wIEFueSAzLjQueCB3aWxsIGRvXG4vLyAxLjIgLSAzLjQgPT4gPj0xLjIuMCA8My41LjBcbmZ1bmN0aW9uIGh5cGhlblJlcGxhY2UoXG4gICQwOiBhbnksXG4gIGZyb206IGFueSxcbiAgZk06IGFueSxcbiAgZm06IGFueSxcbiAgZnA6IGFueSxcbiAgZnByOiBhbnksXG4gIGZiOiBhbnksXG4gIHRvOiBhbnksXG4gIHRNOiBhbnksXG4gIHRtOiBhbnksXG4gIHRwOiBhbnksXG4gIHRwcjogYW55LFxuICB0YjogYW55LFxuKSB7XG4gIGlmIChpc1goZk0pKSB7XG4gICAgZnJvbSA9IFwiXCI7XG4gIH0gZWxzZSBpZiAoaXNYKGZtKSkge1xuICAgIGZyb20gPSBcIj49XCIgKyBmTSArIFwiLjAuMFwiO1xuICB9IGVsc2UgaWYgKGlzWChmcCkpIHtcbiAgICBmcm9tID0gXCI+PVwiICsgZk0gKyBcIi5cIiArIGZtICsgXCIuMFwiO1xuICB9IGVsc2Uge1xuICAgIGZyb20gPSBcIj49XCIgKyBmcm9tO1xuICB9XG5cbiAgaWYgKGlzWCh0TSkpIHtcbiAgICB0byA9IFwiXCI7XG4gIH0gZWxzZSBpZiAoaXNYKHRtKSkge1xuICAgIHRvID0gXCI8XCIgKyAoK3RNICsgMSkgKyBcIi4wLjBcIjtcbiAgfSBlbHNlIGlmIChpc1godHApKSB7XG4gICAgdG8gPSBcIjxcIiArIHRNICsgXCIuXCIgKyAoK3RtICsgMSkgKyBcIi4wXCI7XG4gIH0gZWxzZSBpZiAodHByKSB7XG4gICAgdG8gPSBcIjw9XCIgKyB0TSArIFwiLlwiICsgdG0gKyBcIi5cIiArIHRwICsgXCItXCIgKyB0cHI7XG4gIH0gZWxzZSB7XG4gICAgdG8gPSBcIjw9XCIgKyB0bztcbiAgfVxuXG4gIHJldHVybiAoZnJvbSArIFwiIFwiICsgdG8pLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdGlzZmllcyhcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICByYW5nZSA9IG5ldyBSYW5nZShyYW5nZSwgb3B0aW9uc09yTG9vc2UpO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gcmFuZ2UudGVzdCh2ZXJzaW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1heFNhdGlzZnlpbmc8VCBleHRlbmRzIHN0cmluZyB8IFNlbVZlcj4oXG4gIHZlcnNpb25zOiBSZWFkb25seUFycmF5PFQ+LFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBUIHwgbnVsbCB7XG4gIC8vdG9kb1xuICB2YXIgbWF4OiBUIHwgU2VtVmVyIHwgbnVsbCA9IG51bGw7XG4gIHZhciBtYXhTVjogU2VtVmVyIHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgdmFyIHJhbmdlT2JqID0gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdmVyc2lvbnMuZm9yRWFjaCgodikgPT4ge1xuICAgIGlmIChyYW5nZU9iai50ZXN0KHYpKSB7XG4gICAgICAvLyBzYXRpc2ZpZXModiwgcmFuZ2UsIG9wdGlvbnMpXG4gICAgICBpZiAoIW1heCB8fCAobWF4U1YgJiYgbWF4U1YuY29tcGFyZSh2KSA9PT0gLTEpKSB7XG4gICAgICAgIC8vIGNvbXBhcmUobWF4LCB2LCB0cnVlKVxuICAgICAgICBtYXggPSB2O1xuICAgICAgICBtYXhTViA9IG5ldyBTZW1WZXIobWF4LCBvcHRpb25zT3JMb29zZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG1heDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pblNhdGlzZnlpbmc8VCBleHRlbmRzIHN0cmluZyB8IFNlbVZlcj4oXG4gIHZlcnNpb25zOiBSZWFkb25seUFycmF5PFQ+LFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBUIHwgbnVsbCB7XG4gIC8vdG9kb1xuICB2YXIgbWluOiBhbnkgPSBudWxsO1xuICB2YXIgbWluU1Y6IGFueSA9IG51bGw7XG4gIHRyeSB7XG4gICAgdmFyIHJhbmdlT2JqID0gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdmVyc2lvbnMuZm9yRWFjaCgodikgPT4ge1xuICAgIGlmIChyYW5nZU9iai50ZXN0KHYpKSB7XG4gICAgICAvLyBzYXRpc2ZpZXModiwgcmFuZ2UsIG9wdGlvbnMpXG4gICAgICBpZiAoIW1pbiB8fCBtaW5TVi5jb21wYXJlKHYpID09PSAxKSB7XG4gICAgICAgIC8vIGNvbXBhcmUobWluLCB2LCB0cnVlKVxuICAgICAgICBtaW4gPSB2O1xuICAgICAgICBtaW5TViA9IG5ldyBTZW1WZXIobWluLCBvcHRpb25zT3JMb29zZSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG1pbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pblZlcnNpb24oXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFNlbVZlciB8IG51bGwge1xuICByYW5nZSA9IG5ldyBSYW5nZShyYW5nZSwgb3B0aW9uc09yTG9vc2UpO1xuXG4gIHZhciBtaW52ZXI6IFNlbVZlciB8IG51bGwgPSBuZXcgU2VtVmVyKFwiMC4wLjBcIik7XG4gIGlmIChyYW5nZS50ZXN0KG1pbnZlcikpIHtcbiAgICByZXR1cm4gbWludmVyO1xuICB9XG5cbiAgbWludmVyID0gbmV3IFNlbVZlcihcIjAuMC4wLTBcIik7XG4gIGlmIChyYW5nZS50ZXN0KG1pbnZlcikpIHtcbiAgICByZXR1cm4gbWludmVyO1xuICB9XG5cbiAgbWludmVyID0gbnVsbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZS5zZXQubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY29tcGFyYXRvcnMgPSByYW5nZS5zZXRbaV07XG5cbiAgICBjb21wYXJhdG9ycy5mb3JFYWNoKChjb21wYXJhdG9yKSA9PiB7XG4gICAgICAvLyBDbG9uZSB0byBhdm9pZCBtYW5pcHVsYXRpbmcgdGhlIGNvbXBhcmF0b3IncyBzZW12ZXIgb2JqZWN0LlxuICAgICAgdmFyIGNvbXB2ZXIgPSBuZXcgU2VtVmVyKGNvbXBhcmF0b3Iuc2VtdmVyLnZlcnNpb24pO1xuICAgICAgc3dpdGNoIChjb21wYXJhdG9yLm9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgaWYgKGNvbXB2ZXIucHJlcmVsZWFzZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbXB2ZXIucGF0Y2grKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tcHZlci5wcmVyZWxlYXNlLnB1c2goMCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbXB2ZXIucmF3ID0gY29tcHZlci5mb3JtYXQoKTtcbiAgICAgICAgLyogZmFsbHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSBcIlwiOlxuICAgICAgICBjYXNlIFwiPj1cIjpcbiAgICAgICAgICBpZiAoIW1pbnZlciB8fCBndChtaW52ZXIsIGNvbXB2ZXIpKSB7XG4gICAgICAgICAgICBtaW52ZXIgPSBjb21wdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgY2FzZSBcIjw9XCI6XG4gICAgICAgICAgLyogSWdub3JlIG1heGltdW0gdmVyc2lvbnMgKi9cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIG9wZXJhdGlvbjogXCIgKyBjb21wYXJhdG9yLm9wZXJhdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmIChtaW52ZXIgJiYgcmFuZ2UudGVzdChtaW52ZXIpKSB7XG4gICAgcmV0dXJuIG1pbnZlcjtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRSYW5nZShcbiAgcmFuZ2U6IHN0cmluZyB8IFJhbmdlIHwgbnVsbCxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIGlmIChyYW5nZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgLy8gUmV0dXJuICcqJyBpbnN0ZWFkIG9mICcnIHNvIHRoYXQgdHJ1dGhpbmVzcyB3b3Jrcy5cbiAgICAvLyBUaGlzIHdpbGwgdGhyb3cgaWYgaXQncyBpbnZhbGlkIGFueXdheVxuICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIG9wdGlvbnNPckxvb3NlKS5yYW5nZSB8fCBcIipcIjtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIHZlcnNpb24gaXMgbGVzcyB0aGFuIGFsbCB0aGUgdmVyc2lvbnMgcG9zc2libGUgaW4gdGhlIHJhbmdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbHRyKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gb3V0c2lkZSh2ZXJzaW9uLCByYW5nZSwgXCI8XCIsIG9wdGlvbnNPckxvb3NlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBpZiB2ZXJzaW9uIGlzIGdyZWF0ZXIgdGhhbiBhbGwgdGhlIHZlcnNpb25zIHBvc3NpYmxlIGluIHRoZSByYW5nZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGd0cihcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLFxuICByYW5nZTogc3RyaW5nIHwgUmFuZ2UsXG4gIG9wdGlvbnNPckxvb3NlPzogYm9vbGVhbiB8IE9wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIG91dHNpZGUodmVyc2lvbiwgcmFuZ2UsIFwiPlwiLCBvcHRpb25zT3JMb29zZSk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgdGhlIHZlcnNpb24gaXMgb3V0c2lkZSB0aGUgYm91bmRzIG9mIHRoZSByYW5nZSBpbiBlaXRoZXIgdGhlIGhpZ2ggb3IgbG93IGRpcmVjdGlvbi5cbiAqIFRoZSBoaWxvIGFyZ3VtZW50IG11c3QgYmUgZWl0aGVyIHRoZSBzdHJpbmcgJz4nIG9yICc8Jy4gKFRoaXMgaXMgdGhlIGZ1bmN0aW9uIGNhbGxlZCBieSBndHIgYW5kIGx0ci4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvdXRzaWRlKFxuICB2ZXJzaW9uOiBzdHJpbmcgfCBTZW1WZXIsXG4gIHJhbmdlOiBzdHJpbmcgfCBSYW5nZSxcbiAgaGlsbzogXCI+XCIgfCBcIjxcIixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICB2ZXJzaW9uID0gbmV3IFNlbVZlcih2ZXJzaW9uLCBvcHRpb25zT3JMb29zZSk7XG4gIHJhbmdlID0gbmV3IFJhbmdlKHJhbmdlLCBvcHRpb25zT3JMb29zZSk7XG5cbiAgbGV0IGd0Zm46IHR5cGVvZiBndDtcbiAgbGV0IGx0ZWZuOiB0eXBlb2YgbHRlO1xuICBsZXQgbHRmbjogdHlwZW9mIGx0O1xuICBsZXQgY29tcDogc3RyaW5nO1xuICBsZXQgZWNvbXA6IHN0cmluZztcbiAgc3dpdGNoIChoaWxvKSB7XG4gICAgY2FzZSBcIj5cIjpcbiAgICAgIGd0Zm4gPSBndDtcbiAgICAgIGx0ZWZuID0gbHRlO1xuICAgICAgbHRmbiA9IGx0O1xuICAgICAgY29tcCA9IFwiPlwiO1xuICAgICAgZWNvbXAgPSBcIj49XCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiPFwiOlxuICAgICAgZ3RmbiA9IGx0O1xuICAgICAgbHRlZm4gPSBndGU7XG4gICAgICBsdGZuID0gZ3Q7XG4gICAgICBjb21wID0gXCI8XCI7XG4gICAgICBlY29tcCA9IFwiPD1cIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdNdXN0IHByb3ZpZGUgYSBoaWxvIHZhbCBvZiBcIjxcIiBvciBcIj5cIicpO1xuICB9XG5cbiAgLy8gSWYgaXQgc2F0aXNpZmVzIHRoZSByYW5nZSBpdCBpcyBub3Qgb3V0c2lkZVxuICBpZiAoc2F0aXNmaWVzKHZlcnNpb24sIHJhbmdlLCBvcHRpb25zT3JMb29zZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBGcm9tIG5vdyBvbiwgdmFyaWFibGUgdGVybXMgYXJlIGFzIGlmIHdlJ3JlIGluIFwiZ3RyXCIgbW9kZS5cbiAgLy8gYnV0IG5vdGUgdGhhdCBldmVyeXRoaW5nIGlzIGZsaXBwZWQgZm9yIHRoZSBcImx0clwiIGZ1bmN0aW9uLlxuXG4gIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCByYW5nZS5zZXQubGVuZ3RoOyArK2kpIHtcbiAgICBjb25zdCBjb21wYXJhdG9yczogcmVhZG9ubHkgQ29tcGFyYXRvcltdID0gcmFuZ2Uuc2V0W2ldO1xuXG4gICAgbGV0IGhpZ2g6IENvbXBhcmF0b3IgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbG93OiBDb21wYXJhdG9yIHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBjb21wYXJhdG9yIG9mIGNvbXBhcmF0b3JzKSB7XG4gICAgICBpZiAoY29tcGFyYXRvci5zZW12ZXIgPT09IEFOWSkge1xuICAgICAgICBjb21wYXJhdG9yID0gbmV3IENvbXBhcmF0b3IoXCI+PTAuMC4wXCIpO1xuICAgICAgfVxuICAgICAgaGlnaCA9IGhpZ2ggfHwgY29tcGFyYXRvcjtcbiAgICAgIGxvdyA9IGxvdyB8fCBjb21wYXJhdG9yO1xuICAgICAgaWYgKGd0Zm4oY29tcGFyYXRvci5zZW12ZXIsIGhpZ2guc2VtdmVyLCBvcHRpb25zT3JMb29zZSkpIHtcbiAgICAgICAgaGlnaCA9IGNvbXBhcmF0b3I7XG4gICAgICB9IGVsc2UgaWYgKGx0Zm4oY29tcGFyYXRvci5zZW12ZXIsIGxvdy5zZW12ZXIsIG9wdGlvbnNPckxvb3NlKSkge1xuICAgICAgICBsb3cgPSBjb21wYXJhdG9yO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoaWdoID09PSBudWxsIHx8IGxvdyA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBJZiB0aGUgZWRnZSB2ZXJzaW9uIGNvbXBhcmF0b3IgaGFzIGEgb3BlcmF0b3IgdGhlbiBvdXIgdmVyc2lvblxuICAgIC8vIGlzbid0IG91dHNpZGUgaXRcbiAgICBpZiAoaGlnaCEub3BlcmF0b3IgPT09IGNvbXAgfHwgaGlnaCEub3BlcmF0b3IgPT09IGVjb21wKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGxvd2VzdCB2ZXJzaW9uIGNvbXBhcmF0b3IgaGFzIGFuIG9wZXJhdG9yIGFuZCBvdXIgdmVyc2lvblxuICAgIC8vIGlzIGxlc3MgdGhhbiBpdCB0aGVuIGl0IGlzbid0IGhpZ2hlciB0aGFuIHRoZSByYW5nZVxuICAgIGlmIChcbiAgICAgICghbG93IS5vcGVyYXRvciB8fCBsb3chLm9wZXJhdG9yID09PSBjb21wKSAmJlxuICAgICAgbHRlZm4odmVyc2lvbiwgbG93IS5zZW12ZXIpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChsb3chLm9wZXJhdG9yID09PSBlY29tcCAmJiBsdGZuKHZlcnNpb24sIGxvdyEuc2VtdmVyKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXJlbGVhc2UoXG4gIHZlcnNpb246IHN0cmluZyB8IFNlbVZlcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IFJlYWRvbmx5QXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB8IG51bGwge1xuICB2YXIgcGFyc2VkID0gcGFyc2UodmVyc2lvbiwgb3B0aW9uc09yTG9vc2UpO1xuICByZXR1cm4gcGFyc2VkICYmIHBhcnNlZC5wcmVyZWxlYXNlLmxlbmd0aCA/IHBhcnNlZC5wcmVyZWxlYXNlIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBpZiBhbnkgb2YgdGhlIHJhbmdlcyBjb21wYXJhdG9ycyBpbnRlcnNlY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVyc2VjdHMoXG4gIHJhbmdlMTogc3RyaW5nIHwgUmFuZ2UgfCBDb21wYXJhdG9yLFxuICByYW5nZTI6IHN0cmluZyB8IFJhbmdlIHwgQ29tcGFyYXRvcixcbiAgb3B0aW9uc09yTG9vc2U/OiBib29sZWFuIHwgT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICByYW5nZTEgPSBuZXcgUmFuZ2UocmFuZ2UxLCBvcHRpb25zT3JMb29zZSk7XG4gIHJhbmdlMiA9IG5ldyBSYW5nZShyYW5nZTIsIG9wdGlvbnNPckxvb3NlKTtcbiAgcmV0dXJuIHJhbmdlMS5pbnRlcnNlY3RzKHJhbmdlMik7XG59XG5cbi8qKlxuICogQ29lcmNlcyBhIHN0cmluZyB0byBzZW12ZXIgaWYgcG9zc2libGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZShcbiAgdmVyc2lvbjogc3RyaW5nIHwgU2VtVmVyLFxuICBvcHRpb25zT3JMb29zZT86IGJvb2xlYW4gfCBPcHRpb25zLFxuKTogU2VtVmVyIHwgbnVsbCB7XG4gIGlmICh2ZXJzaW9uIGluc3RhbmNlb2YgU2VtVmVyKSB7XG4gICAgcmV0dXJuIHZlcnNpb247XG4gIH1cblxuICBpZiAodHlwZW9mIHZlcnNpb24gIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoID0gdmVyc2lvbi5tYXRjaChyZVtDT0VSQ0VdKTtcblxuICBpZiAobWF0Y2ggPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHBhcnNlKFxuICAgIG1hdGNoWzFdICsgXCIuXCIgKyAobWF0Y2hbMl0gfHwgXCIwXCIpICsgXCIuXCIgKyAobWF0Y2hbM10gfHwgXCIwXCIpLFxuICAgIG9wdGlvbnNPckxvb3NlLFxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBTZW1WZXI7XG4iXX0=