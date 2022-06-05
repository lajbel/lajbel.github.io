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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX2RpcmVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgbm90SW1wbGVtZW50ZWQgfSBmcm9tIFwiLi4vX3V0aWxzLnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpcmVudCB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZW50cnk6IERlbm8uRGlyRW50cnkpIHt9XG5cbiAgaXNCbG9ja0RldmljZSgpOiBib29sZWFuIHtcbiAgICBub3RJbXBsZW1lbnRlZChcIkRlbm8gZG9lcyBub3QgeWV0IHN1cHBvcnQgaWRlbnRpZmljYXRpb24gb2YgYmxvY2sgZGV2aWNlc1wiKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpc0NoYXJhY3RlckRldmljZSgpOiBib29sZWFuIHtcbiAgICBub3RJbXBsZW1lbnRlZChcbiAgICAgIFwiRGVubyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCBpZGVudGlmaWNhdGlvbiBvZiBjaGFyYWN0ZXIgZGV2aWNlc1wiLFxuICAgICk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaXNEaXJlY3RvcnkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZW50cnkuaXNEaXJlY3Rvcnk7XG4gIH1cblxuICBpc0ZJRk8oKTogYm9vbGVhbiB7XG4gICAgbm90SW1wbGVtZW50ZWQoXG4gICAgICBcIkRlbm8gZG9lcyBub3QgeWV0IHN1cHBvcnQgaWRlbnRpZmljYXRpb24gb2YgRklGTyBuYW1lZCBwaXBlc1wiLFxuICAgICk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaXNGaWxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmVudHJ5LmlzRmlsZTtcbiAgfVxuXG4gIGlzU29ja2V0KCk6IGJvb2xlYW4ge1xuICAgIG5vdEltcGxlbWVudGVkKFwiRGVubyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCBpZGVudGlmaWNhdGlvbiBvZiBzb2NrZXRzXCIpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzU3ltYm9saWNMaW5rKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmVudHJ5LmlzU3ltbGluaztcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmVudHJ5Lm5hbWU7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsTUFBTSxHQUFHLGNBQWMsUUFBUSxDQUFjO01BRXhCLE1BQU07SUFDTCxLQUFvQjtnQkFBcEIsS0FBb0IsQ0FBRSxDQUFDO2FBQXZCLEtBQW9CLEdBQXBCLEtBQW9CO0lBQUcsQ0FBQztJQUU1QyxhQUFhLEdBQVksQ0FBQztRQUN4QixjQUFjLENBQUMsQ0FBMkQ7UUFDMUUsTUFBTSxDQUFDLEtBQUs7SUFDZCxDQUFDO0lBRUQsaUJBQWlCLEdBQVksQ0FBQztRQUM1QixjQUFjLENBQ1osQ0FBK0Q7UUFFakUsTUFBTSxDQUFDLEtBQUs7SUFDZCxDQUFDO0lBRUQsV0FBVyxHQUFZLENBQUM7UUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVztJQUMvQixDQUFDO0lBRUQsTUFBTSxHQUFZLENBQUM7UUFDakIsY0FBYyxDQUNaLENBQThEO1FBRWhFLE1BQU0sQ0FBQyxLQUFLO0lBQ2QsQ0FBQztJQUVELE1BQU0sR0FBWSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07SUFDMUIsQ0FBQztJQUVELFFBQVEsR0FBWSxDQUFDO1FBQ25CLGNBQWMsQ0FBQyxDQUFxRDtRQUNwRSxNQUFNLENBQUMsS0FBSztJQUNkLENBQUM7SUFFRCxjQUFjLEdBQVksQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTO0lBQzdCLENBQUM7UUFFRyxJQUFJLEdBQWtCLENBQUM7UUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSTtJQUN4QixDQUFDOztBQXpDSCxNQUFNLEdBQWUsTUFBTSJ9