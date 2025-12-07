#!/usr/bin/env node

import console from "node:console"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import process from "node:process"
import { build, type Config, serve } from "./index.ts"

const CONFIG_PATH = "ssg.config.ts"
const HELP = `Usage: ssg <command>

Commands:
    build:              build the website
    dev:                start a hot-reloading development server
`

const args = process.argv.slice(2)

const configPath = path.resolve(CONFIG_PATH)
try {
	fs.access(configPath)
} catch {
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
