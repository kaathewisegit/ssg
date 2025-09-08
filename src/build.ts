import * as fs from "node:fs/promises"
import { join } from "node:path"
import { Glob, write } from "bun"
import { type Page, renderAll } from "./loader"

const glob = new Glob("**/*.{js,jsx,ts,tsx}")

export async function build(pagesDir: string, outDir: string = "dist/") {
	pagesDir = join(process.cwd(), pagesDir)
	outDir = join(process.cwd(), outDir)

	const pages: Page[] = []
	for await (const path of glob.scan(pagesDir)) {
		const p = await renderAll(pagesDir, join(pagesDir, path))
		pages.push(...p)
	}

	// recursive disables errors when the directory already exists
	await fs.mkdir(outDir, { recursive: true })

	for (const page of pages) {
		const file = Bun.file(join(outDir, page.path))
		await write(file, page.html)
	}
}
