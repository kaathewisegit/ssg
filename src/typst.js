import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { file_exists } from "./util.js"

const DIR = "target/asset/generated"

export const CACHE = {
	async contains(formula) {
		const file_path = path.join(DIR, hash(formula))
		return file_exists(file_path)
	},
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex")
}

async function render(formula) {}

async function runTypst(src, dst) {
	await spawn("typst", ["--format", "svg", src, dst])
}
