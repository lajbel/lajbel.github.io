import Declaration from "../declaration.js";

class Animation extends Declaration {
  /**
   * Don’t add prefixes for modern values.
   */
  check(decl) {
    return !decl.value.split(/\s+/).some((i) => {
      let lower = i.toLowerCase();
      return lower === "reverse" || lower === "alternate-reverse";
    });
  }
}

Animation.names = ["animation", "animation-direction"];

export default Animation;
