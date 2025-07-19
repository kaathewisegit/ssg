import { promises as fs } from "node:fs"
import * as http from "node:http"
import * as path from "node:path"
import config from "./config.js"

await config.init()

const server = http.createServer(async (request, result) => {
	const filePath = path.join(
		config.tree,
		request.url === "/" ? "index.html" : request.url,
	)

	const extname = path.extname(filePath)
	const mimeTypes = {
		".html": "text/html",
		".js": "text/javascript",
		".css": "text/css",
		".json": "application/json",
		".png": "image/png",
		".jpg": "image/jpg",
		".gif": "image/gif",
		".svg": "image/svg+xml",
		".wav": "audio/wav",
		".mp4": "video/mp4",
		".wasm": "application/wasm",
	}
	const contentType = mimeTypes[extname] || "application/octet-stream"

	try {
		const content = await fs.readFile(filePath)
		result.writeHead(200, { "Content-Type": contentType })
		result.end(content, "utf-8")
	} catch (error) {
		result.writeHead(500)
		result.end(`Server Error: ${error.code}\n`)
	}
})

server.listen(config.port, () => {
	console.log(`Server running at http://localhost:${config.port}/`)
})
