/** Generates zsh completions script. */ export class ZshCompletionsGenerator {
    cmd;
    actions = new Map();
    /** Generates zsh completions script for given command. */ static generate(cmd) {
        return new ZshCompletionsGenerator(cmd).generate();
    }
    constructor(cmd){
        this.cmd = cmd;
    }
    /** Generates zsh completions code. */ generate() {
        const path = this.cmd.getPath();
        const name = this.cmd.getName();
        const version = this.cmd.getVersion() ? ` v${this.cmd.getVersion()}` : "";
        return `#!/usr/bin/env zsh
# zsh completion support for ${path}${version}

autoload -U is-at-least

# shellcheck disable=SC2154
(( $+functions[__${replaceSpecialChars(name)}_complete] )) ||
function __${replaceSpecialChars(name)}_complete {
  local name="$1"; shift
  local action="$1"; shift
  integer ret=1
  local -a values
  local expl lines
  _tags "$name"
  while _tags; do
    if _requested "$name"; then
      # shellcheck disable=SC2034
      lines="$(${name} completions complete "\${action}" "\${@}")"
      values=("\${(ps:\\n:)lines}")
      if (( \${#values[@]} )); then
        while _next_label "$name" expl "$action"; do
          compadd -S '' "\${expl[@]}" "\${values[@]}"
        done
      fi
    fi
  done
}

${this.generateCompletions(this.cmd).trim()}

# _${replaceSpecialChars(path)} "\${@}"

compdef _${replaceSpecialChars(path)} ${path}

`;
    }
    /** Generates zsh completions method for given command and child commands. */ generateCompletions(command, path = "") {
        if (!command.hasCommands(false) && !command.hasOptions(false) && !command.hasArguments()) {
            return "";
        }
        path = (path ? path + " " : "") + command.getName();
        return `# shellcheck disable=SC2154
(( $+functions[_${replaceSpecialChars(path)}] )) ||
function _${replaceSpecialChars(path)}() {` + (!command.getParent() ? `
  local state` : "") + this.generateCommandCompletions(command, path) + this.generateSubCommandCompletions(command, path) + this.generateArgumentCompletions(command, path) + this.generateActions(command) + `\n}\n\n` + command.getCommands(false).filter((subCommand)=>subCommand !== command
        ).map((subCommand)=>this.generateCompletions(subCommand, path)
        ).join("");
    }
    generateCommandCompletions(command, path) {
        const commands = command.getCommands(false);
        let completions = commands.map((subCommand)=>`'${subCommand.getName()}:${subCommand.getShortDescription()}'`
        ).join("\n      ");
        if (completions) {
            completions = `
    local -a commands
    # shellcheck disable=SC2034
    commands=(
      ${completions}
    )
    _describe 'command' commands`;
        }
        if (command.hasArguments()) {
            const completionsPath = path.split(" ").slice(1).join(" ");
            // @TODO: support multiple arguments zsh completions
            const arg = command.getArguments()[0];
            const action = this.addAction(arg, completionsPath);
            if (action && command.getCompletion(arg.action)) {
                completions += `\n    __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd}`;
            }
        }
        if (completions) {
            completions = `\n\n  function _commands() {${completions}\n  }`;
        }
        return completions;
    }
    generateSubCommandCompletions(command, path) {
        if (command.hasCommands(false)) {
            const actions = command.getCommands(false).map((command)=>`${command.getName()}) _${replaceSpecialChars(path + " " + command.getName())} ;;`
            ).join("\n      ");
            return `\n
  function _command_args() {
    case "\${words[1]}" in\n      ${actions}\n    esac
  }`;
        }
        return "";
    }
    generateArgumentCompletions(command, path) {
        /* clear actions from previously parsed command. */ this.actions.clear();
        const options = this.generateOptions(command, path);
        let argIndex = 0;
        // @TODO: add stop early option: -A "-*"
        // http://zsh.sourceforge.net/Doc/Release/Completion-System.html
        let argsCommand = "\n\n  _arguments -w -s -S -C";
        if (command.hasOptions()) {
            argsCommand += ` \\\n    ${options.join(" \\\n    ")}`;
        }
        if (command.hasCommands(false) || command.getArguments().filter((arg)=>command.getCompletion(arg.action)
        ).length) {
            argsCommand += ` \\\n    '${++argIndex}: :_commands'`;
        }
        if (command.hasArguments() || command.hasCommands(false)) {
            const args = [];
            for (const arg of command.getArguments().slice(1)){
                const completionsPath = path.split(" ").slice(1).join(" ");
                const action = this.addAction(arg, completionsPath);
                args.push(`${++argIndex}${arg.optionalValue ? "::" : ":"}${action.name}`);
            }
            argsCommand += args.map((arg)=>`\\\n    '${arg}'`
            ).join("");
            if (command.hasCommands(false)) {
                argsCommand += ` \\\n    '*:: :->command_args'`;
            }
        }
        return argsCommand;
    }
    generateOptions(command, path) {
        const options = [];
        const cmdArgs = path.split(" ");
        const _baseName = cmdArgs.shift();
        const completionsPath = cmdArgs.join(" ");
        const excludedFlags = command.getOptions(false).map((option)=>option.standalone ? option.flags : false
        ).flat().filter((flag)=>typeof flag === "string"
        );
        for (const option of command.getOptions(false)){
            options.push(this.generateOption(option, completionsPath, excludedFlags));
        }
        return options;
    }
    generateOption(option, completionsPath, excludedOptions) {
        const flags = option.flags;
        let excludedFlags = option.conflicts?.length ? [
            ...excludedOptions,
            ...option.conflicts.map((opt)=>"--" + opt.replace(/^--/, "")
            ), 
        ] : excludedOptions;
        excludedFlags = option.collect ? excludedFlags : [
            ...excludedFlags,
            ...flags, 
        ];
        let args = "";
        for (const arg of option.args){
            const action = this.addAction(arg, completionsPath);
            if (arg.variadic) {
                args += `${arg.optionalValue ? "::" : ":"}${arg.name}:->${action.name}`;
            } else {
                args += `${arg.optionalValue ? "::" : ":"}${arg.name}:->${action.name}`;
            }
        }
        let description = option.description.trim().split("\n").shift();
        // escape brackets and quotes
        description = description.replace(/\[/g, "\\[").replace(/]/g, "\\]").replace(/"/g, '\\"').replace(/'/g, "'\"'\"'");
        const collect = option.collect ? "*" : "";
        if (option.standalone) {
            return `'(- *)'{${collect}${flags}}'[${description}]${args}'`;
        } else {
            const excluded = excludedFlags.length ? `'(${excludedFlags.join(" ")})'` : "";
            if (collect || flags.length > 1) {
                return `${excluded}{${collect}${flags}}'[${description}]${args}'`;
            } else {
                return `${excluded}${flags}'[${description}]${args}'`;
            }
        }
    }
    addAction(arg, cmd) {
        const action = `${arg.name}-${arg.action}`;
        if (!this.actions.has(action)) {
            this.actions.set(action, {
                arg: arg,
                label: `${arg.name}: ${arg.action}`,
                name: action,
                cmd
            });
        }
        return this.actions.get(action);
    }
    generateActions(command) {
        let actions = [];
        if (this.actions.size) {
            actions = Array.from(this.actions).map(([name, action])=>`${name}) __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd} ;;`
            );
        }
        if (command.hasCommands(false)) {
            actions.unshift(`command_args) _command_args ;;`);
        }
        if (actions.length) {
            return `\n\n  case "$state" in\n    ${actions.join("\n    ")}\n  esac`;
        }
        return "";
    }
}
function replaceSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9jb21wbGV0aW9ucy9fenNoX2NvbXBsZXRpb25zX2dlbmVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBJQXJndW1lbnQsIElPcHRpb24gfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcblxuaW50ZXJmYWNlIElDb21wbGV0aW9uQWN0aW9uIHtcbiAgYXJnOiBJQXJndW1lbnQ7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY21kOiBzdHJpbmc7XG59XG5cbi8qKiBHZW5lcmF0ZXMgenNoIGNvbXBsZXRpb25zIHNjcmlwdC4gKi9cbmV4cG9ydCBjbGFzcyBac2hDb21wbGV0aW9uc0dlbmVyYXRvciB7XG4gIHByaXZhdGUgYWN0aW9uczogTWFwPHN0cmluZywgSUNvbXBsZXRpb25BY3Rpb24+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBHZW5lcmF0ZXMgenNoIGNvbXBsZXRpb25zIHNjcmlwdCBmb3IgZ2l2ZW4gY29tbWFuZC4gKi9cbiAgcHVibGljIHN0YXRpYyBnZW5lcmF0ZShjbWQ6IENvbW1hbmQpIHtcbiAgICByZXR1cm4gbmV3IFpzaENvbXBsZXRpb25zR2VuZXJhdG9yKGNtZCkuZ2VuZXJhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJvdGVjdGVkIGNtZDogQ29tbWFuZCkge31cblxuICAvKiogR2VuZXJhdGVzIHpzaCBjb21wbGV0aW9ucyBjb2RlLiAqL1xuICBwcml2YXRlIGdlbmVyYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuY21kLmdldFBhdGgoKTtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5jbWQuZ2V0TmFtZSgpO1xuICAgIGNvbnN0IHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXMuY21kLmdldFZlcnNpb24oKVxuICAgICAgPyBgIHYke3RoaXMuY21kLmdldFZlcnNpb24oKX1gXG4gICAgICA6IFwiXCI7XG5cbiAgICByZXR1cm4gYCMhL3Vzci9iaW4vZW52IHpzaFxuIyB6c2ggY29tcGxldGlvbiBzdXBwb3J0IGZvciAke3BhdGh9JHt2ZXJzaW9ufVxuXG5hdXRvbG9hZCAtVSBpcy1hdC1sZWFzdFxuXG4jIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIxNTRcbigoICQrZnVuY3Rpb25zW19fJHtyZXBsYWNlU3BlY2lhbENoYXJzKG5hbWUpfV9jb21wbGV0ZV0gKSkgfHxcbmZ1bmN0aW9uIF9fJHtyZXBsYWNlU3BlY2lhbENoYXJzKG5hbWUpfV9jb21wbGV0ZSB7XG4gIGxvY2FsIG5hbWU9XCIkMVwiOyBzaGlmdFxuICBsb2NhbCBhY3Rpb249XCIkMVwiOyBzaGlmdFxuICBpbnRlZ2VyIHJldD0xXG4gIGxvY2FsIC1hIHZhbHVlc1xuICBsb2NhbCBleHBsIGxpbmVzXG4gIF90YWdzIFwiJG5hbWVcIlxuICB3aGlsZSBfdGFnczsgZG9cbiAgICBpZiBfcmVxdWVzdGVkIFwiJG5hbWVcIjsgdGhlblxuICAgICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMDM0XG4gICAgICBsaW5lcz1cIiQoJHtuYW1lfSBjb21wbGV0aW9ucyBjb21wbGV0ZSBcIlxcJHthY3Rpb259XCIgXCJcXCR7QH1cIilcIlxuICAgICAgdmFsdWVzPShcIlxcJHsocHM6XFxcXG46KWxpbmVzfVwiKVxuICAgICAgaWYgKCggXFwkeyN2YWx1ZXNbQF19ICkpOyB0aGVuXG4gICAgICAgIHdoaWxlIF9uZXh0X2xhYmVsIFwiJG5hbWVcIiBleHBsIFwiJGFjdGlvblwiOyBkb1xuICAgICAgICAgIGNvbXBhZGQgLVMgJycgXCJcXCR7ZXhwbFtAXX1cIiBcIlxcJHt2YWx1ZXNbQF19XCJcbiAgICAgICAgZG9uZVxuICAgICAgZmlcbiAgICBmaVxuICBkb25lXG59XG5cbiR7dGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHRoaXMuY21kKS50cmltKCl9XG5cbiMgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyhwYXRoKX0gXCJcXCR7QH1cIlxuXG5jb21wZGVmIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9ICR7cGF0aH1cblxuYDtcbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZXMgenNoIGNvbXBsZXRpb25zIG1ldGhvZCBmb3IgZ2l2ZW4gY29tbWFuZCBhbmQgY2hpbGQgY29tbWFuZHMuICovXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21wbGV0aW9ucyhjb21tYW5kOiBDb21tYW5kLCBwYXRoID0gXCJcIik6IHN0cmluZyB7XG4gICAgaWYgKFxuICAgICAgIWNvbW1hbmQuaGFzQ29tbWFuZHMoZmFsc2UpICYmICFjb21tYW5kLmhhc09wdGlvbnMoZmFsc2UpICYmXG4gICAgICAhY29tbWFuZC5oYXNBcmd1bWVudHMoKVxuICAgICkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgcGF0aCA9IChwYXRoID8gcGF0aCArIFwiIFwiIDogXCJcIikgKyBjb21tYW5kLmdldE5hbWUoKTtcblxuICAgIHJldHVybiBgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMTU0XG4oKCAkK2Z1bmN0aW9uc1tfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHBhdGgpfV0gKSkgfHxcbmZ1bmN0aW9uIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9KCkge2AgK1xuICAgICAgKCFjb21tYW5kLmdldFBhcmVudCgpXG4gICAgICAgID8gYFxuICBsb2NhbCBzdGF0ZWBcbiAgICAgICAgOiBcIlwiKSArXG4gICAgICB0aGlzLmdlbmVyYXRlQ29tbWFuZENvbXBsZXRpb25zKGNvbW1hbmQsIHBhdGgpICtcbiAgICAgIHRoaXMuZ2VuZXJhdGVTdWJDb21tYW5kQ29tcGxldGlvbnMoY29tbWFuZCwgcGF0aCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUFyZ3VtZW50Q29tcGxldGlvbnMoY29tbWFuZCwgcGF0aCkgK1xuICAgICAgdGhpcy5nZW5lcmF0ZUFjdGlvbnMoY29tbWFuZCkgK1xuICAgICAgYFxcbn1cXG5cXG5gICtcbiAgICAgIGNvbW1hbmQuZ2V0Q29tbWFuZHMoZmFsc2UpXG4gICAgICAgIC5maWx0ZXIoKHN1YkNvbW1hbmQ6IENvbW1hbmQpID0+IHN1YkNvbW1hbmQgIT09IGNvbW1hbmQpXG4gICAgICAgIC5tYXAoKHN1YkNvbW1hbmQ6IENvbW1hbmQpID0+XG4gICAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHN1YkNvbW1hbmQsIHBhdGgpXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcIik7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlQ29tbWFuZENvbXBsZXRpb25zKGNvbW1hbmQ6IENvbW1hbmQsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgY29tbWFuZHMgPSBjb21tYW5kLmdldENvbW1hbmRzKGZhbHNlKTtcblxuICAgIGxldCBjb21wbGV0aW9uczogc3RyaW5nID0gY29tbWFuZHNcbiAgICAgIC5tYXAoKHN1YkNvbW1hbmQ6IENvbW1hbmQpID0+XG4gICAgICAgIGAnJHtzdWJDb21tYW5kLmdldE5hbWUoKX06JHtzdWJDb21tYW5kLmdldFNob3J0RGVzY3JpcHRpb24oKX0nYFxuICAgICAgKVxuICAgICAgLmpvaW4oXCJcXG4gICAgICBcIik7XG5cbiAgICBpZiAoY29tcGxldGlvbnMpIHtcbiAgICAgIGNvbXBsZXRpb25zID0gYFxuICAgIGxvY2FsIC1hIGNvbW1hbmRzXG4gICAgIyBzaGVsbGNoZWNrIGRpc2FibGU9U0MyMDM0XG4gICAgY29tbWFuZHM9KFxuICAgICAgJHtjb21wbGV0aW9uc31cbiAgICApXG4gICAgX2Rlc2NyaWJlICdjb21tYW5kJyBjb21tYW5kc2A7XG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuaGFzQXJndW1lbnRzKCkpIHtcbiAgICAgIGNvbnN0IGNvbXBsZXRpb25zUGF0aDogc3RyaW5nID0gcGF0aC5zcGxpdChcIiBcIikuc2xpY2UoMSkuam9pbihcIiBcIik7XG4gICAgICAvLyBAVE9ETzogc3VwcG9ydCBtdWx0aXBsZSBhcmd1bWVudHMgenNoIGNvbXBsZXRpb25zXG4gICAgICBjb25zdCBhcmc6IElBcmd1bWVudCA9IGNvbW1hbmQuZ2V0QXJndW1lbnRzKClbMF07XG4gICAgICBjb25zdCBhY3Rpb24gPSB0aGlzLmFkZEFjdGlvbihhcmcsIGNvbXBsZXRpb25zUGF0aCk7XG4gICAgICBpZiAoYWN0aW9uICYmIGNvbW1hbmQuZ2V0Q29tcGxldGlvbihhcmcuYWN0aW9uKSkge1xuICAgICAgICBjb21wbGV0aW9ucyArPSBgXFxuICAgIF9fJHtcbiAgICAgICAgICByZXBsYWNlU3BlY2lhbENoYXJzKHRoaXMuY21kLmdldE5hbWUoKSlcbiAgICAgICAgfV9jb21wbGV0ZSAke2FjdGlvbi5hcmcubmFtZX0gJHthY3Rpb24uYXJnLmFjdGlvbn0gJHthY3Rpb24uY21kfWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbXBsZXRpb25zKSB7XG4gICAgICBjb21wbGV0aW9ucyA9IGBcXG5cXG4gIGZ1bmN0aW9uIF9jb21tYW5kcygpIHske2NvbXBsZXRpb25zfVxcbiAgfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBsZXRpb25zO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZVN1YkNvbW1hbmRDb21wbGV0aW9ucyhcbiAgICBjb21tYW5kOiBDb21tYW5kLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgKTogc3RyaW5nIHtcbiAgICBpZiAoY29tbWFuZC5oYXNDb21tYW5kcyhmYWxzZSkpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnM6IHN0cmluZyA9IGNvbW1hbmRcbiAgICAgICAgLmdldENvbW1hbmRzKGZhbHNlKVxuICAgICAgICAubWFwKChjb21tYW5kOiBDb21tYW5kKSA9PlxuICAgICAgICAgIGAke2NvbW1hbmQuZ2V0TmFtZSgpfSkgXyR7XG4gICAgICAgICAgICByZXBsYWNlU3BlY2lhbENoYXJzKHBhdGggKyBcIiBcIiArIGNvbW1hbmQuZ2V0TmFtZSgpKVxuICAgICAgICAgIH0gOztgXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG4gICAgICBcIik7XG5cbiAgICAgIHJldHVybiBgXFxuXG4gIGZ1bmN0aW9uIF9jb21tYW5kX2FyZ3MoKSB7XG4gICAgY2FzZSBcIlxcJHt3b3Jkc1sxXX1cIiBpblxcbiAgICAgICR7YWN0aW9uc31cXG4gICAgZXNhY1xuICB9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVBcmd1bWVudENvbXBsZXRpb25zKGNvbW1hbmQ6IENvbW1hbmQsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLyogY2xlYXIgYWN0aW9ucyBmcm9tIHByZXZpb3VzbHkgcGFyc2VkIGNvbW1hbmQuICovXG4gICAgdGhpcy5hY3Rpb25zLmNsZWFyKCk7XG5cbiAgICBjb25zdCBvcHRpb25zOiBzdHJpbmdbXSA9IHRoaXMuZ2VuZXJhdGVPcHRpb25zKGNvbW1hbmQsIHBhdGgpO1xuXG4gICAgbGV0IGFyZ0luZGV4ID0gMDtcbiAgICAvLyBAVE9ETzogYWRkIHN0b3AgZWFybHkgb3B0aW9uOiAtQSBcIi0qXCJcbiAgICAvLyBodHRwOi8venNoLnNvdXJjZWZvcmdlLm5ldC9Eb2MvUmVsZWFzZS9Db21wbGV0aW9uLVN5c3RlbS5odG1sXG4gICAgbGV0IGFyZ3NDb21tYW5kID0gXCJcXG5cXG4gIF9hcmd1bWVudHMgLXcgLXMgLVMgLUNcIjtcblxuICAgIGlmIChjb21tYW5kLmhhc09wdGlvbnMoKSkge1xuICAgICAgYXJnc0NvbW1hbmQgKz0gYCBcXFxcXFxuICAgICR7b3B0aW9ucy5qb2luKFwiIFxcXFxcXG4gICAgXCIpfWA7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgY29tbWFuZC5oYXNDb21tYW5kcyhmYWxzZSkgfHwgKFxuICAgICAgICBjb21tYW5kLmdldEFyZ3VtZW50cygpXG4gICAgICAgICAgLmZpbHRlcigoYXJnKSA9PiBjb21tYW5kLmdldENvbXBsZXRpb24oYXJnLmFjdGlvbikpLmxlbmd0aFxuICAgICAgKVxuICAgICkge1xuICAgICAgYXJnc0NvbW1hbmQgKz0gYCBcXFxcXFxuICAgICckeysrYXJnSW5kZXh9OiA6X2NvbW1hbmRzJ2A7XG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuaGFzQXJndW1lbnRzKCkgfHwgY29tbWFuZC5oYXNDb21tYW5kcyhmYWxzZSkpIHtcbiAgICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgICAgIGZvciAoY29uc3QgYXJnIG9mIGNvbW1hbmQuZ2V0QXJndW1lbnRzKCkuc2xpY2UoMSkpIHtcbiAgICAgICAgY29uc3QgY29tcGxldGlvbnNQYXRoOiBzdHJpbmcgPSBwYXRoLnNwbGl0KFwiIFwiKS5zbGljZSgxKS5qb2luKFwiIFwiKTtcblxuICAgICAgICBjb25zdCBhY3Rpb24gPSB0aGlzLmFkZEFjdGlvbihhcmcsIGNvbXBsZXRpb25zUGF0aCk7XG5cbiAgICAgICAgYXJncy5wdXNoKFxuICAgICAgICAgIGAkeysrYXJnSW5kZXh9JHthcmcub3B0aW9uYWxWYWx1ZSA/IFwiOjpcIiA6IFwiOlwifSR7YWN0aW9uLm5hbWV9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYXJnc0NvbW1hbmQgKz0gYXJncy5tYXAoKGFyZzogc3RyaW5nKSA9PiBgXFxcXFxcbiAgICAnJHthcmd9J2ApLmpvaW4oXCJcIik7XG5cbiAgICAgIGlmIChjb21tYW5kLmhhc0NvbW1hbmRzKGZhbHNlKSkge1xuICAgICAgICBhcmdzQ29tbWFuZCArPSBgIFxcXFxcXG4gICAgJyo6OiA6LT5jb21tYW5kX2FyZ3MnYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJnc0NvbW1hbmQ7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlT3B0aW9ucyhjb21tYW5kOiBDb21tYW5kLCBwYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvcHRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGNtZEFyZ3M6IHN0cmluZ1tdID0gcGF0aC5zcGxpdChcIiBcIik7XG4gICAgY29uc3QgX2Jhc2VOYW1lOiBzdHJpbmcgPSBjbWRBcmdzLnNoaWZ0KCkgYXMgc3RyaW5nO1xuICAgIGNvbnN0IGNvbXBsZXRpb25zUGF0aDogc3RyaW5nID0gY21kQXJncy5qb2luKFwiIFwiKTtcblxuICAgIGNvbnN0IGV4Y2x1ZGVkRmxhZ3M6IHN0cmluZ1tdID0gY29tbWFuZC5nZXRPcHRpb25zKGZhbHNlKVxuICAgICAgLm1hcCgob3B0aW9uKSA9PiBvcHRpb24uc3RhbmRhbG9uZSA/IG9wdGlvbi5mbGFncyA6IGZhbHNlKVxuICAgICAgLmZsYXQoKVxuICAgICAgLmZpbHRlcigoZmxhZykgPT4gdHlwZW9mIGZsYWcgPT09IFwic3RyaW5nXCIpIGFzIHN0cmluZ1tdO1xuXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgY29tbWFuZC5nZXRPcHRpb25zKGZhbHNlKSkge1xuICAgICAgb3B0aW9ucy5wdXNoKHRoaXMuZ2VuZXJhdGVPcHRpb24ob3B0aW9uLCBjb21wbGV0aW9uc1BhdGgsIGV4Y2x1ZGVkRmxhZ3MpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb24oXG4gICAgb3B0aW9uOiBJT3B0aW9uLFxuICAgIGNvbXBsZXRpb25zUGF0aDogc3RyaW5nLFxuICAgIGV4Y2x1ZGVkT3B0aW9uczogc3RyaW5nW10sXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3MgPSBvcHRpb24uZmxhZ3M7XG4gICAgbGV0IGV4Y2x1ZGVkRmxhZ3MgPSBvcHRpb24uY29uZmxpY3RzPy5sZW5ndGhcbiAgICAgID8gW1xuICAgICAgICAuLi5leGNsdWRlZE9wdGlvbnMsXG4gICAgICAgIC4uLm9wdGlvbi5jb25mbGljdHMubWFwKChvcHQpID0+IFwiLS1cIiArIG9wdC5yZXBsYWNlKC9eLS0vLCBcIlwiKSksXG4gICAgICBdXG4gICAgICA6IGV4Y2x1ZGVkT3B0aW9ucztcbiAgICBleGNsdWRlZEZsYWdzID0gb3B0aW9uLmNvbGxlY3QgPyBleGNsdWRlZEZsYWdzIDogW1xuICAgICAgLi4uZXhjbHVkZWRGbGFncyxcbiAgICAgIC4uLmZsYWdzLFxuICAgIF07XG5cbiAgICBsZXQgYXJncyA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBhcmcgb2Ygb3B0aW9uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuYWRkQWN0aW9uKGFyZywgY29tcGxldGlvbnNQYXRoKTtcblxuICAgICAgaWYgKGFyZy52YXJpYWRpYykge1xuICAgICAgICBhcmdzICs9IGAke2FyZy5vcHRpb25hbFZhbHVlID8gXCI6OlwiIDogXCI6XCJ9JHthcmcubmFtZX06LT4ke2FjdGlvbi5uYW1lfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmdzICs9IGAke2FyZy5vcHRpb25hbFZhbHVlID8gXCI6OlwiIDogXCI6XCJ9JHthcmcubmFtZX06LT4ke2FjdGlvbi5uYW1lfWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGRlc2NyaXB0aW9uOiBzdHJpbmcgPSBvcHRpb24uZGVzY3JpcHRpb25cbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgLnNoaWZ0KCkgYXMgc3RyaW5nO1xuXG4gICAgLy8gZXNjYXBlIGJyYWNrZXRzIGFuZCBxdW90ZXNcbiAgICBkZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uXG4gICAgICAucmVwbGFjZSgvXFxbL2csIFwiXFxcXFtcIilcbiAgICAgIC5yZXBsYWNlKC9dL2csIFwiXFxcXF1cIilcbiAgICAgIC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJylcbiAgICAgIC5yZXBsYWNlKC8nL2csIFwiJ1xcXCInXFxcIidcIik7XG5cbiAgICBjb25zdCBjb2xsZWN0OiBzdHJpbmcgPSBvcHRpb24uY29sbGVjdCA/IFwiKlwiIDogXCJcIjtcblxuICAgIGlmIChvcHRpb24uc3RhbmRhbG9uZSkge1xuICAgICAgcmV0dXJuIGAnKC0gKikneyR7Y29sbGVjdH0ke2ZsYWdzfX0nWyR7ZGVzY3JpcHRpb259XSR7YXJnc30nYDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhjbHVkZWQ6IHN0cmluZyA9IGV4Y2x1ZGVkRmxhZ3MubGVuZ3RoXG4gICAgICAgID8gYCcoJHtleGNsdWRlZEZsYWdzLmpvaW4oXCIgXCIpfSknYFxuICAgICAgICA6IFwiXCI7XG4gICAgICBpZiAoY29sbGVjdCB8fCBmbGFncy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHJldHVybiBgJHtleGNsdWRlZH17JHtjb2xsZWN0fSR7ZmxhZ3N9fSdbJHtkZXNjcmlwdGlvbn1dJHthcmdzfSdgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGAke2V4Y2x1ZGVkfSR7ZmxhZ3N9J1ske2Rlc2NyaXB0aW9ufV0ke2FyZ3N9J2A7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRBY3Rpb24oYXJnOiBJQXJndW1lbnQsIGNtZDogc3RyaW5nKTogSUNvbXBsZXRpb25BY3Rpb24ge1xuICAgIGNvbnN0IGFjdGlvbiA9IGAke2FyZy5uYW1lfS0ke2FyZy5hY3Rpb259YDtcblxuICAgIGlmICghdGhpcy5hY3Rpb25zLmhhcyhhY3Rpb24pKSB7XG4gICAgICB0aGlzLmFjdGlvbnMuc2V0KGFjdGlvbiwge1xuICAgICAgICBhcmc6IGFyZyxcbiAgICAgICAgbGFiZWw6IGAke2FyZy5uYW1lfTogJHthcmcuYWN0aW9ufWAsXG4gICAgICAgIG5hbWU6IGFjdGlvbixcbiAgICAgICAgY21kLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYWN0aW9ucy5nZXQoYWN0aW9uKSBhcyBJQ29tcGxldGlvbkFjdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVBY3Rpb25zKGNvbW1hbmQ6IENvbW1hbmQpOiBzdHJpbmcge1xuICAgIGxldCBhY3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHRoaXMuYWN0aW9ucy5zaXplKSB7XG4gICAgICBhY3Rpb25zID0gQXJyYXlcbiAgICAgICAgLmZyb20odGhpcy5hY3Rpb25zKVxuICAgICAgICAubWFwKChbbmFtZSwgYWN0aW9uXSkgPT5cbiAgICAgICAgICBgJHtuYW1lfSkgX18ke1xuICAgICAgICAgICAgcmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpXG4gICAgICAgICAgfV9jb21wbGV0ZSAke2FjdGlvbi5hcmcubmFtZX0gJHthY3Rpb24uYXJnLmFjdGlvbn0gJHthY3Rpb24uY21kfSA7O2BcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5oYXNDb21tYW5kcyhmYWxzZSkpIHtcbiAgICAgIGFjdGlvbnMudW5zaGlmdChgY29tbWFuZF9hcmdzKSBfY29tbWFuZF9hcmdzIDs7YCk7XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYFxcblxcbiAgY2FzZSBcIiRzdGF0ZVwiIGluXFxuICAgICR7YWN0aW9ucy5qb2luKFwiXFxuICAgIFwiKX1cXG4gIGVzYWNgO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VTcGVjaWFsQ2hhcnMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCBcIl9cIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsRUFBd0MsQUFBeEMsb0NBQXdDLEFBQXhDLEVBQXdDLENBQ3hDLE1BQU0sT0FBTyx1QkFBdUI7SUFRSixHQUFZO0lBUGxDLE9BQU8sR0FBbUMsR0FBRyxDQUFDLEdBQUc7SUFFekQsRUFBMEQsQUFBMUQsc0RBQTBELEFBQTFELEVBQTBELFFBQzVDLFFBQVEsQ0FBQyxHQUFZLEVBQUUsQ0FBQztRQUNwQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxRQUFRO0lBQ2xELENBQUM7Z0JBRTZCLEdBQVks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