import { relative as pathRelative } from "node:path"

export function clearCache(prefix: string) {
	for (const path in import.meta.require.cache) {
		if (path.startsWith(prefix)) {
			delete import.meta.require.cache[path]
		}
	}
}

// biome-ignore lint: TODO
export async function renderWith(path: string, props: any): Promise<string> {
	const module = await import(path)
	return module.default(props)
}

export type Page = {
	path: string
	html: string
}

export async function renderAll(
	pagesDir: string,
	path: string,
): Promise<Page[]> {
	const router = new Bun.FileSystemRouter({
		style: "nextjs",
		dir: pagesDir,
	})

	const module = await import(path)

	if ("getStaticPaths" in module) {
		const paths: string[] = await module.getStaticPaths()
		const out: Page[] = []

		for (const path of paths) {
			const params = router.match(path)?.params
			const html = module.default(params)
			out.push({ path, html })
		}

		return out
	} else {
		path = pathRelative(pagesDir, path)
		return [{ path, html: module.default() }]
	}
}
