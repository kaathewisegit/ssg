import * as fs from "node:fs/promises"
import { watch } from "node:fs/promises"
import * as path from "node:path"
import type { ReadableStreamDefaultController } from "node:stream/web"
import url from "node:url"
import type { MatchedRoute } from "bun"
import type { Config } from "./config.ts"
import { render } from "./render.ts"

const EVENT_PATH = "/__ssg_dev_sse"

export async function serve(config: Config): Promise<void> {
	const clients = new Set<ReadableStreamDefaultController>()
	const router = new Bun.FileSystemRouter({
		style: "nextjs",
		dir: config.pagesDir,
	})

	Bun.serve({
		port: config.port,
		// for SSE
		idleTimeout: 0,

		fetch: async request => {
			const rUrl = new url.URL(request.url)
			if (rUrl.pathname === EVENT_PATH) {
				return createStream(request, clients)
			}

			const route = router.match(rUrl.href)
			if (route) {
				return createHtml(config.pagesDir, route)
			}

			const asset = await fetchStaticFile(
				rUrl,
				config.assetDir,
			)
			if (asset) {
				return asset
			}

			console.warn(`Path '${rUrl.pathname}' not found`)
			return new Response("Page or file not found", {
				status: 404,
			})
		},
	})
	console.log(`Listening on :${config.port}`)

	const watcher = watch(config.sourceDir, { recursive: true })
	for await (const _ of watcher) {
		router.reload()
		clearCache(config.sourceDir)
		for (const client of clients) {
			client.enqueue("data: RELOAD\n\n")
		}
	}
}

function createStream(
	request: Request,
	clients: Set<ReadableStreamDefaultController>,
) {
	const stream = new ReadableStream({
		start(controller): void {
			clients.add(controller)

			// workaround because @ts-expect-error doesn't fail for
			// aspartik/website for some reason, breaking the check.
			// biome-ignore lint/suspicious/noExplicitAny: above
			const signal = request.signal as any
			signal.addEventListener("abort", () => {
				controller.close()
				clients.delete(controller)
			})
		},
	})

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
		},
	})
}

async function fetchStaticFile(
	url: url.URL,
	assetDir?: string,
): Promise<Response | null> {
	if (!assetDir) {
		return null
	}

	let assetPath = path.join(assetDir, url.pathname.slice(1))
	assetPath = path.resolve(assetPath)
	if (!assetPath.startsWith(assetDir)) {
		return new Response(
			"Tried to get a file outside of the asset directory",
			{ status: 403 },
		)
	}

	const exists = await fs.exists(assetPath)
	if (!exists) {
		return null
	}

	const contents = await fs.readFile(assetPath)
	return new Response(contents)
}

const RELOAD_SCRIPT = `
<script type="module">
	const sse = new EventSource("${EVENT_PATH}");
	sse.onmessage = function(msg) {
		if (msg.data === "RELOAD") {
			location.reload()
		}
	}
	window.addEventListener("beforeunload", () => sse.close())
</script>
`

async function createHtml(
	pagesDir: string,
	route: MatchedRoute,
): Promise<Response> {
	const page = await render(route.filePath, pagesDir, route.params)

	const response = new Response(page.src, {
		headers: {
			"Content-Type": page.contentType ?? "text/html",
		},
	})

	return new HTMLRewriter()
		.onDocument({
			end: (el): void => {
				el.append(RELOAD_SCRIPT, { html: true })
			},
		})
		.transform(response)
}

function clearCache(prefix: string) {
	for (const path in import.meta.require.cache) {
		if (path.startsWith(prefix)) {
			delete import.meta.require.cache[path]
		}
	}
}
