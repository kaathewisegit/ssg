import { build } from "rolldown"

export type Props = Record<string, string | string[]>

export type ArbitraryModule = {
	getStaticParams?(): Props[]
	getContentType?(): string
	default?:
		| ((props: Props) => string)
		| ((props: Props) => Promise<string>)
}

export async function load(modulePath: string): Promise<string> {
	const result = await build({
		input: modulePath,
		write: false,
	})
	const output = result.output
	const file = output[0]
	return file.code
}

export async function dynImportString(code: string): Promise<ArbitraryModule> {
	const encoded = Buffer.from(code).toString("base64")
	return await import(`data:text/javascript;base64,${encoded}`)
}
