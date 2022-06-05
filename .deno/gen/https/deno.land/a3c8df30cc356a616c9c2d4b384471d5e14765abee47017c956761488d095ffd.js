import { Cell } from "./cell.ts";
import { stripColor } from "./deps.ts";
import { Row } from "./row.ts";
import { consumeWords, longest } from "./utils.ts";
/** Table layout renderer. */ export class TableLayout {
    table;
    options;
    /**
   * Table layout constructor.
   * @param table   Table instance.
   * @param options Render options.
   */ constructor(table, options){
        this.table = table;
        this.options = options;
    }
    /** Generate table string. */ toString() {
        const opts = this.createLayout();
        return opts.rows.length ? this.renderRows(opts) : "";
    }
    /**
   * Generates table layout including row and col span, converts all none
   * Cell/Row values to Cell's and Row's and returns the layout rendering
   * settings.
   */ createLayout() {
        Object.keys(this.options.chars).forEach((key)=>{
            if (typeof this.options.chars[key] !== "string") {
                this.options.chars[key] = "";
            }
        });
        const hasBodyBorder = this.table.getBorder() || this.table.hasBodyBorder();
        const hasHeaderBorder = this.table.hasHeaderBorder();
        const hasBorder = hasHeaderBorder || hasBodyBorder;
        const header = this.table.getHeader();
        const rows = this.spanRows(header ? [
            header,
            ...this.table
        ] : this.table.slice());
        const columns = Math.max(...rows.map((row)=>row.length
        ));
        for (const row of rows){
            const length = row.length;
            if (length < columns) {
                const diff = columns - length;
                for(let i = 0; i < diff; i++){
                    row.push(this.createCell(null, row));
                }
            }
        }
        const padding = [];
        const width = [];
        for(let colIndex = 0; colIndex < columns; colIndex++){
            const minColWidth = Array.isArray(this.options.minColWidth) ? this.options.minColWidth[colIndex] : this.options.minColWidth;
            const maxColWidth = Array.isArray(this.options.maxColWidth) ? this.options.maxColWidth[colIndex] : this.options.maxColWidth;
            const colWidth = longest(colIndex, rows, maxColWidth);
            width[colIndex] = Math.min(maxColWidth, Math.max(minColWidth, colWidth));
            padding[colIndex] = Array.isArray(this.options.padding) ? this.options.padding[colIndex] : this.options.padding;
        }
        return {
            padding,
            width,
            rows,
            columns,
            hasBorder,
            hasBodyBorder,
            hasHeaderBorder
        };
    }
    /**
   * Fills rows and cols by specified row/col span with a reference of the
   * original cell.
   *
   * @param _rows     All table rows.
   * @param rowIndex  Current row index.
   * @param colIndex  Current col index.
   * @param rowSpan   Current row span.
   * @param colSpan   Current col span.
   */ spanRows(_rows, rowIndex = 0, colIndex = 0, rowSpan = [], colSpan = 1) {
        const rows = _rows;
        if (rowIndex >= rows.length && rowSpan.every((span)=>span === 1
        )) {
            return rows;
        } else if (rows[rowIndex] && colIndex >= rows[rowIndex].length && colIndex >= rowSpan.length && colSpan === 1) {
            return this.spanRows(rows, ++rowIndex, 0, rowSpan, 1);
        }
        if (colSpan > 1) {
            colSpan--;
            rowSpan[colIndex] = rowSpan[colIndex - 1];
            rows[rowIndex].splice(colIndex - 1, 0, rows[rowIndex][colIndex - 1]);
            return this.spanRows(rows, rowIndex, ++colIndex, rowSpan, colSpan);
        }
        if (colIndex === 0) {
            rows[rowIndex] = this.createRow(rows[rowIndex] || []);
        }
        if (rowSpan[colIndex] > 1) {
            rowSpan[colIndex]--;
            rows[rowIndex].splice(colIndex, 0, rows[rowIndex - 1][colIndex]);
            return this.spanRows(rows, rowIndex, ++colIndex, rowSpan, colSpan);
        }
        rows[rowIndex][colIndex] = this.createCell(rows[rowIndex][colIndex] || null, rows[rowIndex]);
        colSpan = rows[rowIndex][colIndex].getColSpan();
        rowSpan[colIndex] = rows[rowIndex][colIndex].getRowSpan();
        return this.spanRows(rows, rowIndex, ++colIndex, rowSpan, colSpan);
    }
    /**
   * Create a new row from existing row or cell array.
   * @param row Original row.
   */ createRow(row) {
        return Row.from(row).border(this.table.getBorder(), false).align(this.table.getAlign(), false);
    }
    /**
   * Create a new cell from existing cell or cell value.
   * @param cell  Original cell.
   * @param row   Parent row.
   */ createCell(cell, row) {
        return Cell.from(cell ?? "").border(row.getBorder(), false).align(row.getAlign(), false);
    }
    /**
   * Render table layout.
   * @param opts Render options.
   */ renderRows(opts) {
        let result = "";
        const rowSpan = new Array(opts.columns).fill(1);
        for(let rowIndex = 0; rowIndex < opts.rows.length; rowIndex++){
            result += this.renderRow(rowSpan, rowIndex, opts);
        }
        return result.slice(0, -1);
    }
    /**
   * Render row.
   * @param rowSpan     Current row span.
   * @param rowIndex    Current row index.
   * @param opts        Render options.
   * @param isMultiline Is multiline row.
   */ renderRow(rowSpan, rowIndex, opts, isMultiline) {
        const row = opts.rows[rowIndex];
        const prevRow = opts.rows[rowIndex - 1];
        const nextRow = opts.rows[rowIndex + 1];
        let result = "";
        let colSpan = 1;
        // border top row
        if (!isMultiline && rowIndex === 0 && row.hasBorder()) {
            result += this.renderBorderRow(undefined, row, rowSpan, opts);
        }
        let isMultilineRow = false;
        result += " ".repeat(this.options.indent || 0);
        for(let colIndex = 0; colIndex < opts.columns; colIndex++){
            if (colSpan > 1) {
                colSpan--;
                rowSpan[colIndex] = rowSpan[colIndex - 1];
                continue;
            }
            result += this.renderCell(colIndex, row, opts);
            if (rowSpan[colIndex] > 1) {
                if (!isMultiline) {
                    rowSpan[colIndex]--;
                }
            } else if (!prevRow || prevRow[colIndex] !== row[colIndex]) {
                rowSpan[colIndex] = row[colIndex].getRowSpan();
            }
            colSpan = row[colIndex].getColSpan();
            if (rowSpan[colIndex] === 1 && row[colIndex].length) {
                isMultilineRow = true;
            }
        }
        if (opts.columns > 0) {
            if (row[opts.columns - 1].getBorder()) {
                result += this.options.chars.right;
            } else if (opts.hasBorder) {
                result += " ";
            }
        }
        result += "\n";
        if (isMultilineRow) {
            return result + this.renderRow(rowSpan, rowIndex, opts, isMultilineRow);
        }
        // border mid row
        if (rowIndex === 0 && opts.hasHeaderBorder || rowIndex < opts.rows.length - 1 && opts.hasBodyBorder) {
            result += this.renderBorderRow(row, nextRow, rowSpan, opts);
        }
        // border bottom row
        if (rowIndex === opts.rows.length - 1 && row.hasBorder()) {
            result += this.renderBorderRow(row, undefined, rowSpan, opts);
        }
        return result;
    }
    /**
   * Render cell.
   * @param colIndex  Current col index.
   * @param row       Current row.
   * @param opts      Render options.
   * @param noBorder  Disable border.
   */ renderCell(colIndex, row, opts, noBorder) {
        let result = "";
        const prevCell = row[colIndex - 1];
        const cell = row[colIndex];
        if (!noBorder) {
            if (colIndex === 0) {
                if (cell.getBorder()) {
                    result += this.options.chars.left;
                } else if (opts.hasBorder) {
                    result += " ";
                }
            } else {
                if (cell.getBorder() || prevCell?.getBorder()) {
                    result += this.options.chars.middle;
                } else if (opts.hasBorder) {
                    result += " ";
                }
            }
        }
        let maxLength = opts.width[colIndex];
        const colSpan = cell.getColSpan();
        if (colSpan > 1) {
            for(let o = 1; o < colSpan; o++){
                // add padding and with of next cell
                maxLength += opts.width[colIndex + o] + opts.padding[colIndex + o];
                if (opts.hasBorder) {
                    // add padding again and border with
                    maxLength += opts.padding[colIndex + o] + 1;
                }
            }
        }
        const { current , next  } = this.renderCellValue(cell, maxLength);
        row[colIndex].setValue(next);
        if (opts.hasBorder) {
            result += " ".repeat(opts.padding[colIndex]);
        }
        result += current;
        if (opts.hasBorder || colIndex < opts.columns - 1) {
            result += " ".repeat(opts.padding[colIndex]);
        }
        return result;
    }
    /**
   * Render specified length of cell. Returns the rendered value and a new cell
   * with the rest value.
   * @param cell      Cell to render.
   * @param maxLength Max length of content to render.
   */ renderCellValue(cell, maxLength) {
        const length = Math.min(maxLength, stripColor(cell.toString()).length);
        let words = consumeWords(length, cell.toString());
        // break word if word is longer than max length
        const breakWord = stripColor(words).length > length;
        if (breakWord) {
            words = words.slice(0, length);
        }
        // get next content and remove leading space if breakWord is not true
        const next = cell.toString().slice(words.length + (breakWord ? 0 : 1));
        const fillLength = maxLength - stripColor(words).length;
        // Align content
        const align = cell.getAlign();
        let current;
        if (fillLength === 0) {
            current = words;
        } else if (align === "left") {
            current = words + " ".repeat(fillLength);
        } else if (align === "center") {
            current = " ".repeat(Math.floor(fillLength / 2)) + words + " ".repeat(Math.ceil(fillLength / 2));
        } else if (align === "right") {
            current = " ".repeat(fillLength) + words;
        } else {
            throw new Error("Unknown direction: " + align);
        }
        return {
            current,
            next: cell.clone(next)
        };
    }
    /**
   * Render border row.
   * @param prevRow Previous row.
   * @param nextRow Next row.
   * @param rowSpan Current row span.
   * @param opts    Render options.
   */ renderBorderRow(prevRow, nextRow, rowSpan, opts) {
        let result = "";
        let colSpan = 1;
        for(let colIndex = 0; colIndex < opts.columns; colIndex++){
            if (rowSpan[colIndex] > 1) {
                if (!nextRow) {
                    throw new Error("invalid layout");
                }
                if (colSpan > 1) {
                    colSpan--;
                    continue;
                }
            }
            result += this.renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts);
            colSpan = nextRow?.[colIndex].getColSpan() ?? 1;
        }
        return result.length ? " ".repeat(this.options.indent) + result + "\n" : "";
    }
    /**
   * Render border cell.
   * @param colIndex  Current index.
   * @param prevRow   Previous row.
   * @param nextRow   Next row.
   * @param rowSpan   Current row span.
   * @param opts      Render options.
   */ renderBorderCell(colIndex, prevRow, nextRow, rowSpan, opts) {
        // a1 | b1
        // -------
        // a2 | b2
        const a1 = prevRow?.[colIndex - 1];
        const a2 = nextRow?.[colIndex - 1];
        const b1 = prevRow?.[colIndex];
        const b2 = nextRow?.[colIndex];
        const a1Border = !!a1?.getBorder();
        const a2Border = !!a2?.getBorder();
        const b1Border = !!b1?.getBorder();
        const b2Border = !!b2?.getBorder();
        const hasColSpan = (cell)=>(cell?.getColSpan() ?? 1) > 1
        ;
        const hasRowSpan = (cell)=>(cell?.getRowSpan() ?? 1) > 1
        ;
        let result = "";
        if (colIndex === 0) {
            if (rowSpan[colIndex] > 1) {
                if (b1Border) {
                    result += this.options.chars.left;
                } else {
                    result += " ";
                }
            } else if (b1Border && b2Border) {
                result += this.options.chars.leftMid;
            } else if (b1Border) {
                result += this.options.chars.bottomLeft;
            } else if (b2Border) {
                result += this.options.chars.topLeft;
            } else {
                result += " ";
            }
        } else if (colIndex < opts.columns) {
            if (a1Border && b2Border || b1Border && a2Border) {
                const a1ColSpan = hasColSpan(a1);
                const a2ColSpan = hasColSpan(a2);
                const b1ColSpan = hasColSpan(b1);
                const b2ColSpan = hasColSpan(b2);
                const a1RowSpan = hasRowSpan(a1);
                const a2RowSpan = hasRowSpan(a2);
                const b1RowSpan = hasRowSpan(b1);
                const b2RowSpan = hasRowSpan(b2);
                const hasAllBorder = a1Border && b2Border && b1Border && a2Border;
                const hasAllRowSpan = a1RowSpan && b1RowSpan && a2RowSpan && b2RowSpan;
                const hasAllColSpan = a1ColSpan && b1ColSpan && a2ColSpan && b2ColSpan;
                if (hasAllRowSpan && hasAllBorder) {
                    result += this.options.chars.middle;
                } else if (hasAllColSpan && hasAllBorder && a1 === b1 && a2 === b2) {
                    result += this.options.chars.mid;
                } else if (a1ColSpan && b1ColSpan && a1 === b1) {
                    result += this.options.chars.topMid;
                } else if (a2ColSpan && b2ColSpan && a2 === b2) {
                    result += this.options.chars.bottomMid;
                } else if (a1RowSpan && a2RowSpan && a1 === a2) {
                    result += this.options.chars.leftMid;
                } else if (b1RowSpan && b2RowSpan && b1 === b2) {
                    result += this.options.chars.rightMid;
                } else {
                    result += this.options.chars.midMid;
                }
            } else if (a1Border && b1Border) {
                if (hasColSpan(a1) && hasColSpan(b1) && a1 === b1) {
                    result += this.options.chars.bottom;
                } else {
                    result += this.options.chars.bottomMid;
                }
            } else if (b1Border && b2Border) {
                if (rowSpan[colIndex] > 1) {
                    result += this.options.chars.left;
                } else {
                    result += this.options.chars.leftMid;
                }
            } else if (b2Border && a2Border) {
                if (hasColSpan(a2) && hasColSpan(b2) && a2 === b2) {
                    result += this.options.chars.top;
                } else {
                    result += this.options.chars.topMid;
                }
            } else if (a1Border && a2Border) {
                if (hasRowSpan(a1) && a1 === a2) {
                    result += this.options.chars.right;
                } else {
                    result += this.options.chars.rightMid;
                }
            } else if (a1Border) {
                result += this.options.chars.bottomRight;
            } else if (b1Border) {
                result += this.options.chars.bottomLeft;
            } else if (a2Border) {
                result += this.options.chars.topRight;
            } else if (b2Border) {
                result += this.options.chars.topLeft;
            } else {
                result += " ";
            }
        }
        const length = opts.padding[colIndex] + opts.width[colIndex] + opts.padding[colIndex];
        if (rowSpan[colIndex] > 1 && nextRow) {
            result += this.renderCell(colIndex, nextRow, opts, true);
            if (nextRow[colIndex] === nextRow[nextRow.length - 1]) {
                if (b1Border) {
                    result += this.options.chars.right;
                } else {
                    result += " ";
                }
                return result;
            }
        } else if (b1Border && b2Border) {
            result += this.options.chars.mid.repeat(length);
        } else if (b1Border) {
            result += this.options.chars.bottom.repeat(length);
        } else if (b2Border) {
            result += this.options.chars.top.repeat(length);
        } else {
            result += " ".repeat(length);
        }
        if (colIndex === opts.columns - 1) {
            if (b1Border && b2Border) {
                result += this.options.chars.rightMid;
            } else if (b1Border) {
                result += this.options.chars.bottomRight;
            } else if (b2Border) {
                result += this.options.chars.topRight;
            } else {
                result += " ";
            }
        }
        return result;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvdGFibGUvbGF5b3V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENlbGwsIERpcmVjdGlvbiwgSUNlbGwgfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBzdHJpcENvbG9yIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgSVJvdywgUm93IH0gZnJvbSBcIi4vcm93LnRzXCI7XG5pbXBvcnQgdHlwZSB7IElCb3JkZXJPcHRpb25zLCBJVGFibGVTZXR0aW5ncywgVGFibGUgfSBmcm9tIFwiLi90YWJsZS50c1wiO1xuaW1wb3J0IHsgY29uc3VtZVdvcmRzLCBsb25nZXN0IH0gZnJvbSBcIi4vdXRpbHMudHNcIjtcblxuLyoqIExheW91dCByZW5kZXIgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgSVJlbmRlclNldHRpbmdzIHtcbiAgcGFkZGluZzogbnVtYmVyW107XG4gIHdpZHRoOiBudW1iZXJbXTtcbiAgY29sdW1uczogbnVtYmVyO1xuICBoYXNCb3JkZXI6IGJvb2xlYW47XG4gIGhhc0hlYWRlckJvcmRlcjogYm9vbGVhbjtcbiAgaGFzQm9keUJvcmRlcjogYm9vbGVhbjtcbiAgcm93czogUm93PENlbGw+W107XG59XG5cbi8qKiBUYWJsZSBsYXlvdXQgcmVuZGVyZXIuICovXG5leHBvcnQgY2xhc3MgVGFibGVMYXlvdXQge1xuICAvKipcbiAgICogVGFibGUgbGF5b3V0IGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0gdGFibGUgICBUYWJsZSBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgUmVuZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSB0YWJsZTogVGFibGUsXG4gICAgcHJpdmF0ZSBvcHRpb25zOiBJVGFibGVTZXR0aW5ncyxcbiAgKSB7fVxuXG4gIC8qKiBHZW5lcmF0ZSB0YWJsZSBzdHJpbmcuICovXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIGNvbnN0IG9wdHM6IElSZW5kZXJTZXR0aW5ncyA9IHRoaXMuY3JlYXRlTGF5b3V0KCk7XG4gICAgcmV0dXJuIG9wdHMucm93cy5sZW5ndGggPyB0aGlzLnJlbmRlclJvd3Mob3B0cykgOiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0YWJsZSBsYXlvdXQgaW5jbHVkaW5nIHJvdyBhbmQgY29sIHNwYW4sIGNvbnZlcnRzIGFsbCBub25lXG4gICAqIENlbGwvUm93IHZhbHVlcyB0byBDZWxsJ3MgYW5kIFJvdydzIGFuZCByZXR1cm5zIHRoZSBsYXlvdXQgcmVuZGVyaW5nXG4gICAqIHNldHRpbmdzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUxheW91dCgpOiBJUmVuZGVyU2V0dGluZ3Mge1xuICAgIE9iamVjdC5rZXlzKHRoaXMub3B0aW9ucy5jaGFycykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmNoYXJzW2tleSBhcyBrZXlvZiBJQm9yZGVyT3B0aW9uc10gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoYXJzW2tleSBhcyBrZXlvZiBJQm9yZGVyT3B0aW9uc10gPSBcIlwiO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaGFzQm9keUJvcmRlcjogYm9vbGVhbiA9IHRoaXMudGFibGUuZ2V0Qm9yZGVyKCkgfHxcbiAgICAgIHRoaXMudGFibGUuaGFzQm9keUJvcmRlcigpO1xuICAgIGNvbnN0IGhhc0hlYWRlckJvcmRlcjogYm9vbGVhbiA9IHRoaXMudGFibGUuaGFzSGVhZGVyQm9yZGVyKCk7XG4gICAgY29uc3QgaGFzQm9yZGVyOiBib29sZWFuID0gaGFzSGVhZGVyQm9yZGVyIHx8IGhhc0JvZHlCb3JkZXI7XG5cbiAgICBjb25zdCBoZWFkZXI6IFJvdyB8IHVuZGVmaW5lZCA9IHRoaXMudGFibGUuZ2V0SGVhZGVyKCk7XG4gICAgY29uc3Qgcm93czogUm93PENlbGw+W10gPSB0aGlzLnNwYW5Sb3dzKFxuICAgICAgaGVhZGVyID8gW2hlYWRlciwgLi4udGhpcy50YWJsZV0gOiB0aGlzLnRhYmxlLnNsaWNlKCksXG4gICAgKTtcbiAgICBjb25zdCBjb2x1bW5zOiBudW1iZXIgPSBNYXRoLm1heCguLi5yb3dzLm1hcCgocm93KSA9PiByb3cubGVuZ3RoKSk7XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgbGVuZ3RoOiBudW1iZXIgPSByb3cubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA8IGNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgZGlmZiA9IGNvbHVtbnMgLSBsZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgICAgcm93LnB1c2godGhpcy5jcmVhdGVDZWxsKG51bGwsIHJvdykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFkZGluZzogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCB3aWR0aDogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgY29sdW1uczsgY29sSW5kZXgrKykge1xuICAgICAgY29uc3QgbWluQ29sV2lkdGg6IG51bWJlciA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoKVxuICAgICAgICA/IHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aFtjb2xJbmRleF1cbiAgICAgICAgOiB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGg7XG4gICAgICBjb25zdCBtYXhDb2xXaWR0aDogbnVtYmVyID0gQXJyYXkuaXNBcnJheSh0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGgpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLm1heENvbFdpZHRoW2NvbEluZGV4XVxuICAgICAgICA6IHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aDtcbiAgICAgIGNvbnN0IGNvbFdpZHRoOiBudW1iZXIgPSBsb25nZXN0KGNvbEluZGV4LCByb3dzLCBtYXhDb2xXaWR0aCk7XG4gICAgICB3aWR0aFtjb2xJbmRleF0gPSBNYXRoLm1pbihtYXhDb2xXaWR0aCwgTWF0aC5tYXgobWluQ29sV2lkdGgsIGNvbFdpZHRoKSk7XG4gICAgICBwYWRkaW5nW2NvbEluZGV4XSA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnBhZGRpbmcpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLnBhZGRpbmdbY29sSW5kZXhdXG4gICAgICAgIDogdGhpcy5vcHRpb25zLnBhZGRpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmcsXG4gICAgICB3aWR0aCxcbiAgICAgIHJvd3MsXG4gICAgICBjb2x1bW5zLFxuICAgICAgaGFzQm9yZGVyLFxuICAgICAgaGFzQm9keUJvcmRlcixcbiAgICAgIGhhc0hlYWRlckJvcmRlcixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbGxzIHJvd3MgYW5kIGNvbHMgYnkgc3BlY2lmaWVkIHJvdy9jb2wgc3BhbiB3aXRoIGEgcmVmZXJlbmNlIG9mIHRoZVxuICAgKiBvcmlnaW5hbCBjZWxsLlxuICAgKlxuICAgKiBAcGFyYW0gX3Jvd3MgICAgIEFsbCB0YWJsZSByb3dzLlxuICAgKiBAcGFyYW0gcm93SW5kZXggIEN1cnJlbnQgcm93IGluZGV4LlxuICAgKiBAcGFyYW0gY29sSW5kZXggIEN1cnJlbnQgY29sIGluZGV4LlxuICAgKiBAcGFyYW0gcm93U3BhbiAgIEN1cnJlbnQgcm93IHNwYW4uXG4gICAqIEBwYXJhbSBjb2xTcGFuICAgQ3VycmVudCBjb2wgc3Bhbi5cbiAgICovXG4gIHByb3RlY3RlZCBzcGFuUm93cyhcbiAgICBfcm93czogSVJvd1tdLFxuICAgIHJvd0luZGV4ID0gMCxcbiAgICBjb2xJbmRleCA9IDAsXG4gICAgcm93U3BhbjogbnVtYmVyW10gPSBbXSxcbiAgICBjb2xTcGFuID0gMSxcbiAgKTogUm93PENlbGw+W10ge1xuICAgIGNvbnN0IHJvd3M6IFJvdzxDZWxsPltdID0gX3Jvd3MgYXMgUm93PENlbGw+W107XG5cbiAgICBpZiAocm93SW5kZXggPj0gcm93cy5sZW5ndGggJiYgcm93U3Bhbi5ldmVyeSgoc3BhbikgPT4gc3BhbiA9PT0gMSkpIHtcbiAgICAgIHJldHVybiByb3dzO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICByb3dzW3Jvd0luZGV4XSAmJiBjb2xJbmRleCA+PSByb3dzW3Jvd0luZGV4XS5sZW5ndGggJiZcbiAgICAgIGNvbEluZGV4ID49IHJvd1NwYW4ubGVuZ3RoICYmIGNvbFNwYW4gPT09IDFcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsICsrcm93SW5kZXgsIDAsIHJvd1NwYW4sIDEpO1xuICAgIH1cblxuICAgIGlmIChjb2xTcGFuID4gMSkge1xuICAgICAgY29sU3Bhbi0tO1xuICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSByb3dTcGFuW2NvbEluZGV4IC0gMV07XG4gICAgICByb3dzW3Jvd0luZGV4XS5zcGxpY2UoY29sSW5kZXggLSAxLCAwLCByb3dzW3Jvd0luZGV4XVtjb2xJbmRleCAtIDFdKTtcbiAgICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsIHJvd0luZGV4LCArK2NvbEluZGV4LCByb3dTcGFuLCBjb2xTcGFuKTtcbiAgICB9XG5cbiAgICBpZiAoY29sSW5kZXggPT09IDApIHtcbiAgICAgIHJvd3Nbcm93SW5kZXhdID0gdGhpcy5jcmVhdGVSb3cocm93c1tyb3dJbmRleF0gfHwgW10pO1xuICAgIH1cblxuICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgIHJvd1NwYW5bY29sSW5kZXhdLS07XG4gICAgICByb3dzW3Jvd0luZGV4XS5zcGxpY2UoY29sSW5kZXgsIDAsIHJvd3Nbcm93SW5kZXggLSAxXVtjb2xJbmRleF0pO1xuICAgICAgcmV0dXJuIHRoaXMuc3BhblJvd3Mocm93cywgcm93SW5kZXgsICsrY29sSW5kZXgsIHJvd1NwYW4sIGNvbFNwYW4pO1xuICAgIH1cblxuICAgIHJvd3Nbcm93SW5kZXhdW2NvbEluZGV4XSA9IHRoaXMuY3JlYXRlQ2VsbChcbiAgICAgIHJvd3Nbcm93SW5kZXhdW2NvbEluZGV4XSB8fCBudWxsLFxuICAgICAgcm93c1tyb3dJbmRleF0sXG4gICAgKTtcblxuICAgIGNvbFNwYW4gPSByb3dzW3Jvd0luZGV4XVtjb2xJbmRleF0uZ2V0Q29sU3BhbigpO1xuICAgIHJvd1NwYW5bY29sSW5kZXhdID0gcm93c1tyb3dJbmRleF1bY29sSW5kZXhdLmdldFJvd1NwYW4oKTtcblxuICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsIHJvd0luZGV4LCArK2NvbEluZGV4LCByb3dTcGFuLCBjb2xTcGFuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm93IGZyb20gZXhpc3Rpbmcgcm93IG9yIGNlbGwgYXJyYXkuXG4gICAqIEBwYXJhbSByb3cgT3JpZ2luYWwgcm93LlxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZVJvdyhyb3c6IElSb3cpOiBSb3c8Q2VsbD4ge1xuICAgIHJldHVybiBSb3cuZnJvbShyb3cpXG4gICAgICAuYm9yZGVyKHRoaXMudGFibGUuZ2V0Qm9yZGVyKCksIGZhbHNlKVxuICAgICAgLmFsaWduKHRoaXMudGFibGUuZ2V0QWxpZ24oKSwgZmFsc2UpIGFzIFJvdzxDZWxsPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgY2VsbCBmcm9tIGV4aXN0aW5nIGNlbGwgb3IgY2VsbCB2YWx1ZS5cbiAgICogQHBhcmFtIGNlbGwgIE9yaWdpbmFsIGNlbGwuXG4gICAqIEBwYXJhbSByb3cgICBQYXJlbnQgcm93LlxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNlbGwoY2VsbDogSUNlbGwgfCBudWxsLCByb3c6IFJvdyk6IENlbGwge1xuICAgIHJldHVybiBDZWxsLmZyb20oY2VsbCA/PyBcIlwiKVxuICAgICAgLmJvcmRlcihyb3cuZ2V0Qm9yZGVyKCksIGZhbHNlKVxuICAgICAgLmFsaWduKHJvdy5nZXRBbGlnbigpLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIHRhYmxlIGxheW91dC5cbiAgICogQHBhcmFtIG9wdHMgUmVuZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyUm93cyhvcHRzOiBJUmVuZGVyU2V0dGluZ3MpOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGNvbnN0IHJvd1NwYW46IG51bWJlcltdID0gbmV3IEFycmF5KG9wdHMuY29sdW1ucykuZmlsbCgxKTtcblxuICAgIGZvciAobGV0IHJvd0luZGV4ID0gMDsgcm93SW5kZXggPCBvcHRzLnJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJSb3cocm93U3Bhbiwgcm93SW5kZXgsIG9wdHMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQuc2xpY2UoMCwgLTEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciByb3cuXG4gICAqIEBwYXJhbSByb3dTcGFuICAgICBDdXJyZW50IHJvdyBzcGFuLlxuICAgKiBAcGFyYW0gcm93SW5kZXggICAgQ3VycmVudCByb3cgaW5kZXguXG4gICAqIEBwYXJhbSBvcHRzICAgICAgICBSZW5kZXIgb3B0aW9ucy5cbiAgICogQHBhcmFtIGlzTXVsdGlsaW5lIElzIG11bHRpbGluZSByb3cuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyUm93KFxuICAgIHJvd1NwYW46IG51bWJlcltdLFxuICAgIHJvd0luZGV4OiBudW1iZXIsXG4gICAgb3B0czogSVJlbmRlclNldHRpbmdzLFxuICAgIGlzTXVsdGlsaW5lPzogYm9vbGVhbixcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCByb3c6IFJvdzxDZWxsPiA9IG9wdHMucm93c1tyb3dJbmRleF07XG4gICAgY29uc3QgcHJldlJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkID0gb3B0cy5yb3dzW3Jvd0luZGV4IC0gMV07XG4gICAgY29uc3QgbmV4dFJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkID0gb3B0cy5yb3dzW3Jvd0luZGV4ICsgMV07XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG5cbiAgICBsZXQgY29sU3BhbiA9IDE7XG5cbiAgICAvLyBib3JkZXIgdG9wIHJvd1xuICAgIGlmICghaXNNdWx0aWxpbmUgJiYgcm93SW5kZXggPT09IDAgJiYgcm93Lmhhc0JvcmRlcigpKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJSb3codW5kZWZpbmVkLCByb3csIHJvd1NwYW4sIG9wdHMpO1xuICAgIH1cblxuICAgIGxldCBpc011bHRpbGluZVJvdyA9IGZhbHNlO1xuXG4gICAgcmVzdWx0ICs9IFwiIFwiLnJlcGVhdCh0aGlzLm9wdGlvbnMuaW5kZW50IHx8IDApO1xuXG4gICAgZm9yIChsZXQgY29sSW5kZXggPSAwOyBjb2xJbmRleCA8IG9wdHMuY29sdW1uczsgY29sSW5kZXgrKykge1xuICAgICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICAgIGNvbFNwYW4tLTtcbiAgICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSByb3dTcGFuW2NvbEluZGV4IC0gMV07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJDZWxsKGNvbEluZGV4LCByb3csIG9wdHMpO1xuXG4gICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPiAxKSB7XG4gICAgICAgIGlmICghaXNNdWx0aWxpbmUpIHtcbiAgICAgICAgICByb3dTcGFuW2NvbEluZGV4XS0tO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFwcmV2Um93IHx8IHByZXZSb3dbY29sSW5kZXhdICE9PSByb3dbY29sSW5kZXhdKSB7XG4gICAgICAgIHJvd1NwYW5bY29sSW5kZXhdID0gcm93W2NvbEluZGV4XS5nZXRSb3dTcGFuKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbFNwYW4gPSByb3dbY29sSW5kZXhdLmdldENvbFNwYW4oKTtcblxuICAgICAgaWYgKHJvd1NwYW5bY29sSW5kZXhdID09PSAxICYmIHJvd1tjb2xJbmRleF0ubGVuZ3RoKSB7XG4gICAgICAgIGlzTXVsdGlsaW5lUm93ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0cy5jb2x1bW5zID4gMCkge1xuICAgICAgaWYgKHJvd1tvcHRzLmNvbHVtbnMgLSAxXS5nZXRCb3JkZXIoKSkge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0O1xuICAgICAgfSBlbHNlIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gXCIgXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IFwiXFxuXCI7XG5cbiAgICBpZiAoaXNNdWx0aWxpbmVSb3cpIHsgLy8gc2tpcCBib3JkZXJcbiAgICAgIHJldHVybiByZXN1bHQgKyB0aGlzLnJlbmRlclJvdyhyb3dTcGFuLCByb3dJbmRleCwgb3B0cywgaXNNdWx0aWxpbmVSb3cpO1xuICAgIH1cblxuICAgIC8vIGJvcmRlciBtaWQgcm93XG4gICAgaWYgKFxuICAgICAgKHJvd0luZGV4ID09PSAwICYmIG9wdHMuaGFzSGVhZGVyQm9yZGVyKSB8fFxuICAgICAgKHJvd0luZGV4IDwgb3B0cy5yb3dzLmxlbmd0aCAtIDEgJiYgb3B0cy5oYXNCb2R5Qm9yZGVyKVxuICAgICkge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyQm9yZGVyUm93KHJvdywgbmV4dFJvdywgcm93U3Bhbiwgb3B0cyk7XG4gICAgfVxuXG4gICAgLy8gYm9yZGVyIGJvdHRvbSByb3dcbiAgICBpZiAocm93SW5kZXggPT09IG9wdHMucm93cy5sZW5ndGggLSAxICYmIHJvdy5oYXNCb3JkZXIoKSkge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyQm9yZGVyUm93KHJvdywgdW5kZWZpbmVkLCByb3dTcGFuLCBvcHRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBjZWxsLlxuICAgKiBAcGFyYW0gY29sSW5kZXggIEN1cnJlbnQgY29sIGluZGV4LlxuICAgKiBAcGFyYW0gcm93ICAgICAgIEN1cnJlbnQgcm93LlxuICAgKiBAcGFyYW0gb3B0cyAgICAgIFJlbmRlciBvcHRpb25zLlxuICAgKiBAcGFyYW0gbm9Cb3JkZXIgIERpc2FibGUgYm9yZGVyLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlckNlbGwoXG4gICAgY29sSW5kZXg6IG51bWJlcixcbiAgICByb3c6IFJvdzxDZWxsPixcbiAgICBvcHRzOiBJUmVuZGVyU2V0dGluZ3MsXG4gICAgbm9Cb3JkZXI/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGNvbnN0IHByZXZDZWxsOiBDZWxsIHwgdW5kZWZpbmVkID0gcm93W2NvbEluZGV4IC0gMV07XG5cbiAgICBjb25zdCBjZWxsOiBDZWxsID0gcm93W2NvbEluZGV4XTtcblxuICAgIGlmICghbm9Cb3JkZXIpIHtcbiAgICAgIGlmIChjb2xJbmRleCA9PT0gMCkge1xuICAgICAgICBpZiAoY2VsbC5nZXRCb3JkZXIoKSkge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubGVmdDtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNlbGwuZ2V0Qm9yZGVyKCkgfHwgcHJldkNlbGw/LmdldEJvcmRlcigpKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5taWRkbGU7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0cy5oYXNCb3JkZXIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gXCIgXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgbWF4TGVuZ3RoOiBudW1iZXIgPSBvcHRzLndpZHRoW2NvbEluZGV4XTtcblxuICAgIGNvbnN0IGNvbFNwYW46IG51bWJlciA9IGNlbGwuZ2V0Q29sU3BhbigpO1xuICAgIGlmIChjb2xTcGFuID4gMSkge1xuICAgICAgZm9yIChsZXQgbyA9IDE7IG8gPCBjb2xTcGFuOyBvKyspIHtcbiAgICAgICAgLy8gYWRkIHBhZGRpbmcgYW5kIHdpdGggb2YgbmV4dCBjZWxsXG4gICAgICAgIG1heExlbmd0aCArPSBvcHRzLndpZHRoW2NvbEluZGV4ICsgb10gKyBvcHRzLnBhZGRpbmdbY29sSW5kZXggKyBvXTtcbiAgICAgICAgaWYgKG9wdHMuaGFzQm9yZGVyKSB7XG4gICAgICAgICAgLy8gYWRkIHBhZGRpbmcgYWdhaW4gYW5kIGJvcmRlciB3aXRoXG4gICAgICAgICAgbWF4TGVuZ3RoICs9IG9wdHMucGFkZGluZ1tjb2xJbmRleCArIG9dICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHsgY3VycmVudCwgbmV4dCB9ID0gdGhpcy5yZW5kZXJDZWxsVmFsdWUoY2VsbCwgbWF4TGVuZ3RoKTtcblxuICAgIHJvd1tjb2xJbmRleF0uc2V0VmFsdWUobmV4dCk7XG5cbiAgICBpZiAob3B0cy5oYXNCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSBcIiBcIi5yZXBlYXQob3B0cy5wYWRkaW5nW2NvbEluZGV4XSk7XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGN1cnJlbnQ7XG5cbiAgICBpZiAob3B0cy5oYXNCb3JkZXIgfHwgY29sSW5kZXggPCBvcHRzLmNvbHVtbnMgLSAxKSB7XG4gICAgICByZXN1bHQgKz0gXCIgXCIucmVwZWF0KG9wdHMucGFkZGluZ1tjb2xJbmRleF0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIHNwZWNpZmllZCBsZW5ndGggb2YgY2VsbC4gUmV0dXJucyB0aGUgcmVuZGVyZWQgdmFsdWUgYW5kIGEgbmV3IGNlbGxcbiAgICogd2l0aCB0aGUgcmVzdCB2YWx1ZS5cbiAgICogQHBhcmFtIGNlbGwgICAgICBDZWxsIHRvIHJlbmRlci5cbiAgICogQHBhcmFtIG1heExlbmd0aCBNYXggbGVuZ3RoIG9mIGNvbnRlbnQgdG8gcmVuZGVyLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlckNlbGxWYWx1ZShcbiAgICBjZWxsOiBDZWxsLFxuICAgIG1heExlbmd0aDogbnVtYmVyLFxuICApOiB7IGN1cnJlbnQ6IHN0cmluZzsgbmV4dDogQ2VsbCB9IHtcbiAgICBjb25zdCBsZW5ndGg6IG51bWJlciA9IE1hdGgubWluKFxuICAgICAgbWF4TGVuZ3RoLFxuICAgICAgc3RyaXBDb2xvcihjZWxsLnRvU3RyaW5nKCkpLmxlbmd0aCxcbiAgICApO1xuICAgIGxldCB3b3Jkczogc3RyaW5nID0gY29uc3VtZVdvcmRzKGxlbmd0aCwgY2VsbC50b1N0cmluZygpKTtcblxuICAgIC8vIGJyZWFrIHdvcmQgaWYgd29yZCBpcyBsb25nZXIgdGhhbiBtYXggbGVuZ3RoXG4gICAgY29uc3QgYnJlYWtXb3JkID0gc3RyaXBDb2xvcih3b3JkcykubGVuZ3RoID4gbGVuZ3RoO1xuICAgIGlmIChicmVha1dvcmQpIHtcbiAgICAgIHdvcmRzID0gd29yZHMuc2xpY2UoMCwgbGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvLyBnZXQgbmV4dCBjb250ZW50IGFuZCByZW1vdmUgbGVhZGluZyBzcGFjZSBpZiBicmVha1dvcmQgaXMgbm90IHRydWVcbiAgICBjb25zdCBuZXh0ID0gY2VsbC50b1N0cmluZygpLnNsaWNlKHdvcmRzLmxlbmd0aCArIChicmVha1dvcmQgPyAwIDogMSkpO1xuICAgIGNvbnN0IGZpbGxMZW5ndGggPSBtYXhMZW5ndGggLSBzdHJpcENvbG9yKHdvcmRzKS5sZW5ndGg7XG5cbiAgICAvLyBBbGlnbiBjb250ZW50XG4gICAgY29uc3QgYWxpZ246IERpcmVjdGlvbiA9IGNlbGwuZ2V0QWxpZ24oKTtcbiAgICBsZXQgY3VycmVudDogc3RyaW5nO1xuICAgIGlmIChmaWxsTGVuZ3RoID09PSAwKSB7XG4gICAgICBjdXJyZW50ID0gd29yZHM7XG4gICAgfSBlbHNlIGlmIChhbGlnbiA9PT0gXCJsZWZ0XCIpIHtcbiAgICAgIGN1cnJlbnQgPSB3b3JkcyArIFwiIFwiLnJlcGVhdChmaWxsTGVuZ3RoKTtcbiAgICB9IGVsc2UgaWYgKGFsaWduID09PSBcImNlbnRlclwiKSB7XG4gICAgICBjdXJyZW50ID0gXCIgXCIucmVwZWF0KE1hdGguZmxvb3IoZmlsbExlbmd0aCAvIDIpKSArIHdvcmRzICtcbiAgICAgICAgXCIgXCIucmVwZWF0KE1hdGguY2VpbChmaWxsTGVuZ3RoIC8gMikpO1xuICAgIH0gZWxzZSBpZiAoYWxpZ24gPT09IFwicmlnaHRcIikge1xuICAgICAgY3VycmVudCA9IFwiIFwiLnJlcGVhdChmaWxsTGVuZ3RoKSArIHdvcmRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIGRpcmVjdGlvbjogXCIgKyBhbGlnbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQsXG4gICAgICBuZXh0OiBjZWxsLmNsb25lKG5leHQpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIGJvcmRlciByb3cuXG4gICAqIEBwYXJhbSBwcmV2Um93IFByZXZpb3VzIHJvdy5cbiAgICogQHBhcmFtIG5leHRSb3cgTmV4dCByb3cuXG4gICAqIEBwYXJhbSByb3dTcGFuIEN1cnJlbnQgcm93IHNwYW4uXG4gICAqIEBwYXJhbSBvcHRzICAgIFJlbmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlckJvcmRlclJvdyhcbiAgICBwcmV2Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQsXG4gICAgbmV4dFJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkLFxuICAgIHJvd1NwYW46IG51bWJlcltdLFxuICAgIG9wdHM6IElSZW5kZXJTZXR0aW5ncyxcbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gXCJcIjtcblxuICAgIGxldCBjb2xTcGFuID0gMTtcbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgb3B0cy5jb2x1bW5zOyBjb2xJbmRleCsrKSB7XG4gICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPiAxKSB7XG4gICAgICAgIGlmICghbmV4dFJvdykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgbGF5b3V0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xTcGFuID4gMSkge1xuICAgICAgICAgIGNvbFNwYW4tLTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyQm9yZGVyQ2VsbChcbiAgICAgICAgY29sSW5kZXgsXG4gICAgICAgIHByZXZSb3csXG4gICAgICAgIG5leHRSb3csXG4gICAgICAgIHJvd1NwYW4sXG4gICAgICAgIG9wdHMsXG4gICAgICApO1xuICAgICAgY29sU3BhbiA9IG5leHRSb3c/Lltjb2xJbmRleF0uZ2V0Q29sU3BhbigpID8/IDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5sZW5ndGggPyBcIiBcIi5yZXBlYXQodGhpcy5vcHRpb25zLmluZGVudCkgKyByZXN1bHQgKyBcIlxcblwiIDogXCJcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgYm9yZGVyIGNlbGwuXG4gICAqIEBwYXJhbSBjb2xJbmRleCAgQ3VycmVudCBpbmRleC5cbiAgICogQHBhcmFtIHByZXZSb3cgICBQcmV2aW91cyByb3cuXG4gICAqIEBwYXJhbSBuZXh0Um93ICAgTmV4dCByb3cuXG4gICAqIEBwYXJhbSByb3dTcGFuICAgQ3VycmVudCByb3cgc3Bhbi5cbiAgICogQHBhcmFtIG9wdHMgICAgICBSZW5kZXIgb3B0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCByZW5kZXJCb3JkZXJDZWxsKFxuICAgIGNvbEluZGV4OiBudW1iZXIsXG4gICAgcHJldlJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkLFxuICAgIG5leHRSb3c6IFJvdzxDZWxsPiB8IHVuZGVmaW5lZCxcbiAgICByb3dTcGFuOiBudW1iZXJbXSxcbiAgICBvcHRzOiBJUmVuZGVyU2V0dGluZ3MsXG4gICk6IHN0cmluZyB7XG4gICAgLy8gYTEgfCBiMVxuICAgIC8vIC0tLS0tLS1cbiAgICAvLyBhMiB8IGIyXG5cbiAgICBjb25zdCBhMTogQ2VsbCB8IHVuZGVmaW5lZCA9IHByZXZSb3c/Lltjb2xJbmRleCAtIDFdO1xuICAgIGNvbnN0IGEyOiBDZWxsIHwgdW5kZWZpbmVkID0gbmV4dFJvdz8uW2NvbEluZGV4IC0gMV07XG4gICAgY29uc3QgYjE6IENlbGwgfCB1bmRlZmluZWQgPSBwcmV2Um93Py5bY29sSW5kZXhdO1xuICAgIGNvbnN0IGIyOiBDZWxsIHwgdW5kZWZpbmVkID0gbmV4dFJvdz8uW2NvbEluZGV4XTtcblxuICAgIGNvbnN0IGExQm9yZGVyID0gISFhMT8uZ2V0Qm9yZGVyKCk7XG4gICAgY29uc3QgYTJCb3JkZXIgPSAhIWEyPy5nZXRCb3JkZXIoKTtcbiAgICBjb25zdCBiMUJvcmRlciA9ICEhYjE/LmdldEJvcmRlcigpO1xuICAgIGNvbnN0IGIyQm9yZGVyID0gISFiMj8uZ2V0Qm9yZGVyKCk7XG5cbiAgICBjb25zdCBoYXNDb2xTcGFuID0gKGNlbGw6IENlbGwgfCB1bmRlZmluZWQpOiBib29sZWFuID0+XG4gICAgICAoY2VsbD8uZ2V0Q29sU3BhbigpID8/IDEpID4gMTtcbiAgICBjb25zdCBoYXNSb3dTcGFuID0gKGNlbGw6IENlbGwgfCB1bmRlZmluZWQpOiBib29sZWFuID0+XG4gICAgICAoY2VsbD8uZ2V0Um93U3BhbigpID8/IDEpID4gMTtcblxuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gICAgaWYgKGNvbEluZGV4ID09PSAwKSB7XG4gICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPiAxKSB7XG4gICAgICAgIGlmIChiMUJvcmRlcikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubGVmdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gXCIgXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIgJiYgYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0TWlkO1xuICAgICAgfSBlbHNlIGlmIChiMUJvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbUxlZnQ7XG4gICAgICB9IGVsc2UgaWYgKGIyQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wTGVmdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNvbEluZGV4IDwgb3B0cy5jb2x1bW5zKSB7XG4gICAgICBpZiAoKGExQm9yZGVyICYmIGIyQm9yZGVyKSB8fCAoYjFCb3JkZXIgJiYgYTJCb3JkZXIpKSB7XG4gICAgICAgIGNvbnN0IGExQ29sU3BhbjogYm9vbGVhbiA9IGhhc0NvbFNwYW4oYTEpO1xuICAgICAgICBjb25zdCBhMkNvbFNwYW46IGJvb2xlYW4gPSBoYXNDb2xTcGFuKGEyKTtcbiAgICAgICAgY29uc3QgYjFDb2xTcGFuOiBib29sZWFuID0gaGFzQ29sU3BhbihiMSk7XG4gICAgICAgIGNvbnN0IGIyQ29sU3BhbjogYm9vbGVhbiA9IGhhc0NvbFNwYW4oYjIpO1xuXG4gICAgICAgIGNvbnN0IGExUm93U3BhbjogYm9vbGVhbiA9IGhhc1Jvd1NwYW4oYTEpO1xuICAgICAgICBjb25zdCBhMlJvd1NwYW46IGJvb2xlYW4gPSBoYXNSb3dTcGFuKGEyKTtcbiAgICAgICAgY29uc3QgYjFSb3dTcGFuOiBib29sZWFuID0gaGFzUm93U3BhbihiMSk7XG4gICAgICAgIGNvbnN0IGIyUm93U3BhbjogYm9vbGVhbiA9IGhhc1Jvd1NwYW4oYjIpO1xuXG4gICAgICAgIGNvbnN0IGhhc0FsbEJvcmRlciA9IGExQm9yZGVyICYmIGIyQm9yZGVyICYmIGIxQm9yZGVyICYmIGEyQm9yZGVyO1xuICAgICAgICBjb25zdCBoYXNBbGxSb3dTcGFuID0gYTFSb3dTcGFuICYmIGIxUm93U3BhbiAmJiBhMlJvd1NwYW4gJiYgYjJSb3dTcGFuO1xuICAgICAgICBjb25zdCBoYXNBbGxDb2xTcGFuID0gYTFDb2xTcGFuICYmIGIxQ29sU3BhbiAmJiBhMkNvbFNwYW4gJiYgYjJDb2xTcGFuO1xuXG4gICAgICAgIGlmIChoYXNBbGxSb3dTcGFuICYmIGhhc0FsbEJvcmRlcikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkZGxlO1xuICAgICAgICB9IGVsc2UgaWYgKGhhc0FsbENvbFNwYW4gJiYgaGFzQWxsQm9yZGVyICYmIGExID09PSBiMSAmJiBhMiA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLm1pZDtcbiAgICAgICAgfSBlbHNlIGlmIChhMUNvbFNwYW4gJiYgYjFDb2xTcGFuICYmIGExID09PSBiMSkge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wTWlkO1xuICAgICAgICB9IGVsc2UgaWYgKGEyQ29sU3BhbiAmJiBiMkNvbFNwYW4gJiYgYTIgPT09IGIyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5ib3R0b21NaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYTFSb3dTcGFuICYmIGEyUm93U3BhbiAmJiBhMSA9PT0gYTIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmxlZnRNaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYjFSb3dTcGFuICYmIGIyUm93U3BhbiAmJiBiMSA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0TWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkTWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGExQm9yZGVyICYmIGIxQm9yZGVyKSB7XG4gICAgICAgIGlmIChoYXNDb2xTcGFuKGExKSAmJiBoYXNDb2xTcGFuKGIxKSAmJiBhMSA9PT0gYjEpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbU1pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiMUJvcmRlciAmJiBiMkJvcmRlcikge1xuICAgICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPiAxKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubGVmdE1pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiMkJvcmRlciAmJiBhMkJvcmRlcikge1xuICAgICAgICBpZiAoaGFzQ29sU3BhbihhMikgJiYgaGFzQ29sU3BhbihiMikgJiYgYTIgPT09IGIyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BNaWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYTFCb3JkZXIgJiYgYTJCb3JkZXIpIHtcbiAgICAgICAgaWYgKGhhc1Jvd1NwYW4oYTEpICYmIGExID09PSBhMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodE1pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhMUJvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbVJpZ2h0O1xuICAgICAgfSBlbHNlIGlmIChiMUJvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbUxlZnQ7XG4gICAgICB9IGVsc2UgaWYgKGEyQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wUmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGIyQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wTGVmdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBsZW5ndGggPSBvcHRzLnBhZGRpbmdbY29sSW5kZXhdICsgb3B0cy53aWR0aFtjb2xJbmRleF0gK1xuICAgICAgb3B0cy5wYWRkaW5nW2NvbEluZGV4XTtcblxuICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEgJiYgbmV4dFJvdykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyQ2VsbChcbiAgICAgICAgY29sSW5kZXgsXG4gICAgICAgIG5leHRSb3csXG4gICAgICAgIG9wdHMsXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgICAgaWYgKG5leHRSb3dbY29sSW5kZXhdID09PSBuZXh0Um93W25leHRSb3cubGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gXCIgXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGIxQm9yZGVyICYmIGIyQm9yZGVyKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLm1pZC5yZXBlYXQobGVuZ3RoKTtcbiAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbS5yZXBlYXQobGVuZ3RoKTtcbiAgICB9IGVsc2UgaWYgKGIyQm9yZGVyKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnRvcC5yZXBlYXQobGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IFwiIFwiLnJlcGVhdChsZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChjb2xJbmRleCA9PT0gb3B0cy5jb2x1bW5zIC0gMSkge1xuICAgICAgaWYgKGIxQm9yZGVyICYmIGIyQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHRNaWQ7XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tUmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGIyQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wUmlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgKz0gXCIgXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxJQUFJLFFBQTBCLENBQVc7QUFDbEQsTUFBTSxHQUFHLFVBQVUsUUFBUSxDQUFXO0FB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