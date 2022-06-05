const noop = ()=>{
};
class AsyncIterableClone {
    currentPromise;
    resolveCurrent = noop;
    consumed;
    consume = noop;
    constructor(){
        this.currentPromise = new Promise((resolve)=>{
            this.resolveCurrent = resolve;
        });
        this.consumed = new Promise((resolve)=>{
            this.consume = resolve;
        });
    }
    reset() {
        this.currentPromise = new Promise((resolve)=>{
            this.resolveCurrent = resolve;
        });
        this.consumed = new Promise((resolve)=>{
            this.consume = resolve;
        });
    }
    async next() {
        const res = await this.currentPromise;
        this.consume();
        this.reset();
        return res;
    }
    async push(res) {
        this.resolveCurrent(res);
        // Wait until current promise is consumed and next item is requested.
        await this.consumed;
    }
    [Symbol.asyncIterator]() {
        return this;
    }
}
/**
 * Branches the given async iterable into the n branches.
 *
 * Example:
 *
 * ```ts
 *     import { tee } from "./tee.ts";
 *
 *     const gen = async function* gen() {
 *       yield 1;
 *       yield 2;
 *       yield 3;
 *     }
 *
 *     const [branch1, branch2] = tee(gen());
 *
 *     (async () => {
 *       for await (const n of branch1) {
 *         console.log(n); // => 1, 2, 3
 *       }
 *     })();
 *
 *     (async () => {
 *       for await (const n of branch2) {
 *         console.log(n); // => 1, 2, 3
 *       }
 *     })();
 * ```
 */ export function tee(src, n = 2) {
    const clones = Array.from({
        length: n
    }).map(()=>new AsyncIterableClone()
    );
    (async ()=>{
        const iter = src[Symbol.asyncIterator]();
        await Promise.resolve();
        while(true){
            const res = iter.next();
            await Promise.all(clones.map((c)=>c.push(res)
            ));
            if ((await res).done) {
                break;
            }
        }
    })().catch((e)=>{
        console.error(e);
    });
    return clones;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL2FzeW5jL3RlZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vLyBVdGlsaXR5IGZvciByZXByZXNlbnRpbmcgbi10dXBsZVxudHlwZSBUdXBsZTxULCBOIGV4dGVuZHMgbnVtYmVyPiA9IE4gZXh0ZW5kcyBOXG4gID8gbnVtYmVyIGV4dGVuZHMgTiA/IFRbXSA6IFR1cGxlT2Y8VCwgTiwgW10+XG4gIDogbmV2ZXI7XG50eXBlIFR1cGxlT2Y8VCwgTiBleHRlbmRzIG51bWJlciwgUiBleHRlbmRzIHVua25vd25bXT4gPSBSW1wibGVuZ3RoXCJdIGV4dGVuZHMgTlxuICA/IFJcbiAgOiBUdXBsZU9mPFQsIE4sIFtULCAuLi5SXT47XG5cbmNvbnN0IG5vb3AgPSAoKSA9PiB7fTtcblxuY2xhc3MgQXN5bmNJdGVyYWJsZUNsb25lPFQ+IGltcGxlbWVudHMgQXN5bmNJdGVyYWJsZTxUPiB7XG4gIGN1cnJlbnRQcm9taXNlOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PFQ+PjtcbiAgcmVzb2x2ZUN1cnJlbnQ6ICh4OiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PFQ+PikgPT4gdm9pZCA9IG5vb3A7XG4gIGNvbnN1bWVkOiBQcm9taXNlPHZvaWQ+O1xuICBjb25zdW1lOiAoKSA9PiB2b2lkID0gbm9vcDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmVDdXJyZW50ID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgICB0aGlzLmNvbnN1bWVkID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMuY29uc3VtZSA9IHJlc29sdmU7XG4gICAgfSk7XG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLmN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+KChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmVDdXJyZW50ID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgICB0aGlzLmNvbnN1bWVkID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMuY29uc3VtZSA9IHJlc29sdmU7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBuZXh0KCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmN1cnJlbnRQcm9taXNlO1xuICAgIHRoaXMuY29uc3VtZSgpO1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgYXN5bmMgcHVzaChyZXM6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5yZXNvbHZlQ3VycmVudChyZXMpO1xuICAgIC8vIFdhaXQgdW50aWwgY3VycmVudCBwcm9taXNlIGlzIGNvbnN1bWVkIGFuZCBuZXh0IGl0ZW0gaXMgcmVxdWVzdGVkLlxuICAgIGF3YWl0IHRoaXMuY29uc3VtZWQ7XG4gIH1cblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IEFzeW5jSXRlcmF0b3I8VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKlxuICogQnJhbmNoZXMgdGhlIGdpdmVuIGFzeW5jIGl0ZXJhYmxlIGludG8gdGhlIG4gYnJhbmNoZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogICAgIGltcG9ydCB7IHRlZSB9IGZyb20gXCIuL3RlZS50c1wiO1xuICpcbiAqICAgICBjb25zdCBnZW4gPSBhc3luYyBmdW5jdGlvbiogZ2VuKCkge1xuICogICAgICAgeWllbGQgMTtcbiAqICAgICAgIHlpZWxkIDI7XG4gKiAgICAgICB5aWVsZCAzO1xuICogICAgIH1cbiAqXG4gKiAgICAgY29uc3QgW2JyYW5jaDEsIGJyYW5jaDJdID0gdGVlKGdlbigpKTtcbiAqXG4gKiAgICAgKGFzeW5jICgpID0+IHtcbiAqICAgICAgIGZvciBhd2FpdCAoY29uc3QgbiBvZiBicmFuY2gxKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKG4pOyAvLyA9PiAxLCAyLCAzXG4gKiAgICAgICB9XG4gKiAgICAgfSkoKTtcbiAqXG4gKiAgICAgKGFzeW5jICgpID0+IHtcbiAqICAgICAgIGZvciBhd2FpdCAoY29uc3QgbiBvZiBicmFuY2gyKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKG4pOyAvLyA9PiAxLCAyLCAzXG4gKiAgICAgICB9XG4gKiAgICAgfSkoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVlPFQsIE4gZXh0ZW5kcyBudW1iZXIgPSAyPihcbiAgc3JjOiBBc3luY0l0ZXJhYmxlPFQ+LFxuICBuOiBOID0gMiBhcyBOLFxuKTogVHVwbGU8QXN5bmNJdGVyYWJsZTxUPiwgTj4ge1xuICBjb25zdCBjbG9uZXM6IFR1cGxlPEFzeW5jSXRlcmFibGVDbG9uZTxUPiwgTj4gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBuIH0pLm1hcChcbiAgICAoKSA9PiBuZXcgQXN5bmNJdGVyYWJsZUNsb25lKCksXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgKSBhcyBhbnk7XG4gIChhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgaXRlciA9IHNyY1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTtcbiAgICBhd2FpdCBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgcmVzID0gaXRlci5uZXh0KCk7XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChjbG9uZXMubWFwKChjKSA9PiBjLnB1c2gocmVzKSkpO1xuICAgICAgaWYgKChhd2FpdCByZXMpLmRvbmUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KSgpLmNhdGNoKChlKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfSk7XG4gIHJldHVybiBjbG9uZXM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsS0FBSyxDQUFDLElBQUksT0FBUyxDQUFDO0FBQUEsQ0FBQztNQUVmLGtCQUFrQjtJQUN0QixjQUFjO0lBQ2QsY0FBYyxHQUE0QyxJQUFJO0lBQzlELFFBQVE7SUFDUixPQUFPLEdBQWUsSUFBSTtpQkFFWixDQUFDO1FBQ2IsSUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFxQixPQUFPLEdBQUssQ0FBQztZQUNqRSxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU87UUFDL0IsQ0FBQztRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBUSxPQUFPLEdBQUssQ0FBQztZQUM5QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87UUFDeEIsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLEdBQUcsQ0FBQztRQUNQLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBcUIsT0FBTyxHQUFLLENBQUM7WUFDakUsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPO1FBQy9CLENBQUM7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQVEsT0FBTyxHQUFLLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPO1FBQ3hCLENBQUM7SUFDSCxDQUFDO1VBRUssSUFBSSxHQUErQixDQUFDO1FBQ3hDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjO1FBQ3JDLElBQUksQ0FBQyxPQUFPO1FBQ1osSUFBSSxDQUFDLEtBQUs7UUFDVixNQUFNLENBQUMsR0FBRztJQUNaLENBQUM7VUFFSyxJQUFJLENBQUMsR0FBK0IsRUFBaUIsQ0FBQztRQUMxRCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUc7UUFDdkIsRUFBcUUsQUFBckUsbUVBQXFFO1FBQ3JFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTtJQUNyQixDQUFDO0tBRUEsTUFBTSxDQUFDLGFBQWEsSUFBc0IsQ0FBQztRQUMxQyxNQUFNLENBQUMsSUFBSTtJQUNiLENBQUM7O0FBR0gsRUE0QkcsQUE1Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkcsQUE1QkgsRUE0QkcsQ0FDSCxNQUFNLFVBQVUsR0FBRyxDQUNqQixHQUFxQixFQUNyQixDQUFJLEdBQUcsQ0FBQyxFQUNvQixDQUFDO0lBQzdCLEtBQUssQ0FBQyxNQUFNLEdBQW9DLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUFDLE1BQU0sRUFBRSxDQUFDO0lBQUMsQ0FBQyxFQUFFLEdBQUcsS0FDckUsR0FBRyxDQUFDLGtCQUFrQjs7ZUFHakIsQ0FBQztRQUNaLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhO1FBQ3JDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTztjQUNkLElBQUksQ0FBRSxDQUFDO1lBQ1osS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSTtZQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUc7O1lBQzlDLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNyQixLQUFLO1lBQ1AsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsR0FBSyxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU07QUFDZixDQUFDIn0=