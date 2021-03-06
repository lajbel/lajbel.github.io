export function mergeParams(childParams, parentParams) {
    return {
        ...parentParams,
        ...childParams,
        env: {
            ...parentParams.env,
            ...childParams.env
        },
        allow: {
            ...normalizeFlags(parentParams.allow),
            ...normalizeFlags(childParams.allow)
        },
        v8Flags: {
            ...normalizeFlags(parentParams.v8Flags),
            ...normalizeFlags(childParams.v8Flags)
        }
    };
}
function normalizeFlags(flags) {
    if (Array.isArray(flags)) {
        return flags.reduce((acc, val)=>{
            acc[val] = true;
            return acc;
        }, {
        });
    }
    return flags;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVsb2NpcmFwdG9yQDEuNS4wL3NyYy9tZXJnZV9wYXJhbXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmxhZ3NPYmplY3QsIFNjcmlwdE9wdGlvbnMgfSBmcm9tIFwiLi9zY3JpcHRzX2NvbmZpZy50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VQYXJhbXMoXG4gIGNoaWxkUGFyYW1zOiBTY3JpcHRPcHRpb25zLFxuICBwYXJlbnRQYXJhbXM6IFNjcmlwdE9wdGlvbnMsXG4pOiBTY3JpcHRPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5wYXJlbnRQYXJhbXMsXG4gICAgLi4uY2hpbGRQYXJhbXMsXG4gICAgZW52OiB7XG4gICAgICAuLi5wYXJlbnRQYXJhbXMuZW52LFxuICAgICAgLi4uY2hpbGRQYXJhbXMuZW52LFxuICAgIH0sXG4gICAgYWxsb3c6IHtcbiAgICAgIC4uLm5vcm1hbGl6ZUZsYWdzKHBhcmVudFBhcmFtcy5hbGxvdyBhcyBzdHJpbmdbXSB8IEZsYWdzT2JqZWN0KSxcbiAgICAgIC4uLm5vcm1hbGl6ZUZsYWdzKGNoaWxkUGFyYW1zLmFsbG93IGFzIHN0cmluZ1tdIHwgRmxhZ3NPYmplY3QpLFxuICAgIH0sXG4gICAgdjhGbGFnczoge1xuICAgICAgLi4ubm9ybWFsaXplRmxhZ3MocGFyZW50UGFyYW1zLnY4RmxhZ3MpLFxuICAgICAgLi4ubm9ybWFsaXplRmxhZ3MoY2hpbGRQYXJhbXMudjhGbGFncyksXG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRmxhZ3MoZmxhZ3M6IHN0cmluZ1tdIHwgRmxhZ3NPYmplY3QgfCB1bmRlZmluZWQpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZmxhZ3MpKSB7XG4gICAgcmV0dXJuIGZsYWdzLnJlZHVjZSgoYWNjLCB2YWwpID0+IHtcbiAgICAgIGFjY1t2YWxdID0gdHJ1ZTtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30gYXMgRmxhZ3NPYmplY3QpO1xuICB9XG4gIHJldHVybiBmbGFncztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLFVBQVUsV0FBVyxDQUN6QixXQUEwQixFQUMxQixZQUEyQixFQUNaLENBQUM7SUFDaEIsTUFBTSxDQUFDLENBQUM7V0FDSCxZQUFZO1dBQ1osV0FBVztRQUNkLEdBQUcsRUFBRSxDQUFDO2VBQ0QsWUFBWSxDQUFDLEdBQUc7ZUFDaEIsV0FBVyxDQUFDLEdBQUc7UUFDcEIsQ0FBQztRQUNELEtBQUssRUFBRSxDQUFDO2VBQ0gsY0FBYyxDQUFDLFlBQVksQ0FBQyxLQUFLO2VBQ2pDLGNBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSztRQUNyQyxDQUFDO1FBQ0QsT0FBTyxFQUFFLENBQUM7ZUFDTCxjQUFjLENBQUMsWUFBWSxDQUFDLE9BQU87ZUFDbkMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxPQUFPO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztTQUVRLGNBQWMsQ0FBQyxLQUF5QyxFQUFFLENBQUM7SUFDbEUsRUFBRSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUM7UUFDekIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBSyxDQUFDO1lBQ2pDLEdBQUcsQ0FBQyxHQUFHLElBQUksSUFBSTtZQUNmLE1BQU0sQ0FBQyxHQUFHO1FBQ1osQ0FBQyxFQUFFLENBQUM7UUFBQSxDQUFDO0lBQ1AsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLO0FBQ2QsQ0FBQyJ9