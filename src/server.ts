import * as fs from "node:fs/promises"
import { watch } from "node:fs/promises"
import http from "node:http"
import * as path from "node:path"
import url from "node:url"
import type { Config } from "./config.ts"
import { render } from "./render.ts"
import { type Match, Router } from "./router.ts"

const EVENT_PATH = "/__ssg_dev_sse"

export async function serve(config: Config): Promise<void> {
	const clients = new Set<http.ServerResponse>()

	const router = await Router.new(config.pagesDir)

	const server = http.createServer(async (request, response) => {
		const rUrl = new url.URL(request.url ?? "/", "http://localhost")

		if (rUrl.pathname === EVENT_PATH) {
			createStream(response, clients)
			return
		}

		const route = router.match(rUrl.pathname)
		if (route) {
			await serveHtml(response, route, config.pagesDir)
			return
		}

		if (await fetchStaticFile(response, rUrl, config.assetDir)) {
			return
		}

		console.warn(`Path '${rUrl.pathname}' not found`)
		response.writeHead(404)
		response.end("Page or file not found")
	})
	server.listen(config.port)
	console.log(`Listening on :${config.port}`)

	const watcher = watch(config.sourceDir, { recursive: true })
	for await (const _ of watcher) {
		await router.reload()
		for (const client of clients) {
			client.write("data: RELOAD\n\n")
		}
	}
}

function createStream(
	response: http.ServerResponse,
	clients: Set<http.ServerResponse>,
) {
	response.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	})
	clients.add(response)

	response.on("close", () => {
		clients.delete(response)
		response.end()
	})
}

async function fetchStaticFile(
	response: http.ServerResponse,
	url: url.URL,
	assetDir?: string,
): Promise<boolean> {
	if (!assetDir) {
		return false
	}

	let assetPath = path.join(assetDir, url.pathname.slice(1))
	assetPath = path.resolve(assetPath)
	if (!assetPath.startsWith(assetDir)) {
		response.writeHead(403)
		response.end(
			"Tried to get a file outside of the asset directory",
		)
		return true
	}

	try {
		const contents = await fs.readFile(assetPath)
		response.writeHead(200)
		response.end(contents)
		return true
	} catch {
		// the file doesn't exist
		return false
	}
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

async function serveHtml(
	response: http.ServerResponse,
	route: Match,
	pagesDir: string,
): Promise<void> {
	const page = await render(route.filePath, pagesDir, route.params)
	if (page.contentType === "text/html" || !page.contentType) {
		page.src += RELOAD_SCRIPT
	}
	response.writeHead(200, {
		"Content-Type": page.contentType ?? "text/html",
	})

	response.end(page.src)
}
