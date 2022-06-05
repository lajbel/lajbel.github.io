import vendor from "./vendor.js";
import Declaration from "./declaration.js";
import Resolution from "./resolution.js";
import Transition from "./transition.js";
import Processor from "./processor.js";
import Supports from "./supports.js";
import Browsers from "./browsers.js";
import Selector from "./selector.js";
import AtRule from "./at-rule.js";
import Value from "./value.js";
import * as utils from "./utils.js";
import hackFullscreen from "./hacks/fullscreen.js";
import hackPlaceholder from "./hacks/placeholder.js";
import hackPlaceholderShown from "./hacks/placeholder-shown.js";
import hackFlex from "./hacks/flex.js";
import hackOrder from "./hacks/order.js";
import hackFilter from "./hacks/filter.js";
import hackGridEnd from "./hacks/grid-end.js";
import hackAnimation from "./hacks/animation.js";
import hackFlexFlow from "./hacks/flex-flow.js";
import hackFlexGrow from "./hacks/flex-grow.js";
import hackFlexWrap from "./hacks/flex-wrap.js";
import hackGridArea from "./hacks/grid-area.js";
import hackPlaceSelf from "./hacks/place-self.js";
import hackGridStart from "./hacks/grid-start.js";
import hackAlignSelf from "./hacks/align-self.js";
import hackAppearance from "./hacks/appearance.js";
import hackFlexBasis from "./hacks/flex-basis.js";
import hackMaskBorder from "./hacks/mask-border.js";
import hackMaskComposite from "./hacks/mask-composite.js";
import hackAlignItems from "./hacks/align-items.js";
import hackUserSelect from "./hacks/user-select.js";
import hackFlexShrink from "./hacks/flex-shrink.js";
import hackBreakProps from "./hacks/break-props.js";
import hackColorAdjust from "./hacks/color-adjust.js";
import hackWritingMode from "./hacks/writing-mode.js";
import hackBorderImage from "./hacks/border-image.js";
import hackAlignContent from "./hacks/align-content.js";
import hackBorderRadius from "./hacks/border-radius.js";
import hackBlockLogical from "./hacks/block-logical.js";
import hackGridTemplate from "./hacks/grid-template.js";
import hackInlineLogical from "./hacks/inline-logical.js";
import hackGridRowAlign from "./hacks/grid-row-align.js";
import hackTransformDecl from "./hacks/transform-decl.js";
import hackFlexDirection from "./hacks/flex-direction.js";
import hackImageRendering from "./hacks/image-rendering.js";
import hackBackdropFilter from "./hacks/backdrop-filter.js";
import hackBackgroundClip from "./hacks/background-clip.js";
import hackTextDecoration from "./hacks/text-decoration.js";
import hackJustifyContent from "./hacks/justify-content.js";
import hackBackgroundSize from "./hacks/background-size.js";
import hackGridRowColumn from "./hacks/grid-row-column.js";
import hackGridRowsColumns from "./hacks/grid-rows-columns.js";
import hackGridColumnAlign from "./hacks/grid-column-align.js";
import hackOverscrollBehavior from "./hacks/overscroll-behavior.js";
import hackGridTemplateAreas from "./hacks/grid-template-areas.js";
import hackTextEmphasisPosition from "./hacks/text-emphasis-position.js";
import hackTextDecorationSkipInk from "./hacks/text-decoration-skip-ink.js";
import hackGradient from "./hacks/gradient.js";
import hackIntrinsic from "./hacks/intrinsic.js";
import hackPixelated from "./hacks/pixelated.js";
import hackImageSet from "./hacks/image-set.js";
import hackCrossFade from "./hacks/cross-fade.js";
import hackDisplayFlex from "./hacks/display-flex.js";
import hackDisplayGrid from "./hacks/display-grid.js";
import hackFilterValue from "./hacks/filter-value.js";

