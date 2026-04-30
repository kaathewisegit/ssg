import * as path from "node:path"
import { rolldown } from "rolldown"
import type { Config } from "./config.ts"
import type { Params } from "./router.ts"

export type Page = {
	path: string
	head: string
	body: string
	contentType: string | null
}

export type ArbitraryModule = {
	getStaticParams?: (() => Params[]) | (() => Promise<Params[]>)
	getContentType?(params: Params): string
	Body: (params: Params) => Promise<string>
	Head: (params: Params, body: string) => Promise<string>
}

export async function load(
	modulePath: string,
	config: Config,
): Promise<ArbitraryModule> {
	const bundle = await rolldown({
		input: modulePath,
		external: [/^[./][a-z0-9-_]$/, /^@[a-z0-9-_]\/[a-z0-9-_]$/, /^node:/],
	})
	const chunks = await bundle.write({
		format: "esm",
		dir: config.scratchDir,
	})
	const output = chunks.output[0]
	const outputPath = `${config.scratchDir}/${output.fileName}?t=${Date.now()}`
	const module = await import(outputPath)
	await bundle.close()

	return module
}

export async function makePage(
	modulePath: string,
	params: Params,
	config: Config,
): Promise<Page> {
	const module = await load(modulePath, config)

	let contentType = null
	if (module.getContentType) {
		contentType = module.getContentType(params)
	}

	const body = await module.Body(params)
	const head = await module.Head(params, body)

	let pagePath = path.relative(config.routesDir, modulePath)
	pagePath = substituteParams(pagePath, params)
	pagePath = pagePath.replace(/\.tsx?$/, "")
	if (pagePath.endsWith("index")) {
		pagePath += ".html"
	}

	return { path: pagePath, head, body, contentType }
}

export async function makeAllPages(
	modulePath: string,
	config: Config,
): Promise<Page[]> {
	const module = await load(modulePath, config)

	const out: Page[] = []

	if (module.getStaticParams) {
		const paramsList: Params[] = await module.getStaticParams()

		for (const params of paramsList) {
			out.push(await makePage(modulePath, params, config))
		}
	} else {
		out.push(await makePage(modulePath, {}, config))
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

export function render(page: Page): string {
	return `<!doctype html>
<html>
  <head>
${page.head}
  </head>
  <body>
${page.body}
  </body>
</html>
`
}
