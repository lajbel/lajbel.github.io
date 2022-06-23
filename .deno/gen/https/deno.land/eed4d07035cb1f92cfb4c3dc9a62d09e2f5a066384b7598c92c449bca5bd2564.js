import { Command, DenoLand, semver } from "../../../deps.ts";
import { log } from "../../logger.ts";
import { version as currentVersion } from "../../version.ts";
import { VR_NAME } from "../../consts.ts";
import { spawn } from "../../util.ts";
export class UpgradeCommand extends Command {
    constructor(){
        super();
        this.description("Upgrade Velociraptor to the latest version or to a specific one").arguments("[version:string]").action(async (_, version)=>{
            let newVersion = version;
            if (!newVersion) {
                newVersion = await DenoLand.latestVersion(VR_NAME);
            }
            if (!newVersion) {
                log.error("Cannot retrieve the latest version tag");
                return;
            }
            if (semver.eq(newVersion, currentVersion)) {
                log.info("Velociraptor is already up-to-date");
                return;
            }
            try {
                await spawn([
                    "deno",
                    "install",
                    "--reload",
                    "-qAfn",
                    "vr",
                    `https://deno.land/x/${VR_NAME}@${newVersion}/cli.ts`, 
                ]);
                log.info(`✅ Successfully upgraded to ${newVersion}`);
            } catch (e) {
                console.log(e.message);
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9jbGkvY29tbWFuZHMvdXBncmFkZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kLCBEZW5vTGFuZCwgc2VtdmVyIH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi8uLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IHZlcnNpb24gYXMgY3VycmVudFZlcnNpb24gfSBmcm9tIFwiLi4vLi4vdmVyc2lvbi50c1wiO1xuaW1wb3J0IHsgVlJfTkFNRSB9IGZyb20gXCIuLi8uLi9jb25zdHMudHNcIjtcbmltcG9ydCB7IHNwYXduIH0gZnJvbSBcIi4uLy4uL3V0aWwudHNcIjtcblxuZXhwb3J0IGNsYXNzIFVwZ3JhZGVDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbihcbiAgICAgIFwiVXBncmFkZSBWZWxvY2lyYXB0b3IgdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG9yIHRvIGEgc3BlY2lmaWMgb25lXCIsXG4gICAgKVxuICAgICAgLmFyZ3VtZW50cyhcIlt2ZXJzaW9uOnN0cmluZ11cIilcbiAgICAgIC5hY3Rpb24oYXN5bmMgKF8sIHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgICBsZXQgbmV3VmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgIGlmICghbmV3VmVyc2lvbikge1xuICAgICAgICAgIG5ld1ZlcnNpb24gPSBhd2FpdCBEZW5vTGFuZC5sYXRlc3RWZXJzaW9uKFZSX05BTUUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmV3VmVyc2lvbikge1xuICAgICAgICAgIGxvZy5lcnJvcihcIkNhbm5vdCByZXRyaWV2ZSB0aGUgbGF0ZXN0IHZlcnNpb24gdGFnXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VtdmVyLmVxKG5ld1ZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKSkge1xuICAgICAgICAgIGxvZy5pbmZvKFwiVmVsb2NpcmFwdG9yIGlzIGFscmVhZHkgdXAtdG8tZGF0ZVwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBzcGF3bihbXG4gICAgICAgICAgICBcImRlbm9cIixcbiAgICAgICAgICAgIFwiaW5zdGFsbFwiLFxuICAgICAgICAgICAgXCItLXJlbG9hZFwiLFxuICAgICAgICAgICAgXCItcUFmblwiLFxuICAgICAgICAgICAgXCJ2clwiLFxuICAgICAgICAgICAgYGh0dHBzOi8vZGVuby5sYW5kL3gvJHtWUl9OQU1FfUAke25ld1ZlcnNpb259L2NsaS50c2AsXG4gICAgICAgICAgXSk7XG4gICAgICAgICAgbG9nLmluZm8oYOKchSBTdWNjZXNzZnVsbHkgdXBncmFkZWQgdG8gJHtuZXdWZXJzaW9ufWApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFFBQVEsQ0FBa0I7QUFDNUQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFpQjtBQUNyQyxNQUFNLEdBQUcsT0FBTyxJQUFJLGNBQWMsUUFBUSxDQUFrQjtBQUM1RCxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQWlCO0FBQ3pDLE1BQU0sR0FBRyxLQUFLLFFBQVEsQ0FBZTtBQUVyQyxNQUFNLE9BQU8sY0FBYyxTQUFTLE9BQU87aUJBQzNCLENBQUM7UUFDYixLQUFLO1FBQ0wsSUFBSSxDQUFDLFdBQVcsQ0FDZCxDQUFpRSxrRUFFaEUsU0FBUyxDQUFDLENBQWtCLG1CQUM1QixNQUFNLFFBQVEsQ0FBQyxFQUFFLE9BQTJCLEdBQUssQ0FBQztZQUNqRCxHQUFHLENBQUMsVUFBVSxHQUFHLE9BQU87WUFDeEIsRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixVQUFVLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUNuRCxDQUFDO1lBQ0QsRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixHQUFHLENBQUMsS0FBSyxDQUFDLENBQXdDO2dCQUNsRCxNQUFNO1lBQ1IsQ0FBQztZQUNELEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxjQUFjLEdBQUcsQ0FBQztnQkFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFvQztnQkFDN0MsTUFBTTtZQUNSLENBQUM7WUFDRCxHQUFHLENBQUMsQ0FBQztnQkFDSCxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ1gsQ0FBTTtvQkFDTixDQUFTO29CQUNULENBQVU7b0JBQ1YsQ0FBTztvQkFDUCxDQUFJO3FCQUNILG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU87Z0JBQ3RELENBQUM7Z0JBQ0QsR0FBRyxDQUFDLElBQUksRUFBRSw2QkFBMkIsRUFBRSxVQUFVO1lBQ25ELENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTztZQUN2QixDQUFDO1FBQ0gsQ0FBQztJQUNMLENBQUMifQ==