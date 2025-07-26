import { promises as fs } from "node:fs"
import path from "node:path"
import djot from "@djot/djot"

import config from "./config.js"
import { CACHE } from "./typst.js"

export function parse(src) {
	return djot.parse(src)
}

export async function metadata(doc) {
	const out = {}

	const block = doc.children[0]
	if (block) {
		try {
			if (
				block.tag === "raw_block" &&
				block.format === "metadata"
			) {
				const json = JSON.parse(block.text)
				Object.assign(out, json)
			}
		} catch (e) {
			console.error(e)
		}
	}

	const headingFilter = {
		heading: async el => {
			if (el.level === 1) {
				out.title = el.children[0].text
			}
		},
	}
	if (!Object.hasOwn(out, "title")) {
		await applyFilter(doc, headingFilter)
	}

	return out
}

export async function render(doc) {
	await applyFilter(doc, formulaFilter)
	await applyFilter(doc, classesFilter)
	await applyFilter(doc, typstFilter)

	return djot.renderHTML(doc)
}

async function applyFilter(element, filter) {
	if (element.children) {
		for (let i = 0; i < element.children.length; i += 1) {
			const result = await applyFilter(
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

const formulaFilter = {
	inline_math: async el => {
		const path = await CACHE.insert(typstFormula(el.text))
		return mathContainer(path, true)
	},

	display_math: async el => {
		const path = await CACHE.insert(typstFormula(el.text))
		return mathContainer(path, false)
	},
}

function typstFormula(formula) {
	return `\
#set page(width: auto, height: auto, margin: (x: 0pt, y: 5pt))
#set text(size: 16pt)

$${formula}$
`
}

async function mathContainer(path, inline) {
	const raw_html = inline
		? `<img src="/${path}" class=math-inline>`
		: `<p class=math-container><img src="/${path}" class=math-display></p>`
	return {
		tag: "raw_inline",
		format: "html",
		text: raw_html,
	}
}

const typstFilter = {
	raw_block: async el => {
		if (el.format === "typst") {
			const path = await CACHE.insert(el.text)
			return mathContainer(path, false)
		}
	},
}

async function classesFilter(element) {
	if (element.attributes?.class) {
		await fs.appendFile(
			path.join(config.target, "classes"),
			`${element.attributes.class}\n`,
		)
	}
}
