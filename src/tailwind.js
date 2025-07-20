import { promises as fs } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import chokidar from "chokidar"
import postcss from "postcss"

import config from "./config.js"
import { is_proc } from "./util.js"

export async function run() {
	const css = await fs.readFile("style.css", "utf8")
	const result = postcss([tailwindcss]).process(css, {
		from: "style.css",
		to: path.join(config.gen_assets, "style.css"),
	})
	await result

	fs.writeFile(path.join(config.gen_assets, "style.css"), result.css)
}

if (is_proc()) {
	await config.init()
	await run()

	const watcher = chokidar.watch(
		["style.css", "pages/", "target/classes"],
		{
			persistent: true,
			ignoreInitial: true,
		},
	)

	watcher.on("all", async (_event, _file_path) => {
		await run()
		console.log("TailwindCSS updated")
	})
}
