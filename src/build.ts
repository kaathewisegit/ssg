import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { Config } from "./config.ts"
import { type Page, renderAll } from "./render.ts"
import { walk } from "./utils.ts"

export async function build(config: Config) {
	const pages: Page[] = []
	for await (const filePath of walk(config.pagesDir)) {
		const p = await renderAll(filePath, config.pagesDir)
		pages.push(...p)
	}

	await fs.rm(config.outputDir, { recursive: true, force: true })
	await fs.mkdir(config.outputDir)

	for (const page of pages) {
		const destPath = path.join(config.outputDir, page.path)
		const dir = path.dirname(destPath)
		if (!(await fs.exists(dir))) {
			await fs.mkdir(path.dirname(destPath), {
				recursive: true,
			})
		}
		await fs.writeFile(destPath, page.src)
	}

	if (config.assetDir) {
		await fs.cp(config.assetDir, config.outputDir, {
			recursive: true,
		})
	}
}
