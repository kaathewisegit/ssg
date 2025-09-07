import { compile, type Element, type Props } from "."

export { Fragment } from "."

export async function jsx(element: Element, props: Props): Promise<string> {
	return compile(element, props, false)
}

export async function jsxs(element: Element, props: Props): Promise<string> {
	return compile(element, props, true)
}
