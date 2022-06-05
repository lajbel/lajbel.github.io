import { getDefaultValue, getOption, paramCaseToCamelCase } from "./_utils.ts";
import { ArgumentFollowsVariadicArgument, DuplicateOption, InvalidOption, InvalidOptionValue, MissingOptionValue, RequiredArgumentFollowsOptionalArgument, UnknownConflictingOption, UnknownOption, UnknownRequiredOption, UnknownType } from "./_errors.ts";
import { OptionType } from "./types.ts";
import { boolean } from "./types/boolean.ts";
import { number } from "./types/number.ts";
import { string } from "./types/string.ts";
import { validateFlags } from "./validate_flags.ts";
import { integer } from "./types/integer.ts";
const Types = {
    [OptionType.STRING]: string,
    [OptionType.NUMBER]: number,
    [OptionType.INTEGER]: integer,
    [OptionType.BOOLEAN]: boolean
};
/**
 * Parse command line arguments.
 * @param args  Command line arguments e.g: `Deno.args`
 * @param opts  Parse options.
 * ```
 * // example.ts -x 3 -y.z -n5 -abc --beep=boop foo bar baz --deno.land -- --cliffy
 * parseFlags(Deno.args);
 * ```
 * ```
 * {
 *   flags: {
 *     x: "3",
 *     y: { z: true },
 *     n: "5",
 *     a: true,
 *     b: true,
 *     c: true,
 *     beep: "boop",
 *     deno: { land: true }
 *   },
 *   unknown: [ "foo", "bar", "baz" ],
 *   literal: [ "--cliffy" ]
 * }
 * ```
 */ // deno-lint-ignore no-explicit-any
