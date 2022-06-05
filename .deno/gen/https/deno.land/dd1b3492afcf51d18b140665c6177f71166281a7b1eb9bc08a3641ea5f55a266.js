import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { BashCompletionsGenerator } from "./_bash_completions_generator.ts";
/** Generates bash completions script. */ export class BashCompletionsCommand extends Command {
    #cmd;
    constructor(cmd){
        super();
        this.#cmd = cmd;
        this.description(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            return `Generate shell completions for bash.

To enable bash completions for this program add following line to your ${dim(italic("~/.bashrc"))}:

    ${dim(italic(`source <(${baseCmd.getPath()} completions bash)`))}`;
        }).action(()=>{
            const baseCmd = this.#cmd || this.getMainCommand();
            console.log(BashCompletionsGenerator.generate(baseCmd));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvY29tbWFuZC9jb21wbGV0aW9ucy9iYXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Jhc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgQmFzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8dm9pZD4ge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICB0aGlzLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgcmV0dXJuIGBHZW5lcmF0ZSBzaGVsbCBjb21wbGV0aW9ucyBmb3IgYmFzaC5cblxuVG8gZW5hYmxlIGJhc2ggY29tcGxldGlvbnMgZm9yIHRoaXMgcHJvZ3JhbSBhZGQgZm9sbG93aW5nIGxpbmUgdG8geW91ciAke1xuICAgICAgICBkaW0oaXRhbGljKFwifi8uYmFzaHJjXCIpKVxuICAgICAgfTpcblxuICAgICR7ZGltKGl0YWxpYyhgc291cmNlIDwoJHtiYXNlQ21kLmdldFBhdGgoKX0gY29tcGxldGlvbnMgYmFzaClgKSl9YDtcbiAgICB9KVxuICAgICAgLmFjdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhCYXNoQ29tcGxldGlvbnNHZW5lcmF0b3IuZ2VuZXJhdGUoYmFzZUNtZCkpO1xuICAgICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQWU7QUFDdkMsTUFBTSxHQUFHLEdBQUcsRUFBRSxNQUFNLFFBQVEsQ0FBWTtBQUN4QyxNQUFNLEdBQUcsd0JBQXdCLFFBQVEsQ0FBa0M7QUFFM0UsRUFBeUMsQUFBekMscUNBQXlDLEFBQXpDLEVBQXlDLENBQ3pDLE1BQU0sT0FBTyxzQkFBc0IsU0FBUyxPQUFPO0lBQ2pELENBQUMsR0FBRztnQkFDZSxHQUFhLENBQUUsQ0FBQztRQUNqQyxLQUFLO1FBQ0wsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUc7UUFDZixJQUFJLENBQUMsV0FBVyxLQUFPLENBQUM7WUFDdEIsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWM7WUFDaEQsTUFBTSxFQUFFLDZHQUV5RCxFQUMvRCxHQUFHLENBQUMsTUFBTSxDQUFDLENBQVcsYUFDdkIsT0FFSCxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCO1FBQzdELENBQUMsRUFDRSxNQUFNLEtBQU8sQ0FBQztZQUNiLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjO1lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLE9BQU87UUFDdkQsQ0FBQztJQUNMLENBQUMifQ==