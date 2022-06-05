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

complete -F _${replaceSpecialChars(path)} -o bashdefault -o default ${path}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvY29tbWFuZC9jb21wbGV0aW9ucy9fYmFzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB0eXBlIHsgSUFyZ3VtZW50IH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yIHtcbiAgLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIHNjcmlwdCBmb3IgZ2l2ZW4gY29tbWFuZC4gKi9cbiAgcHVibGljIHN0YXRpYyBnZW5lcmF0ZShjbWQ6IENvbW1hbmQpIHtcbiAgICByZXR1cm4gbmV3IEJhc2hDb21wbGV0aW9uc0dlbmVyYXRvcihjbWQpLmdlbmVyYXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBjbWQ6IENvbW1hbmQpIHt9XG5cbiAgLyoqIEdlbmVyYXRlcyBiYXNoIGNvbXBsZXRpb25zIGNvZGUuICovXG4gIHByaXZhdGUgZ2VuZXJhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5jbWQuZ2V0UGF0aCgpO1xuICAgIGNvbnN0IHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXMuY21kLmdldFZlcnNpb24oKVxuICAgICAgPyBgIHYke3RoaXMuY21kLmdldFZlcnNpb24oKX1gXG4gICAgICA6IFwiXCI7XG5cbiAgICByZXR1cm4gYCMhL3Vzci9iaW4vZW52IGJhc2hcbiMgYmFzaCBjb21wbGV0aW9uIHN1cHBvcnQgZm9yICR7cGF0aH0ke3ZlcnNpb259XG5cbl8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9KCkge1xuICBsb2NhbCB3b3JkIGN1ciBwcmV2XG4gIGxvY2FsIC1hIG9wdHNcbiAgQ09NUFJFUExZPSgpXG4gIGN1cj1cIlxcJHtDT01QX1dPUkRTW0NPTVBfQ1dPUkRdfVwiXG4gIHByZXY9XCJcXCR7Q09NUF9XT1JEU1tDT01QX0NXT1JELTFdfVwiXG4gIGNtZD1cIl9cIlxuICBvcHRzPSgpXG5cbiAgXyR7cmVwbGFjZVNwZWNpYWxDaGFycyh0aGlzLmNtZC5nZXROYW1lKCkpfV9jb21wbGV0ZSgpIHtcbiAgICBsb2NhbCBhY3Rpb249XCIkMVwiOyBzaGlmdFxuICAgIG1hcGZpbGUgLXQgdmFsdWVzIDwgPCggJHt0aGlzLmNtZC5nZXROYW1lKCl9IGNvbXBsZXRpb25zIGNvbXBsZXRlIFwiXFwke2FjdGlvbn1cIiBcIlxcJHtAfVwiIClcbiAgICBmb3IgaSBpbiBcIlxcJHt2YWx1ZXNbQF19XCI7IGRvXG4gICAgICBvcHRzKz0oXCIkaVwiKVxuICAgIGRvbmVcbiAgfVxuXG4gICR7dGhpcy5nZW5lcmF0ZUNvbXBsZXRpb25zKHRoaXMuY21kKS50cmltKCl9XG5cbiAgZm9yIHdvcmQgaW4gXCJcXCR7Q09NUF9XT1JEU1tAXX1cIjsgZG9cbiAgICBjYXNlIFwiXFwke3dvcmR9XCIgaW5cbiAgICAgIC0qKSA7O1xuICAgICAgKilcbiAgICAgICAgY21kX3RtcD1cIlxcJHtjbWR9X1xcJHt3b3JkLy9bXls6YWxudW06XV0vX31cIlxuICAgICAgICBpZiB0eXBlIFwiXFwke2NtZF90bXB9XCIgJj4vZGV2L251bGw7IHRoZW5cbiAgICAgICAgICBjbWQ9XCJcXCR7Y21kX3RtcH1cIlxuICAgICAgICBmaVxuICAgIGVzYWNcbiAgZG9uZVxuXG4gIFxcJHtjbWR9XG5cbiAgaWYgW1sgXFwkeyNvcHRzW0BdfSAtZXEgMCBdXTsgdGhlblxuICAgICMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjIwN1xuICAgIENPTVBSRVBMWT0oJChjb21wZ2VuIC1mIFwiXFwke2N1cn1cIikpXG4gICAgcmV0dXJuIDBcbiAgZmlcblxuICBsb2NhbCB2YWx1ZXNcbiAgdmFsdWVzPVwiJCggcHJpbnRmIFwiXFxcXG4lc1wiIFwiXFwke29wdHNbQF19XCIgKVwiXG4gIGxvY2FsIElGUz0kJ1xcXFxuJ1xuICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgbG9jYWwgcmVzdWx0PSgkKGNvbXBnZW4gLVcgXCJcXCR7dmFsdWVzW0BdfVwiIC0tIFwiXFwke2N1cn1cIikpXG4gIGlmIFtbIFxcJHsjcmVzdWx0W0BdfSAtZXEgMCBdXTsgdGhlblxuICAgICMgc2hlbGxjaGVjayBkaXNhYmxlPVNDMjIwN1xuICAgIENPTVBSRVBMWT0oJChjb21wZ2VuIC1mIFwiXFwke2N1cn1cIikpXG4gIGVsc2VcbiAgICAjIHNoZWxsY2hlY2sgZGlzYWJsZT1TQzIyMDdcbiAgICBDT01QUkVQTFk9KCQocHJpbnRmICclcVxcXFxuJyBcIlxcJHtyZXN1bHRbQF19XCIpKVxuICBmaVxuXG4gIHJldHVybiAwXG59XG5cbmNvbXBsZXRlIC1GIF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnMocGF0aCl9IC1vIGJhc2hkZWZhdWx0IC1vIGRlZmF1bHQgJHtwYXRofWA7XG4gIH1cblxuICAvKiogR2VuZXJhdGVzIGJhc2ggY29tcGxldGlvbnMgbWV0aG9kIGZvciBnaXZlbiBjb21tYW5kIGFuZCBjaGlsZCBjb21tYW5kcy4gKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNvbXBsZXRpb25zKGNvbW1hbmQ6IENvbW1hbmQsIHBhdGggPSBcIlwiLCBpbmRleCA9IDEpOiBzdHJpbmcge1xuICAgIHBhdGggPSAocGF0aCA/IHBhdGggKyBcIiBcIiA6IFwiXCIpICsgY29tbWFuZC5nZXROYW1lKCk7XG4gICAgY29uc3QgY29tbWFuZENvbXBsZXRpb25zID0gdGhpcy5nZW5lcmF0ZUNvbW1hbmRDb21wbGV0aW9ucyhcbiAgICAgIGNvbW1hbmQsXG4gICAgICBwYXRoLFxuICAgICAgaW5kZXgsXG4gICAgKTtcbiAgICBjb25zdCBjaGlsZENvbW1hbmRDb21wbGV0aW9uczogc3RyaW5nID0gY29tbWFuZC5nZXRDb21tYW5kcyhmYWxzZSlcbiAgICAgIC5maWx0ZXIoKHN1YkNvbW1hbmQ6IENvbW1hbmQpID0+IHN1YkNvbW1hbmQgIT09IGNvbW1hbmQpXG4gICAgICAubWFwKChzdWJDb21tYW5kOiBDb21tYW5kKSA9PlxuICAgICAgICB0aGlzLmdlbmVyYXRlQ29tcGxldGlvbnMoc3ViQ29tbWFuZCwgcGF0aCwgaW5kZXggKyAxKVxuICAgICAgKVxuICAgICAgLmpvaW4oXCJcIik7XG5cbiAgICByZXR1cm4gYCR7Y29tbWFuZENvbXBsZXRpb25zfVxuXG4ke2NoaWxkQ29tbWFuZENvbXBsZXRpb25zfWA7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlQ29tbWFuZENvbXBsZXRpb25zKFxuICAgIGNvbW1hbmQ6IENvbW1hbmQsXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGluZGV4OiBudW1iZXIsXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3M6IHN0cmluZ1tdID0gdGhpcy5nZXRGbGFncyhjb21tYW5kKTtcblxuICAgIGNvbnN0IGNoaWxkQ29tbWFuZE5hbWVzOiBzdHJpbmdbXSA9IGNvbW1hbmQuZ2V0Q29tbWFuZHMoZmFsc2UpXG4gICAgICAubWFwKChjaGlsZENvbW1hbmQ6IENvbW1hbmQpID0+IGNoaWxkQ29tbWFuZC5nZXROYW1lKCkpO1xuXG4gICAgY29uc3QgY29tcGxldGlvbnNQYXRoOiBzdHJpbmcgPSB+cGF0aC5pbmRleE9mKFwiIFwiKVxuICAgICAgPyBcIiBcIiArIHBhdGguc3BsaXQoXCIgXCIpLnNsaWNlKDEpLmpvaW4oXCIgXCIpXG4gICAgICA6IFwiXCI7XG5cbiAgICBjb25zdCBvcHRpb25Bcmd1bWVudHMgPSB0aGlzLmdlbmVyYXRlT3B0aW9uQXJndW1lbnRzKFxuICAgICAgY29tbWFuZCxcbiAgICAgIGNvbXBsZXRpb25zUGF0aCxcbiAgICApO1xuXG4gICAgY29uc3QgY29tcGxldGlvbnNDbWQ6IHN0cmluZyA9IHRoaXMuZ2VuZXJhdGVDb21tYW5kQ29tcGxldGlvbnNDb21tYW5kKFxuICAgICAgY29tbWFuZC5nZXRBcmd1bWVudHMoKSxcbiAgICAgIGNvbXBsZXRpb25zUGF0aCxcbiAgICApO1xuXG4gICAgcmV0dXJuIGAgIF9fJHtyZXBsYWNlU3BlY2lhbENoYXJzKHBhdGgpfSgpIHtcbiAgICBvcHRzPSgke1suLi5mbGFncywgLi4uY2hpbGRDb21tYW5kTmFtZXNdLmpvaW4oXCIgXCIpfSlcbiAgICAke2NvbXBsZXRpb25zQ21kfVxuICAgIGlmIFtbIFxcJHtjdXJ9ID09IC0qIHx8IFxcJHtDT01QX0NXT1JEfSAtZXEgJHtpbmRleH0gXV0gOyB0aGVuXG4gICAgICByZXR1cm4gMFxuICAgIGZpXG4gICAgJHtvcHRpb25Bcmd1bWVudHN9XG4gIH1gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRGbGFncyhjb21tYW5kOiBDb21tYW5kKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBjb21tYW5kLmdldE9wdGlvbnMoZmFsc2UpXG4gICAgICAubWFwKChvcHRpb24pID0+IG9wdGlvbi5mbGFncylcbiAgICAgIC5mbGF0KCk7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlT3B0aW9uQXJndW1lbnRzKFxuICAgIGNvbW1hbmQ6IENvbW1hbmQsXG4gICAgY29tcGxldGlvbnNQYXRoOiBzdHJpbmcsXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IG9wdHMgPSBcIlwiO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBjb21tYW5kLmdldE9wdGlvbnMoZmFsc2UpO1xuICAgIGlmIChvcHRpb25zLmxlbmd0aCkge1xuICAgICAgb3B0cyArPSAnY2FzZSBcIiR7cHJldn1cIiBpbic7XG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGZsYWdzOiBzdHJpbmcgPSBvcHRpb24uZmxhZ3NcbiAgICAgICAgICAubWFwKChmbGFnOiBzdHJpbmcpID0+IGZsYWcudHJpbSgpKVxuICAgICAgICAgIC5qb2luKFwifFwiKTtcblxuICAgICAgICBjb25zdCBjb21wbGV0aW9uc0NtZDogc3RyaW5nID0gdGhpcy5nZW5lcmF0ZU9wdGlvbkNvbXBsZXRpb25zQ29tbWFuZChcbiAgICAgICAgICBvcHRpb24uYXJncyxcbiAgICAgICAgICBjb21wbGV0aW9uc1BhdGgsXG4gICAgICAgICAgeyBzdGFuZGFsb25lOiBvcHRpb24uc3RhbmRhbG9uZSB9LFxuICAgICAgICApO1xuXG4gICAgICAgIG9wdHMgKz0gYFxcbiAgICAgICR7ZmxhZ3N9KSAke2NvbXBsZXRpb25zQ21kfSA7O2A7XG4gICAgICB9XG4gICAgICBvcHRzICs9IFwiXFxuICAgIGVzYWNcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0cztcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDb21tYW5kQ29tcGxldGlvbnNDb21tYW5kKFxuICAgIGFyZ3M6IElBcmd1bWVudFtdLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAvLyBAVE9ETzogYWRkIHN1cHBvcnQgZm9yIG11bHRpcGxlIGFyZ3VtZW50c1xuICAgICAgcmV0dXJuIGBfJHtyZXBsYWNlU3BlY2lhbENoYXJzKHRoaXMuY21kLmdldE5hbWUoKSl9X2NvbXBsZXRlICR7XG4gICAgICAgIGFyZ3NbMF0uYWN0aW9uXG4gICAgICB9JHtwYXRofWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlT3B0aW9uQ29tcGxldGlvbnNDb21tYW5kKFxuICAgIGFyZ3M6IElBcmd1bWVudFtdLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBvcHRzPzogeyBzdGFuZGFsb25lPzogYm9vbGVhbiB9LFxuICApIHtcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIC8vIEBUT0RPOiBhZGQgc3VwcG9ydCBmb3IgbXVsdGlwbGUgYXJndW1lbnRzXG4gICAgICByZXR1cm4gYG9wdHM9KCk7IF8ke3JlcGxhY2VTcGVjaWFsQ2hhcnModGhpcy5jbWQuZ2V0TmFtZSgpKX1fY29tcGxldGUgJHtcbiAgICAgICAgYXJnc1swXS5hY3Rpb25cbiAgICAgIH0ke3BhdGh9YDtcbiAgICB9XG5cbiAgICBpZiAob3B0cz8uc3RhbmRhbG9uZSkge1xuICAgICAgcmV0dXJuIFwib3B0cz0oKVwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VTcGVjaWFsQ2hhcnMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCBcIl9cIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsRUFBeUMsQUFBekMscUNBQXlDLEFBQXpDLEVBQXlDLENBQ3pDLE1BQU0sT0FBTyx3QkFBd0I7SUFNTCxHQUFZO0lBTDFDLEVBQTJELEFBQTNELHVEQUEyRCxBQUEzRCxFQUEyRCxRQUM3QyxRQUFRLENBQUMsR0FBWSxFQUFFLENBQUM7UUFDcEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsUUFBUTtJQUNuRCxDQUFDO2dCQUU2QixHQUFZLENBQUUsQ0FBQzthQUFmLEdBQVksR0FBWixHQUFZO0lBQUcsQ0FBQztJQUU5QyxFQUF1QyxBQUF2QyxtQ0FBdUMsQUFBdkMsRUFBdUMsQ0FDL0IsUUFBUSxHQUFXLENBQUM7UUFDMUIsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU87UUFDN0IsS0FBSyxDQUFDLE9BQU8sR0FBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLE1BQ2xELEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsT0FDeEIsQ0FBRTtRQUVOLE1BQU0sRUFBRSxrREFDa0IsRUFBRSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBRTlDLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxFQUFFLDJKQVMxQixFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLHNFQUVsQixFQUFFLElB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