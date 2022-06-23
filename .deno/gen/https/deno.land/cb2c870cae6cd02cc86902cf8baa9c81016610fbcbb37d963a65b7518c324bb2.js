import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { ZshCompletionsGenerator } from "./_zsh_completions_generator.ts";
/** Generates zsh completions script. */ export class ZshCompletionsCommand extends Command {
    #cmd;
    constructor(cmd){
        super();
        this.#cmd = cmd;
        this.description(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            return `Generate shell completions for zsh.

To enable zsh completions for this program add following line to your ${dim(italic("~/.zshrc"))}:

    ${dim(italic(`source <(${baseCmd.getPath()} completions zsh)`))}`;
        }).action(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            Deno.stdout.writeSync(new TextEncoder().encode(ZshCompletionsGenerator.generate(baseCmd)));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9jb21wbGV0aW9ucy96c2gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBkaW0sIGl0YWxpYyB9IGZyb20gXCIuLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBac2hDb21wbGV0aW9uc0dlbmVyYXRvciB9IGZyb20gXCIuL196c2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgenNoIGNvbXBsZXRpb25zIHNjcmlwdC4gKi9cbmV4cG9ydCBjbGFzcyBac2hDb21wbGV0aW9uc0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPHZvaWQ+IHtcbiAgI2NtZD86IENvbW1hbmQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihjbWQ/OiBDb21tYW5kKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNjbWQgPSBjbWQ7XG4gICAgdGhpcy5kZXNjcmlwdGlvbigoKSA9PiB7XG4gICAgICBjb25zdCBiYXNlQ21kID0gdGhpcy4jY21kIHx8IHRoaXMuZ2V0TWFpbkNvbW1hbmQoKTtcbiAgICAgIHJldHVybiBgR2VuZXJhdGUgc2hlbGwgY29tcGxldGlvbnMgZm9yIHpzaC5cblxuVG8gZW5hYmxlIHpzaCBjb21wbGV0aW9ucyBmb3IgdGhpcyBwcm9ncmFtIGFkZCBmb2xsb3dpbmcgbGluZSB0byB5b3VyICR7XG4gICAgICAgIGRpbShpdGFsaWMoXCJ+Ly56c2hyY1wiKSlcbiAgICAgIH06XG5cbiAgICAke2RpbShpdGFsaWMoYHNvdXJjZSA8KCR7YmFzZUNtZC5nZXRQYXRoKCl9IGNvbXBsZXRpb25zIHpzaClgKSl9YDtcbiAgICB9KVxuICAgICAgLmFjdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFxuICAgICAgICAgIFpzaENvbXBsZXRpb25zR2VuZXJhdG9yLmdlbmVyYXRlKGJhc2VDbWQpLFxuICAgICAgICApKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLE9BQU8sUUFBUSxDQUFlO0FBQ3ZDLE1BQU0sR0FBRyxHQUFHLEVBQUUsTUFBTSxRQUFRLENBQVk7QUFDeEMsTUFBTSxHQUFHLHVCQUF1QixRQUFRLENBQWlDO0FBRXpFLEVBQXdDLEFBQXhDLG9DQUF3QyxBQUF4QyxFQUF3QyxDQUN4QyxNQUFNLE9BQU8scUJBQXFCLFNBQVMsT0FBTztJQUNoRCxDQUFDLEdBQUc7Z0JBQ2UsR0FBYSxDQUFFLENBQUM7UUFDakMsS0FBSztRQUNMLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHO1FBQ2YsSUFBSSxDQUFDLFdBQVcsS0FBTyxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjO1lBQ2hELE1BQU0sRUFBRSwyR0FFd0QsRUFDOUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFVLFlBQ3RCLE9BRUgsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLGlCQUFpQjtRQUM1RCxDQUFDLEVBQ0UsTUFBTSxLQUFPLENBQUM7WUFDYixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYztZQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FDNUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLE9BQU87UUFFNUMsQ0FBQztJQUNMLENBQUMifQ==