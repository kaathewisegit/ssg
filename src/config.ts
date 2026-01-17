import * as path from "node:path"

const OUTPUT_DIR = "dist/"
const DEFAULT_PORT = 3001

export type ConfigOptions = {
	sourceDir: string
	routesDir?: string
	assetDir?: string
	outputDir?: string
	port?: number

	loaders?: Loader[]
}

export class Config {
	sourceDir: string
	routesDir: string
	assetDir?: string
	outputDir: string
	port: number

	loaders: Loader[]

	constructor(options: ConfigOptions) {
		this.sourceDir = path.resolve(options.sourceDir)
		this.routesDir = path.resolve(
			options.routesDir ??
				path.join(options.sourceDir, "routes/"),
		)
		this.outputDir = path.resolve(options.outputDir ?? OUTPUT_DIR)
		this.port = options.port ?? DEFAULT_PORT

		if (options.assetDir) {
			this.assetDir = path.resolve(options.assetDir)
		}

		this.loaders = options.loaders ?? []
	}

	getLoader(modulePath: string): Loader | null {
		for (const loader of this.loaders) {
			if (loader.matcher.test(modulePath)) {
				return loader
			}
		}
		return null
	}
}

export type Loader = {
	matcher: RegExp
}

export function defineConfig(options: ConfigOptions): Config {
	return new Config(options)
}
