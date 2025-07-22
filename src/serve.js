import { promises as fs } from "node:fs"
import * as http from "node:http"
import * as path from "node:path"

import config from "./config.js"
import { fileExists } from "./util.js"

const MIME_TYPES = {
	"": "text/html",
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

function mimeType(filePath) {
	return MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
}

async function handle(request, result) {
	let filePath = path.join(config.tree, request.url)

	if (!(await fileExists(filePath))) {
		result.writeHead(404)
		result.end("File not found")
		return
	}

	const stat = await fs.stat(filePath)
	if (stat.isDirectory()) {
		filePath = path.join(filePath, "index.html")
	}

	if (!(await fileExists(filePath))) {
		result.writeHead(404)
		result.end(`index.html not found in directory ${request.url}`)
		return
	}

	const content = await fs.readFile(filePath)
	result.writeHead(200, { "Content-Type": mimeType(filePath) })
	result.end(content, "utf-8")
}

const server = http.createServer(async (request, result) => {
	try {
		handle(request, result)
	} catch (error) {
		result.writeHead(500)
		result.end(`Server error: ${error.code}`)
	}
})

await config.init()
await fs.mkdir(config.tree, { recursive: true })
process.chdir(config.tree)
server.listen(config.port, () => {
	console.log(`Server running at http://localhost:${config.port}/`)
})
