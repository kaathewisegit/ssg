import { watch } from "node:fs/promises"
import * as path from "node:path"
import { reload, withHtmlLiveReload } from "bun-html-live-reload"
import configFactory from "./config"

const config = await configFactory()
const pagesPath = path.join(process.cwd(), config.pages)

function clearCache(path: string) {
	delete import.meta.require.cache[path]
}

export async function serve() {
	const router = new Bun.FileSystemRouter({
		style: "nextjs",
		dir: pagesPath,
		origin: "https://kaathewise.net",
	})

	const server = Bun.serve({
		port: 3001,

		fetch: withHtmlLiveReload(async request => {
			const m = router.match(request.url)
			if (!m) {
				return new Response("Not found", {
					status: 404,
				})
			}

			clearCache(m.filePath)

			const mod = await import(m.filePath)
			const content = await mod.default()
			return new Response(content, {
				headers: { "Content-Type": "text/html" },
			})
		}),
	})

	return server
}

serve()

const watcher = watch(pagesPath)
for await (const _ of watcher) {
	reload()
}
