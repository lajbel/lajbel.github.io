import { Command, CompletionsCommand } from "../../../deps.ts";
import { version } from "../../version.ts";
import { ScriptIdType } from "../types/script_id_type.ts";
import { RunCommand } from "./run.ts";
import { ExportCommand } from "./export.ts";
import { ArgsForwardingMode, runScript } from "../../run_script.ts";
import { RunHookCommand } from "./run_hook.ts";
import { VR_HOOKS, VR_LOG, VR_SHELL } from "../../consts.ts";
import { checkGitHooks } from "../../git_hooks.ts";
import { validateConfigData } from "../../validate_config_data.ts";
import { UpgradeCommand } from "./upgrade.ts";
import { withUpdateChecks } from "../../update_notifier.ts";
export class VrCommand extends Command {
    configData;
    constructor(configData) {
        super();
        this.configData = configData;
        this.name("vr")
            .version(version)
            .description("🦖 Velociraptor\nThe npm-style script runner for Deno\n\nDocs: https://velociraptor.run")
            .env(`${VR_SHELL}=<value:string>`, "The path to a shell executable to be used for executing scripts")
            .env(`${VR_LOG}=<value:string>`, "Log verbosity. One of: DEBUG, INFO, WARNING, ERROR, CRITICAL")
            .env(`${VR_HOOKS}=<value:boolean>`, "If 'false', prevents velociraptor from installing and running git hooks (ie for CI)")
            .type("scriptid", new ScriptIdType(this.configData), { global: true })
            .arguments("[script:scriptid] [additionalArgs...]")
            .stopEarly()
            .action((_, script, additionalArgs) => {
            return withUpdateChecks(async () => {
                validateConfigData(this.configData);
                await checkGitHooks(this.configData);
                await runScript({
                    configData: this.configData,
                    script,
                    additionalArgs,
                    argsForwardingMode: ArgsForwardingMode.DIRECT,
                });
            });
        })
            .command("run", new RunCommand(this.configData))
            .command("run-hook", new RunHookCommand(this.configData))
            .command("export", new ExportCommand(this.configData))
            .command("upgrade", new UpgradeCommand())
            .command("completions", new CompletionsCommand().hidden())
            .reset();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2ci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUUxRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3RDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDNUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDL0MsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ25FLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDOUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFNUQsTUFBTSxPQUFPLFNBQVUsU0FBUSxPQUFPO0lBQ2hCO0lBQXBCLFlBQW9CLFVBQTZCO1FBQy9DLEtBQUssRUFBRSxDQUFDO1FBRFUsZUFBVSxHQUFWLFVBQVUsQ0FBbUI7UUFFL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDWixPQUFPLENBQUMsT0FBTyxDQUFDO2FBQ2hCLFdBQVcsQ0FDVix5RkFBeUYsQ0FDMUY7YUFDQSxHQUFHLENBQ0YsR0FBRyxRQUFRLGlCQUFpQixFQUM1QixpRUFBaUUsQ0FDbEU7YUFDQSxHQUFHLENBQ0YsR0FBRyxNQUFNLGlCQUFpQixFQUMxQiw4REFBOEQsQ0FDL0Q7YUFDQSxHQUFHLENBQ0YsR0FBRyxRQUFRLGtCQUFrQixFQUM3QixxRkFBcUYsQ0FDdEY7YUFDQSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUNyRSxTQUFTLENBQUMsdUNBQXVDLENBQUM7YUFDbEQsU0FBUyxFQUFFO2FBQ1gsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQWMsRUFBRSxjQUF3QixFQUFFLEVBQUU7WUFDdEQsT0FBTyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDakMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBd0IsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLFNBQVMsQ0FBQztvQkFDZCxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVc7b0JBQzVCLE1BQU07b0JBQ04sY0FBYztvQkFDZCxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxNQUFNO2lCQUM5QyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQy9DLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3hELE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3JELE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxjQUFjLEVBQUUsQ0FBQzthQUN4QyxPQUFPLENBQUMsYUFBYSxFQUFFLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUN6RCxLQUFLLEVBQUUsQ0FBQztJQUNiLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmQsIENvbXBsZXRpb25zQ29tbWFuZCB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyB2ZXJzaW9uIH0gZnJvbSBcIi4uLy4uL3ZlcnNpb24udHNcIjtcbmltcG9ydCB7IFNjcmlwdElkVHlwZSB9IGZyb20gXCIuLi90eXBlcy9zY3JpcHRfaWRfdHlwZS50c1wiO1xuaW1wb3J0IHsgQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi9sb2FkX2NvbmZpZy50c1wiO1xuaW1wb3J0IHsgUnVuQ29tbWFuZCB9IGZyb20gXCIuL3J1bi50c1wiO1xuaW1wb3J0IHsgRXhwb3J0Q29tbWFuZCB9IGZyb20gXCIuL2V4cG9ydC50c1wiO1xuaW1wb3J0IHsgQXJnc0ZvcndhcmRpbmdNb2RlLCBydW5TY3JpcHQgfSBmcm9tIFwiLi4vLi4vcnVuX3NjcmlwdC50c1wiO1xuaW1wb3J0IHsgUnVuSG9va0NvbW1hbmQgfSBmcm9tIFwiLi9ydW5faG9vay50c1wiO1xuaW1wb3J0IHsgVlJfSE9PS1MsIFZSX0xPRywgVlJfU0hFTEwgfSBmcm9tIFwiLi4vLi4vY29uc3RzLnRzXCI7XG5pbXBvcnQgeyBjaGVja0dpdEhvb2tzIH0gZnJvbSBcIi4uLy4uL2dpdF9ob29rcy50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVDb25maWdEYXRhIH0gZnJvbSBcIi4uLy4uL3ZhbGlkYXRlX2NvbmZpZ19kYXRhLnRzXCI7XG5pbXBvcnQgeyBVcGdyYWRlQ29tbWFuZCB9IGZyb20gXCIuL3VwZ3JhZGUudHNcIjtcbmltcG9ydCB7IHdpdGhVcGRhdGVDaGVja3MgfSBmcm9tIFwiLi4vLi4vdXBkYXRlX25vdGlmaWVyLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBWckNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb25maWdEYXRhOiBDb25maWdEYXRhIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5uYW1lKFwidnJcIilcbiAgICAgIC52ZXJzaW9uKHZlcnNpb24pXG4gICAgICAuZGVzY3JpcHRpb24oXG4gICAgICAgIFwi7aC+7baWIFZlbG9jaXJhcHRvclxcblRoZSBucG0tc3R5bGUgc2NyaXB0IHJ1bm5lciBmb3IgRGVub1xcblxcbkRvY3M6IGh0dHBzOi8vdmVsb2NpcmFwdG9yLnJ1blwiLFxuICAgICAgKVxuICAgICAgLmVudihcbiAgICAgICAgYCR7VlJfU0hFTEx9PTx2YWx1ZTpzdHJpbmc+YCxcbiAgICAgICAgXCJUaGUgcGF0aCB0byBhIHNoZWxsIGV4ZWN1dGFibGUgdG8gYmUgdXNlZCBmb3IgZXhlY3V0aW5nIHNjcmlwdHNcIixcbiAgICAgIClcbiAgICAgIC5lbnYoXG4gICAgICAgIGAke1ZSX0xPR309PHZhbHVlOnN0cmluZz5gLFxuICAgICAgICBcIkxvZyB2ZXJib3NpdHkuIE9uZSBvZjogREVCVUcsIElORk8sIFdBUk5JTkcsIEVSUk9SLCBDUklUSUNBTFwiLFxuICAgICAgKVxuICAgICAgLmVudihcbiAgICAgICAgYCR7VlJfSE9PS1N9PTx2YWx1ZTpib29sZWFuPmAsXG4gICAgICAgIFwiSWYgJ2ZhbHNlJywgcHJldmVudHMgdmVsb2NpcmFwdG9yIGZyb20gaW5zdGFsbGluZyBhbmQgcnVubmluZyBnaXQgaG9va3MgKGllIGZvciBDSSlcIixcbiAgICAgIClcbiAgICAgIC50eXBlKFwic2NyaXB0aWRcIiwgbmV3IFNjcmlwdElkVHlwZSh0aGlzLmNvbmZpZ0RhdGEpLCB7IGdsb2JhbDogdHJ1ZSB9KVxuICAgICAgLmFyZ3VtZW50cyhcIltzY3JpcHQ6c2NyaXB0aWRdIFthZGRpdGlvbmFsQXJncy4uLl1cIilcbiAgICAgIC5zdG9wRWFybHkoKVxuICAgICAgLmFjdGlvbigoXywgc2NyaXB0OiBzdHJpbmcsIGFkZGl0aW9uYWxBcmdzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgICByZXR1cm4gd2l0aFVwZGF0ZUNoZWNrcyhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFsaWRhdGVDb25maWdEYXRhKHRoaXMuY29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tHaXRIb29rcyh0aGlzLmNvbmZpZ0RhdGEgYXMgQ29uZmlnRGF0YSk7XG4gICAgICAgICAgYXdhaXQgcnVuU2NyaXB0KHtcbiAgICAgICAgICAgIGNvbmZpZ0RhdGE6IHRoaXMuY29uZmlnRGF0YSEsXG4gICAgICAgICAgICBzY3JpcHQsXG4gICAgICAgICAgICBhZGRpdGlvbmFsQXJncyxcbiAgICAgICAgICAgIGFyZ3NGb3J3YXJkaW5nTW9kZTogQXJnc0ZvcndhcmRpbmdNb2RlLkRJUkVDVCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNvbW1hbmQoXCJydW5cIiwgbmV3IFJ1bkNvbW1hbmQodGhpcy5jb25maWdEYXRhKSlcbiAgICAgIC5jb21tYW5kKFwicnVuLWhvb2tcIiwgbmV3IFJ1bkhvb2tDb21tYW5kKHRoaXMuY29uZmlnRGF0YSkpXG4gICAgICAuY29tbWFuZChcImV4cG9ydFwiLCBuZXcgRXhwb3J0Q29tbWFuZCh0aGlzLmNvbmZpZ0RhdGEpKVxuICAgICAgLmNvbW1hbmQoXCJ1cGdyYWRlXCIsIG5ldyBVcGdyYWRlQ29tbWFuZCgpKVxuICAgICAgLmNvbW1hbmQoXCJjb21wbGV0aW9uc1wiLCBuZXcgQ29tcGxldGlvbnNDb21tYW5kKCkuaGlkZGVuKCkpXG4gICAgICAucmVzZXQoKTtcbiAgfVxufVxuIl19