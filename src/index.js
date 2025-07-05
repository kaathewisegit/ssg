import fs from "node:fs"
import path from "node:path"

export function ssgVitePlugin() {
	return {
		name: "vite-plugin-ssg",
		enforce: "pre",

		resolveId(source, importer) {
			return null
		},
	}
}

const originalEmitWarning = process.emitWarning
process.emitWarning = (warning, type, code, ctor) => {
	if (type === "ExperimentalWarning") {
		return
	}
	originalEmitWarning(warning, type, code, ctor)
}

function stripExtension(input) {
	const parsed = path.parse(input)
	parsed.ext = null
	parsed.base = null
	return path.format(parsed)
}

export function entrypoints(base = "pages/") {
	const pattern = path.join(base, "**/*.dj")
	const files = fs.globSync(pattern)

	const entries = files.reduce((acc, djot_path) => {
		acc[stripExtension(djot_path)] = djot_path
		return acc
	}, {})

	return entries
}
