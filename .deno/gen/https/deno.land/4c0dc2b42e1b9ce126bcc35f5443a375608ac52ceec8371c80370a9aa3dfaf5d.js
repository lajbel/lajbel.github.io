import { getFlag } from "../../flags/_utils.ts";
import { Table } from "../../table/table.ts";
import { parseArgumentsDefinition } from "../_utils.ts";
import { blue, bold, dim, getColorEnabled, green, italic, magenta, red, setColorEnabled, yellow } from "../deps.ts";
import { Type } from "../type.ts";
/** Help text generator. */ export class HelpGenerator {
    cmd;
    indent = 2;
    options;
    /** Generate help text for given command. */ static generate(cmd, options) {
        return new HelpGenerator(cmd, options).generate();
    }
    constructor(cmd, options = {
    }){
        this.cmd = cmd;
        this.options = {
            types: false,
            hints: true,
            colors: true,
            ...options
        };
    }
    generate() {
        const areColorsEnabled = getColorEnabled();
        setColorEnabled(this.options.colors);
        const result = this.generateHeader() + this.generateDescription() + this.generateOptions() + this.generateCommands() + this.generateEnvironmentVariables() + this.generateExamples() + "\n";
        setColorEnabled(areColorsEnabled);
        return result;
    }
    generateHeader() {
        const rows = [
            [
                bold("Usage:"),
                magenta(`${this.cmd.getPath()}${this.cmd.getArgsDefinition() ? " " + this.cmd.getArgsDefinition() : ""}`), 
            ], 
        ];
        const version = this.cmd.getVersion();
        if (version) {
            rows.push([
                bold("Version:"),
                yellow(`${this.cmd.getVersion()}`)
            ]);
        }
        return "\n" + Table.from(rows).indent(this.indent).padding(1).toString() + "\n";
    }
    generateDescription() {
        if (!this.cmd.getDescription()) {
            return "";
        }
        return this.label("Description") + Table.from([
            [
                this.cmd.getDescription()
            ], 
        ]).indent(this.indent * 2).maxColWidth(140).padding(1).toString() + "\n";
    }
    generateOptions() {
        const options = this.cmd.getOptions(false);
        if (!options.length) {
            return "";
        }
        const hasTypeDefinitions = !!options.find((option)=>!!option.typeDefinition
        );
        if (hasTypeDefinitions) {
            return this.label("Options") + Table.from([
                ...options.map((option)=>[
                        option.flags.map((flag)=>blue(flag)
                        ).join(", "),
                        highlightArguments(option.typeDefinition || "", this.options.types),
                        red(bold("-")) + " " + option.description.split("\n").shift(),
                        this.generateHints(option), 
                    ]
                ), 
            ]).padding([
                2,
                2,
                2
            ]).indent(this.indent * 2).maxColWidth([
                60,
                60,
                80,
                60
            ]).toString() + "\n";
        }
        return this.label("Options") + Table.from([
            ...options.map((option)=>[
                    option.flags.map((flag)=>blue(flag)
                    ).join(", "),
                    red(bold("-")) + " " + option.description.split("\n").shift(),
                    this.generateHints(option), 
                ]
            ), 
        ]).padding([
            2,
            2
        ]).indent(this.indent * 2).maxColWidth([
            60,
            80,
            60
        ]).toString() + "\n";
    }
    generateCommands() {
        const commands = this.cmd.getCommands(false);
        if (!commands.length) {
            return "";
        }
        const hasTypeDefinitions = !!commands.find((command)=>!!command.getArgsDefinition()
        );
        if (hasTypeDefinitions) {
            return this.label("Commands") + Table.from([
                ...commands.map((command)=>[
                        [
                            command.getName(),
                            ...command.getAliases()
                        ].map((name)=>blue(name)
                        ).join(", "),
                        highlightArguments(command.getArgsDefinition() || "", this.options.types),
                        red(bold("-")) + " " + command.getDescription().split("\n").shift(), 
                    ]
                ), 
            ]).padding([
                2,
                2,
                2
            ]).indent(this.indent * 2).toString() + "\n";
        }
        return this.label("Commands") + Table.from([
            ...commands.map((command)=>[
                    [
                        command.getName(),
                        ...command.getAliases()
                    ].map((name)=>blue(name)
                    ).join(", "),
                    red(bold("-")) + " " + command.getDescription().split("\n").shift(), 
                ]
            ), 
        ]).padding([
            2,
            2
        ]).indent(this.indent * 2).toString() + "\n";
    }
    generateEnvironmentVariables() {
        const envVars = this.cmd.getEnvVars(false);
        if (!envVars.length) {
            return "";
        }
        return this.label("Environment variables") + Table.from([
            ...envVars.map((envVar)=>[
                    envVar.names.map((name)=>blue(name)
                    ).join(", "),
                    highlightArgumentDetails(envVar.details, this.options.types),
                    `${red(bold("-"))} ${envVar.description}`, 
                ]
            ), 
        ]).padding(2).indent(this.indent * 2).toString() + "\n";
    }
    generateExamples() {
        const examples = this.cmd.getExamples();
        if (!examples.length) {
            return "";
        }
        return this.label("Examples") + Table.from(examples.map((example)=>[
                dim(bold(`${capitalize(example.name)}:`)),
                example.description, 
            ]
        )).padding(1).indent(this.indent * 2).maxColWidth(150).toString() + "\n";
    }
    generateHints(option) {
        if (!this.options.hints) {
            return "";
        }
        const hints = [];
        option.required && hints.push(yellow(`required`));
        typeof option.default !== "undefined" && hints.push(bold(`Default: `) + inspect(option.default, this.options.colors));
        option.depends?.length && hints.push(yellow(bold(`Depends: `)) + italic(option.depends.map(getFlag).join(", ")));
        option.conflicts?.length && hints.push(red(bold(`Conflicts: `)) + italic(option.conflicts.map(getFlag).join(", ")));
        const type = this.cmd.getType(option.args[0]?.type)?.handler;
        if (type instanceof Type) {
            const possibleValues = type.values?.(this.cmd, this.cmd.getParent());
            if (possibleValues?.length) {
                hints.push(bold(`Values: `) + possibleValues.map((value)=>inspect(value, this.options.colors)
                ).join(", "));
            }
        }
        if (hints.length) {
            return `(${hints.join(", ")})`;
        }
        return "";
    }
    label(label) {
        return "\n" + " ".repeat(this.indent) + bold(`${label}:`) + "\n\n";
    }
}
function capitalize(string) {
    return (string?.charAt(0).toUpperCase() + string.slice(1)) ?? "";
}
function inspect(value, colors) {
    return Deno.inspect(value, // deno < 1.4.3 doesn't support the colors property.
    {
        depth: 1,
        colors,
        trailingComma: false
    });
}
/**
 * Colorize arguments string.
 * @param argsDefinition Arguments definition: `<color1:string> <color2:string>`
 * @param types Show types.
 */ function highlightArguments(argsDefinition, types = true) {
    if (!argsDefinition) {
        return "";
    }
    return parseArgumentsDefinition(argsDefinition).map((arg)=>highlightArgumentDetails(arg, types)
    ).join(" ");
}
/**
 * Colorize argument string.
 * @param arg Argument details.
 * @param types Show types.
 */ function highlightArgumentDetails(arg, types = true) {
    let str = "";
    str += yellow(arg.optionalValue ? "[" : "<");
    let name = "";
    name += arg.name;
    if (arg.variadic) {
        name += "...";
    }
    name = magenta(name);
    str += name;
    if (types) {
        str += yellow(":");
        str += red(arg.type);
    }
    if (arg.list) {
        str += green("[]");
    }
    str += yellow(arg.optionalValue ? "]" : ">");
    return str;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9oZWxwL19oZWxwX2dlbmVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRGbGFnIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL191dGlscy50c1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vLi4vdGFibGUvdGFibGUudHNcIjtcbmltcG9ydCB7IHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbiB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kLnRzXCI7XG5pbXBvcnQge1xuICBibHVlLFxuICBib2xkLFxuICBkaW0sXG4gIGdldENvbG9yRW5hYmxlZCxcbiAgZ3JlZW4sXG4gIGl0YWxpYyxcbiAgbWFnZW50YSxcbiAgcmVkLFxuICBzZXRDb2xvckVuYWJsZWQsXG4gIHllbGxvdyxcbn0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB0eXBlIHsgSUFyZ3VtZW50IH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IElFbnZWYXIsIElFeGFtcGxlLCBJT3B0aW9uIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBIZWxwT3B0aW9ucyB7XG4gIHR5cGVzPzogYm9vbGVhbjtcbiAgaGludHM/OiBib29sZWFuO1xuICBjb2xvcnM/OiBib29sZWFuO1xufVxuXG4vKiogSGVscCB0ZXh0IGdlbmVyYXRvci4gKi9cbmV4cG9ydCBjbGFzcyBIZWxwR2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSBpbmRlbnQgPSAyO1xuICBwcml2YXRlIG9wdGlvbnM6IFJlcXVpcmVkPEhlbHBPcHRpb25zPjtcblxuICAvKiogR2VuZXJhdGUgaGVscCB0ZXh0IGZvciBnaXZlbiBjb21tYW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIGdlbmVyYXRlKGNtZDogQ29tbWFuZCwgb3B0aW9ucz86IEhlbHBPcHRpb25zKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IEhlbHBHZW5lcmF0b3IoY21kLCBvcHRpb25zKS5nZW5lcmF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcihwcml2YXRlIGNtZDogQ29tbWFuZCwgb3B0aW9uczogSGVscE9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIHR5cGVzOiBmYWxzZSxcbiAgICAgIGhpbnRzOiB0cnVlLFxuICAgICAgY29sb3JzOiB0cnVlLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFyZUNvbG9yc0VuYWJsZWQgPSBnZXRDb2xvckVuYWJsZWQoKTtcbiAgICBzZXRDb2xvckVuYWJsZWQodGhpcy5vcHRpb25zLmNvbG9ycyk7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5nZW5lcmF0ZUhlYWRlcigpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVEZXNjcmlwdGlvbigpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVPcHRpb25zKCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUNvbW1hbmRzKCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUVudmlyb25tZW50VmFyaWFibGVzKCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUV4YW1wbGVzKCkgK1xuICAgICAgXCJcXG5cIjtcbiAgICBzZXRDb2xvckVuYWJsZWQoYXJlQ29sb3JzRW5hYmxlZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVIZWFkZXIoKTogc3RyaW5nIHtcbiAgICBjb25zdCByb3dzID0gW1xuICAgICAgW1xuICAgICAgICBib2xkKFwiVXNhZ2U6XCIpLFxuICAgICAgICBtYWdlbnRhKFxuICAgICAgICAgIGAke3RoaXMuY21kLmdldFBhdGgoKX0ke1xuICAgICAgICAgICAgdGhpcy5jbWQuZ2V0QXJnc0RlZmluaXRpb24oKVxuICAgICAgICAgICAgICA/IFwiIFwiICsgdGhpcy5jbWQuZ2V0QXJnc0RlZmluaXRpb24oKVxuICAgICAgICAgICAgICA6IFwiXCJcbiAgICAgICAgICB9YCxcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgXTtcbiAgICBjb25zdCB2ZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB0aGlzLmNtZC5nZXRWZXJzaW9uKCk7XG4gICAgaWYgKHZlcnNpb24pIHtcbiAgICAgIHJvd3MucHVzaChbYm9sZChcIlZlcnNpb246XCIpLCB5ZWxsb3coYCR7dGhpcy5jbWQuZ2V0VmVyc2lvbigpfWApXSk7XG4gICAgfVxuICAgIHJldHVybiBcIlxcblwiICtcbiAgICAgIFRhYmxlLmZyb20ocm93cylcbiAgICAgICAgLmluZGVudCh0aGlzLmluZGVudClcbiAgICAgICAgLnBhZGRpbmcoMSlcbiAgICAgICAgLnRvU3RyaW5nKCkgK1xuICAgICAgXCJcXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVEZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5jbWQuZ2V0RGVzY3JpcHRpb24oKSkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmxhYmVsKFwiRGVzY3JpcHRpb25cIikgK1xuICAgICAgVGFibGUuZnJvbShbXG4gICAgICAgIFt0aGlzLmNtZC5nZXREZXNjcmlwdGlvbigpXSxcbiAgICAgIF0pXG4gICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAubWF4Q29sV2lkdGgoMTQwKVxuICAgICAgICAucGFkZGluZygxKVxuICAgICAgICAudG9TdHJpbmcoKSArXG4gICAgICBcIlxcblwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU9wdGlvbnMoKTogc3RyaW5nIHtcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5jbWQuZ2V0T3B0aW9ucyhmYWxzZSk7XG4gICAgaWYgKCFvcHRpb25zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgY29uc3QgaGFzVHlwZURlZmluaXRpb25zID0gISFvcHRpb25zLmZpbmQoKG9wdGlvbikgPT5cbiAgICAgICEhb3B0aW9uLnR5cGVEZWZpbml0aW9uXG4gICAgKTtcblxuICAgIGlmIChoYXNUeXBlRGVmaW5pdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLmxhYmVsKFwiT3B0aW9uc1wiKSArXG4gICAgICAgIFRhYmxlLmZyb20oW1xuICAgICAgICAgIC4uLm9wdGlvbnMubWFwKChvcHRpb246IElPcHRpb24pID0+IFtcbiAgICAgICAgICAgIG9wdGlvbi5mbGFncy5tYXAoKGZsYWcpID0+IGJsdWUoZmxhZykpLmpvaW4oXCIsIFwiKSxcbiAgICAgICAgICAgIGhpZ2hsaWdodEFyZ3VtZW50cyhcbiAgICAgICAgICAgICAgb3B0aW9uLnR5cGVEZWZpbml0aW9uIHx8IFwiXCIsXG4gICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50eXBlcyxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICByZWQoYm9sZChcIi1cIikpICsgXCIgXCIgK1xuICAgICAgICAgICAgb3B0aW9uLmRlc2NyaXB0aW9uLnNwbGl0KFwiXFxuXCIpLnNoaWZ0KCkgYXMgc3RyaW5nLFxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUhpbnRzKG9wdGlvbiksXG4gICAgICAgICAgXSksXG4gICAgICAgIF0pXG4gICAgICAgICAgLnBhZGRpbmcoWzIsIDIsIDJdKVxuICAgICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAgIC5tYXhDb2xXaWR0aChbNjAsIDYwLCA4MCwgNjBdKVxuICAgICAgICAgIC50b1N0cmluZygpICtcbiAgICAgICAgXCJcXG5cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5sYWJlbChcIk9wdGlvbnNcIikgK1xuICAgICAgVGFibGUuZnJvbShbXG4gICAgICAgIC4uLm9wdGlvbnMubWFwKChvcHRpb246IElPcHRpb24pID0+IFtcbiAgICAgICAgICBvcHRpb24uZmxhZ3MubWFwKChmbGFnKSA9PiBibHVlKGZsYWcpKS5qb2luKFwiLCBcIiksXG4gICAgICAgICAgcmVkKGJvbGQoXCItXCIpKSArIFwiIFwiICtcbiAgICAgICAgICBvcHRpb24uZGVzY3JpcHRpb24uc3BsaXQoXCJcXG5cIikuc2hpZnQoKSBhcyBzdHJpbmcsXG4gICAgICAgICAgdGhpcy5nZW5lcmF0ZUhpbnRzKG9wdGlvbiksXG4gICAgICAgIF0pLFxuICAgICAgXSlcbiAgICAgICAgLnBhZGRpbmcoWzIsIDJdKVxuICAgICAgICAuaW5kZW50KHRoaXMuaW5kZW50ICogMilcbiAgICAgICAgLm1heENvbFdpZHRoKFs2MCwgODAsIDYwXSlcbiAgICAgICAgLnRvU3RyaW5nKCkgK1xuICAgICAgXCJcXG5cIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21tYW5kcygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gdGhpcy5jbWQuZ2V0Q29tbWFuZHMoZmFsc2UpO1xuICAgIGlmICghY29tbWFuZHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNUeXBlRGVmaW5pdGlvbnMgPSAhIWNvbW1hbmRzLmZpbmQoKGNvbW1hbmQpID0+XG4gICAgICAhIWNvbW1hbmQuZ2V0QXJnc0RlZmluaXRpb24oKVxuICAgICk7XG5cbiAgICBpZiAoaGFzVHlwZURlZmluaXRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5sYWJlbChcIkNvbW1hbmRzXCIpICtcbiAgICAgICAgVGFibGUuZnJvbShbXG4gICAgICAgICAgLi4uY29tbWFuZHMubWFwKChjb21tYW5kOiBDb21tYW5kKSA9PiBbXG4gICAgICAgICAgICBbY29tbWFuZC5nZXROYW1lKCksIC4uLmNvbW1hbmQuZ2V0QWxpYXNlcygpXS5tYXAoKG5hbWUpID0+XG4gICAgICAgICAgICAgIGJsdWUobmFtZSlcbiAgICAgICAgICAgICkuam9pbihcIiwgXCIpLFxuICAgICAgICAgICAgaGlnaGxpZ2h0QXJndW1lbnRzKFxuICAgICAgICAgICAgICBjb21tYW5kLmdldEFyZ3NEZWZpbml0aW9uKCkgfHwgXCJcIixcbiAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnR5cGVzLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHJlZChib2xkKFwiLVwiKSkgKyBcIiBcIiArXG4gICAgICAgICAgICBjb21tYW5kLmdldERlc2NyaXB0aW9uKCkuc3BsaXQoXCJcXG5cIikuc2hpZnQoKSBhcyBzdHJpbmcsXG4gICAgICAgICAgXSksXG4gICAgICAgIF0pXG4gICAgICAgICAgLnBhZGRpbmcoWzIsIDIsIDJdKVxuICAgICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAgIC50b1N0cmluZygpICtcbiAgICAgICAgXCJcXG5cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5sYWJlbChcIkNvbW1hbmRzXCIpICtcbiAgICAgIFRhYmxlLmZyb20oW1xuICAgICAgICAuLi5jb21tYW5kcy5tYXAoKGNvbW1hbmQ6IENvbW1hbmQpID0+IFtcbiAgICAgICAgICBbY29tbWFuZC5nZXROYW1lKCksIC4uLmNvbW1hbmQuZ2V0QWxpYXNlcygpXS5tYXAoKG5hbWUpID0+IGJsdWUobmFtZSkpXG4gICAgICAgICAgICAuam9pbihcIiwgXCIpLFxuICAgICAgICAgIHJlZChib2xkKFwiLVwiKSkgKyBcIiBcIiArXG4gICAgICAgICAgY29tbWFuZC5nZXREZXNjcmlwdGlvbigpLnNwbGl0KFwiXFxuXCIpLnNoaWZ0KCkgYXMgc3RyaW5nLFxuICAgICAgICBdKSxcbiAgICAgIF0pXG4gICAgICAgIC5wYWRkaW5nKFsyLCAyXSlcbiAgICAgICAgLmluZGVudCh0aGlzLmluZGVudCAqIDIpXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlRW52aXJvbm1lbnRWYXJpYWJsZXMoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlbnZWYXJzID0gdGhpcy5jbWQuZ2V0RW52VmFycyhmYWxzZSk7XG4gICAgaWYgKCFlbnZWYXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmxhYmVsKFwiRW52aXJvbm1lbnQgdmFyaWFibGVzXCIpICtcbiAgICAgIFRhYmxlLmZyb20oW1xuICAgICAgICAuLi5lbnZWYXJzLm1hcCgoZW52VmFyOiBJRW52VmFyKSA9PiBbXG4gICAgICAgICAgZW52VmFyLm5hbWVzLm1hcCgobmFtZTogc3RyaW5nKSA9PiBibHVlKG5hbWUpKS5qb2luKFwiLCBcIiksXG4gICAgICAgICAgaGlnaGxpZ2h0QXJndW1lbnREZXRhaWxzKFxuICAgICAgICAgICAgZW52VmFyLmRldGFpbHMsXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHlwZXMsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBgJHtyZWQoYm9sZChcIi1cIikpfSAke2VudlZhci5kZXNjcmlwdGlvbn1gLFxuICAgICAgICBdKSxcbiAgICAgIF0pXG4gICAgICAgIC5wYWRkaW5nKDIpXG4gICAgICAgIC5pbmRlbnQodGhpcy5pbmRlbnQgKiAyKVxuICAgICAgICAudG9TdHJpbmcoKSArXG4gICAgICBcIlxcblwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUV4YW1wbGVzKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZXhhbXBsZXMgPSB0aGlzLmNtZC5nZXRFeGFtcGxlcygpO1xuICAgIGlmICghZXhhbXBsZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubGFiZWwoXCJFeGFtcGxlc1wiKSArXG4gICAgICBUYWJsZS5mcm9tKGV4YW1wbGVzLm1hcCgoZXhhbXBsZTogSUV4YW1wbGUpID0+IFtcbiAgICAgICAgZGltKGJvbGQoYCR7Y2FwaXRhbGl6ZShleGFtcGxlLm5hbWUpfTpgKSksXG4gICAgICAgIGV4YW1wbGUuZGVzY3JpcHRpb24sXG4gICAgICBdKSlcbiAgICAgICAgLnBhZGRpbmcoMSlcbiAgICAgICAgLmluZGVudCh0aGlzLmluZGVudCAqIDIpXG4gICAgICAgIC5tYXhDb2xXaWR0aCgxNTApXG4gICAgICAgIC50b1N0cmluZygpICtcbiAgICAgIFwiXFxuXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSGludHMob3B0aW9uOiBJT3B0aW9uKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5oaW50cykge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGNvbnN0IGhpbnRzID0gW107XG5cbiAgICBvcHRpb24ucmVxdWlyZWQgJiYgaGludHMucHVzaCh5ZWxsb3coYHJlcXVpcmVkYCkpO1xuICAgIHR5cGVvZiBvcHRpb24uZGVmYXVsdCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBoaW50cy5wdXNoKFxuICAgICAgYm9sZChgRGVmYXVsdDogYCkgKyBpbnNwZWN0KG9wdGlvbi5kZWZhdWx0LCB0aGlzLm9wdGlvbnMuY29sb3JzKSxcbiAgICApO1xuICAgIG9wdGlvbi5kZXBlbmRzPy5sZW5ndGggJiYgaGludHMucHVzaChcbiAgICAgIHllbGxvdyhib2xkKGBEZXBlbmRzOiBgKSkgK1xuICAgICAgICBpdGFsaWMob3B0aW9uLmRlcGVuZHMubWFwKGdldEZsYWcpLmpvaW4oXCIsIFwiKSksXG4gICAgKTtcbiAgICBvcHRpb24uY29uZmxpY3RzPy5sZW5ndGggJiYgaGludHMucHVzaChcbiAgICAgIHJlZChib2xkKGBDb25mbGljdHM6IGApKSArXG4gICAgICAgIGl0YWxpYyhvcHRpb24uY29uZmxpY3RzLm1hcChnZXRGbGFnKS5qb2luKFwiLCBcIikpLFxuICAgICk7XG5cbiAgICBjb25zdCB0eXBlID0gdGhpcy5jbWQuZ2V0VHlwZShvcHRpb24uYXJnc1swXT8udHlwZSk/LmhhbmRsZXI7XG4gICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICBjb25zdCBwb3NzaWJsZVZhbHVlcyA9IHR5cGUudmFsdWVzPy4odGhpcy5jbWQsIHRoaXMuY21kLmdldFBhcmVudCgpKTtcbiAgICAgIGlmIChwb3NzaWJsZVZhbHVlcz8ubGVuZ3RoKSB7XG4gICAgICAgIGhpbnRzLnB1c2goXG4gICAgICAgICAgYm9sZChgVmFsdWVzOiBgKSArXG4gICAgICAgICAgICBwb3NzaWJsZVZhbHVlcy5tYXAoKHZhbHVlOiB1bmtub3duKSA9PlxuICAgICAgICAgICAgICBpbnNwZWN0KHZhbHVlLCB0aGlzLm9wdGlvbnMuY29sb3JzKVxuICAgICAgICAgICAgKS5qb2luKFwiLCBcIiksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhpbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGAoJHtoaW50cy5qb2luKFwiLCBcIil9KWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBwcml2YXRlIGxhYmVsKGxhYmVsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gXCJcXG5cIiArXG4gICAgICBcIiBcIi5yZXBlYXQodGhpcy5pbmRlbnQpICsgYm9sZChgJHtsYWJlbH06YCkgK1xuICAgICAgXCJcXG5cXG5cIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZz8uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSkgPz8gXCJcIjtcbn1cblxuZnVuY3Rpb24gaW5zcGVjdCh2YWx1ZTogdW5rbm93biwgY29sb3JzOiBib29sZWFuKTogc3RyaW5nIHtcbiAgcmV0dXJuIERlbm8uaW5zcGVjdChcbiAgICB2YWx1ZSxcbiAgICAvLyBkZW5vIDwgMS40LjMgZG9lc24ndCBzdXBwb3J0IHRoZSBjb2xvcnMgcHJvcGVydHkuXG4gICAgeyBkZXB0aDogMSwgY29sb3JzLCB0cmFpbGluZ0NvbW1hOiBmYWxzZSB9IGFzIERlbm8uSW5zcGVjdE9wdGlvbnMsXG4gICk7XG59XG5cbi8qKlxuICogQ29sb3JpemUgYXJndW1lbnRzIHN0cmluZy5cbiAqIEBwYXJhbSBhcmdzRGVmaW5pdGlvbiBBcmd1bWVudHMgZGVmaW5pdGlvbjogYDxjb2xvcjE6c3RyaW5nPiA8Y29sb3IyOnN0cmluZz5gXG4gKiBAcGFyYW0gdHlwZXMgU2hvdyB0eXBlcy5cbiAqL1xuZnVuY3Rpb24gaGlnaGxpZ2h0QXJndW1lbnRzKGFyZ3NEZWZpbml0aW9uOiBzdHJpbmcsIHR5cGVzID0gdHJ1ZSkge1xuICBpZiAoIWFyZ3NEZWZpbml0aW9uKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICByZXR1cm4gcGFyc2VBcmd1bWVudHNEZWZpbml0aW9uKGFyZ3NEZWZpbml0aW9uKVxuICAgIC5tYXAoKGFyZzogSUFyZ3VtZW50KSA9PiBoaWdobGlnaHRBcmd1bWVudERldGFpbHMoYXJnLCB0eXBlcykpLmpvaW4oXCIgXCIpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGFyZ3VtZW50IHN0cmluZy5cbiAqIEBwYXJhbSBhcmcgQXJndW1lbnQgZGV0YWlscy5cbiAqIEBwYXJhbSB0eXBlcyBTaG93IHR5cGVzLlxuICovXG5mdW5jdGlvbiBoaWdobGlnaHRBcmd1bWVudERldGFpbHMoXG4gIGFyZzogSUFyZ3VtZW50LFxuICB0eXBlcyA9IHRydWUsXG4pOiBzdHJpbmcge1xuICBsZXQgc3RyID0gXCJcIjtcblxuICBzdHIgKz0geWVsbG93KGFyZy5vcHRpb25hbFZhbHVlID8gXCJbXCIgOiBcIjxcIik7XG5cbiAgbGV0IG5hbWUgPSBcIlwiO1xuICBuYW1lICs9IGFyZy5uYW1lO1xuICBpZiAoYXJnLnZhcmlhZGljKSB7XG4gICAgbmFtZSArPSBcIi4uLlwiO1xuICB9XG4gIG5hbWUgPSBtYWdlbnRhKG5hbWUpO1xuXG4gIHN0ciArPSBuYW1lO1xuXG4gIGlmICh0eXBlcykge1xuICAgIHN0ciArPSB5ZWxsb3coXCI6XCIpO1xuICAgIHN0ciArPSByZWQoYXJnLnR5cGUpO1xuICB9XG5cbiAgaWYgKGFyZy5saXN0KSB7XG4gICAgc3RyICs9IGdyZWVuKFwiW11cIik7XG4gIH1cblxuICBzdHIgKz0geWVsbG93KGFyZy5vcHRpb25hbFZhbHVlID8gXCJdXCIgOiBcIj5cIik7XG5cbiAgcmV0dXJuIHN0cjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQXVCO0FBQy9DLE1BQU0sR0FBRyxLQUFLLFFBQVEsQ0FBc0I7QUFDNUMsTUFBTSxHQUFHLHdCQUF3QixRQUFRLENBQWM7QUFFdkQsTUFBTSxHQUNKLElBQUksRUFDSixJQUFJLEVBQ0osR0FBRyxFQUNILGVBQWUsRUFDZixLQUFLLEVBQ0wsTUFBTSxFQUNOLE9BQU8sRUFDUCxHQUFHLEVBQ0gsZUFBZSxFQUNmLE1BQU0sUUFDRCxDQUFZO0FBR25CLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBWTtBQVFqQyxFQUEyQixBQUEzQix1QkFBMkIsQUFBM0IsRUFBMkIsQ0FDM0IsTUFBTSxPQUFPLGFBQWE7SUFTSSxHQUFZO0lBUmhDLE1BQU0sR0FBRyxDQUFDO0lBQ1YsT0FBTztJQUVmLEVBQTRDLEFBQTVDLHdDQUE0QyxBQUE1QyxFQUE0QyxRQUM5QixRQUFRLENBQUMsR0FBWSxFQUFFLE9BQXFCLEVBQVUsQ0FBQztRQUNuRSxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVE7SUFDakQsQ0FBQztnQkFFMkIsR0FBWSxFQUFFLE9BQW9CLEdBQUcsQ0FBQztJQUFBLENBQUMsQ0FBRSxDQUFDO2FBQTFDLEdBQVksR0FBWixHQUFZO1FBQ3RDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUNkLEtBQUssRUFBRSxLQUFLO1lBQ1osS0FBSyxFQUFFLElBQUk7WUFDWCxNQUFNLEVBQUUsSUFBSTtlQUNULE9BQU87UUFDWixDQUFDO0lBQ0gsQ0FBQztJQUVPLFFBQVEsR0FBVyxDQUFDO1FBQzFCLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlO1FBQ3hDLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07UUFDbkMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxLQUNoQyxJQUFJLENBQUMsbUJBQW1CLEtBQ3hCLElBQUksQ0FBQyxlQUFlLEtBQ3BCLElBQUksQ0FBQyxnQkFBZ0IsS0FDckIsSUFBSSxDQUFDLDRCQUE0QixLQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEtBQ3JCLENBQUk7UUFDTixlQUFlLENBQUMsZ0JBQWdCO1FBQ2hDLE1BQU0sQ0FBQyxNQUFNO0lBQ2YsQ0FBQztJQUVPLGNBQWMsR0FBVyxDQUFDO1FBQ2hDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQztZQUNaLENBQUM7Z0JBQ0MsSUFBSSxDQUFDLENBQVE7Z0JBQ2IsT0FBTyxJQUNGLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxLQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixLQUN0QixDQUFHLEtBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsS0FDaEMsQ0FBRTtZQUdaLENBQUM7UUFDSCxDQUFDO1FBQ0QsS0FBSyxDQUFDLE9BQU8sR0FBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1FBQ3ZELEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFBQSxJQUFJLENBQUMsQ0FBVTtnQkFBRyxNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQUssQ0FBQztRQUNsRSxDQUFDO1FBQ0QsTUFBTSxDQUFDLENBQUksTUFDVCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFDbEIsT0FBTyxDQUFDLENBQUMsRUFDVCxRQUFRLEtBQ1gsQ0FBSTtJQUNSLENBQUM7SUFFTyxtQkFBbUIsR0FBVyxDQUFDO1FBQ3JDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxDQUFFO1FBQ1gsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQWEsZ0JBQzdCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNWLENBQUM7Z0JBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjO1lBQUUsQ0FBQztRQUM3QixDQUFDLEVBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN0QixXQUFXLENBQUMsR0FBRyxFQUNmLE9BQU8sQ0FBQyxDQUFDLEVBQ1QsUUFBUSxLQUNYLENBQUk7SUFDUixDQUFDO0lBRU8sZUFBZSxHQUFXLENBQUM7UUFDakMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLO1FBQ3pDLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsTUFBTSxDQUFDLENBQUU7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixLQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxLQUM3QyxNQUFNLENBQUMsY0FBYzs7UUFHekIsRUFBRSxFQUFFLGtCQUFrQixFQUFFLENBQUM7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBUyxZQUN6QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7bUJBQ1AsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFlLEdBQUssQ0FBQzt3QkFDbkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFLLElBQUksQ0FBQyxJQUFJOzBCQUFHLElBQUksQ0FBQyxDQUFJO3dCQUNoRCxrQkFBa0IsQ0FDaEIsTUFBTSxDQUFDLGNBQWMsSUFBSSxDQUFFLEdBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSzt3QkFFcEIsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFHLE9BQUssQ0FBRyxLQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFJLEtBQUUsS0FBSzt3QkFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNO29CQUMzQixDQUFDOztZQUNILENBQUMsRUFDRSxPQUFPLENBQUMsQ0FBQztnQkFBQSxDQUFDO2dCQUFFLENBQUM7Z0JBQUUsQ0FBQztZQUFBLENBQUMsRUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN0QixXQUFXLENBQUMsQ0FBQztnQkFBQSxFQUFFO2dCQUFFLEVBQUU7Z0JBQUUsRUFBRTtnQkFBRSxFQUFFO1lBQUEsQ0FBQyxFQUM1QixRQUFRLEtBQ1gsQ0FBSTtRQUNSLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFTLFlBQ3pCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztlQUNQLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBZSxHQUFLLENBQUM7b0JBQ25DLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksR0FBSyxJQUFJLENBQUMsSUFBSTtzQkFBRyxJQUFJLENBQUMsQ0FBSTtvQkFDaEQsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFHLE9BQUssQ0FBRyxLQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFJLEtBQUUsS0FBSztvQkFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2dCQUMzQixDQUFDOztRQUNILENBQUMsRUFDRSxPQUFPLENBQUMsQ0FBQztZQUFBLENBQUM7WUFBRSxDQUFDO1FBQUEsQ0FBQyxFQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDdEIsV0FBVyxDQUFDLENBQUM7WUFBQSxFQUFFO1lBQUUsRUFBRTtZQUFFLEVBQUU7UUFBQSxDQUFDLEVBQ3hCLFFBQVEsS0FDWCxDQUFJO0lBQ1IsQ0FBQztJQUVPLGdCQUFnQixHQUFXLENBQUM7UUFDbEMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLO1FBQzNDLEVBQUUsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLENBQUU7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxLQUMvQyxPQUFPLENBQUMsaUJBQWlCOztRQUc3QixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztZQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFVLGFBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzttQkFDUCxRQUFRLENBQUMsR0FBRyxFQUFFLE9BQWdCLEdBQUssQ0FBQzt3QkFDckMsQ0FBQzs0QkFBQSxPQUFPLENBQUMsT0FBTzsrQkFBTyxPQUFPLENBQUMsVUFBVTt3QkFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksR0FDcEQsSUFBSSxDQUFDLElBQUk7MEJBQ1QsSUFBSSxDQUFDLENBQUk7d0JBQ1gsa0JBQWtCLENBQ2hCLE9BQU8sQ0FBQyxpQkFBaUIsTUFBTSxDQUFFLEdBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSzt3QkFFcEIsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFHLE9BQUssQ0FBRyxLQUNwQixPQUFPLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxDQUFJLEtBQUUsS0FBSztvQkFDNUMsQ0FBQzs7WUFDSCxDQUFDLEVBQ0UsT0FBTyxDQUFDLENBQUM7Z0JBQUEsQ0FBQztnQkFBRSxDQUFDO2dCQUFFLENBQUM7WUFBQSxDQUFDLEVBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDdEIsUUFBUSxLQUNYLENBQUk7UUFDUixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBVSxhQUMxQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7ZUFDUCxRQUFRLENBQUMsR0FBRyxFQUFFLE9BQWdCLEdBQUssQ0FBQztvQkFDckMsQ0FBQzt3QkFBQSxPQUFPLENBQUMsT0FBTzsyQkFBTyxPQUFPLENBQUMsVUFBVTtvQkFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksR0FBSyxJQUFJLENBQUMsSUFBSTtzQkFDakUsSUFBSSxDQUFDLENBQUk7b0JBQ1osR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFHLE9BQUssQ0FBRyxLQUNwQixPQUFPLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxDQUFJLEtBQUUsS0FBSztnQkFDNUMsQ0FBQzs7UUFDSCxDQUFDLEVBQ0UsT0FBTyxDQUFDLENBQUM7WUFBQSxDQUFDO1lBQUUsQ0FBQztRQUFBLENBQUMsRUFDZCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3RCLFFBQVEsS0FDWCxDQUFJO0lBQ1IsQ0FBQztJQUVPLDRCQUE0QixHQUFXLENBQUM7UUFDOUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLO1FBQ3pDLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsTUFBTSxDQUFDLENBQUU7UUFDWCxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBdUIsMEJBQ3ZDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztlQUNQLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBZSxHQUFLLENBQUM7b0JBQ25DLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQVksR0FBSyxJQUFJLENBQUMsSUFBSTtzQkFBRyxJQUFJLENBQUMsQ0FBSTtvQkFDeEQsd0JBQXdCLENBQ3RCLE1BQU0sQ0FBQyxPQUFPLEVBQ2QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLO3VCQUVqQixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUcsS0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQ3pDLENBQUM7O1FBQ0gsQ0FBQyxFQUNFLE9BQU8sQ0FBQyxDQUFDLEVBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN0QixRQUFRLEtBQ1gsQ0FBSTtJQUNSLENBQUM7SUFFTyxnQkFBZ0IsR0FBVyxDQUFDO1FBQ2xDLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXO1FBQ3JDLEVBQUUsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLENBQUU7UUFDWCxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBVSxhQUMxQixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsT0FBaUIsR0FBSyxDQUFDO2dCQUM5QyxHQUFHLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sQ0FBQyxXQUFXO1lBQ3JCLENBQUM7V0FDRSxPQUFPLENBQUMsQ0FBQyxFQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDdEIsV0FBVyxDQUFDLEdBQUcsRUFDZixRQUFRLEtBQ1gsQ0FBSTtJQUNSLENBQUM7SUFFTyxhQUFhLENBQUMsTUFBZSxFQUFVLENBQUM7UUFDOUMsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLENBQUU7UUFDWCxDQUFDO1FBQ0QsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFFaEIsTUFBTSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRO1FBQzlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLENBQVcsY0FBSSxLQUFLLENBQUMsSUFBSSxDQUNqRCxJQUFJLEVBQUUsU0FBUyxLQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtRQUVqRSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUNsQyxNQUFNLENBQUMsSUFBSSxFQUFFLFNBQVMsTUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBSTtRQUVoRCxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUNwQyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsTUFDbkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBSTtRQUdsRCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxPQUFPO1FBQzVELEVBQUUsRUFBRSxJQUFJLFlBQVksSUFBSSxFQUFFLENBQUM7WUFDekIsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTO1lBQ2pFLEVBQUUsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLENBQUM7Z0JBQzNCLEtBQUssQ0FBQyxJQUFJLENBQ1IsSUFBSSxFQUFFLFFBQVEsS0FDWixjQUFjLENBQUMsR0FBRyxFQUFFLEtBQWMsR0FDaEMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07a0JBQ2xDLElBQUksQ0FBQyxDQUFJO1lBRWpCLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBSSxLQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFFO0lBQ1gsQ0FBQztJQUVPLEtBQUssQ0FBQyxLQUFhLEVBQUUsQ0FBQztRQUM1QixNQUFNLENBQUMsQ0FBSSxNQUNULENBQUcsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsS0FDekMsQ0FBTTtJQUNWLENBQUM7O1NBR00sVUFBVSxDQUFDLE1BQWMsRUFBVSxDQUFDO0lBQzNDLE1BQU0sRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxXQUFXLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQUssQ0FBRTtBQUNoRSxDQUFDO1NBRVEsT0FBTyxDQUFDLEtBQWMsRUFBRSxNQUFlLEVBQVUsQ0FBQztJQUN6RCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FDakIsS0FBSyxFQUNMLEVBQW9ELEFBQXBELGtEQUFvRDtJQUNwRCxDQUFDO1FBQUMsS0FBSyxFQUFFLENBQUM7UUFBRSxNQUFNO1FBQUUsYUFBYSxFQUFFLEtBQUs7SUFBQyxDQUFDO0FBRTlDLENBQUM7QUFFRCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsVUFDTSxrQkFBa0IsQ0FBQyxjQUFzQixFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQztJQUNqRSxFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLENBQUU7SUFDWCxDQUFDO0lBRUQsTUFBTSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsRUFDM0MsR0FBRyxFQUFFLEdBQWMsR0FBSyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsS0FBSztNQUFHLElBQUksQ0FBQyxDQUFHO0FBQzNFLENBQUM7QUFFRCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsVUFDTSx3QkFBd0IsQ0FDL0IsR0FBYyxFQUNkLEtBQUssR0FBRyxJQUFJLEVBQ0osQ0FBQztJQUNULEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRTtJQUVaLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxDQUFHLEtBQUcsQ0FBRztJQUUzQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUU7SUFDYixJQUFJLElBQUksR0FBRyxDQUFDLElBQUk7SUFDaEIsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQixJQUFJLElBQUksQ0FBSztJQUNmLENBQUM7SUFDRCxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUk7SUFFbkIsR0FBRyxJQUFJLElBQUk7SUFFWCxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDVixHQUFHLElBQUksTUFBTSxDQUFDLENBQUc7UUFDakIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSTtJQUNyQixDQUFDO0lBRUQsRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBSTtJQUNuQixDQUFDO0lBRUQsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLENBQUcsS0FBRyxDQUFHO0lBRTNDLE1BQU0sQ0FBQyxHQUFHO0FBQ1osQ0FBQyJ9