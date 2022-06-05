import { feature as unpack } from "../lib/deps.js";

function browsersSort(a, b) {
  a = a.split(" ");
  b = b.split(" ");
  if (a[0] > b[0]) {
    return 1;
  } else if (a[0] < b[0]) {
    return -1;
  } else {
    return Math.sign(parseFloat(a[1]) - parseFloat(b[1]));
  }
}

// Convert Can I Use data
function f(data, opts, callback) {
  data = unpack(data);

  if (!callback) {
    [callback, opts] = [opts, {}];
  }

  let match = opts.match || /\sx($|\s)/;
  let need = [];

  for (let browser in data.stats) {
    let versions = data.stats[browser];
    for (let version in versions) {
      let support = versions[version];
      if (support.match(match)) {
        need.push(browser + " " + version);
      }
    }
  }

  callback(need.sort(browsersSort));
}

// Add data for all properties
let result = {};

function prefix(names, data) {
  for (let name of names) {
    result[name] = Object.assign({}, data);
  }
}

function add(names, data) {
  for (let name of names) {
    result[name].browsers = result[name].browsers
      .concat(data.browsers)
      .sort(browsersSort);
  }
}

export default result;

// Border Radius
import { prefixBorderRadius } from "../lib/deps.js";

f(prefixBorderRadius, (browsers) =>
  prefix(
    [
      "border-radius",
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius",
    ],
    {
      mistakes: ["-khtml-", "-ms-", "-o-"],
      feature: "border-radius",
      browsers,
    },
  ));

// Box Shadow
import { prefixBoxshadow } from "../lib/deps.js";

f(prefixBoxshadow, (browsers) =>
  prefix(["box-shadow"], {
    mistakes: ["-khtml-"],
    feature: "css-boxshadow",
    browsers,
  }));

// Animation
import { prefixAnimation } from "../lib/deps.js";

f(prefixAnimation, (browsers) =>
  prefix(
    [
      "animation",
      "animation-name",
      "animation-duration",
      "animation-delay",
      "animation-direction",
      "animation-fill-mode",
      "animation-iteration-count",
      "animation-play-state",
      "animation-timing-function",
      "@keyframes",
    ],
    {
      mistakes: ["-khtml-", "-ms-"],
      feature: "css-animation",
      browsers,
    },
  ));

// Transition
import { prefixTransition } from "../lib/deps.js";

f(prefixTransition, (browsers) =>
  prefix(
    [
      "transition",
      "transition-property",
      "transition-duration",
      "transition-delay",
      "transition-timing-function",
    ],
    {
      mistakes: ["-khtml-", "-ms-"],
      browsers,
      feature: "css-transitions",
    },
  ));

// Transform 2D
import { prefixTransform2d } from "../lib/deps.js";

f(prefixTransform2d, (browsers) =>
  prefix(["transform", "transform-origin"], {
    feature: "transforms2d",
    browsers,
  }));

// Transform 3D
import { prefixTransforms3d } from "../lib/deps.js";

f(prefixTransforms3d, (browsers) => {
  prefix(["perspective", "perspective-origin"], {
    feature: "transforms3d",
    browsers,
  });
  return prefix(["transform-style"], {
    mistakes: ["-ms-", "-o-"],
    browsers,
    feature: "transforms3d",
  });
});

