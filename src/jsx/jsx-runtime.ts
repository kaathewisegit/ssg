import { compile, type Element, type Props } from "."

export { Fragment } from "."

export async function jsx(element: Element, props: Props): Promise<string> {
	return compile(element, props)
}

export async function jsxs(element: Element, props: Props): Promise<string> {
	return compile(element, props)
}

export namespace JSX {
	export interface IntrinsicElements {
		// biome-ignore lint/suspicious/noExplicitAny: TODO list all
		[elemName: string]: any
	}
}
