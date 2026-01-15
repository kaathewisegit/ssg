import * as path from "node:path"
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
	const module = await import(`${modulePath}?update=${Date.now()}`)

	let contentType = null
	if ("getContentType" in module) {
		contentType = module.getContentType()
	}

	const def = module.default

	let src: string
	switch (typeof def) {
		case "string": {
			src = def
			break
		}
		case "function": {
			src = await def(params)
			break
		}
		default: {
			throw "Not implemented"
		}
	}

	let pagePath = path.relative(pagesDir, modulePath)
	pagePath = substituteParams(pagePath, params)
	pagePath = pagePath.replace(/\.tsx?$/, "")
	if (pagePath.endsWith("index")) {
		pagePath += ".html"
	}

	return { path: pagePath, src, contentType }
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

function substituteParams(inputPath: string, params: Params): string {
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
