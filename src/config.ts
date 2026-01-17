import * as path from "node:path"

const OUTPUT_DIR = "dist/"
const DEFAULT_PORT = 3001

export type Config = {
	sourceDir: string
	routesDir: string
	assetDir?: string
	outputDir: string
	port: number
}

export function defineConfig(options: {
	sourceDir: string
	routesDir?: string
	assetDir?: string
	outputDir?: string
	port?: number
}): Config {
	const config = {
		sourceDir: path.resolve(options.sourceDir),
		routesDir: path.resolve(
			options.routesDir ??
				path.join(options.sourceDir, "routes/"),
		),
		outputDir: path.resolve(options.outputDir ?? OUTPUT_DIR),
		port: options.port ?? DEFAULT_PORT,
	} as Config

	if (options.assetDir) {
		config.assetDir = path.resolve(options.assetDir)
	}

	return config
}
