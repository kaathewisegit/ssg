import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"
import tailwindcss from "@tailwindcss/postcss"
import postcss from "postcss"

import config from "./config.js"

async function run() {
	const css = await fs.readFile("style.css", "utf8")
	const result = postcss([tailwindcss]).process(css, {
		from: "style.css",
		to: path.join(config.gen_assets, "style.css"),
	})
	await result

	fs.writeFile(path.join(config.gen_assets, "style.css"), result.css)
}

await config.init()
await run()

process.on("message", async message => {
	if (message === "update") {
		await run()
		console.log("TailwindCSS updated")
	}
})
