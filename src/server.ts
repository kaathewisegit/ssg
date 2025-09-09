import { watch } from "node:fs/promises"
import * as path from "node:path"
import type { ReadableStreamDefaultController } from "node:stream/web"
import type { MatchedRoute } from "bun"
import { render } from "./render"

const EVENT_PATH = "/__ssg_dev_sse"

export class Server {
	pagesDir: string
	sourcePath: string
	router: Bun.FileSystemRouter
	port?: number = 3001

	constructor(options: {
		pagesDir: string
		sourcePath: string
		port?: number
	}) {
		this.pagesDir = path.join(process.cwd(), options.pagesDir)
		this.sourcePath = path.join(process.cwd(), options.sourcePath)

		this.router = new Bun.FileSystemRouter({
			style: "nextjs",
			dir: options.pagesDir,
		})

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
				return createHtml(this.pagesDir, route)
			},
		})

		const watcher = watch(this.sourcePath, { recursive: true })
		for await (const _ of watcher) {
			this.router.reload()
			clearCache(this.sourcePath)
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

async function createHtml(pagesDir: string, route: MatchedRoute | null) {
	if (!route) {
		throw new Error("TODO not found")
	}

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
