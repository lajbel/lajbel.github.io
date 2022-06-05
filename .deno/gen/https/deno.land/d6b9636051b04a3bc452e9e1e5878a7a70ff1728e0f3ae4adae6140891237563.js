import { Command } from "../../../deps.ts";
import { ArgsForwardingMode, runScript } from "../../run_script.ts";
import { checkGitHooks } from "../../git_hooks.ts";
import { validateConfigData } from "../../validate_config_data.ts";
import { withUpdateChecks } from "../../update_notifier.ts";
export class RunCommand extends Command {
    configData;
    constructor(configData) {
        super();
        this.configData = configData;
        this.description("Run a script")
            .arguments("<script:scriptid> [additionalArgs...]")
            .useRawArgs()
            .action((_, script, ...additionalArgs) => {
            return withUpdateChecks(async () => {
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
                    argsForwardingMode: ArgsForwardingMode.DIRECT,
                });
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUUzQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDcEUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ25FLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRTVELE1BQU0sT0FBTyxVQUFXLFNBQVEsT0FBTztJQUNqQjtJQUFwQixZQUFvQixVQUE2QjtRQUMvQyxLQUFLLEVBQUUsQ0FBQztRQURVLGVBQVUsR0FBVixVQUFVLENBQW1CO1FBRS9DLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDO2FBQzdCLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQzthQUNsRCxVQUFVLEVBQUU7YUFDWixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBYyxFQUFFLEdBQUcsY0FBd0IsRUFBRSxFQUFFO1lBQ3pELE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ2pDLElBQUksTUFBTSxLQUFLLFFBQVEsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO29CQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUM1QixPQUFPO2lCQUNSO2dCQUNELGtCQUFrQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQXdCLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxTQUFTLENBQUM7b0JBQ2QsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFXO29CQUM1QixNQUFNO29CQUNOLGNBQWM7b0JBQ2Qsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsTUFBTTtpQkFDOUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi9sb2FkX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgQXJnc0ZvcndhcmRpbmdNb2RlLCBydW5TY3JpcHQgfSBmcm9tIFwiLi4vLi4vcnVuX3NjcmlwdC50c1wiO1xuaW1wb3J0IHsgY2hlY2tHaXRIb29rcyB9IGZyb20gXCIuLi8uLi9naXRfaG9va3MudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi92YWxpZGF0ZV9jb25maWdfZGF0YS50c1wiO1xuaW1wb3J0IHsgd2l0aFVwZGF0ZUNoZWNrcyB9IGZyb20gXCIuLi8uLi91cGRhdGVfbm90aWZpZXIudHNcIjtcblxuZXhwb3J0IGNsYXNzIFJ1bkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb25maWdEYXRhOiBDb25maWdEYXRhIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbihcIlJ1biBhIHNjcmlwdFwiKVxuICAgICAgLmFyZ3VtZW50cyhcIjxzY3JpcHQ6c2NyaXB0aWQ+IFthZGRpdGlvbmFsQXJncy4uLl1cIilcbiAgICAgIC51c2VSYXdBcmdzKClcbiAgICAgIC5hY3Rpb24oKF8sIHNjcmlwdDogc3RyaW5nLCAuLi5hZGRpdGlvbmFsQXJnczogc3RyaW5nW10pID0+IHtcbiAgICAgICAgcmV0dXJuIHdpdGhVcGRhdGVDaGVja3MoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGlmIChzY3JpcHQgPT09IFwiLS1oZWxwXCIgfHwgc2NyaXB0ID09PSBcIi1oXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZ2V0SGVscCgpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFsaWRhdGVDb25maWdEYXRhKHRoaXMuY29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tHaXRIb29rcyh0aGlzLmNvbmZpZ0RhdGEgYXMgQ29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgcnVuU2NyaXB0KHtcbiAgICAgICAgICAgIGNvbmZpZ0RhdGE6IHRoaXMuY29uZmlnRGF0YSEsXG4gICAgICAgICAgICBzY3JpcHQsXG4gICAgICAgICAgICBhZGRpdGlvbmFsQXJncyxcbiAgICAgICAgICAgIGFyZ3NGb3J3YXJkaW5nTW9kZTogQXJnc0ZvcndhcmRpbmdNb2RlLkRJUkVDVCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl19