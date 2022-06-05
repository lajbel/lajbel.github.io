import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions } from "./_generic_suggestions.ts";
import { blue, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
/** Input prompt representation. */ export class Input extends GenericSuggestions {
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
            listPointer: blue(Figures.POINTER),
            maxRows: 8,
            minLength: 0,
            maxLength: Infinity,
            ...options
        }).prompt();
    }
    /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Input value.
   */ static inject(value) {
        GenericPrompt.inject(value);
    }
    success(value) {
        this.saveSuggestions(value);
        return super.success(value);
    }
    /** Get input input. */ getValue() {
        return this.inputValue;
    }
    /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
        if (typeof value !== "string") {
            return false;
        }
        if (value.length < this.settings.minLength) {
            return `Value must be longer then ${this.settings.minLength} but has a length of ${value.length}.`;
        }
        if (value.length > this.settings.maxLength) {
            return `Value can't be longer then ${this.settings.maxLength} but has a length of ${value.length}.`;
        }
        return true;
    }
    /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
        return value.trim();
    }
    /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvcHJvbXB0L2lucHV0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdlbmVyaWNQcm9tcHQgfSBmcm9tIFwiLi9fZ2VuZXJpY19wcm9tcHQudHNcIjtcbmltcG9ydCB7XG4gIEdlbmVyaWNTdWdnZXN0aW9ucyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zT3B0aW9ucyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zU2V0dGluZ3MsXG59IGZyb20gXCIuL19nZW5lcmljX3N1Z2dlc3Rpb25zLnRzXCI7XG5pbXBvcnQgeyBibHVlLCB5ZWxsb3cgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBGaWd1cmVzIH0gZnJvbSBcIi4vZmlndXJlcy50c1wiO1xuXG5leHBvcnQgdHlwZSBJbnB1dEtleXMgPSBHZW5lcmljU3VnZ2VzdGlvbnNLZXlzO1xuXG4vKiogSW5wdXQgcHJvbXB0IG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIElucHV0T3B0aW9uc1xuICBleHRlbmRzIEdlbmVyaWNTdWdnZXN0aW9uc09wdGlvbnM8c3RyaW5nLCBzdHJpbmc+IHtcbiAgbWluTGVuZ3RoPzogbnVtYmVyO1xuICBtYXhMZW5ndGg/OiBudW1iZXI7XG4gIGtleXM/OiBJbnB1dEtleXM7XG59XG5cbi8qKiBJbnB1dCBwcm9tcHQgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgSW5wdXRTZXR0aW5ncyBleHRlbmRzIEdlbmVyaWNTdWdnZXN0aW9uc1NldHRpbmdzPHN0cmluZywgc3RyaW5nPiB7XG4gIG1pbkxlbmd0aDogbnVtYmVyO1xuICBtYXhMZW5ndGg6IG51bWJlcjtcbiAga2V5cz86IElucHV0S2V5cztcbn1cblxuLyoqIElucHV0IHByb21wdCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBJbnB1dCBleHRlbmRzIEdlbmVyaWNTdWdnZXN0aW9uczxzdHJpbmcsIHN0cmluZywgSW5wdXRTZXR0aW5ncz4ge1xuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0IGFuZCBzaG93IGN1cnNvciBvbiBlbmQuICovXG4gIHB1YmxpYyBzdGF0aWMgcHJvbXB0KG9wdGlvbnM6IHN0cmluZyB8IElucHV0T3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBvcHRpb25zID0geyBtZXNzYWdlOiBvcHRpb25zIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyB0aGlzKHtcbiAgICAgIHBvaW50ZXI6IGJsdWUoRmlndXJlcy5QT0lOVEVSX1NNQUxMKSxcbiAgICAgIHByZWZpeDogeWVsbG93KFwiPyBcIiksXG4gICAgICBpbmRlbnQ6IFwiIFwiLFxuICAgICAgbGlzdFBvaW50ZXI6IGJsdWUoRmlndXJlcy5QT0lOVEVSKSxcbiAgICAgIG1heFJvd3M6IDgsXG4gICAgICBtaW5MZW5ndGg6IDAsXG4gICAgICBtYXhMZW5ndGg6IEluZmluaXR5LFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9KS5wcm9tcHQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmplY3QgcHJvbXB0IHZhbHVlLiBDYW4gYmUgdXNlZCBmb3IgdW5pdCB0ZXN0cyBvciBwcmUgc2VsZWN0aW9ucy5cbiAgICogQHBhcmFtIHZhbHVlIElucHV0IHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBpbmplY3QodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIEdlbmVyaWNQcm9tcHQuaW5qZWN0KHZhbHVlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdWNjZXNzKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHRoaXMuc2F2ZVN1Z2dlc3Rpb25zKHZhbHVlKTtcbiAgICByZXR1cm4gc3VwZXIuc3VjY2Vzcyh2YWx1ZSk7XG4gIH1cblxuICAvKiogR2V0IGlucHV0IGlucHV0LiAqL1xuICBwcm90ZWN0ZWQgZ2V0VmFsdWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5pbnB1dFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHZhbHVlLmxlbmd0aCA8IHRoaXMuc2V0dGluZ3MubWluTGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYFZhbHVlIG11c3QgYmUgbG9uZ2VyIHRoZW4gJHt0aGlzLnNldHRpbmdzLm1pbkxlbmd0aH0gYnV0IGhhcyBhIGxlbmd0aCBvZiAke3ZhbHVlLmxlbmd0aH0uYDtcbiAgICB9XG4gICAgaWYgKHZhbHVlLmxlbmd0aCA+IHRoaXMuc2V0dGluZ3MubWF4TGVuZ3RoKSB7XG4gICAgICByZXR1cm4gYFZhbHVlIGNhbid0IGJlIGxvbmdlciB0aGVuICR7dGhpcy5zZXR0aW5ncy5tYXhMZW5ndGh9IGJ1dCBoYXMgYSBsZW5ndGggb2YgJHt2YWx1ZS5sZW5ndGh9LmA7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBpbnB1dCB2YWx1ZSB0byBvdXRwdXQgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBJbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBPdXRwdXQgdmFsdWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJhbnNmb3JtKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBmb3JtYXQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLGFBQWEsUUFBUSxDQUFzQjtBQUNwRCxNQUFNLEdBQ0osa0JBQWtCLFFBSWIsQ0FBMkI7QUFDbEMsTUFBTSxHQUFHLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBVztBQUN4QyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQWM7QUFtQnRDLEVBQW1DLEFBQW5DLCtCQUFtQyxBQUFuQyxFQUFtQyxDQUNuQyxNQUFNLE9BQU8sS0FBSyxTQUFTLGtCQUFrQjtJQUMzQyxFQUFpRCxBQUFqRCw2Q0FBaUQsQUFBakQsRUFBaUQsUUFDbkMsTUFBTSxDQUFDLE9BQThCLEVBQW1CLENBQUM7UUFDckUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBUSxTQUFFLENBQUM7WUFDaEMsT0FBTyxHQUFHLENBQUM7Z0JBQUMsT0FBTyxFQUFFLE9BQU87WUFBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYTtZQUNuQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUk7WUFDbkIsTUFBTSxFQUFFLENBQUc7WUFDWCxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO1lBQ2pDLE9BQU8sRUFBRSxDQUFDO1lBQ1YsU0FBUyxFQUFFLENBQUM7WUFDWixTQUFTLEVBQUUsUUFBUTtlQUNoQixPQUFPO1FBQ1osQ0FBQyxFQUFFLE1BQU07SUFDWCxDQUFDO0lBRUQsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csUUFDVyxNQUFNLENBQUMsS0FBYSxFQUFRLENBQUM7UUFDekMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLO0lBQzVCLENBQUM7SUFFUyxPQUFPLENBQUMsS0FBYSxFQUFzQixDQUFDO1FBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSztRQUMxQixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLO0lBQzVCLENBQUM7SUFFRCxFQUF1QixBQUF2QixtQkFBdUIsQUFBdkIsRUFBdUIsQ0FDYixRQUFRLEdBQVcsQ0FBQztRQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVU7SUFDeEIsQ0FBQztJQUVELEVBSUcsQUFKSDs7OztHQUlHLEFBSkgsRUFJRyxDQUNPLFFBQVEsQ0FBQyxLQUFhLEVBQW9CLENBQUM7UUFDbkQsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssQ0FBUSxTQUFFLENBQUM7WUFDOUIsTUFBTSxDQUFDLEtBQUs7UUFDZCxDQUFDO1FBQ0QsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUMzQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25HLENBQUM7UUFDRCxFQUFFLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzNDLE1BQU0sRUFBRSwyQkFBMkIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJO0lBQ2IsQ0FBQztJQUVELEVBSUcsQUFKSDs7OztHQUlHLEFBSkgsRUFJRyxDQUNPLFNBQVMsQ0FBQyxLQUFhLEVBQXNCLENBQUM7UUFDdEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJO0lBQ25CLENBQUM7SUFFRCxFQUdHLEFBSEg7OztHQUdHLEFBSEgsRUFHRyxDQUNPLE1BQU0sQ0FBQyxLQUFhLEVBQVUsQ0FBQztRQUN2QyxNQUFNLENBQUMsS0FBSztJQUNkLENBQUMifQ==