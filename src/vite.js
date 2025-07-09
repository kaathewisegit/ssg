import path from "node:path"
import { build } from "vite"

import config from "./config.js"

async function run() {
	await build(vite_config(["js/main.js", "js/other.js"]))
}

function vite_config(files) {
	const entries = files.reduce((acc, file) => {
		const name = path.parse(file).name
		acc[name] = file
		return acc
	}, {})

	return {
		build: {
			minify: false,
			lib: {
				entry: entries,
				// only build ES
				fileName: (format, entry) => `${entry}.js`,
				formats: ["es"],
			},
			rollupOptions: {},
			outDir: path.join(config.gen_assets, "vite/"),
			watch: "./js/",
		},
	}
}

await config.init()
await run()
