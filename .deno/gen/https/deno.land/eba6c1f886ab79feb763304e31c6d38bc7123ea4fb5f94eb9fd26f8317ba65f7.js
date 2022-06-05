import { Command } from "../command.ts";
import { dim, italic } from "../deps.ts";
import { BashCompletionsCommand } from "./bash.ts";
import { CompleteCommand } from "./complete.ts";
import { FishCompletionsCommand } from "./fish.ts";
import { ZshCompletionsCommand } from "./zsh.ts";
export class CompletionsCommand extends Command {
    #cmd;
    constructor(cmd) {
        super();
        this.#cmd = cmd;
        this.description(() => {
            const baseCmd = this.#cmd || this.getMainCommand();
            return `Generate shell completions.

To enable shell completions for this program add the following line to your ${dim(italic("~/.bashrc"))} or similar:

    ${dim(italic(`source <(${baseCmd.getPath()} completions [shell])`))}

    For more information run ${dim(italic(`${baseCmd.getPath()} completions [shell] --help`))}
`;
        })
            .action(() => this.showHelp())
            .command("bash", new BashCompletionsCommand(this.#cmd))
            .command("fish", new FishCompletionsCommand(this.#cmd))
            .command("zsh", new ZshCompletionsCommand(this.#cmd))
            .command("complete", new CompleteCommand(this.#cmd).hidden())
            .reset();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDekMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25ELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25ELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUdqRCxNQUFNLE9BQU8sa0JBQW1CLFNBQVEsT0FBYTtJQUNuRCxJQUFJLENBQVc7SUFFZixZQUFtQixHQUFhO1FBQzlCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkQsT0FBTzs7OEVBR0wsR0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FDekI7O01BRUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLE9BQU8sQ0FBQyxPQUFPLEVBQUUsdUJBQXVCLENBQUMsQ0FBQzs7K0JBRy9ELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQy9EO0NBQ0wsQ0FBQztRQUNFLENBQUMsQ0FBQzthQUNDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDN0IsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0RCxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3RELE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEQsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDNUQsS0FBSyxFQUFFLENBQUM7SUFDYixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IGRpbSwgaXRhbGljIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB7IEJhc2hDb21wbGV0aW9uc0NvbW1hbmQgfSBmcm9tIFwiLi9iYXNoLnRzXCI7XG5pbXBvcnQgeyBDb21wbGV0ZUNvbW1hbmQgfSBmcm9tIFwiLi9jb21wbGV0ZS50c1wiO1xuaW1wb3J0IHsgRmlzaENvbXBsZXRpb25zQ29tbWFuZCB9IGZyb20gXCIuL2Zpc2gudHNcIjtcbmltcG9ydCB7IFpzaENvbXBsZXRpb25zQ29tbWFuZCB9IGZyb20gXCIuL3pzaC50c1wiO1xuXG4vKiogR2VuZXJhdGVzIHNoZWxsIGNvbXBsZXRpb24gc2NyaXB0cyBmb3IgdmFyaW91cyBzaGVsbCdzLiAqL1xuZXhwb3J0IGNsYXNzIENvbXBsZXRpb25zQ29tbWFuZCBleHRlbmRzIENvbW1hbmQ8dm9pZD4ge1xuICAjY21kPzogQ29tbWFuZDtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoY21kPzogQ29tbWFuZCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4jY21kID0gY21kO1xuICAgIHRoaXMuZGVzY3JpcHRpb24oKCkgPT4ge1xuICAgICAgY29uc3QgYmFzZUNtZCA9IHRoaXMuI2NtZCB8fCB0aGlzLmdldE1haW5Db21tYW5kKCk7XG4gICAgICByZXR1cm4gYEdlbmVyYXRlIHNoZWxsIGNvbXBsZXRpb25zLlxuXG5UbyBlbmFibGUgc2hlbGwgY29tcGxldGlvbnMgZm9yIHRoaXMgcHJvZ3JhbSBhZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgJHtcbiAgICAgICAgZGltKGl0YWxpYyhcIn4vLmJhc2hyY1wiKSlcbiAgICAgIH0gb3Igc2ltaWxhcjpcblxuICAgICR7ZGltKGl0YWxpYyhgc291cmNlIDwoJHtiYXNlQ21kLmdldFBhdGgoKX0gY29tcGxldGlvbnMgW3NoZWxsXSlgKSl9XG5cbiAgICBGb3IgbW9yZSBpbmZvcm1hdGlvbiBydW4gJHtcbiAgICAgICAgZGltKGl0YWxpYyhgJHtiYXNlQ21kLmdldFBhdGgoKX0gY29tcGxldGlvbnMgW3NoZWxsXSAtLWhlbHBgKSlcbiAgICAgIH1cbmA7XG4gICAgfSlcbiAgICAgIC5hY3Rpb24oKCkgPT4gdGhpcy5zaG93SGVscCgpKVxuICAgICAgLmNvbW1hbmQoXCJiYXNoXCIsIG5ldyBCYXNoQ29tcGxldGlvbnNDb21tYW5kKHRoaXMuI2NtZCkpXG4gICAgICAuY29tbWFuZChcImZpc2hcIiwgbmV3IEZpc2hDb21wbGV0aW9uc0NvbW1hbmQodGhpcy4jY21kKSlcbiAgICAgIC5jb21tYW5kKFwienNoXCIsIG5ldyBac2hDb21wbGV0aW9uc0NvbW1hbmQodGhpcy4jY21kKSlcbiAgICAgIC5jb21tYW5kKFwiY29tcGxldGVcIiwgbmV3IENvbXBsZXRlQ29tbWFuZCh0aGlzLiNjbWQpLmhpZGRlbigpKVxuICAgICAgLnJlc2V0KCk7XG4gIH1cbn1cbiJdfQ==