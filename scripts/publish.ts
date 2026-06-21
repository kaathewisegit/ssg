import fs from "node:fs/promises"
import { createRequire } from "node:module"
import { $, quote } from "zx"

$.quote = quote
$.verbose = true

const require = createRequire(import.meta.url)
const { version } = require("../package.json")

const tag = version.includes("-") ? "next" : "latest"

await fs.rm("dist", { recursive: true, force: true })
await $`npm run check`
await $`npm run build`
await $`npm publish --tag=${tag}`
