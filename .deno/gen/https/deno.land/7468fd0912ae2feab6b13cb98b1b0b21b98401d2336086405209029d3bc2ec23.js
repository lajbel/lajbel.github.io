import { boolean } from "../../flags/types/boolean.ts";
import { Type } from "../type.ts";
/** Boolean type with auto completion. Allows `true`, `false`, `0` and `1`. */ export class BooleanType extends Type {
    /** Parse boolean type. */ parse(type) {
        return boolean(type);
    }
    /** Complete boolean type. */ complete() {
        return [
            "true",
            "false"
        ];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvY29tbWFuZC90eXBlcy9ib29sZWFuLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb2xlYW4gfSBmcm9tIFwiLi4vLi4vZmxhZ3MvdHlwZXMvYm9vbGVhbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBJVHlwZUluZm8gfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiLi4vdHlwZS50c1wiO1xuXG4vKiogQm9vbGVhbiB0eXBlIHdpdGggYXV0byBjb21wbGV0aW9uLiBBbGxvd3MgYHRydWVgLCBgZmFsc2VgLCBgMGAgYW5kIGAxYC4gKi9cbmV4cG9ydCBjbGFzcyBCb29sZWFuVHlwZSBleHRlbmRzIFR5cGU8Ym9vbGVhbj4ge1xuICAvKiogUGFyc2UgYm9vbGVhbiB0eXBlLiAqL1xuICBwdWJsaWMgcGFyc2UodHlwZTogSVR5cGVJbmZvKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGJvb2xlYW4odHlwZSk7XG4gIH1cblxuICAvKiogQ29tcGxldGUgYm9vbGVhbiB0eXBlLiAqL1xuICBwdWJsaWMgY29tcGxldGUoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBbXCJ0cnVlXCIsIFwiZmFsc2VcIl07XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQThCO0FBRXRELE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBWTtBQUVqQyxFQUE4RSxBQUE5RSwwRUFBOEUsQUFBOUUsRUFBOEUsQ0FDOUUsTUFBTSxPQUFPLFdBQVcsU0FBUyxJQUFJO0lBQ25DLEVBQTBCLEFBQTFCLHNCQUEwQixBQUExQixFQUEwQixDQUNuQixLQUFLLENBQUMsSUFBZSxFQUFXLENBQUM7UUFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJO0lBQ3JCLENBQUM7SUFFRCxFQUE2QixBQUE3Qix5QkFBNkIsQUFBN0IsRUFBNkIsQ0FDdEIsUUFBUSxHQUFhLENBQUM7UUFDM0IsTUFBTSxDQUFDLENBQUM7WUFBQSxDQUFNO1lBQUUsQ0FBTztRQUFBLENBQUM7SUFDMUIsQ0FBQyJ9