export function append(text) {
	const p = document.createElement("p")
	p.textContent = text
	document.body.appendChild(p)
}