export function parseFlags(args, opts = {
}) {
    args = args.slice();
    !opts.flags && (opts.flags = []);
    let inLiteral = false;
    let negate = false;
    const flags = {
    };
    const optionNames = {
    };
    let literal = [];
    let unknown = [];
    let stopEarly = null;
    opts.flags.forEach((opt)=>{
        opt.depends?.forEach((flag)=>{
            if (!opts.flags || !getOption(opts.flags, flag)) {
                throw new UnknownRequiredOption(flag, opts.flags ?? []);
            }
        });
        opt.conflicts?.forEach((flag)=>{
            if (!opts.flags || !getOption(opts.flags, flag)) {
                throw new UnknownConflictingOption(flag, opts.flags ?? []);
            }
        });
    });
    for(let argsIndex = 0; argsIndex < args.length; argsIndex++){
        let option;
        let optionArgs;
        let current = args[argsIndex];
        let currentValue;
        // literal args after --
        if (inLiteral) {
            literal.push(current);
            continue;
        }
        if (current === "--") {
            inLiteral = true;
            continue;
        }
        const isFlag = current.length > 1 && current[0] === "-";
        const next = ()=>currentValue ?? args[argsIndex + 1]
        ;
        if (isFlag) {
            const isShort = current[1] !== "-";
            const isLong = isShort ? false : current.length > 3 && current[2] !== "-";
            if (!isShort && !isLong) {
                throw new InvalidOption(current, opts.flags);
            }
            // split value: --foo="bar=baz" => --foo bar=baz
            const equalSignIndex = current.indexOf("=");
            if (equalSignIndex > -1) {
                currentValue = current.slice(equalSignIndex + 1) || undefined;
                current = current.slice(0, equalSignIndex);
            }
            // normalize short flags: -abc => -a -b -c
            if (isShort && current.length > 2 && current[2] !== ".") {
                args.splice(argsIndex, 1, ...splitFlags(current));
                current = args[argsIndex];
            } else if (isLong && current.startsWith("--no-")) {
                negate = true;
            }
            option = getOption(opts.flags, current);
            if (!option) {
                if (opts.flags.length) {
                    throw new UnknownOption(current, opts.flags);
                }
                option = {
                    name: current.replace(/^-+/, ""),
                    optionalValue: true,
                    type: OptionType.STRING
                };
            }
            const positiveName = negate ? option.name.replace(/^no-?/, "") : option.name;
            const propName = paramCaseToCamelCase(positiveName);
            if (typeof flags[propName] !== "undefined") {
                if (!opts.flags.length) {
                    option.collect = true;
                } else if (!option.collect) {
                    throw new DuplicateOption(current);
                }
            }
            optionArgs = option.args?.length ? option.args : [
                {
                    type: option.type,
                    requiredValue: option.requiredValue,
                    optionalValue: option.optionalValue,
                    variadic: option.variadic,
                    list: option.list,
                    separator: option.separator
                }
            ];
            let optionArgsIndex = 0;
            let inOptionalArg = false;
            const previous = flags[propName];
            parseNext(option, optionArgs);
            if (typeof flags[propName] === "undefined") {
                if (optionArgs[optionArgsIndex].requiredValue) {
                    throw new MissingOptionValue(option.name);
                } else if (typeof option.default !== "undefined") {
                    flags[propName] = getDefaultValue(option);
                } else {
                    flags[propName] = true;
                }
            }
            if (option.value) {
                flags[propName] = option.value(flags[propName], previous);
            } else if (option.collect) {
                const value = typeof previous !== "undefined" ? Array.isArray(previous) ? previous : [
                    previous
                ] : [];
                value.push(flags[propName]);
                flags[propName] = value;
            }
            optionNames[propName] = option.name;
            opts.option?.(option, flags[propName]);
            /** Parse next argument for current option. */ // deno-lint-ignore no-inner-declarations
            function parseNext(option, optionArgs) {
                const arg = optionArgs[optionArgsIndex];
                if (!arg) {
                    const flag = next();
                    throw new UnknownOption(flag, opts.flags ?? []);
                }
                if (!arg.type) {
                    arg.type = OptionType.BOOLEAN;
                }
                if (option.args?.length) {
                    // make all value's required per default
                    if ((typeof arg.optionalValue === "undefined" || arg.optionalValue === false) && typeof arg.requiredValue === "undefined") {
                        arg.requiredValue = true;
                    }
                } else {
                    // make non boolean value required per default
                    if (arg.type !== OptionType.BOOLEAN && (typeof arg.optionalValue === "undefined" || arg.optionalValue === false) && typeof arg.requiredValue === "undefined") {
                        arg.requiredValue = true;
                    }
                }
                if (arg.requiredValue) {
                    if (inOptionalArg) {
                        throw new RequiredArgumentFollowsOptionalArgument(option.name);
                    }
                } else {
                    inOptionalArg = true;
                }
                if (negate) {
                    flags[propName] = false;
                    return;
                }
                let result;
                let increase = false;
                if (arg.list && hasNext(arg)) {
                    const parsed = next().split(arg.separator || ",").map((nextValue)=>{
                        const value = parseValue(option, arg, nextValue);
                        if (typeof value === "undefined") {
                            throw new InvalidOptionValue(option.name, arg.type ?? "?", nextValue);
                        }
                        return value;
                    });
                    if (parsed?.length) {
                        result = parsed;
                    }
                } else {
                    if (hasNext(arg)) {
                        result = parseValue(option, arg, next());
                    } else if (arg.optionalValue && arg.type === OptionType.BOOLEAN) {
                        result = true;
                    }
                }
                if (increase && typeof currentValue === "undefined") {
                    argsIndex++;
                    if (!arg.variadic) {
                        optionArgsIndex++;
                    } else if (optionArgs[optionArgsIndex + 1]) {
                        throw new ArgumentFollowsVariadicArgument(next());
                    }
                }
                if (typeof result !== "undefined" && (optionArgs.length > 1 || arg.variadic)) {
                    if (!flags[propName]) {
                        flags[propName] = [];
                    }
                    flags[propName].push(result);
                    if (hasNext(arg)) {
                        parseNext(option, optionArgs);
                    }
                } else {
                    flags[propName] = result;
                }
                /** Check if current option should have an argument. */ function hasNext(arg) {
                    const nextValue = currentValue ?? args[argsIndex + 1];
                    if (!currentValue && !nextValue) {
                        return false;
                    }
                    if (arg.requiredValue) {
                        return true;
                    }
                    if (arg.optionalValue || arg.variadic) {
                        return nextValue[0] !== "-" || arg.type === OptionType.NUMBER && !isNaN(Number(nextValue));
                    }
                    return false;
                }
                /** Parse argument value.  */ function parseValue(option, arg, value) {
                    const type = arg.type || OptionType.STRING;
                    const result = opts.parse ? opts.parse({
                        label: "Option",
                        type,
                        name: `--${option.name}`,
                        value
                    }) : parseFlagValue(option, arg, value);
                    if (typeof result !== "undefined") {
                        increase = true;
                    }
                    return result;
                }
            }
        } else {
            if (opts.stopEarly) {
                stopEarly = current;
                break;
            }
            unknown.push(current);
        }
    }
    if (stopEarly) {
        const stopEarlyArgIndex = args.indexOf(stopEarly);
        if (stopEarlyArgIndex !== -1) {
            const doubleDashIndex = args.indexOf("--");
            unknown = args.slice(stopEarlyArgIndex, doubleDashIndex === -1 ? undefined : doubleDashIndex);
            if (doubleDashIndex !== -1) {
                literal = args.slice(doubleDashIndex + 1);
            }
        }
    }
    if (opts.flags?.length) {
        validateFlags(opts.flags, flags, opts.knownFlaks, opts.allowEmpty, optionNames);
    }
    // convert dotted option keys into nested objects
    const result = Object.keys(flags).reduce((result, key)=>{
        if (~key.indexOf(".")) {
            key.split(".").reduce((// deno-lint-ignore no-explicit-any
            result, subKey, index, parts)=>{
                if (index === parts.length - 1) {
                    result[subKey] = flags[key];
                } else {
                    result[subKey] = result[subKey] ?? {
                    };
                }
                return result[subKey];
            }, result);
        } else {
            result[key] = flags[key];
        }
        return result;
    }, {
    });
    return {
        flags: result,
        unknown,
        literal
    };
}
function splitFlags(flag) {
    const normalized = [];
    const flags = flag.slice(1).split("");
    if (isNaN(Number(flag[flag.length - 1]))) {
        flags.forEach((val)=>normalized.push(`-${val}`)
        );
    } else {
        normalized.push(`-${flags.shift()}`);
        if (flags.length) {
            normalized.push(flags.join(""));
        }
    }
    return normalized;
}
function parseFlagValue(option, arg, value) {
    const type = arg.type || OptionType.STRING;
    const parseType = Types[type];
    if (!parseType) {
        throw new UnknownType(type, Object.keys(Types));
    }
    return parseType({
        label: "Option",
        type,
        name: `--${option.name}`,
        value
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvZmxhZ3MvZmxhZ3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RGVmYXVsdFZhbHVlLCBnZXRPcHRpb24sIHBhcmFtQ2FzZVRvQ2FtZWxDYXNlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQge1xuICBBcmd1bWVudEZvbGxvd3NWYXJpYWRpY0FyZ3VtZW50LFxuICBEdXBsaWNhdGVPcHRpb24sXG4gIEludmFsaWRPcHRpb24sXG4gIEludmFsaWRPcHRpb25WYWx1ZSxcbiAgTWlzc2luZ09wdGlvblZhbHVlLFxuICBSZXF1aXJlZEFyZ3VtZW50Rm9sbG93c09wdGlvbmFsQXJndW1lbnQsXG4gIFVua25vd25Db25mbGljdGluZ09wdGlvbixcbiAgVW5rbm93bk9wdGlvbixcbiAgVW5rbm93blJlcXVpcmVkT3B0aW9uLFxuICBVbmtub3duVHlwZSxcbn0gZnJvbSBcIi4vX2Vycm9ycy50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBJRmxhZ0FyZ3VtZW50LFxuICBJRmxhZ09wdGlvbnMsXG4gIElGbGFnc1Jlc3VsdCxcbiAgSVBhcnNlT3B0aW9ucyxcbiAgSVR5cGVIYW5kbGVyLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgT3B0aW9uVHlwZSB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBib29sZWFuIH0gZnJvbSBcIi4vdHlwZXMvYm9vbGVhbi50c1wiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4vdHlwZXMvbnVtYmVyLnRzXCI7XG5pbXBvcnQgeyBzdHJpbmcgfSBmcm9tIFwiLi90eXBlcy9zdHJpbmcudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlRmxhZ3MgfSBmcm9tIFwiLi92YWxpZGF0ZV9mbGFncy50c1wiO1xuaW1wb3J0IHsgaW50ZWdlciB9IGZyb20gXCIuL3R5cGVzL2ludGVnZXIudHNcIjtcblxuY29uc3QgVHlwZXM6IFJlY29yZDxzdHJpbmcsIElUeXBlSGFuZGxlcjx1bmtub3duPj4gPSB7XG4gIFtPcHRpb25UeXBlLlNUUklOR106IHN0cmluZyxcbiAgW09wdGlvblR5cGUuTlVNQkVSXTogbnVtYmVyLFxuICBbT3B0aW9uVHlwZS5JTlRFR0VSXTogaW50ZWdlcixcbiAgW09wdGlvblR5cGUuQk9PTEVBTl06IGJvb2xlYW4sXG59O1xuXG4vKipcbiAqIFBhcnNlIGNvbW1hbmQgbGluZSBhcmd1bWVudHMuXG4gKiBAcGFyYW0gYXJncyAgQ29tbWFuZCBsaW5lIGFyZ3VtZW50cyBlLmc6IGBEZW5vLmFyZ3NgXG4gKiBAcGFyYW0gb3B0cyAgUGFyc2Ugb3B0aW9ucy5cbiAqIGBgYFxuICogLy8gZXhhbXBsZS50cyAteCAzIC15LnogLW41IC1hYmMgLS1iZWVwPWJvb3AgZm9vIGJhciBiYXogLS1kZW5vLmxhbmQgLS0gLS1jbGlmZnlcbiAqIHBhcnNlRmxhZ3MoRGVuby5hcmdzKTtcbiAqIGBgYFxuICogYGBgXG4gKiB7XG4gKiAgIGZsYWdzOiB7XG4gKiAgICAgeDogXCIzXCIsXG4gKiAgICAgeTogeyB6OiB0cnVlIH0sXG4gKiAgICAgbjogXCI1XCIsXG4gKiAgICAgYTogdHJ1ZSxcbiAqICAgICBiOiB0cnVlLFxuICogICAgIGM6IHRydWUsXG4gKiAgICAgYmVlcDogXCJib29wXCIsXG4gKiAgICAgZGVubzogeyBsYW5kOiB0cnVlIH1cbiAqICAgfSxcbiAqICAgdW5rbm93bjogWyBcImZvb1wiLCBcImJhclwiLCBcImJhelwiIF0sXG4gKiAgIGxpdGVyYWw6IFsgXCItLWNsaWZmeVwiIF1cbiAqIH1cbiAqIGBgYFxuICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmxhZ3M8TyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4gPSBSZWNvcmQ8c3RyaW5nLCBhbnk+PihcbiAgYXJnczogc3RyaW5nW10sXG4gIG9wdHM6IElQYXJzZU9wdGlvbnMgPSB7fSxcbik6IElGbGFnc1Jlc3VsdDxPPiB7XG4gIGFyZ3MgPSBhcmdzLnNsaWNlKCk7XG4gICFvcHRzLmZsYWdzICYmIChvcHRzLmZsYWdzID0gW10pO1xuXG4gIGxldCBpbkxpdGVyYWwgPSBmYWxzZTtcbiAgbGV0IG5lZ2F0ZSA9IGZhbHNlO1xuXG4gIGNvbnN0IGZsYWdzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBjb25zdCBvcHRpb25OYW1lczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBsZXQgbGl0ZXJhbDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IHVua25vd246IHN0cmluZ1tdID0gW107XG4gIGxldCBzdG9wRWFybHk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIG9wdHMuZmxhZ3MuZm9yRWFjaCgob3B0KSA9PiB7XG4gICAgb3B0LmRlcGVuZHM/LmZvckVhY2goKGZsYWcpID0+IHtcbiAgICAgIGlmICghb3B0cy5mbGFncyB8fCAhZ2V0T3B0aW9uKG9wdHMuZmxhZ3MsIGZsYWcpKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmtub3duUmVxdWlyZWRPcHRpb24oZmxhZywgb3B0cy5mbGFncyA/PyBbXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgb3B0LmNvbmZsaWN0cz8uZm9yRWFjaCgoZmxhZykgPT4ge1xuICAgICAgaWYgKCFvcHRzLmZsYWdzIHx8ICFnZXRPcHRpb24ob3B0cy5mbGFncywgZmxhZykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVua25vd25Db25mbGljdGluZ09wdGlvbihmbGFnLCBvcHRzLmZsYWdzID8/IFtdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZm9yIChcbiAgICBsZXQgYXJnc0luZGV4ID0gMDtcbiAgICBhcmdzSW5kZXggPCBhcmdzLmxlbmd0aDtcbiAgICBhcmdzSW5kZXgrK1xuICApIHtcbiAgICBsZXQgb3B0aW9uOiBJRmxhZ09wdGlvbnMgfCB1bmRlZmluZWQ7XG4gICAgbGV0IG9wdGlvbkFyZ3M6IElGbGFnQXJndW1lbnRbXSB8IHVuZGVmaW5lZDtcbiAgICBsZXQgY3VycmVudDogc3RyaW5nID0gYXJnc1thcmdzSW5kZXhdO1xuICAgIGxldCBjdXJyZW50VmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIC8vIGxpdGVyYWwgYXJncyBhZnRlciAtLVxuICAgIGlmIChpbkxpdGVyYWwpIHtcbiAgICAgIGxpdGVyYWwucHVzaChjdXJyZW50KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09PSBcIi0tXCIpIHtcbiAgICAgIGluTGl0ZXJhbCA9IHRydWU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0ZsYWcgPSBjdXJyZW50Lmxlbmd0aCA+IDEgJiYgY3VycmVudFswXSA9PT0gXCItXCI7XG4gICAgY29uc3QgbmV4dCA9ICgpID0+IGN1cnJlbnRWYWx1ZSA/PyBhcmdzW2FyZ3NJbmRleCArIDFdO1xuXG4gICAgaWYgKGlzRmxhZykge1xuICAgICAgY29uc3QgaXNTaG9ydCA9IGN1cnJlbnRbMV0gIT09IFwiLVwiO1xuICAgICAgY29uc3QgaXNMb25nID0gaXNTaG9ydCA/IGZhbHNlIDogY3VycmVudC5sZW5ndGggPiAzICYmIGN1cnJlbnRbMl0gIT09IFwiLVwiO1xuXG4gICAgICBpZiAoIWlzU2hvcnQgJiYgIWlzTG9uZykge1xuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE9wdGlvbihjdXJyZW50LCBvcHRzLmZsYWdzKTtcbiAgICAgIH1cblxuICAgICAgLy8gc3BsaXQgdmFsdWU6IC0tZm9vPVwiYmFyPWJhelwiID0+IC0tZm9vIGJhcj1iYXpcbiAgICAgIGNvbnN0IGVxdWFsU2lnbkluZGV4ID0gY3VycmVudC5pbmRleE9mKFwiPVwiKTtcbiAgICAgIGlmIChlcXVhbFNpZ25JbmRleCA+IC0xKSB7XG4gICAgICAgIGN1cnJlbnRWYWx1ZSA9IGN1cnJlbnQuc2xpY2UoZXF1YWxTaWduSW5kZXggKyAxKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnNsaWNlKDAsIGVxdWFsU2lnbkluZGV4KTtcbiAgICAgIH1cblxuICAgICAgLy8gbm9ybWFsaXplIHNob3J0IGZsYWdzOiAtYWJjID0+IC1hIC1iIC1jXG4gICAgICBpZiAoaXNTaG9ydCAmJiBjdXJyZW50Lmxlbmd0aCA+IDIgJiYgY3VycmVudFsyXSAhPT0gXCIuXCIpIHtcbiAgICAgICAgYXJncy5zcGxpY2UoYXJnc0luZGV4LCAxLCAuLi5zcGxpdEZsYWdzKGN1cnJlbnQpKTtcbiAgICAgICAgY3VycmVudCA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICAgIH0gZWxzZSBpZiAoaXNMb25nICYmIGN1cnJlbnQuc3RhcnRzV2l0aChcIi0tbm8tXCIpKSB7XG4gICAgICAgIG5lZ2F0ZSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbiA9IGdldE9wdGlvbihvcHRzLmZsYWdzLCBjdXJyZW50KTtcblxuICAgICAgaWYgKCFvcHRpb24pIHtcbiAgICAgICAgaWYgKG9wdHMuZmxhZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFVua25vd25PcHRpb24oY3VycmVudCwgb3B0cy5mbGFncyk7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb24gPSB7XG4gICAgICAgICAgbmFtZTogY3VycmVudC5yZXBsYWNlKC9eLSsvLCBcIlwiKSxcbiAgICAgICAgICBvcHRpb25hbFZhbHVlOiB0cnVlLFxuICAgICAgICAgIHR5cGU6IE9wdGlvblR5cGUuU1RSSU5HLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwb3NpdGl2ZU5hbWU6IHN0cmluZyA9IG5lZ2F0ZVxuICAgICAgICA/IG9wdGlvbi5uYW1lLnJlcGxhY2UoL15uby0/LywgXCJcIilcbiAgICAgICAgOiBvcHRpb24ubmFtZTtcbiAgICAgIGNvbnN0IHByb3BOYW1lOiBzdHJpbmcgPSBwYXJhbUNhc2VUb0NhbWVsQ2FzZShwb3NpdGl2ZU5hbWUpO1xuXG4gICAgICBpZiAodHlwZW9mIGZsYWdzW3Byb3BOYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIW9wdHMuZmxhZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgb3B0aW9uLmNvbGxlY3QgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKCFvcHRpb24uY29sbGVjdCkge1xuICAgICAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVPcHRpb24oY3VycmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb3B0aW9uQXJncyA9IG9wdGlvbi5hcmdzPy5sZW5ndGggPyBvcHRpb24uYXJncyA6IFt7XG4gICAgICAgIHR5cGU6IG9wdGlvbi50eXBlLFxuICAgICAgICByZXF1aXJlZFZhbHVlOiBvcHRpb24ucmVxdWlyZWRWYWx1ZSxcbiAgICAgICAgb3B0aW9uYWxWYWx1ZTogb3B0aW9uLm9wdGlvbmFsVmFsdWUsXG4gICAgICAgIHZhcmlhZGljOiBvcHRpb24udmFyaWFkaWMsXG4gICAgICAgIGxpc3Q6IG9wdGlvbi5saXN0LFxuICAgICAgICBzZXBhcmF0b3I6IG9wdGlvbi5zZXBhcmF0b3IsXG4gICAgICB9XTtcblxuICAgICAgbGV0IG9wdGlvbkFyZ3NJbmRleCA9IDA7XG4gICAgICBsZXQgaW5PcHRpb25hbEFyZyA9IGZhbHNlO1xuICAgICAgY29uc3QgcHJldmlvdXMgPSBmbGFnc1twcm9wTmFtZV07XG5cbiAgICAgIHBhcnNlTmV4dChvcHRpb24sIG9wdGlvbkFyZ3MpO1xuXG4gICAgICBpZiAodHlwZW9mIGZsYWdzW3Byb3BOYW1lXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAob3B0aW9uQXJnc1tvcHRpb25BcmdzSW5kZXhdLnJlcXVpcmVkVmFsdWUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ09wdGlvblZhbHVlKG9wdGlvbi5uYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9uLmRlZmF1bHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBmbGFnc1twcm9wTmFtZV0gPSBnZXREZWZhdWx0VmFsdWUob3B0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmbGFnc1twcm9wTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb24udmFsdWUpIHtcbiAgICAgICAgZmxhZ3NbcHJvcE5hbWVdID0gb3B0aW9uLnZhbHVlKGZsYWdzW3Byb3BOYW1lXSwgcHJldmlvdXMpO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb24uY29sbGVjdCkge1xuICAgICAgICBjb25zdCB2YWx1ZTogdW5rbm93bltdID0gdHlwZW9mIHByZXZpb3VzICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgPyAoQXJyYXkuaXNBcnJheShwcmV2aW91cykgPyBwcmV2aW91cyA6IFtwcmV2aW91c10pXG4gICAgICAgICAgOiBbXTtcblxuICAgICAgICB2YWx1ZS5wdXNoKGZsYWdzW3Byb3BOYW1lXSk7XG4gICAgICAgIGZsYWdzW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25OYW1lc1twcm9wTmFtZV0gPSBvcHRpb24ubmFtZTtcblxuICAgICAgb3B0cy5vcHRpb24/LihvcHRpb24sIGZsYWdzW3Byb3BOYW1lXSk7XG5cbiAgICAgIC8qKiBQYXJzZSBuZXh0IGFyZ3VtZW50IGZvciBjdXJyZW50IG9wdGlvbi4gKi9cbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8taW5uZXItZGVjbGFyYXRpb25zXG4gICAgICBmdW5jdGlvbiBwYXJzZU5leHQoXG4gICAgICAgIG9wdGlvbjogSUZsYWdPcHRpb25zLFxuICAgICAgICBvcHRpb25BcmdzOiBJRmxhZ0FyZ3VtZW50W10sXG4gICAgICApOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYXJnOiBJRmxhZ0FyZ3VtZW50IHwgdW5kZWZpbmVkID0gb3B0aW9uQXJnc1tvcHRpb25BcmdzSW5kZXhdO1xuXG4gICAgICAgIGlmICghYXJnKSB7XG4gICAgICAgICAgY29uc3QgZmxhZyA9IG5leHQoKTtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93bk9wdGlvbihmbGFnLCBvcHRzLmZsYWdzID8/IFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYXJnLnR5cGUpIHtcbiAgICAgICAgICBhcmcudHlwZSA9IE9wdGlvblR5cGUuQk9PTEVBTjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb24uYXJncz8ubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gbWFrZSBhbGwgdmFsdWUncyByZXF1aXJlZCBwZXIgZGVmYXVsdFxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICh0eXBlb2YgYXJnLm9wdGlvbmFsVmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICAgICAgICAgYXJnLm9wdGlvbmFsVmFsdWUgPT09IGZhbHNlKSAmJlxuICAgICAgICAgICAgdHlwZW9mIGFyZy5yZXF1aXJlZFZhbHVlID09PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBhcmcucmVxdWlyZWRWYWx1ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG1ha2Ugbm9uIGJvb2xlYW4gdmFsdWUgcmVxdWlyZWQgcGVyIGRlZmF1bHRcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBhcmcudHlwZSAhPT0gT3B0aW9uVHlwZS5CT09MRUFOICYmXG4gICAgICAgICAgICAodHlwZW9mIGFyZy5vcHRpb25hbFZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgICAgICAgIGFyZy5vcHRpb25hbFZhbHVlID09PSBmYWxzZSkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBhcmcucmVxdWlyZWRWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYXJnLnJlcXVpcmVkVmFsdWUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmcucmVxdWlyZWRWYWx1ZSkge1xuICAgICAgICAgIGlmIChpbk9wdGlvbmFsQXJnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmVxdWlyZWRBcmd1bWVudEZvbGxvd3NPcHRpb25hbEFyZ3VtZW50KG9wdGlvbi5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5PcHRpb25hbEFyZyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmVnYXRlKSB7XG4gICAgICAgICAgZmxhZ3NbcHJvcE5hbWVdID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDogdW5rbm93bjtcbiAgICAgICAgbGV0IGluY3JlYXNlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGFyZy5saXN0ICYmIGhhc05leHQoYXJnKSkge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZDogdW5rbm93bltdID0gbmV4dCgpXG4gICAgICAgICAgICAuc3BsaXQoYXJnLnNlcGFyYXRvciB8fCBcIixcIilcbiAgICAgICAgICAgIC5tYXAoKG5leHRWYWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcGFyc2VWYWx1ZShvcHRpb24sIGFyZywgbmV4dFZhbHVlKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBJbnZhbGlkT3B0aW9uVmFsdWUoXG4gICAgICAgICAgICAgICAgICBvcHRpb24ubmFtZSxcbiAgICAgICAgICAgICAgICAgIGFyZy50eXBlID8/IFwiP1wiLFxuICAgICAgICAgICAgICAgICAgbmV4dFZhbHVlLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocGFyc2VkPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHBhcnNlZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGhhc05leHQoYXJnKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcGFyc2VWYWx1ZShvcHRpb24sIGFyZywgbmV4dCgpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFyZy5vcHRpb25hbFZhbHVlICYmIGFyZy50eXBlID09PSBPcHRpb25UeXBlLkJPT0xFQU4pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluY3JlYXNlICYmIHR5cGVvZiBjdXJyZW50VmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBhcmdzSW5kZXgrKztcbiAgICAgICAgICBpZiAoIWFyZy52YXJpYWRpYykge1xuICAgICAgICAgICAgb3B0aW9uQXJnc0luZGV4Kys7XG4gICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25BcmdzW29wdGlvbkFyZ3NJbmRleCArIDFdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXJndW1lbnRGb2xsb3dzVmFyaWFkaWNBcmd1bWVudChuZXh0KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICB0eXBlb2YgcmVzdWx0ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgKG9wdGlvbkFyZ3MubGVuZ3RoID4gMSB8fCBhcmcudmFyaWFkaWMpXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICghZmxhZ3NbcHJvcE5hbWVdKSB7XG4gICAgICAgICAgICBmbGFnc1twcm9wTmFtZV0gPSBbXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAoZmxhZ3NbcHJvcE5hbWVdIGFzIEFycmF5PHVua25vd24+KS5wdXNoKHJlc3VsdCk7XG5cbiAgICAgICAgICBpZiAoaGFzTmV4dChhcmcpKSB7XG4gICAgICAgICAgICBwYXJzZU5leHQob3B0aW9uLCBvcHRpb25BcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZmxhZ3NbcHJvcE5hbWVdID0gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIENoZWNrIGlmIGN1cnJlbnQgb3B0aW9uIHNob3VsZCBoYXZlIGFuIGFyZ3VtZW50LiAqL1xuICAgICAgICBmdW5jdGlvbiBoYXNOZXh0KGFyZzogSUZsYWdBcmd1bWVudCk6IGJvb2xlYW4ge1xuICAgICAgICAgIGNvbnN0IG5leHRWYWx1ZSA9IGN1cnJlbnRWYWx1ZSA/PyBhcmdzW2FyZ3NJbmRleCArIDFdO1xuICAgICAgICAgIGlmICghY3VycmVudFZhbHVlICYmICFuZXh0VmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXJnLnJlcXVpcmVkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhcmcub3B0aW9uYWxWYWx1ZSB8fCBhcmcudmFyaWFkaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0VmFsdWVbMF0gIT09IFwiLVwiIHx8XG4gICAgICAgICAgICAgIChhcmcudHlwZSA9PT0gT3B0aW9uVHlwZS5OVU1CRVIgJiYgIWlzTmFOKE51bWJlcihuZXh0VmFsdWUpKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIFBhcnNlIGFyZ3VtZW50IHZhbHVlLiAgKi9cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VWYWx1ZShcbiAgICAgICAgICBvcHRpb246IElGbGFnT3B0aW9ucyxcbiAgICAgICAgICBhcmc6IElGbGFnQXJndW1lbnQsXG4gICAgICAgICAgdmFsdWU6IHN0cmluZyxcbiAgICAgICAgKTogdW5rbm93biB7XG4gICAgICAgICAgY29uc3QgdHlwZTogc3RyaW5nID0gYXJnLnR5cGUgfHwgT3B0aW9uVHlwZS5TVFJJTkc7XG4gICAgICAgICAgY29uc3QgcmVzdWx0OiB1bmtub3duID0gb3B0cy5wYXJzZVxuICAgICAgICAgICAgPyBvcHRzLnBhcnNlKHtcbiAgICAgICAgICAgICAgbGFiZWw6IFwiT3B0aW9uXCIsXG4gICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgIG5hbWU6IGAtLSR7b3B0aW9uLm5hbWV9YCxcbiAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiBwYXJzZUZsYWdWYWx1ZShvcHRpb24sIGFyZywgdmFsdWUpO1xuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIHJlc3VsdCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaW5jcmVhc2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdHMuc3RvcEVhcmx5KSB7XG4gICAgICAgIHN0b3BFYXJseSA9IGN1cnJlbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdW5rbm93bi5wdXNoKGN1cnJlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzdG9wRWFybHkpIHtcbiAgICBjb25zdCBzdG9wRWFybHlBcmdJbmRleDogbnVtYmVyID0gYXJncy5pbmRleE9mKHN0b3BFYXJseSk7XG4gICAgaWYgKHN0b3BFYXJseUFyZ0luZGV4ICE9PSAtMSkge1xuICAgICAgY29uc3QgZG91YmxlRGFzaEluZGV4OiBudW1iZXIgPSBhcmdzLmluZGV4T2YoXCItLVwiKTtcbiAgICAgIHVua25vd24gPSBhcmdzLnNsaWNlKFxuICAgICAgICBzdG9wRWFybHlBcmdJbmRleCxcbiAgICAgICAgZG91YmxlRGFzaEluZGV4ID09PSAtMSA/IHVuZGVmaW5lZCA6IGRvdWJsZURhc2hJbmRleCxcbiAgICAgICk7XG4gICAgICBpZiAoZG91YmxlRGFzaEluZGV4ICE9PSAtMSkge1xuICAgICAgICBsaXRlcmFsID0gYXJncy5zbGljZShkb3VibGVEYXNoSW5kZXggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5mbGFncz8ubGVuZ3RoKSB7XG4gICAgdmFsaWRhdGVGbGFncyhcbiAgICAgIG9wdHMuZmxhZ3MsXG4gICAgICBmbGFncyxcbiAgICAgIG9wdHMua25vd25GbGFrcyxcbiAgICAgIG9wdHMuYWxsb3dFbXB0eSxcbiAgICAgIG9wdGlvbk5hbWVzLFxuICAgICk7XG4gIH1cblxuICAvLyBjb252ZXJ0IGRvdHRlZCBvcHRpb24ga2V5cyBpbnRvIG5lc3RlZCBvYmplY3RzXG4gIGNvbnN0IHJlc3VsdCA9IE9iamVjdC5rZXlzKGZsYWdzKVxuICAgIC5yZWR1Y2UoKHJlc3VsdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAofmtleS5pbmRleE9mKFwiLlwiKSkge1xuICAgICAgICBrZXkuc3BsaXQoXCIuXCIpLnJlZHVjZShcbiAgICAgICAgICAoXG4gICAgICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICAgICAgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICAgICAgICAgICAgc3ViS2V5OiBzdHJpbmcsXG4gICAgICAgICAgICBpbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgcGFydHM6IHN0cmluZ1tdLFxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSBwYXJ0cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIHJlc3VsdFtzdWJLZXldID0gZmxhZ3Nba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdFtzdWJLZXldID0gcmVzdWx0W3N1YktleV0gPz8ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0W3N1YktleV07XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN1bHQsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRba2V5XSA9IGZsYWdzW2tleV07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIHt9KTtcblxuICByZXR1cm4geyBmbGFnczogcmVzdWx0IGFzIE8sIHVua25vd24sIGxpdGVyYWwgfTtcbn1cblxuZnVuY3Rpb24gc3BsaXRGbGFncyhmbGFnOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHtcbiAgY29uc3Qgbm9ybWFsaXplZDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBjb25zdCBmbGFncyA9IGZsYWcuc2xpY2UoMSkuc3BsaXQoXCJcIik7XG5cbiAgaWYgKGlzTmFOKE51bWJlcihmbGFnW2ZsYWcubGVuZ3RoIC0gMV0pKSkge1xuICAgIGZsYWdzLmZvckVhY2goKHZhbCkgPT4gbm9ybWFsaXplZC5wdXNoKGAtJHt2YWx9YCkpO1xuICB9IGVsc2Uge1xuICAgIG5vcm1hbGl6ZWQucHVzaChgLSR7ZmxhZ3Muc2hpZnQoKX1gKTtcbiAgICBpZiAoZmxhZ3MubGVuZ3RoKSB7XG4gICAgICBub3JtYWxpemVkLnB1c2goZmxhZ3Muam9pbihcIlwiKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRmxhZ1ZhbHVlKFxuICBvcHRpb246IElGbGFnT3B0aW9ucyxcbiAgYXJnOiBJRmxhZ0FyZ3VtZW50LFxuICB2YWx1ZTogc3RyaW5nLFxuKTogdW5rbm93biB7XG4gIGNvbnN0IHR5cGU6IHN0cmluZyA9IGFyZy50eXBlIHx8IE9wdGlvblR5cGUuU1RSSU5HO1xuICBjb25zdCBwYXJzZVR5cGUgPSBUeXBlc1t0eXBlXTtcblxuICBpZiAoIXBhcnNlVHlwZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duVHlwZSh0eXBlLCBPYmplY3Qua2V5cyhUeXBlcykpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnNlVHlwZSh7XG4gICAgbGFiZWw6IFwiT3B0aW9uXCIsXG4gICAgdHlwZSxcbiAgICBuYW1lOiBgLS0ke29wdGlvbi5uYW1lfWAsXG4gICAgdmFsdWUsXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxlQUFlLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixRQUFRLENBQWE7QUFDOUUsTUFBTSxHQUNKLCtCQUErQixFQUMvQixlQUFlLEVBQ2YsYUFBYSxFQUNiLGtCQUFrQixFQUNsQixrQkFBa0IsRUFDbEIsdUNBQXVDLEVBQ3ZDLHdCQUF3QixFQUN4QixhQUFhLEVBQ2IscUJBQXFCLEVBQ3JCLFdBQVcsUUFDTixDQUFjO0FBUXJCLE1BQU0sR0FBRyxVQUFVLFFBQVEsQ0FBWTtBQUN2QyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQW9CO0FBQzVDLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBbUI7QUFDMUMsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFtQjtBQUMxQyxNQUFNLEdBQUcsYUFBYSxRQUFRLENBQXFCO0FBQ25ELE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBb0I7QUFFNUMsS0FBSyxDQUFDLEtBQUssR0FBMEMsQ0FBQztLQUNuRCxVQUFVLENBQUMsTUFBTSxHQUFHLE1BQU07S0FDMUIsVUFBVSxDQUFDLE1BQU0sR0FBRyxNQUFNO0tBQzFCLFVBQVUsQ0FBQyxPQUFPLEdBQUcsT0FBTztLQUM1QixVQUFVLENBQUMsT0FBTyxHQUFHLE9BQU87QUFDL0IsQ0FBQztBQUVELEVBd0JHLEFBeEJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkcsQUF4QkgsRUF3QkcsQ0FDSCxFQUFtQyxBQUFuQyxpQ0FBbUM7QUFDbkMsTUFBTSxVQUFVLFVBQVUsQ0FDeEIsSUFBYyxFQUNkLElBQW1CLEdBQUcsQ0FBQztBQUFBLENBQUMsRUFDUCxDQUFD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