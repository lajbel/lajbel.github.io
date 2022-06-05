/**
 * A plugin to register the filters "url" and "htmlUrl"
 * for normalizing URLs in the templates
 */ export default function() {
    return (site)=>{
        site.filter("url", url);
        site.filter("htmlUrl", htmlUrl);
        function url(path = "/", absolute = false) {
            return typeof path === "string" ? site.url(path, absolute) : path;
        }
        function htmlUrl(html = "", absolute = false) {
            return html.replaceAll(/\s(href|src)="([^"]+)"/g, (_match, attr, value)=>` ${attr}="${url(value, absolute)}"`
            );
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2MS4zLjAvcGx1Z2lucy91cmwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVscGVyLCBTaXRlIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcblxuLyoqXG4gKiBBIHBsdWdpbiB0byByZWdpc3RlciB0aGUgZmlsdGVycyBcInVybFwiIGFuZCBcImh0bWxVcmxcIlxuICogZm9yIG5vcm1hbGl6aW5nIFVSTHMgaW4gdGhlIHRlbXBsYXRlc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoc2l0ZTogU2l0ZSkgPT4ge1xuICAgIHNpdGUuZmlsdGVyKFwidXJsXCIsIHVybCBhcyBIZWxwZXIpO1xuICAgIHNpdGUuZmlsdGVyKFwiaHRtbFVybFwiLCBodG1sVXJsIGFzIEhlbHBlcik7XG5cbiAgICBmdW5jdGlvbiB1cmwocGF0aCA9IFwiL1wiLCBhYnNvbHV0ZSA9IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIgPyBzaXRlLnVybChwYXRoLCBhYnNvbHV0ZSkgOiBwYXRoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGh0bWxVcmwoaHRtbCA9IFwiXCIsIGFic29sdXRlID0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBodG1sLnJlcGxhY2VBbGwoXG4gICAgICAgIC9cXHMoaHJlZnxzcmMpPVwiKFteXCJdKylcIi9nLFxuICAgICAgICAoX21hdGNoLCBhdHRyLCB2YWx1ZSkgPT4gYCAke2F0dHJ9PVwiJHt1cmwodmFsdWUsIGFic29sdXRlKX1cImAsXG4gICAgICApO1xuICAgIH1cbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxDQUNILE1BQU0sU0FBUyxRQUFRLEdBQUksQ0FBQztJQUMxQixNQUFNLEVBQUUsSUFBVSxHQUFLLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFLLE1BQUUsR0FBRztRQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLENBQVMsVUFBRSxPQUFPO2lCQUVyQixHQUFHLENBQUMsSUFBSSxHQUFHLENBQUcsSUFBRSxRQUFRLEdBQUcsS0FBSyxFQUFFLENBQUM7WUFDMUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBUSxVQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsSUFBSSxJQUFJO1FBQ25FLENBQUM7aUJBRVEsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFFLEdBQUUsUUFBUSxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSw2QkFFbkIsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLElBQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQzs7UUFFaEUsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDIn0=