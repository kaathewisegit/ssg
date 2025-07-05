import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"

import { find_dir_with_file } from "./util.js"

export default {
	async init() {
		const [_, config_path] = await find_dir_with_file(
			process.cwd(),
			"ssg.config.js",
		)
		if (config_path === null) {
			throw new Error("No config file")
		}
		const module = await import(config_path)
		this.options = module.default
	},
}
