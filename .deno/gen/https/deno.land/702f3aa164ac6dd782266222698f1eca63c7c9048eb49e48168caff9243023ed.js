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
        console.log(this.toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvdGFibGUvdGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm9yZGVyLCBJQm9yZGVyIH0gZnJvbSBcIi4vYm9yZGVyLnRzXCI7XG5pbXBvcnQgeyBDZWxsLCBEaXJlY3Rpb24gfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBUYWJsZUxheW91dCB9IGZyb20gXCIuL2xheW91dC50c1wiO1xuaW1wb3J0IHsgSURhdGFSb3csIElSb3csIFJvdyB9IGZyb20gXCIuL3Jvdy50c1wiO1xuXG4vKiogQm9yZGVyIGNoYXJhY3RlcnMgc2V0dGluZ3MuICovXG5leHBvcnQgdHlwZSBJQm9yZGVyT3B0aW9ucyA9IFBhcnRpYWw8SUJvcmRlcj47XG5cbi8qKiBUYWJsZSBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJVGFibGVPcHRpb25zIHtcbiAgaW5kZW50PzogbnVtYmVyO1xuICBib3JkZXI/OiBib29sZWFuO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbiAgbWF4Q29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgbWluQ29sV2lkdGg/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgcGFkZGluZz86IG51bWJlciB8IG51bWJlcltdO1xuICBjaGFycz86IElCb3JkZXJPcHRpb25zO1xufVxuXG4vKiogVGFibGUgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIElUYWJsZVNldHRpbmdzIGV4dGVuZHMgUmVxdWlyZWQ8T21pdDxJVGFibGVPcHRpb25zLCBcImFsaWduXCI+PiB7XG4gIGNoYXJzOiBJQm9yZGVyO1xuICBhbGlnbj86IERpcmVjdGlvbjtcbn1cblxuLyoqIFRhYmxlIHR5cGUuICovXG5leHBvcnQgdHlwZSBJVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiA9IFRbXSB8IFRhYmxlPFQ+O1xuXG4vKiogVGFibGUgcmVwcmVzZW50YXRpb24uICovXG5leHBvcnQgY2xhc3MgVGFibGU8VCBleHRlbmRzIElSb3cgPSBJUm93PiBleHRlbmRzIEFycmF5PFQ+IHtcbiAgcHJvdGVjdGVkIHN0YXRpYyBfY2hhcnM6IElCb3JkZXIgPSB7IC4uLmJvcmRlciB9O1xuICBwcm90ZWN0ZWQgb3B0aW9uczogSVRhYmxlU2V0dGluZ3MgPSB7XG4gICAgaW5kZW50OiAwLFxuICAgIGJvcmRlcjogZmFsc2UsXG4gICAgbWF4Q29sV2lkdGg6IEluZmluaXR5LFxuICAgIG1pbkNvbFdpZHRoOiAwLFxuICAgIHBhZGRpbmc6IDEsXG4gICAgY2hhcnM6IHsgLi4uVGFibGUuX2NoYXJzIH0sXG4gIH07XG4gIHByaXZhdGUgaGVhZGVyUm93PzogUm93O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdGFibGUuIElmIHJvd3MgaXMgYSB0YWJsZSwgYWxsIHJvd3MgYW5kIG9wdGlvbnMgb2YgdGhlIHRhYmxlXG4gICAqIHdpbGwgYmUgY29waWVkIHRvIHRoZSBuZXcgdGFibGUuXG4gICAqIEBwYXJhbSByb3dzXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb208VCBleHRlbmRzIElSb3c+KHJvd3M6IElUYWJsZTxUPik6IFRhYmxlPFQ+IHtcbiAgICBjb25zdCB0YWJsZSA9IG5ldyB0aGlzKC4uLnJvd3MpO1xuICAgIGlmIChyb3dzIGluc3RhbmNlb2YgVGFibGUpIHtcbiAgICAgIHRhYmxlLm9wdGlvbnMgPSB7IC4uLnJvd3Mub3B0aW9ucyB9O1xuICAgICAgdGFibGUuaGVhZGVyUm93ID0gcm93cy5oZWFkZXJSb3cgPyBSb3cuZnJvbShyb3dzLmhlYWRlclJvdykgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdGFibGUgZnJvbSBhbiBhcnJheSBvZiBqc29uIG9iamVjdHMuIEFuIG9iamVjdCByZXByZXNlbnRzIGFcbiAgICogcm93IGFuZCBlYWNoIHByb3BlcnR5IGEgY29sdW1uLlxuICAgKiBAcGFyYW0gcm93cyBBcnJheSBvZiBvYmplY3RzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tSnNvbihyb3dzOiBJRGF0YVJvd1tdKTogVGFibGUge1xuICAgIHJldHVybiBuZXcgdGhpcygpLmZyb21Kc29uKHJvd3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBnbG9iYWwgZGVmYXVsdCBib3JkZXIgY2hhcmFjdGVycy5cbiAgICogQHBhcmFtIGNoYXJzIEJvcmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBjaGFycyhjaGFyczogSUJvcmRlck9wdGlvbnMpOiB0eXBlb2YgVGFibGUge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5fY2hhcnMsIGNoYXJzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSB0YWJsZSBvciByb3dzIHRvIHN0ZG91dC5cbiAgICogQHBhcmFtIHJvd3MgVGFibGUgb3Igcm93cy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVuZGVyPFQgZXh0ZW5kcyBJUm93Pihyb3dzOiBJVGFibGU8VD4pOiB2b2lkIHtcbiAgICBUYWJsZS5mcm9tKHJvd3MpLnJlbmRlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgZGF0YSBmcm9tIGFuIGFycmF5IG9mIGpzb24gb2JqZWN0cy4gQW4gb2JqZWN0IHJlcHJlc2VudHMgYVxuICAgKiByb3cgYW5kIGVhY2ggcHJvcGVydHkgYSBjb2x1bW4uXG4gICAqIEBwYXJhbSByb3dzIEFycmF5IG9mIG9iamVjdHMuXG4gICAqL1xuICBwdWJsaWMgZnJvbUpzb24ocm93czogSURhdGFSb3dbXSk6IHRoaXMge1xuICAgIHRoaXMuaGVhZGVyKE9iamVjdC5rZXlzKHJvd3NbMF0pKTtcbiAgICB0aGlzLmJvZHkocm93cy5tYXAoKHJvdykgPT4gT2JqZWN0LnZhbHVlcyhyb3cpIGFzIFQpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGFibGUgaGVhZGVyLlxuICAgKiBAcGFyYW0gaGVhZGVyIEhlYWRlciByb3cgb3IgY2VsbHMuXG4gICAqL1xuICBwdWJsaWMgaGVhZGVyKGhlYWRlcjogSVJvdyk6IHRoaXMge1xuICAgIHRoaXMuaGVhZGVyUm93ID0gaGVhZGVyIGluc3RhbmNlb2YgUm93ID8gaGVhZGVyIDogUm93LmZyb20oaGVhZGVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGFibGUgYm9keS5cbiAgICogQHBhcmFtIHJvd3MgVGFibGUgcm93cy5cbiAgICovXG4gIHB1YmxpYyBib2R5KHJvd3M6IFRbXSk6IHRoaXMge1xuICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLnB1c2goLi4ucm93cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQ2xvbmUgdGFibGUgcmVjdXJzaXZlbHkgd2l0aCBoZWFkZXIgYW5kIG9wdGlvbnMuICovXG4gIHB1YmxpYyBjbG9uZSgpOiBUYWJsZSB7XG4gICAgY29uc3QgdGFibGUgPSBuZXcgVGFibGUoXG4gICAgICAuLi50aGlzLm1hcCgocm93OiBUKSA9PlxuICAgICAgICByb3cgaW5zdGFuY2VvZiBSb3cgPyByb3cuY2xvbmUoKSA6IFJvdy5mcm9tKHJvdykuY2xvbmUoKVxuICAgICAgKSxcbiAgICApO1xuICAgIHRhYmxlLm9wdGlvbnMgPSB7IC4uLnRoaXMub3B0aW9ucyB9O1xuICAgIHRhYmxlLmhlYWRlclJvdyA9IHRoaXMuaGVhZGVyUm93Py5jbG9uZSgpO1xuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZSB0YWJsZSBzdHJpbmcuICovXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgVGFibGVMYXlvdXQodGhpcywgdGhpcy5vcHRpb25zKS50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqIFdyaXRlIHRhYmxlIHRvIHN0ZG91dC4gKi9cbiAgcHVibGljIHJlbmRlcigpOiB0aGlzIHtcbiAgICBjb25zb2xlLmxvZyh0aGlzLnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBtYXggY29sIHdpdGguXG4gICAqIEBwYXJhbSB3aWR0aCAgICAgTWF4IGNvbCB3aWR0aC5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBtYXhDb2xXaWR0aCh3aWR0aDogbnVtYmVyIHwgbnVtYmVyW10sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLm1heENvbFdpZHRoID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGggPSB3aWR0aDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IG1pbiBjb2wgd2lkdGguXG4gICAqIEBwYXJhbSB3aWR0aCAgICAgTWluIGNvbCB3aWR0aC5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBtaW5Db2xXaWR0aCh3aWR0aDogbnVtYmVyIHwgbnVtYmVyW10sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGggPSB3aWR0aDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRhYmxlIGluZGVudGF0aW9uLlxuICAgKiBAcGFyYW0gd2lkdGggICAgIEluZGVudCB3aWR0aC5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBpbmRlbnQod2lkdGg6IG51bWJlciwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMuaW5kZW50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaW5kZW50ID0gd2lkdGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjZWxsIHBhZGRpbmcuXG4gICAqIEBwYXJhbSBwYWRkaW5nICAgQ2VsbCBwYWRkaW5nLlxuICAgKiBAcGFyYW0gb3ZlcnJpZGUgIE92ZXJyaWRlIGV4aXN0aW5nIHZhbHVlLlxuICAgKi9cbiAgcHVibGljIHBhZGRpbmcocGFkZGluZzogbnVtYmVyIHwgbnVtYmVyW10sIG92ZXJyaWRlID0gdHJ1ZSk6IHRoaXMge1xuICAgIGlmIChvdmVycmlkZSB8fCB0eXBlb2YgdGhpcy5vcHRpb25zLnBhZGRpbmcgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5wYWRkaW5nID0gcGFkZGluZztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlL2Rpc2FibGUgY2VsbCBib3JkZXIuXG4gICAqIEBwYXJhbSBlbmFibGUgICAgRW5hYmxlL2Rpc2FibGUgY2VsbCBib3JkZXIuXG4gICAqIEBwYXJhbSBvdmVycmlkZSAgT3ZlcnJpZGUgZXhpc3RpbmcgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgYm9yZGVyKGVuYWJsZTogYm9vbGVhbiwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMuYm9yZGVyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuYm9yZGVyID0gZW5hYmxlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGlnbiB0YWJsZSBjb250ZW50LlxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIEFsaWduIGRpcmVjdGlvbi5cbiAgICogQHBhcmFtIG92ZXJyaWRlICBPdmVycmlkZSBleGlzdGluZyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBhbGlnbihkaXJlY3Rpb246IERpcmVjdGlvbiwgb3ZlcnJpZGUgPSB0cnVlKTogdGhpcyB7XG4gICAgaWYgKG92ZXJyaWRlIHx8IHR5cGVvZiB0aGlzLm9wdGlvbnMuYWxpZ24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbiA9IGRpcmVjdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGJvcmRlciBjaGFyYWN0ZXJzLlxuICAgKiBAcGFyYW0gY2hhcnMgQm9yZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY2hhcnMoY2hhcnM6IElCb3JkZXJPcHRpb25zKTogdGhpcyB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMuY2hhcnMsIGNoYXJzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBHZXQgdGFibGUgaGVhZGVyLiAqL1xuICBwdWJsaWMgZ2V0SGVhZGVyKCk6IFJvdyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuaGVhZGVyUm93O1xuICB9XG5cbiAgLyoqIEdldCB0YWJsZSBib2R5LiAqL1xuICBwdWJsaWMgZ2V0Qm9keSgpOiBUW10ge1xuICAgIHJldHVybiBbLi4udGhpc107XG4gIH1cblxuICAvKiogR2V0IG1hYyBjb2wgd2lkcnRoLiAqL1xuICBwdWJsaWMgZ2V0TWF4Q29sV2lkdGgoKTogbnVtYmVyIHwgbnVtYmVyW10ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGg7XG4gIH1cblxuICAvKiogR2V0IG1pbiBjb2wgd2lkdGguICovXG4gIHB1YmxpYyBnZXRNaW5Db2xXaWR0aCgpOiBudW1iZXIgfCBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aDtcbiAgfVxuXG4gIC8qKiBHZXQgdGFibGUgaW5kZW50YXRpb24uICovXG4gIHB1YmxpYyBnZXRJbmRlbnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmluZGVudDtcbiAgfVxuXG4gIC8qKiBHZXQgY2VsbCBwYWRkaW5nLiAqL1xuICBwdWJsaWMgZ2V0UGFkZGluZygpOiBudW1iZXIgfCBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wYWRkaW5nO1xuICB9XG5cbiAgLyoqIENoZWNrIGlmIHRhYmxlIGhhcyBib3JkZXIuICovXG4gIHB1YmxpYyBnZXRCb3JkZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5ib3JkZXIgPT09IHRydWU7XG4gIH1cblxuICAvKiogQ2hlY2sgaWYgaGVhZGVyIHJvdyBoYXMgYm9yZGVyLiAqL1xuICBwdWJsaWMgaGFzSGVhZGVyQm9yZGVyKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGhhc0JvcmRlciA9IHRoaXMuaGVhZGVyUm93Py5oYXNCb3JkZXIoKTtcbiAgICByZXR1cm4gaGFzQm9yZGVyID09PSB0cnVlIHx8ICh0aGlzLmdldEJvcmRlcigpICYmIGhhc0JvcmRlciAhPT0gZmFsc2UpO1xuICB9XG5cbiAgLyoqIENoZWNrIGlmIHRhYmxlIGJvcmR5IGhhcyBib3JkZXIuICovXG4gIHB1YmxpYyBoYXNCb2R5Qm9yZGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldEJvcmRlcigpIHx8XG4gICAgICB0aGlzLnNvbWUoKHJvdykgPT5cbiAgICAgICAgcm93IGluc3RhbmNlb2YgUm93XG4gICAgICAgICAgPyByb3cuaGFzQm9yZGVyKClcbiAgICAgICAgICA6IHJvdy5zb21lKChjZWxsKSA9PiBjZWxsIGluc3RhbmNlb2YgQ2VsbCA/IGNlbGwuZ2V0Qm9yZGVyIDogZmFsc2UpXG4gICAgICApO1xuICB9XG5cbiAgLyoqIENoZWNrIGlmIHRhYmxlIGhlYWRlciBvciBib2R5IGhhcyBib3JkZXIuICovXG4gIHB1YmxpYyBoYXNCb3JkZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzSGVhZGVyQm9yZGVyKCkgfHwgdGhpcy5oYXNCb2R5Qm9yZGVyKCk7XG4gIH1cblxuICAvKiogR2V0IHRhYmxlIGFsaWdubWVudC4gKi9cbiAgcHVibGljIGdldEFsaWduKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hbGlnbiA/PyBcImxlZnRcIjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxNQUFNLFFBQWlCLENBQWE7QUFDN0MsTUFBTSxHQUFHLElBQUksUUFBbUIsQ0FBVztBQUMzQyxNQUFNLEdBQUcsV0FBVyxRQUFRLENBQWE7QUFDekMsTUFBTSxHQUFtQixHQUFHLFFBQVEsQ0FBVTtBQXlCOUMsRUFBNEIsQUFBNUIsd0JBQTRCLEFBQTVCLEVBQTRCLENBQzVCLE1BQU0sT0FBTyxLQUFLLFNBQWdDLEtBQUs7V0FDcEMsTUFBTSxHQUFZLENBQUM7V0FBSSxNQUFNO0lBQUMsQ0FBQztJQUN0QyxPQUFPLEdBQW1CLENBQUM7UUFDbkMsTUFBTSxFQUFFLENBQUM7UUFDVCxNQUFNLEVBQUUsS0FBSztRQUNiLFdBQVcsRUFBRSxRQUFRO1FBQ3JCLFdBQVcsRUFBRSxDQUFDO1FBQ2QsT0FBTyxFQUFFLENBQUM7UUFDVixLQUFLLEVBQUUsQ0FBQztlQUFJLEtBQUssQ0FBQyxNQUFNO1FBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ08sU0FBUztJQUVqQixFQUlHLEFBSkg7Ozs7R0FJRyxBQUpILEVBSUcsUUFDVyxJQUFJLENBQWlCLElBQWUsRUFBWSxDQUFDO1FBQzdELEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJO1FBQzlCLEVBQUUsRUFBRSxJQUFJLFlBQVksS0FBSyxFQUFFLENBQUM7WUFDMUIsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDO21CQUFJLElBQUksQ0FBQyxPQUFPO1lBQUMs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