import { promises as fs } from "node:fs"
import path from "node:path"

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

import config from "./config.js"
config.init()

await fs.rm("target/", { recursive: true, force: true })
for await (const page of pages()) {
	await page.write()
}
