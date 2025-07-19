import path from "node:path"
import process from "node:process"

import { find_dir_with_file } from "./util.js"

export default {
	root: undefined,

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

		this.root = path.resolve(root)
	},

	get pages() {
		return path.join(this.root, "pages/")
	},

	get target() {
		return path.join(this.root, "target/")
	},

	get tree() {
		return path.join(this.target, "tree/")
	},

	get assets() {
		return path.join(this.tree, "assets/")
	},

	get gen_assets() {
		return path.join(this.assets, "generated/")
	},
}
