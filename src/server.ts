import { watch } from "node:fs/promises"
import * as path from "node:path"
import type { ReadableStreamDefaultController } from "node:stream/web"
import type { MatchedRoute } from "bun"
import { renderWith } from "./loader"

const EVENT_PATH = "/__ssg_dev_sse"

export class Server {
	pagesPath: string
	router: Bun.FileSystemRouter
	port?: number = 3001

	constructor(pagesPath: string, options?: { port?: number }) {
		this.pagesPath = path.join(process.cwd(), pagesPath)

		this.router = new Bun.FileSystemRouter({
			style: "nextjs",
			dir: pagesPath,
		})

		this.port ??= options?.port
	}

	async listen() {
		const clients = new Set<ReadableStreamDefaultController>()

		Bun.serve({
			port: this.port,

			fetch: async request => {
				const url = new URL(request.url)
				if (url.pathname === EVENT_PATH) {
					return createStream(request, clients)
				}

				const route = this.router.match(request.url)
				return createHtml(route)
			},
		})

		const watcher = watch(this.pagesPath, { recursive: true })
		for await (const _ of watcher) {
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

async function createHtml(route: MatchedRoute | null) {
	if (!route) {
		throw new Error("TODO not found")
	}

	const html = await renderWith(route.filePath, {
		...route.params,
	})

	const response = new Response(html, {
		headers: {
			"Content-Type": "text/html",
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
