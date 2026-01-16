import * as path from "node:path"
import { type Page, substituteParams } from "./render"
import type { Params } from "./router.ts"

export async function render(
	modulePath: string,
	pagesDir: string,
	params: Params = {},
): Promise<Page> {
	const module = await import(modulePath)
	console.log(module)

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

self.onmessage = async e => {
	const { modulePath, pagesDir, params } = e.data
	try {
		const page = await render(modulePath, pagesDir, params)

		self.postMessage({ page })
	} catch (err) {
		self.postMessage({ error: err })
	}
}
