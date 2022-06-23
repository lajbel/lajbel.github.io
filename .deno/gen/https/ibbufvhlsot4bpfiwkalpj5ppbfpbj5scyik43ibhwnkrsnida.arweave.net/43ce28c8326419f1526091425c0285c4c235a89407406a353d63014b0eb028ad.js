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
        return Row.from(row).border(this.table.getBorder(), false);
    }
    /**
   * Create a new cell from existing cell or cell value.
   * @param cell  Original cell.
   * @param row   Parent row.
   */ createCell(cell, row) {
        return Cell.from(cell ?? "").border(row.getBorder(), false);
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
        const current = words + " ".repeat(fillLength);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vaWJidWZ2aGxzb3Q0YnBmaXdrYWxwajVwcGJmcGJqNXNjeWlrNDNpYmh3bmtyc25pZGEuYXJ3ZWF2ZS5uZXQvUUVOQzFPdVRwOEM4cUxLQV90NmV2ZUVyd3A3SVdFSzV0QVQyYXFNbW9HTS90YWJsZS9sYXlvdXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2VsbCwgSUNlbGwgfSBmcm9tIFwiLi9jZWxsLnRzXCI7XG5pbXBvcnQgeyBzdHJpcENvbG9yIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgSVJvdywgUm93IH0gZnJvbSBcIi4vcm93LnRzXCI7XG5pbXBvcnQgdHlwZSB7IElCb3JkZXJPcHRpb25zLCBJVGFibGVTZXR0aW5ncywgVGFibGUgfSBmcm9tIFwiLi90YWJsZS50c1wiO1xuaW1wb3J0IHsgY29uc3VtZVdvcmRzLCBsb25nZXN0IH0gZnJvbSBcIi4vdXRpbHMudHNcIjtcblxuLyoqIExheW91dCByZW5kZXIgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgSVJlbmRlclNldHRpbmdzIHtcbiAgcGFkZGluZzogbnVtYmVyW107XG4gIHdpZHRoOiBudW1iZXJbXTtcbiAgY29sdW1uczogbnVtYmVyO1xuICBoYXNCb3JkZXI6IGJvb2xlYW47XG4gIGhhc0hlYWRlckJvcmRlcjogYm9vbGVhbjtcbiAgaGFzQm9keUJvcmRlcjogYm9vbGVhbjtcbiAgcm93czogUm93PENlbGw+W107XG59XG5cbi8qKiBUYWJsZSBsYXlvdXQgcmVuZGVyZXIuICovXG5leHBvcnQgY2xhc3MgVGFibGVMYXlvdXQge1xuICAvKipcbiAgICogVGFibGUgbGF5b3V0IGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0gdGFibGUgICBUYWJsZSBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgUmVuZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSB0YWJsZTogVGFibGUsXG4gICAgcHJpdmF0ZSBvcHRpb25zOiBJVGFibGVTZXR0aW5ncyxcbiAgKSB7fVxuXG4gIC8qKiBHZW5lcmF0ZSB0YWJsZSBzdHJpbmcuICovXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIGNvbnN0IG9wdHM6IElSZW5kZXJTZXR0aW5ncyA9IHRoaXMuY3JlYXRlTGF5b3V0KCk7XG4gICAgcmV0dXJuIG9wdHMucm93cy5sZW5ndGggPyB0aGlzLnJlbmRlclJvd3Mob3B0cykgOiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0YWJsZSBsYXlvdXQgaW5jbHVkaW5nIHJvdyBhbmQgY29sIHNwYW4sIGNvbnZlcnRzIGFsbCBub25lXG4gICAqIENlbGwvUm93IHZhbHVlcyB0byBDZWxsJ3MgYW5kIFJvdydzIGFuZCByZXR1cm5zIHRoZSBsYXlvdXQgcmVuZGVyaW5nXG4gICAqIHNldHRpbmdzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUxheW91dCgpOiBJUmVuZGVyU2V0dGluZ3Mge1xuICAgIE9iamVjdC5rZXlzKHRoaXMub3B0aW9ucy5jaGFycykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmNoYXJzW2tleSBhcyBrZXlvZiBJQm9yZGVyT3B0aW9uc10gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoYXJzW2tleSBhcyBrZXlvZiBJQm9yZGVyT3B0aW9uc10gPSBcIlwiO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaGFzQm9keUJvcmRlcjogYm9vbGVhbiA9IHRoaXMudGFibGUuZ2V0Qm9yZGVyKCkgfHxcbiAgICAgIHRoaXMudGFibGUuaGFzQm9keUJvcmRlcigpO1xuICAgIGNvbnN0IGhhc0hlYWRlckJvcmRlcjogYm9vbGVhbiA9IHRoaXMudGFibGUuaGFzSGVhZGVyQm9yZGVyKCk7XG4gICAgY29uc3QgaGFzQm9yZGVyOiBib29sZWFuID0gaGFzSGVhZGVyQm9yZGVyIHx8IGhhc0JvZHlCb3JkZXI7XG5cbiAgICBjb25zdCBoZWFkZXI6IFJvdyB8IHVuZGVmaW5lZCA9IHRoaXMudGFibGUuZ2V0SGVhZGVyKCk7XG4gICAgY29uc3Qgcm93czogUm93PENlbGw+W10gPSB0aGlzLnNwYW5Sb3dzKFxuICAgICAgaGVhZGVyID8gW2hlYWRlciwgLi4udGhpcy50YWJsZV0gOiB0aGlzLnRhYmxlLnNsaWNlKCksXG4gICAgKTtcbiAgICBjb25zdCBjb2x1bW5zOiBudW1iZXIgPSBNYXRoLm1heCguLi5yb3dzLm1hcCgocm93KSA9PiByb3cubGVuZ3RoKSk7XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgbGVuZ3RoOiBudW1iZXIgPSByb3cubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCA8IGNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgZGlmZiA9IGNvbHVtbnMgLSBsZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZjsgaSsrKSB7XG4gICAgICAgICAgcm93LnB1c2godGhpcy5jcmVhdGVDZWxsKG51bGwsIHJvdykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFkZGluZzogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCB3aWR0aDogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgY29sdW1uczsgY29sSW5kZXgrKykge1xuICAgICAgY29uc3QgbWluQ29sV2lkdGg6IG51bWJlciA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLm1pbkNvbFdpZHRoKVxuICAgICAgICA/IHRoaXMub3B0aW9ucy5taW5Db2xXaWR0aFtjb2xJbmRleF1cbiAgICAgICAgOiB0aGlzLm9wdGlvbnMubWluQ29sV2lkdGg7XG4gICAgICBjb25zdCBtYXhDb2xXaWR0aDogbnVtYmVyID0gQXJyYXkuaXNBcnJheSh0aGlzLm9wdGlvbnMubWF4Q29sV2lkdGgpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLm1heENvbFdpZHRoW2NvbEluZGV4XVxuICAgICAgICA6IHRoaXMub3B0aW9ucy5tYXhDb2xXaWR0aDtcbiAgICAgIGNvbnN0IGNvbFdpZHRoOiBudW1iZXIgPSBsb25nZXN0KGNvbEluZGV4LCByb3dzLCBtYXhDb2xXaWR0aCk7XG4gICAgICB3aWR0aFtjb2xJbmRleF0gPSBNYXRoLm1pbihtYXhDb2xXaWR0aCwgTWF0aC5tYXgobWluQ29sV2lkdGgsIGNvbFdpZHRoKSk7XG4gICAgICBwYWRkaW5nW2NvbEluZGV4XSA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnBhZGRpbmcpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLnBhZGRpbmdbY29sSW5kZXhdXG4gICAgICAgIDogdGhpcy5vcHRpb25zLnBhZGRpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhZGRpbmcsXG4gICAgICB3aWR0aCxcbiAgICAgIHJvd3MsXG4gICAgICBjb2x1bW5zLFxuICAgICAgaGFzQm9yZGVyLFxuICAgICAgaGFzQm9keUJvcmRlcixcbiAgICAgIGhhc0hlYWRlckJvcmRlcixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbGxzIHJvd3MgYW5kIGNvbHMgYnkgc3BlY2lmaWVkIHJvdy9jb2wgc3BhbiB3aXRoIGEgcmVmZXJlbmNlIG9mIHRoZVxuICAgKiBvcmlnaW5hbCBjZWxsLlxuICAgKlxuICAgKiBAcGFyYW0gX3Jvd3MgICAgIEFsbCB0YWJsZSByb3dzLlxuICAgKiBAcGFyYW0gcm93SW5kZXggIEN1cnJlbnQgcm93IGluZGV4LlxuICAgKiBAcGFyYW0gY29sSW5kZXggIEN1cnJlbnQgY29sIGluZGV4LlxuICAgKiBAcGFyYW0gcm93U3BhbiAgIEN1cnJlbnQgcm93IHNwYW4uXG4gICAqIEBwYXJhbSBjb2xTcGFuICAgQ3VycmVudCBjb2wgc3Bhbi5cbiAgICovXG4gIHByb3RlY3RlZCBzcGFuUm93cyhcbiAgICBfcm93czogSVJvd1tdLFxuICAgIHJvd0luZGV4ID0gMCxcbiAgICBjb2xJbmRleCA9IDAsXG4gICAgcm93U3BhbjogbnVtYmVyW10gPSBbXSxcbiAgICBjb2xTcGFuID0gMSxcbiAgKTogUm93PENlbGw+W10ge1xuICAgIGNvbnN0IHJvd3M6IFJvdzxDZWxsPltdID0gX3Jvd3MgYXMgUm93PENlbGw+W107XG5cbiAgICBpZiAocm93SW5kZXggPj0gcm93cy5sZW5ndGggJiYgcm93U3Bhbi5ldmVyeSgoc3BhbikgPT4gc3BhbiA9PT0gMSkpIHtcbiAgICAgIHJldHVybiByb3dzO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICByb3dzW3Jvd0luZGV4XSAmJiBjb2xJbmRleCA+PSByb3dzW3Jvd0luZGV4XS5sZW5ndGggJiZcbiAgICAgIGNvbEluZGV4ID49IHJvd1NwYW4ubGVuZ3RoICYmIGNvbFNwYW4gPT09IDFcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsICsrcm93SW5kZXgsIDAsIHJvd1NwYW4sIDEpO1xuICAgIH1cblxuICAgIGlmIChjb2xTcGFuID4gMSkge1xuICAgICAgY29sU3Bhbi0tO1xuICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSByb3dTcGFuW2NvbEluZGV4IC0gMV07XG4gICAgICByb3dzW3Jvd0luZGV4XS5zcGxpY2UoY29sSW5kZXggLSAxLCAwLCByb3dzW3Jvd0luZGV4XVtjb2xJbmRleCAtIDFdKTtcbiAgICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsIHJvd0luZGV4LCArK2NvbEluZGV4LCByb3dTcGFuLCBjb2xTcGFuKTtcbiAgICB9XG5cbiAgICBpZiAoY29sSW5kZXggPT09IDApIHtcbiAgICAgIHJvd3Nbcm93SW5kZXhdID0gdGhpcy5jcmVhdGVSb3cocm93c1tyb3dJbmRleF0gfHwgW10pO1xuICAgIH1cblxuICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgIHJvd1NwYW5bY29sSW5kZXhdLS07XG4gICAgICByb3dzW3Jvd0luZGV4XS5zcGxpY2UoY29sSW5kZXgsIDAsIHJvd3Nbcm93SW5kZXggLSAxXVtjb2xJbmRleF0pO1xuICAgICAgcmV0dXJuIHRoaXMuc3BhblJvd3Mocm93cywgcm93SW5kZXgsICsrY29sSW5kZXgsIHJvd1NwYW4sIGNvbFNwYW4pO1xuICAgIH1cblxuICAgIHJvd3Nbcm93SW5kZXhdW2NvbEluZGV4XSA9IHRoaXMuY3JlYXRlQ2VsbChcbiAgICAgIHJvd3Nbcm93SW5kZXhdW2NvbEluZGV4XSB8fCBudWxsLFxuICAgICAgcm93c1tyb3dJbmRleF0sXG4gICAgKTtcblxuICAgIGNvbFNwYW4gPSByb3dzW3Jvd0luZGV4XVtjb2xJbmRleF0uZ2V0Q29sU3BhbigpO1xuICAgIHJvd1NwYW5bY29sSW5kZXhdID0gcm93c1tyb3dJbmRleF1bY29sSW5kZXhdLmdldFJvd1NwYW4oKTtcblxuICAgIHJldHVybiB0aGlzLnNwYW5Sb3dzKHJvd3MsIHJvd0luZGV4LCArK2NvbEluZGV4LCByb3dTcGFuLCBjb2xTcGFuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm93IGZyb20gZXhpc3Rpbmcgcm93IG9yIGNlbGwgYXJyYXkuXG4gICAqIEBwYXJhbSByb3cgT3JpZ2luYWwgcm93LlxuICAgKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZVJvdyhyb3c6IElSb3cpOiBSb3c8Q2VsbD4ge1xuICAgIHJldHVybiBSb3cuZnJvbShyb3cpLmJvcmRlcih0aGlzLnRhYmxlLmdldEJvcmRlcigpLCBmYWxzZSkgYXMgUm93PENlbGw+O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBjZWxsIGZyb20gZXhpc3RpbmcgY2VsbCBvciBjZWxsIHZhbHVlLlxuICAgKiBAcGFyYW0gY2VsbCAgT3JpZ2luYWwgY2VsbC5cbiAgICogQHBhcmFtIHJvdyAgIFBhcmVudCByb3cuXG4gICAqL1xuICBwcm90ZWN0ZWQgY3JlYXRlQ2VsbChjZWxsOiBJQ2VsbCB8IG51bGwsIHJvdzogUm93KTogQ2VsbCB7XG4gICAgcmV0dXJuIENlbGwuZnJvbShjZWxsID8/IFwiXCIpLmJvcmRlcihyb3cuZ2V0Qm9yZGVyKCksIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgdGFibGUgbGF5b3V0LlxuICAgKiBAcGFyYW0gb3B0cyBSZW5kZXIgb3B0aW9ucy5cbiAgICovXG4gIHByb3RlY3RlZCByZW5kZXJSb3dzKG9wdHM6IElSZW5kZXJTZXR0aW5ncyk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgY29uc3Qgcm93U3BhbjogbnVtYmVyW10gPSBuZXcgQXJyYXkob3B0cy5jb2x1bW5zKS5maWxsKDEpO1xuXG4gICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IG9wdHMucm93cy5sZW5ndGg7IHJvd0luZGV4KyspIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclJvdyhyb3dTcGFuLCByb3dJbmRleCwgb3B0cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5zbGljZSgwLCAtMSk7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gICAgIEN1cnJlbnQgcm93IHNwYW4uXG4gICAqIEBwYXJhbSByb3dJbmRleCAgICBDdXJyZW50IHJvdyBpbmRleC5cbiAgICogQHBhcmFtIG9wdHMgICAgICAgIFJlbmRlciBvcHRpb25zLlxuICAgKiBAcGFyYW0gaXNNdWx0aWxpbmUgSXMgbXVsdGlsaW5lIHJvdy5cbiAgICovXG4gIHByb3RlY3RlZCByZW5kZXJSb3coXG4gICAgcm93U3BhbjogbnVtYmVyW10sXG4gICAgcm93SW5kZXg6IG51bWJlcixcbiAgICBvcHRzOiBJUmVuZGVyU2V0dGluZ3MsXG4gICAgaXNNdWx0aWxpbmU/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHJvdzogUm93PENlbGw+ID0gb3B0cy5yb3dzW3Jvd0luZGV4XTtcbiAgICBjb25zdCBwcmV2Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQgPSBvcHRzLnJvd3Nbcm93SW5kZXggLSAxXTtcbiAgICBjb25zdCBuZXh0Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQgPSBvcHRzLnJvd3Nbcm93SW5kZXggKyAxXTtcbiAgICBsZXQgcmVzdWx0ID0gXCJcIjtcblxuICAgIGxldCBjb2xTcGFuID0gMTtcblxuICAgIC8vIGJvcmRlciB0b3Agcm93XG4gICAgaWYgKCFpc011bHRpbGluZSAmJiByb3dJbmRleCA9PT0gMCAmJiByb3cuaGFzQm9yZGVyKCkpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlckJvcmRlclJvdyh1bmRlZmluZWQsIHJvdywgcm93U3Bhbiwgb3B0cyk7XG4gICAgfVxuXG4gICAgbGV0IGlzTXVsdGlsaW5lUm93ID0gZmFsc2U7XG5cbiAgICByZXN1bHQgKz0gXCIgXCIucmVwZWF0KHRoaXMub3B0aW9ucy5pbmRlbnQgfHwgMCk7XG5cbiAgICBmb3IgKGxldCBjb2xJbmRleCA9IDA7IGNvbEluZGV4IDwgb3B0cy5jb2x1bW5zOyBjb2xJbmRleCsrKSB7XG4gICAgICBpZiAoY29sU3BhbiA+IDEpIHtcbiAgICAgICAgY29sU3Bhbi0tO1xuICAgICAgICByb3dTcGFuW2NvbEluZGV4XSA9IHJvd1NwYW5bY29sSW5kZXggLSAxXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlckNlbGwoY29sSW5kZXgsIHJvdywgb3B0cyk7XG5cbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKCFpc011bHRpbGluZSkge1xuICAgICAgICAgIHJvd1NwYW5bY29sSW5kZXhdLS07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXByZXZSb3cgfHwgcHJldlJvd1tjb2xJbmRleF0gIT09IHJvd1tjb2xJbmRleF0pIHtcbiAgICAgICAgcm93U3Bhbltjb2xJbmRleF0gPSByb3dbY29sSW5kZXhdLmdldFJvd1NwYW4oKTtcbiAgICAgIH1cblxuICAgICAgY29sU3BhbiA9IHJvd1tjb2xJbmRleF0uZ2V0Q29sU3BhbigpO1xuXG4gICAgICBpZiAocm93U3Bhbltjb2xJbmRleF0gPT09IDEgJiYgcm93W2NvbEluZGV4XS5sZW5ndGgpIHtcbiAgICAgICAgaXNNdWx0aWxpbmVSb3cgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmNvbHVtbnMgPiAwKSB7XG4gICAgICBpZiAocm93W29wdHMuY29sdW1ucyAtIDFdLmdldEJvcmRlcigpKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKG9wdHMuaGFzQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXN1bHQgKz0gXCJcXG5cIjtcblxuICAgIGlmIChpc011bHRpbGluZVJvdykgeyAvLyBza2lwIGJvcmRlclxuICAgICAgcmV0dXJuIHJlc3VsdCArIHRoaXMucmVuZGVyUm93KHJvd1NwYW4sIHJvd0luZGV4LCBvcHRzLCBpc011bHRpbGluZVJvdyk7XG4gICAgfVxuXG4gICAgLy8gYm9yZGVyIG1pZCByb3dcbiAgICBpZiAoXG4gICAgICAocm93SW5kZXggPT09IDAgJiYgb3B0cy5oYXNIZWFkZXJCb3JkZXIpIHx8XG4gICAgICAocm93SW5kZXggPCBvcHRzLnJvd3MubGVuZ3RoIC0gMSAmJiBvcHRzLmhhc0JvZHlCb3JkZXIpXG4gICAgKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJSb3cocm93LCBuZXh0Um93LCByb3dTcGFuLCBvcHRzKTtcbiAgICB9XG5cbiAgICAvLyBib3JkZXIgYm90dG9tIHJvd1xuICAgIGlmIChyb3dJbmRleCA9PT0gb3B0cy5yb3dzLmxlbmd0aCAtIDEgJiYgcm93Lmhhc0JvcmRlcigpKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJSb3cocm93LCB1bmRlZmluZWQsIHJvd1NwYW4sIG9wdHMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIGNlbGwuXG4gICAqIEBwYXJhbSBjb2xJbmRleCAgQ3VycmVudCBjb2wgaW5kZXguXG4gICAqIEBwYXJhbSByb3cgICAgICAgQ3VycmVudCByb3cuXG4gICAqIEBwYXJhbSBvcHRzICAgICAgUmVuZGVyIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBub0JvcmRlciAgRGlzYWJsZSBib3JkZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQ2VsbChcbiAgICBjb2xJbmRleDogbnVtYmVyLFxuICAgIHJvdzogUm93PENlbGw+LFxuICAgIG9wdHM6IElSZW5kZXJTZXR0aW5ncyxcbiAgICBub0JvcmRlcj86IGJvb2xlYW4sXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgY29uc3QgcHJldkNlbGw6IENlbGwgfCB1bmRlZmluZWQgPSByb3dbY29sSW5kZXggLSAxXTtcblxuICAgIGNvbnN0IGNlbGw6IENlbGwgPSByb3dbY29sSW5kZXhdO1xuXG4gICAgaWYgKCFub0JvcmRlcikge1xuICAgICAgaWYgKGNvbEluZGV4ID09PSAwKSB7XG4gICAgICAgIGlmIChjZWxsLmdldEJvcmRlcigpKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0O1xuICAgICAgICB9IGVsc2UgaWYgKG9wdHMuaGFzQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2VsbC5nZXRCb3JkZXIoKSB8fCBwcmV2Q2VsbD8uZ2V0Qm9yZGVyKCkpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLm1pZGRsZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBtYXhMZW5ndGg6IG51bWJlciA9IG9wdHMud2lkdGhbY29sSW5kZXhdO1xuXG4gICAgY29uc3QgY29sU3BhbjogbnVtYmVyID0gY2VsbC5nZXRDb2xTcGFuKCk7XG4gICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICBmb3IgKGxldCBvID0gMTsgbyA8IGNvbFNwYW47IG8rKykge1xuICAgICAgICAvLyBhZGQgcGFkZGluZyBhbmQgd2l0aCBvZiBuZXh0IGNlbGxcbiAgICAgICAgbWF4TGVuZ3RoICs9IG9wdHMud2lkdGhbY29sSW5kZXggKyBvXSArIG9wdHMucGFkZGluZ1tjb2xJbmRleCArIG9dO1xuICAgICAgICBpZiAob3B0cy5oYXNCb3JkZXIpIHtcbiAgICAgICAgICAvLyBhZGQgcGFkZGluZyBhZ2FpbiBhbmQgYm9yZGVyIHdpdGhcbiAgICAgICAgICBtYXhMZW5ndGggKz0gb3B0cy5wYWRkaW5nW2NvbEluZGV4ICsgb10gKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgeyBjdXJyZW50LCBuZXh0IH0gPSB0aGlzLnJlbmRlckNlbGxWYWx1ZShjZWxsLCBtYXhMZW5ndGgpO1xuXG4gICAgcm93W2NvbEluZGV4XS5zZXRWYWx1ZShuZXh0KTtcblxuICAgIGlmIChvcHRzLmhhc0JvcmRlcikge1xuICAgICAgcmVzdWx0ICs9IFwiIFwiLnJlcGVhdChvcHRzLnBhZGRpbmdbY29sSW5kZXhdKTtcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gY3VycmVudDtcblxuICAgIGlmIChvcHRzLmhhc0JvcmRlciB8fCBjb2xJbmRleCA8IG9wdHMuY29sdW1ucyAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBcIiBcIi5yZXBlYXQob3B0cy5wYWRkaW5nW2NvbEluZGV4XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgc3BlY2lmaWVkIGxlbmd0aCBvZiBjZWxsLiBSZXR1cm5zIHRoZSByZW5kZXJlZCB2YWx1ZSBhbmQgYSBuZXcgY2VsbFxuICAgKiB3aXRoIHRoZSByZXN0IHZhbHVlLlxuICAgKiBAcGFyYW0gY2VsbCAgICAgIENlbGwgdG8gcmVuZGVyLlxuICAgKiBAcGFyYW0gbWF4TGVuZ3RoIE1heCBsZW5ndGggb2YgY29udGVudCB0byByZW5kZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQ2VsbFZhbHVlKFxuICAgIGNlbGw6IENlbGwsXG4gICAgbWF4TGVuZ3RoOiBudW1iZXIsXG4gICk6IHsgY3VycmVudDogc3RyaW5nOyBuZXh0OiBDZWxsIH0ge1xuICAgIGNvbnN0IGxlbmd0aDogbnVtYmVyID0gTWF0aC5taW4oXG4gICAgICBtYXhMZW5ndGgsXG4gICAgICBzdHJpcENvbG9yKGNlbGwudG9TdHJpbmcoKSkubGVuZ3RoLFxuICAgICk7XG4gICAgbGV0IHdvcmRzOiBzdHJpbmcgPSBjb25zdW1lV29yZHMobGVuZ3RoLCBjZWxsLnRvU3RyaW5nKCkpO1xuXG4gICAgLy8gYnJlYWsgd29yZCBpZiB3b3JkIGlzIGxvbmdlciB0aGFuIG1heCBsZW5ndGhcbiAgICBjb25zdCBicmVha1dvcmQgPSBzdHJpcENvbG9yKHdvcmRzKS5sZW5ndGggPiBsZW5ndGg7XG4gICAgaWYgKGJyZWFrV29yZCkge1xuICAgICAgd29yZHMgPSB3b3Jkcy5zbGljZSgwLCBsZW5ndGgpO1xuICAgIH1cblxuICAgIC8vIGdldCBuZXh0IGNvbnRlbnQgYW5kIHJlbW92ZSBsZWFkaW5nIHNwYWNlIGlmIGJyZWFrV29yZCBpcyBub3QgdHJ1ZVxuICAgIGNvbnN0IG5leHQgPSBjZWxsLnRvU3RyaW5nKCkuc2xpY2Uod29yZHMubGVuZ3RoICsgKGJyZWFrV29yZCA/IDAgOiAxKSk7XG4gICAgY29uc3QgZmlsbExlbmd0aCA9IG1heExlbmd0aCAtIHN0cmlwQ29sb3Iod29yZHMpLmxlbmd0aDtcbiAgICBjb25zdCBjdXJyZW50ID0gd29yZHMgKyBcIiBcIi5yZXBlYXQoZmlsbExlbmd0aCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudCxcbiAgICAgIG5leHQ6IGNlbGwuY2xvbmUobmV4dCksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgYm9yZGVyIHJvdy5cbiAgICogQHBhcmFtIHByZXZSb3cgUHJldmlvdXMgcm93LlxuICAgKiBAcGFyYW0gbmV4dFJvdyBOZXh0IHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gQ3VycmVudCByb3cgc3Bhbi5cbiAgICogQHBhcmFtIG9wdHMgICAgUmVuZGVyIG9wdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyQm9yZGVyUm93KFxuICAgIHByZXZSb3c6IFJvdzxDZWxsPiB8IHVuZGVmaW5lZCxcbiAgICBuZXh0Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQsXG4gICAgcm93U3BhbjogbnVtYmVyW10sXG4gICAgb3B0czogSVJlbmRlclNldHRpbmdzLFxuICApOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gICAgbGV0IGNvbFNwYW4gPSAxO1xuICAgIGZvciAobGV0IGNvbEluZGV4ID0gMDsgY29sSW5kZXggPCBvcHRzLmNvbHVtbnM7IGNvbEluZGV4KyspIHtcbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKCFuZXh0Um93KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBsYXlvdXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbFNwYW4gPiAxKSB7XG4gICAgICAgICAgY29sU3Bhbi0tO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJCb3JkZXJDZWxsKFxuICAgICAgICBjb2xJbmRleCxcbiAgICAgICAgcHJldlJvdyxcbiAgICAgICAgbmV4dFJvdyxcbiAgICAgICAgcm93U3BhbixcbiAgICAgICAgb3B0cyxcbiAgICAgICk7XG4gICAgICBjb2xTcGFuID0gbmV4dFJvdz8uW2NvbEluZGV4XS5nZXRDb2xTcGFuKCkgPz8gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0Lmxlbmd0aCA/IFwiIFwiLnJlcGVhdCh0aGlzLm9wdGlvbnMuaW5kZW50KSArIHJlc3VsdCArIFwiXFxuXCIgOiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBib3JkZXIgY2VsbC5cbiAgICogQHBhcmFtIGNvbEluZGV4ICBDdXJyZW50IGluZGV4LlxuICAgKiBAcGFyYW0gcHJldlJvdyAgIFByZXZpb3VzIHJvdy5cbiAgICogQHBhcmFtIG5leHRSb3cgICBOZXh0IHJvdy5cbiAgICogQHBhcmFtIHJvd1NwYW4gICBDdXJyZW50IHJvdyBzcGFuLlxuICAgKiBAcGFyYW0gb3B0cyAgICAgIFJlbmRlciBvcHRpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlbmRlckJvcmRlckNlbGwoXG4gICAgY29sSW5kZXg6IG51bWJlcixcbiAgICBwcmV2Um93OiBSb3c8Q2VsbD4gfCB1bmRlZmluZWQsXG4gICAgbmV4dFJvdzogUm93PENlbGw+IHwgdW5kZWZpbmVkLFxuICAgIHJvd1NwYW46IG51bWJlcltdLFxuICAgIG9wdHM6IElSZW5kZXJTZXR0aW5ncyxcbiAgKTogc3RyaW5nIHtcbiAgICAvLyBhMSB8IGIxXG4gICAgLy8gLS0tLS0tLVxuICAgIC8vIGEyIHwgYjJcblxuICAgIGNvbnN0IGExOiBDZWxsIHwgdW5kZWZpbmVkID0gcHJldlJvdz8uW2NvbEluZGV4IC0gMV07XG4gICAgY29uc3QgYTI6IENlbGwgfCB1bmRlZmluZWQgPSBuZXh0Um93Py5bY29sSW5kZXggLSAxXTtcbiAgICBjb25zdCBiMTogQ2VsbCB8IHVuZGVmaW5lZCA9IHByZXZSb3c/Lltjb2xJbmRleF07XG4gICAgY29uc3QgYjI6IENlbGwgfCB1bmRlZmluZWQgPSBuZXh0Um93Py5bY29sSW5kZXhdO1xuXG4gICAgY29uc3QgYTFCb3JkZXIgPSAhIWExPy5nZXRCb3JkZXIoKTtcbiAgICBjb25zdCBhMkJvcmRlciA9ICEhYTI/LmdldEJvcmRlcigpO1xuICAgIGNvbnN0IGIxQm9yZGVyID0gISFiMT8uZ2V0Qm9yZGVyKCk7XG4gICAgY29uc3QgYjJCb3JkZXIgPSAhIWIyPy5nZXRCb3JkZXIoKTtcblxuICAgIGNvbnN0IGhhc0NvbFNwYW4gPSAoY2VsbDogQ2VsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT5cbiAgICAgIChjZWxsPy5nZXRDb2xTcGFuKCkgPz8gMSkgPiAxO1xuICAgIGNvbnN0IGhhc1Jvd1NwYW4gPSAoY2VsbDogQ2VsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT5cbiAgICAgIChjZWxsPy5nZXRSb3dTcGFuKCkgPz8gMSkgPiAxO1xuXG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG5cbiAgICBpZiAoY29sSW5kZXggPT09IDApIHtcbiAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiMUJvcmRlciAmJiBiMkJvcmRlcikge1xuICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmxlZnRNaWQ7XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTGVmdDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29sSW5kZXggPCBvcHRzLmNvbHVtbnMpIHtcbiAgICAgIGlmICgoYTFCb3JkZXIgJiYgYjJCb3JkZXIpIHx8IChiMUJvcmRlciAmJiBhMkJvcmRlcikpIHtcbiAgICAgICAgY29uc3QgYTFDb2xTcGFuOiBib29sZWFuID0gaGFzQ29sU3BhbihhMSk7XG4gICAgICAgIGNvbnN0IGEyQ29sU3BhbjogYm9vbGVhbiA9IGhhc0NvbFNwYW4oYTIpO1xuICAgICAgICBjb25zdCBiMUNvbFNwYW46IGJvb2xlYW4gPSBoYXNDb2xTcGFuKGIxKTtcbiAgICAgICAgY29uc3QgYjJDb2xTcGFuOiBib29sZWFuID0gaGFzQ29sU3BhbihiMik7XG5cbiAgICAgICAgY29uc3QgYTFSb3dTcGFuOiBib29sZWFuID0gaGFzUm93U3BhbihhMSk7XG4gICAgICAgIGNvbnN0IGEyUm93U3BhbjogYm9vbGVhbiA9IGhhc1Jvd1NwYW4oYTIpO1xuICAgICAgICBjb25zdCBiMVJvd1NwYW46IGJvb2xlYW4gPSBoYXNSb3dTcGFuKGIxKTtcbiAgICAgICAgY29uc3QgYjJSb3dTcGFuOiBib29sZWFuID0gaGFzUm93U3BhbihiMik7XG5cbiAgICAgICAgY29uc3QgaGFzQWxsQm9yZGVyID0gYTFCb3JkZXIgJiYgYjJCb3JkZXIgJiYgYjFCb3JkZXIgJiYgYTJCb3JkZXI7XG4gICAgICAgIGNvbnN0IGhhc0FsbFJvd1NwYW4gPSBhMVJvd1NwYW4gJiYgYjFSb3dTcGFuICYmIGEyUm93U3BhbiAmJiBiMlJvd1NwYW47XG4gICAgICAgIGNvbnN0IGhhc0FsbENvbFNwYW4gPSBhMUNvbFNwYW4gJiYgYjFDb2xTcGFuICYmIGEyQ29sU3BhbiAmJiBiMkNvbFNwYW47XG5cbiAgICAgICAgaWYgKGhhc0FsbFJvd1NwYW4gJiYgaGFzQWxsQm9yZGVyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5taWRkbGU7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzQWxsQ29sU3BhbiAmJiBoYXNBbGxCb3JkZXIgJiYgYTEgPT09IGIxICYmIGEyID09PSBiMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkO1xuICAgICAgICB9IGVsc2UgaWYgKGExQ29sU3BhbiAmJiBiMUNvbFNwYW4gJiYgYTEgPT09IGIxKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BNaWQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYTJDb2xTcGFuICYmIGIyQ29sU3BhbiAmJiBhMiA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmJvdHRvbU1pZDtcbiAgICAgICAgfSBlbHNlIGlmIChhMVJvd1NwYW4gJiYgYTJSb3dTcGFuICYmIGExID09PSBhMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubGVmdE1pZDtcbiAgICAgICAgfSBlbHNlIGlmIChiMVJvd1NwYW4gJiYgYjJSb3dTcGFuICYmIGIxID09PSBiMikge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMucmlnaHRNaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5taWRNaWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYTFCb3JkZXIgJiYgYjFCb3JkZXIpIHtcbiAgICAgICAgaWYgKGhhc0NvbFNwYW4oYTEpICYmIGhhc0NvbFNwYW4oYjEpICYmIGExID09PSBiMSkge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyICYmIGIyQm9yZGVyKSB7XG4gICAgICAgIGlmIChyb3dTcGFuW2NvbEluZGV4XSA+IDEpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLmxlZnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5sZWZ0TWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGIyQm9yZGVyICYmIGEyQm9yZGVyKSB7XG4gICAgICAgIGlmIChoYXNDb2xTcGFuKGEyKSAmJiBoYXNDb2xTcGFuKGIyKSAmJiBhMiA9PT0gYjIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnRvcE1pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhMUJvcmRlciAmJiBhMkJvcmRlcikge1xuICAgICAgICBpZiAoaGFzUm93U3BhbihhMSkgJiYgYTEgPT09IGEyKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0TWlkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGExQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tUmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGIxQm9yZGVyKSB7XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tTGVmdDtcbiAgICAgIH0gZWxzZSBpZiAoYTJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BSaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiIFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxlbmd0aCA9IG9wdHMucGFkZGluZ1tjb2xJbmRleF0gKyBvcHRzLndpZHRoW2NvbEluZGV4XSArXG4gICAgICBvcHRzLnBhZGRpbmdbY29sSW5kZXhdO1xuXG4gICAgaWYgKHJvd1NwYW5bY29sSW5kZXhdID4gMSAmJiBuZXh0Um93KSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJDZWxsKFxuICAgICAgICBjb2xJbmRleCxcbiAgICAgICAgbmV4dFJvdyxcbiAgICAgICAgb3B0cyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgICBpZiAobmV4dFJvd1tjb2xJbmRleF0gPT09IG5leHRSb3dbbmV4dFJvdy5sZW5ndGggLSAxXSkge1xuICAgICAgICBpZiAoYjFCb3JkZXIpIHtcbiAgICAgICAgICByZXN1bHQgKz0gdGhpcy5vcHRpb25zLmNoYXJzLnJpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIgJiYgYjJCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMubWlkLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMuYm90dG9tLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLm9wdGlvbnMuY2hhcnMudG9wLnJlcGVhdChsZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gXCIgXCIucmVwZWF0KGxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbEluZGV4ID09PSBvcHRzLmNvbHVtbnMgLSAxKSB7XG4gICAgICBpZiAoYjFCb3JkZXIgJiYgYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5yaWdodE1pZDtcbiAgICAgIH0gZWxzZSBpZiAoYjFCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy5ib3R0b21SaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoYjJCb3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IHRoaXMub3B0aW9ucy5jaGFycy50b3BSaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBcIiBcIjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLElBQUksUUFBZSxDQUFXO0FBQ3ZDLE1BQU0sR0FBRyxVQUFVLFFBQVEsQ0FBVztBQUN0QyxNQUFNLEdBQVMsR0FBRyxRQUFRLENBQVU7QUFFcEMsTUFBTSxHQUFHLFlBQVksRUFBRSxPQUFPLFFBQVEsQ0FBWTtBQWFsRCxFQUE2QixBQUE3Qix5QkFBNkIsQUFBN0IsRUFBNkIsQ0FDN0IsTUFBTSxPQUFPLFdBQVc7SUFPWixLQUFZO0lBQ1osT0FBdUI7SUFQakMsRUFJRyxBQUpIOzs7O0dBSUcsQUFKSCxFQUlHLGFBRU8sS0FBWSxFQUNaLE9BQXVCLENBQy9CLENBQUM7YUFGTyxLQUFZLEdBQVosS0FBWTthQUNaLE9BQXVCLEdBQXZCLE9BQXVCO0lBQzlCLENBQUM7SUFFSixFQUE2QixBQUE3Qix5QkFBNkIsQUFBN0IsRUFBNkIsQ0FDdEIsUUFBUSxHQUFXLENBQUM7UUFDekIsS0FBSyxDQUFDLElBQUksR0FBb0IsSUFBSSxDQUFDLFlBQVk7UUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUU7SUFDdEQsQ0FBQztJQUVELEVBSUcsQUFKSDs7OztHQUlHLEFBSkgsRUFJRyxDQUNPLFlBQVksR0FBb0IsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFD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