import Declaration from "../declaration.js";
import * as utils from "../utils.js";

class BackdropFilter extends Declaration {
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
}

BackdropFilter.names = ["backdrop-filter"];

export default BackdropFilter;
