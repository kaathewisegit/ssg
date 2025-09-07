import type { BunPlugin, OnLoadArgs, OnLoadResult } from "bun"
import postcss from "postcss"

export function postcssPlugin(config: {
	plugins?: postcss.Plugin[]
}): BunPlugin {
	return {
		name: "bun-postcss",

		async setup(build) {
			const processor = postcss(config?.plugins ?? [])

			async function apply(
				args: OnLoadArgs,
			): Promise<OnLoadResult> {
				const raw = await Bun.file(args.path).text()

				const result = await processor.process(raw, {
					from: args.path,
				})
				const css = result.css

				return {
					exports: { default: css },
					loader: "object",
				}
			}

			build.onLoad({ filter: /\.css$/ }, apply)
		},
	}
}
