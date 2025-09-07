import { watch } from "node:fs/promises"
import * as path from "node:path"
import { reload, withHtmlLiveReload } from "bun-html-live-reload"
import { renderWith } from "./loader"

export class Server {
	pagesPath: string
	router: Bun.FileSystemRouter
	port?: number = 3001

	constructor(pagesPath: string, options: { port?: number }) {
		this.pagesPath = path.join(process.cwd(), pagesPath)

		this.router = new Bun.FileSystemRouter({
			style: "nextjs",
			dir: pagesPath,
		})

		this.port = options.port
	}

	async listen() {
		Bun.serve({
			port: this.port,

			fetch: withHtmlLiveReload(async request => {
				const m = this.router.match(request.url)
				if (!m) {
					throw new Error("TODO not found")
				}
				const html = await renderWith(m.filePath, {
					...m.params,
				})

				return new Response(html, {
					headers: {
						"Content-Type": "text/html",
					},
				})
			}),
		})

		const watcher = watch(this.pagesPath)
		for await (const _ of watcher) {
			reload()
		}
	}
}
