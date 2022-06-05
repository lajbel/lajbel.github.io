// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
class Dirent {
    entry;
    constructor(entry){
        this.entry = entry;
    }
    isBlockDevice() {
        notImplemented("Deno does not yet support identification of block devices");
        return false;
    }
    isCharacterDevice() {
        notImplemented("Deno does not yet support identification of character devices");
        return false;
    }
    isDirectory() {
        return this.entry.isDirectory;
    }
    isFIFO() {
        notImplemented("Deno does not yet support identification of FIFO named pipes");
        return false;
    }
    isFile() {
        return this.entry.isFile;
    }
    isSocket() {
        notImplemented("Deno does not yet support identification of sockets");
        return false;
    }
    isSymbolicLink() {
        return this.entry.isSymlink;
    }
    get name() {
        return this.entry.name;
    }
}
export { Dirent as default };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19kaXJlbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IG5vdEltcGxlbWVudGVkIH0gZnJvbSBcIi4uL191dGlscy50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXJlbnQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVudHJ5OiBEZW5vLkRpckVudHJ5KSB7fVxuXG4gIGlzQmxvY2tEZXZpY2UoKTogYm9vbGVhbiB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJEZW5vIGRvZXMgbm90IHlldCBzdXBwb3J0IGlkZW50aWZpY2F0aW9uIG9mIGJsb2NrIGRldmljZXNcIik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaXNDaGFyYWN0ZXJEZXZpY2UoKTogYm9vbGVhbiB7XG4gICAgbm90SW1wbGVtZW50ZWQoXG4gICAgICBcIkRlbm8gZG9lcyBub3QgeWV0IHN1cHBvcnQgaWRlbnRpZmljYXRpb24gb2YgY2hhcmFjdGVyIGRldmljZXNcIixcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzRGlyZWN0b3J5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmVudHJ5LmlzRGlyZWN0b3J5O1xuICB9XG5cbiAgaXNGSUZPKCk6IGJvb2xlYW4ge1xuICAgIG5vdEltcGxlbWVudGVkKFxuICAgICAgXCJEZW5vIGRvZXMgbm90IHlldCBzdXBwb3J0IGlkZW50aWZpY2F0aW9uIG9mIEZJRk8gbmFtZWQgcGlwZXNcIixcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzRmlsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyeS5pc0ZpbGU7XG4gIH1cblxuICBpc1NvY2tldCgpOiBib29sZWFuIHtcbiAgICBub3RJbXBsZW1lbnRlZChcIkRlbm8gZG9lcyBub3QgeWV0IHN1cHBvcnQgaWRlbnRpZmljYXRpb24gb2Ygc29ja2V0c1wiKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpc1N5bWJvbGljTGluaygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyeS5pc1N5bWxpbms7XG4gIH1cblxuICBnZXQgbmFtZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyeS5uYW1lO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLE1BQU0sR0FBRyxjQUFjLFFBQVEsQ0FBYztNQUV4QixNQUFNO0lBQ0wsS0FBb0I7Z0JBQXBCLEtBQW9CLENBQUUsQ0FBQzthQUF2QixLQUFvQixHQUFwQixLQUFvQjtJQUFHLENBQUM7SUFFNUMsYUFBYSxHQUFZLENBQUM7UUFDeEIsY0FBYyxDQUFDLENBQTJEO1FBQzFFLE1BQU0sQ0FBQyxLQUFLO0lBQ2QsQ0FBQztJQUVELGlCQUFpQixHQUFZLENBQUM7UUFDNUIsY0FBYyxDQUNaLENBQStEO1FBRWpFLE1BQU0sQ0FBQyxLQUFLO0lBQ2QsQ0FBQztJQUVELFdBQVcsR0FBWSxDQUFDO1FBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVc7SUFDL0IsQ0FBQztJQUVELE1BQU0sR0FBWSxDQUFDO1FBQ2pCLGNBQWMsQ0FDWixDQUE4RDtRQUVoRSxNQUFNLENBQUMsS0FBSztJQUNkLENBQUM7SUFFRCxNQUFNLEdBQVksQ0FBQztRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO0lBQzFCLENBQUM7SUFFRCxRQUFRLEdBQVksQ0FBQztRQUNuQixjQUFjLENBQUMsQ0FBcUQ7UUFDcEUsTUFBTSxDQUFDLEtBQUs7SUFDZCxDQUFDO0lBRUQsY0FBYyxHQUFZLENBQUM7UUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUztJQUM3QixDQUFDO1FBRUcsSUFBSSxHQUFrQixDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7SUFDeEIsQ0FBQzs7QUF6Q0gsTUFBTSxHQUFlLE1BQU0ifQ==