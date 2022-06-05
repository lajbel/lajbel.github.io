import Selector from "../selector.js";

class PlaceholderShown extends Selector {
  /**
   * Return different selectors depend on prefix
   */
  prefixed(prefix) {
    if (prefix === "-ms-") {
      return ":-ms-input-placeholder";
    }
    return `:${prefix}placeholder-shown`;
  }
}

PlaceholderShown.names = [":placeholder-shown"];

export default PlaceholderShown;
