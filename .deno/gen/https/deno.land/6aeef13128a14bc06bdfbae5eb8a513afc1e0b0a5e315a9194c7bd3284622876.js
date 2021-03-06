import { Command } from "../../../deps.ts";
import { ArgsForwardingMode, runScript } from "../../run_script.ts";
import { VR_HOOKS } from "../../consts.ts";
import { validateConfigData } from "../../validate_config_data.ts";
import { isScriptObject } from "../../util.ts";
import { getScriptPrefix } from "../../git_hooks.ts";
export class RunHookCommand extends Command {
    configData;
    constructor(configData){
        super();
        this.configData = configData;
        this.description("Run a git hook").hidden().arguments("<hook:string> [args...]").useRawArgs().action(async (_, hook, ...args)=>{
            validateConfigData(this.configData);
            if (Deno.env.get(VR_HOOKS) !== "false" && this.configData) {
                const script = Object.entries(this.configData.config.scripts).find(([_, value])=>isScriptObject(value) && value.gitHook === hook
                );
                if (script) {
                    await runScript({
                        configData: this.configData,
                        script: script[0],
                        prefix: getScriptPrefix,
                        additionalArgs: args,
                        argsForwardingMode: ArgsForwardingMode.INDIRECT
                    });
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9jbGkvY29tbWFuZHMvcnVuX2hvb2sudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbWFuZCB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBDb25maWdEYXRhIH0gZnJvbSBcIi4uLy4uL2xvYWRfY29uZmlnLnRzXCI7XG5pbXBvcnQgeyBBcmdzRm9yd2FyZGluZ01vZGUsIHJ1blNjcmlwdCB9IGZyb20gXCIuLi8uLi9ydW5fc2NyaXB0LnRzXCI7XG5pbXBvcnQgeyBWUl9IT09LUyB9IGZyb20gXCIuLi8uLi9jb25zdHMudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlQ29uZmlnRGF0YSB9IGZyb20gXCIuLi8uLi92YWxpZGF0ZV9jb25maWdfZGF0YS50c1wiO1xuaW1wb3J0IHsgaXNTY3JpcHRPYmplY3QgfSBmcm9tIFwiLi4vLi4vdXRpbC50c1wiO1xuaW1wb3J0IHsgZ2V0U2NyaXB0UHJlZml4IH0gZnJvbSBcIi4uLy4uL2dpdF9ob29rcy50c1wiO1xuXG5leHBvcnQgY2xhc3MgUnVuSG9va0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb25maWdEYXRhOiBDb25maWdEYXRhIHwgbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kZXNjcmlwdGlvbihcIlJ1biBhIGdpdCBob29rXCIpXG4gICAgICAuaGlkZGVuKClcbiAgICAgIC5hcmd1bWVudHMoXCI8aG9vazpzdHJpbmc+IFthcmdzLi4uXVwiKVxuICAgICAgLnVzZVJhd0FyZ3MoKVxuICAgICAgLmFjdGlvbihhc3luYyAoXywgaG9vazogc3RyaW5nLCAuLi5hcmdzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgICB2YWxpZGF0ZUNvbmZpZ0RhdGEodGhpcy5jb25maWdEYXRhKTtcbiAgICAgICAgaWYgKERlbm8uZW52LmdldChWUl9IT09LUykgIT09IFwiZmFsc2VcIiAmJiB0aGlzLmNvbmZpZ0RhdGEpIHtcbiAgICAgICAgICBjb25zdCBzY3JpcHQgPSBPYmplY3QuZW50cmllcyh0aGlzLmNvbmZpZ0RhdGEuY29uZmlnLnNjcmlwdHMpXG4gICAgICAgICAgICAuZmluZCgoW18sIHZhbHVlXSkgPT5cbiAgICAgICAgICAgICAgaXNTY3JpcHRPYmplY3QodmFsdWUpICYmXG4gICAgICAgICAgICAgIHZhbHVlLmdpdEhvb2sgPT09IGhvb2tcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgYXdhaXQgcnVuU2NyaXB0KHtcbiAgICAgICAgICAgICAgY29uZmlnRGF0YTogdGhpcy5jb25maWdEYXRhISxcbiAgICAgICAgICAgICAgc2NyaXB0OiBzY3JpcHRbMF0sXG4gICAgICAgICAgICAgIHByZWZpeDogZ2V0U2NyaXB0UHJlZml4LFxuICAgICAgICAgICAgICBhZGRpdGlvbmFsQXJnczogYXJncyxcbiAgICAgICAgICAgICAgYXJnc0ZvcndhcmRpbmdNb2RlOiBBcmdzRm9yd2FyZGluZ01vZGUuSU5ESVJFQ1QsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLE9BQU8sUUFBUSxDQUFrQjtBQUUxQyxNQUFNLEdBQUcsa0JBQWtCLEVBQUUsU0FBUyxRQUFRLENBQXFCO0FBQ25FLE1BQU0sR0FBRyxRQUFRLFFBQVEsQ0FBaUI7QUFDMUMsTUFBTSxHQUFHLGtCQUFrQixRQUFRLENBQStCO0FBQ2xFLE1BQU0sR0FBRyxjQUFjLFFBQVEsQ0FBZTtBQUM5QyxNQUFNLEdBQUcsZUFBZSxRQUFRLENBQW9CO0FBRXBELE1BQU0sT0FBTyxjQUFjLFNBQVMsT0FBTztJQUNyQixVQUE2QjtnQkFBN0IsVUFBNkIsQ0FBRSxDQUFDO1FBQ2xELEtBQUs7YUFEYSxVQUE2QixHQUE3QixVQUE2QjtRQUUvQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQWdCLGlCQUM5QixNQUFNLEdBQ04sU0FBUyxDQUFDLENBQXlCLDBCQUNuQyxVQUFVLEdBQ1YsTUFBTSxRQUFRLENBQUMsRUFBRSxJQUFZLEtBQUssSUFBSSxHQUFlLENBQUM7WUFDckQsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQVU7WUFDbEMsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsTUFBTSxDQUFPLFVBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMxRCxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUN6RCxJQUFJLEdBQUcsQ0FBQyxFQUFFLEtBQUssSUFDZCxjQUFjLENBQUMsS0FBSyxLQUNwQixLQUFLLENBQUMsT0FBTyxLQUFLLElBQUk7O2dCQUUxQixFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUM7b0JBQ1gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNmLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTt3QkFDM0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO3dCQUNoQixNQUFNLEVBQUUsZUFBZTt3QkFDdkIsY0FBYyxFQUFFLElBQUk7d0JBQ3BCLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLFFBQVE7b0JBQ2pELENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0wsQ0FBQyJ9