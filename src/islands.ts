import * as esbuild from "esbuild"

export async function makeIsland(code: string, id: string): Promise<string> {
	const result = await esbuild.build({
		stdin: {
			contents: code,
			resolveDir: process.cwd(),
			sourcefile: "island.js",
		},
		bundle: true,
		write: false,
		format: "esm",
	})

	const script = result.outputFiles[0]?.text
	console.log(script)

	return `<div id="${id}"><srcipt type="module">${script}</script><div id="${id}-mount"></div></div>`
}
