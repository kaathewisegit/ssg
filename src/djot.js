import { promises as fs } from "node:fs"
import djot from "@djot/djot"

import { CACHE } from "./typst.js"

export function parse(src) {
	return djot.parse(src)
}

export function metadata(doc) {
	const block = doc.children[0]

	if (block.tag === "raw_block" && block.format === "metadata") {
		return JSON.parse(block.text)
	}

	return null
}

export async function render(doc) {
	await apply_filter(doc, typst_filter)

	return `<!doctype html>\n ${djot.renderHTML(doc)}`
}

async function apply_filter(element, filter) {
	if (element.children) {
		for (const child of element.children) {
			await apply_filter(child, filter)
		}
	}

	for (const [tag, func] of Object.entries(filter)) {
		if (tag !== element.tag) {
			continue
		}

		const output = await func(element)
		if (output) {
			for (const [key, value] of Object.entries(output)) {
				element[key] = value
			}
		}

		return
	}
}

const typst_filter = {
	inline_math: async el => {
		const formula = el.text
		const path = await CACHE.insert(formula)
		return {
			tag: "raw_inline",
			format: "html",
			text: `<img src="/${path}" class=math-inline>`,
		}
	},

	display_math: async el => {
		const formula = el.text
		const path = await CACHE.insert(formula)
		return {
			tag: "raw_inline",
			format: "html",
			text: `<p class=math-container><img src="/${path}" class=math-display></p>`,
		}
	},
}
