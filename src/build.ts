import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { Config } from "./config.ts"
import { type Page, renderAll } from "./render.ts"
import { walk } from "./utils.ts"

export async function build(config: Config): Promise<void> {
	const pages: Page[] = []
	for await (const filePath of walk(config.routesDir)) {
		const p = await renderAll(filePath, config.routesDir)
		pages.push(...p)
	}

	await fs.rm(config.outputDir, { recursive: true, force: true })
	await fs.mkdir(config.outputDir)

	for (const page of pages) {
		const destPath = path.join(config.outputDir, page.path)
		await fs.mkdir(path.dirname(destPath), {
			recursive: true,
		})
		await fs.writeFile(destPath, page.src)
	}

	if (config.assetDir) {
		await fs.cp(config.assetDir, config.outputDir, {
			recursive: true,
		})
	}
}
