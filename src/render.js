import { promises as fs } from "node:fs"
import path from "node:path"
import chokidar from "chokidar"

import config from "./config.js"
import { Page } from "./page.js"
import { isProc, silenceWarning } from "./util.js"

async function update(file) {
	const page = new Page(file)
	await page.write()
}

async function* pages(root = ".") {
	const pattern = path.join(root, "**/*.dj")
	const files = fs.glob(pattern)

	for await (const djotPath of files) {
		yield new Page(djotPath)
	}
}

export async function updateAll() {
	for await (const page of pages(config.pages)) {
		await page.write()
	}
}

silenceWarning("ExperimentalWarning")

if (isProc()) {
	await config.init()
	await updateAll()

	const watcher = chokidar.watch(config.pages, {
		persistent: true,
		ignoreInitial: true,
	})

	watcher.on("all", async (_event, file) => {
		switch (path.extname(file)) {
			case ".dj": {
				await update(file)
				console.log(`${file} updated`)
				break
			}
			case ".hbs": {
				const dir = path.dirname(file)
				for await (const page of pages(dir)) {
					await page.write()
				}
				console.log(`All files in ${dir}/ updated`)
			}
		}
	})
}
