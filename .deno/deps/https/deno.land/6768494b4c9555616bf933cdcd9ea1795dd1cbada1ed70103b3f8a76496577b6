import Declaration from "../declaration.js";
import * as utils from "../utils.js";

class BackgroundClip extends Declaration {
  constructor(name, prefixes, all) {
    super(name, prefixes, all);

    if (this.prefixes) {
      this.prefixes = utils.uniq(
        this.prefixes.map((i) => {
          return i === "-ms-" ? "-webkit-" : i;
        }),
      );
    }
  }

  check(decl) {
    return decl.value.toLowerCase() === "text";
  }
}

BackgroundClip.names = ["background-clip"];

export default BackgroundClip;
