import flexSpec from "./flex-spec.js";
import Declaration from "../declaration.js";

class FlexWrap extends Declaration {
  /**
   * Don't add prefix for 2009 spec
   */
  set(decl, prefix) {
    let spec = flexSpec(prefix)[0];
    if (spec !== 2009) {
      return super.set(decl, prefix);
    }
    return undefined;
  }
}

FlexWrap.names = ["flex-wrap"];

export default FlexWrap;
