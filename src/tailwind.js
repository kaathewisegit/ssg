import { promises as fs } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import chokidar from "chokidar"
import postcss from "postcss"

import config from "./config.js"
import { isProc } from "./util.js"

export async function run() {
	const css = await fs.readFile("style.css", "utf8")
	const result = await postcss([tailwindcss]).process(css, {
		from: "style.css",
		to: path.join(config.genAssets, "style.css"),
	})

	await fs.mkdir(config.genAssets, { recursive: true })
	await fs.writeFile(path.join(config.genAssets, "style.css"), result.css)
}

if (isProc()) {
	await config.init()
	await run()

	const watcher = chokidar.watch(
		["style.css", "pages/", "target/classes"],
		{
			persistent: true,
			ignoreInitial: true,
		},
	)

	watcher.on("all", async (_event, _filePath) => {
		await run()
		console.log("TailwindCSS updated")
	})
}
