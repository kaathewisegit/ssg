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

async function* pages() {
	const pattern = path.join(config.pages, "**/*.dj")
	const files = fs.glob(pattern)

	for await (const djotPath of files) {
		yield new Page(djotPath)
	}
}

export async function updateAll() {
	for await (const page of pages()) {
		await page.write()
	}
}

silenceWarning("ExperimentalWarning")

if (isProc()) {
	await config.init()
	await fs.rm(config.target, { recursive: true, force: true })
	await updateAll()

	const watcher = chokidar.watch("pages/", {
		persistent: true,
		ignoreInitial: true,
	})

	watcher.on("all", async (_event, file) => {
		if (path.extname(file) === ".dj") {
			await update(file)
			console.log(`${file} updated`)
		}
	})
}
