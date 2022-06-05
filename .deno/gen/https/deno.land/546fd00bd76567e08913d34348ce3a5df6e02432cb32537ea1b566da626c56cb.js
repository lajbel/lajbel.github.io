import { UnknownType, ValidationError as FlagsValidationError } from "../flags/_errors.ts";
import { MissingRequiredEnvVar } from "./_errors.ts";
import { parseFlags } from "../flags/flags.ts";
import { parseArgumentsDefinition, splitArguments } from "./_utils.ts";
import { bold, red } from "./deps.ts";
import { CommandExecutableNotFound, CommandNotFound, DefaultCommandNotFound, DuplicateCommandAlias, DuplicateCommandName, DuplicateCompletion, DuplicateEnvironmentVariable, DuplicateExample, DuplicateOptionName, DuplicateType, EnvironmentVariableOptionalValue, EnvironmentVariableSingleValue, EnvironmentVariableVariadicValue, MissingArgument, MissingArguments, MissingCommandName, NoArgumentsAllowed, TooManyArguments, UnknownCommand, ValidationError } from "./_errors.ts";
import { BooleanType } from "./types/boolean.ts";
import { NumberType } from "./types/number.ts";
import { StringType } from "./types/string.ts";
import { Type } from "./type.ts";
import { HelpGenerator } from "./help/_help_generator.ts";
import { IntegerType } from "./types/integer.ts";
import { underscoreToCamelCase } from "../flags/_utils.ts";
export class Command {
    types = new Map();
    rawArgs = [];
    literalArgs = [];
    // @TODO: get script name: https://github.com/denoland/deno/pull/5034
    // private name: string = location.pathname.split( '/' ).pop() as string;
    _name = "COMMAND";
    _parent;
    _globalParent;
    ver;
    desc = "";
    _usage;
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
    _shouldExit;
    versionOption(flags, desc, opts) {
        this._versionOption = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? {
                action: opts
            } : opts
        };
        return this;
    }
    helpOption(flags, desc, opts) {
        this._helpOption = flags === false ? flags : {
            flags,
            desc,
            opts: typeof opts === "function" ? {
                action: opts
            } : opts
        };
        return this;
    }
    /**
   * Add new sub-command.
   * @param nameAndArguments  Command definition. E.g: `my-command <input-file:string> <output-file:string>`
   * @param cmdOrDescription  The description of the new child command.
   * @param override          Override existing child command.
   */ command(nameAndArguments, cmdOrDescription, override) {
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
        } else {
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
        // if (name === "*" && !cmd.isExecutable) {
        //   cmd.isExecutable = true;
        // }
        aliases.forEach((alias)=>cmd.alias(alias)
        );
        this.commands.set(name, cmd);
        this.select(name);
        return this;
    }
    /**
   * Add new command alias.
   * @param alias Tha name of the alias.
   */ alias(alias) {
        if (this.cmd._name === alias || this.cmd.aliases.includes(alias)) {
            throw new DuplicateCommandAlias(alias);
        }
        this.cmd.aliases.push(alias);
        return this;
    }
    /** Reset internal command reference to main command. */ reset() {
        this.cmd = this;
        return this;
    }
    /**
   * Set internal command pointer to child command with given name.
   * @param name The name of the command to select.
   */ select(name) {
        const cmd = this.getBaseCommand(name, true);
        if (!cmd) {
            throw new CommandNotFound(name, this.getBaseCommands(true));
        }
        this.cmd = cmd;
        return this;
    }
    /** ***************************************************************************
   * *** SUB HANDLER ************************************************************
   * *************************************************************************** */ /** Set command name. */ name(name) {
        this.cmd._name = name;
        return this;
    }
    /**
   * Set command version.
   * @param version Semantic version string string or method that returns the version string.
   */ version(version) {
        if (typeof version === "string") {
            this.cmd.ver = ()=>version
            ;
        } else if (typeof version === "function") {
            this.cmd.ver = version;
        }
        return this;
    }
    /**
   * Set command help.
   * @param help Help string, method, or config for generator that returns the help string.
   */ help(help) {
        if (typeof help === "string") {
            this.cmd._help = ()=>help
            ;
        } else if (typeof help === "function") {
            this.cmd._help = help;
        } else {
            this.cmd._help = (cmd, options)=>HelpGenerator.generate(cmd, {
                    ...help,
                    ...options
                })
            ;
        }
        return this;
    }
    /**
   * Set the long command description.
   * @param description The command description.
   */ description(description) {
        this.cmd.desc = description;
        return this;
    }
    /**
   * Set the command usage. Defaults to arguments.
   * @param usage The command usage.
   */ usage(usage) {
        this.cmd._usage = usage;
        return this;
    }
    /**
   * Hide command from help, completions, etc.
   */ hidden() {
        this.cmd.isHidden = true;
        return this;
    }
    /** Make command globally available. */ global() {
        this.cmd.isGlobal = true;
        return this;
    }
    /** Make command executable. */ executable() {
        this.cmd.isExecutable = true;
        return this;
    }
    arguments(args) {
        this.cmd.argsDefinition = args;
        return this;
    }
    /**
   * Set command callback method.
   * @param fn Command action handler.
   */ action(fn) {
        this.cmd.fn = fn;
        return this;
    }
    /**
   * Don't throw an error if the command was called without arguments.
   * @param allowEmpty Enable/disable allow empty.
   */ allowEmpty(allowEmpty = true) {
        this.cmd._allowEmpty = allowEmpty;
        return this;
    }
    /**
   * Enable stop early. If enabled, all arguments starting from the first non
   * option argument will be passed as arguments with type string to the command
   * action handler.
   *
   * For example:
   *     `command --debug-level warning server --port 80`
   *
   * Will result in:
   *     - options: `{debugLevel: 'warning'}`
   *     - args: `['server', '--port', '80']`
   *
   * @param stopEarly Enable/disable stop early.
   */ stopEarly(stopEarly = true) {
        this.cmd._stopEarly = stopEarly;
        return this;
    }
    /**
   * Disable parsing arguments. If enabled the raw arguments will be passed to
   * the action handler. This has no effect for parent or child commands. Only
   * for the command on which this method was called.
   * @param useRawArgs Enable/disable raw arguments.
   */ useRawArgs(useRawArgs = true) {
        this.cmd._useRawArgs = useRawArgs;
        return this;
    }
    /**
   * Set default command. The default command is executed when the program
   * was called without any argument and if no action handler is registered.
   * @param name Name of the default command.
   */ default(name) {
        this.cmd.defaultCommand = name;
        return this;
    }
    globalType(name, type, options) {
        return this.type(name, type, {
            ...options,
            global: true
        });
    }
    /**
   * Register custom type.
   * @param name    The name of the type.
   * @param handler The callback method to parse the type.
   * @param options Type options.
   */ type(name, handler, options) {
        if (this.cmd.types.get(name) && !options?.override) {
            throw new DuplicateType(name);
        }
        this.cmd.types.set(name, {
            ...options,
            name,
            handler
        });
        if (handler instanceof Type && (typeof handler.complete !== "undefined" || typeof handler.values !== "undefined")) {
            const completeHandler = (cmd, parent)=>handler.complete?.(cmd, parent) || []
            ;
            this.complete(name, completeHandler, options);
        }
        return this;
    }
    globalComplete(name, complete, options) {
        return this.complete(name, complete, {
            ...options,
            global: true
        });
    }
    complete(name, complete, options) {
        if (this.cmd.completions.has(name) && !options?.override) {
            throw new DuplicateCompletion(name);
        }
        this.cmd.completions.set(name, {
            name,
            complete,
            ...options
        });
        return this;
    }
    /**
   * Throw validation error's instead of calling `Deno.exit()` to handle
   * validation error's manually.
   *
   * A validation error is thrown when the command is wrongly used by the user.
   * For example: If the user passes some invalid options or arguments to the
   * command.
   *
   * This has no effect for parent commands. Only for the command on which this
   * method was called and all child commands.
   *
   * **Example:**
   *
   * ```
   * try {
   *   cmd.parse();
   * } catch(error) {
   *   if (error instanceof ValidationError) {
   *     cmd.showHelp();
   *     Deno.exit(1);
   *   }
   *   throw error;
   * }
   * ```
   *
   * @see ValidationError
   */ throwErrors() {
        this.cmd.throwOnError = true;
        return this;
    }
    /**
   * Same as `.throwErrors()` but also prevents calling `Deno.exit` after
   * printing help or version with the --help and --version option.
   */ noExit() {
        this.cmd._shouldExit = false;
        this.throwErrors();
        return this;
    }
    /** Check whether the command should throw errors or exit. */ shouldThrowErrors() {
        return this.cmd.throwOnError || !!this.cmd._parent?.shouldThrowErrors();
    }
    /** Check whether the command should exit after printing help or version. */ shouldExit() {
        return (this.cmd._shouldExit ?? this.cmd._parent?.shouldExit()) ?? true;
    }
    globalOption(flags, desc, opts) {
        if (typeof opts === "function") {
            return this.option(flags, desc, {
                value: opts,
                global: true
            });
        }
        return this.option(flags, desc, {
            ...opts,
            global: true
        });
    }
    option(flags, desc, opts) {
        if (typeof opts === "function") {
            return this.option(flags, desc, {
                value: opts
            });
        }
        const result = splitArguments(flags);
        const args = result.typeDefinition ? parseArgumentsDefinition(result.typeDefinition) : [];
        const option = {
            ...opts,
            name: "",
            description: desc,
            args,
            flags: result.flags,
            typeDefinition: result.typeDefinition
        };
        if (option.separator) {
            for (const arg of args){
                if (arg.list) {
                    arg.separator = option.separator;
                }
            }
        }
        for (const part of option.flags){
            const arg = part.trim();
            const isLong = /^--/.test(arg);
            const name = isLong ? arg.slice(2) : arg.slice(1);
            if (this.cmd.getBaseOption(name, true)) {
                if (opts?.override) {
                    this.removeOption(name);
                } else {
                    throw new DuplicateOptionName(name);
                }
            }
            if (!option.name && isLong) {
                option.name = name;
            } else if (!option.aliases) {
                option.aliases = [
                    name
                ];
            } else {
                option.aliases.push(name);
            }
        }
        if (option.prepend) {
            this.cmd.options.unshift(option);
        } else {
            this.cmd.options.push(option);
        }
        return this;
    }
    /**
   * Add new command example.
   * @param name          Name of the example.
   * @param description   The content of the example.
   */ example(name, description) {
        if (this.cmd.hasExample(name)) {
            throw new DuplicateExample(name);
        }
        this.cmd.examples.push({
            name,
            description
        });
        return this;
    }
    globalEnv(name, description, options) {
        return this.env(name, description, {
            ...options,
            global: true
        });
    }
    env(name, description, options) {
        const result = splitArguments(name);
        if (!result.typeDefinition) {
            result.typeDefinition = "<value:boolean>";
        }
        if (result.flags.some((envName)=>this.cmd.getBaseEnvVar(envName, true)
        )) {
            throw new DuplicateEnvironmentVariable(name);
        }
        const details = parseArgumentsDefinition(result.typeDefinition);
        if (details.length > 1) {
            throw new EnvironmentVariableSingleValue(name);
        } else if (details.length && details[0].optionalValue) {
            throw new EnvironmentVariableOptionalValue(name);
        } else if (details.length && details[0].variadic) {
            throw new EnvironmentVariableVariadicValue(name);
        }
        this.cmd.envVars.push({
            name: result.flags[0],
            names: result.flags,
            description,
            type: details[0].type,
            details: details.shift(),
            ...options
        });
        return this;
    }
    /** ***************************************************************************
   * *** MAIN HANDLER ***********************************************************
   * *************************************************************************** */ /**
   * Parse command line arguments and execute matched command.
   * @param args Command line args to parse. Ex: `cmd.parse( Deno.args )`
   */ async parse(args = Deno.args) {
        try {
            this.reset();
            this.registerDefaults();
            this.rawArgs = args;
            if (args.length > 0) {
                const subCommand = this.getCommand(args[0], true);
                if (subCommand) {
                    subCommand._globalParent = this;
                    return subCommand.parse(this.rawArgs.slice(1));
                }
            }
            if (this.isExecutable) {
                await this.executeExecutable(this.rawArgs);
                return {
                    options: {
                    },
                    args: [],
                    cmd: this,
                    literal: []
                };
            } else if (this._useRawArgs) {
                const env = await this.parseEnvVars();
                return await this.execute(env, ...this.rawArgs);
            } else {
                const { actionOption , flags , unknown , literal  } = this.parseFlags(this.rawArgs);
                this.literalArgs = literal;
                const env = await this.parseEnvVars();
                const options = {
                    ...env,
                    ...flags
                };
                const params = this.parseArguments(unknown, options);
                if (actionOption) {
                    await actionOption.action.call(this, options, ...params);
                    if (actionOption.standalone) {
                        return {
                            options,
                            args: params,
                            cmd: this,
                            literal: this.literalArgs
                        };
                    }
                }
                return await this.execute(options, ...params);
            }
        } catch (error) {
            if (error instanceof Error) {
                throw this.error(error);
            } else {
                throw this.error(new Error(`[non-error-thrown] ${error}`));
            }
        }
    }
    /** Register default options like `--version` and `--help`. */ registerDefaults() {
        if (this.hasDefaults || this.getParent()) {
            return this;
        }
        this.hasDefaults = true;
        this.reset();
        !this.types.has("string") && this.type("string", new StringType(), {
            global: true
        });
        !this.types.has("number") && this.type("number", new NumberType(), {
            global: true
        });
        !this.types.has("integer") && this.type("integer", new IntegerType(), {
            global: true
        });
        !this.types.has("boolean") && this.type("boolean", new BooleanType(), {
            global: true
        });
        if (!this._help) {
            this.help({
                hints: true,
                types: false
            });
        }
        if (this._versionOption !== false && (this._versionOption || this.ver)) {
            this.option(this._versionOption?.flags || "-V, --version", this._versionOption?.desc || "Show the version number for this program.", {
                standalone: true,
                prepend: true,
                action: function() {
                    this.showVersion();
                    this.exit();
                },
                ...this._versionOption?.opts ?? {
                }
            });
        }
        if (this._helpOption !== false) {
            this.option(this._helpOption?.flags || "-h, --help", this._helpOption?.desc || "Show this help.", {
                standalone: true,
                global: true,
                prepend: true,
                action: function() {
                    this.showHelp({
                        long: this.getRawArgs().includes(`--${helpOption.name}`)
                    });
                    this.exit();
                },
                ...this._helpOption?.opts ?? {
                }
            });
            const helpOption = this.options[0];
        }
        return this;
    }
    /**
   * Execute command.
   * @param options A map of options.
   * @param args Command arguments.
   */ async execute(options, ...args) {
        if (this.fn) {
            await this.fn(options, ...args);
        } else if (this.defaultCommand) {
            const cmd = this.getCommand(this.defaultCommand, true);
            if (!cmd) {
                throw new DefaultCommandNotFound(this.defaultCommand, this.getCommands());
            }
            cmd._globalParent = this;
            await cmd.execute(options, ...args);
        }
        return {
            options,
            args,
            cmd: this,
            literal: this.literalArgs
        };
    }
    /**
   * Execute external sub-command.
   * @param args Raw command line arguments.
   */ async executeExecutable(args) {
        const command = this.getPath().replace(/\s+/g, "-");
        await Deno.permissions.request({
            name: "run",
            command
        });
        try {
            const process = Deno.run({
                cmd: [
                    command,
                    ...args
                ]
            });
            const status = await process.status();
            if (!status.success) {
                Deno.exit(status.code);
            }
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                throw new CommandExecutableNotFound(command);
            }
            throw error;
        }
    }
    /**
   * Parse raw command line arguments.
   * @param args Raw command line arguments.
   */ parseFlags(args) {
        try {
            let actionOption;
            const result = parseFlags(args, {
                stopEarly: this._stopEarly,
                allowEmpty: this._allowEmpty,
                flags: this.getOptions(true),
                parse: (type)=>this.parseType(type)
                ,
                option: (option)=>{
                    if (!actionOption && option.action) {
                        actionOption = option;
                    }
                }
            });
            return {
                ...result,
                actionOption
            };
        } catch (error) {
            if (error instanceof FlagsValidationError) {
                throw new ValidationError(error.message);
            }
            throw error;
        }
    }
    /** Parse argument type. */ parseType(type) {
        const typeSettings = this.getType(type.type);
        if (!typeSettings) {
            throw new UnknownType(type.type, this.getTypes().map((type)=>type.name
            ));
        }
        return typeSettings.handler instanceof Type ? typeSettings.handler.parse(type) : typeSettings.handler(type);
    }
    /** Validate environment variables. */ async parseEnvVars() {
        const envVars = this.getEnvVars(true);
        const result = {
        };
        if (!envVars.length) {
            return result;
        }
        const hasEnvPermissions = (await Deno.permissions.query({
            name: "env"
        })).state === "granted";
        for (const env of envVars){
            const name = hasEnvPermissions && env.names.find((name)=>!!Deno.env.get(name)
            );
            if (name) {
                const propertyName = underscoreToCamelCase(env.prefix ? env.names[0].replace(new RegExp(`^${env.prefix}`), "") : env.names[0]);
                result[propertyName] = this.parseType({
                    label: "Environment variable",
                    type: env.type,
                    name,
                    value: Deno.env.get(name) ?? ""
                });
                if (env.value && typeof result[propertyName] !== "undefined") {
                    result[propertyName] = env.value(result[propertyName]);
                }
            } else if (env.required) {
                throw new MissingRequiredEnvVar(env);
            }
        }
        return result;
    }
    /**
   * Parse command-line arguments.
   * @param args  Raw command line arguments.
   * @param flags Parsed command line options.
   */ parseArguments(args, flags) {
        const params = [];
        // remove array reference
        args = args.slice(0);
        if (!this.hasArguments()) {
            if (args.length) {
                if (this.hasCommands(true)) {
                    throw new UnknownCommand(args[0], this.getCommands());
                } else {
                    throw new NoArgumentsAllowed(this.getPath());
                }
            }
        } else {
            if (!args.length) {
                const required = this.getArguments().filter((expectedArg)=>!expectedArg.optionalValue
                ).map((expectedArg)=>expectedArg.name
                );
                if (required.length) {
                    const flagNames = Object.keys(flags);
                    const hasStandaloneOption = !!flagNames.find((name)=>this.getOption(name, true)?.standalone
                    );
                    if (!hasStandaloneOption) {
                        throw new MissingArguments(required);
                    }
                }
            } else {
                for (const expectedArg of this.getArguments()){
                    if (!args.length) {
                        if (expectedArg.optionalValue) {
                            break;
                        }
                        throw new MissingArgument(`Missing argument: ${expectedArg.name}`);
                    }
                    let arg;
                    if (expectedArg.variadic) {
                        arg = args.splice(0, args.length).map((value)=>this.parseType({
                                label: "Argument",
                                type: expectedArg.type,
                                name: expectedArg.name,
                                value
                            })
                        );
                    } else {
                        arg = this.parseType({
                            label: "Argument",
                            type: expectedArg.type,
                            name: expectedArg.name,
                            value: args.shift()
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
    /**
   * Handle error. If `throwErrors` is enabled the error will be returned,
   * otherwise a formatted error message will be printed and `Deno.exit(1)`
   * will be called.
   * @param error Error to handle.
   */ error(error) {
        if (this.shouldThrowErrors() || !(error instanceof ValidationError)) {
            return error;
        }
        this.showHelp();
        console.error(red(`  ${bold("error")}: ${error.message}\n`));
        Deno.exit(error instanceof ValidationError ? error.exitCode : 1);
    }
    /** ***************************************************************************
   * *** GETTER *****************************************************************
   * *************************************************************************** */ /** Get command name. */ getName() {
        return this._name;
    }
    /** Get parent command. */ getParent() {
        return this._parent;
    }
    /**
   * Get parent command from global executed command.
   * Be sure, to call this method only inside an action handler. Unless this or any child command was executed,
   * this method returns always undefined.
   */ getGlobalParent() {
        return this._globalParent;
    }
    /** Get main command. */ getMainCommand() {
        return this._parent?.getMainCommand() ?? this;
    }
    /** Get command name aliases. */ getAliases() {
        return this.aliases;
    }
    /** Get full command path. */ getPath() {
        return this._parent ? this._parent.getPath() + " " + this._name : this._name;
    }
    /** Get arguments definition. E.g: <input-file:string> <output-file:string> */ getArgsDefinition() {
        return this.argsDefinition;
    }
    /**
   * Get argument by name.
   * @param name Name of the argument.
   */ getArgument(name) {
        return this.getArguments().find((arg)=>arg.name === name
        );
    }
    /** Get arguments. */ getArguments() {
        if (!this.args.length && this.argsDefinition) {
            this.args = parseArgumentsDefinition(this.argsDefinition);
        }
        return this.args;
    }
    /** Check if command has arguments. */ hasArguments() {
        return !!this.argsDefinition;
    }
    /** Get command version. */ getVersion() {
        return this.getVersionHandler()?.call(this, this);
    }
    /** Get help handler method. */ getVersionHandler() {
        return this.ver ?? this._parent?.getVersionHandler();
    }
    /** Get command description. */ getDescription() {
        // call description method only once
        return typeof this.desc === "function" ? this.desc = this.desc() : this.desc;
    }
    getUsage() {
        return this._usage ?? this.getArgsDefinition();
    }
    /** Get short command description. This is the first line of the description. */ getShortDescription() {
        return this.getDescription().trim().split("\n", 1)[0];
    }
    /** Get original command-line arguments. */ getRawArgs() {
        return this.rawArgs;
    }
    /** Get all arguments defined after the double dash. */ getLiteralArgs() {
        return this.literalArgs;
    }
    /** Output generated help without exiting. */ showVersion() {
        console.log(this.getVersion());
    }
    /** Output generated help without exiting. */ showHelp(options) {
        console.log(this.getHelp(options));
    }
    /** Get generated help. */ getHelp(options) {
        this.registerDefaults();
        return this.getHelpHandler().call(this, this, options ?? {
        });
    }
    /** Get help handler method. */ getHelpHandler() {
        return this._help ?? this._parent?.getHelpHandler();
    }
    exit(code = 0) {
        if (this.shouldExit()) {
            Deno.exit(code);
        }
    }
    /** ***************************************************************************
   * *** Object GETTER **********************************************************
   * *************************************************************************** */ /**
   * Checks whether the command has options or not.
   * @param hidden Include hidden options.
   */ hasOptions(hidden) {
        return this.getOptions(hidden).length > 0;
    }
    /**
   * Get options.
   * @param hidden Include hidden options.
   */ getOptions(hidden) {
        return this.getGlobalOptions(hidden).concat(this.getBaseOptions(hidden));
    }
    /**
   * Get base options.
   * @param hidden Include hidden options.
   */ getBaseOptions(hidden) {
        if (!this.options.length) {
            return [];
        }
        return hidden ? this.options.slice(0) : this.options.filter((opt)=>!opt.hidden
        );
    }
    /**
   * Get global options.
   * @param hidden Include hidden options.
   */ getGlobalOptions(hidden) {
        const getOptions = (cmd, options = [], names = [])=>{
            if (cmd) {
                if (cmd.options.length) {
                    cmd.options.forEach((option)=>{
                        if (option.global && !this.options.find((opt)=>opt.name === option.name
                        ) && names.indexOf(option.name) === -1 && (hidden || !option.hidden)) {
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
    /**
   * Checks whether the command has an option with given name or not.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ hasOption(name, hidden) {
        return !!this.getOption(name, hidden);
    }
    /**
   * Get option by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getOption(name, hidden) {
        return this.getBaseOption(name, hidden) ?? this.getGlobalOption(name, hidden);
    }
    /**
   * Get base option by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getBaseOption(name, hidden) {
        const option = this.options.find((option)=>option.name === name
        );
        return option && (hidden || !option.hidden) ? option : undefined;
    }
    /**
   * Get global option from parent command's by name.
   * @param name Name of the option. Must be in param-case.
   * @param hidden Include hidden options.
   */ getGlobalOption(name, hidden) {
        if (!this._parent) {
            return;
        }
        const option = this._parent.getBaseOption(name, hidden);
        if (!option || !option.global) {
            return this._parent.getGlobalOption(name, hidden);
        }
        return option;
    }
    /**
   * Remove option by name.
   * @param name Name of the option. Must be in param-case.
   */ removeOption(name) {
        const index = this.options.findIndex((option)=>option.name === name
        );
        if (index === -1) {
            return;
        }
        return this.options.splice(index, 1)[0];
    }
    /**
   * Checks whether the command has sub-commands or not.
   * @param hidden Include hidden commands.
   */ hasCommands(hidden) {
        return this.getCommands(hidden).length > 0;
    }
    /**
   * Get commands.
   * @param hidden Include hidden commands.
   */ getCommands(hidden) {
        return this.getGlobalCommands(hidden).concat(this.getBaseCommands(hidden));
    }
    /**
   * Get base commands.
   * @param hidden Include hidden commands.
   */ getBaseCommands(hidden) {
        const commands = Array.from(this.commands.values());
        return hidden ? commands : commands.filter((cmd)=>!cmd.isHidden
        );
    }
    /**
   * Get global commands.
   * @param hidden Include hidden commands.
   */ getGlobalCommands(hidden) {
        const getCommands = (cmd, commands = [], names = [])=>{
            if (cmd) {
                if (cmd.commands.size) {
                    cmd.commands.forEach((cmd)=>{
                        if (cmd.isGlobal && this !== cmd && !this.commands.has(cmd._name) && names.indexOf(cmd._name) === -1 && (hidden || !cmd.isHidden)) {
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
    /**
   * Checks whether a child command exists by given name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ hasCommand(name, hidden) {
        return !!this.getCommand(name, hidden);
    }
    /**
   * Get command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getCommand(name, hidden) {
        return this.getBaseCommand(name, hidden) ?? this.getGlobalCommand(name, hidden);
    }
    /**
   * Get base command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getBaseCommand(name, hidden) {
        for (const cmd of this.commands.values()){
            if (cmd._name === name || cmd.aliases.includes(name)) {
                return cmd && (hidden || !cmd.isHidden) ? cmd : undefined;
            }
        }
    }
    /**
   * Get global command by name or alias.
   * @param name Name or alias of the command.
   * @param hidden Include hidden commands.
   */ getGlobalCommand(name, hidden) {
        if (!this._parent) {
            return;
        }
        const cmd = this._parent.getBaseCommand(name, hidden);
        if (!cmd?.isGlobal) {
            return this._parent.getGlobalCommand(name, hidden);
        }
        return cmd;
    }
    /**
   * Remove sub-command by name or alias.
   * @param name Name or alias of the command.
   */ removeCommand(name) {
        const command = this.getBaseCommand(name, true);
        if (command) {
            this.commands.delete(command._name);
        }
        return command;
    }
    /** Get types. */ getTypes() {
        return this.getGlobalTypes().concat(this.getBaseTypes());
    }
    /** Get base types. */ getBaseTypes() {
        return Array.from(this.types.values());
    }
    /** Get global types. */ getGlobalTypes() {
        const getTypes = (cmd, types = [], names = [])=>{
            if (cmd) {
                if (cmd.types.size) {
                    cmd.types.forEach((type)=>{
                        if (type.global && !this.types.has(type.name) && names.indexOf(type.name) === -1) {
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
    /**
   * Get type by name.
   * @param name Name of the type.
   */ getType(name) {
        return this.getBaseType(name) ?? this.getGlobalType(name);
    }
    /**
   * Get base type by name.
   * @param name Name of the type.
   */ getBaseType(name) {
        return this.types.get(name);
    }
    /**
   * Get global type by name.
   * @param name Name of the type.
   */ getGlobalType(name) {
        if (!this._parent) {
            return;
        }
        const cmd = this._parent.getBaseType(name);
        if (!cmd?.global) {
            return this._parent.getGlobalType(name);
        }
        return cmd;
    }
    /** Get completions. */ getCompletions() {
        return this.getGlobalCompletions().concat(this.getBaseCompletions());
    }
    /** Get base completions. */ getBaseCompletions() {
        return Array.from(this.completions.values());
    }
    /** Get global completions. */ getGlobalCompletions() {
        const getCompletions = (cmd, completions = [], names = [])=>{
            if (cmd) {
                if (cmd.completions.size) {
                    cmd.completions.forEach((completion)=>{
                        if (completion.global && !this.completions.has(completion.name) && names.indexOf(completion.name) === -1) {
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
    /**
   * Get completion by name.
   * @param name Name of the completion.
   */ getCompletion(name) {
        return this.getBaseCompletion(name) ?? this.getGlobalCompletion(name);
    }
    /**
   * Get base completion by name.
   * @param name Name of the completion.
   */ getBaseCompletion(name) {
        return this.completions.get(name);
    }
    /**
   * Get global completions by name.
   * @param name Name of the completion.
   */ getGlobalCompletion(name) {
        if (!this._parent) {
            return;
        }
        const completion = this._parent.getBaseCompletion(name);
        if (!completion?.global) {
            return this._parent.getGlobalCompletion(name);
        }
        return completion;
    }
    /**
   * Checks whether the command has environment variables or not.
   * @param hidden Include hidden environment variable.
   */ hasEnvVars(hidden) {
        return this.getEnvVars(hidden).length > 0;
    }
    /**
   * Get environment variables.
   * @param hidden Include hidden environment variable.
   */ getEnvVars(hidden) {
        return this.getGlobalEnvVars(hidden).concat(this.getBaseEnvVars(hidden));
    }
    /**
   * Get base environment variables.
   * @param hidden Include hidden environment variable.
   */ getBaseEnvVars(hidden) {
        if (!this.envVars.length) {
            return [];
        }
        return hidden ? this.envVars.slice(0) : this.envVars.filter((env)=>!env.hidden
        );
    }
    /**
   * Get global environment variables.
   * @param hidden Include hidden environment variable.
   */ getGlobalEnvVars(hidden) {
        const getEnvVars = (cmd, envVars = [], names = [])=>{
            if (cmd) {
                if (cmd.envVars.length) {
                    cmd.envVars.forEach((envVar)=>{
                        if (envVar.global && !this.envVars.find((env)=>env.names[0] === envVar.names[0]
                        ) && names.indexOf(envVar.names[0]) === -1 && (hidden || !envVar.hidden)) {
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
    /**
   * Checks whether the command has an environment variable with given name or not.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ hasEnvVar(name, hidden) {
        return !!this.getEnvVar(name, hidden);
    }
    /**
   * Get environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getEnvVar(name, hidden) {
        return this.getBaseEnvVar(name, hidden) ?? this.getGlobalEnvVar(name, hidden);
    }
    /**
   * Get base environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getBaseEnvVar(name, hidden) {
        const envVar = this.envVars.find((env)=>env.names.indexOf(name) !== -1
        );
        return envVar && (hidden || !envVar.hidden) ? envVar : undefined;
    }
    /**
   * Get global environment variable by name.
   * @param name Name of the environment variable.
   * @param hidden Include hidden environment variable.
   */ getGlobalEnvVar(name, hidden) {
        if (!this._parent) {
            return;
        }
        const envVar = this._parent.getBaseEnvVar(name, hidden);
        if (!envVar?.global) {
            return this._parent.getGlobalEnvVar(name, hidden);
        }
        return envVar;
    }
    /** Checks whether the command has examples or not. */ hasExamples() {
        return this.examples.length > 0;
    }
    /** Get all examples. */ getExamples() {
        return this.examples;
    }
    /** Checks whether the command has an example with given name or not. */ hasExample(name) {
        return !!this.getExample(name);
    }
    /** Get example with given name. */ getExample(name) {
        return this.examples.find((example)=>example.name === name
        );
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvY29tbWFuZC9jb21tYW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFVua25vd25UeXBlLFxuICBWYWxpZGF0aW9uRXJyb3IgYXMgRmxhZ3NWYWxpZGF0aW9uRXJyb3IsXG59IGZyb20gXCIuLi9mbGFncy9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBNaXNzaW5nUmVxdWlyZWRFbnZWYXIgfSBmcm9tIFwiLi9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZUZsYWdzIH0gZnJvbSBcIi4uL2ZsYWdzL2ZsYWdzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IElGbGFnT3B0aW9ucywgSUZsYWdzUmVzdWx0IH0gZnJvbSBcIi4uL2ZsYWdzL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24sIHNwbGl0QXJndW1lbnRzIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBib2xkLCByZWQgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQge1xuICBDb21tYW5kRXhlY3V0YWJsZU5vdEZvdW5kLFxuICBDb21tYW5kTm90Rm91bmQsXG4gIERlZmF1bHRDb21tYW5kTm90Rm91bmQsXG4gIER1cGxpY2F0ZUNvbW1hbmRBbGlhcyxcbiAgRHVwbGljYXRlQ29tbWFuZE5hbWUsXG4gIER1cGxpY2F0ZUNvbXBsZXRpb24sXG4gIER1cGxpY2F0ZUVudmlyb25tZW50VmFyaWFibGUsXG4gIER1cGxpY2F0ZUV4YW1wbGUsXG4gIER1cGxpY2F0ZU9wdGlvbk5hbWUsXG4gIER1cGxpY2F0ZVR5cGUsXG4gIEVudmlyb25tZW50VmFyaWFibGVPcHRpb25hbFZhbHVlLFxuICBFbnZpcm9ubWVudFZhcmlhYmxlU2luZ2xlVmFsdWUsXG4gIEVudmlyb25tZW50VmFyaWFibGVWYXJpYWRpY1ZhbHVlLFxuICBNaXNzaW5nQXJndW1lbnQsXG4gIE1pc3NpbmdBcmd1bWVudHMsXG4gIE1pc3NpbmdDb21tYW5kTmFtZSxcbiAgTm9Bcmd1bWVudHNBbGxvd2VkLFxuICBUb29NYW55QXJndW1lbnRzLFxuICBVbmtub3duQ29tbWFuZCxcbiAgVmFsaWRhdGlvbkVycm9yLFxufSBmcm9tIFwiLi9fZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBCb29sZWFuVHlwZSB9IGZyb20gXCIuL3R5cGVzL2Jvb2xlYW4udHNcIjtcbmltcG9ydCB7IE51bWJlclR5cGUgfSBmcm9tIFwiLi90eXBlcy9udW1iZXIudHNcIjtcbmltcG9ydCB7IFN0cmluZ1R5cGUgfSBmcm9tIFwiLi90eXBlcy9zdHJpbmcudHNcIjtcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi90eXBlLnRzXCI7XG5pbXBvcnQgeyBIZWxwR2VuZXJhdG9yIH0gZnJvbSBcIi4vaGVscC9faGVscF9nZW5lcmF0b3IudHNcIjtcbmltcG9ydCB0eXBlIHsgSGVscE9wdGlvbnMgfSBmcm9tIFwiLi9oZWxwL19oZWxwX2dlbmVyYXRvci50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBJQWN0aW9uLFxuICBJQXJndW1lbnQsXG4gIElDb21tYW5kT3B0aW9uLFxuICBJQ29tcGxldGVIYW5kbGVyLFxuICBJQ29tcGxldGVPcHRpb25zLFxuICBJQ29tcGxldGlvbixcbiAgSURlc2NyaXB0aW9uLFxuICBJRW52VmFyLFxuICBJRW52VmFyT3B0aW9ucyxcbiAgSUV4YW1wbGUsXG4gIElGbGFnVmFsdWVIYW5kbGVyLFxuICBJSGVscEhhbmRsZXIsXG4gIElPcHRpb24sXG4gIElQYXJzZVJlc3VsdCxcbiAgSVR5cGUsXG4gIElUeXBlSGFuZGxlcixcbiAgSVR5cGVJbmZvLFxuICBJVHlwZU9wdGlvbnMsXG4gIElWZXJzaW9uSGFuZGxlcixcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEludGVnZXJUeXBlIH0gZnJvbSBcIi4vdHlwZXMvaW50ZWdlci50c1wiO1xuaW1wb3J0IHsgdW5kZXJzY29yZVRvQ2FtZWxDYXNlIH0gZnJvbSBcIi4uL2ZsYWdzL191dGlscy50c1wiO1xuXG5pbnRlcmZhY2UgSURlZmF1bHRPcHRpb248XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIE8gZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdm9pZCA9IGFueSxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgQSBleHRlbmRzIEFycmF5PHVua25vd24+ID0gYW55LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFBHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFAgZXh0ZW5kcyBDb21tYW5kIHwgdW5kZWZpbmVkID0gYW55LFxuPiB7XG4gIGZsYWdzOiBzdHJpbmc7XG4gIGRlc2M/OiBzdHJpbmc7XG4gIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxPLCBBLCBHLCBQRywgUD47XG59XG5cbnR5cGUgT25lT2Y8VCwgVj4gPSBUIGV4dGVuZHMgdm9pZCA/IFYgOiBUO1xudHlwZSBNZXJnZTxULCBWPiA9IFQgZXh0ZW5kcyB2b2lkID8gViA6IChWIGV4dGVuZHMgdm9pZCA/IFQgOiBUICYgVik7XG5cbnR5cGUgTWFwT3B0aW9uVHlwZXM8TyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZD4gPSBPIGV4dGVuZHNcbiAgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgPyB7IFtLIGluIGtleW9mIE9dOiBPW0tdIGV4dGVuZHMgVHlwZTxpbmZlciBUPiA/IFQgOiBPW0tdIH1cbiAgOiB2b2lkO1xuXG50eXBlIE1hcEFyZ3VtZW50VHlwZXM8QSBleHRlbmRzIEFycmF5PHVua25vd24+PiA9IEEgZXh0ZW5kcyBBcnJheTx1bmtub3duPlxuICA/IHsgW0kgaW4ga2V5b2YgQV06IEFbSV0gZXh0ZW5kcyBUeXBlPGluZmVyIFQ+ID8gVCA6IEFbSV0gfVxuICA6IC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGFueTtcblxuZXhwb3J0IGNsYXNzIENvbW1hbmQ8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIENPIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQgPSBhbnksXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIENBIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBDTyBleHRlbmRzIG51bWJlciA/IGFueSA6IFtdLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBDRyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4gfCB2b2lkID0gQ08gZXh0ZW5kcyBudW1iZXIgPyBhbnkgOiB2b2lkLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBQRyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4gfCB2b2lkID0gQ08gZXh0ZW5kcyBudW1iZXIgPyBhbnkgOiB2b2lkLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBQIGV4dGVuZHMgQ29tbWFuZCB8IHVuZGVmaW5lZCA9IENPIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdW5kZWZpbmVkLFxuPiB7XG4gIHByaXZhdGUgdHlwZXM6IE1hcDxzdHJpbmcsIElUeXBlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSByYXdBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGxpdGVyYWxBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICAvLyBAVE9ETzogZ2V0IHNjcmlwdCBuYW1lOiBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9wdWxsLzUwMzRcbiAgLy8gcHJpdmF0ZSBuYW1lOiBzdHJpbmcgPSBsb2NhdGlvbi5wYXRobmFtZS5zcGxpdCggJy8nICkucG9wKCkgYXMgc3RyaW5nO1xuICBwcml2YXRlIF9uYW1lID0gXCJDT01NQU5EXCI7XG4gIHByaXZhdGUgX3BhcmVudD86IFA7XG4gIHByaXZhdGUgX2dsb2JhbFBhcmVudD86IENvbW1hbmQ7XG4gIHByaXZhdGUgdmVyPzogSVZlcnNpb25IYW5kbGVyO1xuICBwcml2YXRlIGRlc2M6IElEZXNjcmlwdGlvbiA9IFwiXCI7XG4gIHByaXZhdGUgX3VzYWdlPzogc3RyaW5nO1xuICBwcml2YXRlIGZuPzogSUFjdGlvbjtcbiAgcHJpdmF0ZSBvcHRpb25zOiBJT3B0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBjb21tYW5kczogTWFwPHN0cmluZywgQ29tbWFuZD4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgZXhhbXBsZXM6IElFeGFtcGxlW10gPSBbXTtcbiAgcHJpdmF0ZSBlbnZWYXJzOiBJRW52VmFyW10gPSBbXTtcbiAgcHJpdmF0ZSBhbGlhc2VzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGNvbXBsZXRpb25zOiBNYXA8c3RyaW5nLCBJQ29tcGxldGlvbj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgY21kOiBDb21tYW5kID0gdGhpcztcbiAgcHJpdmF0ZSBhcmdzRGVmaW5pdGlvbj86IHN0cmluZztcbiAgcHJpdmF0ZSBpc0V4ZWN1dGFibGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSB0aHJvd09uRXJyb3IgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfYWxsb3dFbXB0eSA9IHRydWU7XG4gIHByaXZhdGUgX3N0b3BFYXJseSA9IGZhbHNlO1xuICBwcml2YXRlIGRlZmF1bHRDb21tYW5kPzogc3RyaW5nO1xuICBwcml2YXRlIF91c2VSYXdBcmdzID0gZmFsc2U7XG4gIHByaXZhdGUgYXJnczogSUFyZ3VtZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBpc0hpZGRlbiA9IGZhbHNlO1xuICBwcml2YXRlIGlzR2xvYmFsID0gZmFsc2U7XG4gIHByaXZhdGUgaGFzRGVmYXVsdHMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfdmVyc2lvbk9wdGlvbj86IElEZWZhdWx0T3B0aW9uIHwgZmFsc2U7XG4gIHByaXZhdGUgX2hlbHBPcHRpb24/OiBJRGVmYXVsdE9wdGlvbiB8IGZhbHNlO1xuICBwcml2YXRlIF9oZWxwPzogSUhlbHBIYW5kbGVyO1xuICBwcml2YXRlIF9zaG91bGRFeGl0PzogYm9vbGVhbjtcblxuICAvKiogRGlzYWJsZSB2ZXJzaW9uIG9wdGlvbi4gKi9cbiAgcHVibGljIHZlcnNpb25PcHRpb24oZW5hYmxlOiBmYWxzZSk6IHRoaXM7XG4gIC8qKlxuICAgKiBTZXQgZ2xvYmFsIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBWZXJzaW9uIG9wdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb25PcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIENHLCBQRywgUD4gJiB7IGdsb2JhbDogdHJ1ZSB9LFxuICApOiB0aGlzO1xuICAvKipcbiAgICogU2V0IHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gZmxhZ3MgVGhlIGZsYWdzIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIGRlc2MgIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzICBWZXJzaW9uIG9wdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb25PcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQ29tbWFuZE9wdGlvbjxDTywgQ0EsIENHLCBQRywgUD4sXG4gICk6IHRoaXM7XG4gIC8qKlxuICAgKiBTZXQgdmVyc2lvbiBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSB2ZXJzaW9uIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIFRoZSBhY3Rpb24gb2YgdGhlIHZlcnNpb24gb3B0aW9uLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb25PcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQWN0aW9uPENPLCBDQSwgQ0csIFBHLCBQPixcbiAgKTogdGhpcztcbiAgcHVibGljIHZlcnNpb25PcHRpb24oXG4gICAgZmxhZ3M6IHN0cmluZyB8IGZhbHNlLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86XG4gICAgICB8IElBY3Rpb248Q08sIENBLCBDRywgUEcsIFA+XG4gICAgICB8IElDb21tYW5kT3B0aW9uPENPLCBDQSwgQ0csIFBHLCBQPlxuICAgICAgfCBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIENHLCBQRywgUD4gJiB7IGdsb2JhbDogdHJ1ZSB9LFxuICApOiB0aGlzIHtcbiAgICB0aGlzLl92ZXJzaW9uT3B0aW9uID0gZmxhZ3MgPT09IGZhbHNlID8gZmxhZ3MgOiB7XG4gICAgICBmbGFncyxcbiAgICAgIGRlc2MsXG4gICAgICBvcHRzOiB0eXBlb2Ygb3B0cyA9PT0gXCJmdW5jdGlvblwiID8geyBhY3Rpb246IG9wdHMgfSA6IG9wdHMsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIGhlbHAgb3B0aW9uLiAqL1xuICBwdWJsaWMgaGVscE9wdGlvbihlbmFibGU6IGZhbHNlKTogdGhpcztcbiAgLyoqXG4gICAqIFNldCBnbG9iYWwgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIEhlbHAgb3B0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgaGVscE9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86IElDb21tYW5kT3B0aW9uPFBhcnRpYWw8Q08+LCBDQSwgQ0csIFBHLCBQPiAmIHsgZ2xvYmFsOiB0cnVlIH0sXG4gICk6IHRoaXM7XG4gIC8qKlxuICAgKiBTZXQgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBUaGUgZmxhZ3Mgb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gZGVzYyAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdHMgIEhlbHAgb3B0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgaGVscE9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86IElDb21tYW5kT3B0aW9uPENPLCBDQSwgQ0csIFBHLCBQPixcbiAgKTogdGhpcztcbiAgLyoqXG4gICAqIFNldCBoZWxwIG9wdGlvbi5cbiAgICogQHBhcmFtIGZsYWdzIFRoZSBmbGFncyBvZiB0aGUgaGVscCBvcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIGhlbHAgb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0cyAgVGhlIGFjdGlvbiBvZiB0aGUgaGVscCBvcHRpb24uXG4gICAqL1xuICBwdWJsaWMgaGVscE9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nLFxuICAgIGRlc2M/OiBzdHJpbmcsXG4gICAgb3B0cz86IElBY3Rpb248Q08sIENBLCBDRywgUEcsIFA+LFxuICApOiB0aGlzO1xuICBwdWJsaWMgaGVscE9wdGlvbihcbiAgICBmbGFnczogc3RyaW5nIHwgZmFsc2UsXG4gICAgZGVzYz86IHN0cmluZyxcbiAgICBvcHRzPzpcbiAgICAgIHwgSUFjdGlvbjxDTywgQ0EsIENHLCBQRywgUD5cbiAgICAgIHwgSUNvbW1hbmRPcHRpb248Q08sIENBLCBDRywgUEcsIFA+XG4gICAgICB8IElDb21tYW5kT3B0aW9uPFBhcnRpYWw8Q08+LCBDQSwgQ0csIFBHLCBQPiAmIHsgZ2xvYmFsOiB0cnVlIH0sXG4gICk6IHRoaXMge1xuICAgIHRoaXMuX2hlbHBPcHRpb24gPSBmbGFncyA9PT0gZmFsc2UgPyBmbGFncyA6IHtcbiAgICAgIGZsYWdzLFxuICAgICAgZGVzYyxcbiAgICAgIG9wdHM6IHR5cGVvZiBvcHRzID09PSBcImZ1bmN0aW9uXCIgPyB7IGFjdGlvbjogb3B0cyB9IDogb3B0cyxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgQ29tbWFuZCBkZWZpbml0aW9uLiBFLmc6IGBteS1jb21tYW5kIDxpbnB1dC1maWxlOnN0cmluZz4gPG91dHB1dC1maWxlOnN0cmluZz5gXG4gICAqIEBwYXJhbSBjbWQgICAgICAgVGhlIG5ldyBjaGlsZCBjb21tYW5kIHRvIHJlZ2lzdGVyLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIGNoaWxkIGNvbW1hbmQuXG4gICAqL1xuICBwdWJsaWMgY29tbWFuZDxcbiAgICBDIGV4dGVuZHMgKENPIGV4dGVuZHMgbnVtYmVyID8gQ29tbWFuZCA6IENvbW1hbmQ8XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgUmVjb3JkPHN0cmluZywgYW55PiB8IHZvaWQsXG4gICAgICBBcnJheTx1bmtub3duPixcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdm9pZCxcbiAgICAgIE1lcmdlPFBHLCBDRz4gfCB2b2lkIHwgdW5kZWZpbmVkLFxuICAgICAgT25lT2Y8UCwgdGhpcz4gfCB1bmRlZmluZWRcbiAgICA+KSxcbiAgPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY21kOiBDLFxuICAgIG92ZXJyaWRlPzogYm9vbGVhbixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICApOiBDIGV4dGVuZHMgQ29tbWFuZDxpbmZlciBPLCBpbmZlciBBLCBpbmZlciBHLCBhbnksIGFueT5cbiAgICA/IENvbW1hbmQ8TywgQSwgRywgTWVyZ2U8UEcsIENHPiwgT25lT2Y8UCwgdGhpcz4+XG4gICAgOiBuZXZlcjtcbiAgLyoqXG4gICAqIEFkZCBuZXcgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgQ29tbWFuZCBkZWZpbml0aW9uLiBFLmc6IGBteS1jb21tYW5kIDxpbnB1dC1maWxlOnN0cmluZz4gPG91dHB1dC1maWxlOnN0cmluZz5gXG4gICAqIEBwYXJhbSBkZXNjICAgICAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBuZXcgY2hpbGQgY29tbWFuZC5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyBjaGlsZCBjb21tYW5kLlxuICAgKi9cbiAgcHVibGljIGNvbW1hbmQ8XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBBIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBBcnJheTxhbnk+LFxuICA+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjPzogc3RyaW5nLFxuICAgIG92ZXJyaWRlPzogYm9vbGVhbixcbiAgKTogQ29tbWFuZDxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIENPIGV4dGVuZHMgbnVtYmVyID8gYW55IDogdm9pZCxcbiAgICBNYXBBcmd1bWVudFR5cGVzPEE+LFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgQ08gZXh0ZW5kcyBudW1iZXIgPyBhbnkgOiB2b2lkLFxuICAgIE1lcmdlPFBHLCBDRz4sXG4gICAgT25lT2Y8UCwgdGhpcz5cbiAgPjtcbiAgLyoqXG4gICAqIEFkZCBuZXcgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBuYW1lQW5kQXJndW1lbnRzICBDb21tYW5kIGRlZmluaXRpb24uIEUuZzogYG15LWNvbW1hbmQgPGlucHV0LWZpbGU6c3RyaW5nPiA8b3V0cHV0LWZpbGU6c3RyaW5nPmBcbiAgICogQHBhcmFtIGNtZE9yRGVzY3JpcHRpb24gIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgbmV3IGNoaWxkIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgICAgICAgICBPdmVycmlkZSBleGlzdGluZyBjaGlsZCBjb21tYW5kLlxuICAgKi9cbiAgY29tbWFuZChcbiAgICBuYW1lQW5kQXJndW1lbnRzOiBzdHJpbmcsXG4gICAgY21kT3JEZXNjcmlwdGlvbj86IENvbW1hbmQgfCBzdHJpbmcsXG4gICAgb3ZlcnJpZGU/OiBib29sZWFuLFxuICApOiBDb21tYW5kIHtcbiAgICBjb25zdCByZXN1bHQgPSBzcGxpdEFyZ3VtZW50cyhuYW1lQW5kQXJndW1lbnRzKTtcblxuICAgIGNvbnN0IG5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHJlc3VsdC5mbGFncy5zaGlmdCgpO1xuICAgIGNvbnN0IGFsaWFzZXM6IHN0cmluZ1tdID0gcmVzdWx0LmZsYWdzO1xuXG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgTWlzc2luZ0NvbW1hbmROYW1lKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2V0QmFzZUNvbW1hbmQobmFtZSwgdHJ1ZSkpIHtcbiAgICAgIGlmICghb3ZlcnJpZGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUNvbW1hbmROYW1lKG5hbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZW1vdmVDb21tYW5kKG5hbWUpO1xuICAgIH1cblxuICAgIGxldCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGxldCBjbWQ6IENvbW1hbmQ7XG5cbiAgICBpZiAodHlwZW9mIGNtZE9yRGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGRlc2NyaXB0aW9uID0gY21kT3JEZXNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoY21kT3JEZXNjcmlwdGlvbiBpbnN0YW5jZW9mIENvbW1hbmQpIHtcbiAgICAgIGNtZCA9IGNtZE9yRGVzY3JpcHRpb24ucmVzZXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY21kID0gbmV3IENvbW1hbmQoKTtcbiAgICB9XG5cbiAgICBjbWQuX25hbWUgPSBuYW1lO1xuICAgIGNtZC5fcGFyZW50ID0gdGhpcztcblxuICAgIGlmIChkZXNjcmlwdGlvbikge1xuICAgICAgY21kLmRlc2NyaXB0aW9uKGRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LnR5cGVEZWZpbml0aW9uKSB7XG4gICAgICBjbWQuYXJndW1lbnRzKHJlc3VsdC50eXBlRGVmaW5pdGlvbik7XG4gICAgfVxuXG4gICAgLy8gaWYgKG5hbWUgPT09IFwiKlwiICYmICFjbWQuaXNFeGVjdXRhYmxlKSB7XG4gICAgLy8gICBjbWQuaXNFeGVjdXRhYmxlID0gdHJ1ZTtcbiAgICAvLyB9XG5cbiAgICBhbGlhc2VzLmZvckVhY2goKGFsaWFzOiBzdHJpbmcpID0+IGNtZC5hbGlhcyhhbGlhcykpO1xuXG4gICAgdGhpcy5jb21tYW5kcy5zZXQobmFtZSwgY21kKTtcblxuICAgIHRoaXMuc2VsZWN0KG5hbWUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkIG5ldyBjb21tYW5kIGFsaWFzLlxuICAgKiBAcGFyYW0gYWxpYXMgVGhhIG5hbWUgb2YgdGhlIGFsaWFzLlxuICAgKi9cbiAgcHVibGljIGFsaWFzKGFsaWFzOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQuX25hbWUgPT09IGFsaWFzIHx8IHRoaXMuY21kLmFsaWFzZXMuaW5jbHVkZXMoYWxpYXMpKSB7XG4gICAgICB0aHJvdyBuZXcgRHVwbGljYXRlQ29tbWFuZEFsaWFzKGFsaWFzKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZC5hbGlhc2VzLnB1c2goYWxpYXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVzZXQgaW50ZXJuYWwgY29tbWFuZCByZWZlcmVuY2UgdG8gbWFpbiBjb21tYW5kLiAqL1xuICBwdWJsaWMgcmVzZXQoKTogT25lT2Y8UCwgdGhpcz4ge1xuICAgIHRoaXMuY21kID0gdGhpcztcbiAgICByZXR1cm4gdGhpcyBhcyBPbmVPZjxQLCB0aGlzPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaW50ZXJuYWwgY29tbWFuZCBwb2ludGVyIHRvIGNoaWxkIGNvbW1hbmQgd2l0aCBnaXZlbiBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY29tbWFuZCB0byBzZWxlY3QuXG4gICAqL1xuICBwdWJsaWMgc2VsZWN0PFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgTyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdm9pZCA9IGFueSxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIEEgZXh0ZW5kcyBBcnJheTx1bmtub3duPiA9IGFueSxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIEcgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQgPSBhbnksXG4gID4obmFtZTogc3RyaW5nKTogQ29tbWFuZDxPLCBBLCBHLCBQRywgUD4ge1xuICAgIGNvbnN0IGNtZCA9IHRoaXMuZ2V0QmFzZUNvbW1hbmQobmFtZSwgdHJ1ZSk7XG5cbiAgICBpZiAoIWNtZCkge1xuICAgICAgdGhyb3cgbmV3IENvbW1hbmROb3RGb3VuZChuYW1lLCB0aGlzLmdldEJhc2VDb21tYW5kcyh0cnVlKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQgPSBjbWQ7XG5cbiAgICByZXR1cm4gdGhpcyBhcyBDb21tYW5kIGFzIENvbW1hbmQ8TywgQSwgRywgUEcsIFA+O1xuICB9XG5cbiAgLyoqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKiAqKiogU1VCIEhBTkRMRVIgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG4gIC8qKiBTZXQgY29tbWFuZCBuYW1lLiAqL1xuICBwdWJsaWMgbmFtZShuYW1lOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fbmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbW1hbmQgdmVyc2lvbi5cbiAgICogQHBhcmFtIHZlcnNpb24gU2VtYW50aWMgdmVyc2lvbiBzdHJpbmcgc3RyaW5nIG9yIG1ldGhvZCB0aGF0IHJldHVybnMgdGhlIHZlcnNpb24gc3RyaW5nLlxuICAgKi9cbiAgcHVibGljIHZlcnNpb24oXG4gICAgdmVyc2lvbjpcbiAgICAgIHwgc3RyaW5nXG4gICAgICB8IElWZXJzaW9uSGFuZGxlcjxQYXJ0aWFsPENPPiwgUGFydGlhbDxDQT4sIENHLCBQRz4sXG4gICk6IHRoaXMge1xuICAgIGlmICh0eXBlb2YgdmVyc2lvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5jbWQudmVyID0gKCkgPT4gdmVyc2lvbjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuY21kLnZlciA9IHZlcnNpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjb21tYW5kIGhlbHAuXG4gICAqIEBwYXJhbSBoZWxwIEhlbHAgc3RyaW5nLCBtZXRob2QsIG9yIGNvbmZpZyBmb3IgZ2VuZXJhdG9yIHRoYXQgcmV0dXJucyB0aGUgaGVscCBzdHJpbmcuXG4gICAqL1xuICBwdWJsaWMgaGVscChcbiAgICBoZWxwOlxuICAgICAgfCBzdHJpbmdcbiAgICAgIHwgSUhlbHBIYW5kbGVyPFBhcnRpYWw8Q08+LCBQYXJ0aWFsPENBPiwgQ0csIFBHPlxuICAgICAgfCBIZWxwT3B0aW9ucyxcbiAgKTogdGhpcyB7XG4gICAgaWYgKHR5cGVvZiBoZWxwID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLmNtZC5faGVscCA9ICgpID0+IGhlbHA7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaGVscCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB0aGlzLmNtZC5faGVscCA9IGhlbHA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY21kLl9oZWxwID0gKGNtZDogQ29tbWFuZCwgb3B0aW9uczogSGVscE9wdGlvbnMpOiBzdHJpbmcgPT5cbiAgICAgICAgSGVscEdlbmVyYXRvci5nZW5lcmF0ZShjbWQsIHsgLi4uaGVscCwgLi4ub3B0aW9ucyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBsb25nIGNvbW1hbmQgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBUaGUgY29tbWFuZCBkZXNjcmlwdGlvbi5cbiAgICovXG4gIHB1YmxpYyBkZXNjcmlwdGlvbihkZXNjcmlwdGlvbjogSURlc2NyaXB0aW9uPENPLCBDQSwgQ0csIFBHLCBQPik6IHRoaXMge1xuICAgIHRoaXMuY21kLmRlc2MgPSBkZXNjcmlwdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbW1hbmQgdXNhZ2UuIERlZmF1bHRzIHRvIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIHVzYWdlIFRoZSBjb21tYW5kIHVzYWdlLlxuICAgKi9cbiAgcHVibGljIHVzYWdlKHVzYWdlOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fdXNhZ2UgPSB1c2FnZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIGNvbW1hbmQgZnJvbSBoZWxwLCBjb21wbGV0aW9ucywgZXRjLlxuICAgKi9cbiAgcHVibGljIGhpZGRlbigpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5pc0hpZGRlbiA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogTWFrZSBjb21tYW5kIGdsb2JhbGx5IGF2YWlsYWJsZS4gKi9cbiAgcHVibGljIGdsb2JhbCgpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5pc0dsb2JhbCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogTWFrZSBjb21tYW5kIGV4ZWN1dGFibGUuICovXG4gIHB1YmxpYyBleGVjdXRhYmxlKCk6IHRoaXMge1xuICAgIHRoaXMuY21kLmlzRXhlY3V0YWJsZSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbW1hbmQgYXJndW1lbnRzOlxuICAgKlxuICAgKiAgIDxyZXF1aXJlZEFyZzpzdHJpbmc+IFtvcHRpb25hbEFyZzogbnVtYmVyXSBbLi4ucmVzdEFyZ3M6c3RyaW5nXVxuICAgKi9cbiAgcHVibGljIGFyZ3VtZW50czxBIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4gPSBDQT4oXG4gICAgYXJnczogc3RyaW5nLFxuICApOiBDb21tYW5kPENPLCBNYXBBcmd1bWVudFR5cGVzPEE+LCBDRywgUEcsIFA+O1xuICBwdWJsaWMgYXJndW1lbnRzKGFyZ3M6IHN0cmluZyk6IENvbW1hbmQge1xuICAgIHRoaXMuY21kLmFyZ3NEZWZpbml0aW9uID0gYXJncztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29tbWFuZCBjYWxsYmFjayBtZXRob2QuXG4gICAqIEBwYXJhbSBmbiBDb21tYW5kIGFjdGlvbiBoYW5kbGVyLlxuICAgKi9cbiAgcHVibGljIGFjdGlvbihmbjogSUFjdGlvbjxDTywgQ0EsIENHLCBQRywgUD4pOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5mbiA9IGZuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERvbid0IHRocm93IGFuIGVycm9yIGlmIHRoZSBjb21tYW5kIHdhcyBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBhbGxvd0VtcHR5IEVuYWJsZS9kaXNhYmxlIGFsbG93IGVtcHR5LlxuICAgKi9cbiAgcHVibGljIGFsbG93RW1wdHkoYWxsb3dFbXB0eSA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fYWxsb3dFbXB0eSA9IGFsbG93RW1wdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHN0b3AgZWFybHkuIElmIGVuYWJsZWQsIGFsbCBhcmd1bWVudHMgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3Qgbm9uXG4gICAqIG9wdGlvbiBhcmd1bWVudCB3aWxsIGJlIHBhc3NlZCBhcyBhcmd1bWVudHMgd2l0aCB0eXBlIHN0cmluZyB0byB0aGUgY29tbWFuZFxuICAgKiBhY3Rpb24gaGFuZGxlci5cbiAgICpcbiAgICogRm9yIGV4YW1wbGU6XG4gICAqICAgICBgY29tbWFuZCAtLWRlYnVnLWxldmVsIHdhcm5pbmcgc2VydmVyIC0tcG9ydCA4MGBcbiAgICpcbiAgICogV2lsbCByZXN1bHQgaW46XG4gICAqICAgICAtIG9wdGlvbnM6IGB7ZGVidWdMZXZlbDogJ3dhcm5pbmcnfWBcbiAgICogICAgIC0gYXJnczogYFsnc2VydmVyJywgJy0tcG9ydCcsICc4MCddYFxuICAgKlxuICAgKiBAcGFyYW0gc3RvcEVhcmx5IEVuYWJsZS9kaXNhYmxlIHN0b3AgZWFybHkuXG4gICAqL1xuICBwdWJsaWMgc3RvcEVhcmx5KHN0b3BFYXJseSA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLmNtZC5fc3RvcEVhcmx5ID0gc3RvcEVhcmx5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgcGFyc2luZyBhcmd1bWVudHMuIElmIGVuYWJsZWQgdGhlIHJhdyBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG9cbiAgICogdGhlIGFjdGlvbiBoYW5kbGVyLiBUaGlzIGhhcyBubyBlZmZlY3QgZm9yIHBhcmVudCBvciBjaGlsZCBjb21tYW5kcy4gT25seVxuICAgKiBmb3IgdGhlIGNvbW1hbmQgb24gd2hpY2ggdGhpcyBtZXRob2Qgd2FzIGNhbGxlZC5cbiAgICogQHBhcmFtIHVzZVJhd0FyZ3MgRW5hYmxlL2Rpc2FibGUgcmF3IGFyZ3VtZW50cy5cbiAgICovXG4gIHB1YmxpYyB1c2VSYXdBcmdzKHVzZVJhd0FyZ3MgPSB0cnVlKTogQ29tbWFuZDxDTywgQXJyYXk8c3RyaW5nPiwgQ0csIFBHLCBQPiB7XG4gICAgdGhpcy5jbWQuX3VzZVJhd0FyZ3MgPSB1c2VSYXdBcmdzO1xuICAgIHJldHVybiB0aGlzIGFzIENvbW1hbmQ8Q08sIEFycmF5PHN0cmluZz4sIENHLCBQRywgUD47XG4gIH1cblxuICAvKipcbiAgICogU2V0IGRlZmF1bHQgY29tbWFuZC4gVGhlIGRlZmF1bHQgY29tbWFuZCBpcyBleGVjdXRlZCB3aGVuIHRoZSBwcm9ncmFtXG4gICAqIHdhcyBjYWxsZWQgd2l0aG91dCBhbnkgYXJndW1lbnQgYW5kIGlmIG5vIGFjdGlvbiBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGRlZmF1bHQgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyBkZWZhdWx0KG5hbWU6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuY21kLmRlZmF1bHRDb21tYW5kID0gbmFtZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBnbG9iYWxUeXBlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBUeXBlPHVua25vd24+IHwgSVR5cGVIYW5kbGVyPHVua25vd24+LFxuICAgIG9wdGlvbnM/OiBPbWl0PElUeXBlT3B0aW9ucywgXCJnbG9iYWxcIj4sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLnR5cGUobmFtZSwgdHlwZSwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY3VzdG9tIHR5cGUuXG4gICAqIEBwYXJhbSBuYW1lICAgIFRoZSBuYW1lIG9mIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gaGFuZGxlciBUaGUgY2FsbGJhY2sgbWV0aG9kIHRvIHBhcnNlIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUeXBlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgdHlwZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaGFuZGxlcjogVHlwZTx1bmtub3duPiB8IElUeXBlSGFuZGxlcjx1bmtub3duPixcbiAgICBvcHRpb25zPzogSVR5cGVPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQudHlwZXMuZ2V0KG5hbWUpICYmICFvcHRpb25zPy5vdmVycmlkZSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZVR5cGUobmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQudHlwZXMuc2V0KG5hbWUsIHsgLi4ub3B0aW9ucywgbmFtZSwgaGFuZGxlciB9KTtcblxuICAgIGlmIChcbiAgICAgIGhhbmRsZXIgaW5zdGFuY2VvZiBUeXBlICYmXG4gICAgICAodHlwZW9mIGhhbmRsZXIuY29tcGxldGUgIT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICAgdHlwZW9mIGhhbmRsZXIudmFsdWVzICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICkge1xuICAgICAgY29uc3QgY29tcGxldGVIYW5kbGVyOiBJQ29tcGxldGVIYW5kbGVyID0gKFxuICAgICAgICBjbWQ6IENvbW1hbmQsXG4gICAgICAgIHBhcmVudD86IENvbW1hbmQsXG4gICAgICApID0+IGhhbmRsZXIuY29tcGxldGU/LihjbWQsIHBhcmVudCkgfHwgW107XG4gICAgICB0aGlzLmNvbXBsZXRlKG5hbWUsIGNvbXBsZXRlSGFuZGxlciwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgZ2xvYmFsQ29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbXBsZXRlOiBJQ29tcGxldGVIYW5kbGVyLFxuICAgIG9wdGlvbnM/OiBPbWl0PElDb21wbGV0ZU9wdGlvbnMsIFwiZ2xvYmFsXCI+LFxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5jb21wbGV0ZShuYW1lLCBjb21wbGV0ZSwgeyAuLi5vcHRpb25zLCBnbG9iYWw6IHRydWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY29tbWFuZCBzcGVjaWZpYyBjdXN0b20gdHlwZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICBUaGUgbmFtZSBvZiB0aGUgY29tcGxldGlvbi5cbiAgICogQHBhcmFtIGNvbXBsZXRlICBUaGUgY2FsbGJhY2sgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0eXBlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgIENvbXBsZXRlIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY29tcGxldGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8UGFydGlhbDxDTz4sIFBhcnRpYWw8Q0E+LCBDRywgUEcsIGFueT4sXG4gICAgb3B0aW9uczogSUNvbXBsZXRlT3B0aW9ucyAmIHsgZ2xvYmFsOiBib29sZWFuIH0sXG4gICk6IHRoaXM7XG4gIHB1YmxpYyBjb21wbGV0ZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8Q08sIENBLCBDRywgUEcsIFA+LFxuICAgIG9wdGlvbnM/OiBJQ29tcGxldGVPcHRpb25zLFxuICApOiB0aGlzO1xuICBjb21wbGV0ZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29tcGxldGU6IElDb21wbGV0ZUhhbmRsZXI8Q08sIENBLCBDRywgUEcsIFA+LFxuICAgIG9wdGlvbnM/OiBJQ29tcGxldGVPcHRpb25zLFxuICApOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQuY29tcGxldGlvbnMuaGFzKG5hbWUpICYmICFvcHRpb25zPy5vdmVycmlkZSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUNvbXBsZXRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuY29tcGxldGlvbnMuc2V0KG5hbWUsIHtcbiAgICAgIG5hbWUsXG4gICAgICBjb21wbGV0ZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvdyB2YWxpZGF0aW9uIGVycm9yJ3MgaW5zdGVhZCBvZiBjYWxsaW5nIGBEZW5vLmV4aXQoKWAgdG8gaGFuZGxlXG4gICAqIHZhbGlkYXRpb24gZXJyb3IncyBtYW51YWxseS5cbiAgICpcbiAgICogQSB2YWxpZGF0aW9uIGVycm9yIGlzIHRocm93biB3aGVuIHRoZSBjb21tYW5kIGlzIHdyb25nbHkgdXNlZCBieSB0aGUgdXNlci5cbiAgICogRm9yIGV4YW1wbGU6IElmIHRoZSB1c2VyIHBhc3NlcyBzb21lIGludmFsaWQgb3B0aW9ucyBvciBhcmd1bWVudHMgdG8gdGhlXG4gICAqIGNvbW1hbmQuXG4gICAqXG4gICAqIFRoaXMgaGFzIG5vIGVmZmVjdCBmb3IgcGFyZW50IGNvbW1hbmRzLiBPbmx5IGZvciB0aGUgY29tbWFuZCBvbiB3aGljaCB0aGlzXG4gICAqIG1ldGhvZCB3YXMgY2FsbGVkIGFuZCBhbGwgY2hpbGQgY29tbWFuZHMuXG4gICAqXG4gICAqICoqRXhhbXBsZToqKlxuICAgKlxuICAgKiBgYGBcbiAgICogdHJ5IHtcbiAgICogICBjbWQucGFyc2UoKTtcbiAgICogfSBjYXRjaChlcnJvcikge1xuICAgKiAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgKiAgICAgY21kLnNob3dIZWxwKCk7XG4gICAqICAgICBEZW5vLmV4aXQoMSk7XG4gICAqICAgfVxuICAgKiAgIHRocm93IGVycm9yO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAc2VlIFZhbGlkYXRpb25FcnJvclxuICAgKi9cbiAgcHVibGljIHRocm93RXJyb3JzKCk6IHRoaXMge1xuICAgIHRoaXMuY21kLnRocm93T25FcnJvciA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgLnRocm93RXJyb3JzKClgIGJ1dCBhbHNvIHByZXZlbnRzIGNhbGxpbmcgYERlbm8uZXhpdGAgYWZ0ZXJcbiAgICogcHJpbnRpbmcgaGVscCBvciB2ZXJzaW9uIHdpdGggdGhlIC0taGVscCBhbmQgLS12ZXJzaW9uIG9wdGlvbi5cbiAgICovXG4gIHB1YmxpYyBub0V4aXQoKTogdGhpcyB7XG4gICAgdGhpcy5jbWQuX3Nob3VsZEV4aXQgPSBmYWxzZTtcbiAgICB0aGlzLnRocm93RXJyb3JzKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQ2hlY2sgd2hldGhlciB0aGUgY29tbWFuZCBzaG91bGQgdGhyb3cgZXJyb3JzIG9yIGV4aXQuICovXG4gIHByb3RlY3RlZCBzaG91bGRUaHJvd0Vycm9ycygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jbWQudGhyb3dPbkVycm9yIHx8ICEhdGhpcy5jbWQuX3BhcmVudD8uc2hvdWxkVGhyb3dFcnJvcnMoKTtcbiAgfVxuXG4gIC8qKiBDaGVjayB3aGV0aGVyIHRoZSBjb21tYW5kIHNob3VsZCBleGl0IGFmdGVyIHByaW50aW5nIGhlbHAgb3IgdmVyc2lvbi4gKi9cbiAgcHJvdGVjdGVkIHNob3VsZEV4aXQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY21kLl9zaG91bGRFeGl0ID8/IHRoaXMuY21kLl9wYXJlbnQ/LnNob3VsZEV4aXQoKSA/PyB0cnVlO1xuICB9XG5cbiAgcHVibGljIGdsb2JhbE9wdGlvbjxHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gQ0c+KFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIG9wdHM/OlxuICAgICAgfCBPbWl0PFxuICAgICAgICBJQ29tbWFuZE9wdGlvbjxQYXJ0aWFsPENPPiwgQ0EsIE1lcmdlPENHLCBNYXBPcHRpb25UeXBlczxHPj4sIFBHLCBQPixcbiAgICAgICAgXCJnbG9iYWxcIlxuICAgICAgPlxuICAgICAgfCBJRmxhZ1ZhbHVlSGFuZGxlcixcbiAgKTogQ29tbWFuZDxDTywgQ0EsIE1lcmdlPENHLCBNYXBPcHRpb25UeXBlczxHPj4sIFBHLCBQPiB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbihmbGFncywgZGVzYywgeyB2YWx1ZTogb3B0cywgZ2xvYmFsOiB0cnVlIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcHRpb24oZmxhZ3MsIGRlc2MsIHsgLi4ub3B0cywgZ2xvYmFsOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBvcHRpb24uXG4gICAqIEBwYXJhbSBmbGFncyBGbGFncyBzdHJpbmcgbGlrZTogLWgsIC0taGVscCwgLS1tYW51YWwgPHJlcXVpcmVkQXJnOnN0cmluZz4gW29wdGlvbmFsQXJnOiBudW1iZXJdIFsuLi5yZXN0QXJnczpzdHJpbmddXG4gICAqIEBwYXJhbSBkZXNjIEZsYWcgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBvcHRzIEZsYWcgb3B0aW9ucyBvciBjdXN0b20gaGFuZGxlciBmb3IgcHJvY2Vzc2luZyBmbGFnIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIG9wdGlvbjxHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gQ0c+KFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIG9wdHM6XG4gICAgICB8IElDb21tYW5kT3B0aW9uPFBhcnRpYWw8Q08+LCBDQSwgTWVyZ2U8Q0csIE1hcE9wdGlvblR5cGVzPEc+PiwgUEcsIFA+ICYge1xuICAgICAgICBnbG9iYWw6IHRydWU7XG4gICAgICB9XG4gICAgICB8IElGbGFnVmFsdWVIYW5kbGVyLFxuICApOiBDb21tYW5kPENPLCBDQSwgTWVyZ2U8Q0csIE1hcE9wdGlvblR5cGVzPEc+PiwgUEcsIFA+O1xuICBwdWJsaWMgb3B0aW9uPE8gZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQgPSBDTz4oXG4gICAgZmxhZ3M6IHN0cmluZyxcbiAgICBkZXNjOiBzdHJpbmcsXG4gICAgb3B0cz86XG4gICAgICB8IElDb21tYW5kT3B0aW9uPE1lcmdlPENPLCBNYXBPcHRpb25UeXBlczxPPj4sIENBLCBDRywgUEcsIFA+XG4gICAgICB8IElGbGFnVmFsdWVIYW5kbGVyLFxuICApOiBDb21tYW5kPE1lcmdlPENPLCBNYXBPcHRpb25UeXBlczxPPj4sIENBLCBDRywgUEcsIFA+O1xuICBwdWJsaWMgb3B0aW9uKFxuICAgIGZsYWdzOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIG9wdHM/OiBJQ29tbWFuZE9wdGlvbiB8IElGbGFnVmFsdWVIYW5kbGVyLFxuICApOiBDb21tYW5kIHtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9uKGZsYWdzLCBkZXNjLCB7IHZhbHVlOiBvcHRzIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHNwbGl0QXJndW1lbnRzKGZsYWdzKTtcblxuICAgIGNvbnN0IGFyZ3M6IElBcmd1bWVudFtdID0gcmVzdWx0LnR5cGVEZWZpbml0aW9uXG4gICAgICA/IHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbihyZXN1bHQudHlwZURlZmluaXRpb24pXG4gICAgICA6IFtdO1xuXG4gICAgY29uc3Qgb3B0aW9uOiBJT3B0aW9uID0ge1xuICAgICAgLi4ub3B0cyxcbiAgICAgIG5hbWU6IFwiXCIsXG4gICAgICBkZXNjcmlwdGlvbjogZGVzYyxcbiAgICAgIGFyZ3MsXG4gICAgICBmbGFnczogcmVzdWx0LmZsYWdzLFxuICAgICAgdHlwZURlZmluaXRpb246IHJlc3VsdC50eXBlRGVmaW5pdGlvbixcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbi5zZXBhcmF0b3IpIHtcbiAgICAgIGZvciAoY29uc3QgYXJnIG9mIGFyZ3MpIHtcbiAgICAgICAgaWYgKGFyZy5saXN0KSB7XG4gICAgICAgICAgYXJnLnNlcGFyYXRvciA9IG9wdGlvbi5zZXBhcmF0b3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHBhcnQgb2Ygb3B0aW9uLmZsYWdzKSB7XG4gICAgICBjb25zdCBhcmcgPSBwYXJ0LnRyaW0oKTtcbiAgICAgIGNvbnN0IGlzTG9uZyA9IC9eLS0vLnRlc3QoYXJnKTtcbiAgICAgIGNvbnN0IG5hbWUgPSBpc0xvbmcgPyBhcmcuc2xpY2UoMikgOiBhcmcuc2xpY2UoMSk7XG5cbiAgICAgIGlmICh0aGlzLmNtZC5nZXRCYXNlT3B0aW9uKG5hbWUsIHRydWUpKSB7XG4gICAgICAgIGlmIChvcHRzPy5vdmVycmlkZSkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlT3B0aW9uKG5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBEdXBsaWNhdGVPcHRpb25OYW1lKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9uLm5hbWUgJiYgaXNMb25nKSB7XG4gICAgICAgIG9wdGlvbi5uYW1lID0gbmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbi5hbGlhc2VzKSB7XG4gICAgICAgIG9wdGlvbi5hbGlhc2VzID0gW25hbWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uLmFsaWFzZXMucHVzaChuYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9uLnByZXBlbmQpIHtcbiAgICAgIHRoaXMuY21kLm9wdGlvbnMudW5zaGlmdChvcHRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNtZC5vcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbmV3IGNvbW1hbmQgZXhhbXBsZS5cbiAgICogQHBhcmFtIG5hbWUgICAgICAgICAgTmFtZSBvZiB0aGUgZXhhbXBsZS5cbiAgICogQHBhcmFtIGRlc2NyaXB0aW9uICAgVGhlIGNvbnRlbnQgb2YgdGhlIGV4YW1wbGUuXG4gICAqL1xuICBwdWJsaWMgZXhhbXBsZShuYW1lOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5jbWQuaGFzRXhhbXBsZShuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUV4YW1wbGUobmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbWQuZXhhbXBsZXMucHVzaCh7IG5hbWUsIGRlc2NyaXB0aW9uIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgZ2xvYmFsRW52PEcgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHZvaWQgPSBDRz4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IE9taXQ8SUVudlZhck9wdGlvbnMsIFwiZ2xvYmFsXCI+LFxuICApOiBDb21tYW5kPENPLCBDQSwgTWVyZ2U8Q0csIE1hcE9wdGlvblR5cGVzPEc+PiwgUEcsIFA+IHtcbiAgICByZXR1cm4gdGhpcy5lbnYobmFtZSwgZGVzY3JpcHRpb24sIHsgLi4ub3B0aW9ucywgZ2xvYmFsOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBuYW1lICAgICAgICAgIE5hbWUgb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gICBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAgICAgICBFbnZpcm9ubWVudCB2YXJpYWJsZSBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGVudjxHIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gQ0c+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBJRW52VmFyT3B0aW9ucyxcbiAgKTogQ29tbWFuZDxDTywgQ0EsIE1lcmdlPENHLCBNYXBPcHRpb25UeXBlczxHPj4sIFBHLCBQPjtcbiAgcHVibGljIGVudjxPIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB2b2lkID0gQ08+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBJRW52VmFyT3B0aW9ucyxcbiAgKTogQ29tbWFuZDxNZXJnZTxDTywgTWFwT3B0aW9uVHlwZXM8Tz4+LCBDQSwgQ0csIFBHLCBQPjtcbiAgcHVibGljIGVudihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBvcHRpb25zPzogSUVudlZhck9wdGlvbnMsXG4gICk6IENvbW1hbmQge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNwbGl0QXJndW1lbnRzKG5hbWUpO1xuXG4gICAgaWYgKCFyZXN1bHQudHlwZURlZmluaXRpb24pIHtcbiAgICAgIHJlc3VsdC50eXBlRGVmaW5pdGlvbiA9IFwiPHZhbHVlOmJvb2xlYW4+XCI7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5mbGFncy5zb21lKChlbnZOYW1lKSA9PiB0aGlzLmNtZC5nZXRCYXNlRW52VmFyKGVudk5hbWUsIHRydWUpKSkge1xuICAgICAgdGhyb3cgbmV3IER1cGxpY2F0ZUVudmlyb25tZW50VmFyaWFibGUobmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZGV0YWlsczogSUFyZ3VtZW50W10gPSBwYXJzZUFyZ3VtZW50c0RlZmluaXRpb24oXG4gICAgICByZXN1bHQudHlwZURlZmluaXRpb24sXG4gICAgKTtcblxuICAgIGlmIChkZXRhaWxzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFbnZpcm9ubWVudFZhcmlhYmxlU2luZ2xlVmFsdWUobmFtZSk7XG4gICAgfSBlbHNlIGlmIChkZXRhaWxzLmxlbmd0aCAmJiBkZXRhaWxzWzBdLm9wdGlvbmFsVmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBFbnZpcm9ubWVudFZhcmlhYmxlT3B0aW9uYWxWYWx1ZShuYW1lKTtcbiAgICB9IGVsc2UgaWYgKGRldGFpbHMubGVuZ3RoICYmIGRldGFpbHNbMF0udmFyaWFkaWMpIHtcbiAgICAgIHRocm93IG5ldyBFbnZpcm9ubWVudFZhcmlhYmxlVmFyaWFkaWNWYWx1ZShuYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmNtZC5lbnZWYXJzLnB1c2goe1xuICAgICAgbmFtZTogcmVzdWx0LmZsYWdzWzBdLFxuICAgICAgbmFtZXM6IHJlc3VsdC5mbGFncyxcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgdHlwZTogZGV0YWlsc1swXS50eXBlLFxuICAgICAgZGV0YWlsczogZGV0YWlscy5zaGlmdCgpIGFzIElBcmd1bWVudCxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICogKioqIE1BSU4gSEFORExFUiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cblxuICAvKipcbiAgICogUGFyc2UgY29tbWFuZCBsaW5lIGFyZ3VtZW50cyBhbmQgZXhlY3V0ZSBtYXRjaGVkIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBhcmdzIENvbW1hbmQgbGluZSBhcmdzIHRvIHBhcnNlLiBFeDogYGNtZC5wYXJzZSggRGVuby5hcmdzIClgXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgcGFyc2UoXG4gICAgYXJnczogc3RyaW5nW10gPSBEZW5vLmFyZ3MsXG4gICk6IFByb21pc2U8SVBhcnNlUmVzdWx0PENPLCBDQSwgQ0csIFBHLCBQPj4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICB0aGlzLnJlZ2lzdGVyRGVmYXVsdHMoKTtcbiAgICAgIHRoaXMucmF3QXJncyA9IGFyZ3M7XG5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qgc3ViQ29tbWFuZCA9IHRoaXMuZ2V0Q29tbWFuZChhcmdzWzBdLCB0cnVlKTtcbiAgICAgICAgaWYgKHN1YkNvbW1hbmQpIHtcbiAgICAgICAgICBzdWJDb21tYW5kLl9nbG9iYWxQYXJlbnQgPSB0aGlzO1xuICAgICAgICAgIHJldHVybiBzdWJDb21tYW5kLnBhcnNlKFxuICAgICAgICAgICAgdGhpcy5yYXdBcmdzLnNsaWNlKDEpLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaXNFeGVjdXRhYmxlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUV4ZWN1dGFibGUodGhpcy5yYXdBcmdzKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvcHRpb25zOiB7fSBhcyBQRyAmIENHICYgQ08sXG4gICAgICAgICAgYXJnczogW10gYXMgdW5rbm93biBhcyBDQSxcbiAgICAgICAgICBjbWQ6IHRoaXMsXG4gICAgICAgICAgbGl0ZXJhbDogW10sXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3VzZVJhd0FyZ3MpIHtcbiAgICAgICAgY29uc3QgZW52OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IGF3YWl0IHRoaXMucGFyc2VFbnZWYXJzKCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGUoZW52IGFzIFBHICYgQ0cgJiBDTywgLi4udGhpcy5yYXdBcmdzIGFzIENBKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uT3B0aW9uLCBmbGFncywgdW5rbm93biwgbGl0ZXJhbCB9ID0gdGhpcy5wYXJzZUZsYWdzKFxuICAgICAgICAgIHRoaXMucmF3QXJncyxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmxpdGVyYWxBcmdzID0gbGl0ZXJhbDtcblxuICAgICAgICBjb25zdCBlbnY6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0gYXdhaXQgdGhpcy5wYXJzZUVudlZhcnMoKTtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uZW52LCAuLi5mbGFncyB9IGFzIFBHICYgQ0cgJiBDTztcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5wYXJzZUFyZ3VtZW50cyhcbiAgICAgICAgICB1bmtub3duLFxuICAgICAgICAgIG9wdGlvbnMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKGFjdGlvbk9wdGlvbikge1xuICAgICAgICAgIGF3YWl0IGFjdGlvbk9wdGlvbi5hY3Rpb24uY2FsbCh0aGlzLCBvcHRpb25zLCAuLi5wYXJhbXMpO1xuICAgICAgICAgIGlmIChhY3Rpb25PcHRpb24uc3RhbmRhbG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgYXJnczogcGFyYW1zLFxuICAgICAgICAgICAgICBjbWQ6IHRoaXMsXG4gICAgICAgICAgICAgIGxpdGVyYWw6IHRoaXMubGl0ZXJhbEFyZ3MsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGUob3B0aW9ucyBhcyBQRyAmIENHICYgQ08sIC4uLnBhcmFtcyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IHRoaXMuZXJyb3IoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5lcnJvcihuZXcgRXJyb3IoYFtub24tZXJyb3ItdGhyb3duXSAke2Vycm9yfWApKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgZGVmYXVsdCBvcHRpb25zIGxpa2UgYC0tdmVyc2lvbmAgYW5kIGAtLWhlbHBgLiAqL1xuICBwcml2YXRlIHJlZ2lzdGVyRGVmYXVsdHMoKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuaGFzRGVmYXVsdHMgfHwgdGhpcy5nZXRQYXJlbnQoKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHRoaXMuaGFzRGVmYXVsdHMgPSB0cnVlO1xuXG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgIXRoaXMudHlwZXMuaGFzKFwic3RyaW5nXCIpICYmXG4gICAgICB0aGlzLnR5cGUoXCJzdHJpbmdcIiwgbmV3IFN0cmluZ1R5cGUoKSwgeyBnbG9iYWw6IHRydWUgfSk7XG4gICAgIXRoaXMudHlwZXMuaGFzKFwibnVtYmVyXCIpICYmXG4gICAgICB0aGlzLnR5cGUoXCJudW1iZXJcIiwgbmV3IE51bWJlclR5cGUoKSwgeyBnbG9iYWw6IHRydWUgfSk7XG4gICAgIXRoaXMudHlwZXMuaGFzKFwiaW50ZWdlclwiKSAmJlxuICAgICAgdGhpcy50eXBlKFwiaW50ZWdlclwiLCBuZXcgSW50ZWdlclR5cGUoKSwgeyBnbG9iYWw6IHRydWUgfSk7XG4gICAgIXRoaXMudHlwZXMuaGFzKFwiYm9vbGVhblwiKSAmJlxuICAgICAgdGhpcy50eXBlKFwiYm9vbGVhblwiLCBuZXcgQm9vbGVhblR5cGUoKSwgeyBnbG9iYWw6IHRydWUgfSk7XG5cbiAgICBpZiAoIXRoaXMuX2hlbHApIHtcbiAgICAgIHRoaXMuaGVscCh7XG4gICAgICAgIGhpbnRzOiB0cnVlLFxuICAgICAgICB0eXBlczogZmFsc2UsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdmVyc2lvbk9wdGlvbiAhPT0gZmFsc2UgJiYgKHRoaXMuX3ZlcnNpb25PcHRpb24gfHwgdGhpcy52ZXIpKSB7XG4gICAgICB0aGlzLm9wdGlvbihcbiAgICAgICAgdGhpcy5fdmVyc2lvbk9wdGlvbj8uZmxhZ3MgfHwgXCItViwgLS12ZXJzaW9uXCIsXG4gICAgICAgIHRoaXMuX3ZlcnNpb25PcHRpb24/LmRlc2MgfHxcbiAgICAgICAgICBcIlNob3cgdGhlIHZlcnNpb24gbnVtYmVyIGZvciB0aGlzIHByb2dyYW0uXCIsXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFuZGFsb25lOiB0cnVlLFxuICAgICAgICAgIHByZXBlbmQ6IHRydWUsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dWZXJzaW9uKCk7XG4gICAgICAgICAgICB0aGlzLmV4aXQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIC4uLih0aGlzLl92ZXJzaW9uT3B0aW9uPy5vcHRzID8/IHt9KSxcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2hlbHBPcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICB0aGlzLm9wdGlvbihcbiAgICAgICAgdGhpcy5faGVscE9wdGlvbj8uZmxhZ3MgfHwgXCItaCwgLS1oZWxwXCIsXG4gICAgICAgIHRoaXMuX2hlbHBPcHRpb24/LmRlc2MgfHwgXCJTaG93IHRoaXMgaGVscC5cIixcbiAgICAgICAge1xuICAgICAgICAgIHN0YW5kYWxvbmU6IHRydWUsXG4gICAgICAgICAgZ2xvYmFsOiB0cnVlLFxuICAgICAgICAgIHByZXBlbmQ6IHRydWUsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dIZWxwKHtcbiAgICAgICAgICAgICAgbG9uZzogdGhpcy5nZXRSYXdBcmdzKCkuaW5jbHVkZXMoYC0tJHtoZWxwT3B0aW9uLm5hbWV9YCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZXhpdCgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgLi4uKHRoaXMuX2hlbHBPcHRpb24/Lm9wdHMgPz8ge30pLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIGNvbnN0IGhlbHBPcHRpb24gPSB0aGlzLm9wdGlvbnNbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBjb21tYW5kLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBIG1hcCBvZiBvcHRpb25zLlxuICAgKiBAcGFyYW0gYXJncyBDb21tYW5kIGFyZ3VtZW50cy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBleGVjdXRlKFxuICAgIG9wdGlvbnM6IFBHICYgQ0cgJiBDTyxcbiAgICAuLi5hcmdzOiBDQVxuICApOiBQcm9taXNlPElQYXJzZVJlc3VsdDxDTywgQ0EsIENHLCBQRywgUD4+IHtcbiAgICBpZiAodGhpcy5mbikge1xuICAgICAgYXdhaXQgdGhpcy5mbihvcHRpb25zLCAuLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdENvbW1hbmQpIHtcbiAgICAgIGNvbnN0IGNtZCA9IHRoaXMuZ2V0Q29tbWFuZCh0aGlzLmRlZmF1bHRDb21tYW5kLCB0cnVlKTtcblxuICAgICAgaWYgKCFjbWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IERlZmF1bHRDb21tYW5kTm90Rm91bmQoXG4gICAgICAgICAgdGhpcy5kZWZhdWx0Q29tbWFuZCxcbiAgICAgICAgICB0aGlzLmdldENvbW1hbmRzKCksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNtZC5fZ2xvYmFsUGFyZW50ID0gdGhpcztcbiAgICAgIGF3YWl0IGNtZC5leGVjdXRlKG9wdGlvbnMsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7IG9wdGlvbnMsIGFyZ3MsIGNtZDogdGhpcywgbGl0ZXJhbDogdGhpcy5saXRlcmFsQXJncyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgZXh0ZXJuYWwgc3ViLWNvbW1hbmQuXG4gICAqIEBwYXJhbSBhcmdzIFJhdyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGV4ZWN1dGVFeGVjdXRhYmxlKGFyZ3M6IHN0cmluZ1tdKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IHRoaXMuZ2V0UGF0aCgpLnJlcGxhY2UoL1xccysvZywgXCItXCIpO1xuXG4gICAgYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5yZXF1ZXN0KHsgbmFtZTogXCJydW5cIiwgY29tbWFuZCB9KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm9jZXNzOiBEZW5vLlByb2Nlc3MgPSBEZW5vLnJ1bih7XG4gICAgICAgIGNtZDogW2NvbW1hbmQsIC4uLmFyZ3NdLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBzdGF0dXM6IERlbm8uUHJvY2Vzc1N0YXR1cyA9IGF3YWl0IHByb2Nlc3Muc3RhdHVzKCk7XG4gICAgICBpZiAoIXN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgIERlbm8uZXhpdChzdGF0dXMuY29kZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXhlY3V0YWJsZU5vdEZvdW5kKGNvbW1hbmQpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHJhdyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICAgKiBAcGFyYW0gYXJncyBSYXcgY29tbWFuZCBsaW5lIGFyZ3VtZW50cy5cbiAgICovXG4gIHByb3RlY3RlZCBwYXJzZUZsYWdzKFxuICAgIGFyZ3M6IHN0cmluZ1tdLFxuICApOiBJRmxhZ3NSZXN1bHQgJiB7IGFjdGlvbk9wdGlvbj86IElPcHRpb24gJiB7IGFjdGlvbjogSUFjdGlvbiB9IH0ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgYWN0aW9uT3B0aW9uOiBJT3B0aW9uICYgeyBhY3Rpb246IElBY3Rpb24gfSB8IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlRmxhZ3MoYXJncywge1xuICAgICAgICBzdG9wRWFybHk6IHRoaXMuX3N0b3BFYXJseSxcbiAgICAgICAgYWxsb3dFbXB0eTogdGhpcy5fYWxsb3dFbXB0eSxcbiAgICAgICAgZmxhZ3M6IHRoaXMuZ2V0T3B0aW9ucyh0cnVlKSxcbiAgICAgICAgcGFyc2U6ICh0eXBlOiBJVHlwZUluZm8pID0+IHRoaXMucGFyc2VUeXBlKHR5cGUpLFxuICAgICAgICBvcHRpb246IChvcHRpb246IElGbGFnT3B0aW9ucykgPT4ge1xuICAgICAgICAgIGlmICghYWN0aW9uT3B0aW9uICYmIChvcHRpb24gYXMgSU9wdGlvbikuYWN0aW9uKSB7XG4gICAgICAgICAgICBhY3Rpb25PcHRpb24gPSBvcHRpb24gYXMgSU9wdGlvbiAmIHsgYWN0aW9uOiBJQWN0aW9uIH07XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4geyAuLi5yZXN1bHQsIGFjdGlvbk9wdGlvbiB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBGbGFnc1ZhbGlkYXRpb25FcnJvcikge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqIFBhcnNlIGFyZ3VtZW50IHR5cGUuICovXG4gIHByb3RlY3RlZCBwYXJzZVR5cGUodHlwZTogSVR5cGVJbmZvKTogdW5rbm93biB7XG4gICAgY29uc3QgdHlwZVNldHRpbmdzOiBJVHlwZSB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0VHlwZSh0eXBlLnR5cGUpO1xuXG4gICAgaWYgKCF0eXBlU2V0dGluZ3MpIHtcbiAgICAgIHRocm93IG5ldyBVbmtub3duVHlwZShcbiAgICAgICAgdHlwZS50eXBlLFxuICAgICAgICB0aGlzLmdldFR5cGVzKCkubWFwKCh0eXBlKSA9PiB0eXBlLm5hbWUpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZVNldHRpbmdzLmhhbmRsZXIgaW5zdGFuY2VvZiBUeXBlXG4gICAgICA/IHR5cGVTZXR0aW5ncy5oYW5kbGVyLnBhcnNlKHR5cGUpXG4gICAgICA6IHR5cGVTZXR0aW5ncy5oYW5kbGVyKHR5cGUpO1xuICB9XG5cbiAgLyoqIFZhbGlkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcy4gKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHBhcnNlRW52VmFycygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gICAgY29uc3QgZW52VmFycyA9IHRoaXMuZ2V0RW52VmFycyh0cnVlKTtcbiAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG5cbiAgICBpZiAoIWVudlZhcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNvbnN0IGhhc0VudlBlcm1pc3Npb25zID0gKGF3YWl0IERlbm8ucGVybWlzc2lvbnMucXVlcnkoe1xuICAgICAgbmFtZTogXCJlbnZcIixcbiAgICB9KSkuc3RhdGUgPT09IFwiZ3JhbnRlZFwiO1xuXG4gICAgZm9yIChjb25zdCBlbnYgb2YgZW52VmFycykge1xuICAgICAgY29uc3QgbmFtZSA9IGhhc0VudlBlcm1pc3Npb25zICYmIGVudi5uYW1lcy5maW5kKFxuICAgICAgICAobmFtZTogc3RyaW5nKSA9PiAhIURlbm8uZW52LmdldChuYW1lKSxcbiAgICAgICk7XG5cbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHVuZGVyc2NvcmVUb0NhbWVsQ2FzZShcbiAgICAgICAgICBlbnYucHJlZml4XG4gICAgICAgICAgICA/IGVudi5uYW1lc1swXS5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke2Vudi5wcmVmaXh9YCksIFwiXCIpXG4gICAgICAgICAgICA6IGVudi5uYW1lc1swXSxcbiAgICAgICAgKTtcblxuICAgICAgICByZXN1bHRbcHJvcGVydHlOYW1lXSA9IHRoaXMucGFyc2VUeXBlKHtcbiAgICAgICAgICBsYWJlbDogXCJFbnZpcm9ubWVudCB2YXJpYWJsZVwiLFxuICAgICAgICAgIHR5cGU6IGVudi50eXBlLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdmFsdWU6IERlbm8uZW52LmdldChuYW1lKSA/PyBcIlwiLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZW52LnZhbHVlICYmIHR5cGVvZiByZXN1bHRbcHJvcGVydHlOYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHJlc3VsdFtwcm9wZXJ0eU5hbWVdID0gZW52LnZhbHVlKHJlc3VsdFtwcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbnYucmVxdWlyZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdSZXF1aXJlZEVudlZhcihlbnYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgY29tbWFuZC1saW5lIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIGFyZ3MgIFJhdyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLlxuICAgKiBAcGFyYW0gZmxhZ3MgUGFyc2VkIGNvbW1hbmQgbGluZSBvcHRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIHBhcnNlQXJndW1lbnRzKGFyZ3M6IHN0cmluZ1tdLCBmbGFnczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBDQSB7XG4gICAgY29uc3QgcGFyYW1zOiBBcnJheTx1bmtub3duPiA9IFtdO1xuXG4gICAgLy8gcmVtb3ZlIGFycmF5IHJlZmVyZW5jZVxuICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDApO1xuXG4gICAgaWYgKCF0aGlzLmhhc0FyZ3VtZW50cygpKSB7XG4gICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzQ29tbWFuZHModHJ1ZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbW1hbmQoYXJnc1swXSwgdGhpcy5nZXRDb21tYW5kcygpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTm9Bcmd1bWVudHNBbGxvd2VkKHRoaXMuZ2V0UGF0aCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkID0gdGhpcy5nZXRBcmd1bWVudHMoKVxuICAgICAgICAgIC5maWx0ZXIoKGV4cGVjdGVkQXJnKSA9PiAhZXhwZWN0ZWRBcmcub3B0aW9uYWxWYWx1ZSlcbiAgICAgICAgICAubWFwKChleHBlY3RlZEFyZykgPT4gZXhwZWN0ZWRBcmcubmFtZSk7XG5cbiAgICAgICAgaWYgKHJlcXVpcmVkLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IGZsYWdOYW1lczogc3RyaW5nW10gPSBPYmplY3Qua2V5cyhmbGFncyk7XG4gICAgICAgICAgY29uc3QgaGFzU3RhbmRhbG9uZU9wdGlvbiA9ICEhZmxhZ05hbWVzLmZpbmQoKG5hbWUpID0+XG4gICAgICAgICAgICB0aGlzLmdldE9wdGlvbihuYW1lLCB0cnVlKT8uc3RhbmRhbG9uZVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoIWhhc1N0YW5kYWxvbmVPcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNaXNzaW5nQXJndW1lbnRzKHJlcXVpcmVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgZXhwZWN0ZWRBcmcgb2YgdGhpcy5nZXRBcmd1bWVudHMoKSkge1xuICAgICAgICAgIGlmICghYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChleHBlY3RlZEFyZy5vcHRpb25hbFZhbHVlKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IE1pc3NpbmdBcmd1bWVudChgTWlzc2luZyBhcmd1bWVudDogJHtleHBlY3RlZEFyZy5uYW1lfWApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBhcmc6IHVua25vd247XG5cbiAgICAgICAgICBpZiAoZXhwZWN0ZWRBcmcudmFyaWFkaWMpIHtcbiAgICAgICAgICAgIGFyZyA9IGFyZ3Muc3BsaWNlKDAsIGFyZ3MubGVuZ3RoKVxuICAgICAgICAgICAgICAubWFwKCh2YWx1ZSkgPT5cbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogXCJBcmd1bWVudFwiLFxuICAgICAgICAgICAgICAgICAgdHlwZTogZXhwZWN0ZWRBcmcudHlwZSxcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGV4cGVjdGVkQXJnLm5hbWUsXG4gICAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcmcgPSB0aGlzLnBhcnNlVHlwZSh7XG4gICAgICAgICAgICAgIGxhYmVsOiBcIkFyZ3VtZW50XCIsXG4gICAgICAgICAgICAgIHR5cGU6IGV4cGVjdGVkQXJnLnR5cGUsXG4gICAgICAgICAgICAgIG5hbWU6IGV4cGVjdGVkQXJnLm5hbWUsXG4gICAgICAgICAgICAgIHZhbHVlOiBhcmdzLnNoaWZ0KCkgYXMgc3RyaW5nLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGFyZykge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goYXJnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVG9vTWFueUFyZ3VtZW50cyhhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXMgYXMgQ0E7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGVycm9yLiBJZiBgdGhyb3dFcnJvcnNgIGlzIGVuYWJsZWQgdGhlIGVycm9yIHdpbGwgYmUgcmV0dXJuZWQsXG4gICAqIG90aGVyd2lzZSBhIGZvcm1hdHRlZCBlcnJvciBtZXNzYWdlIHdpbGwgYmUgcHJpbnRlZCBhbmQgYERlbm8uZXhpdCgxKWBcbiAgICogd2lsbCBiZSBjYWxsZWQuXG4gICAqIEBwYXJhbSBlcnJvciBFcnJvciB0byBoYW5kbGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgZXJyb3IoZXJyb3I6IEVycm9yKTogRXJyb3Ige1xuICAgIGlmICh0aGlzLnNob3VsZFRocm93RXJyb3JzKCkgfHwgIShlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHtcbiAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG4gICAgdGhpcy5zaG93SGVscCgpO1xuICAgIGNvbnNvbGUuZXJyb3IocmVkKGAgICR7Ym9sZChcImVycm9yXCIpfTogJHtlcnJvci5tZXNzYWdlfVxcbmApKTtcbiAgICBEZW5vLmV4aXQoZXJyb3IgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IgPyBlcnJvci5leGl0Q29kZSA6IDEpO1xuICB9XG5cbiAgLyoqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKiAqKiogR0VUVEVSICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG4gIC8qKiBHZXQgY29tbWFuZCBuYW1lLiAqL1xuICBwdWJsaWMgZ2V0TmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgLyoqIEdldCBwYXJlbnQgY29tbWFuZC4gKi9cbiAgcHVibGljIGdldFBhcmVudCgpOiBQIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50IGFzIFA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHBhcmVudCBjb21tYW5kIGZyb20gZ2xvYmFsIGV4ZWN1dGVkIGNvbW1hbmQuXG4gICAqIEJlIHN1cmUsIHRvIGNhbGwgdGhpcyBtZXRob2Qgb25seSBpbnNpZGUgYW4gYWN0aW9uIGhhbmRsZXIuIFVubGVzcyB0aGlzIG9yIGFueSBjaGlsZCBjb21tYW5kIHdhcyBleGVjdXRlZCxcbiAgICogdGhpcyBtZXRob2QgcmV0dXJucyBhbHdheXMgdW5kZWZpbmVkLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbFBhcmVudCgpOiBDb21tYW5kIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fZ2xvYmFsUGFyZW50O1xuICB9XG5cbiAgLyoqIEdldCBtYWluIGNvbW1hbmQuICovXG4gIHB1YmxpYyBnZXRNYWluQ29tbWFuZCgpOiBDb21tYW5kIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50Py5nZXRNYWluQ29tbWFuZCgpID8/IHRoaXM7XG4gIH1cblxuICAvKiogR2V0IGNvbW1hbmQgbmFtZSBhbGlhc2VzLiAqL1xuICBwdWJsaWMgZ2V0QWxpYXNlcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuYWxpYXNlcztcbiAgfVxuXG4gIC8qKiBHZXQgZnVsbCBjb21tYW5kIHBhdGguICovXG4gIHB1YmxpYyBnZXRQYXRoKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudFxuICAgICAgPyB0aGlzLl9wYXJlbnQuZ2V0UGF0aCgpICsgXCIgXCIgKyB0aGlzLl9uYW1lXG4gICAgICA6IHRoaXMuX25hbWU7XG4gIH1cblxuICAvKiogR2V0IGFyZ3VtZW50cyBkZWZpbml0aW9uLiBFLmc6IDxpbnB1dC1maWxlOnN0cmluZz4gPG91dHB1dC1maWxlOnN0cmluZz4gKi9cbiAgcHVibGljIGdldEFyZ3NEZWZpbml0aW9uKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuYXJnc0RlZmluaXRpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFyZ3VtZW50IGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGFyZ3VtZW50LlxuICAgKi9cbiAgcHVibGljIGdldEFyZ3VtZW50KG5hbWU6IHN0cmluZyk6IElBcmd1bWVudCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXJndW1lbnRzKCkuZmluZCgoYXJnKSA9PiBhcmcubmFtZSA9PT0gbmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGFyZ3VtZW50cy4gKi9cbiAgcHVibGljIGdldEFyZ3VtZW50cygpOiBJQXJndW1lbnRbXSB7XG4gICAgaWYgKCF0aGlzLmFyZ3MubGVuZ3RoICYmIHRoaXMuYXJnc0RlZmluaXRpb24pIHtcbiAgICAgIHRoaXMuYXJncyA9IHBhcnNlQXJndW1lbnRzRGVmaW5pdGlvbih0aGlzLmFyZ3NEZWZpbml0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hcmdzO1xuICB9XG5cbiAgLyoqIENoZWNrIGlmIGNvbW1hbmQgaGFzIGFyZ3VtZW50cy4gKi9cbiAgcHVibGljIGhhc0FyZ3VtZW50cygpIHtcbiAgICByZXR1cm4gISF0aGlzLmFyZ3NEZWZpbml0aW9uO1xuICB9XG5cbiAgLyoqIEdldCBjb21tYW5kIHZlcnNpb24uICovXG4gIHB1YmxpYyBnZXRWZXJzaW9uKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VmVyc2lvbkhhbmRsZXIoKT8uY2FsbCh0aGlzLCB0aGlzKTtcbiAgfVxuXG4gIC8qKiBHZXQgaGVscCBoYW5kbGVyIG1ldGhvZC4gKi9cbiAgcHJpdmF0ZSBnZXRWZXJzaW9uSGFuZGxlcigpOiBJVmVyc2lvbkhhbmRsZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnZlciA/PyB0aGlzLl9wYXJlbnQ/LmdldFZlcnNpb25IYW5kbGVyKCk7XG4gIH1cblxuICAvKiogR2V0IGNvbW1hbmQgZGVzY3JpcHRpb24uICovXG4gIHB1YmxpYyBnZXREZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIC8vIGNhbGwgZGVzY3JpcHRpb24gbWV0aG9kIG9ubHkgb25jZVxuICAgIHJldHVybiB0eXBlb2YgdGhpcy5kZXNjID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gdGhpcy5kZXNjID0gdGhpcy5kZXNjKClcbiAgICAgIDogdGhpcy5kZXNjO1xuICB9XG5cbiAgcHVibGljIGdldFVzYWdlKCkge1xuICAgIHJldHVybiB0aGlzLl91c2FnZSA/PyB0aGlzLmdldEFyZ3NEZWZpbml0aW9uKCk7XG4gIH1cblxuICAvKiogR2V0IHNob3J0IGNvbW1hbmQgZGVzY3JpcHRpb24uIFRoaXMgaXMgdGhlIGZpcnN0IGxpbmUgb2YgdGhlIGRlc2NyaXB0aW9uLiAqL1xuICBwdWJsaWMgZ2V0U2hvcnREZXNjcmlwdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldERlc2NyaXB0aW9uKClcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdChcIlxcblwiLCAxKVswXTtcbiAgfVxuXG4gIC8qKiBHZXQgb3JpZ2luYWwgY29tbWFuZC1saW5lIGFyZ3VtZW50cy4gKi9cbiAgcHVibGljIGdldFJhd0FyZ3MoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLnJhd0FyZ3M7XG4gIH1cblxuICAvKiogR2V0IGFsbCBhcmd1bWVudHMgZGVmaW5lZCBhZnRlciB0aGUgZG91YmxlIGRhc2guICovXG4gIHB1YmxpYyBnZXRMaXRlcmFsQXJncygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGl0ZXJhbEFyZ3M7XG4gIH1cblxuICAvKiogT3V0cHV0IGdlbmVyYXRlZCBoZWxwIHdpdGhvdXQgZXhpdGluZy4gKi9cbiAgcHVibGljIHNob3dWZXJzaW9uKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0VmVyc2lvbigpKTtcbiAgfVxuXG4gIC8qKiBPdXRwdXQgZ2VuZXJhdGVkIGhlbHAgd2l0aG91dCBleGl0aW5nLiAqL1xuICBwdWJsaWMgc2hvd0hlbHAob3B0aW9ucz86IEhlbHBPcHRpb25zKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2codGhpcy5nZXRIZWxwKG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKiBHZXQgZ2VuZXJhdGVkIGhlbHAuICovXG4gIHB1YmxpYyBnZXRIZWxwKG9wdGlvbnM/OiBIZWxwT3B0aW9ucyk6IHN0cmluZyB7XG4gICAgdGhpcy5yZWdpc3RlckRlZmF1bHRzKCk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SGVscEhhbmRsZXIoKS5jYWxsKHRoaXMsIHRoaXMsIG9wdGlvbnMgPz8ge30pO1xuICB9XG5cbiAgLyoqIEdldCBoZWxwIGhhbmRsZXIgbWV0aG9kLiAqL1xuICBwcml2YXRlIGdldEhlbHBIYW5kbGVyKCk6IElIZWxwSGFuZGxlciB7XG4gICAgcmV0dXJuIHRoaXMuX2hlbHAgPz8gdGhpcy5fcGFyZW50Py5nZXRIZWxwSGFuZGxlcigpIGFzIElIZWxwSGFuZGxlcjtcbiAgfVxuXG4gIHByaXZhdGUgZXhpdChjb2RlID0gMCkge1xuICAgIGlmICh0aGlzLnNob3VsZEV4aXQoKSkge1xuICAgICAgRGVuby5leGl0KGNvZGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICogKioqIE9iamVjdCBHRVRURVIgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIG9wdGlvbnMgb3Igbm90LlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgaGFzT3B0aW9ucyhoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T3B0aW9ucyhoaWRkZW4pLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG9wdGlvbnMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRPcHRpb25zKGhpZGRlbj86IGJvb2xlYW4pOiBJT3B0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbE9wdGlvbnMoaGlkZGVuKS5jb25jYXQodGhpcy5nZXRCYXNlT3B0aW9ucyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBvcHRpb25zLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZU9wdGlvbnMoaGlkZGVuPzogYm9vbGVhbik6IElPcHRpb25bXSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpZGRlblxuICAgICAgPyB0aGlzLm9wdGlvbnMuc2xpY2UoMClcbiAgICAgIDogdGhpcy5vcHRpb25zLmZpbHRlcigob3B0KSA9PiAhb3B0LmhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBvcHRpb25zLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsT3B0aW9ucyhoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbltdIHtcbiAgICBjb25zdCBnZXRPcHRpb25zID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgb3B0aW9uczogSU9wdGlvbltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJT3B0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgY21kLm9wdGlvbnMuZm9yRWFjaCgob3B0aW9uOiBJT3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG9wdGlvbi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMub3B0aW9ucy5maW5kKChvcHQpID0+IG9wdC5uYW1lID09PSBvcHRpb24ubmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihvcHRpb24ubmFtZSkgPT09IC0xICYmXG4gICAgICAgICAgICAgIChoaWRkZW4gfHwgIW9wdGlvbi5oaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChvcHRpb24ubmFtZSk7XG4gICAgICAgICAgICAgIG9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldE9wdGlvbnMoY21kLl9wYXJlbnQsIG9wdGlvbnMsIG5hbWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfTtcblxuICAgIHJldHVybiBnZXRPcHRpb25zKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIGFuIG9wdGlvbiB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGhhc09wdGlvbihuYW1lOiBzdHJpbmcsIGhpZGRlbj86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdldE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBvcHRpb24gYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QmFzZU9wdGlvbihuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBiYXNlIG9wdGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgb3B0aW9uID0gdGhpcy5vcHRpb25zLmZpbmQoKG9wdGlvbikgPT4gb3B0aW9uLm5hbWUgPT09IG5hbWUpO1xuXG4gICAgcmV0dXJuIG9wdGlvbiAmJiAoaGlkZGVuIHx8ICFvcHRpb24uaGlkZGVuKSA/IG9wdGlvbiA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIG9wdGlvbiBmcm9tIHBhcmVudCBjb21tYW5kJ3MgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgb3B0aW9uLiBNdXN0IGJlIGluIHBhcmFtLWNhc2UuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXRHbG9iYWxPcHRpb24obmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcHRpb246IElPcHRpb24gfCB1bmRlZmluZWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZU9wdGlvbihcbiAgICAgIG5hbWUsXG4gICAgICBoaWRkZW4sXG4gICAgKTtcblxuICAgIGlmICghb3B0aW9uIHx8ICFvcHRpb24uZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmdldEdsb2JhbE9wdGlvbihuYW1lLCBoaWRkZW4pO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb247XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG9wdGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBvcHRpb24uIE11c3QgYmUgaW4gcGFyYW0tY2FzZS5cbiAgICovXG4gIHB1YmxpYyByZW1vdmVPcHRpb24obmFtZTogc3RyaW5nKTogSU9wdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wdGlvbnMuZmluZEluZGV4KChvcHRpb24pID0+IG9wdGlvbi5uYW1lID09PSBuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNwbGljZShpbmRleCwgMSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIHN1Yi1jb21tYW5kcyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgaGFzQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldENvbW1hbmRzKGhpZGRlbikubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tbWFuZHMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0Q29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRHbG9iYWxDb21tYW5kcyhoaWRkZW4pLmNvbmNhdCh0aGlzLmdldEJhc2VDb21tYW5kcyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21tYW5kcy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBjb21tYW5kcy5cbiAgICovXG4gIHB1YmxpYyBnZXRCYXNlQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICBjb25zdCBjb21tYW5kcyA9IEFycmF5LmZyb20odGhpcy5jb21tYW5kcy52YWx1ZXMoKSk7XG4gICAgcmV0dXJuIGhpZGRlbiA/IGNvbW1hbmRzIDogY29tbWFuZHMuZmlsdGVyKChjbWQpID0+ICFjbWQuaXNIaWRkZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBnbG9iYWwgY29tbWFuZHMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tbWFuZHMoaGlkZGVuPzogYm9vbGVhbik6IEFycmF5PENvbW1hbmQ+IHtcbiAgICBjb25zdCBnZXRDb21tYW5kcyA9IChcbiAgICAgIGNtZDogQ29tbWFuZCB8IHVuZGVmaW5lZCxcbiAgICAgIGNvbW1hbmRzOiBBcnJheTxDb21tYW5kPiA9IFtdLFxuICAgICAgbmFtZXM6IHN0cmluZ1tdID0gW10sXG4gICAgKTogQXJyYXk8Q29tbWFuZD4gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmNvbW1hbmRzLnNpemUpIHtcbiAgICAgICAgICBjbWQuY29tbWFuZHMuZm9yRWFjaCgoY21kOiBDb21tYW5kKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNtZC5pc0dsb2JhbCAmJlxuICAgICAgICAgICAgICB0aGlzICE9PSBjbWQgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY29tbWFuZHMuaGFzKGNtZC5fbmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihjbWQuX25hbWUpID09PSAtMSAmJlxuICAgICAgICAgICAgICAoaGlkZGVuIHx8ICFjbWQuaXNIaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChjbWQuX25hbWUpO1xuICAgICAgICAgICAgICBjb21tYW5kcy5wdXNoKGNtZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0Q29tbWFuZHMoY21kLl9wYXJlbnQsIGNvbW1hbmRzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjb21tYW5kcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldENvbW1hbmRzKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBjaGlsZCBjb21tYW5kIGV4aXN0cyBieSBnaXZlbiBuYW1lIG9yIGFsaWFzLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9yIGFsaWFzIG9mIHRoZSBjb21tYW5kLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGNvbW1hbmRzLlxuICAgKi9cbiAgcHVibGljIGhhc0NvbW1hbmQobmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZXRDb21tYW5kKG5hbWUsIGhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbW1hbmQgYnkgbmFtZSBvciBhbGlhcy5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBhbGlhcyBvZiB0aGUgY29tbWFuZC5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBjb21tYW5kcy5cbiAgICovXG4gIHB1YmxpYyBnZXRDb21tYW5kKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBoaWRkZW4/OiBib29sZWFuLFxuICApOiBDb21tYW5kIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlQ29tbWFuZChuYW1lLCBoaWRkZW4pID8/XG4gICAgICB0aGlzLmdldEdsb2JhbENvbW1hbmQobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUNvbW1hbmQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGhpZGRlbj86IGJvb2xlYW4sXG4gICk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuICAgIGZvciAoY29uc3QgY21kIG9mIHRoaXMuY29tbWFuZHMudmFsdWVzKCkpIHtcbiAgICAgIGlmIChjbWQuX25hbWUgPT09IG5hbWUgfHwgY21kLmFsaWFzZXMuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIChjbWQgJiYgKGhpZGRlbiB8fCAhY21kLmlzSGlkZGVuKSA/IGNtZCA6IHVuZGVmaW5lZCkgYXNcbiAgICAgICAgICB8IENvbW1hbmRcbiAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBjb21tYW5kIGJ5IG5hbWUgb3IgYWxpYXMuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb3IgYWxpYXMgb2YgdGhlIGNvbW1hbmQuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gY29tbWFuZHMuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tbWFuZChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaGlkZGVuPzogYm9vbGVhbixcbiAgKTogQ29tbWFuZCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbWQgPSB0aGlzLl9wYXJlbnQuZ2V0QmFzZUNvbW1hbmQobmFtZSwgaGlkZGVuKTtcblxuICAgIGlmICghY21kPy5pc0dsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxDb21tYW5kKG5hbWUsIGhpZGRlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNtZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgc3ViLWNvbW1hbmQgYnkgbmFtZSBvciBhbGlhcy5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBhbGlhcyBvZiB0aGUgY29tbWFuZC5cbiAgICovXG4gIHB1YmxpYyByZW1vdmVDb21tYW5kKG5hbWU6IHN0cmluZyk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmdldEJhc2VDb21tYW5kKG5hbWUsIHRydWUpO1xuXG4gICAgaWYgKGNvbW1hbmQpIHtcbiAgICAgIHRoaXMuY29tbWFuZHMuZGVsZXRlKGNvbW1hbmQuX25hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjb21tYW5kO1xuICB9XG5cbiAgLyoqIEdldCB0eXBlcy4gKi9cbiAgcHVibGljIGdldFR5cGVzKCk6IElUeXBlW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbFR5cGVzKCkuY29uY2F0KHRoaXMuZ2V0QmFzZVR5cGVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBiYXNlIHR5cGVzLiAqL1xuICBwdWJsaWMgZ2V0QmFzZVR5cGVzKCk6IElUeXBlW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMudHlwZXMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqIEdldCBnbG9iYWwgdHlwZXMuICovXG4gIHB1YmxpYyBnZXRHbG9iYWxUeXBlcygpOiBJVHlwZVtdIHtcbiAgICBjb25zdCBnZXRUeXBlcyA9IChcbiAgICAgIGNtZDogQ29tbWFuZCB8IHVuZGVmaW5lZCxcbiAgICAgIHR5cGVzOiBJVHlwZVtdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJVHlwZVtdID0+IHtcbiAgICAgIGlmIChjbWQpIHtcbiAgICAgICAgaWYgKGNtZC50eXBlcy5zaXplKSB7XG4gICAgICAgICAgY21kLnR5cGVzLmZvckVhY2goKHR5cGU6IElUeXBlKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHR5cGUuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICF0aGlzLnR5cGVzLmhhcyh0eXBlLm5hbWUpICYmXG4gICAgICAgICAgICAgIG5hbWVzLmluZGV4T2YodHlwZS5uYW1lKSA9PT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHR5cGUubmFtZSk7XG4gICAgICAgICAgICAgIHR5cGVzLnB1c2godHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0VHlwZXMoY21kLl9wYXJlbnQsIHR5cGVzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldFR5cGVzKHRoaXMuX3BhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHR5cGUgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgdHlwZS5cbiAgICovXG4gIHB1YmxpYyBnZXRUeXBlKG5hbWU6IHN0cmluZyk6IElUeXBlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCYXNlVHlwZShuYW1lKSA/PyB0aGlzLmdldEdsb2JhbFR5cGUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJhc2UgdHlwZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSB0eXBlLlxuICAgKi9cbiAgcHVibGljIGdldEJhc2VUeXBlKG5hbWU6IHN0cmluZyk6IElUeXBlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy50eXBlcy5nZXQobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCB0eXBlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIHR5cGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsVHlwZShuYW1lOiBzdHJpbmcpOiBJVHlwZSB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbWQ6IElUeXBlIHwgdW5kZWZpbmVkID0gdGhpcy5fcGFyZW50LmdldEJhc2VUeXBlKG5hbWUpO1xuXG4gICAgaWYgKCFjbWQ/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxUeXBlKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBjbWQ7XG4gIH1cblxuICAvKiogR2V0IGNvbXBsZXRpb25zLiAqL1xuICBwdWJsaWMgZ2V0Q29tcGxldGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R2xvYmFsQ29tcGxldGlvbnMoKS5jb25jYXQodGhpcy5nZXRCYXNlQ29tcGxldGlvbnMoKSk7XG4gIH1cblxuICAvKiogR2V0IGJhc2UgY29tcGxldGlvbnMuICovXG4gIHB1YmxpYyBnZXRCYXNlQ29tcGxldGlvbnMoKTogSUNvbXBsZXRpb25bXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5jb21wbGV0aW9ucy52YWx1ZXMoKSk7XG4gIH1cblxuICAvKiogR2V0IGdsb2JhbCBjb21wbGV0aW9ucy4gKi9cbiAgcHVibGljIGdldEdsb2JhbENvbXBsZXRpb25zKCk6IElDb21wbGV0aW9uW10ge1xuICAgIGNvbnN0IGdldENvbXBsZXRpb25zID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgY29tcGxldGlvbnM6IElDb21wbGV0aW9uW10gPSBbXSxcbiAgICAgIG5hbWVzOiBzdHJpbmdbXSA9IFtdLFxuICAgICk6IElDb21wbGV0aW9uW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmNvbXBsZXRpb25zLnNpemUpIHtcbiAgICAgICAgICBjbWQuY29tcGxldGlvbnMuZm9yRWFjaCgoY29tcGxldGlvbjogSUNvbXBsZXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29tcGxldGlvbi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY29tcGxldGlvbnMuaGFzKGNvbXBsZXRpb24ubmFtZSkgJiZcbiAgICAgICAgICAgICAgbmFtZXMuaW5kZXhPZihjb21wbGV0aW9uLm5hbWUpID09PSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIG5hbWVzLnB1c2goY29tcGxldGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgY29tcGxldGlvbnMucHVzaChjb21wbGV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRDb21wbGV0aW9ucyhjbWQuX3BhcmVudCwgY29tcGxldGlvbnMsIG5hbWVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbXBsZXRpb25zO1xuICAgIH07XG5cbiAgICByZXR1cm4gZ2V0Q29tcGxldGlvbnModGhpcy5fcGFyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29tcGxldGlvbiBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBjb21wbGV0aW9uLlxuICAgKi9cbiAgcHVibGljIGdldENvbXBsZXRpb24obmFtZTogc3RyaW5nKTogSUNvbXBsZXRpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VDb21wbGV0aW9uKG5hbWUpID8/IHRoaXMuZ2V0R2xvYmFsQ29tcGxldGlvbihuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBjb21wbGV0aW9uIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUNvbXBsZXRpb24obmFtZTogc3RyaW5nKTogSUNvbXBsZXRpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbXBsZXRpb25zLmdldChuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGNvbXBsZXRpb25zIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGNvbXBsZXRpb24uXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsQ29tcGxldGlvbihuYW1lOiBzdHJpbmcpOiBJQ29tcGxldGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0aW9uOiBJQ29tcGxldGlvbiB8IHVuZGVmaW5lZCA9IHRoaXMuX3BhcmVudC5nZXRCYXNlQ29tcGxldGlvbihcbiAgICAgIG5hbWUsXG4gICAgKTtcblxuICAgIGlmICghY29tcGxldGlvbj8uZ2xvYmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGFyZW50LmdldEdsb2JhbENvbXBsZXRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBsZXRpb247XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGNvbW1hbmQgaGFzIGVudmlyb25tZW50IHZhcmlhYmxlcyBvciBub3QuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgaGFzRW52VmFycyhoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RW52VmFycyhoaWRkZW4pLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRFbnZWYXJzKGhpZGRlbj86IGJvb2xlYW4pOiBJRW52VmFyW10ge1xuICAgIHJldHVybiB0aGlzLmdldEdsb2JhbEVudlZhcnMoaGlkZGVuKS5jb25jYXQodGhpcy5nZXRCYXNlRW52VmFycyhoaWRkZW4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0QmFzZUVudlZhcnMoaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXJbXSB7XG4gICAgaWYgKCF0aGlzLmVudlZhcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGhpZGRlblxuICAgICAgPyB0aGlzLmVudlZhcnMuc2xpY2UoMClcbiAgICAgIDogdGhpcy5lbnZWYXJzLmZpbHRlcigoZW52KSA9PiAhZW52LmhpZGRlbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGdsb2JhbCBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0R2xvYmFsRW52VmFycyhoaWRkZW4/OiBib29sZWFuKTogSUVudlZhcltdIHtcbiAgICBjb25zdCBnZXRFbnZWYXJzID0gKFxuICAgICAgY21kOiBDb21tYW5kIHwgdW5kZWZpbmVkLFxuICAgICAgZW52VmFyczogSUVudlZhcltdID0gW10sXG4gICAgICBuYW1lczogc3RyaW5nW10gPSBbXSxcbiAgICApOiBJRW52VmFyW10gPT4ge1xuICAgICAgaWYgKGNtZCkge1xuICAgICAgICBpZiAoY21kLmVudlZhcnMubGVuZ3RoKSB7XG4gICAgICAgICAgY21kLmVudlZhcnMuZm9yRWFjaCgoZW52VmFyOiBJRW52VmFyKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGVudlZhci5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIXRoaXMuZW52VmFycy5maW5kKChlbnYpID0+IGVudi5uYW1lc1swXSA9PT0gZW52VmFyLm5hbWVzWzBdKSAmJlxuICAgICAgICAgICAgICBuYW1lcy5pbmRleE9mKGVudlZhci5uYW1lc1swXSkgPT09IC0xICYmXG4gICAgICAgICAgICAgIChoaWRkZW4gfHwgIWVudlZhci5oaWRkZW4pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChlbnZWYXIubmFtZXNbMF0pO1xuICAgICAgICAgICAgICBlbnZWYXJzLnB1c2goZW52VmFyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRFbnZWYXJzKGNtZC5fcGFyZW50LCBlbnZWYXJzLCBuYW1lcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlbnZWYXJzO1xuICAgIH07XG5cbiAgICByZXR1cm4gZ2V0RW52VmFycyh0aGlzLl9wYXJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBhbiBlbnZpcm9ubWVudCB2YXJpYWJsZSB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBoYXNFbnZWYXIobmFtZTogc3RyaW5nLCBoaWRkZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5nZXRFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZW52aXJvbm1lbnQgdmFyaWFibGUgYnkgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqIEBwYXJhbSBoaWRkZW4gSW5jbHVkZSBoaWRkZW4gZW52aXJvbm1lbnQgdmFyaWFibGUuXG4gICAqL1xuICBwdWJsaWMgZ2V0RW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldEJhc2VFbnZWYXIobmFtZSwgaGlkZGVuKSA/P1xuICAgICAgdGhpcy5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYmFzZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBieSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICogQHBhcmFtIGhpZGRlbiBJbmNsdWRlIGhpZGRlbiBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAgICovXG4gIHB1YmxpYyBnZXRCYXNlRW52VmFyKG5hbWU6IHN0cmluZywgaGlkZGVuPzogYm9vbGVhbik6IElFbnZWYXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGVudlZhcjogSUVudlZhciB8IHVuZGVmaW5lZCA9IHRoaXMuZW52VmFycy5maW5kKChlbnYpID0+XG4gICAgICBlbnYubmFtZXMuaW5kZXhPZihuYW1lKSAhPT0gLTFcbiAgICApO1xuXG4gICAgcmV0dXJuIGVudlZhciAmJiAoaGlkZGVuIHx8ICFlbnZWYXIuaGlkZGVuKSA/IGVudlZhciA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGVudmlyb25tZW50IHZhcmlhYmxlIGJ5IG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKiBAcGFyYW0gaGlkZGVuIEluY2x1ZGUgaGlkZGVuIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICAgKi9cbiAgcHVibGljIGdldEdsb2JhbEVudlZhcihuYW1lOiBzdHJpbmcsIGhpZGRlbj86IGJvb2xlYW4pOiBJRW52VmFyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVudlZhcjogSUVudlZhciB8IHVuZGVmaW5lZCA9IHRoaXMuX3BhcmVudC5nZXRCYXNlRW52VmFyKFxuICAgICAgbmFtZSxcbiAgICAgIGhpZGRlbixcbiAgICApO1xuXG4gICAgaWYgKCFlbnZWYXI/Lmdsb2JhbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5nZXRHbG9iYWxFbnZWYXIobmFtZSwgaGlkZGVuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW52VmFyO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBjb21tYW5kIGhhcyBleGFtcGxlcyBvciBub3QuICovXG4gIHB1YmxpYyBoYXNFeGFtcGxlcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5leGFtcGxlcy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqIEdldCBhbGwgZXhhbXBsZXMuICovXG4gIHB1YmxpYyBnZXRFeGFtcGxlcygpOiBJRXhhbXBsZVtdIHtcbiAgICByZXR1cm4gdGhpcy5leGFtcGxlcztcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgY29tbWFuZCBoYXMgYW4gZXhhbXBsZSB3aXRoIGdpdmVuIG5hbWUgb3Igbm90LiAqL1xuICBwdWJsaWMgaGFzRXhhbXBsZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmdldEV4YW1wbGUobmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGV4YW1wbGUgd2l0aCBnaXZlbiBuYW1lLiAqL1xuICBwdWJsaWMgZ2V0RXhhbXBsZShuYW1lOiBzdHJpbmcpOiBJRXhhbXBsZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXhhbXBsZXMuZmluZCgoZXhhbXBsZSkgPT4gZXhhbXBs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