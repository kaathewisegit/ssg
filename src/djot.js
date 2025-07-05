import { promises as fs } from "node:fs"
import djot from "@djot/djot"

export default async function renderDjot(path) {
	const src = await fs.readFile(path, "utf8")

	const doc = djot.parse(src)
	const html = djot.renderHTML(doc)

	return html
}
