import Selector from "../selector.js";

class Fullscreen extends Selector {
  /**
   * Return different selectors depend on prefix
   */
  prefixed(prefix) {
    if (prefix === "-webkit-") {
      return ":-webkit-full-screen";
    }
    if (prefix === "-moz-") {
      return ":-moz-full-screen";
    }
    return `:${prefix}fullscreen`;
  }
}

Fullscreen.names = [":fullscreen"];

export default Fullscreen;
