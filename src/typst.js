import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import config from "./config.js"
import { fileExists } from "./util.js"

function dir() {
	return path.join(config.genAssets, "typst/")
}

function svgFilePath(formula) {
	return path.format({ dir: dir(), name: hash(formula), ext: "svg" })
}

export const CACHE = {
	async contains(formula) {
		return fileExists(svgFilePath(formula))
	},

	// Returns the relative path to the file
	async insert(formula) {
		if (!(await this.contains(formula))) {
			render(formula)
		}
		return path.relative(config.tree, svgFilePath(formula))
	},
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex")
}

export async function render(typst) {
	// TODO: this should probably go elsewhere
	await fs.mkdir(dir(), { recursive: true })

	const dst = svgFilePath(typst)
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
