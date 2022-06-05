import { Command } from "../../../deps.ts";
import { exportScripts } from "../../export_scripts.ts";
import { checkGitHooks } from "../../git_hooks.ts";
import { validateConfigData } from "../../validate_config_data.ts";
import { withUpdateChecks } from "../../update_notifier.ts";
export class ExportCommand extends Command {
    configData;
    constructor(configData) {
        super();
        this.configData = configData;
        this.description("Export one or more scripts as standalone executable files")
            .arguments("[scripts...:scriptid]")
            .option("-o, --out-dir [dir:string]", "The folder where the scripts will be exported")
            .action((options, scripts) => {
            return withUpdateChecks(async () => {
                validateConfigData(this.configData);
                await checkGitHooks(this.configData);
                await exportScripts(this.configData, scripts, options.outDir);
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUUzQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDeEQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ25FLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRTVELE1BQU0sT0FBTyxhQUFjLFNBQVEsT0FBTztJQUNwQjtJQUFwQixZQUFvQixVQUE2QjtRQUMvQyxLQUFLLEVBQUUsQ0FBQztRQURVLGVBQVUsR0FBVixVQUFVLENBQW1CO1FBRS9DLElBQUksQ0FBQyxXQUFXLENBQ2QsMkRBQTJELENBQzVEO2FBQ0UsU0FBUyxDQUFDLHVCQUF1QixDQUFDO2FBQ2xDLE1BQU0sQ0FDTCw0QkFBNEIsRUFDNUIsK0NBQStDLENBQ2hEO2FBQ0EsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQWlCLEVBQUUsRUFBRTtZQUNyQyxPQUFPLGdCQUFnQixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNqQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sYUFBYSxDQUFDLElBQUksQ0FBQyxVQUF3QixDQUFDLENBQUM7Z0JBQ25ELE1BQU0sYUFBYSxDQUNqQixJQUFJLENBQUMsVUFBd0IsRUFDN0IsT0FBTyxFQUNQLE9BQU8sQ0FBQyxNQUFNLENBQ2YsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IENvbmZpZ0RhdGEgfSBmcm9tIFwiLi4vLi4vbG9hZF9jb25maWcudHNcIjtcbmltcG9ydCB7IGV4cG9ydFNjcmlwdHMgfSBmcm9tIFwiLi4vLi4vZXhwb3J0X3NjcmlwdHMudHNcIjtcbmltcG9ydCB7IGNoZWNrR2l0SG9va3MgfSBmcm9tIFwiLi4vLi4vZ2l0X2hvb2tzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUNvbmZpZ0RhdGEgfSBmcm9tIFwiLi4vLi4vdmFsaWRhdGVfY29uZmlnX2RhdGEudHNcIjtcbmltcG9ydCB7IHdpdGhVcGRhdGVDaGVja3MgfSBmcm9tIFwiLi4vLi4vdXBkYXRlX25vdGlmaWVyLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBFeHBvcnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29uZmlnRGF0YTogQ29uZmlnRGF0YSB8IG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZGVzY3JpcHRpb24oXG4gICAgICBcIkV4cG9ydCBvbmUgb3IgbW9yZSBzY3JpcHRzIGFzIHN0YW5kYWxvbmUgZXhlY3V0YWJsZSBmaWxlc1wiLFxuICAgIClcbiAgICAgIC5hcmd1bWVudHMoXCJbc2NyaXB0cy4uLjpzY3JpcHRpZF1cIilcbiAgICAgIC5vcHRpb24oXG4gICAgICAgIFwiLW8sIC0tb3V0LWRpciBbZGlyOnN0cmluZ11cIixcbiAgICAgICAgXCJUaGUgZm9sZGVyIHdoZXJlIHRoZSBzY3JpcHRzIHdpbGwgYmUgZXhwb3J0ZWRcIixcbiAgICAgIClcbiAgICAgIC5hY3Rpb24oKG9wdGlvbnMsIHNjcmlwdHM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgIHJldHVybiB3aXRoVXBkYXRlQ2hlY2tzKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB2YWxpZGF0ZUNvbmZpZ0RhdGEodGhpcy5jb25maWdEYXRhKTtcbiAgICAgICAgICBhd2FpdCBjaGVja0dpdEhvb2tzKHRoaXMuY29uZmlnRGF0YSBhcyBDb25maWdEYXRhKTtcbiAgICAgICAgICBhd2FpdCBleHBvcnRTY3JpcHRzKFxuICAgICAgICAgICAgdGhpcy5jb25maWdEYXRhIGFzIENvbmZpZ0RhdGEsXG4gICAgICAgICAgICBzY3JpcHRzLFxuICAgICAgICAgICAgb3B0aW9ucy5vdXREaXIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl19