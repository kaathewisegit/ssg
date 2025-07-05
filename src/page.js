import path from "node:path"

import { promises as fs } from "node:fs"
import { renderDjot } from "./djot.js"

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
		this.dst = path.join("target/", path.format(parsed))
	}

	async raw() {
		return fs.readFile(this.src, "utf8")
	}

	async rendered() {
		const raw = await this.raw()

		switch (this.type) {
			case "djot":
				return renderDjot(raw)
			case "html":
				return raw
		}
	}
}
