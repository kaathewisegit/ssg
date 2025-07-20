import { promises as fs } from "node:fs"
import path from "node:path"
import url from "node:url"

export async function file_exists(file_path) {
	try {
		await fs.access(file_path)
		return true
	} catch (_error) {
		return false
	}
}

export async function find_dir_with_file(start_dir, name) {
	let current_dir = start_dir

	while (true) {
		const file_path = path.join(current_dir, name)
		if (await file_exists(file_path)) {
			return [current_dir, file_path]
		}

		const parent_dir = path.dirname(current_dir)
		if (parent_dir === current_dir) {
			return [null, null]
		}
		current_dir = parent_dir
	}
}

export function filename() {
	return url.fileURLToPath(import.meta.url)
}

export function dirname() {
	return path.dirname(filename())
}

export function silence_warning(name) {
	const originalEmitWarning = process.emitWarning

	process.emitWarning = (warning, type, code, ctor) => {
		if (type === name) {
			return
		}
		originalEmitWarning(warning, type, code, ctor)
	}
}

export function is_proc() {
	return typeof process.send === "function"
}
