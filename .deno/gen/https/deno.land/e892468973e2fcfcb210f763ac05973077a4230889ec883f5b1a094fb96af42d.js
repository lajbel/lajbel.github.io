import { blue, dim, underline, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
import { GenericPrompt } from "./_generic_prompt.ts";
/** Toggle prompt representation. */ export class Toggle extends GenericPrompt {
    status = typeof this.settings.default !== "undefined" ? this.format(this.settings.default) : "";
    /** Execute the prompt and show cursor on end. */ static prompt(options) {
        if (typeof options === "string") {
            options = {
                message: options
            };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            prefix: yellow("? "),
            indent: " ",
            active: "Yes",
            inactive: "No",
            ...options,
            keys: {
                active: [
                    "right",
                    "y",
                    "j",
                    "s",
                    "o"
                ],
                inactive: [
                    "left",
                    "n"
                ],
                ...options.keys ?? {
                }
            }
        }).prompt();
    }
    message() {
        let message = super.message() + " " + this.settings.pointer + " ";
        if (this.status === this.settings.active) {
            message += dim(this.settings.inactive + " / ") + underline(this.settings.active);
        } else if (this.status === this.settings.inactive) {
            message += underline(this.settings.inactive) + dim(" / " + this.settings.active);
        } else {
            message += dim(this.settings.inactive + " / " + this.settings.active);
        }
        return message;
    }
    /** Read user input from stdin, handle events and validate user input. */ read() {
        this.tty.cursorHide();
        return super.read();
    }
    /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
        switch(true){
            case event.sequence === this.settings.inactive[0].toLowerCase():
            case this.isKey(this.settings.keys, "inactive", event):
                this.selectInactive();
                break;
            case event.sequence === this.settings.active[0].toLowerCase():
            case this.isKey(this.settings.keys, "active", event):
                this.selectActive();
                break;
            default:
                await super.handleEvent(event);
        }
    }
    /** Set active. */ selectActive() {
        this.status = this.settings.active;
    }
    /** Set inactive. */ selectInactive() {
        this.status = this.settings.inactive;
    }
    /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
        return [
            this.settings.active,
            this.settings.inactive
        ].indexOf(value) !== -1;
    }
    /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
        switch(value){
            case this.settings.active:
                return true;
            case this.settings.inactive:
                return false;
        }
    }
    /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
        return value ? this.settings.active : this.settings.inactive;
    }
    /** Get input value. */ getValue() {
        return this.status;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvcHJvbXB0L3RvZ2dsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleUNvZGUgfSBmcm9tIFwiLi4va2V5Y29kZS9rZXlfY29kZS50c1wiO1xuaW1wb3J0IHsgYmx1ZSwgZGltLCB1bmRlcmxpbmUsIHllbGxvdyB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEZpZ3VyZXMgfSBmcm9tIFwiLi9maWd1cmVzLnRzXCI7XG5pbXBvcnQge1xuICBHZW5lcmljUHJvbXB0LFxuICBHZW5lcmljUHJvbXB0S2V5cyxcbiAgR2VuZXJpY1Byb21wdE9wdGlvbnMsXG4gIEdlbmVyaWNQcm9tcHRTZXR0aW5ncyxcbn0gZnJvbSBcIi4vX2dlbmVyaWNfcHJvbXB0LnRzXCI7XG5cbi8qKiBUb2dnbGUga2V5IG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFRvZ2dsZUtleXMgZXh0ZW5kcyBHZW5lcmljUHJvbXB0S2V5cyB7XG4gIGFjdGl2ZT86IHN0cmluZ1tdO1xuICBpbmFjdGl2ZT86IHN0cmluZ1tdO1xufVxuXG4vKiogR2VuZXJpYyBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVG9nZ2xlT3B0aW9ucyBleHRlbmRzIEdlbmVyaWNQcm9tcHRPcHRpb25zPGJvb2xlYW4sIHN0cmluZz4ge1xuICBhY3RpdmU/OiBzdHJpbmc7XG4gIGluYWN0aXZlPzogc3RyaW5nO1xuICBrZXlzPzogVG9nZ2xlS2V5cztcbn1cblxuLyoqIFRvZ2dsZSBwcm9tcHQgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgVG9nZ2xlU2V0dGluZ3MgZXh0ZW5kcyBHZW5lcmljUHJvbXB0U2V0dGluZ3M8Ym9vbGVhbiwgc3RyaW5nPiB7XG4gIGFjdGl2ZTogc3RyaW5nO1xuICBpbmFjdGl2ZTogc3RyaW5nO1xuICBrZXlzOiBUb2dnbGVLZXlzO1xufVxuXG4vKiogVG9nZ2xlIHByb21wdCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBUb2dnbGUgZXh0ZW5kcyBHZW5lcmljUHJvbXB0PGJvb2xlYW4sIHN0cmluZywgVG9nZ2xlU2V0dGluZ3M+IHtcbiAgcHJvdGVjdGVkIHN0YXR1czogc3RyaW5nID0gdHlwZW9mIHRoaXMuc2V0dGluZ3MuZGVmYXVsdCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgID8gdGhpcy5mb3JtYXQodGhpcy5zZXR0aW5ncy5kZWZhdWx0KVxuICAgIDogXCJcIjtcblxuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0IGFuZCBzaG93IGN1cnNvciBvbiBlbmQuICovXG4gIHB1YmxpYyBzdGF0aWMgcHJvbXB0KFxuICAgIG9wdGlvbnM6IHN0cmluZyB8IFRvZ2dsZU9wdGlvbnMsXG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgb3B0aW9ucyA9IHsgbWVzc2FnZTogb3B0aW9ucyB9O1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgdGhpcyh7XG4gICAgICBwb2ludGVyOiBibHVlKEZpZ3VyZXMuUE9JTlRFUl9TTUFMTCksXG4gICAgICBwcmVmaXg6IHllbGxvdyhcIj8gXCIpLFxuICAgICAgaW5kZW50OiBcIiBcIixcbiAgICAgIGFjdGl2ZTogXCJZZXNcIixcbiAgICAgIGluYWN0aXZlOiBcIk5vXCIsXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAga2V5czoge1xuICAgICAgICBhY3RpdmU6IFtcInJpZ2h0XCIsIFwieVwiLCBcImpcIiwgXCJzXCIsIFwib1wiXSxcbiAgICAgICAgaW5hY3RpdmU6IFtcImxlZnRcIiwgXCJuXCJdLFxuICAgICAgICAuLi4ob3B0aW9ucy5rZXlzID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfSkucHJvbXB0KCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgbWVzc2FnZSgpOiBzdHJpbmcge1xuICAgIGxldCBtZXNzYWdlID0gc3VwZXIubWVzc2FnZSgpICsgXCIgXCIgKyB0aGlzLnNldHRpbmdzLnBvaW50ZXIgKyBcIiBcIjtcblxuICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gdGhpcy5zZXR0aW5ncy5hY3RpdmUpIHtcbiAgICAgIG1lc3NhZ2UgKz0gZGltKHRoaXMuc2V0dGluZ3MuaW5hY3RpdmUgKyBcIiAvIFwiKSArXG4gICAgICAgIHVuZGVybGluZSh0aGlzLnNldHRpbmdzLmFjdGl2ZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA9PT0gdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSkge1xuICAgICAgbWVzc2FnZSArPSB1bmRlcmxpbmUodGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSkgK1xuICAgICAgICBkaW0oXCIgLyBcIiArIHRoaXMuc2V0dGluZ3MuYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZSArPSBkaW0odGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSArIFwiIC8gXCIgKyB0aGlzLnNldHRpbmdzLmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICAvKiogUmVhZCB1c2VyIGlucHV0IGZyb20gc3RkaW4sIGhhbmRsZSBldmVudHMgYW5kIHZhbGlkYXRlIHVzZXIgaW5wdXQuICovXG4gIHByb3RlY3RlZCByZWFkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMudHR5LmN1cnNvckhpZGUoKTtcbiAgICByZXR1cm4gc3VwZXIucmVhZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSB1c2VyIGlucHV0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5IGV2ZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUV2ZW50KGV2ZW50OiBLZXlDb2RlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICBjYXNlIGV2ZW50LnNlcXVlbmNlID09PSB0aGlzLnNldHRpbmdzLmluYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImluYWN0aXZlXCIsIGV2ZW50KTpcbiAgICAgICAgdGhpcy5zZWxlY3RJbmFjdGl2ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZXZlbnQuc2VxdWVuY2UgPT09IHRoaXMuc2V0dGluZ3MuYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImFjdGl2ZVwiLCBldmVudCk6XG4gICAgICAgIHRoaXMuc2VsZWN0QWN0aXZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXdhaXQgc3VwZXIuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXQgYWN0aXZlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0QWN0aXZlKCkge1xuICAgIHRoaXMuc3RhdHVzID0gdGhpcy5zZXR0aW5ncy5hY3RpdmU7XG4gIH1cblxuICAvKiogU2V0IGluYWN0aXZlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0SW5hY3RpdmUoKSB7XG4gICAgdGhpcy5zdGF0dXMgPSB0aGlzLnNldHRpbmdzLmluYWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIHJldHVybiBbdGhpcy5zZXR0aW5ncy5hY3RpdmUsIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmVdLmluZGV4T2YodmFsdWUpICE9PSAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgaW5wdXQgdmFsdWUgdG8gb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqIEByZXR1cm4gT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIHRyYW5zZm9ybSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSB0aGlzLnNldHRpbmdzLmFjdGl2ZTpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmU6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBmb3JtYXQodmFsdWU6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiB2YWx1ZSA/IHRoaXMuc2V0dGluZ3MuYWN0aXZlIDogdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZTtcbiAgfVxuXG4gIC8qKiBHZXQgaW5wdXQgdmFsdWUuICovXG4gIHByb3RlY3RlZCBnZXRWYWx1ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE1BQU0sR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLFFBQVEsQ0FBVztBQUN4RCxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQWM7QUFDdEMsTUFBTSxHQUNKLGFBQWEsUUFJUixDQUFzQjtBQXNCN0IsRUFBb0MsQUFBcEMsZ0NBQW9DLEFBQXBDLEVBQW9DLENBQ3BDLE1BQU0sT0FBTyxNQUFNLFNBQVMsYUFBYTtJQUM3QixNQUFNLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxLQUFLLENBQVcsYUFDbkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFD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