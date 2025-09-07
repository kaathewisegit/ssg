import { compile, type Element, type Props } from "."

export { Fragment } from "."

export async function jsxDEV(
	element: Element,
	props: Props,
	_0: undefined,
	severalChildren: boolean,
	_1: undefined,
	_2: undefined,
): Promise<string> {
	return compile(element, props, severalChildren)
}
