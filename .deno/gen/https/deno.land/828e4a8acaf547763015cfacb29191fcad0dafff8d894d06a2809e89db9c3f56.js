import { Command } from "../command.ts";
import { UnknownCommand } from "../_errors.ts";
import { CommandType } from "../types/command.ts";
/** Generates well formatted and colored help output for specified command. */ export class HelpCommand extends Command {
    constructor(cmd){
        super();
        this.type("command", new CommandType()).arguments("[command:command]").description("Show this help or the help of a sub-command.").action((_, name)=>{
            if (!cmd) {
                cmd = name ? this.getGlobalParent()?.getBaseCommand(name) : this.getGlobalParent();
            }
            if (!cmd) {
                const cmds = this.getGlobalParent()?.getCommands();
                throw new UnknownCommand(name ?? "", cmds ?? [], [
                    this.getName(),
                    ...this.getAliases(), 
                ]);
            }
            cmd.showHelp();
            Deno.exit(0);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC9oZWxwL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IFVua25vd25Db21tYW5kIH0gZnJvbSBcIi4uL19lcnJvcnMudHNcIjtcbmltcG9ydCB7IENvbW1hbmRUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2NvbW1hbmQudHNcIjtcblxuLyoqIEdlbmVyYXRlcyB3ZWxsIGZvcm1hdHRlZCBhbmQgY29sb3JlZCBoZWxwIG91dHB1dCBmb3Igc3BlY2lmaWVkIGNvbW1hbmQuICovXG5leHBvcnQgY2xhc3MgSGVscENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kPHZvaWQsIFtjb21tYW5kPzogc3RyaW5nXT4ge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY21kPzogQ29tbWFuZCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy50eXBlKFwiY29tbWFuZFwiLCBuZXcgQ29tbWFuZFR5cGUoKSlcbiAgICAgIC5hcmd1bWVudHMoXCJbY29tbWFuZDpjb21tYW5kXVwiKVxuICAgICAgLmRlc2NyaXB0aW9uKFwiU2hvdyB0aGlzIGhlbHAgb3IgdGhlIGhlbHAgb2YgYSBzdWItY29tbWFuZC5cIilcbiAgICAgIC5hY3Rpb24oKF8sIG5hbWU/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKCFjbWQpIHtcbiAgICAgICAgICBjbWQgPSBuYW1lXG4gICAgICAgICAgICA/IHRoaXMuZ2V0R2xvYmFsUGFyZW50KCk/LmdldEJhc2VDb21tYW5kKG5hbWUpXG4gICAgICAgICAgICA6IHRoaXMuZ2V0R2xvYmFsUGFyZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjbWQpIHtcbiAgICAgICAgICBjb25zdCBjbWRzID0gdGhpcy5nZXRHbG9iYWxQYXJlbnQoKT8uZ2V0Q29tbWFuZHMoKTtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93bkNvbW1hbmQobmFtZSA/PyBcIlwiLCBjbWRzID8/IFtdLCBbXG4gICAgICAgICAgICB0aGlzLmdldE5hbWUoKSxcbiAgICAgICAgICAgIC4uLnRoaXMuZ2V0QWxpYXNlcygpLFxuICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgICAgIGNtZC5zaG93SGVscCgpO1xuICAgICAgICBEZW5vLmV4aXQoMCk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBZTtBQUN2QyxNQUFNLEdBQUcsY0FBYyxRQUFRLENBQWU7QUFDOUMsTUFBTSxHQUFHLFdBQVcsUUFBUSxDQUFxQjtBQUVqRCxFQUE4RSxBQUE5RSwwRUFBOEUsQUFBOUUsRUFBOEUsQ0FDOUUsTUFBTSxPQUFPLFdBQVcsU0FBUyxPQUFPO2dCQUNuQixHQUFhLENBQUUsQ0FBQztRQUNqQyxLQUFLO1FBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFTLFVBQUUsR0FBRyxDQUFDLFdBQVcsSUFDakMsU0FBUyxDQUFDLENBQW1CLG9CQUM3QixXQUFXLENBQUMsQ0FBOEMsK0NBQzFELE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBYSxHQUFLLENBQUM7WUFDN0IsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNULEdBQUcsR0FBRyxJQUFJLEdBQ04sSUFBSSxDQUFDLGVBQWUsSUFBSSxjQUFjLENBQUMsSUFBSSxJQUMzQyxJQUFJLENBQUMsZUFBZTtZQUMxQixDQUFDO1lBQ0QsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNULEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsSUFBSSxXQUFXO2dCQUNoRCxLQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLElBQUksQ0FBRSxHQUFFLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNoRCxJQUFJLENBQUMsT0FBTzt1QkFDVCxJQUFJLENBQUMsVUFBVTtnQkFDcEIsQ0FBQztZQUNILENBQUM7WUFDRCxHQUFHLENBQUMsUUFBUTtZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNiLENBQUM7SUFDTCxDQUFDIn0=