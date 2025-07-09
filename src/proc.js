// Main process behavior handling

import { fork } from "node:child_process"
import path from "node:path"
import readline from "node:readline"

import { dirname } from "./util.js"

function is_shutdown_key(key) {
	if (!key) {
		return false
	}

	return key.name.toLowerCase() === "q" || (key.name === "c" && key.ctrl)
}

const Proc = {
	children: [],

	init() {
		readline.emitKeypressEvents(process.stdin)
		process.stdin.setRawMode(true)

		process.stdin.on("keypress", (chunk, key) => {
			if (is_shutdown_key(key)) {
				this.shutdown()
			}
		})

		process.stdin.on("data", key => {
			if (key === "q" || key === "Q") {
				this.shutdown()
			}
		})

		process.on("SIGINT", () => this.shutdown())
	},

	launch(name) {
		const location = path.join(dirname(), name)
		const child = fork(location)
		this.children.push(child)
		return child
	},

	shutdown() {
		for (const child of this.children) {
			child.kill()
		}
		process.exit()
	},
}

Proc.init()

export default Proc
