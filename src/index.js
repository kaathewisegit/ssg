import { fork } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import chokidar from "chokidar"

import { Page } from "./page.js"

const originalEmitWarning = process.emitWarning
process.emitWarning = (warning, type, code, ctor) => {
	if (type === "ExperimentalWarning") {
		return
	}
	originalEmitWarning(warning, type, code, ctor)
}

export async function* pages(base = "pages/") {
	const pattern = path.join(base, "**/*.dj")
	const files = fs.glob(pattern)

	for await (const djot_path of files) {
		yield new Page(djot_path)
	}
}

async function update_pages() {
	for await (const page of pages()) {
		await page.write()
	}
}

import config from "./config.js"
await config.init()

await fs.rm(config.target, { recursive: true, force: true })
await update_pages()

const vite = fork("../../src/vite.js")
const tailwind = fork("../../src/tailwind.js")

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding("utf8")
process.stdin.on("data", key => {
	if (key === "q" || key === "Q") {
		console.log("> 'Q' pressed. Exiting.")
		vite.kill()
		tailwind.kill()
		process.exit()
	}
})

const root_watcher = chokidar.watch(config.root, {
	persistent: true,
	ignoreInitial: true,
})

root_watcher.on("change", file_path => {
	const rel_path = path.relative(config.root, file_path)
	if (rel_path === "style.css" || rel_path.startsWith("pages/")) {
		tailwind.send("update")
	}
})

const pages_watcher = chokidar.watch(config.pages, {
	persistent: true,
	ignoreInitial: true,
})

pages_watcher.on("all", async _ => {
	await update_pages()
})
