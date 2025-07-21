import { promises as fs } from "node:fs"
import path from "node:path"
import url from "node:url"

export async function fileExists(path) {
	try {
		await fs.access(path)
		return true
	} catch {
		return false
	}
}

export async function findDirWithFile(startDir, name) {
	let currentDir = startDir

	while (true) {
		const filePath = path.join(currentDir, name)
		if (await fileExists(filePath)) {
			return [currentDir, filePath]
		}

		const parentDir = path.dirname(currentDir)
		if (parentDir === currentDir) {
			return [null, null]
		}
		currentDir = parentDir
	}
}

export function filename() {
	return url.fileURLToPath(import.meta.url)
}

export function dirname() {
	return path.dirname(filename())
}

export function silenceWarning(name) {
	const originalEmitWarning = process.emitWarning

	process.emitWarning = (warning, type, code, ctor) => {
		if (type === name) {
			return
		}
		originalEmitWarning(warning, type, code, ctor)
	}
}

export function isProc() {
	return typeof process.send === "function"
}
