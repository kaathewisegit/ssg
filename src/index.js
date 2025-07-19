import config from "./config.js"
import Proc from "./proc.js"

await config.init()

const _vite = Proc.launch("vite.js")
const _tailwind = Proc.launch("tailwind.js")
const _pages = Proc.launch("render.js")
const _serve = Proc.launch("serve.js")
