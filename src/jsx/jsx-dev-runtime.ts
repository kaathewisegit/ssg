import { compile, type Element, type Props } from "."

export { Fragment } from "."

export async function jsxDEV(
	element: Element,
	props: Props,
	_0: undefined,
	_1: boolean,
	_2: undefined,
	_3: undefined,
): Promise<string> {
	return compile(element, props)
}
