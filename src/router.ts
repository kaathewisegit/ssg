import path from "node:path"
import { walk } from "./utils.ts"

export type Match = {
	filePath: string
	params: Params
}

export type Params = Record<string, string | string[]>

export class Router {
	#root: string
	#paths: Path[]

	constructor(root: string, paths: Path[]) {
		this.#root = root
		this.#paths = paths
	}

	static async new(dir: string): Promise<Router> {
		const paths: Path[] = []

		for await (const pagePath of walk(dir)) {
			const rel = path.relative(dir, pagePath)
			paths.push(toPath(rel))
		}

		return new Router(dir, paths)
	}

	match(pathname: string): Match | null {
		for (const pagePath of this.#paths) {
			const match = matchPath(pagePath, pathname)
			if (match) {
				match.filePath = path.join(
					this.#root,
					match.filePath,
				)
				return match
			}
		}

		return null
	}
}

type Path = {
	filePath: string
	fragments: Fragment[]
}

function toPath(pagePath: string): Path {
	return {
		filePath: pagePath,
		fragments: toFragments(pagePath),
	}
}

function matchPath(pagePath: Path, pathname: string): Match | null {
	const params: Params = {}
	const parts = pathname.split("/").slice(1)

	for (const [i, fragment] of pagePath.fragments.entries()) {
		const part = parts[i]
		if (!part) {
			if (fragment.value === "index") {
				break
			} else {
				return null
			}
		}

		switch (fragment.kind) {
			case "literal": {
				if (fragment.value !== part) {
					return null
				}
				break
			}
			case "segment": {
				params[fragment.value] = part
				break
			}
			case "repeat": {
				params[fragment.value] = parts.slice(i)
				break
			}
		}
	}

	return {
		filePath: pagePath.filePath,
		params,
	}
}

type Fragment = {
	kind: "literal" | "segment" | "repeat"
	value: string
}

function toFragments(pagePath: string): Fragment[] {
	const barePath = pagePath.replace(/\.tsx?/, "")
	const pieces = barePath.split("/")
	const out: Fragment[] = []

	for (const piece of pieces) {
		if (piece.startsWith(":")) {
			out.push({ kind: "segment", value: piece.slice(1) })
		} else if (piece.startsWith("*")) {
			out.push({ kind: "repeat", value: piece.slice(1) })
		} else {
			out.push({ kind: "literal", value: piece })
		}
	}

	return out
}