Selector.hack(hackFullscreen);
Selector.hack(hackPlaceholder);
Selector.hack(hackPlaceholderShown);
Declaration.hack(hackFlex);
Declaration.hack(hackOrder);
Declaration.hack(hackFilter);
Declaration.hack(hackGridEnd);
Declaration.hack(hackAnimation);
Declaration.hack(hackFlexFlow);
Declaration.hack(hackFlexGrow);
Declaration.hack(hackFlexWrap);
Declaration.hack(hackGridArea);
Declaration.hack(hackPlaceSelf);
Declaration.hack(hackGridStart);
Declaration.hack(hackAlignSelf);
Declaration.hack(hackAppearance);
Declaration.hack(hackFlexBasis);
Declaration.hack(hackMaskBorder);
Declaration.hack(hackMaskComposite);
Declaration.hack(hackAlignItems);
Declaration.hack(hackUserSelect);
Declaration.hack(hackFlexShrink);
Declaration.hack(hackBreakProps);
Declaration.hack(hackColorAdjust);
Declaration.hack(hackWritingMode);
Declaration.hack(hackBorderImage);
Declaration.hack(hackAlignContent);
Declaration.hack(hackBorderRadius);
Declaration.hack(hackBlockLogical);
Declaration.hack(hackGridTemplate);
Declaration.hack(hackInlineLogical);
Declaration.hack(hackGridRowAlign);
Declaration.hack(hackTransformDecl);
Declaration.hack(hackFlexDirection);
Declaration.hack(hackImageRendering);
Declaration.hack(hackBackdropFilter);
Declaration.hack(hackBackgroundClip);
Declaration.hack(hackTextDecoration);
Declaration.hack(hackJustifyContent);
Declaration.hack(hackBackgroundSize);
Declaration.hack(hackGridRowColumn);
Declaration.hack(hackGridRowsColumns);
Declaration.hack(hackGridColumnAlign);
Declaration.hack(hackOverscrollBehavior);
Declaration.hack(hackGridTemplateAreas);
Declaration.hack(hackTextEmphasisPosition);
Declaration.hack(hackTextDecorationSkipInk);
Value.hack(hackGradient);
Value.hack(hackIntrinsic);
Value.hack(hackPixelated);
Value.hack(hackImageSet);
Value.hack(hackCrossFade);
Value.hack(hackDisplayFlex);
Value.hack(hackDisplayGrid);
Value.hack(hackFilterValue);

let declsCache = new Map();

class Prefixes {
  constructor(data, browsers, options = {}) {
    this.data = data;
    this.browsers = browsers;
    this.options = options;
    [this.add, this.remove] = this.preprocess(this.select(this.data));
    this.transition = new Transition(this);
    this.processor = new Processor(this);
  }

  /**
   * Return clone instance to remove all prefixes
   */
  cleaner() {
    if (this.cleanerCache) {
      return this.cleanerCache;
    }

    if (this.browsers.selected.length) {
      let empty = new Browsers(this.browsers.data, []);
      this.cleanerCache = new Prefixes(this.data, empty, this.options);
    } else {
      return this;
    }

    return this.cleanerCache;
  }

  /**
   * Select prefixes from data, which is necessary for selected browsers
   */
  select(list) {
    let selected = { add: {}, remove: {} };

    for (let name in list) {
      let data = list[name];
      let add = data.browsers.map((i) => {
        let params = i.split(" ");
        return {
          browser: `${params[0]} ${params[1]}`,
          note: params[2],
        };
      });

      let notes = add
        .filter((i) => i.note)
        .map((i) => `${this.browsers.prefix(i.browser)} ${i.note}`);
      notes = utils.uniq(notes);

      add = add
        .filter((i) => this.browsers.isSelected(i.browser))
        .map((i) => {
          let prefix = this.browsers.prefix(i.browser);
          if (i.note) {
            return `${prefix} ${i.note}`;
          } else {
            return prefix;
          }
        });
      add = this.sort(utils.uniq(add));

      if (this.options.flexbox === "no-2009") {
        add = add.filter((i) => !i.includes("2009"));
      }

      let all = data.browsers.map((i) => this.browsers.prefix(i));
      if (data.mistakes) {
        all = all.concat(data.mistakes);
      }
      all = all.concat(notes);
      all = utils.uniq(all);

      if (add.length) {
        selected.add[name] = add;
        if (add.length < all.length) {
          selected.remove[name] = all.filter((i) => !add.includes(i));
        }
      } else {
        selected.remove[name] = all;
      }
    }

    return selected;
  }

  /**
   * Sort vendor prefixes
   */
  sort(prefixes) {
    return prefixes.sort((a, b) => {
      let aLength = utils.removeNote(a).length;
      let bLength = utils.removeNote(b).length;

      if (aLength === bLength) {
        return b.length - a.length;
      } else {
        return bLength - aLength;
      }
    });
  }

