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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvYXN5bmMvdGVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8vIFV0aWxpdHkgZm9yIHJlcHJlc2VudGluZyBuLXR1cGxlXG50eXBlIFR1cGxlPFQsIE4gZXh0ZW5kcyBudW1iZXI+ID0gTiBleHRlbmRzIE5cbiAgPyBudW1iZXIgZXh0ZW5kcyBOID8gVFtdIDogVHVwbGVPZjxULCBOLCBbXT5cbiAgOiBuZXZlcjtcbnR5cGUgVHVwbGVPZjxULCBOIGV4dGVuZHMgbnVtYmVyLCBSIGV4dGVuZHMgdW5rbm93bltdPiA9IFJbXCJsZW5ndGhcIl0gZXh0ZW5kcyBOXG4gID8gUlxuICA6IFR1cGxlT2Y8VCwgTiwgW1QsIC4uLlJdPjtcblxuY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuXG5jbGFzcyBBc3luY0l0ZXJhYmxlQ2xvbmU8VD4gaW1wbGVtZW50cyBBc3luY0l0ZXJhYmxlPFQ+IHtcbiAgY3VycmVudFByb21pc2U6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+O1xuICByZXNvbHZlQ3VycmVudDogKHg6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8VD4+KSA9PiB2b2lkID0gbm9vcDtcbiAgY29uc3VtZWQ6IFByb21pc2U8dm9pZD47XG4gIGNvbnN1bWU6ICgpID0+IHZvaWQgPSBub29wO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxUPj4oKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZUN1cnJlbnQgPSByZXNvbHZlO1xuICAgIH0pO1xuICAgIHRoaXMuY29uc3VtZWQgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5jb25zdW1lID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxUPj4oKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZUN1cnJlbnQgPSByZXNvbHZlO1xuICAgIH0pO1xuICAgIHRoaXMuY29uc3VtZWQgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5jb25zdW1lID0gcmVzb2x2ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG5leHQoKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxUPj4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuY3VycmVudFByb21pc2U7XG4gICAgdGhpcy5jb25zdW1lKCk7XG4gICAgdGhpcy5yZXNldCgpO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBhc3luYyBwdXNoKHJlczogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxUPj4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnJlc29sdmVDdXJyZW50KHJlcyk7XG4gICAgLy8gV2FpdCB1bnRpbCBjdXJyZW50IHByb21pc2UgaXMgY29uc3VtZWQgYW5kIG5leHQgaXRlbSBpcyByZXF1ZXN0ZWQuXG4gICAgYXdhaXQgdGhpcy5jb25zdW1lZDtcbiAgfVxuXG4gIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogQXN5bmNJdGVyYXRvcjxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqXG4gKiBCcmFuY2hlcyB0aGUgZ2l2ZW4gYXN5bmMgaXRlcmFibGUgaW50byB0aGUgbiBicmFuY2hlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICBjb25zdCBnZW4gPSBhc3luYyBmdW5jdGlvbiogZ2VuKCkge1xuICogICAgICAgeWllbGQgMTtcbiAqICAgICAgIHlpZWxkIDI7XG4gKiAgICAgICB5aWVsZCAzO1xuICogICAgIH1cbiAqXG4gKiAgICAgY29uc3QgW2JyYW5jaDEsIGJyYW5jaDJdID0gdGVlKGdlbigpKTtcbiAqXG4gKiAgICAgKGFzeW5jICgpID0+IHtcbiAqICAgICAgIGZvciBhd2FpdCAoY29uc3QgbiBvZiBicmFuY2gxKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKG4pOyAvLyA9PiAxLCAyLCAzXG4gKiAgICAgICB9XG4gKiAgICAgfSkoKTtcbiAqXG4gKiAgICAgKGFzeW5jICgpID0+IHtcbiAqICAgICAgIGZvciBhd2FpdCAoY29uc3QgbiBvZiBicmFuY2gyKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKG4pOyAvLyA9PiAxLCAyLCAzXG4gKiAgICAgICB9XG4gKiAgICAgfSkoKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlZTxULCBOIGV4dGVuZHMgbnVtYmVyID0gMj4oXG4gIHNyYzogQXN5bmNJdGVyYWJsZTxUPixcbiAgbjogTiA9IDIgYXMgTixcbik6IFR1cGxlPEFzeW5jSXRlcmFibGU8VD4sIE4+IHtcbiAgY29uc3QgY2xvbmVzOiBUdXBsZTxBc3luY0l0ZXJhYmxlQ2xvbmU8VD4sIE4+ID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogbiB9KS5tYXAoXG4gICAgKCkgPT4gbmV3IEFzeW5jSXRlcmFibGVDbG9uZSgpLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICkgYXMgYW55O1xuICAoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGl0ZXIgPSBzcmNbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGl0ZXIubmV4dCgpO1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY2xvbmVzLm1hcCgoYykgPT4gYy5wdXNoKHJlcykpKTtcbiAgICAgIGlmICgoYXdhaXQgcmVzKS5kb25lKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSkoKS5jYXRjaCgoZSkgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIH0pO1xuICByZXR1cm4gY2xvbmVzO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVBLEtBQUssQ0FBQyxJQUFJLE9BQVMsQ0FBQztBQUFBLENBQUM7TUFFZixrQkFBa0I7SUFDdEIsY0FBYztJQUNkLGNBQWMsR0FBNEMsSUFBSTtJQUM5RCxRQUFRO0lBQ1IsT0FBTyxHQUFlLElBQUk7aUJBRVosQ0FBQztRQUNiLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBcUIsT0FBTyxHQUFLLENBQUM7WUFDakUsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPO1FBQy9CLENBQUM7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQVEsT0FBTyxHQUFLLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPO1FBQ3hCLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxHQUFHLENBQUM7UUFDUCxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQXFCLE9BQU8sR0FBSyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTztRQUMvQixDQUFDO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFRLE9BQU8sR0FBSyxDQUFDO1lBQzlDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTztRQUN4QixDQUFDO0lBQ0gsQ0FBQztVQUVLLElBQUksR0FBK0IsQ0FBQztRQUN4QyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYztRQUNyQyxJQUFJLENBQUMsT0FBTztRQUNaLElBQUksQ0FBQyxLQUFLO1FBQ1YsTUFBTSxDQUFDLEdBQUc7SUFDWixDQUFDO1VBRUssSUFBSSxDQUFDLEdBQStCLEVBQWlCLENBQUM7UUFDMUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1FBQ3ZCLEVBQXFFLEFBQXJFLG1FQUFxRTtRQUNyRSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVE7SUFDckIsQ0FBQztLQUVBLE1BQU0sQ0FBQyxhQUFhLElBQXNCLENBQUM7UUFDMUMsTUFBTSxDQUFDLElBQUk7SUFDYixDQUFDOztBQUdILEVBd0JHLEFBeEJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkcsQUF4QkgsRUF3QkcsQ0FDSCxNQUFNLFVBQVUsR0FBRyxDQUNqQixHQUFxQixFQUNyQixDQUFJLEdBQUcsQ0FBQyxFQUNvQixDQUFDO0lBQzdCLEtBQUssQ0FBQyxNQUFNLEdBQW9DLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUFDLE1BQU0sRUFBRSxDQUFDO0lBQUMsQ0FBQyxFQUFFLEdBQUcsS0FDckUsR0FBRyxDQUFDLGtCQUFrQjs7ZUFHakIsQ0FBQztRQUNaLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhO1FBQ3JDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTztjQUNkLElBQUksQ0FBRSxDQUFDO1lBQ1osS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSTtZQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUc7O1lBQzlDLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNyQixLQUFLO1lBQ1AsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsR0FBSyxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU07QUFDZixDQUFDIn0=