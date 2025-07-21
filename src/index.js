#!/usr/bin/env node

import config from "./config.js"
import Proc from "./proc.js"
import * as render from "./render.js"
import * as tailwind from "./tailwind.js"
import * as vite from "./vite.js"

await config.init()

const command = process.argv[2] ?? "build"

switch (command) {
	case "build":
		await vite.run()
		await tailwind.run()
		await render.updateAll()
		break
	case "watch": {
		Proc.init()
		const _vite = Proc.launch("vite.js")
		const _tailwind = Proc.launch("tailwind.js")
		const _pages = Proc.launch("render.js")
		const _serve = Proc.launch("serve.js")
	}
}
