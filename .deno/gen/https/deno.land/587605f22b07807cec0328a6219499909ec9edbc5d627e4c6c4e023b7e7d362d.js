import { border } from "./border.ts";
import { Cell } from "./cell.ts";
import { TableLayout } from "./layout.ts";
import { Row } from "./row.ts";
/** Table representation. */ export class Table extends Array {
    static _chars = {
        ...border
    };
    options = {
        indent: 0,
        border: false,
        maxColWidth: Infinity,
        minColWidth: 0,
        padding: 1,
        chars: {
            ...Table._chars
        }
    };
    headerRow;
    /**
   * Create a new table. If rows is a table, all rows and options of the table
   * will be copied to the new table.
   * @param rows
   */ static from(rows) {
        const table = new this(...rows);
        if (rows instanceof Table) {
            table.options = {
                ...rows.options
            };
            table.headerRow = rows.headerRow ? Row.from(rows.headerRow) : undefined;
        }
        return table;
    }
    /**
   * Create a new table from an array of json objects. An object represents a
   * row and each property a column.
   * @param rows Array of objects.
   */ static fromJson(rows) {
        return new this().fromJson(rows);
    }
    /**
   * Set global default border characters.
   * @param chars Border options.
   */ static chars(chars) {
        Object.assign(this._chars, chars);
        return this;
    }
    /**
   * Write table or rows to stdout.
   * @param rows Table or rows.
   */ static render(rows) {
        Table.from(rows).render();
    }
    /**
   * Read data from an array of json objects. An object represents a
   * row and each property a column.
   * @param rows Array of objects.
   */ fromJson(rows) {
        this.header(Object.keys(rows[0]));
        this.body(rows.map((row)=>Object.values(row)
        ));
        return this;
    }
    /**
   * Set table header.
   * @param header Header row or cells.
   */ header(header) {
        this.headerRow = header instanceof Row ? header : Row.from(header);
        return this;
    }
    /**
   * Set table body.
   * @param rows Table rows.
   */ body(rows) {
        this.length = 0;
        this.push(...rows);
        return this;
    }
    /** Clone table recursively with header and options. */ clone() {
        const table = new Table(...this.map((row)=>row instanceof Row ? row.clone() : Row.from(row).clone()
        ));
        table.options = {
            ...this.options
        };
        table.headerRow = this.headerRow?.clone();
        return table;
    }
    /** Generate table string. */ toString() {
        return new TableLayout(this, this.options).toString();
    }
    /** Write table to stdout. */ render() {
        Deno.stdout.writeSync(new TextEncoder().encode(this.toString() + "\n"));
        return this;
    }
    /**
   * Set max col with.
   * @param width     Max col width.
   * @param override  Override existing value.
   */ maxColWidth(width, override = true) {
        if (override || typeof this.options.maxColWidth === "undefined") {
            this.options.maxColWidth = width;
        }
        return this;
    }
    /**
   * Set min col width.
   * @param width     Min col width.
   * @param override  Override existing value.
   */ minColWidth(width, override = true) {
        if (override || typeof this.options.minColWidth === "undefined") {
            this.options.minColWidth = width;
        }
        return this;
    }
    /**
   * Set table indentation.
   * @param width     Indent width.
   * @param override  Override existing value.
   */ indent(width, override = true) {
        if (override || typeof this.options.indent === "undefined") {
            this.options.indent = width;
        }
        return this;
    }
    /**
   * Set cell padding.
   * @param padding   Cell padding.
   * @param override  Override existing value.
   */ padding(padding, override = true) {
        if (override || typeof this.options.padding === "undefined") {
            this.options.padding = padding;
        }
        return this;
    }
    /**
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
   * Align table content.
   * @param direction Align direction.
   * @param override  Override existing value.
   */ align(direction, override = true) {
        if (override || typeof this.options.align === "undefined") {
            this.options.align = direction;
        }
        return this;
    }
    /**
   * Set border characters.
   * @param chars Border options.
   */ chars(chars) {
        Object.assign(this.options.chars, chars);
        return this;
    }
    /** Get table header. */ getHeader() {
        return this.headerRow;
    }
    /** Get table body. */ getBody() {
        return [
            ...this
        ];
    }
    /** Get mac col widrth. */ getMaxColWidth() {
        return this.options.maxColWidth;
    }
    /** Get min col width. */ getMinColWidth() {
        return this.options.minColWidth;
    }
    /** Get table indentation. */ getIndent() {
        return this.options.indent;
    }
    /** Get cell padding. */ getPadding() {
        return this.options.padding;
    }
    /** Check if table has border. */ getBorder() {
        return this.options.border === true;
    }
    /** Check if header row has border. */ hasHeaderBorder() {
        const hasBorder = this.headerRow?.hasBorder();
        return hasBorder === true || this.getBorder() && hasBorder !== false;
    }
    /** Check if table bordy has border. */ hasBodyBorder() {
        return this.getBorder() || this.some((row)=>row instanceof Row ? row.hasBorder() : row.some((cell)=>cell instanceof Cell ? cell.getBorder : false
            )
        );
    }
    /** Check if table header or body has border. */ hasBorder() {
        return this.hasHeaderBorder() || this.hasBodyBorder();
    }
    /** Get table alignment. */ getAlign() {
        return this.options.align ?? "left";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjMvdGFibGUvdGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm9yZGVyLCBJQm9yZGVyIH0gZnJvbSBcIi4vYm9yZGVyLnRzXCI7XG5pbXBvcnQgeyBDZWxsLCBEaXJlY3Rpb24gfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBUYWJsZUxheW91dCB9IGZyb20gXCIuL2xheW91dC50c1wiO1xuaW1wb3J0IHsgSURhdGFSb3csIElSb3csIFJvdyB9IGZyb20gXCIuL3Jvdy50c1wiO1xuXG4vKiogQm9yZGVyIGNoYXJhY3RlcnMgc2V0dGluZ3MuICovXG5leHBvcnQgdHlwZSBJQm9yZGVyT3B0aW9ucyA9IFBhcnRpYWw8SUJvcmRlcj47XG5cbi8qKiBUYWJsZSBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJVGFibGVPcHRpb25zIHtcbiAgaW5kZW50PzogbnVtYmVyO1xuICBib3JkZXI/OiBib29sZWFuO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbiAgbWF4Q29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgbWluQ29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgcGFkZGluZz86IG51bWJlciB8IG51bWJlcltdO1xuICBjaGFycz86IElCb3JkZXJPcHRpb25zO1xufVxuXG4vKiogVGFibGUgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIElUYWJsZVNldHRpbmdzIGV4dGVuZHMgUmVxdWlyZWQ8T21pdDxJVGFibGVPcHRpb25zLCBcImFsaWduXCI+PiB7XG4gIGNoYXJzOiBJQm9yZGVyO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbn1cblxuLyoqIFRhYmxlIHR5cGUuICovXG5leHBvcnQgdHlwZSBJVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiA9IFRbXSB8IFRhYmxlPFQ+O1xuXG4vKiogVGFibGUgcmVwcmVzZW50YXRpb24uICovXG5leHBvcnQgY2xhc3MgVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiBleHRlbmRzIEFycmF5PFQ+IHtcbiAgcHJvdGVjdGVkIHN0YXRpYyBfY2hhcnM6IElCb3JkZXIgPSB7IC4uLmJvcmRlciB9O1xuICBwcm90ZWN0ZWQgb3B0aW9uczogSVRhYmxlU2V0dGluZ3MgPSB7XG4gICAgaW5kZW50OiAwLFxuICAgIGJvcmRlcjogZmFsc2UsXG4gICAgbWF4Q29sV2lkdGg6IEluZmluaXR5LFxuICAgIG1pbkNvbFdpZHRoOiAwLFxuICAgIHBhZGRpbmc6IDEsXG4gICAgY2hhcnM6IHsgLi4uVGFibGUuX2NoYXJzIH0sXG4gIH07XG4gIHByaXZhdGUgaGVhZGVyUm93PzogUm93O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdGFibGUuIElmIHJvd3MgaXMgYSB0YWJsZSwgYWxsIHJvd3MgYW5kIG9wdGlvbnMgb2YgdGhlIHRhYmxlXG4gICAqIHdpbGwgYmUgY29waWVkIHRvIHRoZSBuZXcgdGFibGUuXG4gICAqIEBwYXJhbSByb3dzXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb208VCBleHRlbmRzIElSb3c+KHJvd3M6IElUYWJsZTxUPik6IFRhYmxlPFQ+IHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyB0aGlzKC4uLnJvd3MpO1xuICAgIGlmIChyb3dzIGluc3RhbmNlb2YgVGFibGUpIHtcbiAgICAgIHRhYmxlLm9wdGlvbnMgPSB7IC4uLnJvd3Mub3B0aW9ucyB9O1xuICAgICAgdGFibGUuaGVhZGVyUm93ID0gcm93cy5oZWFkZXJSb3cgPyBSb3cuZnJvbShyb3dzLmhlYWRlclJvdykgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdGFibGUgZnJvbSBhbiBhcnJheSBvZiBqc29uIG9iamVjdHMuIEFuIG9iamVjdCByZXByZXNlbnRzIGFcbiAgICogcm93IGFuZCBlYWNoIHByb3BlcnR5IGEgY29sdW1uLlxuICAgKiBAcGFyYW0gcm93cyBBcnJheSBvZiBvYmplY3RzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tSnNvbihyb3dzOiBJRGF0YVJvd1tdKTogVGFibGUge1xuICAgIHJldHVybiBuZXcgdGhpcygpLmZyb21Kc29uKHJvd3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBnbG9iYWwgZGVmYXVsdCBib3JkZXIgY2hhcmFjdGVycy5cbiAgICogQHBhcmFtIGNoYXJzIEJvcmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBjaGFycyhjaGFyczogSUJvcmRlck9wdGlvbnMpOiB0eXBlb2YgVGFibGUge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5fY2hhcnMsIGNoYXJzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSB0YWJsZSBvciByb3dzIHRvIHN0ZG91dC5cbiAgICogQHBhcmFtIHJvd3MgVGFibGUgb3Igcm93cy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVuZGVyPFQgZXh0ZW5kcyBJUm93Pihyb3dzOiBJVGFibGU8VD4pOiB2b2lkIHtcbiAgICBUYWJsZS5mcm9tKHJvd3MpLnJlbmRlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgZGF0YSBmcm9tIGFuIGFycmF5IG9mIGpzb24gb2JqZWN0cy4gQW4gb2JqZWN0IHJlcHJlc2VudHMgYVxuICAgKiByb3cgYW5kIGVhY2ggcHJvcGVydHkgYSBjb2x1bW4uXG4gICAqIEBwYXJhbSByb3dzIEFycmF5IG9mIG9iamVjdHMuXG4gICAqL1xuICBwdWJsaWMgZnJvbUpzb24ocm93czogSURhdGFSb3dbXSk6IHRoaXMge1xuICAgIHRoaXMuaGVhZGVyKE9iamVjdC5rZXlzKHJvd3NbMF0pKTtcbiAgICB0aGlzLmJvZHkocm93cy5tYXAoKHJvdykgPT4gT2JqZWN0LnZhbHVlcyhyb3cpIGFzIFQpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGFibGUgaGVhZGVyLlxuICAgKiBAcGFyYW0gaGVhZGVyIEhlYWRlciByb3cgb3IgY2VsbHMuXG4gICAqL1xuICBwdWJsaWMgaGVhZGVyKGhlYWRlcjogSVJvdyk6IHRoaXMge1xuICAgIHRoaXMuaGVhZGVyUm93ID0gaGVhZGVyIGluc3RhbmNlb2YgUm93ID8gaGVhZGVyIDogUm93LmZyb20oaGVhZGVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGFibGUgYm9keS5cbiAgICogQHBhcmFtIHJvd3MgVGFibGUgcm93cy5cbiAgICovXG4gIHB1YmxpYyBib2R5KHJvd3M6IFRbXSk6IHRoaXMge1xuICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLnB1c2goLi4ucm93cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQ2xvbmUgdGFibGUgcmVjdXJzaXZlbHkgd2l0aCBoZWFkZXIgYW5kIG9wdGlvbnMuICovXG4gIHB1YmxpYyBjbG9uZSgpOiBUYWJsZSB7XG4gICAgY29uc3QgdGFibGUgPSBuZXcgVGFibGUoXG4gICAgICAuLi50aGlzLm1hcCgocm93OiBUKSA9PlxuICAgICAgICByb3cgaW5zdGFuY2VvZiBSb3cgPyByb3cuY2xvbmUoKSA6IFJvdy5mcm9tKHJvdykuY2xvbmUoKVxuICAgICAgKSxcbiAgICApO1xuICAgIHRhYmxlLm9wdGlvbnMgPSB7IC4uLnRoaXMub3B0aW9ucyB9O1xuICAgIHRhYmxlLmhlYWRlclJvdyA9IHRoaXMuaGVhZGVyUm93Py5jbG9uZSgpO1xuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZSB0YWJsZSBzdHJpbmcuICovXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVGFibGVMYXlvdXQodGhpcywgdGhpcy5vcHRpb25zKS50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqIFdyaXRlIHRhYmxlIHRvIHN0ZG91dC4gKi9cbiAgcHVibGljIHJlbmRlcigpOiB0aGlzIHtcbiAgICBEZW5vLnN0ZG91dC53cml0ZVN5bmMobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHRoaXMudG9TdHJpbmcoKSArIFwiXFxuXCIpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbWF4IGNvbCB3aXRoLlxuICAgKiBAcGFyYW0gd2lkdGggICAgIE1heCBjb2wgd2lkdGguXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgbWF4Q29sV2lkdGgod2lkdGg6IG51bWJlciB8IG51bWJlcltdLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLm1heENvbFdpZHRoID0gd2lkdGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBtaW4gY29sIHdpZHRoLlxuICAgKiBAcGFyYW0gd2lkdGggICAgIE1pbiBjb2wgd2lkdGguXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgbWluQ29sV2lkdGgod2lkdGg6IG51bWJlciB8IG51bWJlcltdLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoID0gd2lkdGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0YWJsZSBpbmRlbnRhdGlvbi5cbiAgICogQHBhcmFtIHdpZHRoICAgICBJbmRlbnQgd2lkdGguXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgaW5kZW50KHdpZHRoOiBudW1iZXIsIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmluZGVudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmluZGVudCA9IHdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY2VsbCBwYWRkaW5nLlxuICAgKiBAcGFyYW0gcGFkZGluZyAgIENlbGwgcGFkZGluZy5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBwYWRkaW5nKHBhZGRpbmc6IG51bWJlciB8IG51bWJlcltdLCBvdmVycmlkZSA9IHRydWUpOiB0aGlzIHtcbiAgICBpZiAob3ZlcnJpZGUgfHwgdHlwZW9mIHRoaXMub3B0aW9ucy5wYWRkaW5nID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMucGFkZGluZyA9IHBhZGRpbmc7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gZW5hYmxlICAgIEVuYWJsZS9kaXNhYmxlIGNlbGwgYm9yZGVyLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIGJvcmRlcihlbmFibGU6IGJvb2xlYW4sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmJvcmRlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmJvcmRlciA9IGVuYWJsZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWxpZ24gdGFibGUgY29udGVudC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBBbGlnbiBkaXJlY3Rpb24uXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgYWxpZ24oZGlyZWN0aW9uOiBEaXJlY3Rpb24sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLmFsaWduID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ24gPSBkaXJlY3Rpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBib3JkZXIgY2hhcmFjdGVycy5cbiAgICogQHBhcmFtIGNoYXJzIEJvcmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIGNoYXJzKGNoYXJzOiBJQm9yZGVyT3B0aW9ucyk6IHRoaXMge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5vcHRpb25zLmNoYXJzLCBjaGFycyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogR2V0IHRhYmxlIGhlYWRlci4gKi9cbiAgcHVibGljIGdldEhlYWRlcigpOiBSb3cgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmhlYWRlclJvdztcbiAgfVxuXG4gIC8qKiBHZXQgdGFibGUgYm9keS4gKi9cbiAgcHVibGljIGdldEJvZHkoKTogVFtdIHtcbiAgICByZXR1cm4gWy4uLnRoaXNdO1xuICB9XG5cbiAgLyoqIEdldCBtYWMgY29sIHdpZHJ0aC4gKi9cbiAgcHVibGljIGdldE1heENvbFdpZHRoKCk6IG51bWJlciB8IG51bWJlcltdIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1heENvbFdpZHRoO1xuICB9XG5cbiAgLyoqIEdldCBtaW4gY29sIHdpZHRoLiAqL1xuICBwdWJsaWMgZ2V0TWluQ29sV2lkdGgoKTogbnVtYmVyIHwgbnVtYmVyW10ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGg7XG4gIH1cblxuICAvKiogR2V0IHRhYmxlIGluZGVudGF0aW9uLiAqL1xuICBwdWJsaWMgZ2V0SW5kZW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5pbmRlbnQ7XG4gIH1cblxuICAvKiogR2V0IGNlbGwgcGFkZGluZy4gKi9cbiAgcHVibGljIGdldFBhZGRpbmcoKTogbnVtYmVyIHwgbnVtYmVyW10ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucGFkZGluZztcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiB0YWJsZSBoYXMgYm9yZGVyLiAqL1xuICBwdWJsaWMgZ2V0Qm9yZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYm9yZGVyID09PSB0cnVlO1xuICB9XG5cbiAgLyoqIENoZWNrIGlmIGhlYWRlciByb3cgaGFzIGJvcmRlci4gKi9cbiAgcHVibGljIGhhc0hlYWRlckJvcmRlcigpOiBib29sZWFuIHtcbiAgICBjb25zdCBoYXNCb3JkZXIgPSB0aGlzLmhlYWRlclJvdz8uaGFzQm9yZGVyKCk7XG4gICAgcmV0dXJuIGhhc0JvcmRlciA9PT0gdHJ1ZSB8fCAodGhpcy5nZXRCb3JkZXIoKSAmJiBoYXNCb3JkZXIgIT09IGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiB0YWJsZSBib3JkeSBoYXMgYm9yZGVyLiAqL1xuICBwdWJsaWMgaGFzQm9keUJvcmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCb3JkZXIoKSB8fFxuICAgICAgdGhpcy5zb21lKChyb3cpID0+XG4gICAgICAgIHJvdyBpbnN0YW5jZW9mIFJvd1xuICAgICAgICAgID8gcm93Lmhhc0JvcmRlcigpXG4gICAgICAgICAgOiByb3cuc29tZSgoY2VsbCkgPT4gY2VsbCBpbnN0YW5jZW9mIENlbGwgPyBjZWxsLmdldEJvcmRlciA6IGZhbHNlKVxuICAgICAgKTtcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiB0YWJsZSBoZWFkZXIgb3IgYm9keSBoYXMgYm9yZGVyLiAqL1xuICBwdWJsaWMgaGFzQm9yZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc0hlYWRlckJvcmRlcigpIHx8IHRoaXMuaGFzQm9keUJvcmRlcigpO1xuICB9XG5cbiAgLyoqIEdldCB0YWJsZSBhbGlnbm1lbnQuICovXG4gIHB1YmxpYyBnZXRBbGlnbigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWxpZ24gPz8gXCJsZWZ0XCI7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsTUFBTSxRQUFpQixDQUFhO0FBQzdDLE1BQU0sR0FBRyxJQUFJLFFBQW1CLENBQVc7QUFDM0MsTUFBTSxHQUFHLFdBQVcsUUFBUSxDQUFhO0FBQ3pDLE1BQU0sR0FBbUIsR0FBRyxRQUFRLENBQVU7QUF5QjlDLEVBQTRCLEFBQTVCLHdCQUE0QixBQUE1QixFQUE0QixDQUM1QixNQUFNLE9BQU8sS0FBSyxTQUFnQyxLQUFLO1dBQ3BDLE1BQU0sR0FBWSxDQUFDO1dBQUksTUFBTTtJQUFDLENBQUM7SUFDdEMsT0FBTyxHQUFtQixDQUFDO1FBQ25DLE1BQU0sRUFBRSxDQUFDO1FBQ1QsTUFBTSxFQUFFLEtBQUs7UUFDYixXQUFXLEVBQUUsUUFBUTtRQUNyQixXQUFXLEVBQUUsQ0FBQztRQUNkLE9BQU8sRUFBRSxDQUFDO1FBQ1YsS0FBSyxFQUFFLENBQUM7ZUFBSSxLQUFLLENBQUMsTUFBTTtRQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNPLFNBQVM7SUFFakIsRUFJRyxBQUpIOzs7O0dBSUcsQUFKSCxFQUlHLFFBQ1csSUFBSSxDQUFpQixJQUFlLEVBQVksQ0FBQztRQUM3RCxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSTtRQUM5QixFQUFFLEVBQUUsSUFBSSxZQUFZLEtBQUssRUFBRSxDQUFDO1lBQzFCLEtBQUss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