import { watch } from "node:fs/promises"
import * as path from "node:path"
import type { ReadableStreamDefaultController } from "node:stream/web"
import type { MatchedRoute } from "bun"
import { render } from "./render"

const EVENT_PATH = "/__ssg_dev_sse"

export class Server {
	pagesDir: string
	sourceDir: string
	assetDir?: string
	port?: number = 3001

	router: Bun.FileSystemRouter

	constructor(options: {
		pagesDir: string
		sourceDir: string
		assetDir?: string
		port?: number
	}) {
		this.pagesDir = path.join(process.cwd(), options.pagesDir)
		this.sourceDir = path.join(process.cwd(), options.sourceDir)

		this.router = new Bun.FileSystemRouter({
			style: "nextjs",
			dir: options.pagesDir,
		})

		this.assetDir ??= options.assetDir

		this.port ??= options?.port
	}

	async listen() {
		const clients = new Set<ReadableStreamDefaultController>()

		Bun.serve({
			port: this.port,
			// for SSE
			idleTimeout: 0,

			fetch: async request => {
				const url = new URL(request.url)
				if (url.pathname === EVENT_PATH) {
					return createStream(request, clients)
				}

				const route = this.router.match(request.url)
				if (route) {
					return createHtml(this.pagesDir, route)
				}

				if (this.assetDir) {
					// TODO: .. escapes
					const assetPath = path.join(
						this.assetDir,
						url.pathname.slice(1),
					)

					return new Response(Bun.file(assetPath))
				}

				return new Response("Not found", {
					headers: {
						"Content-Type": "text/html",
					},
				})
			},
		})

		const watcher = watch(this.sourceDir, { recursive: true })
		for await (const _ of watcher) {
			this.router.reload()
			clearCache(this.sourceDir)
			for (const client of clients) {
				client.enqueue("data: RELOAD\n\n")
			}
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

			// @ts-expect-error
			request.signal.addEventListener("abort", () => {
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

	const response = new Response(page.html, {
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

export function clearCache(prefix: string) {
	for (const path in import.meta.require.cache) {
		if (path.startsWith(prefix)) {
			delete import.meta.require.cache[path]
		}
	}
}
