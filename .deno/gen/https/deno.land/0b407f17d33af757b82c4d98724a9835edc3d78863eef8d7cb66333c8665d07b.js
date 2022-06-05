import { UnknownType, ValidationError as FlagsValidationError, } from "../flags/_errors.ts";
import { parseFlags } from "../flags/flags.ts";
import { getPermissions, hasPermission, isUnstable, parseArgumentsDefinition, splitArguments, } from "./_utils.ts";
import { bold, red } from "./deps.ts";
import { CommandExecutableNotFound, CommandNotFound, DefaultCommandNotFound, DuplicateCommandAlias, DuplicateCommandName, DuplicateCompletion, DuplicateEnvironmentVariable, DuplicateExample, DuplicateOptionName, DuplicateType, EnvironmentVariableOptionalValue, EnvironmentVariableSingleValue, EnvironmentVariableVariadicValue, MissingArgument, MissingArguments, MissingCommandName, NoArgumentsAllowed, TooManyArguments, UnknownCommand, ValidationError, } from "./_errors.ts";
import { BooleanType } from "./types/boolean.ts";
import { NumberType } from "./types/number.ts";
import { StringType } from "./types/string.ts";
import { Type } from "./type.ts";
import { HelpGenerator } from "./help/_help_generator.ts";
import { IntegerType } from "./types/integer.ts";
export class Command {
    types = new Map();
    rawArgs = [];
    literalArgs = [];
    _name = "COMMAND";
    _parent;
    _globalParent;
    ver;
    desc = "";
    fn;
    options = [];
    commands = new Map();
    examples = [];
    envVars = [];
    aliases = [];
    completions = new Map();
    cmd = this;
    argsDefinition;
    isExecutable = false;
    throwOnError = false;
    _allowEmpty = true;
    _stopEarly = false;
    defaultCommand;
    _useRawArgs = false;
    args = [];
    isHidden = false;
    isGlobal = false;
    hasDefaults = false;
    _versionOption;
    _helpOption;
    _help;
    versionOption(flags, desc, opts) {
        this._versionOption = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? { action: opts } : opts,
        };
        return this;
    }
    helpOption(flags, desc, opts) {
        this._helpOption = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? { action: opts } : opts,
        };
        return this;
    }
    command(nameAndArguments, cmdOrDescription, override) {
        const result = splitArguments(nameAndArguments);
        const name = result.flags.shift();
        const aliases = result.flags;
        if (!name) {
            throw new MissingCommandName();
        }
        if (this.getBaseCommand(name, true)) {
            if (!override) {
                throw new DuplicateCommandName(name);
            }
            this.removeCommand(name);
        }
        let description;
        let cmd;
        if (typeof cmdOrDescription === "string") {
            description = cmdOrDescription;
        }
        if (cmdOrDescription instanceof Command) {
            cmd = cmdOrDescription.reset();
        }
        else {
            cmd = new Command();
        }
        cmd._name = name;
        cmd._parent = this;
        if (description) {
            cmd.description(description);
        }
        if (result.typeDefinition) {
            cmd.arguments(result.typeDefinition);
        }
        aliases.forEach((alias) => cmd.alias(alias));
        this.commands.set(name, cmd);
        this.select(name);
        return this;
    }
    alias(alias) {
        if (this.cmd._name === alias || this.cmd.aliases.includes(alias)) {
            throw new DuplicateCommandAlias(alias);
        }
        this.cmd.aliases.push(alias);
        return this;
    }
    reset() {
        this.cmd = this;
        return this;
    }
    select(name) {
        const cmd = this.getBaseCommand(name, true);
        if (!cmd) {
            throw new CommandNotFound(name, this.getBaseCommands(true));
        }
        this.cmd = cmd;
        return this;
    }
    name(name) {
        this.cmd._name = name;
        return this;
    }
    version(version) {
        if (typeof version === "string") {
            this.cmd.ver = () => version;
        }
        else if (typeof version === "function") {
            this.cmd.ver = version;
        }
        return this;
    }
    help(help) {
        if (typeof help === "string") {
            this.cmd._help = () => help;
        }
        else if (typeof help === "function") {
            this.cmd._help = help;
        }
        else {
            this.cmd._help = (cmd) => HelpGenerator.generate(cmd, help);
        }
        return this;
    }
    description(description) {
        this.cmd.desc = description;
        return this;
    }
    hidden() {
        this.cmd.isHidden = true;
        return this;
    }
    global() {
        this.cmd.isGlobal = true;
        return this;
    }
    executable() {
        this.cmd.isExecutable = true;
        return this;
    }
    arguments(args) {
        this.cmd.argsDefinition = args;
        return this;
    }
    action(fn) {
        this.cmd.fn = fn;
        return this;
    }
    allowEmpty(allowEmpty = true) {
        this.cmd._allowEmpty = allowEmpty;
        return this;
    }
    stopEarly(stopEarly = true) {
        this.cmd._stopEarly = stopEarly;
        return this;
    }
    useRawArgs(useRawArgs = true) {
        this.cmd._useRawArgs = useRawArgs;
        return this;
    }
    default(name) {
        this.cmd.defaultCommand = name;
        return this;
    }
    globalType(name, type, options) {
        return this.type(name, type, { ...options, global: true });
    }
    type(name, handler, options) {
        if (this.cmd.types.get(name) && !options?.override) {
            throw new DuplicateType(name);
        }
        this.cmd.types.set(name, { ...options, name, handler });
        if (handler instanceof Type &&
            (typeof handler.complete !== "undefined" ||
                typeof handler.values !== "undefined")) {
            const completeHandler = (cmd, parent) => handler.complete?.(cmd, parent) || [];
            this.complete(name, completeHandler, options);
        }
        return this;
    }
    globalComplete(name, complete, options) {
        return this.complete(name, complete, { ...options, global: true });
    }
    complete(name, complete, options) {
        if (this.cmd.completions.has(name) && !options?.override) {
            throw new DuplicateCompletion(name);
        }
        this.cmd.completions.set(name, {
            name,
            complete,
            ...options,
        });
        return this;
    }
    throwErrors() {
        this.cmd.throwOnError = true;
        return this;
    }
    shouldThrowErrors() {
        return this.cmd.throwOnError || !!this.cmd._parent?.shouldThrowErrors();
    }
    globalOption(flags, desc, opts) {
        if (typeof opts === "function") {
            return this.option(flags, desc, { value: opts, global: true });
        }
        return this.option(flags, desc, { ...opts, global: true });
    }
    option(flags, desc, opts) {
        if (typeof opts === "function") {
            return this.option(flags, desc, { value: opts });
        }
        const result = splitArguments(flags);
        const args = result.typeDefinition
            ? parseArgumentsDefinition(result.typeDefinition)
            : [];
        const option = {
            ...opts,
            name: "",
            description: desc,
            args,
            flags: result.flags,
            typeDefinition: result.typeDefinition,
        };
        if (option.separator) {
            for (const arg of args) {
                if (arg.list) {
                    arg.separator = option.separator;
                }
            }
        }
        for (const part of option.flags) {
            const arg = part.trim();
            const isLong = /^--/.test(arg);
            const name = isLong ? arg.slice(2) : arg.slice(1);
            if (this.cmd.getBaseOption(name, true)) {
                if (opts?.override) {
                    this.removeOption(name);
                }
                else {
                    throw new DuplicateOptionName(name);
                }
            }
            if (!option.name && isLong) {
                option.name = name;
            }
            else if (!option.aliases) {
                option.aliases = [name];
            }
            else {
                option.aliases.push(name);
            }
        }
        if (option.prepend) {
            this.cmd.options.unshift(option);
        }
        else {
            this.cmd.options.push(option);
        }
        return this;
    }
    example(name, description) {
        if (this.cmd.hasExample(name)) {
            throw new DuplicateExample(name);
        }
        this.cmd.examples.push({ name, description });
        return this;
    }
    globalEnv(name, description, options) {
        return this.env(name, description, { ...options, global: true });
    }
    env(name, description, options) {
        const result = splitArguments(name);
        if (!result.typeDefinition) {
            result.typeDefinition = "<value:boolean>";
        }
        if (result.flags.some((envName) => this.cmd.getBaseEnvVar(envName, true))) {
            throw new DuplicateEnvironmentVariable(name);
        }
        const details = parseArgumentsDefinition(result.typeDefinition);
        if (details.length > 1) {
            throw new EnvironmentVariableSingleValue(name);
        }
        else if (details.length && details[0].optionalValue) {
            throw new EnvironmentVariableOptionalValue(name);
        }
        else if (details.length && details[0].variadic) {
            throw new EnvironmentVariableVariadicValue(name);
        }
        this.cmd.envVars.push({
            name: result.flags[0],
            names: result.flags,
            description,
            type: details[0].type,
            details: details.shift(),
            ...options,
        });
        return this;
    }
    async parse(args = Deno.args, dry) {
        try {
            this.reset();
            this.registerDefaults();
            this.rawArgs = args;
            const subCommand = args.length > 0 &&
                this.getCommand(args[0], true);
            if (subCommand) {
                subCommand._globalParent = this;
                return await subCommand.parse(this.rawArgs.slice(1), dry);
            }
            const result = {
                options: {},
                args: this.rawArgs,
                cmd: this,
                literal: this.literalArgs,
            };
            if (this.isExecutable) {
                if (!dry) {
                    await this.executeExecutable(this.rawArgs);
                }
                return result;
            }
            else if (this._useRawArgs) {
                if (dry) {
                    return result;
                }
                return await this.execute({}, ...this.rawArgs);
            }
            else {
                const { action, flags, unknown, literal } = this.parseFlags(this.rawArgs);
                this.literalArgs = literal;
                const params = this.parseArguments(unknown, flags);
                await this.validateEnvVars();
                if (dry || action) {
                    if (action) {
                        await action.call(this, flags, ...params);
                    }
                    return {
                        options: flags,
                        args: params,
                        cmd: this,
                        literal: this.literalArgs,
                    };
                }
                return await this.execute(flags, ...params);
            }
        }
        catch (error) {
            throw this.error(error);
        }
    }
    registerDefaults() {
        if (this.hasDefaults || this.getParent()) {
            return this;
        }
        this.hasDefaults = true;
        this.reset();
        !this.types.has("string") &&
            this.type("string", new StringType(), { global: true });
        !this.types.has("number") &&
            this.type("number", new NumberType(), { global: true });
        !this.types.has("integer") &&
            this.type("integer", new IntegerType(), { global: true });
        !this.types.has("boolean") &&
            this.type("boolean", new BooleanType(), { global: true });
        if (!this._help) {
            this.help({
                hints: true,
                types: false,
            });
        }
        if (this._versionOption !== false && (this._versionOption || this.ver)) {
            this.option(this._versionOption?.flags || "-V, --version", this._versionOption?.desc ||
                "Show the version number for this program.", {
                standalone: true,
                prepend: true,
                action: function () {
                    this.showVersion();
                    Deno.exit(0);
                },
                ...(this._versionOption?.opts ?? {}),
            });
        }
        if (this._helpOption !== false) {
            this.option(this._helpOption?.flags || "-h, --help", this._helpOption?.desc || "Show this help.", {
                standalone: true,
                global: true,
                prepend: true,
                action: function () {
                    this.showHelp();
                    Deno.exit(0);
                },
                ...(this._helpOption?.opts ?? {}),
            });
        }
        return this;
    }
    async execute(options, ...args) {
        if (this.fn) {
            await this.fn(options, ...args);
        }
        else if (this.defaultCommand) {
            const cmd = this.getCommand(this.defaultCommand, true);
            if (!cmd) {
                throw new DefaultCommandNotFound(this.defaultCommand, this.getCommands());
            }
            cmd._globalParent = this;
            await cmd.execute(options, ...args);
        }
        return { options, args, cmd: this, literal: this.literalArgs };
    }
    async executeExecutable(args) {
        const permissions = await getPermissions();
        if (!permissions.read) {
            await Deno.permissions?.request({ name: "read" });
        }
        if (!permissions.run) {
            await Deno.permissions?.request({ name: "run" });
        }
        const [main, ...names] = this.getPath().split(" ");
        names.unshift(main.replace(/\.ts$/, ""));
        const executableName = names.join("-");
        const files = [];
        const parts = Deno.mainModule.replace(/^file:\/\//g, "")
            .split("/");
        if (Deno.build.os === "windows" && parts[0] === "") {
            parts.shift();
        }
        parts.pop();
        const path = parts.join("/");
        files.push(path + "/" + executableName, path + "/" + executableName + ".ts");
        files.push(executableName, executableName + ".ts");
        const denoOpts = [];
        if (isUnstable()) {
            denoOpts.push("--unstable");
        }
        denoOpts.push("--allow-read", "--allow-run");
        Object.keys(permissions)
            .forEach((name) => {
            if (name === "read" || name === "run") {
                return;
            }
            if (permissions[name]) {
                denoOpts.push(`--allow-${name}`);
            }
        });
        for (const file of files) {
            try {
                Deno.lstatSync(file);
            }
            catch (error) {
                if (error instanceof Deno.errors.NotFound) {
                    continue;
                }
                throw error;
            }
            const cmd = ["deno", "run", ...denoOpts, file, ...args];
            const process = Deno.run({
                cmd: cmd,
            });
            const status = await process.status();
            if (!status.success) {
                Deno.exit(status.code);
            }
            return;
        }
        throw new CommandExecutableNotFound(executableName, files);
    }
    parseFlags(args) {
        try {
            let action;
            const result = parseFlags(args, {
                stopEarly: this._stopEarly,
                allowEmpty: this._allowEmpty,
                flags: this.getOptions(true),
                parse: (type) => this.parseType(type),
                option: (option) => {
                    if (!action && option.action) {
                        action = option.action;
                    }
                },
            });
            return { ...result, action };
        }
        catch (error) {
            if (error instanceof FlagsValidationError) {
                throw new ValidationError(error.message);
            }
            throw error;
        }
    }
    parseType(type) {
        const typeSettings = this.getType(type.type);
        if (!typeSettings) {
            throw new UnknownType(type.type, this.getTypes().map((type) => type.name));
        }
        return typeSettings.handler instanceof Type
            ? typeSettings.handler.parse(type)
            : typeSettings.handler(type);
    }
    async validateEnvVars() {
        if (!await hasPermission("env")) {
            return;
        }
        const envVars = this.getEnvVars(true);
        if (!envVars.length) {
            return;
        }
        envVars.forEach((env) => {
            const name = env.names.find((name) => !!Deno.env.get(name));
            if (name) {
                this.parseType({
                    label: "Environment variable",
                    type: env.type,
                    name,
                    value: Deno.env.get(name) ?? "",
                });
            }
        });
    }
    parseArguments(args, flags) {
        const params = [];
        args = args.slice(0);
        if (!this.hasArguments()) {
            if (args.length) {
                if (this.hasCommands(true)) {
                    throw new UnknownCommand(args[0], this.getCommands());
                }
                else {
                    throw new NoArgumentsAllowed(this.getPath());
                }
            }
        }
        else {
            if (!args.length) {
                const required = this.getArguments()
                    .filter((expectedArg) => !expectedArg.optionalValue)
                    .map((expectedArg) => expectedArg.name);
                if (required.length) {
                    const flagNames = Object.keys(flags);
                    const hasStandaloneOption = !!flagNames.find((name) => this.getOption(name, true)?.standalone);
                    if (!hasStandaloneOption) {
                        throw new MissingArguments(required);
                    }
                }
            }
            else {
                for (const expectedArg of this.getArguments()) {
                    if (!args.length) {
                        if (expectedArg.optionalValue) {
                            break;
                        }
                        throw new MissingArgument(`Missing argument: ${expectedArg.name}`);
                    }
                    let arg;
                    if (expectedArg.variadic) {
                        arg = args.splice(0, args.length)
                            .map((value) => this.parseType({
                            label: "Argument",
                            type: expectedArg.type,
                            name: expectedArg.name,
                            value,
                        }));
                    }
                    else {
                        arg = this.parseType({
                            label: "Argument",
                            type: expectedArg.type,
                            name: expectedArg.name,
                            value: args.shift(),
                        });
                    }
                    if (arg) {
                        params.push(arg);
                    }
                }
                if (args.length) {
                    throw new TooManyArguments(args);
                }
            }
        }
        return params;
    }
    error(error) {
        if (this.shouldThrowErrors() || !(error instanceof ValidationError)) {
            return error;
        }
        this.showHelp();
        Deno.stderr.writeSync(new TextEncoder().encode(red(`  ${bold("error")}: ${error.message}\n`) + "\n"));
        Deno.exit(error instanceof ValidationError ? error.exitCode : 1);
    }
    getName() {
        return this._name;
    }
    getParent() {
        return this._parent;
    }
    getGlobalParent() {
        return this._globalParent;
    }
    getMainCommand() {
        return this._parent?.getMainCommand() ?? this;
    }
    getAliases() {
        return this.aliases;
    }
    getPath() {
        return this._parent
            ? this._parent.getPath() + " " + this._name
            : this._name;
    }
    getArgsDefinition() {
        return this.argsDefinition;
    }
    getArgument(name) {
        return this.getArguments().find((arg) => arg.name === name);
    }
    getArguments() {
        if (!this.args.length && this.argsDefinition) {
            this.args = parseArgumentsDefinition(this.argsDefinition);
        }
        return this.args;
    }
    hasArguments() {
        return !!this.argsDefinition;
    }
    getVersion() {
        return this.getVersionHandler()?.call(this, this);
    }
    getVersionHandler() {
        return this.ver ?? this._parent?.getVersionHandler();
    }
    getDescription() {
        return typeof this.desc === "function"
            ? this.desc = this.desc()
            : this.desc;
    }
    getShortDescription() {
        return this.getDescription()
            .trim()
            .split("\n")
            .shift();
    }
    getRawArgs() {
        return this.rawArgs;
    }
    getLiteralArgs() {
        return this.literalArgs;
    }
    showVersion() {
        Deno.stdout.writeSync(new TextEncoder().encode(this.getVersion()));
    }
    showHelp() {
        Deno.stdout.writeSync(new TextEncoder().encode(this.getHelp()));
    }
    getHelp() {
        this.registerDefaults();
        return this.getHelpHandler().call(this, this);
    }
    getHelpHandler() {
        return this._help ?? this._parent?.getHelpHandler();
    }
    hasOptions(hidden) {
        return this.getOptions(hidden).length > 0;
    }
    getOptions(hidden) {
        return this.getGlobalOptions(hidden).concat(this.getBaseOptions(hidden));
    }
    getBaseOptions(hidden) {
        if (!this.options.length) {
            return [];
        }
        return hidden
            ? this.options.slice(0)
            : this.options.filter((opt) => !opt.hidden);
    }
    getGlobalOptions(hidden) {
        const getOptions = (cmd, options = [], names = []) => {
            if (cmd) {
                if (cmd.options.length) {
                    cmd.options.forEach((option) => {
                        if (option.global &&
                            !this.options.find((opt) => opt.name === option.name) &&
                            names.indexOf(option.name) === -1 &&
                            (hidden || !option.hidden)) {
                            names.push(option.name);
                            options.push(option);
                        }
                    });
                }
                return getOptions(cmd._parent, options, names);
            }
            return options;
        };
        return getOptions(this._parent);
    }
    hasOption(name, hidden) {
        return !!this.getOption(name, hidden);
    }
    getOption(name, hidden) {
        return this.getBaseOption(name, hidden) ??
            this.getGlobalOption(name, hidden);
    }
    getBaseOption(name, hidden) {
        const option = this.options.find((option) => option.name === name);
        return option && (hidden || !option.hidden) ? option : undefined;
    }
    getGlobalOption(name, hidden) {
        if (!this._parent) {
            return;
        }
        const option = this._parent.getBaseOption(name, hidden);
        if (!option || !option.global) {
            return this._parent.getGlobalOption(name, hidden);
        }
        return option;
    }
    removeOption(name) {
        const index = this.options.findIndex((option) => option.name === name);
        if (index === -1) {
            return;
        }
        return this.options.splice(index, 1)[0];
    }
    hasCommands(hidden) {
        return this.getCommands(hidden).length > 0;
    }
    getCommands(hidden) {
        return this.getGlobalCommands(hidden).concat(this.getBaseCommands(hidden));
    }
    getBaseCommands(hidden) {
        const commands = Array.from(this.commands.values());
        return hidden ? commands : commands.filter((cmd) => !cmd.isHidden);
    }
    getGlobalCommands(hidden) {
        const getCommands = (cmd, commands = [], names = []) => {
            if (cmd) {
                if (cmd.commands.size) {
                    cmd.commands.forEach((cmd) => {
                        if (cmd.isGlobal &&
                            this !== cmd &&
                            !this.commands.has(cmd._name) &&
                            names.indexOf(cmd._name) === -1 &&
                            (hidden || !cmd.isHidden)) {
                            names.push(cmd._name);
                            commands.push(cmd);
                        }
                    });
                }
                return getCommands(cmd._parent, commands, names);
            }
            return commands;
        };
        return getCommands(this._parent);
    }
    hasCommand(name, hidden) {
        return !!this.getCommand(name, hidden);
    }
    getCommand(name, hidden) {
        return this.getBaseCommand(name, hidden) ??
            this.getGlobalCommand(name, hidden);
    }
    getBaseCommand(name, hidden) {
        for (const cmd of this.commands.values()) {
            if (cmd._name === name || cmd.aliases.includes(name)) {
                return (cmd && (hidden || !cmd.isHidden) ? cmd : undefined);
            }
        }
    }
    getGlobalCommand(name, hidden) {
        if (!this._parent) {
            return;
        }
        const cmd = this._parent.getBaseCommand(name, hidden);
        if (!cmd?.isGlobal) {
            return this._parent.getGlobalCommand(name, hidden);
        }
        return cmd;
    }
    removeCommand(name) {
        const command = this.getBaseCommand(name, true);
        if (command) {
            this.commands.delete(command._name);
        }
        return command;
    }
    getTypes() {
        return this.getGlobalTypes().concat(this.getBaseTypes());
    }
    getBaseTypes() {
        return Array.from(this.types.values());
    }
    getGlobalTypes() {
        const getTypes = (cmd, types = [], names = []) => {
            if (cmd) {
                if (cmd.types.size) {
                    cmd.types.forEach((type) => {
                        if (type.global &&
                            !this.types.has(type.name) &&
                            names.indexOf(type.name) === -1) {
                            names.push(type.name);
                            types.push(type);
                        }
                    });
                }
                return getTypes(cmd._parent, types, names);
            }
            return types;
        };
        return getTypes(this._parent);
    }
    getType(name) {
        return this.getBaseType(name) ?? this.getGlobalType(name);
    }
    getBaseType(name) {
        return this.types.get(name);
    }
    getGlobalType(name) {
        if (!this._parent) {
            return;
        }
        const cmd = this._parent.getBaseType(name);
        if (!cmd?.global) {
            return this._parent.getGlobalType(name);
        }
        return cmd;
    }
    getCompletions() {
        return this.getGlobalCompletions().concat(this.getBaseCompletions());
    }
    getBaseCompletions() {
        return Array.from(this.completions.values());
    }
    getGlobalCompletions() {
        const getCompletions = (cmd, completions = [], names = []) => {
            if (cmd) {
                if (cmd.completions.size) {
                    cmd.completions.forEach((completion) => {
                        if (completion.global &&
                            !this.completions.has(completion.name) &&
                            names.indexOf(completion.name) === -1) {
                            names.push(completion.name);
                            completions.push(completion);
                        }
                    });
                }
                return getCompletions(cmd._parent, completions, names);
            }
            return completions;
        };
        return getCompletions(this._parent);
    }
    getCompletion(name) {
        return this.getBaseCompletion(name) ?? this.getGlobalCompletion(name);
    }
    getBaseCompletion(name) {
        return this.completions.get(name);
    }
    getGlobalCompletion(name) {
        if (!this._parent) {
            return;
        }
        const completion = this._parent.getBaseCompletion(name);
        if (!completion?.global) {
            return this._parent.getGlobalCompletion(name);
        }
        return completion;
    }
    hasEnvVars(hidden) {
        return this.getEnvVars(hidden).length > 0;
    }
    getEnvVars(hidden) {
        return this.getGlobalEnvVars(hidden).concat(this.getBaseEnvVars(hidden));
    }
    getBaseEnvVars(hidden) {
        if (!this.envVars.length) {
            return [];
        }
        return hidden
            ? this.envVars.slice(0)
            : this.envVars.filter((env) => !env.hidden);
    }
    getGlobalEnvVars(hidden) {
        const getEnvVars = (cmd, envVars = [], names = []) => {
            if (cmd) {
                if (cmd.envVars.length) {
                    cmd.envVars.forEach((envVar) => {
                        if (envVar.global &&
                            !this.envVars.find((env) => env.names[0] === envVar.names[0]) &&
                            names.indexOf(envVar.names[0]) === -1 &&
                            (hidden || !envVar.hidden)) {
                            names.push(envVar.names[0]);
                            envVars.push(envVar);
                        }
                    });
                }
                return getEnvVars(cmd._parent, envVars, names);
            }
            return envVars;
        };
        return getEnvVars(this._parent);
    }
    hasEnvVar(name, hidden) {
        return !!this.getEnvVar(name, hidden);
    }
    getEnvVar(name, hidden) {
        return this.getBaseEnvVar(name, hidden) ??
            this.getGlobalEnvVar(name, hidden);
    }
    getBaseEnvVar(name, hidden) {
        const envVar = this.envVars.find((env) => env.names.indexOf(name) !== -1);
        return envVar && (hidden || !envVar.hidden) ? envVar : undefined;
    }
    getGlobalEnvVar(name, hidden) {
        if (!this._parent) {
            return;
        }
        const envVar = this._parent.getBaseEnvVar(name, hidden);
        if (!envVar?.global) {
            return this._parent.getGlobalEnvVar(name, hidden);
        }
        return envVar;
    }
    hasExamples() {
        return this.examples.length > 0;
    }
    getExamples() {
        return this.examples;
    }
    hasExample(name) {
        return !!this.getExample(name);
    }
    getExample(name) {
        return this.examples.find((example) => example.name === name);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFdBQVcsRUFDWCxlQUFlLElBQUksb0JBQW9CLEdBQ3hDLE1BQU0scUJBQXFCLENBQUM7QUFDN0IsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRS9DLE9BQU8sRUFDTCxjQUFjLEVBQ2QsYUFBYSxFQUNiLFVBQVUsRUFDVix3QkFBd0IsRUFDeEIsY0FBYyxHQUNmLE1BQU0sYUFBYSxDQUFDO0FBRXJCLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3RDLE9BQU8sRUFDTCx5QkFBeUIsRUFDekIsZUFBZSxFQUNmLHNCQUFzQixFQUN0QixxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLG1CQUFtQixFQUNuQiw0QkFBNEIsRUFDNUIsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQixhQUFhLEVBQ2IsZ0NBQWdDLEVBQ2hDLDhCQUE4QixFQUM5QixnQ0FBZ0MsRUFDaEMsZUFBZSxFQUNmLGdCQUFnQixFQUNoQixrQkFBa0IsRUFDbEIsa0JBQWtCLEVBQ2xCLGdCQUFnQixFQUNoQixjQUFjLEVBQ2QsZUFBZSxHQUNoQixNQUFNLGNBQWMsQ0FBQztBQUN0QixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDakQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQXVCMUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBZ0NqRCxNQUFNLE9BQU8sT0FBTztJQVlW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SUFHTSxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFHTSxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFVua25vd25UeXBlLFxuICBWYWxpZGF0aW9uRXJyb3IgYXMgRmxhZ3NWYWxpZGF0aW9uRXJyb3IsXG59IGZyb20gXCIuLi9mbGFncy9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZUZsYWdzIH0gZnJvbSBcIi4uL2ZsYWdzL2ZsYWdzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IElGbGFnT3B0aW9ucywgSUZsYWdzUmVzdWx0IH0gZnJvbSBcIi4uL2ZsYWdzL3R5cGVzLnRzXCI7XG5pbXBvcnQge1xuICBnZXRQZXJtaXNzaW9ucyxcbiAgaGFzUGVybWlzc2lvbixcbiAgaXNVbnN0YWJsZSxcbiAgcGFyc2VBcmd1bWVudHNEZWZpbml0aW9uLFxuICBzcGxpdEFyZ3VtZW50cyxcbn0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25OYW1lIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBib2xkLCByZWQgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQge1xuICBDb21tYW5kRXhlY3V0YWJsZU5vdEZvdW5kLFxuICBDb21tYW5kTm90Rm91bmQsXG4gIERlZmF1bHRDb21tYW5kTm90Rm91bmQsXG4gIER1cGxpY2F0ZUNvbW1hbmRBbGlhcyxcbiAgRHVwbGljYXRlQ29tbWFuZE5hbWUsXG4gIER1cGxpY2F0ZUNvbXBsZXRpb24sXG4gIER1cGxpY2F0ZUVudmlyb25tZW50VmFyaWFibGUsXG4gIER1cGxpY2F0ZUV4YW1wbGUsXG4gIER1cGxpY2F0ZU9wdGlvbk5hbWUsXG4gIER1cGxpY2F0ZVR5cGUsXG4gIEVudmlyb25tZW50VmFyaWFibGVPcHRpb25hbFZhbHVlLFxuICBFbnZpcm9ubWVudFZhcmlhYmxlU2luZ2xlVmFsdWUsXG4gIEVudmlyb25tZW50VmFyaWFibGVWYXJpYWRpY1ZhbHVlLFxuICBNaXNzaW5nQXJndW1lbnQsXG4gIE1pc3NpbmdBcmd1bWVudHMsXG4gIE1pc3NpbmdDb21tYW5kTmFtZSxcbiAgTm9Bcmd1bWVudHNBbGxvd2VkLFxuICBUb29NYW55QXJndW1lbnRzLFxuICBVbmtub3duQ29tbWFuZCxcbiAgVmFsaWRhdGlvbkVycm9yLFxufSBmcm9tIFwiLi9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBCb29sZWFuVHlwZSB9IGZyb20gXCIuL3R5cGVzL2Jvb2xlYW4udHNcIjtcbmltcG9ydCB7IE51bWJlclR5cGUgfSBmcm9tIFwiLi90eXBlcy9udW1iZXIudHNcIjtcbmltcG9ydCB7IFN0cmluZ1R5cGUgfSBmcm9tIFwiLi90eXBlcy9zdHJpbmcudHNcIjtcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi90eXBlLnRzXCI7XG5pbXBvcnQgeyBIZWxwR2VuZXJhdG9yIH0gZnJvbSBcIi4vaGVscC9faGVscF9nZW5lcmF0b3IudHNcIjtcbmltcG9ydCB0eXBlIHsgSGVscE9wdGlvbnMgfSBmcm9tIFwiLi9oZWxwL19oZWxwX2dlbmVyYXRvci50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBJQWN0aW9uLFxuICBJQXJndW1lbnQsXG4gIElDb21tYW5kT3B0aW9uLFxuICBJQ29tcGxldGVIYW5kbGVyLFxuICBJQ29tcGxldGVPcHRpb25zLFxuICBJQ29tcGxldGlvbixcbiAgSURlc2NyaXB0aW9uLFxuICBJRW52VmFyLFxuICBJRW52VmFyT3B0aW9ucyxcbiAgSUV4YW1wbGUsXG4gIElGbGFnVmFsdWVIYW5kbGVyLFxuICBJSGVscEhhbmRsZXIsXG4gIElPcHRpb24sXG4gIElQYXJzZVJlc3VsdCxcbiAgSVR5cGUsXG4gIElUeXBlSGFuZGxlcixcbiAgSVR5cGVJbmZvLFxuICBJVHlwZU9wdGlvbnMsXG4gIElWZXJzaW9uSGFuZGxlcixcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEludGVnZXJUeXBlIH0gZnJvbSBcIi4vdHlwZXMvaW50ZWdlci50c1wiO1xuXG5pbnRlcmZhY2UgSURlZmF1bHRPcHRpb248XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIE8gZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdm9pZCA9IGFueSxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgQSBleHRlbmRzIEFycmF5PHVua25vd24+ID0gYW55LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFBHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFAgZXh0ZW5kcyBDb21tYW5kIHwgdW5kZWZpbmVkID0gYW55LFxuPiB7XG4gIGZsYWdzOiBzdHJpbmc7XG4gIGRlc2M/OiBzdHJpbmc7XG4gIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxPLCBBLCBHLCBQRywgUD47XG59XG5cbnR5cGUgT25lT2Y8VCwgVj4gPSBUIGV4dGVuZHMgdm9pZCA/IFYgOiBUO1xudHlwZSBNZXJnZTxULCBWPiA9IFQgZXh0ZW5kcyB2b2lkID8gViA6IChWIGV4dGVuZHMgdm9pZCA/IFQgOiBUICYgVik7XG5cbnR5cGUgTWFwT3B0aW9uVHlwZXM8TyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZD4gPSBPIGV4dGVuZHNcbiAgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgPyB7IFtLIGluIGtleW9mIE9dOiBPW0tdIGV4dGVuZHMgVHlwZTxpbmZlciBUPiA/IFQgOiBPW0tdIH1cbiAgOiB2b2lkO1xuXG50eXBlIE1hcEFyZ3VtZW50VHlwZXM8QSBleHRlbmRzIEFycmF5PHVua25vd24+PiA9IEEgZXh0ZW5kcyBBcnJheTx1bmtub3duPlxuICA/IHsgW0kgaW4ga2V5b2YgQV06IEFbSV0gZXh0ZW5kcyBUeXBlPGluZmVyIFQ+ID8gVCA6IEFbSV0gfVxuICA6IC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGFueTtcblxuZXhwb3J0IGNsYXNzIENvbW1hbmQ8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIENPIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIENBIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBDTyBleHRlbmRzIG51bWJlciA/IGFueSA6IFtdLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBDRyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4gfCB2b2lkID0gQ08gZXh0ZW5kcyBudW1iZXIgPyBhbnkgOiB2b2lkLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBQRyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4gfCB2b2lkID0gQ08gZXh0ZW5kcyBudW1iZXIgPyBhbnkgOiB2b2lkLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBQIGV4dGVuZHMgQ29tbWFuZCB8IHVuZGVmaW5lZCA9IENPIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdW5kZWZpbmVkLFxuPiB7XG4gIHByaXZhdGUgdHlwZXM6IE1hcDxzdHJpbmcsIElUeXBlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSByYXdBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGxpdGVyYWxBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICAvLyBAVE9ETzogZ2V0IHNjcmlwdCBuYW1lOiBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9wdWxsLzUwMzRcbiAgLy8gcHJpdmF0ZSBuYW1lOiBzdHJpbmcgPSBsb2NhdGlvbi5wYXRobmFtZS5zcGxpdCggJy8nICkucG9wKCkgYXMgc3RyaW5nO1xuICBwcml2YXRlIF9uYW1lID0gXCJDT01NQU5EXCI7XG4gIHByaXZhdGUgX3BhcmVudD86IFA7XG4gIHByaXZhdGUgX2dsb2JhbFBhcmVudD86IENvbW1hbmQ7XG4gIHByaXZhdGUgdmVyPzogSVZlcnNpb25IYW5kbGVyO1xuICBwcml2YXRlIGRlc2M6IElEZXNjcmlwdGlvbiA9IFwiXCI7XG4gIHByaXZhdGUgZm4/OiBJQWN0aW9uO1xuICBwcml2YXRlIG9wdGlvbnM6IElPcHRpb25bXSA9IFtdO1xuICBwcml2YXRlIGNvbW1hbmRzOiBNYXA8c3RyaW5nLCBDb21tYW5kPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBleGFtcGxlczogSUV4YW1wbGVbXSA9IFtdO1xuICBwcml2YXRlIGVudlZhcnM6IElFbnZWYXJbXSA9IFtdO1xuICBwcml2YXRlIGFsaWFzZXM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgY29tcGxldGlvbnM6IE1hcDxzdHJpbmcsIElDb21wbGV0aW9uPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBjbWQ6IENvbW1hbmQgPSB0aGlzO1xuICBwcml2YXRlIGFyZ3NEZWZpbml0aW9uPzogc3RyaW5nO1xuICBwcml2YXRlIGlzRXhlY3V0YWJsZSA9IGZhbHNlO1xuICBwcml2YXRlIHRocm93T25FcnJvciA9IGZhbHNlO1xuICBwcml2YXRlIF9hbGxvd0VtcHR5ID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfc3RvcEVhcmx5ID0gZmFsc2U7XG4gIHByaXZhdGUgZGVmYXVsdENvbW1hbmQ/OiBzdHJpbmc7XG4gIHByaXZhdGUgX3VzZVJhd0FyZ3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBhcmdzOiBJQXJndW1lbnRbXSA9IFtdO1xuICBwcml2YXRlIGlzSGlkZGVuID0gZmFsc2U7XG4gIHByaXZhdGUgaXNHbG9iYWwgPSBmYWxzZTtcbiAgcHJpdmF0ZSBoYXNEZWZhdWx0cyA9IGZhbHNlO1xuICBwcml2YXRlIF92ZXJzaW9uT3B0aW9uPzogSURlZmF1bHRPcHRpb24gfCBmYWxzZTtcbiAgcHJpdmF0ZSBfaGVscE9wdGlvbj86IElEZWZhdWx0T3B0aW9uIHwgZmFsc2U7XG4gIHByaXZhdGUgX2hlbHA/OiBJSGVscEhhbmRsZXI7XG5cbiAgLyoqIERpc2FibGUgdmVyc2lvbiBvcHRpb24uICovXG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKGVuYWJsZTogZmFsc2UpOiB0aGlzO1xuICAvKipcbiAgICogU2V0IGdsb2JhbCB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgVmVyc2lvbiBvcHRpb24gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzogSUNvbW1hbmRPcHRpb248UGFydGlhbDxDTz4sIENBLCBDRywgUEcsIFA+ICYgeyBnbG9iYWw6IHRydWUgfSxcbiAgKTogdGhpcztcbiAgLyoqXG4gICAqIFNldCB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgVmVyc2lvbiBvcHRpb24gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzogSUNvbW1hbmRPcHRpb248Q08sIENBLCBDRywgUEcsIFA+LFxuICApOiB0aGlzO1xuICAvKipcbiAgICogU2V0IHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBUaGUgYWN0aW9uIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICovXG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzogSUFjdGlvbjxDTywgQ0EsIENHLCBQRywgUD4sXG4gICk6IHRoaXM7XG4gIHB1YmxpYyB2ZXJzaW9uT3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcgfCBmYWxzZSxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OlxuICAgICAgfCBJQWN0aW9uPENPLCBDQSwgQ0csIFBHLCBQPlxuICAgICAgfCBJQ29tbWFuZE9wdGlvbjxDTywgQ0EsIENHLCBQRywgUD5cbiAgICAgIHwgSUNvbW1hbmRPcHRpb248UGFydGlhbDxDTz4sIENBLCBDRywgUEcsIFA+ICYgeyBnbG9iYWw6IHRydWUgfSxcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5fdmVyc2lvbk9wdGlvbiA9IGZsYWdzID09PSBmYWxzZSA/IGZsYWdzIDoge1xuICAgICAgZmxhZ3MsXG4gICAgICBkZXNjLFxuICAgICAgb3B0czogdHlwZW9mIG9wdHMgPT09IFwiZnVuY3Rpb25cIiA/IHsgYWN0aW9uOiBvcHRzIH0gOiBvcHRzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogRGlzYWJsZSBoZWxwIG9wdGlvbi4gKi9cbiAgcHVibGljIGhlbHBPcHRpb24oZW5hYmxlOiBmYWxzZSk6IHRoaXM7XG4gIC8qKlxuICAgKiBTZXQgZ2xvYmFsIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBIZWxwIG9wdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIENHLCBQRywgUD4gJiB7IGdsb2JhbDogdHJ1ZSB9LFxuICApOiB0aGlzO1xuICAvKipcbiAgICogU2V0IGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBIZWxwIG9wdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxDTywgQ0EsIENHLCBQRywgUD4sXG4gICk6IHRoaXM7XG4gIC8qKlxuICAgKiBTZXQgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIFRoZSBhY3Rpb24gb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKi9cbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQWN0aW9uPENPLCBDQSwgQ0csIFBHLCBQPixcbiAgKTogdGhpcztcbiAgcHVibGljIGhlbHBPcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyB8IGZhbHNlLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86XG4gICAgICB8IElBY3Rpb248Q08sIENBLCBDRywgUEcsIFA+XG4gICAgICB8IElDb21tYW5kT3B0aW9uPENPLCBDQSwgQ0csIFBHLCBQPlxuICAgICAgfCBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIENHLCBQRywgUD4gJiB7IGdsb2JhbDogdHJ1ZSB9LFxuICApOiB0aGlzIHtcbiAgICB0aGlzLl9oZWxwT3B0aW9uID0gZmxhZ3MgPT09IGZhbHNlID8gZmxhZ3MgOiB7XG4gICAgICBmbGFncyxcbiAgICAgIGRlc2MsXG4gICAgICBvcHRzOiB0eXBlb2Ygb3B0cyA9PT0gXCJmdW5jdGlvblwiID8geyBhY3Rpb246IG9wdHMgfSA6IG9wdHMsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbmV3IHN1Yi1jb21tYW5kLlxuICAgKiBAcGFyYW0gbmFtZSAgICAgIENvbW1hbmQgZGVmaW5pdGlvbi4gRS5nOiBgbXktY29tbWFuZCA8aW5wdXQtZmlsZTpzdHJpbmc+IDxvdXRwdXQtZmlsZTpzdHJpbmc+YFxuICAgKiBAcGFyYW0gY21kICAgICAgIFRoZSBuZXcgY2hpbGQgY29tbWFuZCB0byByZWdpc3Rlci5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyBjaGlsZCBjb21tYW5kLlxuICAgKi9cbiAgcHVibGljIGNvbW1hbmQ8XG4gICAgQyBleHRlbmRzIChDTyBleHRlbmRzIG51bWJlciA/IENvbW1hbmQgOiBDb21tYW5kPFxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIFJlY29yZDxzdHJpbmcsIGFueT4gfCB2b2lkLFxuICAgICAgQXJyYXk8dW5rbm93bj4sXG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQsXG4gICAgICBNZXJnZTxQRywgQ0c+IHwgdm9pZCB8IHVuZGVmaW5lZCxcbiAgICAgIE9uZU9mPFAsIHRoaXM+IHwgdW5kZWZpbmVkXG4gICAgPiksXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNtZDogQyxcbiAgICBvdmVycmlkZT86IGJvb2xlYW4sXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgKTogQyBleHRlbmRzIENvbW1hbmQ8aW5mZXIgTywgaW5mZXIgQSwgaW5mZXIgRywgYW55LCBhbnk+XG4gICAgPyBDb21tYW5kPE8sIEEsIEcsIE1lcmdlPFBHLCBDRz4sIE9uZU9mPFAsIHRoaXM+PlxuICAgIDogbmV2ZXI7XG4gIC8qKlxuICAgKiBBZGQgbmV3IHN1Yi1jb21tYW5kLlxuICAgKiBAcGFyYW0gbmFtZSAgICAgIENvbW1hbmQgZGVmaW5pdGlvbi4gRS5nOiBgbXktY29tbWFuZCA8aW5wdXQtZmlsZTpzdHJpbmc+IDxvdXRwdXQtZmlsZTpzdHJpbmc+YFxuICAgKiBAcGFyYW0gZGVzYyAgICAgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgbmV3IGNoaWxkIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgY2hpbGQgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyBjb21tYW5kPFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgQSBleHRlbmRzIEFycmF5PHVua25vd24+ID0gQXJyYXk8YW55PixcbiAgPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvdmVycmlkZT86IGJvb2xlYW4sXG4gICk6IENvbW1hbmQ8XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBDTyBleHRlbmRzIG51bWJlciA/IGFueSA6IHZvaWQsXG4gICAgTWFwQXJndW1lbnRUeXBlczxBPixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIENPIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdm9pZCxcbiAgICBNZXJnZTxQRywgQ0c+LFxuICAgIE9uZU9mPFAsIHRoaXM+XG4gID47XG4gIC8qKlxuICAgKiBBZGQgbmV3IHN1Yi1jb21tYW5kLlxuICAgKiBAcGFyYW0gbmFtZUFuZEFyZ3VtZW50cyAgQ29tbWFuZCBkZWZpbml0aW9uLiBFLmc6IGBteS1jb21tYW5kIDxpbnB1dC1maWxlOnN0cmluZz4gPG91dHB1dC1maWxlOnN0cmluZz5gXG4gICAqIEBwYXJhbSBjbWRPckRlc2NyaXB0aW9uICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIG5ldyBjaGlsZCBjb21tYW5kLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgICAgICAgICAgT3ZlcnJpZGUgZXhpc3RpbmcgY2hpbGQgY29tbWFuZC5cbiAgICovXG4gIGNvbW1hbmQoXG4gICAgbmFtZUFuZEFyZ3VtZW50czogc3RyaW5nLFxuICAgIGNtZE9yRGVzY3JpcHRpb24/OiBDb21tYW5kIHwgc3RyaW5nLFxuICAgIG92ZXJyaWRlPzogYm9vbGVhbixcbiAgKTogQ29tbWFuZCB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3BsaXRBcmd1bWVudHMobmFtZUFuZEFyZ3VtZW50cyk7XG5cbiAgICBjb25zdCBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQgPSByZXN1bHQuZmxhZ3Muc2hpZnQoKTtcbiAgICBjb25zdCBhbGlhc2VzOiBzdHJpbmdbXSA9IHJlc3VsdC5mbGFncztcblxuICAgIGlmICghbmFtZSkge1xuICAgICAgdGhyb3cgbmV3IE1pc3NpbmdDb21tYW5kTmFtZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmdldEJhc2VDb21tYW5kKG5hbWUsIHRydWUpKSB7XG4gICAgICBpZiAoIW92ZXJyaWRlKSB7XG4gICAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVDb21tYW5kTmFtZShuYW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVtb3ZlQ29tbWFuZChuYW1lKTtcbiAgICB9XG5cbiAgICBsZXQgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgY21kOiBDb21tYW5kO1xuXG4gICAgaWYgKHR5cGVvZiBjbWRPckRlc2NyaXB0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXNjcmlwdGlvbiA9IGNtZE9yRGVzY3JpcHRpb247XG4gICAgfVxuXG4gICAgaWYgKGNtZE9yRGVzY3JpcHRpb24gaW5zdGFuY2VvZiBDb21tYW5kKSB7XG4gICAgICBjbWQgPSBjbWRPckRlc2NyaXB0aW9uLnJlc2V0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNtZCA9IG5ldyBDb21tYW5kKCk7XG4gICAgfVxuXG4gICAgY21kLl9uYW1lID0gbmFtZTtcbiAgICBjbWQuX3BhcmVudCA9IHRoaXM7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgIGNtZC5kZXNjcmlwdGlvbihkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC50eXBlRGVmaW5pdGlvbikge1xuICAgICAgY21kLmFyZ3VtZW50cyhyZXN1bHQudHlwZURlZmluaXRpb24pO1xuICAgIH1cblxuICAgIC8vIGlmIChuYW1lID09PSBcIipcIiAmJiAhY21kLmlzRXhlY3V0YWJsZSkge1xuICAgIC8vICAgY21kLmlzRXhlY3V0YWJsZSA9IHRydWU7XG4gICAgLy8gfVxuXG4gICAgYWxpYXNlcy5mb3JFYWNoKChhbGlhczogc3RyaW5nKSA9PiBjbWQuYWxpYXMoYWxpYXMpKTtcblxuICAgIHRoaXMuY29tbWFuZHMuc2V0KG5hbWUsIGNtZCk7XG5cbiAgICB0aGlzLnNlbGVjdChuYW1lKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcHVibGljIHN0YXRpYyBhc3luYyBleGlzdHMobmFtZTogc3RyaW5nKSB7XG4gIC8vICAgY29uc3QgcHJvYyA9IERlbm8ucnVuKHtcbiAgLy8gICAgIGNtZDogW1wic2hcIiwgXCItY1wiLCBcImNvbXBnZW4gLWNcIl0sXG4gIC8vICAgICBzdGRvdXQ6IFwicGlwZWRcIixcbiAgLy8gICAgIHN0ZGVycjogXCJwaXBlZFwiLFxuICAvLyAgIH0pO1xuICAvLyAgIGNvbnN0IG91dHB1dDogVWludDhBcnJheSA9IGF3YWl0IHByb2Mub3V0cHV0KCk7XG4gIC8vICAgY29uc3QgY29tbWFuZHMgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUob3V0cHV0KVxuICAvLyAgICAgLnRyaW0oKVxuICAvLyAgICAgLnNwbGl0KFwiXFxuXCIpO1xuICAvL1xuICAvLyAgIHJldHVybiBjb21tYW5kcy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBBZGQgbmV3IGNvbW1hbmQgYWxpYXMuXG4gICAqIEBwYXJhbSBhbGlhcyBUaGEgbmFtZSBvZiB0aGUgYWxpYXMuXG4gICAqL1xuICBwdWJsaWMgYWxpYXMoYWxpYXM6IHN0cmluZyk6IHRoaXMge1xuICAgIGlmICh0aGlzLmNtZC5fbmFtZSA9PT0gYWxpYXMgfHwgdGhpcy5jbWQuYWxpYXNlcy5pbmNsdWRlcyhhbGlhcykpIHtcbiAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVDb21tYW5kQWxpYXMoYWxpYXMpO1xuICAgIH1cblxuICAgIHRoaXMuY21kLmFsaWFzZXMucHVzaChhbGlhcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZXNldCBpbnRlcm5hbCBjb21tYW5kIHJlZmVyZW5jZSB0byBtYWluIGNvbW1hbmQuICovXG4gIHB1YmxpYyByZXNldCgpOiBPbmVPZjxQLCB0aGlzPiB7XG4gICAgdGhpcy5jbWQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzIGFzIE9uZU9mPFAsIHRoaXM+O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBpbnRlcm5hbCBjb21tYW5kIHBvaW50ZXIgdG8gY2hpbGQgY29tbWFuZCB3aXRoIGdpdmVuIG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBjb21tYW5kIHRvIHNlbGVjdC5cbiAgICovXG4gIHB1YmxpYyBzZWxlY3Q8XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBPIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gYW55LFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgQSBleHRlbmRzIEFycmF5PHVua25vd24+ID0gYW55LFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgRyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IGFueSxcbiAgPihuYW1lOiBzdHJpbmcpOiBDb21tYW5kPE8sIEEsIEcsIFBHLCBQPiB7XG4gICAgY29uc3QgY21kID0gdGhpcy5nZXRCYXNlQ29tbWFuZChuYW1lLCB0cnVlKTtcblxuICAgIGlmICghY21kKSB7XG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZE5vdEZvdW5kKG5hbWUsIHRoaXMuZ2V0QmFzZUNvbW1hbmRzKHRydWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZCA9IGNtZDtcblxuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQgYXMgQ29tbWFuZDxPLCBBLCBHLCBQRywgUD47XG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKiogU1VCIEhBTkRMRVIgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKiogU2V0IGNvbW1hbmQgbmFtZS4gKi9cbiAgcHVibGljIG5hbWUobmFtZTogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuX25hbWUgPSBuYW1lO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjb21tYW5kIHZlcnNpb24uXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFNlbWFudGljIHZlcnNpb24gc3RyaW5nIHN0cmluZyBvciBtZXRob2QgdGhhdCByZXR1cm5zIHRoZSB2ZXJzaW9uIHN0cmluZy5cbiAgICovXG4gIHB1YmxpYyB2ZXJzaW9uKFxuICAgIHZlcnNpb246XG4gICAgICB8IHN0cmluZ1xuICAgICAgfCBJVmVyc2lvbkhhbmRsZXI8UGFydGlhbDxDTz4sIFBhcnRpYWw8Q0E+LCBDRywgUEc+LFxuICApOiB0aGlzIHtcbiAgICBpZiAodHlwZW9mIHZlcnNpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuY21kLnZlciA9ICgpID0+IHZlcnNpb247XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmVyc2lvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB0aGlzLmNtZC52ZXIgPSB2ZXJzaW9uO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29tbWFuZCBoZWxwLlxuICAgKiBAcGFyYW0gaGVscCBIZWxwIHN0cmluZyBvciBtZXRob2QgdGhhdCByZXR1cm5zIHRoZSBoZWxwIHN0cmluZy5cbiAgICovXG4gIHB1YmxpYyBoZWxwKFxuICAgIGhlbHA6XG4gICAgICB8IHN0cmluZ1xuICAgICAgfCBJSGVscEhhbmRsZXI8UGFydGlhbDxDTz4sIFBhcnRpYWw8Q0E+LCBDRywgUEc+XG4gICAgICB8IEhlbHBPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodHlwZW9mIGhlbHAgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuY21kLl9oZWxwID0gKCkgPT4gaGVscDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBoZWxwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuY21kLl9oZWxwID0gaGVscDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbWQuX2hlbHAgPSAoY21kOiBDb21tYW5kKTogc3RyaW5nID0+XG4gICAgICAgIEhlbHBHZW5lcmF0b3IuZ2VuZXJhdGUoY21kLCBoZWxwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBsb25nIGNvbW1hbmQgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBUaGUgY29tbWFuZCBkZXNjcmlwdGlvbi5cbiAgICovXG4gIHB1YmxpYyBkZXNjcmlwdGlvbihkZXNjcmlwdGlvbjogSURlc2NyaXB0aW9uPENPLCBDQSwgQ0csIFBHLCBQPik6IHRoaXMge1xuICAgIHRoaXMuY21kLmRlc2MgPSBkZXNjcmlwdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIGNvbW1hbmQgZnJvbSBoZWxwLCBjb21wbGV0aW9ucywgZXRjLlxuICAgKi9cbiAgcHVibGljIGhpZGRlbigpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5pc0hpZGRlbiA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogTWFrZSBjb21tYW5kIGdsb2JhbGx5IGF2YWlsYWJsZS4gKi9cbiAgcHVibGljIGdsb2JhbCgpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5pc0dsb2JhbCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogTWFrZSBjb21tYW5kIGV4ZWN1dGFibGUuICovXG4gIHB1YmxpYyBleGVjdXRhYmxlKCk6IHRoaXMge1xuICAgIHRoaXMuY21kLmlzRXhlY3V0YWJsZSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbW1hbmQgYXJndW1lbnRzOlxuICAgKlxuICAgKiAgIDxyZXF1aXJlZEFyZzpzdHJpbmc+IFtvcHRpb25hbEFyZzogbnVtYmVyXSBbLi4ucmVzdEFyZ3M6c3RyaW5nXVxuICAgKi9cbiAgcHVibGljIGFyZ3VtZW50czxBIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBDQT4oXG4gICAgYXJnczogc3RyaW5nLFxuICApOiBDb21tYW5kPENPLCBNYXBBcmd1bWVudFR5cGVzPEE+LCBDRywgUEcsIFA+O1xuICBwdWJsaWMgYXJndW1lbnRzKGFyZ3M6IHN0cmluZyk6IENvbW1hbmQge1xuICAgIHRoaXMuY21kLmFyZ3NEZWZpbml0aW9uID0gYXJncztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29tbWFuZCBjYWxsYmFjayBtZXRob2QuXG4gICAqIEBwYXJhbSBmbiBDb21tYW5kIGFjdGlvbiBoYW5kbGVyLlxuICAgKi9cbiAgcHVibGljIGFjdGlvbihmbjogSUFjdGlvbjxDTywgQ0EsIENHLCBQRywgUD4pOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5mbiA9IGZuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERvbid0IHRocm93IGFuIGVycm9yIGlmIHRoZSBjb21tYW5kIHdhcyBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBhbGxvd0VtcHR5IEVuYWJsZS9kaXNhYmxlIGFsbG93IGVtcHR5LlxuICAgKi9cbiAgcHVibGljIGFsbG93RW1wdHkoYWxsb3dFbXB0eSA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fYWxsb3dFbXB0eSA9IGFsbG93RW1wdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHN0b3AgZWFybHkuIElmIGVuYWJsZWQsIGFsbCBhcmd1bWVudHMgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3Qgbm9uXG4gICAqIG9wdGlvbiBhcmd1bWVudCB3aWxsIGJlIHBhc3NlZCBhcyBhcmd1bWVudHMgd2l0aCB0eXBlIHN0cmluZyB0byB0aGUgY29tbWFuZFxuICAgKiBhY3Rpb24gaGFuZGxlci5cbiAgICpcbiAgICogRm9yIGV4YW1wbGU6XG4gICAqICAgICBgY29tbWFuZCAtLWRlYnVnLWxldmVsIHdhcm5pbmcgc2VydmVyIC0tcG9ydCA4MGBcbiAgICpcbiAgICogV2lsbCByZXN1bHQgaW46XG4gICAqICAgICAtIG9wdGlvbnM6IGB7ZGVidWdMZXZlbDogJ3dhcm5pbmcnfWBcbiAgICogICAgIC0gYXJnczogYFsnc2VydmVyJywgJy0tcG9ydCcsICc4MCddYFxuICAgKlxuICAgKiBAcGFyYW0gc3RvcEVhcmx5IEVuYWJsZS9kaXNhYmxlIHN0b3AgZWFybHkuXG4gICAqL1xuICBwdWJsaWMgc3RvcEVhcmx5KHN0b3BFYXJseSA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fc3RvcEVhcmx5ID0gc3RvcEVhcmx5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgcGFyc2luZyBhcmd1bWVudHMuIElmIGVuYWJsZWQgdGhlIHJhdyBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG9cbiAgICogdGhlIGFjdGlvbiBoYW5kbGVyLiBUaGlzIGhhcyBubyBlZmZlY3QgZm9yIHBhcmVudCBvciBjaGlsZCBjb21tYW5kcy4gT25seVxuICAgKiBmb3IgdGhlIGNvbW1hbmQgb24gd2hpY2ggdGhpcyBtZXRob2Qgd2FzIGNhbGxlZC5cbiAgICogQHBhcmFtIHVzZVJhd0FyZ3MgRW5hYmxlL2Rpc2FibGUgcmF3IGFyZ3VtZW50cy5cbiAgICovXG4gIHB1YmxpYyB1c2VSYXdBcmdzKHVzZVJhd0FyZ3MgPSB0cnVlKTogQ29tbWFuZDxDTywgQXJyYXk8c3RyaW5nPiwgQ0csIFBHLCBQPiB7XG4gICAgdGhpcy5jbWQuX3VzZVJhd0FyZ3MgPSB1c2VSYXdBcmdzO1xuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8Q08sIEFycmF5PHN0cmluZz4sIENHLCBQRywgUD47XG4gIH1cblxuICAvKipcbiAgICogU2V0IGRlZmF1bHQgY29tbWFuZC4gVGhlIGRlZmF1bHQgY29tbWFuZCBpcyBleGVjdXRlZCB3aGVuIHRoZSBwcm9ncmFtXG4gICAqIHdhcyBjYWxsZWQgd2l0aG91dCBhbnkgYXJndW1lbnQgYW5kIGlmIG5vIGFjdGlvbiBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGRlZmF1bHQgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyBkZWZhdWx0KG5hbWU6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuY21kLmRlZmF1bHRDb21tYW5kID0gbmFtZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBnbG9iYWxUeXBlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBUeXBlPHVua25vd24+IHwgSVR5cGVIYW5kbGVyPHVua25vd24+LFxuICAgIG9wdGlvbnM/OiBPbWl0PElUeXBlT3B0aW9ucywgXCJnbG9iYWxcIj4sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLnR5cGUobmFtZSwgdHlwZSwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY3VzdG9tIHR5cGUuXG4gICAqIEBwYXJhbSBuYW1lICAgIFRoZSBuYW1lIG9mIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gaGFuZGxlciBUaGUgY2FsbGJhY2sgbWV0aG9kIHRvIHBhcnNlIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUeXBlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgdHlwZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaGFuZGxlcjogVHlwZTx1bmtub3duPiB8IElUeXBlSGFuZGxlcjx1bmtub3duPixcbiAgICBvcHRpb25zPzogSVR5cGVPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQudHlwZXMuZ2V0KG5hbWUpICYmICFvcHRpb25zPy5vdmVycmlkZSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZVR5cGUobmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQudHlwZXMuc2V0KG5hbWUsIHsgLi4ub3B0aW9ucywgbmFtZSwgaGFuZGxlciB9KTtcblxuICAgIGlmIChcbiAgICAgIGhhbmRsZXIgaW5zdGFuY2VvZiBUeXBlICYmXG4gICAgICAodHlwZW9mIGhhbmRsZXIuY29tcGxldGUgIT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICAgdHlwZW9mIGhhbmRsZXIudmFsdWVzICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICkge1xuICAgICAgY29uc3QgY29tcGxldGVIYW5kbGVyOiBJQ29tcGxldGVIYW5kbGVyID0gKFxuICAgICAgICBjbWQ6IENvbW1hbmQsXG4gICAgICAgIHBhcmVudD86IENvbW1hbmQsXG4gICAgICApID0+IGhhbmRsZXIuY29tcGxldGU/LihjbWQsIHBhcmVudCkgfHwgW107XG4gICAgICB0aGlzLmNvbXBsZXRlKG5hbWUsIGNvbXBsZXRlSGFuZGxlciwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgZ2xvYmFsQ29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbXBsZXRlOiBJQ29tcGxldGVIYW5kbGVyLFxuICAgIG9wdGlvbnM/OiBPbWl0PElDb21wbGV0ZU9wdGlvbnMsIFwiZ2xvYmFsXCI+LFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5jb21wbGV0ZShuYW1lLCBjb21wbGV0ZSwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY29tbWFuZCBzcGVjaWZpYyBjdXN0b20gdHlwZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICBUaGUgbmFtZSBvZiB0aGUgY29tcGxldGlvbi5cbiAgICogQHBhcmFtIGNvbXBsZXRlICBUaGUgY2FsbGJhY2sgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgIENvbXBsZXRlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8UGFydGlhbDxDTz4sIFBhcnRpYWw8Q0E+LCBDRywgUEcsIGFueT4sXG4gICAgb3B0aW9uczogSUNvbXBsZXRlT3B0aW9ucyAmIHsgZ2xvYmFsOiBib29sZWFuIH0sXG4gICk6IHRoaXM7XG4gIHB1YmxpYyBjb21wbGV0ZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8Q08sIENBLCBDRywgUEcsIFA+LFxuICAgIG9wdGlvbnM/OiBJQ29tcGxldGVPcHRpb25zLFxuICApOiB0aGlzO1xuICBjb21wbGV0ZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8Q08sIENBLCBDRywgUEcsIFA+LFxuICAgIG9wdGlvbnM/OiBJQ29tcGxldGVPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQuY29tcGxldGlvbnMuaGFzKG5hbWUpICYmICFvcHRpb25zPy5vdmVycmlkZSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUNvbXBsZXRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuY29tcGxldGlvbnMuc2V0KG5hbWUsIHtcbiAgICAgIG5hbWUsXG4gICAgICBjb21wbGV0ZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvdyB2YWxpZGF0aW9uIGVycm9yJ3MgaW5zdGVhZCBvZiBjYWxsaW5nIGBEZW5vLmV4aXQoKWAgdG8gaGFuZGxlXG4gICAqIHZhbGlkYXRpb24gZXJyb3IncyBtYW51YWxseS5cbiAgICpcbiAgICogQSB2YWxpZGF0aW9uIGVycm9yIGlzIHRocm93biB3aGVuIHRoZSBjb21tYW5kIGlzIHdyb25nbHkgdXNlZCBieSB0aGUgdXNlci5cbiAgICogRm9yIGV4YW1wbGU6IElmIHRoZSB1c2VyIHBhc3NlcyBzb21lIGludmFsaWQgb3B0aW9ucyBvciBhcmd1bWVudHMgdG8gdGhlXG4gICAqIGNvbW1hbmQuXG4gICAqXG4gICAqIFRoaXMgaGFzIG5vIGVmZmVjdCBmb3IgcGFyZW50IGNvbW1hbmRzLiBPbmx5IGZvciB0aGUgY29tbWFuZCBvbiB3aGljaCB0aGlzXG4gICAqIG1ldGhvZCB3YXMgY2FsbGVkIGFuZCBhbGwgY2hpbGQgY29tbWFuZHMuXG4gICAqXG4gICAqICoqRXhhbXBsZToqKlxuICAgKlxuICAgKiBgYGBcbiAgICogdHJ5IHtcbiAgICogICBjbWQucGFyc2UoKTtcbiAgICogfSBjYXRjaChlcnJvcikge1xuICAgKiAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgKiAgICAgY21kLnNob3dIZWxwKCk7XG4gICAqICAgICBEZW5vLmV4aXQoMSk7XG4gICAqICAgfVxuICAgKiAgIHRocm93IGVycm9yO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAc2VlIFZhbGlkYXRpb25FcnJvclxuICAgKi9cbiAgcHVibGljIHRocm93RXJyb3JzKCk6IHRoaXMge1xuICAgIHRoaXMuY21kLnRocm93T25FcnJvciA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQ2hlY2sgd2hldGhlciB0aGUgY29tbWFuZCBzaG91bGQgdGhyb3cgZXJyb3JzIG9yIGV4aXQuICovXG4gIHByb3RlY3RlZCBzaG91bGRUaHJvd0Vycm9ycygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jbWQudGhyb3dPbkVycm9yIHx8ICEhdGhpcy5jbWQuX3BhcmVudD8uc2hvdWxkVGhyb3dFcnJvcnMoKTtcbiAgfVxuXG4gIHB1YmxpYyBnbG9iYWxPcHRpb248RyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IENHPihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgIHwgT21pdDxcbiAgICAgICAgSUNvbW1hbmRPcHRpb248UGFydGlhbDxDTz4sIENBLCBNZXJnZTxDRywgTWFwT3B0aW9uVHlwZXM8Rz4+LCBQRywgUD4sXG4gICAgICAgIFwiZ2xvYmFsXCJcbiAgICAgID5cbiAgICAgIHwgSUZsYWdWYWx1ZUhhbmRsZXIsXG4gICk6IENvbW1hbmQ8Q08sIENBLCBNZXJnZTxDRywgTWFwT3B0aW9uVHlwZXM8Rz4+LCBQRywgUD4ge1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb24oZmxhZ3MsIGRlc2MsIHsgdmFsdWU6IG9wdHMsIGdsb2JhbDogdHJ1ZSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uKGZsYWdzLCBkZXNjLCB7IC4uLm9wdHMsIGdsb2JhbDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBuZXcgb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgRmxhZ3Mgc3RyaW5nIGxpa2U6IC1oLCAtLWhlbHAsIC0tbWFudWFsIDxyZXF1aXJlZEFyZzpzdHJpbmc+IFtvcHRpb25hbEFyZzogbnVtYmVyXSBbLi4ucmVzdEFyZ3M6c3RyaW5nXVxuICAgKiBAcGFyYW0gZGVzYyBGbGFnIGRlc2NyaXB0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyBGbGFnIG9wdGlvbnMgb3IgY3VzdG9tIGhhbmRsZXIgZm9yIHByb2Nlc3NpbmcgZmxhZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBvcHRpb248RyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IENHPihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzOlxuICAgICAgfCBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIE1lcmdlPENHLCBNYXBPcHRpb25UeXBlczxHPj4sIFBHLCBQPiAmIHtcbiAgICAgICAgZ2xvYmFsOiB0cnVlO1xuICAgICAgfVxuICAgICAgfCBJRmxhZ1ZhbHVlSGFuZGxlcixcbiAgKTogQ29tbWFuZDxDTywgQ0EsIE1lcmdlPENHLCBNYXBPcHRpb25UeXBlczxHPj4sIFBHLCBQPjtcbiAgcHVibGljIG9wdGlvbjxPIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gQ08+KFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIG9wdHM/OlxuICAgICAgfCBJQ29tbWFuZE9wdGlvbjxNZXJnZTxDTywgTWFwT3B0aW9uVHlwZXM8Tz4+LCBDQSwgQ0csIFBHLCBQPlxuICAgICAgfCBJRmxhZ1ZhbHVlSGFuZGxlcixcbiAgKTogQ29tbWFuZDxNZXJnZTxDTywgTWFwT3B0aW9uVHlwZXM8Tz4+LCBDQSwgQ0csIFBHLCBQPjtcbiAgcHVibGljIG9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBvcHRzPzogSUNvbW1hbmRPcHRpb24gfCBJRmxhZ1ZhbHVlSGFuZGxlcixcbiAgKTogQ29tbWFuZCB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbihmbGFncywgZGVzYywgeyB2YWx1ZTogb3B0cyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBzcGxpdEFyZ3VtZW50cyhmbGFncyk7XG5cbiAgICBjb25zdCBhcmdzOiBJQXJndW1lbnRbXSA9IHJlc3VsdC50eXBlRGVmaW5pdGlvblxuICAgICAgPyBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24ocmVzdWx0LnR5cGVEZWZpbml0aW9uKVxuICAgICAgOiBbXTtcblxuICAgIGNvbnN0IG9wdGlvbjogSU9wdGlvbiA9IHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBuYW1lOiBcIlwiLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2MsXG4gICAgICBhcmdzLFxuICAgICAgZmxhZ3M6IHJlc3VsdC5mbGFncyxcbiAgICAgIHR5cGVEZWZpbml0aW9uOiByZXN1bHQudHlwZURlZmluaXRpb24sXG4gICAgfTtcblxuICAgIGlmIChvcHRpb24uc2VwYXJhdG9yKSB7XG4gICAgICBmb3IgKGNvbnN0IGFyZyBvZiBhcmdzKSB7XG4gICAgICAgIGlmIChhcmcubGlzdCkge1xuICAgICAgICAgIGFyZy5zZXBhcmF0b3IgPSBvcHRpb24uc2VwYXJhdG9yO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIG9wdGlvbi5mbGFncykge1xuICAgICAgY29uc3QgYXJnID0gcGFydC50cmltKCk7XG4gICAgICBjb25zdCBpc0xvbmcgPSAvXi0tLy50ZXN0KGFyZyk7XG4gICAgICBjb25zdCBuYW1lID0gaXNMb25nID8gYXJnLnNsaWNlKDIpIDogYXJnLnNsaWNlKDEpO1xuXG4gICAgICBpZiAodGhpcy5jbWQuZ2V0QmFzZU9wdGlvbihuYW1lLCB0cnVlKSkge1xuICAgICAgICBpZiAob3B0cz8ub3ZlcnJpZGUpIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZU9wdGlvbihuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRHVwbGljYXRlT3B0aW9uTmFtZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbi5uYW1lICYmIGlzTG9uZykge1xuICAgICAgICBvcHRpb24ubmFtZSA9IG5hbWU7XG4gICAgICB9IGVsc2UgaWYgKCFvcHRpb24uYWxpYXNlcykge1xuICAgICAgICBvcHRpb24uYWxpYXNlcyA9IFtuYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbi5hbGlhc2VzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbi5wcmVwZW5kKSB7XG4gICAgICB0aGlzLmNtZC5vcHRpb25zLnVuc2hpZnQob3B0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbWQub3B0aW9ucy5wdXNoKG9wdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkIG5ldyBjb21tYW5kIGV4YW1wbGUuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgICAgIE5hbWUgb2YgdGhlIGV4YW1wbGUuXG4gICAqIEBwYXJhbSBkZXNjcmlwdGlvbiAgIFRoZSBjb250ZW50IG9mIHRoZSBleGFtcGxlLlxuICAgKi9cbiAgcHVibGljIGV4YW1wbGUobmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuY21kLmhhc0V4YW1wbGUobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVFeGFtcGxlKG5hbWUpO1xuICAgIH1cblxuICAgIHRoaXMuY21kLmV4YW1wbGVzLnB1c2goeyBuYW1lLCBkZXNjcmlwdGlvbiB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIGdsb2JhbEVudihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBvcHRpb25zPzogT21pdDxJRW52VmFyT3B0aW9ucywgXCJnbG9iYWxcIj4sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLmVudihuYW1lLCBkZXNjcmlwdGlvbiwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIG5ldyBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICAgICAgTmFtZSBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBkZXNjcmlwdGlvbiAgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBvcHRpb25zICAgICAgIEVudmlyb25tZW50IHZhcmlhYmxlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZW52KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBJRW52VmFyT3B0aW9ucyxcbiAgKTogdGhpcyB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3BsaXRBcmd1bWVudHMobmFtZSk7XG5cbiAgICBpZiAoIXJlc3VsdC50eXBlRGVmaW5pdGlvbikge1xuICAgICAgcmVzdWx0LnR5cGVEZWZpbml0aW9uID0gXCI8dmFsdWU6Ym9vbGVhbj5cIjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LmZsYWdzLnNvbWUoKGVudk5hbWUpID0+IHRoaXMuY21kLmdldEJhc2VFbnZWYXIoZW52TmFtZSwgdHJ1ZSkpKSB7XG4gICAgICB0aHJvdyBuZXcgRHVwbGljYXRlRW52aXJvbm1lbnRWYXJpYWJsZShuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXRhaWxzOiBJQXJndW1lbnRbXSA9IHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbihcbiAgICAgIHJlc3VsdC50eXBlRGVmaW5pdGlvbixcbiAgICApO1xuXG4gICAgaWYgKGRldGFpbHMubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVudmlyb25tZW50VmFyaWFibGVTaW5nbGVWYWx1ZShuYW1lKTtcbiAgICB9IGVsc2UgaWYgKGRldGFpbHMubGVuZ3RoICYmIGRldGFpbHNbMF0ub3B0aW9uYWxWYWx1ZSkge1xuICAgICAgdGhyb3cgbmV3IEVudmlyb25tZW50VmFyaWFibGVPcHRpb25hbFZhbHVlKG5hbWUpO1xuICAgIH0gZWxzZSBpZiAoZGV0YWlscy5sZW5ndGggJiYgZGV0YWlsc1swXS52YXJpYWRpYykge1xuICAgICAgdGhyb3cgbmV3IEVudmlyb25tZW50VmFyaWFibGVWYXJpYWRpY1ZhbHVlKG5hbWUpO1xuICAgIH1cblxuICAgIHRoaXMuY21kLmVudlZhcnMucHVzaCh7XG4gICAgICBuYW1lOiByZXN1bHQuZmxhZ3NbMF0sXG4gICAgICBuYW1lczogcmVzdWx0LmZsYWdzLFxuICAgICAgZGVzY3JpcHRpb24sXG4gICAgICB0eXBlOiBkZXRhaWxzWzBdLnR5cGUsXG4gICAgICBkZXRhaWxzOiBkZXRhaWxzLnNoaWZ0KCkgYXMgSUFyZ3VtZW50LFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqKioqIE1BSU4gSEFORExFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFBhcnNlIGNvbW1hbmQgbGluZSBhcmd1bWVudHMgYW5kIGV4ZWN1dGUgbWF0Y2hlZCBjb21tYW5kLlxuICAgKiBAcGFyYW0gYXJncyBDb21tYW5kIGxpbmUgYXJncyB0byBwYXJzZS4gRXg6IGBjbWQucGFyc2UoIERlbm8uYXJncyApYFxuICAgKiBAcGFyYW0gZHJ5IEV4ZWN1dGUgY29tbWFuZCBhZnRlciBwYXJzZWQuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgcGFyc2UoXG4gICAgYXJnczogc3RyaW5nW10gPSBEZW5vLmFyZ3MsXG4gICAgZHJ5PzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTxJUGFyc2VSZXN1bHQ8Q08sIENBLCBDRywgUEcsIFA+PiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHRoaXMucmVnaXN0ZXJEZWZhdWx0cygpO1xuICAgICAgdGhpcy5yYXdBcmdzID0gYXJncztcbiAgICAgIGNvbnN0IHN1YkNvbW1hbmQgPSBhcmdzLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgdGhpcy5nZXRDb21tYW5kKGFyZ3NbMF0sIHRydWUpO1xuXG4gICAgICBpZiAoc3ViQ29tbWFuZCkge1xuICAgICAgICBzdWJDb21tYW5kLl9nbG9iYWxQYXJlbnQgPSB0aGlzO1xuICAgICAgICByZXR1cm4gYXdhaXQgc3ViQ29tbWFuZC5wYXJzZShcbiAgICAgICAgICB0aGlzLnJhd0FyZ3Muc2xpY2UoMSksXG4gICAgICAgICAgZHJ5LFxuICAgICAgICApIGFzIElQYXJzZVJlc3VsdDxDTywgQ0EsIENHLCBQRywgUD47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdDogSVBhcnNlUmVzdWx0PENPLCBDQSwgQ0csIFBHLCBQPiA9IHtcbiAgICAgICAgb3B0aW9uczoge30gYXMgUEcgJiBDRyAmIENPLFxuICAgICAgICBhcmdzOiB0aGlzLnJhd0FyZ3MgYXMgQ0EsXG4gICAgICAgIGNtZDogdGhpcyxcbiAgICAgICAgbGl0ZXJhbDogdGhpcy5saXRlcmFsQXJncyxcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLmlzRXhlY3V0YWJsZSkge1xuICAgICAgICBpZiAoIWRyeSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUV4ZWN1dGFibGUodGhpcy5yYXdBcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3VzZVJhd0FyZ3MpIHtcbiAgICAgICAgaWYgKGRyeSkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlKHt9IGFzIFBHICYgQ0cgJiBDTywgLi4udGhpcy5yYXdBcmdzIGFzIENBKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uLCBmbGFncywgdW5rbm93biwgbGl0ZXJhbCB9ID0gdGhpcy5wYXJzZUZsYWdzKFxuICAgICAgICAgIHRoaXMucmF3QXJncyxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmxpdGVyYWxBcmdzID0gbGl0ZXJhbDtcblxuICAgICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLnBhcnNlQXJndW1lbnRzKHVua25vd24sIGZsYWdzKTtcblxuICAgICAgICBhd2FpdCB0aGlzLnZhbGlkYXRlRW52VmFycygpO1xuXG4gICAgICAgIGlmIChkcnkgfHwgYWN0aW9uKSB7XG4gICAgICAgICAgaWYgKGFjdGlvbikge1xuICAgICAgICAgICAgYXdhaXQgYWN0aW9uLmNhbGwodGhpcywgZmxhZ3MsIC4uLnBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvcHRpb25zOiBmbGFncyBhcyBQRyAmIENHICYgQ08sXG4gICAgICAgICAgICBhcmdzOiBwYXJhbXMsXG4gICAgICAgICAgICBjbWQ6IHRoaXMsXG4gICAgICAgICAgICBsaXRlcmFsOiB0aGlzLmxpdGVyYWxBcmdzLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlKGZsYWdzIGFzIFBHICYgQ0cgJiBDTywgLi4ucGFyYW1zKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgdGhpcy5lcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIGRlZmF1bHQgb3B0aW9ucyBsaWtlIGAtLXZlcnNpb25gIGFuZCBgLS1oZWxwYC4gKi9cbiAgcHJpdmF0ZSByZWdpc3RlckRlZmF1bHRzKCk6IHRoaXMge1xuICAgIGlmICh0aGlzLmhhc0RlZmF1bHRzIHx8IHRoaXMuZ2V0UGFyZW50KCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB0aGlzLmhhc0RlZmF1bHRzID0gdHJ1ZTtcblxuICAgIHRoaXMucmVzZXQoKTtcblxuICAgICF0aGlzLnR5cGVzLmhhcyhcInN0cmluZ1wiKSAmJlxuICAgICAgdGhpcy50eXBlKFwic3RyaW5nXCIsIG5ldyBTdHJpbmdUeXBlKCksIHsgZ2xvYmFsOiB0cnVlIH0pO1xuICAgICF0aGlzLnR5cGVzLmhhcyhcIm51bWJlclwiKSAmJlxuICAgICAgdGhpcy50eXBlKFwibnVtYmVyXCIsIG5ldyBOdW1iZXJUeXBlKCksIHsgZ2xvYmFsOiB0cnVlIH0pO1xuICAgICF0aGlzLnR5cGVzLmhhcyhcImludGVnZXJcIikgJiZcbiAgICAgIHRoaXMudHlwZShcImludGVnZXJcIiwgbmV3IEludGVnZXJUeXBlKCksIHsgZ2xvYmFsOiB0cnVlIH0pO1xuICAgICF0aGlzLnR5cGVzLmhhcyhcImJvb2xlYW5cIikgJiZcbiAgICAgIHRoaXMudHlwZShcImJvb2xlYW5cIiwgbmV3IEJvb2xlYW5UeXBlKCksIHsgZ2xvYmFsOiB0cnVlIH0pO1xuXG4gICAgaWYgKCF0aGlzLl9oZWxwKSB7XG4gICAgICB0aGlzLmhlbHAoe1xuICAgICAgICBoaW50czogdHJ1ZSxcbiAgICAgICAgdHlwZXM6IGZhbHNlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3ZlcnNpb25PcHRpb24gIT09IGZhbHNlICYmICh0aGlzLl92ZXJzaW9uT3B0aW9uIHx8IHRoaXMudmVyKSkge1xuICAgICAgdGhpcy5vcHRpb24oXG4gICAgICAgIHRoaXMuX3ZlcnNpb25PcHRpb24/LmZsYWdzIHx8IFwiLVYsIC0tdmVyc2lvblwiLFxuICAgICAgICB0aGlzLl92ZXJzaW9uT3B0aW9uPy5kZXNjIHx8XG4gICAgICAgICAgXCJTaG93IHRoZSB2ZXJzaW9uIG51bWJlciBmb3IgdGhpcyBwcm9ncmFtLlwiLFxuICAgICAgICB7XG4gICAgICAgICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgICAgICAgICBwcmVwZW5kOiB0cnVlLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zaG93VmVyc2lvbigpO1xuICAgICAgICAgICAgRGVuby5leGl0KDApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgLi4uKHRoaXMuX3ZlcnNpb25PcHRpb24/Lm9wdHMgPz8ge30pLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faGVscE9wdGlvbiAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMub3B0aW9uKFxuICAgICAgICB0aGlzLl9oZWxwT3B0aW9uPy5mbGFncyB8fCBcIi1oLCAtLWhlbHBcIixcbiAgICAgICAgdGhpcy5faGVscE9wdGlvbj8uZGVzYyB8fCBcIlNob3cgdGhpcyBoZWxwLlwiLFxuICAgICAgICB7XG4gICAgICAgICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgICAgICAgICBnbG9iYWw6IHRydWUsXG4gICAgICAgICAgcHJlcGVuZDogdHJ1ZSxcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0hlbHAoKTtcbiAgICAgICAgICAgIERlbm8uZXhpdCgwKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIC4uLih0aGlzLl9oZWxwT3B0aW9uPy5vcHRzID8/IHt9KSxcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBjb21tYW5kLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBIG1hcCBvZiBvcHRpb25zLlxuICAgKiBAcGFyYW0gYXJncyBDb21tYW5kIGFyZ3VtZW50cy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBleGVjdXRlKFxuICAgIG9wdGlvbnM6IFBHICYgQ0cgJiBDTyxcbiAgICAuLi5hcmdzOiBDQVxuICApOiBQcm9taXNlPElQYXJzZVJlc3VsdDxDTywgQ0EsIENHLCBQRywgUD4+IHtcbiAgICBpZiAodGhpcy5mbikge1xuICAgICAgYXdhaXQgdGhpcy5mbihvcHRpb25zLCAuLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdENvbW1hbmQpIHtcbiAgICAgIGNvbnN0IGNtZCA9IHRoaXMuZ2V0Q29tbWFuZCh0aGlzLmRlZmF1bHRDb21tYW5kLCB0cnVlKTtcblxuICAgICAgaWYgKCFjbWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IERlZmF1bHRDb21tYW5kTm90Rm91bmQoXG4gICAgICAgICAgdGhpcy5kZWZhdWx0Q29tbWFuZCxcbiAgICAgICAgICB0aGlzLmdldENvbW1hbmRzKCksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNtZC5fZ2xvYmFsUGFyZW50ID0gdGhpcztcbiAgICAgIGF3YWl0IGNtZC5leGVjdXRlKG9wdGlvbnMsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7IG9wdGlvbnMsIGFyZ3MsIGNtZDogdGhpcywgbGl0ZXJhbDogdGhpcy5saXRlcmFsQXJncyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgZXh0ZXJuYWwgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBhcmdzIFJhdyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGV4ZWN1dGVFeGVjdXRhYmxlKGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgY29uc3QgcGVybWlzc2lvbnMgPSBhd2FpdCBnZXRQZXJtaXNzaW9ucygpO1xuICAgIGlmICghcGVybWlzc2lvbnMucmVhZCkge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIGF3YWl0IChEZW5vIGFzIGFueSkucGVybWlzc2lvbnM/LnJlcXVlc3QoeyBuYW1lOiBcInJlYWRcIiB9KTtcbiAgICB9XG4gICAgaWYgKCFwZXJtaXNzaW9ucy5ydW4pIHtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBhd2FpdCAoRGVubyBhcyBhbnkpLnBlcm1pc3Npb25zPy5yZXF1ZXN0KHsgbmFtZTogXCJydW5cIiB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBbbWFpbiwgLi4ubmFtZXNdID0gdGhpcy5nZXRQYXRoKCkuc3BsaXQoXCIgXCIpO1xuXG4gICAgbmFtZXMudW5zaGlmdChtYWluLnJlcGxhY2UoL1xcLnRzJC8sIFwiXCIpKTtcblxuICAgIGNvbnN0IGV4ZWN1dGFibGVOYW1lID0gbmFtZXMuam9pbihcIi1cIik7XG4gICAgY29uc3QgZmlsZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IChEZW5vIGFzIGFueSkubWFpbk1vZHVsZS5yZXBsYWNlKC9eZmlsZTpcXC9cXC8vZywgXCJcIilcbiAgICAgIC5zcGxpdChcIi9cIik7XG4gICAgaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiICYmIHBhcnRzWzBdID09PSBcIlwiKSB7XG4gICAgICBwYXJ0cy5zaGlmdCgpO1xuICAgIH1cbiAgICBwYXJ0cy5wb3AoKTtcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBwYXJ0cy5qb2luKFwiL1wiKTtcbiAgICBmaWxlcy5wdXNoKFxuICAgICAgcGF0aCArIFwiL1wiICsgZXhlY3V0YWJsZU5hbWUsXG4gICAgICBwYXRoICsgXCIvXCIgKyBleGVjdXRhYmxlTmFtZSArIFwiLnRzXCIsXG4gICAgKTtcblxuICAgIGZpbGVzLnB1c2goXG4gICAgICBleGVjdXRhYmxlTmFtZSxcbiAgICAgIGV4ZWN1dGFibGVOYW1lICsgXCIudHNcIixcbiAgICApO1xuXG4gICAgY29uc3QgZGVub09wdHMgPSBbXTtcblxuICAgIGlmIChpc1Vuc3RhYmxlKCkpIHtcbiAgICAgIGRlbm9PcHRzLnB1c2goXCItLXVuc3RhYmxlXCIpO1xuICAgIH1cblxuICAgIGRlbm9PcHRzLnB1c2goXG4gICAgICBcIi0tYWxsb3ctcmVhZFwiLFxuICAgICAgXCItLWFsbG93LXJ1blwiLFxuICAgICk7XG5cbiAgICAoT2JqZWN0LmtleXMocGVybWlzc2lvbnMpIGFzIFBlcm1pc3Npb25OYW1lW10pXG4gICAgICAuZm9yRWFjaCgobmFtZTogUGVybWlzc2lvbk5hbWUpID0+IHtcbiAgICAgICAgaWYgKG5hbWUgPT09IFwicmVhZFwiIHx8IG5hbWUgPT09IFwicnVuXCIpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBlcm1pc3Npb25zW25hbWVdKSB7XG4gICAgICAgICAgZGVub09wdHMucHVzaChgLS1hbGxvdy0ke25hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBEZW5vLmxzdGF0U3luYyhmaWxlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNtZCA9IFtcImRlbm9cIiwgXCJydW5cIiwgLi4uZGVub09wdHMsIGZpbGUsIC4uLmFyZ3NdO1xuXG4gICAgICBjb25zdCBwcm9jZXNzOiBEZW5vLlByb2Nlc3MgPSBEZW5vLnJ1bih7XG4gICAgICAgIGNtZDogY21kLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHN0YXR1czogRGVuby5Qcm9jZXNzU3RhdHVzID0gYXdhaXQgcHJvY2Vzcy5zdGF0dXMoKTtcblxuICAgICAgaWYgKCFzdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICBEZW5vLmV4aXQoc3RhdHVzLmNvZGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IENvbW1hbmRFeGVjdXRhYmxlTm90Rm91bmQoZXhlY3V0YWJsZU5hbWUsIGZpbGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSByYXcgY29tbWFuZCBsaW5lIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIGFyZ3MgUmF3IGNvbW1hbmQgbGluZSBhcmd1bWVudHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgcGFyc2VGbGFncyhcbiAgICBhcmdzOiBzdHJpbmdbXSxcbiAgKTogSUZsYWdzUmVzdWx0ICYgeyBhY3Rpb24/OiBJQWN0aW9uIH0ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgYWN0aW9uOiBJQWN0aW9uIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VGbGFncyhhcmdzLCB7XG4gICAgICAgIHN0b3BFYXJseTogdGhpcy5fc3RvcEVhcmx5LFxuICAgICAgICBhbGxvd0VtcHR5OiB0aGlzLl9hbGxvd0VtcHR5LFxuICAgICAgICBmbGFnczogdGhpcy5nZXRPcHRpb25zKHRydWUpLFxuICAgICAgICBwYXJzZTogKHR5cGU6IElUeXBlSW5mbykgPT4gdGhpcy5wYXJzZVR5cGUodHlwZSksXG4gICAgICAgIG9wdGlvbjogKG9wdGlvbjogSUZsYWdPcHRpb25zKSA9PiB7XG4gICAgICAgICAgaWYgKCFhY3Rpb24gJiYgKG9wdGlvbiBhcyBJT3B0aW9uKS5hY3Rpb24pIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IChvcHRpb24gYXMgSU9wdGlvbikuYWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgLi4ucmVzdWx0LCBhY3Rpb24gfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRmxhZ3NWYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihlcnJvci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBQYXJzZSBhcmd1bWVudCB0eXBlLiAqL1xuICBwcm90ZWN0ZWQgcGFyc2VUeXBlKHR5cGU6IElUeXBlSW5mbyk6IHVua25vd24ge1xuICAgIGNvbnN0IHR5cGVTZXR0aW5nczogSVR5cGUgfCB1bmRlZmluZWQgPSB0aGlzLmdldFR5cGUodHlwZS50eXBlKTtcblxuICAgIGlmICghdHlwZVNldHRpbmdzKSB7XG4gICAgICB0aHJvdyBuZXcgVW5rbm93blR5cGUoXG4gICAgICAgIHR5cGUudHlwZSxcbiAgICAgICAgdGhpcy5nZXRUeXBlcygpLm1hcCgodHlwZSkgPT4gdHlwZS5uYW1lKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVTZXR0aW5ncy5oYW5kbGVyIGluc3RhbmNlb2YgVHlwZVxuICAgICAgPyB0eXBlU2V0dGluZ3MuaGFuZGxlci5wYXJzZSh0eXBlKVxuICAgICAgOiB0eXBlU2V0dGluZ3MuaGFuZGxlcih0eXBlKTtcbiAgfVxuXG4gIC8qKiBWYWxpZGF0ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuICovXG4gIHByb3RlY3RlZCBhc3luYyB2YWxpZGF0ZUVudlZhcnMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFhd2FpdCBoYXNQZXJtaXNzaW9uKFwiZW52XCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZW52VmFycyA9IHRoaXMuZ2V0RW52VmFycyh0cnVlKTtcblxuICAgIGlmICghZW52VmFycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbnZWYXJzLmZvckVhY2goKGVudjogSUVudlZhcikgPT4ge1xuICAgICAgY29uc3QgbmFtZSA9IGVudi5uYW1lcy5maW5kKChuYW1lKSA9PiAhIURlbm8uZW52LmdldChuYW1lKSk7XG4gICAgICBpZiAobmFtZSkge1xuICAgICAgICB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgbGFiZWw6IFwiRW52aXJvbm1lbnQgdmFyaWFibGVcIixcbiAgICAgICAgICB0eXBlOiBlbnYudHlwZSxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHZhbHVlOiBEZW5vLmVudi5nZXQobmFtZSkgPz8gXCJcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgY29tbWFuZC1saW5lIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIGFyZ3MgIFJhdyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICAgKiBAcGFyYW0gZmxhZ3MgUGFyc2VkIGNvbW1hbmQgbGluZSBvcHRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIHBhcnNlQXJndW1lbnRzKGFyZ3M6IHN0cmluZ1tdLCBmbGFnczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBDQSB7XG4gICAgY29uc3QgcGFyYW1zOiBBcnJheTx1bmtub3duPiA9IFtdO1xuXG4gICAgLy8gcmVtb3ZlIGFycmF5IHJlZmVyZW5jZVxuICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDApO1xuXG4gICAgaWYgKCF0aGlzLmhhc0FyZ3VtZW50cygpKSB7XG4gICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzQ29tbWFuZHModHJ1ZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbW1hbmQoYXJnc1swXSwgdGhpcy5nZXRDb21tYW5kcygpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTm9Bcmd1bWVudHNBbGxvd2VkKHRoaXMuZ2V0UGF0aCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkID0gdGhpcy5nZXRBcmd1bWVudHMoKVxuICAgICAgICAgIC5maWx0ZXIoKGV4cGVjdGVkQXJnKSA9PiAhZXhwZWN0ZWRBcmcub3B0aW9uYWxWYWx1ZSlcbiAgICAgICAgICAubWFwKChleHBlY3RlZEFyZykgPT4gZXhwZWN0ZWRBcmcubmFtZSk7XG5cbiAgICAgICAgaWYgKHJlcXVpcmVkLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IGZsYWdOYW1lczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhmbGFncyk7XG4gICAgICAgICAgY29uc3QgaGFzU3RhbmRhbG9uZU9wdGlvbiA9ICEhZmxhZ05hbWVzLmZpbmQoKG5hbWUpID0+XG4gICAgICAgICAgICB0aGlzLmdldE9wdGlvbihuYW1lLCB0cnVlKT8uc3RhbmRhbG9uZVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoIWhhc1N0YW5kYWxvbmVPcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNaXNzaW5nQXJndW1lbnRzKHJlcXVpcmVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgZXhwZWN0ZWRBcmcgb2YgdGhpcy5nZXRBcmd1bWVudHMoKSkge1xuICAgICAgICAgIGlmICghYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChleHBlY3RlZEFyZy5vcHRpb25hbFZhbHVlKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdBcmd1bWVudChgTWlzc2luZyBhcmd1bWVudDogJHtleHBlY3RlZEFyZy5uYW1lfWApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBhcmc6IHVua25vd247XG5cbiAgICAgICAgICBpZiAoZXhwZWN0ZWRBcmcudmFyaWFkaWMpIHtcbiAgICAgICAgICAgIGFyZyA9IGFyZ3Muc3BsaWNlKDAsIGFyZ3MubGVuZ3RoKVxuICAgICAgICAgICAgICAubWFwKCh2YWx1ZSkgPT5cbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogXCJBcmd1bWVudFwiLFxuICAgICAgICAgICAgICAgICAgdHlwZTogZXhwZWN0ZWRBcmcudHlwZSxcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGV4cGVjdGVkQXJnLm5hbWUsXG4gICAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcmcgPSB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgICAgIGxhYmVsOiBcIkFyZ3VtZW50XCIsXG4gICAgICAgICAgICAgIHR5cGU6IGV4cGVjdGVkQXJnLnR5cGUsXG4gICAgICAgICAgICAgIG5hbWU6IGV4cGVjdGVkQXJnLm5hbWUsXG4gICAgICAgICAgICAgIHZhbHVlOiBhcmdzLnNoaWZ0KCkgYXMgc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFyZykge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goYXJnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVG9vTWFueUFyZ3VtZW50cyhhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXMgYXMgQ0E7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGVycm9yLiBJZiBgdGhyb3dFcnJvcnNgIGlzIGVuYWJsZWQgdGhlIGVycm9yIHdpbGwgYmUgcmV0dXJuZWQsXG4gICAqIG90aGVyd2lzZSBhIGZvcm1hdHRlZCBlcnJvciBtZXNzYWdlIHdpbGwgYmUgcHJpbnRlZCBhbmQgYERlbm8uZXhpdCgxKWBcbiAgICogd2lsbCBiZSBjYWxsZWQuXG4gICAqIEBwYXJhbSBlcnJvciBFcnJvciB0byBoYW5kbGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgZXJyb3IoZXJyb3I6IEVycm9yKTogRXJyb3Ige1xuICAgIGlmICh0aGlzLnNob3VsZFRocm93RXJyb3JzKCkgfHwgIShlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHtcbiAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG4gICAgdGhpcy5zaG93SGVscCgpO1xuICAgIERlbm8uc3RkZXJyLndyaXRlU3luYyhcbiAgICAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcbiAgICAgICAgcmVkKGAgICR7Ym9sZChcImVycm9yXCIpfTogJHtlcnJvci5tZXNzYWdlfVxcbmApICsgXCJcXG5cIixcbiAgICAgICksXG4gICAgKTtcbiAgICBEZW5vLmV4aXQoZXJyb3IgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IgPyBlcnJvci5leGl0Q29kZSA6IDEpO1xuICB9XG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqKioqIEdFVFRFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqIEdldCBjb21tYW5kIG5hbWUuICovXG4gIHB1YmxpYyBnZXROYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICAvKiogR2V0IHBhcmVudCBjb21tYW5kLiAqL1xuICBwdWJsaWMgZ2V0UGFyZW50KCk6IFAge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQgYXMgUDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcGFyZW50IGNvbW1hbmQgZnJvbSBnbG9iYWwgZXhlY3V0ZWQgY29tbWFuZC5cbiAgICogQmUgc3VyZSwgdG8gY2FsbCB0aGlzIG1ldGhvZCBvbmx5IGluc2lkZSBhbiBhY3Rpb24gaGFuZGxlci4gVW5sZXNzIHRoaXMgb3IgYW55IGNoaWxkIGNvbW1hbmQgd2FzIGV4ZWN1dGVkLFxuICAgKiB0aGlzIG1ldGhvZCByZXR1cm5zIGFsd2F5cyB1bmRlZmluZWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsUGFyZW50KCk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9nbG9iYWxQYXJlbnQ7XG4gIH1cblxuICAvKiogR2V0IG1haW4gY29tbWFuZC4gKi9cbiAgcHVibGljIGdldE1haW5Db21tYW5kKCk6IENvbW1hbmQge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnQ/LmdldE1haW5Db21tYW5kKCkgPz8gdGhpcztcbiAgfVxuXG4gIC8qKiBHZXQgY29tbWFuZCBuYW1lIGFsaWFzZXMuICovXG4gIHB1YmxpYyBnZXRBbGlhc2VzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5hbGlhc2VzO1xuICB9XG5cbiAgLyoqIEdldCBmdWxsIGNvbW1hbmQgcGF0aC4gKi9cbiAgcHVibGljIGdldFBhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50XG4gICAgICA/IHRoaXMuX3BhcmVudC5nZXRQYXRoKCkgKyBcIiBcIiArIHRoaXMuX25hbWVcbiAgICAgIDogdGhpcy5fbmFtZTtcbiAgfVxuXG4gIC8qKiBHZXQgYXJndW1lbnRzIGRlZmluaXRpb24uIEUuZzogPGlucHV0LWZpbGU6c3RyaW5nPiA8b3V0cHV0LWZpbGU6c3RyaW5nPiAqL1xuICBwdWJsaWMgZ2V0QXJnc0RlZmluaXRpb24oKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5hcmdzRGVmaW5pdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYXJndW1lbnQgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYXJndW1lbnQuXG4gICAqL1xuICBwdWJsaWMgZ2V0QXJndW1lbnQobmFtZTogc3RyaW5nKTogSUFyZ3VtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBcmd1bWVudHMoKS5maW5kKChhcmcpID0+IGFyZy5uYW1lID09PSBuYW1lKTtcbiAgfVxuXG4gIC8qKiBHZXQgYXJndW1lbnRzLiAqL1xuICBwdWJsaWMgZ2V0QXJndW1lbnRzKCk6IElBcmd1bWVudFtdIHtcbiAgICBpZiAoIXRoaXMuYXJncy5sZW5ndGggJiYgdGhpcy5hcmdzRGVmaW5pdGlvbikge1xuICAgICAgdGhpcy5hcmdzID0gcGFyc2VBcmd1bWVudHNEZWZpbml0aW9uKHRoaXMuYXJnc0RlZmluaXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmFyZ3M7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgY29tbWFuZCBoYXMgYXJndW1lbnRzLiAqL1xuICBwdWJsaWMgaGFzQXJndW1lbnRzKCkge1xuICAgIHJldHVybiAhIXRoaXMuYXJnc0RlZmluaXRpb247XG4gIH1cblxuICAvKiogR2V0IGNvbW1hbmQgdmVyc2lvbi4gKi9cbiAgcHVibGljIGdldFZlcnNpb24oKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRWZXJzaW9uSGFuZGxlcigpPy5jYWxsKHRoaXMsIHRoaXMpO1xuICB9XG5cbiAgLyoqIEdldCBoZWxwIGhhbmRsZXIgbWV0aG9kLiAqL1xuICBwcml2YXRlIGdldFZlcnNpb25IYW5kbGVyKCk6IElWZXJzaW9uSGFuZGxlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMudmVyID8/IHRoaXMuX3BhcmVudD8uZ2V0VmVyc2lvbkhhbmRsZXIoKTtcbiAgfVxuXG4gIC8qKiBHZXQgY29tbWFuZCBkZXNjcmlwdGlvbi4gKi9cbiAgcHVibGljIGdldERlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgLy8gY2FsbCBkZXNjcmlwdGlvbiBtZXRob2Qgb25seSBvbmNlXG4gICAgcmV0dXJuIHR5cGVvZiB0aGlzLmRlc2MgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgPyB0aGlzLmRlc2MgPSB0aGlzLmRlc2MoKVxuICAgICAgOiB0aGlzLmRlc2M7XG4gIH1cblxuICAvKiogR2V0IHNob3J0IGNvbW1hbmQgZGVzY3JpcHRpb24uIFRoaXMgaXMgdGhlIGZpcnN0IGxpbmUgb2YgdGhlIGRlc2NyaXB0aW9uLiAqL1xuICBwdWJsaWMgZ2V0U2hvcnREZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldERlc2NyaXB0aW9uKClcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLnNoaWZ0KCkgYXMgc3RyaW5nO1xuICB9XG5cbiAgLyoqIEdldCBvcmlnaW5hbCBjb21tYW5kLWxpbmUgYXJndW1lbnRzLiAqL1xuICBwdWJsaWMgZ2V0UmF3QXJncygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMucmF3QXJncztcbiAgfVxuXG4gIC8qKiBHZXQgYWxsIGFyZ3VtZW50cyBkZWZpbmVkIGFmdGVyIHRoZSBkb3VibGUgZGFzaC4gKi9cbiAgcHVibGljIGdldExpdGVyYWxBcmdzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5saXRlcmFsQXJncztcbiAgfVxuXG4gIC8qKiBPdXRwdXQgZ2VuZXJhdGVkIGhlbHAgd2l0aG91dCBleGl0aW5nLiAqL1xuICBwdWJsaWMgc2hvd1ZlcnNpb24oKTogdm9pZCB7XG4gICAgRGVuby5zdGRvdXQud3JpdGVTeW5jKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh0aGlzLmdldFZlcnNpb24oKSkpO1xuICB9XG5cbiAgLyoqIE91dHB1dCBnZW5lcmF0ZWQgaGVscCB3aXRob3V0IGV4aXRpbmcuICovXG4gIHB1YmxpYyBzaG93SGVscCgpOiB2b2lkIHtcbiAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHRoaXMuZ2V0SGVscCgpKSk7XG4gIH1cblxuICAvKiogR2V0IGdlbmVyYXRlZCBoZWxwLiAqL1xuICBwdWJsaWMgZ2V0SGVscCgpOiBzdHJpbmcge1xuICAgIHRoaXMucmVnaXN0ZXJEZWZhdWx0cygpO1xuICAgIHJldHVybiB0aGlzLmdldEhlbHBIYW5kbGVyKCkuY2FsbCh0aGlzLCB0aGlzKTtcbiAgfVxuXG4gIC8qKiBHZXQgaGVscCBoYW5kbGVyIG1ldGhvZC4gKi9cbiAgcHJpdmF0ZSBnZXRIZWxwSGFuZGxlcigpOiBJSGVscEhhbmRsZXIge1xuICAgIHJldHVybiB0aGlzLl9oZWxwID8/IHRoaXMuX3BhcmVudD8uZ2V0SGVscEhhbmRsZXIoKSBhcyBJSGVscEhhbmRsZXI7XG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICoqKiogT2JqZWN0IEdFVFRFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIG9wdGlvbnMgb3Igbm90LlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgaGFzT3B0aW9ucyhoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T3B0aW9ucyhoaWRkZW4pLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG9wdGlvbnMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRPcHRpb25zKGhpZGRlbj86IGJvb2xlYW4pOiBJT3B0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbE9wdGlvbnMoaGlkZGVuKS5jb25jYXQodGhpcy5nZXRCYXNlT3B0aW9ucyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBvcHRpb25zLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZU9wdGlvbnMoaGlkZGVuPzogYm9vbGVhbik6IElPcHRpb25bXSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpZGRlblxuICAgICAgPyB0aGlzLm9wdGlvbnMuc2xpY2UoMClcbiAgICAgIDogdGhpcy5vcHRpb25zLmZpbHRlcigob3B0KSA9PiAhb3B0LmhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBvcHRpb25zLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsT3B0aW9ucyhoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbltdIHtcbiAgICBjb25zdCBnZXRPcHRpb25zID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgb3B0aW9uczogSU9wdGlvbltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJT3B0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgY21kLm9wdGlvbnMuZm9yRWFjaCgob3B0aW9uOiBJT3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG9wdGlvbi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMub3B0aW9ucy5maW5kKChvcHQpID0+IG9wdC5uYW1lID09PSBvcHRpb24ubmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihvcHRpb24ubmFtZSkgPT09IC0xICYmXG4gICAgICAgICAgICAgIChoaWRkZW4gfHwgIW9wdGlvbi5oaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChvcHRpb24ubmFtZSk7XG4gICAgICAgICAgICAgIG9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldE9wdGlvbnMoY21kLl9wYXJlbnQsIG9wdGlvbnMsIG5hbWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfTtcblxuICAgIHJldHVybiBnZXRPcHRpb25zKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIGFuIG9wdGlvbiB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGhhc09wdGlvbihuYW1lOiBzdHJpbmcsIGhpZGRlbj86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdldE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBvcHRpb24gYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QmFzZU9wdGlvbihuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBiYXNlIG9wdGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgb3B0aW9uID0gdGhpcy5vcHRpb25zLmZpbmQoKG9wdGlvbikgPT4gb3B0aW9uLm5hbWUgPT09IG5hbWUpO1xuXG4gICAgcmV0dXJuIG9wdGlvbiAmJiAoaGlkZGVuIHx8ICFvcHRpb24uaGlkZGVuKSA/IG9wdGlvbiA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIG9wdGlvbiBmcm9tIHBhcmVudCBjb21tYW5kJ3MgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRHbG9iYWxPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcHRpb246IElPcHRpb24gfCB1bmRlZmluZWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZU9wdGlvbihcbiAgICAgIG5hbWUsXG4gICAgICBoaWRkZW4sXG4gICAgKTtcblxuICAgIGlmICghb3B0aW9uIHx8ICFvcHRpb24uZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmdldEdsb2JhbE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb247XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG9wdGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICovXG4gIHB1YmxpYyByZW1vdmVPcHRpb24obmFtZTogc3RyaW5nKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMuZmluZEluZGV4KChvcHRpb24pID0+IG9wdGlvbi5uYW1lID09PSBuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNwbGljZShpbmRleCwgMSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIHN1Yi1jb21tYW5kcyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgaGFzQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldENvbW1hbmRzKGhpZGRlbikubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tbWFuZHMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRHbG9iYWxDb21tYW5kcyhoaWRkZW4pLmNvbmNhdCh0aGlzLmdldEJhc2VDb21tYW5kcyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21tYW5kcy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBjb21tYW5kcy5cbiAgICovXG4gIHB1YmxpYyBnZXRCYXNlQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICBjb25zdCBjb21tYW5kcyA9IEFycmF5LmZyb20odGhpcy5jb21tYW5kcy52YWx1ZXMoKSk7XG4gICAgcmV0dXJuIGhpZGRlbiA/IGNvbW1hbmRzIDogY29tbWFuZHMuZmlsdGVyKChjbWQpID0+ICFjbWQuaXNIaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBnbG9iYWwgY29tbWFuZHMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICBjb25zdCBnZXRDb21tYW5kcyA9IChcbiAgICAgIGNtZDogQ29tbWFuZCB8IHVuZGVmaW5lZCxcbiAgICAgIGNvbW1hbmRzOiBBcnJheTxDb21tYW5kPiA9IFtdLFxuICAgICAgbmFtZXM6IHN0cmluZ1tdID0gW10sXG4gICAgKTogQXJyYXk8Q29tbWFuZD4gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmNvbW1hbmRzLnNpemUpIHtcbiAgICAgICAgICBjbWQuY29tbWFuZHMuZm9yRWFjaCgoY21kOiBDb21tYW5kKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNtZC5pc0dsb2JhbCAmJlxuICAgICAgICAgICAgICB0aGlzICE9PSBjbWQgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY29tbWFuZHMuaGFzKGNtZC5fbmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihjbWQuX25hbWUpID09PSAtMSAmJlxuICAgICAgICAgICAgICAoaGlkZGVuIHx8ICFjbWQuaXNIaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChjbWQuX25hbWUpO1xuICAgICAgICAgICAgICBjb21tYW5kcy5wdXNoKGNtZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0Q29tbWFuZHMoY21kLl9wYXJlbnQsIGNvbW1hbmRzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb21tYW5kcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldENvbW1hbmRzKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBjaGlsZCBjb21tYW5kIGV4aXN0cyBieSBnaXZlbiBuYW1lIG9yIGFsaWFzLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9yIGFsaWFzIG9mIHRoZSBjb21tYW5kLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGNvbW1hbmRzLlxuICAgKi9cbiAgcHVibGljIGhhc0NvbW1hbmQobmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZXRDb21tYW5kKG5hbWUsIGhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbW1hbmQgYnkgbmFtZSBvciBhbGlhcy5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBhbGlhcyBvZiB0aGUgY29tbWFuZC5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBjb21tYW5kcy5cbiAgICovXG4gIHB1YmxpYyBnZXRDb21tYW5kKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBoaWRkZW4/OiBib29sZWFuLFxuICApOiBDb21tYW5kIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlQ29tbWFuZChuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbENvbW1hbmQobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUNvbW1hbmQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGhpZGRlbj86IGJvb2xlYW4sXG4gICk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuICAgIGZvciAoY29uc3QgY21kIG9mIHRoaXMuY29tbWFuZHMudmFsdWVzKCkpIHtcbiAgICAgIGlmIChjbWQuX25hbWUgPT09IG5hbWUgfHwgY21kLmFsaWFzZXMuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIChjbWQgJiYgKGhpZGRlbiB8fCAhY21kLmlzSGlkZGVuKSA/IGNtZCA6IHVuZGVmaW5lZCkgYXNcbiAgICAgICAgICB8IENvbW1hbmRcbiAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tbWFuZChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaGlkZGVuPzogYm9vbGVhbixcbiAgKTogQ29tbWFuZCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZUNvbW1hbmQobmFtZSwgaGlkZGVuKTtcblxuICAgIGlmICghY21kPy5pc0dsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxDb21tYW5kKG5hbWUsIGhpZGRlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNtZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgc3ViLWNvbW1hbmQgYnkgbmFtZSBvciBhbGlhcy5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBhbGlhcyBvZiB0aGUgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyByZW1vdmVDb21tYW5kKG5hbWU6IHN0cmluZyk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmdldEJhc2VDb21tYW5kKG5hbWUsIHRydWUpO1xuXG4gICAgaWYgKGNvbW1hbmQpIHtcbiAgICAgIHRoaXMuY29tbWFuZHMuZGVsZXRlKGNvbW1hbmQuX25hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjb21tYW5kO1xuICB9XG5cbiAgLyoqIEdldCB0eXBlcy4gKi9cbiAgcHVibGljIGdldFR5cGVzKCk6IElUeXBlW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbFR5cGVzKCkuY29uY2F0KHRoaXMuZ2V0QmFzZVR5cGVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBiYXNlIHR5cGVzLiAqL1xuICBwdWJsaWMgZ2V0QmFzZVR5cGVzKCk6IElUeXBlW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMudHlwZXMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBnbG9iYWwgdHlwZXMuICovXG4gIHB1YmxpYyBnZXRHbG9iYWxUeXBlcygpOiBJVHlwZVtdIHtcbiAgICBjb25zdCBnZXRUeXBlcyA9IChcbiAgICAgIGNtZDogQ29tbWFuZCB8IHVuZGVmaW5lZCxcbiAgICAgIHR5cGVzOiBJVHlwZVtdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJVHlwZVtdID0+IHtcbiAgICAgIGlmIChjbWQpIHtcbiAgICAgICAgaWYgKGNtZC50eXBlcy5zaXplKSB7XG4gICAgICAgICAgY21kLnR5cGVzLmZvckVhY2goKHR5cGU6IElUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHR5cGUuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICF0aGlzLnR5cGVzLmhhcyh0eXBlLm5hbWUpICYmXG4gICAgICAgICAgICAgIG5hbWVzLmluZGV4T2YodHlwZS5uYW1lKSA9PT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHR5cGUubmFtZSk7XG4gICAgICAgICAgICAgIHR5cGVzLnB1c2godHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0VHlwZXMoY21kLl9wYXJlbnQsIHR5cGVzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldFR5cGVzKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHR5cGUgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgdHlwZS5cbiAgICovXG4gIHB1YmxpYyBnZXRUeXBlKG5hbWU6IHN0cmluZyk6IElUeXBlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlVHlwZShuYW1lKSA/PyB0aGlzLmdldEdsb2JhbFR5cGUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJhc2UgdHlwZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSB0eXBlLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VUeXBlKG5hbWU6IHN0cmluZyk6IElUeXBlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy50eXBlcy5nZXQobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCB0eXBlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIHR5cGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsVHlwZShuYW1lOiBzdHJpbmcpOiBJVHlwZSB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbWQ6IElUeXBlIHwgdW5kZWZpbmVkID0gdGhpcy5fcGFyZW50LmdldEJhc2VUeXBlKG5hbWUpO1xuXG4gICAgaWYgKCFjbWQ/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxUeXBlKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjbWQ7XG4gIH1cblxuICAvKiogR2V0IGNvbXBsZXRpb25zLiAqL1xuICBwdWJsaWMgZ2V0Q29tcGxldGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R2xvYmFsQ29tcGxldGlvbnMoKS5jb25jYXQodGhpcy5nZXRCYXNlQ29tcGxldGlvbnMoKSk7XG4gIH1cblxuICAvKiogR2V0IGJhc2UgY29tcGxldGlvbnMuICovXG4gIHB1YmxpYyBnZXRCYXNlQ29tcGxldGlvbnMoKTogSUNvbXBsZXRpb25bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5jb21wbGV0aW9ucy52YWx1ZXMoKSk7XG4gIH1cblxuICAvKiogR2V0IGdsb2JhbCBjb21wbGV0aW9ucy4gKi9cbiAgcHVibGljIGdldEdsb2JhbENvbXBsZXRpb25zKCk6IElDb21wbGV0aW9uW10ge1xuICAgIGNvbnN0IGdldENvbXBsZXRpb25zID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgY29tcGxldGlvbnM6IElDb21wbGV0aW9uW10gPSBbXSxcbiAgICAgIG5hbWVzOiBzdHJpbmdbXSA9IFtdLFxuICAgICk6IElDb21wbGV0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmNvbXBsZXRpb25zLnNpemUpIHtcbiAgICAgICAgICBjbWQuY29tcGxldGlvbnMuZm9yRWFjaCgoY29tcGxldGlvbjogSUNvbXBsZXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29tcGxldGlvbi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY29tcGxldGlvbnMuaGFzKGNvbXBsZXRpb24ubmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihjb21wbGV0aW9uLm5hbWUpID09PSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIG5hbWVzLnB1c2goY29tcGxldGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgY29tcGxldGlvbnMucHVzaChjb21wbGV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRDb21wbGV0aW9ucyhjbWQuX3BhcmVudCwgY29tcGxldGlvbnMsIG5hbWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbXBsZXRpb25zO1xuICAgIH07XG5cbiAgICByZXR1cm4gZ2V0Q29tcGxldGlvbnModGhpcy5fcGFyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tcGxldGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBjb21wbGV0aW9uLlxuICAgKi9cbiAgcHVibGljIGdldENvbXBsZXRpb24obmFtZTogc3RyaW5nKTogSUNvbXBsZXRpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VDb21wbGV0aW9uKG5hbWUpID8/IHRoaXMuZ2V0R2xvYmFsQ29tcGxldGlvbihuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21wbGV0aW9uIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUNvbXBsZXRpb24obmFtZTogc3RyaW5nKTogSUNvbXBsZXRpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbXBsZXRpb25zLmdldChuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGNvbXBsZXRpb25zIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tcGxldGlvbihuYW1lOiBzdHJpbmcpOiBJQ29tcGxldGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0aW9uOiBJQ29tcGxldGlvbiB8IHVuZGVmaW5lZCA9IHRoaXMuX3BhcmVudC5nZXRCYXNlQ29tcGxldGlvbihcbiAgICAgIG5hbWUsXG4gICAgKTtcblxuICAgIGlmICghY29tcGxldGlvbj8uZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmdldEdsb2JhbENvbXBsZXRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBsZXRpb247XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIGVudmlyb25tZW50IHZhcmlhYmxlcyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgaGFzRW52VmFycyhoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RW52VmFycyhoaWRkZW4pLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRFbnZWYXJzKGhpZGRlbj86IGJvb2xlYW4pOiBJRW52VmFyW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbEVudlZhcnMoaGlkZGVuKS5jb25jYXQodGhpcy5nZXRCYXNlRW52VmFycyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUVudlZhcnMoaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXJbXSB7XG4gICAgaWYgKCF0aGlzLmVudlZhcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpZGRlblxuICAgICAgPyB0aGlzLmVudlZhcnMuc2xpY2UoMClcbiAgICAgIDogdGhpcy5lbnZWYXJzLmZpbHRlcigoZW52KSA9PiAhZW52LmhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsRW52VmFycyhoaWRkZW4/OiBib29sZWFuKTogSUVudlZhcltdIHtcbiAgICBjb25zdCBnZXRFbnZWYXJzID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgZW52VmFyczogSUVudlZhcltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJRW52VmFyW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmVudlZhcnMubGVuZ3RoKSB7XG4gICAgICAgICAgY21kLmVudlZhcnMuZm9yRWFjaCgoZW52VmFyOiBJRW52VmFyKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGVudlZhci5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMuZW52VmFycy5maW5kKChlbnYpID0+IGVudi5uYW1lc1swXSA9PT0gZW52VmFyLm5hbWVzWzBdKSAmJlxuICAgICAgICAgICAgICBuYW1lcy5pbmRleE9mKGVudlZhci5uYW1lc1swXSkgPT09IC0xICYmXG4gICAgICAgICAgICAgIChoaWRkZW4gfHwgIWVudlZhci5oaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChlbnZWYXIubmFtZXNbMF0pO1xuICAgICAgICAgICAgICBlbnZWYXJzLnB1c2goZW52VmFyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRFbnZWYXJzKGNtZC5fcGFyZW50LCBlbnZWYXJzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlbnZWYXJzO1xuICAgIH07XG5cbiAgICByZXR1cm4gZ2V0RW52VmFycyh0aGlzLl9wYXJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBhbiBlbnZpcm9ubWVudCB2YXJpYWJsZSB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBoYXNFbnZWYXIobmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZXRFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZW52aXJvbm1lbnQgdmFyaWFibGUgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0RW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VFbnZWYXIobmFtZSwgaGlkZGVuKSA/P1xuICAgICAgdGhpcy5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRCYXNlRW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGVudlZhcjogSUVudlZhciB8IHVuZGVmaW5lZCA9IHRoaXMuZW52VmFycy5maW5kKChlbnYpID0+XG4gICAgICBlbnYubmFtZXMuaW5kZXhPZihuYW1lKSAhPT0gLTFcbiAgICApO1xuXG4gICAgcmV0dXJuIGVudlZhciAmJiAoaGlkZGVuIHx8ICFlbnZWYXIuaGlkZGVuKSA/IGVudlZhciA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGVudmlyb25tZW50IHZhcmlhYmxlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbEVudlZhcihuYW1lOiBzdHJpbmcsIGhpZGRlbj86IGJvb2xlYW4pOiBJRW52VmFyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVudlZhcjogSUVudlZhciB8IHVuZGVmaW5lZCA9IHRoaXMuX3BhcmVudC5nZXRCYXNlRW52VmFyKFxuICAgICAgbmFtZSxcbiAgICAgIGhpZGRlbixcbiAgICApO1xuXG4gICAgaWYgKCFlbnZWYXI/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW52VmFyO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBleGFtcGxlcyBvciBub3QuICovXG4gIHB1YmxpYyBoYXNFeGFtcGxlcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5leGFtcGxlcy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqIEdldCBhbGwgZXhhbXBsZXMuICovXG4gIHB1YmxpYyBnZXRFeGFtcGxlcygpOiBJRXhhbXBsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5leGFtcGxlcztcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgY29tbWFuZCBoYXMgYW4gZXhhbXBsZSB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LiAqL1xuICBwdWJsaWMgaGFzRXhhbXBsZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdldEV4YW1wbGUobmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGV4YW1wbGUgd2l0aCBnaXZlbiBuYW1lLiAqL1xuICBwdWJsaWMgZ2V0RXhhbXBsZShuYW1lOiBzdHJpbmcpOiBJRXhhbXBsZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXhhbXBsZXMuZmluZCgoZXhhbXBsZSkgPT4gZXhhbXBsZS5uYW1lID09PSBuYW1lKTtcbiAgfVxufVxuIl19