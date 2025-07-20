import path from "node:path"
import { build } from "vite"

import config from "./config.js"
import { is_proc } from "./util.js"

export async function run() {
	if (config.viteEntrypoints.length > 0) {
		await build(vite_config(config.viteEntrypoints, false))
	}
}

export async function watch() {
	if (config.viteEntrypoints.length > 0) {
		await build(vite_config(config.viteEntrypoints, true))
	}
}

function vite_config(files, watch) {
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
				fileName: (_format, entry) => `${entry}.js`,
				formats: ["es"],
			},
			rollupOptions: {},
			outDir: path.join(config.gen_assets, "vite/"),
			...(watch && { watch: "./js/" }),
		},
	}
}

if (is_proc()) {
	await config.init()

	await run()
}
