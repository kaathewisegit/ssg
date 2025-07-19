import { promises as fs } from "node:fs"
import path from "node:path"
import djot from "@djot/djot"

import config from "./config.js"
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
	await apply_filter(doc, classes_filter)

	return `<!doctype html>\n ${djot.renderHTML(doc)}`
}

async function apply_filter(element, filter) {
	if (element.children) {
		for (let i = 0; i < element.children.length; i += 1) {
			const result = await apply_filter(
				element.children[i],
				filter,
			)
			if (result) {
				element.children[i] = result
			}
		}
	}

	if (filter instanceof Function) {
		return await filter(element)
	}

	for (const [tag, func] of Object.entries(filter)) {
		if (tag === element.tag) {
			return await func(element)
		}
	}
}

async function _apply_func(element, func) {
	const output = await func(element)
	if (output) {
		for (const [key, value] of Object.entries(output)) {
			element[key] = value
		}
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

async function classes_filter(element) {
	if (element.attributes?.class) {
		await fs.appendFile(
			path.join(config.target, "classes"),
			`${element.attributes.class}\n`,
		)
	}
}
