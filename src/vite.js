import path from "node:path"
import { build } from "vite"

import config from "./config.js"
import { isProc } from "./util.js"

export async function run() {
	if (config.vite?.entrypoints) {
		await build(viteConfig(config.vite?.entrypoints, false))
	}
}

export async function watch() {
	if (config.vite?.entrypoints) {
		await build(viteConfig(config.vite?.entrypoints, true))
	}
}

function viteConfig(entrypoints, watch) {
	return {
		plugins: config.vite?.plugins,
		build: {
			minify: false,
			outDir: path.join(config.genAssets, "vite/"),
			lib: {
				entry: entrypoints,
				fileName: (_format, entry) => `${entry}.js`,
				// only build ES
				formats: ["es"],
			},
			rollupOptions: {},
			...(watch && { watch: "./js/" }),
		},
	}
}

if (isProc()) {
	await config.init()

	await watch()
}
