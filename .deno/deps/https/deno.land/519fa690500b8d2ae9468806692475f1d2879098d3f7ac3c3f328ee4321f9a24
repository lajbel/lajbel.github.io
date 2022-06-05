import Declaration from "../declaration.js";
import * as utils from "./grid-utils.js";

class PlaceSelf extends Declaration {
  /**
   * Translate place-self to separate -ms- prefixed properties
   */
  insert(decl, prefix, prefixes) {
    if (prefix !== "-ms-") return super.insert(decl, prefix, prefixes);

    // prevent doubling of prefixes
    if (decl.parent.some((i) => i.prop === "-ms-grid-row-align")) {
      return undefined;
    }

    let [[first, second]] = utils.parse(decl);

    if (second) {
      utils.insertDecl(decl, "grid-row-align", first);
      utils.insertDecl(decl, "grid-column-align", second);
    } else {
      utils.insertDecl(decl, "grid-row-align", first);
      utils.insertDecl(decl, "grid-column-align", first);
    }

    return undefined;
  }
}

PlaceSelf.names = ["place-self"];

export default PlaceSelf;
