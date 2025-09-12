import * as path from "node:path"

const OUTPUT_DIR = "dist/"
const DEFAULT_PORT = 3001

export type Config = {
	pagesDir: string
	sourceDir: string
	assetDir?: string
	outputDir: string
	port: number
}

export function defineConfig(options: {
	pagesDir: string
	sourceDir: string
	assetDir?: string
	outputDir?: string
	port?: number
}) {
	const config = {
		pagesDir: path.resolve(options.pagesDir),
		sourceDir: path.resolve(options.sourceDir),
		outputDir: path.resolve(options.outputDir ?? OUTPUT_DIR),
		port: options.port ?? DEFAULT_PORT,
	} as Config

	if (options.assetDir) {
		config.assetDir = path.resolve(options.assetDir)
	}

	return config
}
