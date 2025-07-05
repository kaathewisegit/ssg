import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

const DIR = "target/asset/generated"

export const CACHE = {
	async contains(formula) {
		const file = path.join(DIR, hash(formula))
		try {
			await fs.access(file)
			return true
		} catch (error) {
			return false
		}
	},
}

function hash(text) {
	return createHash("sha256").update(text).digest("hex")
}

async function render(formula) {}

async function runTypst(src, dst) {
	await spawn("typst", ["--format", "svg", src, dst])
}
