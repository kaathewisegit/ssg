import { defineConfig } from "vite"
import { entrypoints, ssgVitePlugin } from "../../src/index.js"

export default defineConfig({
	build: {
		rollupOptions: {
			// input: ["pages/index.html", "pages/top-level.dj"],
		},
	},
	plugins: [ssgVitePlugin()],
})
