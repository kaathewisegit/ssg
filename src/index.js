#!/usr/bin/env node

import fs from "node:fs/promises"
import * as assets from "./assets.js"
import config from "./config.js"
import Proc from "./proc.js"
import * as render from "./render.js"
import * as tailwind from "./tailwind.js"
import * as vite from "./vite.js"

await config.init()
await fs.rm(config.target, { recursive: true, force: true })

const command = process.argv[2] ?? "build"

switch (command) {
	case "build":
		await vite.run()
		await tailwind.run()
		await render.updateAll()
		await assets.copyAll()
		break
	case "watch": {
		Proc.init()
		const _vite = Proc.launch("vite.js")
		const _tailwind = Proc.launch("tailwind.js")
		const _pages = Proc.launch("render.js")
		const _serve = Proc.launch("serve.js")
		const _assets = Proc.launch("assets.js")
	}
}
