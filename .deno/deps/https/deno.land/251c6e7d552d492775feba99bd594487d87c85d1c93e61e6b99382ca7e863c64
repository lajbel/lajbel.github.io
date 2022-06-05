import Declaration from "../declaration.js";

class BorderImage extends Declaration {
  /**
   * Remove fill parameter for prefixed declarations
   */
  set(decl, prefix) {
    decl.value = decl.value.replace(/\s+fill(\s)/, "$1");
    return super.set(decl, prefix);
  }
}

BorderImage.names = ["border-image"];

export default BorderImage;
