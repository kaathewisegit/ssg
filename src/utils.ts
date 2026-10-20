import fs from "node:fs/promises"
import path from "node:path"

export async function* walk(dir: string): AsyncGenerator<string> {
	for await (const d of await fs.opendir(dir)) {
		const entry = path.join(dir, d.name)
		if (d.isDirectory()) {
			yield* walk(entry)
		} else if (d.isFile()) {
			yield entry
		}
	}
}

export function stripAnsi(input: string): string {
	// https://github.com/chalk/ansi-regex
	const pattern =
		// biome-ignore lint/suspicious/noControlCharactersInRegex: we're stripping control characters
		/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g
	return input.replace(pattern, "")
}

const htmlEscapes: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
}

export function escapeHtml(input: string): string {
	return input.replace(/[&<>"']/g, c => htmlEscapes[c] ?? c)
}
