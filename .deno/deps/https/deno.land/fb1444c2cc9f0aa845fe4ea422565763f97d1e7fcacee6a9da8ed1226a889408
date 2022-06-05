import { list } from "./deps.js";

/**
 * Throw special error, to tell beniary,
 * that this error is from Autoprefixer.
 */
export function error(text) {
  let err = new Error(text);
  err.autoprefixer = true;
  throw err;
}

/**
 * Return array, that doesn’t contain duplicates.
 */
export function uniq(array) {
  return [...new Set(array)];
}

/**
 * Return "-webkit-" on "-webkit- old"
 */
export function removeNote(string) {
  if (!string.includes(" ")) {
    return string;
  }

  return string.split(" ")[0];
}

/**
 * Escape RegExp symbols
 */
export function escapeRegexp(string) {
  return string.replace(/[$()*+-.?[\\\]^{|}]/g, "\\$&");
}

/**
 * Return regexp to check, that CSS string contain word
 */
export function regexp(word, escape = true) {
  if (escape) {
    word = this.escapeRegexp(word);
  }
  return new RegExp(`(^|[\\s,(])(${word}($|[\\s(,]))`, "gi");
}

/**
 * Change comma list
 */
export function editList(value, callback) {
  let origin = list.comma(value);
  let changed = callback(origin, []);

  if (origin === changed) {
    return value;
  }

  let join = value.match(/,\s*/);
  join = join ? join[0] : ", ";
  return changed.join(join);
}

/**
 * Split the selector into parts.
 * It returns 3 level deep array because selectors can be comma
 * separated (1), space separated (2), and combined (3)
 * @param {String} selector selector string
 * @return {Array<Array<Array>>} 3 level deep array of split selector
 * @see utils.test.js for examples
 */
export function splitSelector(selector) {
  return list.comma(selector).map((i) => {
    return list.space(i).map((k) => {
      return k.split(/(?=\.|#)/g);
    });
  });
}
