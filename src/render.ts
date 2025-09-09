import * as path from "node:path"

interface Params {
	[name: string]: string | string[]
}

export type Page = {
	path: string
	html: string
	contentType: string | null
}

export async function render(
	modulePath: string,
	pagesDir: string,
	params: Params = {},
): Promise<Page> {
	const module = await import(modulePath)

	let contentType = null
	if ("getContentType" in module) {
		contentType = module.getContentType()
	}

	const html = await module.default(params)

	let pagePath = path.relative(pagesDir, modulePath)
	pagePath = substituteParams(pagePath, params)
	pagePath = pagePath.replace(/\.tsx?$/, "")
	if (pagePath.endsWith("index")) {
		pagePath += ".html"
	}

	return { path: pagePath, html, contentType }
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
		if (typeof value === "string") {
			path = path.replace(`[${key}]`, value)
		} else if (Array.isArray(value)) {
			path = path.replace(`[[...${key}]]`, value.join("/"))
		}
	}

	path = path.replace(/\.tsx?$/, "")

	return path
}
