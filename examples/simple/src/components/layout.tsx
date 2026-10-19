export function Head(props: { title: string }) {
	return (
		<>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width" />
			<link rel="stylesheet" href="/style.css" />
			<title>{props.title} | simple example</title>
		</>
	)
}

export function Layout(props: { children: unknown }) {
	return (
		<>
			<header>
				<a href="/">Home</a> | <a href="/about">About</a>
			</header>
			<hr />
			{props.children}
		</>
	)
}
