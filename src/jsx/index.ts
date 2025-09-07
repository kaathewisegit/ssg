export const Fragment = Symbol("Fragment")

type Children = Promise<string> | Promise<string>[]

export interface Props {
	children?: Children
}

// biome-ignore lint/complexity/noBannedTypes: TODO type Function
export type Element = string | typeof Fragment | Function

function propsToAttrs(props: Props) {
	let out = ""
	for (const [key, value] of Object.entries(props)) {
		if (key === "children") {
			continue
		}
		out += `${key}=${String(value)}`
	}
	return out
}

async function fragmentToString(children: Children) {
	if (Array.isArray(children)) {
		let out = ""
		for await (const element of children) {
			out += element
		}
		return out
	} else {
		return children
	}
}

export async function compile(element: Element, props: Props): Promise<string> {
	if (typeof element === "function") {
		return element(props)
	} else if (typeof element === "symbol") {
		if (props.children) {
			return fragmentToString(props.children)
		} else {
			return ""
		}
	}

	if (props.children) {
		let out = `<${element} ${propsToAttrs(props)}>`

		if (Array.isArray(props.children)) {
			for await (const element of props.children) {
				out += element
			}
		} else {
			out += await props.children
		}

		out += `</${element}>`
		return out
	} else {
		return `<${element} ${propsToAttrs(props)}/>`
	}
}
