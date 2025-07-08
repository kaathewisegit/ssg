import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import config from "./config.js"
import { file_exists } from "./util.js"

function dir() {
	return path.join(config.gen_assets, "typst/")
}

function svg_file_path(formula) {
	return path.format({ dir: dir(), name: hash(formula), ext: "svg" })
}

export const CACHE = {
	async contains(formula) {
		return file_exists(svg_file_path(formula))
	},

	// Returns the relative path to the file
	async insert(formula) {
		if (!(await this.contains(formula))) {
			render(formula)
		}
		return path.relative(config.tree, svg_file_path(formula))
	},
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex")
}

export async function render(formula) {
	// TODO: this should probably go elsewhere
	await fs.mkdir(dir(), { recursive: true })

	const typst = `\
#set page(width: auto, height: auto, margin: (x: 0pt, y: 5pt))
#set text(size: 16pt)

$${formula}$
`

	const dst = svg_file_path(formula)
	const child = spawn("typst", ["compile", "--format", "svg", "-", dst], {
		stdio: ["pipe", null, null],
	})

	child.stderr.on("data", data => {
		console.log(data.toString("utf8"))
	})

	child.stdin.write(typst)
	child.stdin.end()

	await child
}
