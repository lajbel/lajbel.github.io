import { getDefaultValue, getOption, paramCaseToCamelCase } from "./_utils.ts";
import { ConflictingOption, DependingOption, MissingOptionValue, MissingRequiredOption, NoArguments, OptionNotCombinable, UnknownOption } from "./_errors.ts";
/**
 * Flags post validation. Validations that are not already done by the parser.
 *
 * @param flags         Available flag options.
 * @param values        Flag to validate.
 * @param _knownFlaks    Don't throw an error if a missing flag is defined in knownFlags (currently not implemented).
 * @param allowEmpty    Don't throw an error if values is empty.
 * @param optionNames   Mapped option names of negatable options.
 */ export function validateFlags(flags, values, _knownFlaks, allowEmpty, optionNames = {
}) {
    const defaultValues = {
    };
    // Set default value's
    for (const option of flags){
        let name;
        let defaultValue = undefined;
        // if --no-[flag] is present set --[flag] default value to true
        if (option.name.startsWith("no-")) {
            const propName = option.name.replace(/^no-/, "");
            if (propName in values) {
                continue;
            }
            const positiveOption = getOption(flags, propName);
            if (positiveOption) {
                continue;
            }
            name = paramCaseToCamelCase(propName);
            defaultValue = true;
        }
        if (!name) {
            name = paramCaseToCamelCase(option.name);
        }
        if (!(name in optionNames)) {
            optionNames[name] = option.name;
        }
        const hasDefaultValue = typeof values[name] === "undefined" && (typeof option.default !== "undefined" || typeof defaultValue !== "undefined");
        if (hasDefaultValue) {
            values[name] = getDefaultValue(option) ?? defaultValue;
            defaultValues[option.name] = true;
            if (typeof option.value === "function") {
                values[name] = option.value(values[name]);
            }
        }
    }
    const keys = Object.keys(values);
    if (keys.length === 0 && allowEmpty) {
        return;
    }
    const options = keys.map((name)=>({
            name,
            option: getOption(flags, optionNames[name])
        })
    );
    for (const { name , option: option1  } of options){
        if (!option1) {
            throw new UnknownOption(name, flags);
        }
        if (option1.standalone) {
            if (keys.length > 1) {
                // don't throw an error if all values are coming from the default option.
                if (options.every(({ option: opt  })=>opt && (option1 === opt || defaultValues[opt.name])
                )) {
                    return;
                }
                throw new OptionNotCombinable(option1.name);
            }
            return;
        }
        option1.conflicts?.forEach((flag)=>{
            if (isset(flag, values)) {
                throw new ConflictingOption(option1.name, flag);
            }
        });
        option1.depends?.forEach((flag)=>{
            // don't throw an error if the value is coming from the default option.
            if (!isset(flag, values) && !defaultValues[option1.name]) {
                throw new DependingOption(option1.name, flag);
            }
        });
        const isArray = (option1.args?.length || 0) > 1;
        option1.args?.forEach((arg, i)=>{
            if (arg.requiredValue && (typeof values[name] === "undefined" || isArray && typeof values[name][i] === "undefined")) {
                throw new MissingOptionValue(option1.name);
            }
        });
    }
    for (const option2 of flags){
        if (option2.required && !(paramCaseToCamelCase(option2.name) in values)) {
            if ((!option2.conflicts || !option2.conflicts.find((flag)=>!!values[flag]
            )) && !options.find((opt)=>opt.option?.conflicts?.find((flag)=>flag === option2.name
                )
            )) {
                throw new MissingRequiredOption(option2.name);
            }
        }
    }
    if (keys.length === 0 && !allowEmpty) {
        throw new NoArguments();
    }
}
/**
 * Check if value exists for flag.
 * @param flag    Flag name.
 * @param values  Parsed values.
 */ function isset(flag, values) {
    const name = paramCaseToCamelCase(flag);
    // return typeof values[ name ] !== 'undefined' && values[ name ] !== false;
    return typeof values[name] !== "undefined";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvZmxhZ3MvdmFsaWRhdGVfZmxhZ3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RGVmYXVsdFZhbHVlLCBnZXRPcHRpb24sIHBhcmFtQ2FzZVRvQ2FtZWxDYXNlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQge1xuICBDb25mbGljdGluZ09wdGlvbixcbiAgRGVwZW5kaW5nT3B0aW9uLFxuICBNaXNzaW5nT3B0aW9uVmFsdWUsXG4gIE1pc3NpbmdSZXF1aXJlZE9wdGlvbixcbiAgTm9Bcmd1bWVudHMsXG4gIE9wdGlvbk5vdENvbWJpbmFibGUsXG4gIFVua25vd25PcHRpb24sXG59IGZyb20gXCIuL19lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgSUZsYWdBcmd1bWVudCwgSUZsYWdPcHRpb25zIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLy8gQFRPRE86IGFkZCBzdXBwb3J0IGZvciBrbm93bkZsYWtzXG5cbi8qKiBGbGFnIG9wdGlvbiBtYXAuICovXG5pbnRlcmZhY2UgSUZsYWdPcHRpb25zTWFwIHtcbiAgbmFtZTogc3RyaW5nO1xuICBvcHRpb24/OiBJRmxhZ09wdGlvbnM7XG59XG5cbi8qKlxuICogRmxhZ3MgcG9zdCB2YWxpZGF0aW9uLiBWYWxpZGF0aW9ucyB0aGF0IGFyZSBub3QgYWxyZWFkeSBkb25lIGJ5IHRoZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIGZsYWdzICAgICAgICAgQXZhaWxhYmxlIGZsYWcgb3B0aW9ucy5cbiAqIEBwYXJhbSB2YWx1ZXMgICAgICAgIEZsYWcgdG8gdmFsaWRhdGUuXG4gKiBAcGFyYW0gX2tub3duRmxha3MgICAgRG9uJ3QgdGhyb3cgYW4gZXJyb3IgaWYgYSBtaXNzaW5nIGZsYWcgaXMgZGVmaW5lZCBpbiBrbm93bkZsYWdzIChjdXJyZW50bHkgbm90IGltcGxlbWVudGVkKS5cbiAqIEBwYXJhbSBhbGxvd0VtcHR5ICAgIERvbid0IHRocm93IGFuIGVycm9yIGlmIHZhbHVlcyBpcyBlbXB0eS5cbiAqIEBwYXJhbSBvcHRpb25OYW1lcyAgIE1hcHBlZCBvcHRpb24gbmFtZXMgb2YgbmVnYXRhYmxlIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUZsYWdzKFxuICBmbGFnczogSUZsYWdPcHRpb25zW10sXG4gIHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIF9rbm93bkZsYWtzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGFsbG93RW1wdHk/OiBib29sZWFuLFxuICBvcHRpb25OYW1lczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9LFxuKTogdm9pZCB7XG4gIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG5cbiAgLy8gU2V0IGRlZmF1bHQgdmFsdWUnc1xuICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBmbGFncykge1xuICAgIGxldCBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGRlZmF1bHRWYWx1ZTogdW5rbm93biA9IHVuZGVmaW5lZDtcblxuICAgIC8vIGlmIC0tbm8tW2ZsYWddIGlzIHByZXNlbnQgc2V0IC0tW2ZsYWddIGRlZmF1bHQgdmFsdWUgdG8gdHJ1ZVxuICAgIGlmIChvcHRpb24ubmFtZS5zdGFydHNXaXRoKFwibm8tXCIpKSB7XG4gICAgICBjb25zdCBwcm9wTmFtZSA9IG9wdGlvbi5uYW1lLnJlcGxhY2UoL15uby0vLCBcIlwiKTtcbiAgICAgIGlmIChwcm9wTmFtZSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwb3NpdGl2ZU9wdGlvbiA9IGdldE9wdGlvbihmbGFncywgcHJvcE5hbWUpO1xuICAgICAgaWYgKHBvc2l0aXZlT3B0aW9uKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHBhcmFtQ2FzZVRvQ2FtZWxDYXNlKHByb3BOYW1lKTtcbiAgICAgIGRlZmF1bHRWYWx1ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICBuYW1lID0gcGFyYW1DYXNlVG9DYW1lbENhc2Uob3B0aW9uLm5hbWUpO1xuICAgIH1cblxuICAgIGlmICghKG5hbWUgaW4gb3B0aW9uTmFtZXMpKSB7XG4gICAgICBvcHRpb25OYW1lc1tuYW1lXSA9IG9wdGlvbi5uYW1lO1xuICAgIH1cblxuICAgIGNvbnN0IGhhc0RlZmF1bHRWYWx1ZTogYm9vbGVhbiA9IHR5cGVvZiB2YWx1ZXNbbmFtZV0gPT09IFwidW5kZWZpbmVkXCIgJiYgKFxuICAgICAgdHlwZW9mIG9wdGlvbi5kZWZhdWx0ICE9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSBcInVuZGVmaW5lZFwiXG4gICAgKTtcblxuICAgIGlmIChoYXNEZWZhdWx0VmFsdWUpIHtcbiAgICAgIHZhbHVlc1tuYW1lXSA9IGdldERlZmF1bHRWYWx1ZShvcHRpb24pID8/IGRlZmF1bHRWYWx1ZTtcbiAgICAgIGRlZmF1bHRWYWx1ZXNbb3B0aW9uLm5hbWVdID0gdHJ1ZTtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uLnZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFsdWVzW25hbWVdID0gb3B0aW9uLnZhbHVlKHZhbHVlc1tuYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlcyk7XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmIGFsbG93RW1wdHkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBvcHRpb25zOiBJRmxhZ09wdGlvbnNNYXBbXSA9IGtleXMubWFwKChuYW1lKSA9PiAoe1xuICAgIG5hbWUsXG4gICAgb3B0aW9uOiBnZXRPcHRpb24oZmxhZ3MsIG9wdGlvbk5hbWVzW25hbWVdKSxcbiAgfSkpO1xuXG4gIGZvciAoY29uc3QgeyBuYW1lLCBvcHRpb24gfSBvZiBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBVbmtub3duT3B0aW9uKG5hbWUsIGZsYWdzKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9uLnN0YW5kYWxvbmUpIHtcbiAgICAgIGlmIChrZXlzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gZG9uJ3QgdGhyb3cgYW4gZXJyb3IgaWYgYWxsIHZhbHVlcyBhcmUgY29taW5nIGZyb20gdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgb3B0aW9ucy5ldmVyeSgoeyBvcHRpb246IG9wdCB9KSA9PlxuICAgICAgICAgICAgb3B0ICYmXG4gICAgICAgICAgICAob3B0aW9uID09PSBvcHQgfHwgZGVmYXVsdFZhbHVlc1tvcHQubmFtZV0pXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgT3B0aW9uTm90Q29tYmluYWJsZShvcHRpb24ubmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb3B0aW9uLmNvbmZsaWN0cz8uZm9yRWFjaCgoZmxhZzogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoaXNzZXQoZmxhZywgdmFsdWVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgQ29uZmxpY3RpbmdPcHRpb24ob3B0aW9uLm5hbWUsIGZsYWcpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgb3B0aW9uLmRlcGVuZHM/LmZvckVhY2goKGZsYWc6IHN0cmluZykgPT4ge1xuICAgICAgLy8gZG9uJ3QgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHZhbHVlIGlzIGNvbWluZyBmcm9tIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICAgIGlmICghaXNzZXQoZmxhZywgdmFsdWVzKSAmJiAhZGVmYXVsdFZhbHVlc1tvcHRpb24ubmFtZV0pIHtcbiAgICAgICAgdGhyb3cgbmV3IERlcGVuZGluZ09wdGlvbihvcHRpb24ubmFtZSwgZmxhZyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBpc0FycmF5ID0gKG9wdGlvbi5hcmdzPy5sZW5ndGggfHwgMCkgPiAxO1xuXG4gICAgb3B0aW9uLmFyZ3M/LmZvckVhY2goKGFyZzogSUZsYWdBcmd1bWVudCwgaTogbnVtYmVyKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgIGFyZy5yZXF1aXJlZFZhbHVlICYmXG4gICAgICAgIChcbiAgICAgICAgICB0eXBlb2YgdmFsdWVzW25hbWVdID09PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgICAgKGlzQXJyYXkgJiZcbiAgICAgICAgICAgIHR5cGVvZiAodmFsdWVzW25hbWVdIGFzIEFycmF5PHVua25vd24+KVtpXSA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBNaXNzaW5nT3B0aW9uVmFsdWUob3B0aW9uLm5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBvcHRpb24gb2YgZmxhZ3MpIHtcbiAgICBpZiAob3B0aW9uLnJlcXVpcmVkICYmICEocGFyYW1DYXNlVG9DYW1lbENhc2Uob3B0aW9uLm5hbWUpIGluIHZhbHVlcykpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKFxuICAgICAgICAgICFvcHRpb24uY29uZmxpY3RzIHx8XG4gICAgICAgICAgIW9wdGlvbi5jb25mbGljdHMuZmluZCgoZmxhZzogc3RyaW5nKSA9PiAhIXZhbHVlc1tmbGFnXSlcbiAgICAgICAgKSAmJlxuICAgICAgICAhb3B0aW9ucy5maW5kKChvcHQpID0+XG4gICAgICAgICAgb3B0Lm9wdGlvbj8uY29uZmxpY3RzPy5maW5kKChmbGFnOiBzdHJpbmcpID0+IGZsYWcgPT09IG9wdGlvbi5uYW1lKVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdSZXF1aXJlZE9wdGlvbihvcHRpb24ubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICFhbGxvd0VtcHR5KSB7XG4gICAgdGhyb3cgbmV3IE5vQXJndW1lbnRzKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB2YWx1ZSBleGlzdHMgZm9yIGZsYWcuXG4gKiBAcGFyYW0gZmxhZyAgICBGbGFnIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWVzICBQYXJzZWQgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBpc3NldChmbGFnOiBzdHJpbmcsIHZhbHVlczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBib29sZWFuIHtcbiAgY29uc3QgbmFtZSA9IHBhcmFtQ2FzZVRvQ2FtZWxDYXNlKGZsYWcpO1xuICAvLyByZXR1cm4gdHlwZW9mIHZhbHVlc1sgbmFtZSBdICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZXNbIG5hbWUgXSAhPT0gZmFsc2U7XG4gIHJldHVybiB0eXBlb2YgdmFsdWVzW25hbWVdICE9PSBcInVuZGVmaW5lZFwiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxlQUFlLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixRQUFRLENBQWE7QUFDOUUsTUFBTSxHQUNKLGlCQUFpQixFQUNqQixlQUFlLEVBQ2Ysa0JBQWtCLEVBQ2xCLHFCQUFxQixFQUNyQixXQUFXLEVBQ1gsbUJBQW1CLEVBQ25CLGFBQWEsUUFDUixDQUFjO0FBV3JCLEVBUUcsQUFSSDs7Ozs7Ozs7Q0FRRyxBQVJILEVBUUcsQ0FDSCxNQUFNLFVBQVUsYUFBYSxDQUMzQixLQUFxQixFQUNyQixNQUErQixFQUMvQixXQUFxQyxFQUNyQyxVQUFvQixFQUNwQixXQUFtQyxHQUFHLENBQUM7QUFBQSxDQUFDLEVBQ2xDLENBQUM7SUFDUCxLQUFLLENBQUMsYUFBYSxHQUE0QixDQUFDO0lBQUEsQ0FBQztJQUVqRCxFQUFzQixBQUF0QixvQkFBc0I7SUFDdEIs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