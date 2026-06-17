import esbuild from "esbuild";
import { builtinModules } from "node:module";
import process from "node:process";

const prod = process.argv[2] === "production";
const builtins = [...new Set(
	builtinModules.flatMap((moduleName) => {
		const normalized = moduleName.startsWith("node:") ? moduleName.slice(5) : moduleName;
		return [normalized, `node:${normalized}`];
	})
)];
const external = [
	"obsidian",
	"electron",
	"@codemirror/autocomplete",
	"@codemirror/collab",
	"@codemirror/commands",
	"@codemirror/language",
	"@codemirror/lint",
	"@codemirror/search",
	"@codemirror/state",
	"@codemirror/view",
	...builtins
];

const context = {
	banner: {
		js: "/* THIS FILE IS GENERATED. Edit src/main.ts instead. */"
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	external,
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: prod
};

if (prod) {
	esbuild.build(context).catch(() => process.exit(1));
} else {
	const buildContext = await esbuild.context(context);
	await buildContext.watch();
}
