import { promises as fs } from "node:fs"
import path from "node:path"

import renderDjot from "./djot.js"

const originalEmitWarning = process.emitWarning
process.emitWarning = (warning, type, code, ctor) => {
	if (type === "ExperimentalWarning") {
		return
	}
	originalEmitWarning(warning, type, code, ctor)
}

function djotPathToHtml(input) {
	const parsed = path.parse(path.relative("pages/", input))
	if (parsed.name === "index") {
		parsed.ext = "html"
		parsed.base = null
	} else {
		parsed.ext = null
		parsed.base = null
	}
	return path.join("target/", path.format(parsed))
}

export async function entrypoints(base = "pages/") {
	const pattern = path.join(base, "**/*.dj")
	const files = fs.glob(pattern)

	return Array.fromAsync(files, djot_path => {
		const html_path = djotPathToHtml(djot_path)
		return { src: djot_path, dst: html_path }
	})
}

for (const entry of await entrypoints()) {
	let djot = await renderDjot(entry.src)
	djot = "<!DOCTYPE html>\n" + "djot"
	await fs.mkdir(path.dirname(entry.dst), { recursive: true })
	await fs.writeFile(entry.dst, djot)
}
