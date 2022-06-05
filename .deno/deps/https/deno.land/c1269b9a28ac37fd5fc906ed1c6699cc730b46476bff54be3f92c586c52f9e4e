import Declaration from "../declaration.js";

class Filter extends Declaration {
  /**
   * Check is it Internet Explorer filter
   */
  check(decl) {
    let v = decl.value;
    return (
      !v.toLowerCase().includes("alpha(") &&
      !v.includes("DXImageTransform.Microsoft") &&
      !v.includes("data:image/svg+xml")
    );
  }
}

Filter.names = ["filter"];

export default Filter;
