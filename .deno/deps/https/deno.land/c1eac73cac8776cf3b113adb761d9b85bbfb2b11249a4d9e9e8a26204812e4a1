import Declaration from "../declaration.js";

class GridRowAlign extends Declaration {
  /**
   * Do not prefix flexbox values
   */
  check(decl) {
    return !decl.value.includes("flex-") && decl.value !== "baseline";
  }

  /**
   * Change property name for IE
   */
  prefixed(prop, prefix) {
    return prefix + "grid-row-align";
  }

  /**
   * Change IE property back
   */
  normalize() {
    return "align-self";
  }
}

GridRowAlign.names = ["grid-row-align"];

export default GridRowAlign;
