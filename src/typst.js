import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { file_exists } from "./util.js"

const DIR = "target/assets/generated/"

export const CACHE = {
	async contains(formula) {
		const file_path = path.join(DIR, hash(formula))
		return file_exists(file_path)
	},

	// Returns the relative path to the file
	async insert(formula) {
		if (!(await this.contains(formula))) {
			render(formula)
		}
		const file_path = path.join(DIR, hash(formula))
		return path.relative("target/", file_path)
	},

	// Path to SVG file
	path(formula) {
		return path.join(DIR, hash(formula))
	},
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex")
}

export async function render(formula) {
	await fs.mkdir(DIR, { recursive: true })

	const dst = path.join(DIR, hash(formula))
	const child = spawn("typst", ["compile", "--format", "svg", "-", dst], {
		stdio: ["pipe", null, null],
	})

	child.stdin.write("$")
	child.stdin.write(formula)
	child.stdin.write("$")
	child.stdin.end()

	await child
}
