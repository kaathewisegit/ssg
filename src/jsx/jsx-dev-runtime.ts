export const Fragment = Symbol("Fragment")

interface Props {
	children?: Promise<string> | Promise<string>[]
}

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

// biome-ignore lint/suspicious/noExplicitAny: TODO
async function fragmentToString(children: any, severalChildren: boolean) {
	if (severalChildren) {
		let out = ""
		for await (const element of children) {
			out += element
		}
		return out
	} else {
		return children
	}
}

export async function jsxDEV(
	// biome-ignore lint/complexity/noBannedTypes: TODO type Function
	element: string | typeof Fragment | Function,
	props: Props,
	_0: undefined,
	severalChildren: boolean,
	_1: undefined,
	_2: undefined,
): Promise<string> {
	if (typeof element === "function") {
		return element(props)
	} else if (typeof element === "symbol") {
		return fragmentToString(props.children, severalChildren)
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
