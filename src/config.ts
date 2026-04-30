import * as fs from "node:fs"
import * as path from "node:path"

const OUTPUT_DIR = "dist/"
const DEFAULT_PORT = 3001

export type ConfigOptions = {
	routesDir?: string
	assetDir?: string
	outputDir?: string
	port?: number

	loaders?: Loader[]
}

export class Config {
	routesDir: string
	assetDir?: string
	outputDir: string
	port: number

	loaders: Loader[]

	constructor(options: ConfigOptions) {
		this.routesDir = path.resolve(options.routesDir ?? "src/routes/")
		this.outputDir = path.resolve(options.outputDir ?? OUTPUT_DIR)
		this.port = options.port ?? DEFAULT_PORT

		if (options.assetDir) {
			this.assetDir = path.resolve(options.assetDir)
		}

		fs.mkdirSync(this.scratchDir, { recursive: true })

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

	get scratchDir(): string {
		return path.join(this.outputDir, "scratch")
	}
}

export type Loader = {
	matcher: RegExp
}

export function defineConfig(options: ConfigOptions): Config {
	return new Config(options)
}
