import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { FishCompletionsGenerator } from "./_fish_completions_generator.ts";
/** Generates fish completions script. */ export class FishCompletionsCommand extends Command {
    #cmd;
    constructor(cmd){
        super();
        this.#cmd = cmd;
        this.description(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            return `Generate shell completions for fish.

To enable fish completions for this program add following line to your ${dim(italic("~/.config/fish/config.fish"))}:

    ${dim(italic(`source (${baseCmd.getPath()} completions fish | psub)`))}`;
        }).action(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            Deno.stdout.writeSync(new TextEncoder().encode(FishCompletionsGenerator.generate(baseCmd)));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9jb21wbGV0aW9ucy9maXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Zpc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgZmlzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgRmlzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8dm9pZD4ge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICB0aGlzLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgcmV0dXJuIGBHZW5lcmF0ZSBzaGVsbCBjb21wbGV0aW9ucyBmb3IgZmlzaC5cblxuVG8gZW5hYmxlIGZpc2ggY29tcGxldGlvbnMgZm9yIHRoaXMgcHJvZ3JhbSBhZGQgZm9sbG93aW5nIGxpbmUgdG8geW91ciAke1xuICAgICAgICBkaW0oaXRhbGljKFwifi8uY29uZmlnL2Zpc2gvY29uZmlnLmZpc2hcIikpXG4gICAgICB9OlxuXG4gICAgJHtkaW0oaXRhbGljKGBzb3VyY2UgKCR7YmFzZUNtZC5nZXRQYXRoKCl9IGNvbXBsZXRpb25zIGZpc2ggfCBwc3ViKWApKX1gO1xuICAgIH0pXG4gICAgICAuYWN0aW9uKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICAgIERlbm8uc3Rkb3V0LndyaXRlU3luYyhuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXG4gICAgICAgICAgRmlzaENvbXBsZXRpb25zR2VuZXJhdG9yLmdlbmVyYXRlKGJhc2VDbWQpLFxuICAgICAgICApKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLE9BQU8sUUFBUSxDQUFlO0FBQ3ZDLE1BQU0sR0FBRyxHQUFHLEVBQUUsTUFBTSxRQUFRLENBQVk7QUFDeEMsTUFBTSxHQUFHLHdCQUF3QixRQUFRLENBQWtDO0FBRTNFLEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxDQUN6QyxNQUFNLE9BQU8sc0JBQXNCLFNBQVMsT0FBTztJQUNqRCxDQUFDLEdBQUc7Z0JBQ2UsR0FBYSxDQUFFLENBQUM7UUFDakMsS0FBSztRQUNMLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHO1FBQ2YsSUFBSSxDQUFDLFdBQVcsS0FBTyxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjO1lBQ2hELE1BQU0sRUFBRSw2R0FFeUQsRUFDL0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUE0Qiw4QkFDeEMsT0FFSCxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEdBQUcseUJBQXlCO1FBQ25FLENBQUMsRUFDRSxNQUFNLEtBQU8sQ0FBQztZQUNiLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjO1lBQ2hELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUM1Qyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsT0FBTztRQUU3QyxDQUFDO0lBQ0wsQ0FBQyJ9