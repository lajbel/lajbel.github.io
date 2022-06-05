import Declaration from "../declaration.js";

class ColorAdjust extends Declaration {
  /**
   * Change property name for WebKit-based browsers
   */
  prefixed(prop, prefix) {
    return prefix + "print-color-adjust";
  }

  /**
   * Return property name by spec
   */
  normalize() {
    return "color-adjust";
  }
}

ColorAdjust.names = ["color-adjust", "print-color-adjust"];

export default ColorAdjust;