f(
  prefixTransforms3d,
  { match: /y\sx|y\s#2/ },
  (browsers) =>
    prefix(["backface-visibility"], {
      mistakes: ["-ms-", "-o-"],
      feature: "transforms3d",
      browsers,
    }),
);

// Gradients
import { prefixGradients } from "../lib/deps.js";

f(prefixGradients, { match: /y\sx/ }, (browsers) =>
  prefix(
    [
      "linear-gradient",
      "repeating-linear-gradient",
      "radial-gradient",
      "repeating-radial-gradient",
    ],
    {
      props: [
        "background",
        "background-image",
        "border-image",
        "mask",
        "list-style",
        "list-style-image",
        "content",
        "mask-image",
      ],
      mistakes: ["-ms-"],
      feature: "css-gradients",
      browsers,
    },
  ));

f(prefixGradients, { match: /a\sx/ }, (browsers) => {
  browsers = browsers.map((i) => {
    if (/firefox|op/.test(i)) {
      return i;
    } else {
      return `${i} old`;
    }
  });
  return add(
    [
      "linear-gradient",
      "repeating-linear-gradient",
      "radial-gradient",
      "repeating-radial-gradient",
    ],
    {
      feature: "css-gradients",
      browsers,
    },
  );
});

// Box sizing
import { prefixBoxsizing } from "../lib/deps.js";

f(prefixBoxsizing, (browsers) =>
  prefix(["box-sizing"], {
    feature: "css3-boxsizing",
    browsers,
  }));

// Filter Effects
import { prefixFilters } from "../lib/deps.js";

f(prefixFilters, (browsers) =>
  prefix(["filter"], {
    feature: "css-filters",
    browsers,
  }));

// filter() function
import { prefixFilterFunction } from "../lib/deps.js";

f(prefixFilterFunction, (browsers) =>
  prefix(["filter-function"], {
    props: [
      "background",
      "background-image",
      "border-image",
      "mask",
      "list-style",
      "list-style-image",
      "content",
      "mask-image",
    ],
    feature: "css-filter-function",
    browsers,
  }));

// Backdrop-filter
import { prefixBackdrop } from "../lib/deps.js";

f(
  prefixBackdrop,
  { match: /y\sx|y\s#2/ },
  (browsers) =>
    prefix(["backdrop-filter"], {
      feature: "css-backdrop-filter",
      browsers,
    }),
);

// element() function
import { prefixElementFunction } from "../lib/deps.js";

f(prefixElementFunction, (browsers) =>
  prefix(["element"], {
    props: [
      "background",
      "background-image",
      "border-image",
      "mask",
      "list-style",
      "list-style-image",
      "content",
      "mask-image",
    ],
    feature: "css-element-function",
    browsers,
  }));

// Multicolumns
import { prefixMulticolumns } from "../lib/deps.js";

f(prefixMulticolumns, (browsers) => {
  prefix(
    [
      "columns",
      "column-width",
      "column-gap",
      "column-rule",
      "column-rule-color",
      "column-rule-width",
      "column-count",
      "column-rule-style",
      "column-span",
      "column-fill",
    ],
    {
      feature: "multicolumn",
      browsers,
    },
  );

  let noff = browsers.filter((i) => !/firefox/.test(i));
  prefix(["break-before", "break-after", "break-inside"], {
    feature: "multicolumn",
    browsers: noff,
  });
});

// User select
import { prefixUserSelect } from "../lib/deps.js";

f(prefixUserSelect, (browsers) =>
  prefix(["user-select"], {
    mistakes: ["-khtml-"],
    feature: "user-select-none",
    browsers,
  }));

// Flexible Box Layout
import { prefixFlexbox } from "../lib/deps.js";

f(prefixFlexbox, { match: /a\sx/ }, (browsers) => {
  browsers = browsers.map((i) => {
    if (/ie|firefox/.test(i)) {
      return i;
    } else {
      return `${i} 2009`;
    }
  });
  prefix(["display-flex", "inline-flex"], {
    props: ["display"],
    feature: "flexbox",
    browsers,
  });
  prefix(["flex", "flex-grow", "flex-shrink", "flex-basis"], {
    feature: "flexbox",
    browsers,
  });
  prefix(
    [
      "flex-direction",
      "flex-wrap",
      "flex-flow",
      "justify-content",
      "order",
      "align-items",
      "align-self",
      "align-content",
    ],
    {
      feature: "flexbox",
      browsers,
    },
  );
});

f(prefixFlexbox, { match: /y\sx/ }, (browsers) => {
  add(["display-flex", "inline-flex"], {
    feature: "flexbox",
    browsers,
  });
  add(["flex", "flex-grow", "flex-shrink", "flex-basis"], {
    feature: "flexbox",
    browsers,
  });
  add(
    [
      "flex-direction",
      "flex-wrap",
      "flex-flow",
      "justify-content",
      "order",
      "align-items",
      "align-self",
      "align-content",
    ],
    {
      feature: "flexbox",
      browsers,
    },
  );
});

// calc() unit
import { prefixCalc } from "../lib/deps.js";

f(prefixCalc, (browsers) =>
  prefix(["calc"], {
    props: ["*"],
    feature: "calc",
    browsers,
  }));

// Background options
import { prefixBackgroundOptions } from "../lib/deps.js";

f(
  prefixBackgroundOptions,
  (browsers) =>
    prefix(["background-origin", "background-size"], {
      feature: "background-img-opts",
      browsers,
    }),
);

// background-clip: text
import { prefixBackgroundClipText } from "../lib/deps.js";

f(prefixBackgroundClipText, (browsers) =>
  prefix(["background-clip"], {
    feature: "background-clip-text",
    browsers,
  }));

// Font feature settings
import { prefixFontFeature } from "../lib/deps.js";

f(prefixFontFeature, (browsers) =>
  prefix(
    [
      "font-feature-settings",
      "font-variant-ligatures",
      "font-language-override",
    ],
    {
      feature: "font-feature",
      browsers,
    },
  ));

// CSS font-kerning property
import { prefixFontKerning } from "../lib/deps.js";

f(prefixFontKerning, (browsers) =>
  prefix(["font-kerning"], {
    feature: "font-kerning",
    browsers,
  }));

// Border image
import { prefixBorderImage } from "../lib/deps.js";

f(prefixBorderImage, (browsers) =>
  prefix(["border-image"], {
    feature: "border-image",
    browsers,
  }));

// Selection selector
import { prefixSelection } from "../lib/deps.js";

f(prefixSelection, (browsers) =>
  prefix(["::selection"], {
    selector: true,
    feature: "css-selection",
    browsers,
  }));

// Placeholder selector
import { prefixPlaceholder } from "../lib/deps.js";

f(prefixPlaceholder, (browsers) => {
  prefix(["::placeholder"], {
    selector: true,
    feature: "css-placeholder",
    browsers: browsers.concat(["ie 10 old", "ie 11 old", "firefox 18 old"]),
  });
});

// Placeholder-shown selector
import { prefixPlaceholderShown } from "../lib/deps.js";

f(prefixPlaceholderShown, (browsers) => {
  prefix([":placeholder-shown"], {
    selector: true,
    feature: "css-placeholder-shown",
    browsers,
  });
});

// Hyphenation
import { prefixHyphens } from "../lib/deps.js";

f(prefixHyphens, (browsers) =>
  prefix(["hyphens"], {
    feature: "css-hyphens",
    browsers,
  }));

// Fullscreen selector
import { prefixFullscreen } from "../lib/deps.js";

f(prefixFullscreen, (browsers) =>
  prefix([":fullscreen"], {
    selector: true,
    feature: "fullscreen",
    browsers,
  }));

f(
  prefixFullscreen,
  { match: /x(\s#2|$)/ },
  (browsers) =>
    prefix(["::backdrop"], {
      selector: true,
      feature: "fullscreen",
      browsers,
    }),
);

// Tab size
import { prefixTabsize } from "../lib/deps.js";

f(prefixTabsize, (browsers) =>
  prefix(["tab-size"], {
    feature: "css3-tabsize",
    browsers,
  }));

// Intrinsic & extrinsic sizing
import { prefixIntrinsic } from "../lib/deps.js";

let sizeProps = [
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "inline-size",
  "min-inline-size",
  "max-inline-size",
  "block-size",
  "min-block-size",
  "max-block-size",
  "grid",
  "grid-template",
  "grid-template-rows",
  "grid-template-columns",
  "grid-auto-columns",
  "grid-auto-rows",
];

f(prefixIntrinsic, (browsers) =>
  prefix(["max-content", "min-content"], {
    props: sizeProps,
    feature: "intrinsic-width",
    browsers,
  }));

f(
  prefixIntrinsic,
  { match: /x|\s#4/ },
  (browsers) =>
    prefix(["fill", "fill-available", "stretch"], {
      props: sizeProps,
      feature: "intrinsic-width",
      browsers,
    }),
);

f(prefixIntrinsic, { match: /x|\s#5/ }, (browsers) =>
  prefix(["fit-content"], {
    props: sizeProps,
    feature: "intrinsic-width",
    browsers,
  }));

// Zoom cursors
import { prefixCursorsNewer } from "../lib/deps.js";

f(prefixCursorsNewer, (browsers) =>
  prefix(["zoom-in", "zoom-out"], {
    props: ["cursor"],
    feature: "css3-cursors-newer",
    browsers,
  }));

// Grab cursors
import { prefixCursorsGrab } from "../lib/deps.js";

f(prefixCursorsGrab, (browsers) =>
  prefix(["grab", "grabbing"], {
    props: ["cursor"],
    feature: "css3-cursors-grab",
    browsers,
  }));

// Sticky position
import { prefixSticky } from "../lib/deps.js";

f(prefixSticky, (browsers) =>
  prefix(["sticky"], {
    props: ["position"],
    feature: "css-sticky",
    browsers,
  }));

// Pointer Events
import { prefixPointer } from "../lib/deps.js";

f(prefixPointer, (browsers) =>
  prefix(["touch-action"], {
    feature: "pointer",
    browsers,
  }));

// Text decoration
import { prefixDecoration } from "../lib/deps.js";

f(prefixDecoration, (browsers) =>
  prefix(
    [
      "text-decoration-style",
      "text-decoration-color",
      "text-decoration-line",
      "text-decoration",
    ],
    {
      feature: "text-decoration",
      browsers,
    },
  ));

f(
  prefixDecoration,
  { match: /x.*#[235]/ },
  (browsers) =>
    prefix(["text-decoration-skip", "text-decoration-skip-ink"], {
      feature: "text-decoration",
      browsers,
    }),
);

// Text Size Adjust
import { prefixTextSizeAdjust } from "../lib/deps.js";

f(prefixTextSizeAdjust, (browsers) =>
  prefix(["text-size-adjust"], {
    feature: "text-size-adjust",
    browsers,
  }));

// CSS Masks
import { prefixCssMasks } from "../lib/deps.js";

f(prefixCssMasks, (browsers) => {
  prefix(
    [
      "mask-clip",
      "mask-composite",
      "mask-image",
      "mask-origin",
      "mask-repeat",
      "mask-border-repeat",
      "mask-border-source",
    ],
    {
      feature: "css-masks",
      browsers,
    },
  );
  prefix(
    [
      "mask",
      "mask-position",
      "mask-size",
      "mask-border",
      "mask-border-outset",
      "mask-border-width",
      "mask-border-slice",
    ],
    {
      feature: "css-masks",
      browsers,
    },
  );
});

// CSS clip-path property
import { prefixClipPath } from "../lib/deps.js";

f(prefixClipPath, (browsers) =>
  prefix(["clip-path"], {
    feature: "css-clip-path",
    browsers,
  }));

// Fragmented Borders and Backgrounds
import { prefixBoxdecoration } from "../lib/deps.js";

f(prefixBoxdecoration, (browsers) =>
  prefix(["box-decoration-break"], {
    feature: "css-boxdecorationbreak",
    browsers,
  }));

// CSS3 object-fit/object-position
import { prefixObjectFit } from "../lib/deps.js";

f(prefixObjectFit, (browsers) =>
  prefix(["object-fit", "object-position"], {
    feature: "object-fit",
    browsers,
  }));

// CSS Shapes
import { prefixShapes } from "../lib/deps.js";

f(
  prefixShapes,
  (browsers) =>
    prefix(["shape-margin", "shape-outside", "shape-image-threshold"], {
      feature: "css-shapes",
      browsers,
    }),
);

// CSS3 text-overflow
import { prefixTextOverflow } from "../lib/deps.js";

f(prefixTextOverflow, (browsers) =>
  prefix(["text-overflow"], {
    feature: "text-overflow",
    browsers,
  }));

// Viewport at-rule
import { prefixDeviceadaptation } from "../lib/deps.js";

f(prefixDeviceadaptation, (browsers) =>
  prefix(["@viewport"], {
    feature: "css-deviceadaptation",
    browsers,
  }));

// Resolution Media Queries
import { prefixResolut } from "../lib/deps.js";

f(
  prefixResolut,
  { match: /( x($| )|a #2)/ },
  (browsers) =>
    prefix(["@resolution"], {
      feature: "css-media-resolution",
      browsers,
    }),
);

// CSS text-align-last
import { prefixTextAlignLast } from "../lib/deps.js";

f(prefixTextAlignLast, (browsers) =>
  prefix(["text-align-last"], {
    feature: "css-text-align-last",
    browsers,
  }));

// Crisp Edges Image Rendering Algorithm
import { prefixCrispedges } from "../lib/deps.js";

f(
  prefixCrispedges,
  { match: /y x|a x #1/ },
  (browsers) =>
    prefix(["pixelated"], {
      props: ["image-rendering"],
      feature: "css-crisp-edges",
      browsers,
    }),
);

f(
  prefixCrispedges,
  { match: /a x #2/ },
  (browsers) =>
    prefix(["image-rendering"], {
      feature: "css-crisp-edges",
      browsers,
    }),
);

// Logical Properties
import { prefixLogicalProps } from "../lib/deps.js";

f(prefixLogicalProps, (browsers) =>
  prefix(
    [
      "border-inline-start",
      "border-inline-end",
      "margin-inline-start",
      "margin-inline-end",
      "padding-inline-start",
      "padding-inline-end",
    ],
    {
      feature: "css-logical-props",
      browsers,
    },
  ));

f(prefixLogicalProps, { match: /x\s#2/ }, (browsers) =>
  prefix(
    [
      "border-block-start",
      "border-block-end",
      "margin-block-start",
      "margin-block-end",
      "padding-block-start",
      "padding-block-end",
    ],
    {
      feature: "css-logical-props",
      browsers,
    },
  ));

// CSS appearance
import { prefixAppearance } from "../lib/deps.js";

f(prefixAppearance, { match: /#2|x/ }, (browsers) =>
  prefix(["appearance"], {
    feature: "css-appearance",
    browsers,
  }));

// CSS Scroll snap points
import { prefixSnappoints } from "../lib/deps.js";

f(prefixSnappoints, (browsers) =>
  prefix(
    [
      "scroll-snap-type",
      "scroll-snap-coordinate",
      "scroll-snap-destination",
      "scroll-snap-points-x",
      "scroll-snap-points-y",
    ],
    {
      feature: "css-snappoints",
      browsers,
    },
  ));

// CSS Regions
import { prefixRegions } from "../lib/deps.js";

f(
  prefixRegions,
  (browsers) =>
    prefix(["flow-into", "flow-from", "region-fragment"], {
      feature: "css-regions",
      browsers,
    }),
);

// CSS image-set
import { prefixImageSet } from "../lib/deps.js";

f(prefixImageSet, (browsers) =>
  prefix(["image-set"], {
    props: [
      "background",
      "background-image",
      "border-image",
      "cursor",
      "mask",
      "mask-image",
      "list-style",
      "list-style-image",
      "content",
    ],
    feature: "css-image-set",
    browsers,
  }));

// Writing Mode
import { prefixWritingMode } from "../lib/deps.js";

f(prefixWritingMode, { match: /a|x/ }, (browsers) =>
  prefix(["writing-mode"], {
    feature: "css-writing-mode",
    browsers,
  }));

// Cross-Fade Function
import { prefixCrossFade } from "../lib/deps.js";

f(prefixCrossFade, (browsers) =>
  prefix(["cross-fade"], {
    props: [
      "background",
      "background-image",
      "border-image",
      "mask",
      "list-style",
      "list-style-image",
      "content",
      "mask-image",
    ],
    feature: "css-cross-fade",
    browsers,
  }));

// Read Only selector
import { prefixReadOnly } from "../lib/deps.js";

f(prefixReadOnly, (browsers) =>
  prefix([":read-only", ":read-write"], {
    selector: true,
    feature: "css-read-only-write",
    browsers,
  }));

// Text Emphasize
import { prefixTextEmphasis } from "../lib/deps.js";

f(prefixTextEmphasis, (browsers) =>
  prefix(
    [
      "text-emphasis",
      "text-emphasis-position",
      "text-emphasis-style",
      "text-emphasis-color",
    ],
    {
      feature: "text-emphasis",
      browsers,
    },
  ));

// CSS Grid Layout
import { prefixGrid } from "../lib/deps.js";

f(prefixGrid, (browsers) => {
  prefix(["display-grid", "inline-grid"], {
    props: ["display"],
    feature: "css-grid",
    browsers,
  });
  prefix(
    [
      "grid-template-columns",
      "grid-template-rows",
      "grid-row-start",
      "grid-column-start",
      "grid-row-end",
      "grid-column-end",
      "grid-row",
      "grid-column",
      "grid-area",
      "grid-template",
      "grid-template-areas",
      "place-self",
    ],
    {
      feature: "css-grid",
      browsers,
    },
  );
});

f(
  prefixGrid,
  { match: /a x/ },
  (browsers) =>
    prefix(["grid-column-align", "grid-row-align"], {
      feature: "css-grid",
      browsers,
    }),
);

// CSS text-spacing
import { prefixTextSpacing } from "../lib/deps.js";

f(prefixTextSpacing, (browsers) =>
  prefix(["text-spacing"], {
    feature: "css-text-spacing",
    browsers,
  }));

// :any-link selector
import { prefixAnyLink } from "../lib/deps.js";

f(prefixAnyLink, (browsers) =>
  prefix([":any-link"], {
    selector: true,
    feature: "css-any-link",
    browsers,
  }));

// unicode-bidi
import { prefixBidi } from "../lib/deps.js";

f(prefixBidi, (browsers) =>
  prefix(["isolate"], {
    props: ["unicode-bidi"],
    feature: "css-unicode-bidi",
    browsers,
  }));

f(prefixBidi, { match: /y x|a x #2/ }, (browsers) =>
  prefix(["plaintext"], {
    props: ["unicode-bidi"],
    feature: "css-unicode-bidi",
    browsers,
  }));

f(prefixBidi, { match: /y x/ }, (browsers) =>
  prefix(["isolate-override"], {
    props: ["unicode-bidi"],
    feature: "css-unicode-bidi",
    browsers,
  }));

// overscroll-behavior selector
import { prefixOverscroll } from "../lib/deps.js";

f(
  prefixOverscroll,
  { match: /a #1/ },
  (browsers) =>
    prefix(["overscroll-behavior"], {
      feature: "css-overscroll-behavior",
      browsers,
    }),
);

// color-adjust
import { prefixColorAdjust } from "../lib/deps.js";

f(prefixColorAdjust, (browsers) =>
  prefix(["color-adjust"], {
    feature: "css-color-adjust",
    browsers,
  }));

// text-orientation
import { prefixTextOrientation } from "../lib/deps.js";

f(prefixTextOrientation, (browsers) =>
  prefix(["text-orientation"], {
    feature: "css-text-orientation",
    browsers,
  }));
