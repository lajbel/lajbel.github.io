/** Generates bash completions script. */ export class BashCompletionsGenerator {
    cmd;
    /** Generates bash completions script for given command. */ static generate(cmd) {
        return new BashCompletionsGenerator(cmd).generate();
    }
    constructor(cmd){
        this.cmd = cmd;
    }
    /** Generates bash completions code. */ generate() {
        const path = this.cmd.getPath();
        const version = this.cmd.getVersion() ? ` v${this.cmd.getVersion()}` : "";
        return `#!/usr/bin/env bash
# bash completion support for ${path}${version}

_${replaceSpecialChars(path)}() {
  local word cur prev
  local -a opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  cmd="_"
  opts=()

  _${replaceSpecialChars(this.cmd.getName())}_complete() {
    local action="$1"; shift
    mapfile -t values < <( ${this.cmd.getName()} completions complete "\${action}" "\${@}" )
    for i in "\${values[@]}"; do
      opts+=("$i")
    done
  }

  ${this.generateCompletions(this.cmd).trim()}

  for word in "\${COMP_WORDS[@]}"; do
    case "\${word}" in
      -*) ;;
      *)
        cmd_tmp="\${cmd}_\${word//[^[:alnum:]]/_}"
        if type "\${cmd_tmp}" &>/dev/null; then
          cmd="\${cmd_tmp}"
        fi
    esac
  done

  \${cmd}

  if [[ \${#opts[@]} -eq 0 ]]; then
    # shellcheck disable=SC2207
    COMPREPLY=($(compgen -f "\${cur}"))
    return 0
  fi

  local values
  values="$( printf "\\n%s" "\${opts[@]}" )"
  local IFS=$'\\n'
  # shellcheck disable=SC2207
  local result=($(compgen -W "\${values[@]}" -- "\${cur}"))
  if [[ \${#result[@]} -eq 0 ]]; then
    # shellcheck disable=SC2207
    COMPREPLY=($(compgen -f "\${cur}"))
  else
    # shellcheck disable=SC2207
    COMPREPLY=($(printf '%q\\n' "\${result[@]}"))
  fi

  return 0
}

complete -F _${replaceSpecialChars(path)} -o bashdefault -o default ${path}
`;
    }
    /** Generates bash completions method for given command and child commands. */ generateCompletions(command, path = "", index = 1) {
        path = (path ? path + " " : "") + command.getName();
        const commandCompletions = this.generateCommandCompletions(command, path, index);
        const childCommandCompletions = command.getCommands(false).filter((subCommand)=>subCommand !== command
        ).map((subCommand)=>this.generateCompletions(subCommand, path, index + 1)
        ).join("");
        return `${commandCompletions}

${childCommandCompletions}`;
    }
    generateCommandCompletions(command, path, index) {
        const flags = this.getFlags(command);
        const childCommandNames = command.getCommands(false).map((childCommand)=>childCommand.getName()
        );
        const completionsPath = ~path.indexOf(" ") ? " " + path.split(" ").slice(1).join(" ") : "";
        const optionArguments = this.generateOptionArguments(command, completionsPath);
        const completionsCmd = this.generateCommandCompletionsCommand(command.getArguments(), completionsPath);
        return `  __${replaceSpecialChars(path)}() {
    opts=(${[
            ...flags,
            ...childCommandNames
        ].join(" ")})
    ${completionsCmd}
    if [[ \${cur} == -* || \${COMP_CWORD} -eq ${index} ]] ; then
      return 0
    fi
    ${optionArguments}
  }`;
    }
    getFlags(command) {
        return command.getOptions(false).map((option)=>option.flags
        ).flat();
    }
    generateOptionArguments(command, completionsPath) {
        let opts = "";
        const options = command.getOptions(false);
        if (options.length) {
            opts += 'case "${prev}" in';
            for (const option of options){
                const flags = option.flags.map((flag)=>flag.trim()
                ).join("|");
                const completionsCmd = this.generateOptionCompletionsCommand(option.args, completionsPath, {
                    standalone: option.standalone
                });
                opts += `\n      ${flags}) ${completionsCmd} ;;`;
            }
            opts += "\n    esac";
        }
        return opts;
    }
    generateCommandCompletionsCommand(args, path) {
        if (args.length) {
            // @TODO: add support for multiple arguments
            return `_${replaceSpecialChars(this.cmd.getName())}_complete ${args[0].action}${path}`;
        }
        return "";
    }
    generateOptionCompletionsCommand(args, path, opts) {
        if (args.length) {
            // @TODO: add support for multiple arguments
            return `opts=(); _${replaceSpecialChars(this.cmd.getName())}_complete ${args[0].action}${path}`;
        }
        if (opts?.standalone) {
            return "opts=()";
        }
        return "";
    }
}
function replaceSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9jb21wbGV0aW9ucy9fYmFzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB0eXBlIHsgSUFyZ3VtZW50IH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yIHtcbiAgLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIHNjcmlwdCBmb3IgZ2l2ZW4gY29tbWFuZC4gKi9cbiAgcHVibGljIHN0YXRpYyBnZW5lcmF0ZShjbWQ6IENvbW1hbmQpIHtcbiAgICByZXR1cm4gbmV3IEJhc2hDb21wbGV0aW9uc0dlbmVyYXRvcihjbWQpLmdlbmVyYXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBjbWQ6IENvbW1hbmQpIHt9XG5cbiAgLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIGNvZGUuICovXG4gIHByaXZhdGUgZ2VuZXJhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5jbWQuZ2V0UGF0aCgpO1xuICAgIGNvbnN0IHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXMuY21kLmdldFZlcnNpb24oKVxuICAgICAgPyBgIHYke3RoaXMuY21kLmdldFZlcnNpb24oKX1gXG4gICAgICA6IFwiXCI7XG5cbiAgICByZXR1cm4gYCMhL3Vzci9iaW4vZW52IGJhc2hcbiMgYmFzaCBjb21wbGV0aW9uIHN1cHBvcnQgZm9yICR7cGF0aH0ke3ZlcnNpb259XG5cbl8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9KCkge1xuICBsb2NhbCB3b3JkIGN1ciBwcmV2XG4gIGxvY2FsIC1hIG9wdHNcbiAgQ09NUFJFUExZPSgpXG4gIGN1cj1cIlxcJHtDT01QX1dPUkRTW0NPTVBfQ1dPUkRdfVwiXG4gIHByZXY9XCJcXCR7Q09NUF9XT1JEU1tDT01QX0NXT1JELTFdfVwiXG4gIGNtZD1cIl9cIlxuICBvcHRzPSgpXG5cbiAgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9jb21wbGV0ZSgpIHtcbiAgICBsb2NhbCBhY3Rpb249XCIkMVwiOyBzaGlmdFxuICAgIG1hcGZpbGUgLXQgdmFsdWVzIDwgPCggJHt0aGlzLmNtZC5nZXROYW1lKCl9IGNvbXBsZXRpb25zIGNvbXBsZXRlIFwiXFwke2FjdGlvbn1cIiBcIlxcJHtAfVwiIClcbiAgICBmb3IgaSBpbiBcIlxcJHt2YWx1ZXNbQF19XCI7IGRvXG4gICAgICBvcHRzKz0oXCIkaVwiKVxuICAgIGRvbmVcbiAgfVxuXG4gICR7dGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHRoaXMuY21kKS50cmltKCl9XG5cbiAgZm9yIHdvcmQgaW4gXCJcXCR7Q09NUF9XT1JEU1tAXX1cIjsgZG9cbiAgICBjYXNlIFwiXFwke3dvcmR9XCIgaW5cbiAgICAgIC0qKSA7O1xuICAgICAgKilcbiAgICAgICAgY21kX3RtcD1cIlxcJHtjbWR9X1xcJHt3b3JkLy9bXls6YWxudW06XV0vX31cIlxuICAgICAgICBpZiB0eXBlIFwiXFwke2NtZF90bXB9XCIgJj4vZGV2L251bGw7IHRoZW5cbiAgICAgICAgICBjbWQ9XCJcXCR7Y21kX3RtcH1cIlxuICAgICAgICBmaVxuICAgIGVzYWNcbiAgZG9uZVxuXG4gIFxcJHtjbWR9XG5cbiAgaWYgW1sgXFwkeyNvcHRzW0BdfSAtZXEgMCBdXTsgdGhlblxuICAgICMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjIwN1xuICAgIENPTVBSRVBMWT0oJChjb21wZ2VuIC1mIFwiXFwke2N1cn1cIikpXG4gICAgcmV0dXJuIDBcbiAgZmlcblxuICBsb2NhbCB2YWx1ZXNcbiAgdmFsdWVzPVwiJCggcHJpbnRmIFwiXFxcXG4lc1wiIFwiXFwke29wdHNbQF19XCIgKVwiXG4gIGxvY2FsIElGUz0kJ1xcXFxuJ1xuICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgbG9jYWwgcmVzdWx0PSgkKGNvbXBnZW4gLVcgXCJcXCR7dmFsdWVzW0BdfVwiIC0tIFwiXFwke2N1cn1cIikpXG4gIGlmIFtbIFxcJHsjcmVzdWx0W0BdfSAtZXEgMCBdXTsgdGhlblxuICAgICMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjIwN1xuICAgIENPTVBSRVBMWT0oJChjb21wZ2VuIC1mIFwiXFwke2N1cn1cIikpXG4gIGVsc2VcbiAgICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgICBDT01QUkVQTFk9KCQocHJpbnRmICclcVxcXFxuJyBcIlxcJHtyZXN1bHRbQF19XCIpKVxuICBmaVxuXG4gIHJldHVybiAwXG59XG5cbmNvbXBsZXRlIC1GIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9IC1vIGJhc2hkZWZhdWx0IC1vIGRlZmF1bHQgJHtwYXRofVxuYDtcbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBtZXRob2QgZm9yIGdpdmVuIGNvbW1hbmQgYW5kIGNoaWxkIGNvbW1hbmRzLiAqL1xuICBwcml2YXRlIGdlbmVyYXRlQ29tcGxldGlvbnMoY29tbWFuZDogQ29tbWFuZCwgcGF0aCA9IFwiXCIsIGluZGV4ID0gMSk6IHN0cmluZyB7XG4gICAgcGF0aCA9IChwYXRoID8gcGF0aCArIFwiIFwiIDogXCJcIikgKyBjb21tYW5kLmdldE5hbWUoKTtcbiAgICBjb25zdCBjb21tYW5kQ29tcGxldGlvbnMgPSB0aGlzLmdlbmVyYXRlQ29tbWFuZENvbXBsZXRpb25zKFxuICAgICAgY29tbWFuZCxcbiAgICAgIHBhdGgsXG4gICAgICBpbmRleCxcbiAgICApO1xuICAgIGNvbnN0IGNoaWxkQ29tbWFuZENvbXBsZXRpb25zOiBzdHJpbmcgPSBjb21tYW5kLmdldENvbW1hbmRzKGZhbHNlKVxuICAgICAgLmZpbHRlcigoc3ViQ29tbWFuZDogQ29tbWFuZCkgPT4gc3ViQ29tbWFuZCAhPT0gY29tbWFuZClcbiAgICAgIC5tYXAoKHN1YkNvbW1hbmQ6IENvbW1hbmQpID0+XG4gICAgICAgIHRoaXMuZ2VuZXJhdGVDb21wbGV0aW9ucyhzdWJDb21tYW5kLCBwYXRoLCBpbmRleCArIDEpXG4gICAgICApXG4gICAgICAuam9pbihcIlwiKTtcblxuICAgIHJldHVybiBgJHtjb21tYW5kQ29tcGxldGlvbnN9XG5cbiR7Y2hpbGRDb21tYW5kQ29tcGxldGlvbnN9YDtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21tYW5kQ29tcGxldGlvbnMoXG4gICAgY29tbWFuZDogQ29tbWFuZCxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbGFnczogc3RyaW5nW10gPSB0aGlzLmdldEZsYWdzKGNvbW1hbmQpO1xuXG4gICAgY29uc3QgY2hpbGRDb21tYW5kTmFtZXM6IHN0cmluZ1tdID0gY29tbWFuZC5nZXRDb21tYW5kcyhmYWxzZSlcbiAgICAgIC5tYXAoKGNoaWxkQ29tbWFuZDogQ29tbWFuZCkgPT4gY2hpbGRDb21tYW5kLmdldE5hbWUoKSk7XG5cbiAgICBjb25zdCBjb21wbGV0aW9uc1BhdGg6IHN0cmluZyA9IH5wYXRoLmluZGV4T2YoXCIgXCIpXG4gICAgICA/IFwiIFwiICsgcGF0aC5zcGxpdChcIiBcIikuc2xpY2UoMSkuam9pbihcIiBcIilcbiAgICAgIDogXCJcIjtcblxuICAgIGNvbnN0IG9wdGlvbkFyZ3VtZW50cyA9IHRoaXMuZ2VuZXJhdGVPcHRpb25Bcmd1bWVudHMoXG4gICAgICBjb21tYW5kLFxuICAgICAgY29tcGxldGlvbnNQYXRoLFxuICAgICk7XG5cbiAgICBjb25zdCBjb21wbGV0aW9uc0NtZDogc3RyaW5nID0gdGhpcy5nZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9uc0NvbW1hbmQoXG4gICAgICBjb21tYW5kLmdldEFyZ3VtZW50cygpLFxuICAgICAgY29tcGxldGlvbnNQYXRoLFxuICAgICk7XG5cbiAgICByZXR1cm4gYCAgX18ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9KCkge1xuICAgIG9wdHM9KCR7Wy4uLmZsYWdzLCAuLi5jaGlsZENvbW1hbmROYW1lc10uam9pbihcIiBcIil9KVxuICAgICR7Y29tcGxldGlvbnNDbWR9XG4gICAgaWYgW1sgXFwke2N1cn0gPT0gLSogfHwgXFwke0NPTVBfQ1dPUkR9IC1lcSAke2luZGV4fSBdXSA7IHRoZW5cbiAgICAgIHJldHVybiAwXG4gICAgZmlcbiAgICAke29wdGlvbkFyZ3VtZW50c31cbiAgfWA7XG4gIH1cblxuICBwcml2YXRlIGdldEZsYWdzKGNvbW1hbmQ6IENvbW1hbmQpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIGNvbW1hbmQuZ2V0T3B0aW9ucyhmYWxzZSlcbiAgICAgIC5tYXAoKG9wdGlvbikgPT4gb3B0aW9uLmZsYWdzKVxuICAgICAgLmZsYXQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb25Bcmd1bWVudHMoXG4gICAgY29tbWFuZDogQ29tbWFuZCxcbiAgICBjb21wbGV0aW9uc1BhdGg6IHN0cmluZyxcbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgb3B0cyA9IFwiXCI7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGNvbW1hbmQuZ2V0T3B0aW9ucyhmYWxzZSk7XG4gICAgaWYgKG9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICBvcHRzICs9ICdjYXNlIFwiJHtwcmV2fVwiIGluJztcbiAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgZmxhZ3M6IHN0cmluZyA9IG9wdGlvbi5mbGFnc1xuICAgICAgICAgIC5tYXAoKGZsYWc6IHN0cmluZykgPT4gZmxhZy50cmltKCkpXG4gICAgICAgICAgLmpvaW4oXCJ8XCIpO1xuXG4gICAgICAgIGNvbnN0IGNvbXBsZXRpb25zQ21kOiBzdHJpbmcgPSB0aGlzLmdlbmVyYXRlT3B0aW9uQ29tcGxldGlvbnNDb21tYW5kKFxuICAgICAgICAgIG9wdGlvbi5hcmdzLFxuICAgICAgICAgIGNvbXBsZXRpb25zUGF0aCxcbiAgICAgICAgICB7IHN0YW5kYWxvbmU6IG9wdGlvbi5zdGFuZGFsb25lIH0sXG4gICAgICAgICk7XG5cbiAgICAgICAgb3B0cyArPSBgXFxuICAgICAgJHtmbGFnc30pICR7Y29tcGxldGlvbnNDbWR9IDs7YDtcbiAgICAgIH1cbiAgICAgIG9wdHMgKz0gXCJcXG4gICAgZXNhY1wiO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9uc0NvbW1hbmQoXG4gICAgYXJnczogSUFyZ3VtZW50W10sXG4gICAgcGF0aDogc3RyaW5nLFxuICApIHtcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIC8vIEBUT0RPOiBhZGQgc3VwcG9ydCBmb3IgbXVsdGlwbGUgYXJndW1lbnRzXG4gICAgICByZXR1cm4gYF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fY29tcGxldGUgJHtcbiAgICAgICAgYXJnc1swXS5hY3Rpb25cbiAgICAgIH0ke3BhdGh9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVPcHRpb25Db21wbGV0aW9uc0NvbW1hbmQoXG4gICAgYXJnczogSUFyZ3VtZW50W10sXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG9wdHM/OiB7IHN0YW5kYWxvbmU/OiBib29sZWFuIH0sXG4gICkge1xuICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgLy8gQFRPRE86IGFkZCBzdXBwb3J0IGZvciBtdWx0aXBsZSBhcmd1bWVudHNcbiAgICAgIHJldHVybiBgb3B0cz0oKTsgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9jb21wbGV0ZSAke1xuICAgICAgICBhcmdzWzBdLmFjdGlvblxuICAgICAgfSR7cGF0aH1gO1xuICAgIH1cblxuICAgIGlmIChvcHRzPy5zdGFuZGFsb25lKSB7XG4gICAgICByZXR1cm4gXCJvcHRzPSgpXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZVNwZWNpYWxDaGFycyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvW15hLXpBLVowLTldL2csIFwiX1wiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxFQUF5QyxBQUF6QyxxQ0FBeUMsQUFBekMsRUFBeUMsQ0FDekMsTUFBTSxPQUFPLHdCQUF3QjtJQU1MLEdBQVk7SUFMMUMsRUFBMkQsQUFBM0QsdURBQTJELEFBQTNELEVBQTJELFFBQzdDLFFBQVEsQ0FBQyxHQUFZLEVBQUUsQ0FBQztRQUNwQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxRQUFRO0lBQ25ELENBQUM7Z0JBRTZCLEdBQVksQ0FBRSxDQUFDO2FBQWYsR0FBWSxHQUFaLEdBQVk7SUFBRyxDQUFDO0lBRTlDLEVBQXVDLEFBQXZDLG1DQUF1QyxBQUF2QyxFQUF1QyxDQUMvQixRQUFRLEdBQVcsQ0FBQztRQUMxQixLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTztRQUM3QixLQUFLLENBQUMsT0FBTyxHQUF1QixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsTUFDbEQsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxPQUN4QixDQUFFO1FBRU4sTUFBTSxFQUFFLGtEQUNrQixFQUFFLElBQUksR0FBRyxPQUFPLENBQUMsR0FFOUMsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsMkpBUzFCLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksc0VBRWxCLEVBQUUs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