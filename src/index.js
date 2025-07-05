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

export async function pages(base = "pages/") {
	const pattern = path.join(base, "**/*.dj")
	const files = fs.glob(pattern)

	return Array.fromAsync(files, djot_path => new Page(djot_path))
}

for (const page of await pages()) {
	let djot = await page.rendered()
	djot = `<!DOCTYPE html>\n${djot}`
	await fs.mkdir(path.dirname(page.dst), { recursive: true })
	await fs.writeFile(page.dst, djot)
}
