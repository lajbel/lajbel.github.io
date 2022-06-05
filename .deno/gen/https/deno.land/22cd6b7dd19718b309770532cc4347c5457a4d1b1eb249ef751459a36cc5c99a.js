import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { FishCompletionsGenerator } from "./_fish_completions_generator.ts";
export class FishCompletionsCommand extends Command {
    #cmd;
    constructor(cmd) {
        super();
        this.#cmd = cmd;
        this.description(() => {
            const baseCmd = this.#cmd || this.getMainCommand();
            return `Generate shell completions for fish.

To enable fish completions for this program add following line to your ${dim(italic("~/.config/fish/config.fish"))}:

    ${dim(italic(`source (${baseCmd.getPath()} completions fish | psub)`))}`;
        })
            .action(() => {
            const baseCmd = this.#cmd || this.getMainCommand();
            Deno.stdout.writeSync(new TextEncoder().encode(FishCompletionsGenerator.generate(baseCmd)));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUN6QyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUc1RSxNQUFNLE9BQU8sc0JBQXVCLFNBQVEsT0FBYTtJQUN2RCxJQUFJLENBQVc7SUFDZixZQUFtQixHQUFhO1FBQzlCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkQsT0FBTzs7eUVBR0wsR0FBRyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQyxDQUMxQzs7TUFFQSxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsT0FBTyxDQUFDLE9BQU8sRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN6RSxDQUFDLENBQUM7YUFDQyxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1gsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQzVDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FDM0MsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IGRpbSwgaXRhbGljIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IEZpc2hDb21wbGV0aW9uc0dlbmVyYXRvciB9IGZyb20gXCIuL19maXNoX2NvbXBsZXRpb25zX2dlbmVyYXRvci50c1wiO1xuXG4vKiogR2VuZXJhdGVzIGZpc2ggY29tcGxldGlvbnMgc2NyaXB0LiAqL1xuZXhwb3J0IGNsYXNzIEZpc2hDb21wbGV0aW9uc0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPHZvaWQ+IHtcbiAgI2NtZD86IENvbW1hbmQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihjbWQ/OiBDb21tYW5kKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNjbWQgPSBjbWQ7XG4gICAgdGhpcy5kZXNjcmlwdGlvbigoKSA9PiB7XG4gICAgICBjb25zdCBiYXNlQ21kID0gdGhpcy4jY21kIHx8IHRoaXMuZ2V0TWFpbkNvbW1hbmQoKTtcbiAgICAgIHJldHVybiBgR2VuZXJhdGUgc2hlbGwgY29tcGxldGlvbnMgZm9yIGZpc2guXG5cblRvIGVuYWJsZSBmaXNoIGNvbXBsZXRpb25zIGZvciB0aGlzIHByb2dyYW0gYWRkIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgJHtcbiAgICAgICAgZGltKGl0YWxpYyhcIn4vLmNvbmZpZy9maXNoL2NvbmZpZy5maXNoXCIpKVxuICAgICAgfTpcblxuICAgICR7ZGltKGl0YWxpYyhgc291cmNlICgke2Jhc2VDbWQuZ2V0UGF0aCgpfSBjb21wbGV0aW9ucyBmaXNoIHwgcHN1YilgKSl9YDtcbiAgICB9KVxuICAgICAgLmFjdGlvbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VDbWQgPSB0aGlzLiNjbWQgfHwgdGhpcy5nZXRNYWluQ29tbWFuZCgpO1xuICAgICAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFxuICAgICAgICAgIEZpc2hDb21wbGV0aW9uc0dlbmVyYXRvci5nZW5lcmF0ZShiYXNlQ21kKSxcbiAgICAgICAgKSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl19