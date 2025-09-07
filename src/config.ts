import * as path from "node:path"

const DEFAULT = { pages: "src/pages" }

export default async function config() {
	const cwd = process.cwd()
	const configPath = path.join(cwd, "ssg.config")

	try {
		const mod = await import(configPath)
		return { ...DEFAULT, ...mod.default }
	} catch {
		return DEFAULT
	}
}
