import { promises as fs } from "node:fs"
import path from "node:path"

import config from "./config.js"
import * as djot from "./djot.js"

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

	async render() {
		const raw = await this.raw()

		switch (this.type) {
			case "djot": {
				return this.#render_djot(raw)
			}
			case "html":
				return raw
		}
	}

	#render_djot(raw) {
		const doc = djot.parse(raw)
		const metadata = djot.metadata(doc)
		return djot.render(doc)
	}

	async write() {
		await fs.mkdir(path.dirname(this.dst), { recursive: true })
		await fs.writeFile(this.dst, await this.render())
	}
}
