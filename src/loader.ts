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

export async function renderAll(path: string) {
	const module = await import(path)

	if ("getStaticPaths" in module) {
		const _paths = await module.getStaticPaths()
	}
}
