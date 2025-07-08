import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"

import { find_dir_with_file } from "./util.js"

export default {
	target: "",
	path: "",

	async init() {
		const [root, config_path] = await find_dir_with_file(
			process.cwd(),
			"ssg.config.js",
		)
		if (config_path === null) {
			throw new Error("No config file")
		}
		const module = await import(config_path)
		this.options = module.default

		this.target = this.options.target || path.join(root, "target/")
		this.pages = this.options.pages || path.join(root, "pages/")

		this.target = path.resolve(this.target)
		this.pages = path.resolve(this.pages)
	},

	get assets() {
		return path.join(this.target, "assets/")
	},

	get gen_assets() {
		return path.join(this.target, "assets/generated/")
	},
}
