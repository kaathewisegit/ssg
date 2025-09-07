function clearCache(path: string) {
	delete import.meta.require.cache[path]
}

// biome-ignore lint: TODO
export async function renderWith(path: string, props: any): Promise<string> {
	clearCache(path)
	const module = await import(path)
	return module.default(props)
}

export async function renderAll(path: string) {
	const module = await import(path)

	if ("getStaticPaths" in module) {
		const _paths = await module.getStaticPaths()
	}
}
