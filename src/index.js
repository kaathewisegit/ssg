import { fork } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"

import Proc from "./proc.js"

import config from "./config.js"
await config.init()

const vite = Proc.launch("vite.js")
const tailwind = Proc.launch("tailwind.js")
const pages = Proc.launch("render.js")