  /**
   * Cache prefixes data to fast CSS processing
   */
  preprocess(selected) {
    let add = {
      "selectors": [],
      "@supports": new Supports(Prefixes, this),
    };
    for (let name in selected.add) {
      let prefixes = selected.add[name];
      if (name === "@keyframes" || name === "@viewport") {
        add[name] = new AtRule(name, prefixes, this);
      } else if (name === "@resolution") {
        add[name] = new Resolution(name, prefixes, this);
      } else if (this.data[name].selector) {
        add.selectors.push(Selector.load(name, prefixes, this));
      } else {
        let props = this.data[name].props;

        if (props) {
          let value = Value.load(name, prefixes, this);
          for (let prop of props) {
            if (!add[prop]) {
              add[prop] = { values: [] };
            }
            add[prop].values.push(value);
          }
        } else {
          let values = (add[name] && add[name].values) || [];
          add[name] = Declaration.load(name, prefixes, this);
          add[name].values = values;
        }
      }
    }

    let remove = { selectors: [] };
    for (let name in selected.remove) {
      let prefixes = selected.remove[name];
      if (this.data[name].selector) {
        let selector = Selector.load(name, prefixes);
        for (let prefix of prefixes) {
          remove.selectors.push(selector.old(prefix));
        }
      } else if (name === "@keyframes" || name === "@viewport") {
        for (let prefix of prefixes) {
          let prefixed = `@${prefix}${name.slice(1)}`;
          remove[prefixed] = { remove: true };
        }
      } else if (name === "@resolution") {
        remove[name] = new Resolution(name, prefixes, this);
      } else {
        let props = this.data[name].props;
        if (props) {
          let value = Value.load(name, [], this);
          for (let prefix of prefixes) {
            let old = value.old(prefix);
            if (old) {
              for (let prop of props) {
                if (!remove[prop]) {
                  remove[prop] = {};
                }
                if (!remove[prop].values) {
                  remove[prop].values = [];
                }
                remove[prop].values.push(old);
              }
            }
          }
        } else {
          for (let p of prefixes) {
            let olds = this.decl(name).old(name, p);
            if (name === "align-self") {
              let a = add[name] && add[name].prefixes;
              if (a) {
                if (p === "-webkit- 2009" && a.includes("-webkit-")) {
                  continue;
                } else if (p === "-webkit-" && a.includes("-webkit- 2009")) {
                  continue;
                }
              }
            }
            for (let prefixed of olds) {
              if (!remove[prefixed]) {
                remove[prefixed] = {};
              }
              remove[prefixed].remove = true;
            }
          }
        }
      }
    }

    return [add, remove];
  }

  /**
   * Declaration loader with caching
   */
  decl(prop) {
    if (!declsCache.has(prop)) {
      declsCache.set(prop, Declaration.load(prop));
    }

    return declsCache.get(prop);
  }

  /**
   * Return unprefixed version of property
   */
  unprefixed(prop) {
    let value = this.normalize(vendor.unprefixed(prop));
    if (value === "flex-direction") {
      value = "flex-flow";
    }
    return value;
  }

  /**
   * Normalize prefix for remover
   */
  normalize(prop) {
    return this.decl(prop).normalize(prop);
  }

  /**
   * Return prefixed version of property
   */
  prefixed(prop, prefix) {
    prop = vendor.unprefixed(prop);
    return this.decl(prop).prefixed(prop, prefix);
  }

  /**
   * Return values, which must be prefixed in selected property
   */
  values(type, prop) {
    let data = this[type];

    let global = data["*"] && data["*"].values;
    let values = data[prop] && data[prop].values;

    if (global && values) {
      return utils.uniq(global.concat(values));
    } else {
      return global || values || [];
    }
  }

  /**
   * Group declaration by unprefixed property to check them
   */
  group(decl) {
    let rule = decl.parent;
    let index = rule.index(decl);
    let { length } = rule.nodes;
    let unprefixed = this.unprefixed(decl.prop);

    let checker = (step, callback) => {
      index += step;
      while (index >= 0 && index < length) {
        let other = rule.nodes[index];
        if (other.type === "decl") {
          if (step === -1 && other.prop === unprefixed) {
            if (!Browsers.withPrefix(other.value)) {
              break;
            }
          }

          if (this.unprefixed(other.prop) !== unprefixed) {
            break;
          } else if (callback(other) === true) {
            return true;
          }

          if (step === +1 && other.prop === unprefixed) {
            if (!Browsers.withPrefix(other.value)) {
              break;
            }
          }
        }

        index += step;
      }
      return false;
    };

    return {
      up(callback) {
        return checker(-1, callback);
      },
      down(callback) {
        return checker(+1, callback);
      },
    };
  }
}

export default Prefixes;
