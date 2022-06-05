import { Type } from "../type.ts";
import { InvalidTypeError } from "../../flags/_errors.ts";
export class EnumType extends Type {
    allowedValues;
    constructor(values) {
        super();
        this.allowedValues = values;
    }
    parse(type) {
        for (const value of this.allowedValues) {
            if (value.toString() === type.value) {
                return value;
            }
        }
        throw new InvalidTypeError(type, this.allowedValues.slice());
    }
    values() {
        return this.allowedValues.slice();
    }
    complete() {
        return this.values();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVsQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUcxRCxNQUFNLE9BQU8sUUFBb0MsU0FBUSxJQUFPO0lBQzdDLGFBQWEsQ0FBbUI7SUFFakQsWUFBWSxNQUF3QjtRQUNsQyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzlCLENBQUM7SUFFTSxLQUFLLENBQUMsSUFBZTtRQUMxQixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdEMsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDbkMsT0FBTyxLQUFLLENBQUM7YUFDZDtTQUNGO1FBRUQsTUFBTSxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVNLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN2QixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcbmltcG9ydCB0eXBlIHsgSVR5cGVJbmZvIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBJbnZhbGlkVHlwZUVycm9yIH0gZnJvbSBcIi4uLy4uL2ZsYWdzL19lcnJvcnMudHNcIjtcblxuLyoqIEVudW0gdHlwZS4gQWxsb3dzIG9ubHkgcHJvdmlkZWQgdmFsdWVzLiAqL1xuZXhwb3J0IGNsYXNzIEVudW1UeXBlPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXI+IGV4dGVuZHMgVHlwZTxUPiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWxsb3dlZFZhbHVlczogUmVhZG9ubHlBcnJheTxUPjtcblxuICBjb25zdHJ1Y3Rvcih2YWx1ZXM6IFJlYWRvbmx5QXJyYXk8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYWxsb3dlZFZhbHVlcyA9IHZhbHVlcztcbiAgfVxuXG4gIHB1YmxpYyBwYXJzZSh0eXBlOiBJVHlwZUluZm8pOiBUIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHRoaXMuYWxsb3dlZFZhbHVlcykge1xuICAgICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkgPT09IHR5cGUudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBJbnZhbGlkVHlwZUVycm9yKHR5cGUsIHRoaXMuYWxsb3dlZFZhbHVlcy5zbGljZSgpKTtcbiAgfVxuXG4gIHB1YmxpYyB2YWx1ZXMoKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5hbGxvd2VkVmFsdWVzLnNsaWNlKCk7XG4gIH1cblxuICBwdWJsaWMgY29tcGxldGUoKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMoKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBUeXBlVmFsdWU8VCBleHRlbmRzIFR5cGU8dW5rbm93bj4+ID0gVCBleHRlbmRzIFR5cGU8aW5mZXIgVj4gPyBWXG4gIDogbmV2ZXI7XG4iXX0=