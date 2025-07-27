import path from "node:path"
import process from "node:process"

import { findDirWithFile } from "./util.js"

export default {
	root: undefined,

	async init() {
		const [root, configPath] = await findDirWithFile(
			process.cwd(),
			"ssg.config.js",
		)
		if (configPath === null) {
			throw new Error("No config file")
		}
		const module = await import(configPath)
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

	get genAssets() {
		return path.join(this.assets, "generated/")
	},

	get static() {
		return path.join(this.root, "static/")
	},

	get assetsStatic() {
		return path.join(this.assets, "static/")
	},

	get port() {
		return this.options.port ?? 3000
	},

	get viteEntrypoints() {
		const names = this.options.vite?.entrypoints ?? []

		return names.map(file => path.join("js/", file))
	},

	ssgMetadata() {
		return {
			currentTime: Date.now(),
		}
	},
}
