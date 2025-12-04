#!/usr/bin/env bun

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { build, type Config, serve } from "./index.ts"

const CONFIG_PATH = "ssg.config.ts"
const HELP = `Usage: ssg <command>

Commands:
    build:              build the website
    dev:                start a hot-reloading development server
`

const args = process.argv.slice(2)

const configPath = path.resolve(CONFIG_PATH)
if (!(await fs.exists(configPath))) {
	console.warn("Configuration file not found")
	process.exit(10)
}

const configModule = await import(configPath)
const config = configModule.default as Config

switch (args[0]) {
	case "build": {
		await build(config)
		break
	}
	case "dev": {
		await serve(config)
		break
	}
	case undefined: {
		console.log(HELP)
		break
	}
	default: {
		console.log(
			`The command must be either 'build' or 'dev', got ${args[0]}`,
		)
		process.exit(11)
	}
}
