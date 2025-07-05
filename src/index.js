import fs from "node:fs"
import path from "node:path"

export function ssgVitePlugin() {
	return {
		name: "vite-plugin-ssg",
		enforce: "pre",

		resolveId(source, importer) {
			console.log("resolveId", source)
			const id = stripExtension(
				path.relative("pages/", source),
			)
			console.log(id)
			return { id: id }
		},

		// transform(html, obj) {
		// 	console.log("transform", html, obj)
		// },

		// load(id) {
		// 	console.log("load", id)
		// 	return "hello there"
		// },

		buildStart() {},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "index.html",
				source: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Title</title>
 </head>
<body>
</body>
</html>`,
			})
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
	if (parsed.name === "index") {
		parsed.ext = "html"
		parsed.base = null
	} else {
		parsed.ext = null
		parsed.base = null
	}
	return path.format(parsed)
}

export function entrypoints(base = "pages/") {
	const pattern = path.join(base, "**/*.dj")
	const files = fs.globSync(pattern)

	const entries = files.reduce((acc, djot_path) => {
		let html_path = stripExtension(djot_path)
		html_path = path.relative(base, html_path)
		acc[html_path] = djot_path
		return acc
	}, {})

	return entries
}
