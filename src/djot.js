import { promises as fs } from "node:fs"
import djot from "@djot/djot"

export async function renderDjot(src) {
	const doc = djot.parse(src)
	const html = djot.renderHTML(doc)
	return html
}
