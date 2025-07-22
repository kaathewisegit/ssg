import fs from "node:fs/promises"
import chokidar from "chokidar"

import config from "./config.js"
import { fileExists, isProc } from "./util.js"

export async function copyAll() {
	if (!fileExists(config.static)) {
		return
	}

	try {
		await fs.mkdir(config.assetsStatic, { recursive: true })
	} catch (_) {}
	await fs.cp(config.static, config.assetsStatic, { recursive: true })
}

if (isProc()) {
	await config.init()
	await copyAll()

	const watcher = chokidar.watch(config.static, {
		persistent: true,
		ignoreInitial: true,
	})

	watcher.on("all", async (_event, _file) => {
		copyAll()
	})
}
