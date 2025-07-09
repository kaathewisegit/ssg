import { promises as fs } from "node:fs"
import path from "node:path"
import Handlebars from "handlebars"

import config from "./config.js"
import * as djot from "./djot.js"
import { find_dir_with_file } from "./util.js"

export class Page {
	constructor(src) {
		this.src = src

		const parsed = path.parse(path.relative("pages/", src))
		parsed.base = null // it overrules ext and name

		if (parsed.ext === ".dj") {
			this.type = "djot"

			if (parsed.name === "index") {
				parsed.ext = "html"
			} else {
				parsed.ext = null
			}
		} else if (parsed.ext === ".html") {
			this.type = "html"
			// left as-is
		} else {
			throw new Error(
				`The file must be HTML or Djot, got ${src}`,
			)
		}
		this.dst = path.join(config.tree, path.format(parsed))
	}

	async raw() {
		return fs.readFile(this.src, "utf8")
	}

	async template() {
		const [_, template_path] = await find_dir_with_file(
			path.dirname(this.src),
			"template.html.hbs",
		)
		const template_raw = await fs.readFile(template_path, "utf8")
		const template = Handlebars.compile(template_raw)
		return template
	}

	async render() {
		const raw = await this.raw()

		switch (this.type) {
			case "djot": {
				return await this.#render_djot(raw)
			}
			case "html":
				return raw
		}
	}

	async #render_djot(raw) {
		const template = await this.template()
		const doc = djot.parse(raw)
		const metadata = djot.metadata(doc)
		const body = await djot.render(doc)
		return template({ body, metadata })
	}

	async write() {
		await fs.mkdir(path.dirname(this.dst), { recursive: true })
		await fs.writeFile(this.dst, await this.render())
	}
}
