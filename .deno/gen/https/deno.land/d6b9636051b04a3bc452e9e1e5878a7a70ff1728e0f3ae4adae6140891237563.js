import { Command } from "../../../deps.ts";
import { ArgsForwardingMode, runScript } from "../../run_script.ts";
import { checkGitHooks } from "../../git_hooks.ts";
import { validateConfigData } from "../../validate_config_data.ts";
import { withUpdateChecks } from "../../update_notifier.ts";
export class RunCommand extends Command {
    configData;
    constructor(configData){
        super();
        this.configData = configData;
        this.description("Run a script").arguments("<script:scriptid> [additionalArgs...]").useRawArgs().action((_, script, ...additionalArgs)=>{
            return withUpdateChecks(async ()=>{
                if (script === "--help" || script === "-h") {
                    console.log(this.getHelp());
                    return;
                }
                validateConfigData(this.configData);
                await checkGitHooks(this.configData);
                await runScript({
                    configData: this.configData,
                    script,
                    additionalArgs,
                    argsForwardingMode: ArgsForwardingMode.DIRECT
                });
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9jbGkvY29tbWFuZHMvcnVuLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi9sb2FkX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgQXJnc0ZvcndhcmRpbmdNb2RlLCBydW5TY3JpcHQgfSBmcm9tIFwiLi4vLi4vcnVuX3NjcmlwdC50c1wiO1xuaW1wb3J0IHsgY2hlY2tHaXRIb29rcyB9IGZyb20gXCIuLi8uLi9naXRfaG9va3MudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi92YWxpZGF0ZV9jb25maWdfZGF0YS50c1wiO1xuaW1wb3J0IHsgd2l0aFVwZGF0ZUNoZWNrcyB9IGZyb20gXCIuLi8uLi91cGRhdGVfbm90aWZpZXIudHNcIjtcblxuZXhwb3J0IGNsYXNzIFJ1bkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb25maWdEYXRhOiBDb25maWdEYXRhIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbihcIlJ1biBhIHNjcmlwdFwiKVxuICAgICAgLmFyZ3VtZW50cyhcIjxzY3JpcHQ6c2NyaXB0aWQ+IFthZGRpdGlvbmFsQXJncy4uLl1cIilcbiAgICAgIC51c2VSYXdBcmdzKClcbiAgICAgIC5hY3Rpb24oKF8sIHNjcmlwdDogc3RyaW5nLCAuLi5hZGRpdGlvbmFsQXJnczogc3RyaW5nW10pID0+IHtcbiAgICAgICAgcmV0dXJuIHdpdGhVcGRhdGVDaGVja3MoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGlmIChzY3JpcHQgPT09IFwiLS1oZWxwXCIgfHwgc2NyaXB0ID09PSBcIi1oXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0SGVscCgpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFsaWRhdGVDb25maWdEYXRhKHRoaXMuY29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tHaXRIb29rcyh0aGlzLmNvbmZpZ0RhdGEgYXMgQ29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgcnVuU2NyaXB0KHtcbiAgICAgICAgICAgIGNvbmZpZ0RhdGE6IHRoaXMuY29uZmlnRGF0YSEsXG4gICAgICAgICAgICBzY3JpcHQsXG4gICAgICAgICAgICBhZGRpdGlvbmFsQXJncyxcbiAgICAgICAgICAgIGFyZ3NGb3J3YXJkaW5nTW9kZTogQXJnc0ZvcndhcmRpbmdNb2RlLkRJUkVDVCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBa0I7QUFFMUMsTUFBTSxHQUFHLGtCQUFrQixFQUFFLFNBQVMsUUFBUSxDQUFxQjtBQUNuRSxNQUFNLEdBQUcsYUFBYSxRQUFRLENBQW9CO0FBQ2xELE1BQU0sR0FBRyxrQkFBa0IsUUFBUSxDQUErQjtBQUNsRSxNQUFNLEdBQUcsZ0JBQWdCLFFBQVEsQ0FBMEI7QUFFM0QsTUFBTSxPQUFPLFVBQVUsU0FBUyxPQUFPO0lBQ2pCLFVBQTZCO2dCQUE3QixVQUE2QixDQUFFLENBQUM7UUFDbEQsS0FBSzthQURhLFVBQTZCLEdBQTdCLFVBQTZCO1FBRS9DLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBYyxlQUM1QixTQUFTLENBQUMsQ0FBdUMsd0NBQ2pELFVBQVUsR0FDVixNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQWMsS0FBSyxjQUFjLEdBQWUsQ0FBQztZQUMzRCxNQUFNLENBQUMsZ0JBQWdCLFdBQWEsQ0FBQztnQkFDbkMsRUFBRSxFQUFFLE1BQU0sS0FBSyxDQUFRLFdBQUksTUFBTSxLQUFLLENBQUksS0FBRSxDQUFDO29CQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPO29CQUN4QixNQUFNO2dCQUNSLENBQUM7Z0JBQ0Qsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQVU7Z0JBQ2xDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVU7Z0JBQ25DLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDZixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7b0JBQzNCLE1BQU07b0JBQ04sY0FBYztvQkFDZCxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxNQUFNO2dCQUMvQyxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDTCxDQUFDIn0=