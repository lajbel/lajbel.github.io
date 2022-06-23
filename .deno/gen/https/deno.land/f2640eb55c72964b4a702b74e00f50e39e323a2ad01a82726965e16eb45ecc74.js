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
            Deno.stdout.writeSync(new TextEncoder().encode(BashCompletionsGenerator.generate(baseCmd)));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9jb21wbGV0aW9ucy9iYXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgZGltLCBpdGFsaWMgfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQmFzaENvbXBsZXRpb25zR2VuZXJhdG9yIH0gZnJvbSBcIi4vX2Jhc2hfY29tcGxldGlvbnNfZ2VuZXJhdG9yLnRzXCI7XG5cbi8qKiBHZW5lcmF0ZXMgYmFzaCBjb21wbGV0aW9ucyBzY3JpcHQuICovXG5leHBvcnQgY2xhc3MgQmFzaENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8dm9pZD4ge1xuICAjY21kPzogQ29tbWFuZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNtZD86IENvbW1hbmQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2NtZCA9IGNtZDtcbiAgICB0aGlzLmRlc2NyaXB0aW9uKCgpID0+IHtcbiAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgcmV0dXJuIGBHZW5lcmF0ZSBzaGVsbCBjb21wbGV0aW9ucyBmb3IgYmFzaC5cblxuVG8gZW5hYmxlIGJhc2ggY29tcGxldGlvbnMgZm9yIHRoaXMgcHJvZ3JhbSBhZGQgZm9sbG93aW5nIGxpbmUgdG8geW91ciAke1xuICAgICAgICBkaW0oaXRhbGljKFwifi8uYmFzaHJjXCIpKVxuICAgICAgfTpcblxuICAgICR7ZGltKGl0YWxpYyhgc291cmNlIDwoJHtiYXNlQ21kLmdldFBhdGgoKX0gY29tcGxldGlvbnMgYmFzaClgKSl9YDtcbiAgICB9KVxuICAgICAgLmFjdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFxuICAgICAgICAgIEJhc2hDb21wbGV0aW9uc0dlbmVyYXRvci5nZW5lcmF0ZShiYXNlQ21kKSxcbiAgICAgICAgKSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBZTtBQUN2QyxNQUFNLEdBQUcsR0FBRyxFQUFFLE1BQU0sUUFBUSxDQUFZO0FBQ3hDLE1BQU0sR0FBRyx3QkFBd0IsUUFBUSxDQUFrQztBQUUzRSxFQUF5QyxBQUF6QyxxQ0FBeUMsQUFBekMsRUFBeUMsQ0FDekMsTUFBTSxPQUFPLHNCQUFzQixTQUFTLE9BQU87SUFDakQsQ0FBQyxHQUFHO2dCQUNlLEdBQWEsQ0FBRSxDQUFDO1FBQ2pDLEtBQUs7UUFDTCxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRztRQUNmLElBQUksQ0FBQyxXQUFXLEtBQU8sQ0FBQztZQUN0QixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYztZQUNoRCxNQUFNLEVBQUUsNkdBRXlELEVBQy9ELEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBVyxhQUN2QixPQUVILEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLE9BQU8sR0FBRyxrQkFBa0I7UUFDN0QsQ0FBQyxFQUNFLE1BQU0sS0FBTyxDQUFDO1lBQ2IsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWM7WUFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQzVDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxPQUFPO1FBRTdDLENBQUM7SUFDTCxDQUFDIn0=