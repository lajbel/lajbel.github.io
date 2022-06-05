import Declaration from "../declaration.js";

const BASIC = [
  "none",
  "underline",
  "overline",
  "line-through",
  "blink",
  "inherit",
  "initial",
  "unset",
];

class TextDecoration extends Declaration {
  /**
   * Do not add prefixes for basic values.
   */
  check(decl) {
    return decl.value.split(/\s+/).some((i) => !BASIC.includes(i));
  }
}

TextDecoration.names = ["text-decoration"];

export default TextDecoration;
