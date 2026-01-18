import * as path from "node:path"
import { tsImport } from "tsx/esm/api"
import type { Config } from "./config.ts"
import type { Params } from "./router.ts"

export type Page = {
	path: string
	src: string
	contentType: string | null
}

export type ArbitraryModule = {
	getStaticParams?: (() => Params[]) | (() => Promise<Params[]>)
	getContentType?(params: Params): string
	default?:
		| ((params: Params) => string)
		| ((params: Params) => Promise<string>)
}

export async function load(modulePath: string): Promise<ArbitraryModule> {
	const module = tsImport(modulePath, { parentURL: import.meta.url })
	return module
}

export async function render(
	modulePath: string,
	params: Params,
	config: Config,
): Promise<Page> {
	const module = await load(modulePath)

	let contentType = null
	if (module.getContentType) {
		contentType = module.getContentType(params)
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
			throw "`default` must be a string or a function"
		}
	}

	let pagePath = path.relative(config.routesDir, modulePath)
	pagePath = substituteParams(pagePath, params)
	pagePath = pagePath.replace(/\.tsx?$/, "")
	if (pagePath.endsWith("index")) {
		pagePath += ".html"
	}

	return { path: pagePath, src, contentType }
}

export async function renderAll(
	modulePath: string,
	config: Config,
): Promise<Page[]> {
	const module = await load(modulePath)

	const out: Page[] = []

	if (module.getStaticParams) {
		const paramsList: Params[] = await module.getStaticParams()

		for (const params of paramsList) {
			out.push(await render(modulePath, params, config))
		}
	} else {
		out.push(await render(modulePath, {}, config))
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
