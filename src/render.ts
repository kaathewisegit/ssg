import type { Params } from "./router.ts"

export type Page = {
	path: string
	src: string
	contentType: string | null
}

export async function render(
	modulePath: string,
	pagesDir: string,
	params: Params = {},
): Promise<Page> {
	const worker = new Worker(
		new URL("./render_worker.js", import.meta.url),
		{
			type: "module",
		},
	)

	return new Promise((resolve, reject) => {
		worker.onmessage = (e: MessageEvent) => {
			worker.terminate()
			if (e.data.page) {
				resolve(e.data.page)
			} else {
				reject(e.data.error)
			}
		}
		worker.postMessage({ modulePath, pagesDir, params })
	})
}

export async function renderAll(
	modulePath: string,
	pagesDir: string,
): Promise<Page[]> {
	const module = await import(modulePath)

	const out: Page[] = []

	if ("getStaticParams" in module) {
		const paramsList: Params[] = await module.getStaticParams()

		for (const params of paramsList) {
			out.push(await render(modulePath, pagesDir, params))
		}
	} else {
		out.push(await render(modulePath, pagesDir))
	}

	return out
}

export function substituteParams(inputPath: string, params: Params): string {
	let path = inputPath
	for (const [key, value] of Object.entries(params)) {
		const single = `[${key}]`
		const multiple = `[...${key}]`

		if (typeof value === "string") {
			path = path.replace(single, value)
		} else {
			path = path.replace(multiple, value.join("/"))
		}
	}

	path = path.replace(/\.tsx?$/, "")

	return path
}
