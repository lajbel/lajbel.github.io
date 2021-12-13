import lume from "https:/deno.land/x/lume@v1.3.0/mod.ts";
import postcss from "https:/deno.land/x/lume@v1.3.0/plugins/postcss.ts";

const site = lume({
	src: "src/",
	dest: "docs/",
});

site.use(postcss());

export default site;
