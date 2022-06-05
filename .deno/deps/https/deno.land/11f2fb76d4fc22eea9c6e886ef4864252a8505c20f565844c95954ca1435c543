import Declaration from "../declaration.js";

class BackgroundSize extends Declaration {
  /**
   * Duplication parameter for -webkit- browsers
   */
  set(decl, prefix) {
    let value = decl.value.toLowerCase();
    if (
      prefix === "-webkit-" &&
      !value.includes(" ") &&
      value !== "contain" &&
      value !== "cover"
    ) {
      decl.value = decl.value + " " + decl.value;
    }
    return super.set(decl, prefix);
  }
}

BackgroundSize.names = ["background-size"];

export default BackgroundSize;
