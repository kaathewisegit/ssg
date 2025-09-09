import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Glob, write } from "bun"
import { type Page, renderAll } from "./render"

const glob = new Glob("**/*.{js,jsx,ts,tsx}")

export async function build(pagesDir: string, outDir: string = "dist/") {
	pagesDir = path.join(process.cwd(), pagesDir)
	outDir = path.join(process.cwd(), outDir)

	const pages: Page[] = []
	for await (const relPath of glob.scan(pagesDir)) {
		const modulePath = path.join(pagesDir, relPath)
		const p = await renderAll(modulePath, pagesDir)
		pages.push(...p)
	}

	await fs.rm(outDir, { recursive: true, force: true })
	await fs.mkdir(outDir)

	for (const page of pages) {
		const destPath = path.join(outDir, page.path)
		const dir = path.dirname(destPath)
		if (!(await fs.exists(dir))) {
			await fs.mkdir(path.dirname(destPath), {
				recursive: true,
			})
		}
		const file = Bun.file(destPath)
		await write(file, page.html)
	}
}
