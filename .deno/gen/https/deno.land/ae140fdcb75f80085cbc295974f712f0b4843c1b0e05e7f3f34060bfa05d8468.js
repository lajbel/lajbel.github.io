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
            console.log(FishCompletionsGenerator.generate(baseCmd));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvY29tbWFuZC9jb21wbGV0aW9ucy9maXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Zpc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgZmlzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgRmlzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8dm9pZD4ge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICB0aGlzLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgcmV0dXJuIGBHZW5lcmF0ZSBzaGVsbCBjb21wbGV0aW9ucyBmb3IgZmlzaC5cblxuVG8gZW5hYmxlIGZpc2ggY29tcGxldGlvbnMgZm9yIHRoaXMgcHJvZ3JhbSBhZGQgZm9sbG93aW5nIGxpbmUgdG8geW91ciAke1xuICAgICAgICBkaW0oaXRhbGljKFwifi8uY29uZmlnL2Zpc2gvY29uZmlnLmZpc2hcIikpXG4gICAgICB9OlxuXG4gICAgJHtkaW0oaXRhbGljKGBzb3VyY2UgKCR7YmFzZUNtZC5nZXRQYXRoKCl9IGNvbXBsZXRpb25zIGZpc2ggfCBwc3ViKWApKX1gO1xuICAgIH0pXG4gICAgICAuYWN0aW9uKCgpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKEZpc2hDb21wbGV0aW9uc0dlbmVyYXRvci5nZW5lcmF0ZShiYXNlQ21kKSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBZTtBQUN2QyxNQUFNLEdBQUcsR0FBRyxFQUFFLE1BQU0sUUFBUSxDQUFZO0FBQ3hDLE1BQU0sR0FBRyx3QkFBd0IsUUFBUSxDQUFrQztBQUUzRSxFQUF5QyxBQUF6QyxxQ0FBeUMsQUFBekMsRUFBeUMsQ0FDekMsTUFBTSxPQUFPLHNCQUFzQixTQUFTLE9BQU87SUFDakQsQ0FBQyxHQUFHO2dCQUNlLEdBQWEsQ0FBRSxDQUFDO1FBQ2pDLEtBQUs7UUFDTCxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRztRQUNmLElBQUksQ0FBQyxXQUFXLEtBQU8sQ0FBQztZQUN0QixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYztZQUNoRCxNQUFNLEVBQUUsNkdBRXlELEVBQy9ELEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBNEIsOEJBQ3hDLE9BRUgsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLHlCQUF5QjtRQUNuRSxDQUFDLEVBQ0UsTUFBTSxLQUFPLENBQUM7WUFDYixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYztZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxPQUFPO1FBQ3ZELENBQUM7SUFDTCxDQUFDIn0=