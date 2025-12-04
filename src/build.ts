import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Glob, write } from "bun"
import type { Config } from "./config.ts"
import { type Page, renderAll } from "./render.ts"

const glob = new Glob("**/*.{js,jsx,ts,tsx}")

export async function build(config: Config) {
	const pages: Page[] = []
	for await (const relPath of glob.scan(config.pagesDir)) {
		const modulePath = path.join(config.pagesDir, relPath)
		const p = await renderAll(modulePath, config.pagesDir)
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
		const file = Bun.file(destPath)
		await write(file, page.src)
	}

	if (config.assetDir) {
		await fs.cp(config.assetDir, config.outputDir, {
			recursive: true,
		})
	}
}
