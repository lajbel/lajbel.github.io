import lume from "https:/deno.land/x/lume@v1.3.0/mod.ts";
import postcss from "https:/deno.land/x/lume@v1.3.0/plugins/postcss.ts";
import bundler from "https:/deno.land/x/lume@v1.3.0/plugins/bundler.ts";

const site = lume({
	src: "src/",
	dest: "docs/",
});

site.use(postcss());
site.use(bundler());

site.copy("img");

export default site;
