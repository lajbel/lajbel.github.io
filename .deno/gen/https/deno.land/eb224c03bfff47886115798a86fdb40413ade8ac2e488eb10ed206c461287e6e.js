/** Cell representation. */ export class Cell {
    value;
    options = {
    };
    /** Get cell length. */ get length() {
        return this.toString().length;
    }
    /**
   * Create a new cell. If value is a cell, the value and all options of the cell
   * will be copied to the new cell.
   * @param value Cell or cell value.
   */ static from(value) {
        const cell = new this(value);
        if (value instanceof Cell) {
            cell.options = {
                ...value.options
            };
        }
        return cell;
    }
    /**
   * Cell constructor.
   * @param value Cell value.
   */ constructor(value){
        this.value = value;
    }
    /** Get cell value. */ toString() {
        return this.value.toString();
    }
    /**
   * Set cell value.
   * @param value Cell or cell value.
   */ setValue(value) {
        this.value = value;
        return this;
    }
    /**
   * Clone cell with all options.
   * @param value Cell or cell value.
   */ clone(value) {
        const cell = new Cell(value ?? this);
        cell.options = {
            ...this.options
        };
        return cell;
    }
    /**
   * Setter:
   */ /**
   * Enable/disable cell border.
   * @param enable    Enable/disable cell border.
   * @param override  Override existing value.
   */ border(enable, override = true) {
        if (override || typeof this.options.border === "undefined") {
            this.options.border = enable;
        }
        return this;
    }
    /**
   * Set col span.
   * @param span      Number of cols to span.
   * @param override  Override existing value.
   */ colSpan(span, override = true) {
        if (override || typeof this.options.colSpan === "undefined") {
            this.options.colSpan = span;
        }
        return this;
    }
    /**
   * Set row span.
   * @param span      Number of rows to span.
   * @param override  Override existing value.
   */ rowSpan(span, override = true) {
        if (override || typeof this.options.rowSpan === "undefined") {
            this.options.rowSpan = span;
        }
        return this;
    }
    /**
   * Align cell content.
   * @param direction Align direction.
   * @param override  Override existing value.
   */ align(direction, override = true) {
        if (override || typeof this.options.align === "undefined") {
            this.options.align = direction;
        }
        return this;
    }
    /**
   * Getter:
   */ /** Check if cell has border. */ getBorder() {
        return this.options.border === true;
    }
    /** Get col span. */ getColSpan() {
        return typeof this.options.colSpan === "number" && this.options.colSpan > 0 ? this.options.colSpan : 1;
    }
    /** Get row span. */ getRowSpan() {
        return typeof this.options.rowSpan === "number" && this.options.rowSpan > 0 ? this.options.rowSpan : 1;
    }
    /** Get row span. */ getAlign() {
        return this.options.align ?? "left";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvdGFibGUvY2VsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQ2VsbCB0eXBlICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuZXhwb3J0IHR5cGUgSUNlbGwgPSBudW1iZXIgfCBzdHJpbmcgfCBTdHJpbmcgfCBDZWxsO1xuXG5leHBvcnQgdHlwZSBEaXJlY3Rpb24gPSBcImxlZnRcIiB8IFwicmlnaHRcIiB8IFwiY2VudGVyXCI7XG5cbi8qKiBDZWxsIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIElDZWxsT3B0aW9ucyB7XG4gIGJvcmRlcj86IGJvb2xlYW47XG4gIGNvbFNwYW4/OiBudW1iZXI7XG4gIHJvd1NwYW4/OiBudW1iZXI7XG4gIGFsaWduPzogRGlyZWN0aW9uO1xufVxuXG4vKiogQ2VsbCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBDZWxsIHtcbiAgcHJvdGVjdGVkIG9wdGlvbnM6IElDZWxsT3B0aW9ucyA9IHt9O1xuXG4gIC8qKiBHZXQgY2VsbCBsZW5ndGguICovXG4gIHB1YmxpYyBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKS5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGNlbGwuIElmIHZhbHVlIGlzIGEgY2VsbCwgdGhlIHZhbHVlIGFuZCBhbGwgb3B0aW9ucyBvZiB0aGUgY2VsbFxuICAgKiB3aWxsIGJlIGNvcGllZCB0byB0aGUgbmV3IGNlbGwuXG4gICAqIEBwYXJhbSB2YWx1ZSBDZWxsIG9yIGNlbGwgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb20odmFsdWU6IElDZWxsKTogQ2VsbCB7XG4gICAgY29uc3QgY2VsbCA9IG5ldyB0aGlzKHZhbHVlKTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBDZWxsKSB7XG4gICAgICBjZWxsLm9wdGlvbnMgPSB7IC4uLnZhbHVlLm9wdGlvbnMgfTtcbiAgICB9XG4gICAgcmV0dXJuIGNlbGw7XG4gIH1cblxuICAvKipcbiAgICogQ2VsbCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHZhbHVlIENlbGwgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSB2YWx1ZTogSUNlbGwpIHt9XG5cbiAgLyoqIEdldCBjZWxsIHZhbHVlLiAqL1xuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjZWxsIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgQ2VsbCBvciBjZWxsIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHNldFZhbHVlKHZhbHVlOiBJQ2VsbCk6IHRoaXMge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9uZSBjZWxsIHdpdGggYWxsIG9wdGlvbnMuXG4gICAqIEBwYXJhbSB2YWx1ZSBDZWxsIG9yIGNlbGwgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgY2xvbmUodmFsdWU/OiBJQ2VsbCk6IENlbGwge1xuICAgIGNvbnN0IGNlbGwgPSBuZXcgQ2VsbCh2YWx1ZSA/PyB0aGlzKTtcbiAgICBjZWxsLm9wdGlvbnMgPSB7IC4uLnRoaXMub3B0aW9ucyB9O1xuICAgIHJldHVybiBjZWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHRlcjpcbiAgICovXG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gZW5hYmxlICAgIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGJvcmRlcihlbmFibGU6IGJvb2xlYW4sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmJvcmRlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmJvcmRlciA9IGVuYWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbCBzcGFuLlxuICAgKiBAcGFyYW0gc3BhbiAgICAgIE51bWJlciBvZiBjb2xzIHRvIHNwYW4uXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgY29sU3BhbihzcGFuOiBudW1iZXIsIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmNvbFNwYW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5jb2xTcGFuID0gc3BhbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHJvdyBzcGFuLlxuICAgKiBAcGFyYW0gc3BhbiAgICAgIE51bWJlciBvZiByb3dzIHRvIHNwYW4uXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgcm93U3BhbihzcGFuOiBudW1iZXIsIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLnJvd1NwYW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5yb3dTcGFuID0gc3BhbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWxpZ24gY2VsbCBjb250ZW50LlxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIEFsaWduIGRpcmVjdGlvbi5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBhbGlnbihkaXJlY3Rpb246IERpcmVjdGlvbiwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMuYWxpZ24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbiA9IGRpcmVjdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0dGVyOlxuICAgKi9cblxuICAvKiogQ2hlY2sgaWYgY2VsbCBoYXMgYm9yZGVyLiAqL1xuICBwdWJsaWMgZ2V0Qm9yZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYm9yZGVyID09PSB0cnVlO1xuICB9XG5cbiAgLyoqIEdldCBjb2wgc3Bhbi4gKi9cbiAgcHVibGljIGdldENvbFNwYW4oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMub3B0aW9ucy5jb2xTcGFuID09PSBcIm51bWJlclwiICYmIHRoaXMub3B0aW9ucy5jb2xTcGFuID4gMFxuICAgICAgPyB0aGlzLm9wdGlvbnMuY29sU3BhblxuICAgICAgOiAxO1xuICB9XG5cbiAgLyoqIEdldCByb3cgc3Bhbi4gKi9cbiAgcHVibGljIGdldFJvd1NwYW4oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMub3B0aW9ucy5yb3dTcGFuID09PSBcIm51bWJlclwiICYmIHRoaXMub3B0aW9ucy5yb3dTcGFuID4gMFxuICAgICAgPyB0aGlzLm9wdGlvbnMucm93U3BhblxuICAgICAgOiAxO1xuICB9XG5cbiAgLyoqIEdldCByb3cgc3Bhbi4gKi9cbiAgcHVibGljIGdldEFsaWduKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbGlnbiA/PyBcImxlZnRcIjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJB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